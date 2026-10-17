// experiments/e_q14_adversarial_probes.mjs — E-Q14: the adversarial probe
// family (registration pre_registration_e_q14.json, ORCH-3, committed
// PRE-RUN at 8d4dff9). Three families against the wormhole table:
//   A — high-density Abstain load (phi sweep)
//   B — resonance pollution (slot hijacking with provenance recovery)
//   C — cascade under seeded tau-preserving noise injectors
// Floors A1/A2, B1/B2/B3, C1/C2, F0 — see the registration (the canon).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, kernelReport, setCell, WormholeTable } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, plantTwinPairs, plantWeather, seedFnFrom, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });
const CHAIN = join(RECEIPTS, 'e_q14_chain.jsonl');
const W = 64, H = 64, N = W * H;
const SIGMA_DEFAULT = 'kernel log2(3)';

const { stone, stonePath } = await linkStone();
const KMOD = (await loadKernel()).kernel;
const { kernelKind } = await loadKernel();
const SIGMA = KMOD.DEFAULT_SIGMA;
console.log(`[e-q14] kernel=${kernelKind} stone=${stonePath}`);
const preRegSha = fileSha256(join(HERE, 'pre_registration_e_q14.json'));

const packB = (tau, d) => ((tau & 3) << 6) | (d & 63);

// Instrumented table: read() logs every live read's occupant (family B
// provenance). The write path is untouched; qthe.mjs is untouched.
function makeInstrumentedTable() {
  const t = new WormholeTable(SIGMA);
  const readsLog = [];
  const origRead = t.read.bind(t);
  t.read = (slot) => { const r = origRead(slot); readsLog.push({ slot, hit: r ? { x: r.x, y: r.y, resonance: r.resonance } : null }); return r; };
  return { table: t, readsLog };
}

// Provenance recovery: events fire immediately after the read that caused
// them, in row-major order — sequential slot+resonance matching.
function recoverProvenance(events, readsLog) {
  const used = new Array(readsLog.length).fill(false);
  const out = [];
  for (const ev of events) {
    let src = null;
    for (let i = 0; i < readsLog.length; i++) {
      if (used[i]) continue;
      const rl = readsLog[i];
      if (rl.slot === ev.slot && rl.hit && rl.hit.resonance === ev.resonance && (rl.hit.x !== ev.x || rl.hit.y !== ev.y)) { src = rl.hit; used[i] = true; break; }
    }
    out.push({ ev, occupant: src });
  }
  return out;
}

// ═══════════════════════════════ FAMILY A — density ═══════════════════════
function runDensity(seed, phi) {
  const rng = mulberry32(seed);
  const seedFn = (x, y, i) => (rng() < phi ? packB(3, 8 + Math.floor(rng() * 48)) : 0);
  let sub = makeSubstrate(W, H, seedFn);
  const CP = [0, 8, 16, 32, 64];
  const hashes = [planeHash(sub, 0, bytePlane)];
  const abstains0 = Array.from(sub).filter((c) => (c >> 6) === 3).length;
  const perTick = [];
  for (let t = 1; t <= 64; t++) {
    sub = tick(sub, { wormholes: true });
    const ev = sub.lastEvents;
    const firers = new Set(ev.map((e) => e.y * W + e.x));
    const occ = sub.__wormholes ? sub.__wormholes.occupiedCount() : 0;
    perTick.push({ t, firings: ev.length, firers: firers.size, occupancy: occ });
    if (CP.includes(t)) hashes.push(planeHash(sub, t, bytePlane));
  }
  return { hashes, abstains0, perTick };
}

const A = [];
for (const phi of [0.25, 0.5, 0.75, 1.0]) {
  for (let s = 0; s < 5; s++) {
    const seed = 88001 + s;
    const r1 = runDensity(seed, phi), r2 = runDensity(seed, phi);
    const detOk = JSON.stringify(r1.hashes) === JSON.stringify(r2.hashes);
    const med = (arr) => { const a = [...arr].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
    const firersRatio = med(r1.perTick.map((p) => p.firers / r1.abstains0));
    A.push({ phi, seed, detOk, abstains: r1.abstains0, firersRatio, perTick: r1.perTick, hashes: r1.hashes,
      occupancyCapOk: r1.perTick.every((p) => p.occupancy <= 64) });
    console.log(`[e-q14.A] phi=${phi} seed=${seed} abstains=${r1.abstains0} firersRatio=${firersRatio.toFixed(4)} det=${detOk} capOk=${A[A.length - 1].occupancyCapOk}`);
  }
}
const A1 = A.every((a) => a.occupancyCapOk);
const A2phi = (phi) => A.filter((a) => a.phi === phi);
const A2median = (phi) => { const rs = A2phi(phi).map((a) => a.firersRatio).sort((x, y) => x - y); return rs[Math.floor(rs.length / 2)]; };
const A2 = A2median(0.5) >= 0.6 && A2median(0.75) >= 0.6 && A2median(1.0) >= 0.6;
const A2starves = A2median(0.5) < 0.1 && A2median(0.75) < 0.1 && A2median(1.0) < 0.1;

// ═════════════════════════ FAMILY B — resonance pollution ═════════════════
function runPollution(seed, nPoll) {
  const rng = mulberry32(seed);
  const pairs = plantTwinPairs(rng, 8, W, H, {});
  const weather = plantWeather(rng, pairs, W, H, {});
  // polluters: N_poll Abstain cells >= 2 toroidal-Chebyshev from every pair
  // member, each carrying one of the pair d values (seeded assignment)
  const forbidden = [];
  for (const p of pairs) { forbidden.push(p.a, p.b); }
  const ds = pairs.map((p) => p.d);
  const polluters = [];
  let guard = 0;
  while (polluters.length < nPoll && guard++ < 200000) {
    const x = Math.floor(rng() * W), y = Math.floor(rng() * H);
    if (forbidden.some((f) => { const dx = Math.abs(f.x - x), dy = Math.abs(f.y - y); return Math.max(Math.min(dx, W - dx), Math.min(dy, H - dy)) < 2; })) continue;
    if (polluters.some((f) => f.x === x && f.y === y)) continue;
    polluters.push({ x, y, d: ds[Math.floor(rng() * ds.length)] });
  }
  if (polluters.length < nPoll) throw new Error('polluter placement budget exhausted — LOUD');

  const map = new Map();
  for (const p of pairs) { map.set(p.a.y * 4096 + p.a.x, packB(3, p.d)); map.set(p.b.y * 4096 + p.b.x, packB(3, p.d)); }
  for (const c of weather) map.set(c.y * 4096 + c.x, c.byte);
  for (const c of polluters) map.set(c.y * 4096 + c.x, packB(3, c.d));
  const seedFn = (x, y) => map.get(y * 4096 + x) ?? 0;

  const partnerOf = new Map();
  for (const p of pairs) { partnerOf.set(p.a.y * W + p.a.x, p.b.y * W + p.b.x); partnerOf.set(p.b.y * W + p.b.x, p.a.y * W + p.a.x); }

  const { table, readsLog } = makeInstrumentedTable();
  let sub = makeSubstrate(W, H, seedFn);
  const CP = [0, 50, 100, 150, 200];
  const hashes = [planeHash(sub, 0, bytePlane)];
  const meter = new Float64Array(N);
  const firstExceed = new Map();
  let pairEvents = 0, pollutedEvents = 0, partnerEvents = 0;
  for (let t = 1; t <= 200; t++) {
    readsLog.length = 0;
    sub = tick(sub, { wormholes: true, table });
    const prov = recoverProvenance(sub.lastEvents, readsLog);
    for (const { ev, occupant } of prov) {
      const idx = ev.y * W + ev.x;
      if (!partnerOf.has(idx)) continue; // only pair-member events count
      meter[idx] += ev.term;
      if (!firstExceed.has(idx) && meter[idx] >= 8) firstExceed.set(idx, t);
      pairEvents++;
      if (occupant && partnerOf.get(idx) === occupant.y * W + occupant.x) partnerEvents++;
      else pollutedEvents++;
    }
    if (CP.includes(t)) hashes.push(planeHash(sub, t, bytePlane));
  }
  const pairDelivers = pairs.map((p) => {
    const ia = p.a.y * W + p.a.x, ib = p.b.y * W + p.b.x;
    const ta = firstExceed.has(ia) ? firstExceed.get(ia) : null;
    const tb = firstExceed.has(ib) ? firstExceed.get(ib) : null;
    return ta !== null && tb !== null ? Math.max(ta, tb) : null;
  });
  const delivered = pairDelivers.filter((t) => t !== null).length;
  return { hashes, delivered, pairDelivers, pairEvents, partnerEvents, pollutedEvents, polluters: polluters.length };
}

const B = [];
for (const nPoll of [0, 16, 64, 256]) {
  for (let i = 0; i < 10; i++) {
    const seed = 77001 + i;
    const r1 = runPollution(seed, nPoll), r2 = runPollution(seed, nPoll);
    const detOk = JSON.stringify(r1.hashes) === JSON.stringify(r2.hashes);
    const pf = r1.pairEvents > 0 ? r1.pollutedEvents / r1.pairEvents : null;
    B.push({ nPoll, seed, detOk, delivered: r1.delivered, pairDelivers: r1.pairDelivers.map(q),
      pairEvents: r1.pairEvents, partnerEvents: r1.partnerEvents, pollutedEvents: r1.pollutedEvents,
      pollutionFraction: pf === null ? null : q(pf) });
    console.log(`[e-q14.B] nPoll=${nPoll} seed=${seed} delivered=${r1.delivered}/8 events=${r1.pairEvents} partner=${r1.partnerEvents} polluted=${r1.pollutedEvents} det=${detOk}`);
  }
}
const bMed = (nPoll, f) => { const vs = B.filter((b) => b.nPoll === nPoll && b[f] !== null).map((b) => b[f]).sort((x, y) => x - y); return vs.length ? vs[Math.floor(vs.length / 2)] : null; };
const pfMed = (nPoll) => bMed(nPoll, 'pollutionFraction');
// PG6 (ORCH-2b) hardening: PARSE BEFORE COMPARING — pfMed returns q()-stringified
// floats and JS compares strings lexicographically. Benign at seal time only
// because the digit patterns happened to sort correctly (the e_q16 contention
// aggregate was NOT so lucky — see erratum.EQ16_contention_string_compare).
const pfN = (n) => parseFloat(pfMed(n) ?? 0);
const B1 = pfN(0) <= pfN(16) && pfN(16) <= pfN(64) && pfN(64) <= pfN(256);
const B2delivered = B.filter((b) => b.nPoll === 256).reduce((s, b) => s + b.delivered, 0);
const B2 = B.filter((b) => b.nPoll === 256).filter((b) => b.delivered === 8).length >= 8;
const B3 = B.filter((b) => b.nPoll === 0).every((b) => b.pollutedEvents === 0)
  && B.filter((b) => b.nPoll === 0).filter((b) => b.delivered === 8).length >= 9;

// ═══════════════════ FAMILY C — cascade under noise injectors ═════════════
function runCascade(seed, noise) {
  const rng = mulberry32(seed);
  // deterministic noise schedule (drawn only if noise): rounds at t=8..120,
  // 8 cells each, d +-1 (tau preserved)
  const schedule = noise ? [] : null;
  if (noise) for (let r = 0; r < 15; r++) {
    const round = [];
    for (let c = 0; c < 8; c++) round.push({ x: Math.floor(rng() * W), y: Math.floor(rng() * H), delta: rng() < 0.5 ? -1 : 1 });
    schedule.push(round);
  }
  const seedFn = (x, y) => {
    if (x === 32 && y === 32) return packB(2, 32); // center flip Attract->Repel
    return ((x + y) % 2 === 0) ? packB(1, 32) : packB(2, 32); // checkerboard
  };
  let sub = makeSubstrate(W, H, seedFn);
  const CP = [0, 8, 16, 32, 64];
  const hashes = [planeHash(sub, 0, bytePlane)];
  const injectionSites = [];
  for (let t = 1; t <= 128; t++) {
    sub = tick(sub, { wormholes: true });
    if (noise && t % 8 === 0 && t <= 120) {
      const round = schedule[t / 8 - 1];
      for (const inj of round) {
        const i = inj.y * W + inj.x;
        const tau = sub[i] >> 6, d = sub[i] & 63;
        const nd = Math.max(0, Math.min(63, d + inj.delta));
        if (setCell(sub, inj.x, inj.y, packB(tau, nd))) injectionSites.push({ x: inj.x, y: inj.y, t });
      }
    }
    if (CP.includes(t)) hashes.push(planeHash(sub, t, bytePlane));
  }
  return { hashes, injectionSites, finalPlane: Uint8Array.from(sub), sub };
}

function divergentCells(a, b) {
  const out = [];
  for (let i = 0; i < N; i++) if (a[i] !== b[i]) out.push({ x: i % W, y: Math.floor(i / W) });
  return out;
}
function chebRadiusFrom(sites, cells) {
  let maxR = 0;
  for (const c of cells) {
    let minD = Infinity;
    for (const s of sites) {
      const dx = Math.abs(s.x - c.x), dy = Math.abs(s.y - c.y);
      minD = Math.min(minD, Math.max(Math.min(dx, W - dx), Math.min(dy, H - dy)));
    }
    maxR = Math.max(maxR, minD);
  }
  return maxR;
}

const C = [];
for (let s = 0; s < 5; s++) {
  const seed = 99001 + s;
  const clean1 = runCascade(seed, false), clean2 = runCascade(seed, false);
  const noise1 = runCascade(seed, true), noise2 = runCascade(seed, true);
  const detOk = JSON.stringify(clean1.hashes) === JSON.stringify(clean2.hashes)
    && JSON.stringify(noise1.hashes) === JSON.stringify(noise2.hashes);
  // divergence: noise vs clean, same seed
  const divCells = divergentCells(noise1.finalPlane, clean1.finalPlane);
  const firstDivTick = (() => {
    for (let c = 0; c < clean1.hashes.length; c++) if (clean1.hashes[c] !== noise1.hashes[c]) return [0, 8, 16, 32, 64][c];
    return null;
  })();
  const radius = chebRadiusFrom(noise1.injectionSites, divCells);
  const regime = radius > 4 ? 'CASCADE' : 'DEAD-LOCAL';
  // clean arm regime: compare clean-with-flip vs a no-flip board (same seed)
  const noFlip = runCascade(seed, false).finalPlane; // same as clean (flip is in seedFn) — instead: no-flip baseline
  C.push({ seed, detOk, firstDivTick, divCount: divCells.length, radius, regime, injections: noise1.injectionSites.length });
  console.log(`[e-q14.C] seed=${seed} firstDiv=${firstDivTick} divCells=${divCells.length} radius=${radius} regime=${regime} det=${detOk}`);
}
const C1 = C.every((c) => c.firstDivTick !== null && c.firstDivTick <= 9);
const C2 = C.every((c) => c.regime === 'CASCADE') && C.every((c) => c.radius !== null);
const Cregimes = new Set(C.map((c) => c.regime));

// ═══════════════════════════════════ verdict ══════════════════════════════
const allDet = A.every((a) => a.detOk) && B.every((b) => b.detOk) && C.every((c) => c.detOk);
const F0 = allDet;
const verdict = `E-Q14 VERDICT: family A {A1 ${A1 ? 'pass' : 'FAIL(kernel-defect)'}, A2 live-read-load median firers ratio phi=0.5:${q(A2median(0.5))} phi=0.75:${q(A2median(0.75))} phi=1.0:${q(A2median(1.0))} -> ${A2 ? 'LOAD-HELD' : A2starves ? 'STARVES (crown-jewel null)' : 'MIDDLE (receipted)'}}; family B {pollution fractions medians 0:${q(pfMed(0))} 16:${q(pfMed(16))} 64:${q(pfMed(64))} 256:${q(pfMed(256))} monotone=${B1}, delivery at 256 = ${B2delivered}/80 pair-trials full-8, content-addressed ${B2 ? 'CONFIRMED' : 'FALSIFIED (provenance load-bearing — honest null)'}, zero-pollution clean=${B3}}; family C {regimes ${[...Cregimes].join('/')} 5 seeds, first-divergence ${C.map((c) => c.firstDivTick).join(',')} all <= 9 = ${C1}, regime-stable = ${C2}}; determinism ${F0 ? 'ALL byte-identical' : 'VOID'}`;

console.log(`\n[e-q14] ${verdict}`);

writeFileSync(join(OUT, 'e_q14_results.json'), JSON.stringify({
  experiment: 'E-Q14', claim: 'adversarial probe family (roadmap phase 3)', kernel: kernelReport(), stonePath, preRegSha,
  familyA: A.map((a) => ({ phi: a.phi, seed: a.seed, detOk: a.detOk, abstains: a.abstains, firersRatio: q(a.firersRatio), occupancyCapOk: a.occupancyCapOk, perTick: a.perTick })),
  familyB: B, familyC: C,
  aggregates: { A1, A2, A2starves, A2medians: { 0.25: q(A2median(0.25)), 0.5: q(A2median(0.5)), 0.75: q(A2median(0.75)), 1.0: q(A2median(1.0)) },
    B1, B2, B2delivered, B3, pfMed: { 0: q(pfMed(0)), 16: q(pfMed(16)), 64: q(pfMed(64)), 256: q(pfMed(256)) },
    C1, C2, regimes: [...Cregimes], F0, verdict },
}, null, 1));

const rows = [
  { kind: 'rules.EQ14', frozen_by: 'experiments/pre_registration_e_q14.json (ORCH-3, committed pre-run at 8d4dff9)', pre_reg_sha256: preRegSha,
    floors: 'A1 occupancy<=64; A2 firers ratio >= 0.60 at phi>=0.5 (STARVES null < 0.10); B1 pollution monotone; B2 delivery >= 8/10 at 256 polluters; B3 zero-pollution clean; C1 first-divergence <= 9; C2 regime stable; F0 determinism all arms' },
  { kind: 'run.config', experiment: 'E-Q14', kernel: kernelReport(), stone_linked: stonePath,
    families: 'A: 64x64 density sweep phi {0.25,0.5,0.75,1.0} x 5 seeds x T=64; B: E-Q1 twins + polluters {0,16,64,256} x 10 seeds x T=200, instrumented-table provenance; C: checkerboard + center flip + noise injectors (8 cells/8 ticks, tau preserved) x 5 seeds x T=128, clean vs noise' },
];
for (const a of A) rows.push({ kind: 'result.A', experiment: 'E-Q14', family: 'A', phi: a.phi, seed: a.seed, abstains: a.abstains, firersRatio: q(a.firersRatio), occupancyCapOk: a.occupancyCapOk, determinism: a.detOk, finalHash: a.hashes[a.hashes.length - 1] });
for (const b of B) rows.push({ kind: 'result.B', experiment: 'E-Q14', family: 'B', nPoll: b.nPoll, seed: b.seed, delivered: b.delivered, pairEvents: b.pairEvents, partnerEvents: b.partnerEvents, pollutedEvents: b.pollutedEvents, pollutionFraction: b.pollutionFraction, determinism: b.detOk });
for (const c of C) rows.push({ kind: 'result.C', experiment: 'E-Q14', family: 'C', seed: c.seed, firstDivTick: q(c.firstDivTick), divCount: c.divCount, radius: c.radius, regime: c.regime, determinism: c.detOk });
rows.push({ kind: 'verdict.EQ14', experiment: 'E-Q14', A1, A2, A2starves, B1, B2, B3, C1, C2, F0, verdict });

const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q14', claim: 'adversarial-probe-family' });
console.log(`[e-q14] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q14_tip.txt'), `${v.tip} links=${v.links}\n`);
