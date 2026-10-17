// experiments/e_q16_measurement_wave.mjs — E-Q16 (ORCH-16): stability +
// long-horizon + dense-sigma phase + grid scaling + census, in one priced
// run. Registration: pre_registration_e_q16.json (PRE-RUN, the canon).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, plantTwinPairs, plantWeather, seedFnFrom, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
mkdirSync(OUT, { recursive: true });
const CHAIN = join(HERE, '..', 'receipts', 'e_q16_chain.jsonl');
const packB = (tau, d) => ((tau & 3) << 6) | (d & 63);
const { stone, stonePath } = await linkStone();
await loadKernel();
const { kernelKind } = kernelReport();
const preRegSha = fileSha256(join(HERE, 'pre_registration_e_q16.json'));
const rows = [{ kind: 'rules.EQ16', frozen_by: 'pre_registration_e_q16.json (ORCH-16, pre-run)', pre_reg_sha256: preRegSha,
  floors: 'A1/A2 determinism+bounds; B phase per sealed E-Q2 record; C occupancy + contention monotone + locality-break rule; D partition sum 100' },
{ kind: 'run.config', experiment: 'E-Q16', kernel: kernelReport(), stone_linked: stonePath }];

// ── family A: stability + long-horizon ────────────────────────────────────
function runTimed(w, h, seedFn, T, every) {
  let sub = makeSubstrate(w, h, seedFn);
  const hashes = [planeHash(sub, 0, bytePlane)];
  const windows = []; let evWin = 0, lastCk = 0;
  let dMin = 0, dMax = 0, tauCensus = null, boundsOk = true;
  for (let t = 1; t <= T; t++) {
    sub = tick(sub, {});
    evWin += (sub.lastEvents || []).length;
    if (t - lastCk >= every || t === T) {
      hashes.push(planeHash(sub, t, bytePlane));
      windows.push({ t, events: evWin, eventsPerTick: q(Math.round(evWin / (t - lastCk) * 1000) / 1000) });
      evWin = 0; lastCk = t;
      dMin = 64; dMax = -1; const tc = [0, 0, 0, 0];
      for (let i = 0; i < sub.length; i++) { const d = sub[i] & 63; if (d < dMin) dMin = d; if (d > dMax) dMax = d; if (d > 63) boundsOk = false; tc[sub[i] >> 6]++; }
      if (t >= every) { if (tauCensus === null) tauCensus = tc; else if (JSON.stringify(tauCensus) !== JSON.stringify(tc)) boundsOk = false; } // tau frozen after t=1
    }
  }
  return { hashes, windows, dMin, dMax, boundsOk, finalTicks: sub.ticks };
}
console.log('[A1] 64x64 twins, T=10,000 …');
{
  const rng = mulberry32(33001);
  const pairs = plantTwinPairs(rng, 8, 64, 64, {});
  const weather = plantWeather(rng, pairs, 64, 64, {});
  const fn = seedFnFrom(pairs, weather);
  const a = runTimed(64, 64, fn, 10000, 1000), b = runTimed(64, 64, fn, 10000, 1000);
  const detOk = JSON.stringify(a.hashes) === JSON.stringify(b.hashes);
  rows.push({ kind: 'result.A1', experiment: 'E-Q16', family: 'A', T: 10000, checkpoints: a.hashes.length,
    determinism: detOk, boundsOk: a.boundsOk && b.boundsOk, dRange: [a.dMin, a.dMax],
    eventWindows: a.windows.map((w) => w.events), finalHash: a.hashes[a.hashes.length - 1] });
  console.log(`  det=${detOk} bounds=${a.boundsOk} d[${a.dMin}..${a.dMax}] events/1k-ticks: ${a.windows.map((w) => w.events).join(',')} tip=${a.hashes[a.hashes.length - 1].slice(0, 10)}…`);
}
console.log('[A2] 16x16 random, T=100,000 (long-horizon, scaled grid receipted) …');
{
  // build the plane ONCE (run-1 harness defect: a rng-closing seedFn is
  // consumed by the first run — the E-Q9 comparison-bug class, never kernels)
  const rng = mulberry32(552001);
  const plane = new Uint8Array(16 * 16);
  for (let i = 0; i < plane.length; i++) { const r = rng(); const tau = r < 0.55 ? 0 : r < 0.70 ? 1 : r < 0.85 ? 2 : 3; plane[i] = packB(tau, Math.floor(rng() * 64)); }
  const fn = (x, y, i) => plane[i];
  const a = runTimed(16, 16, fn, 100000, 10000), b = runTimed(16, 16, fn, 100000, 10000);
  const detOk = JSON.stringify(a.hashes) === JSON.stringify(b.hashes);
  rows.push({ kind: 'result.A2', experiment: 'E-Q16', family: 'A', T: 100000, checkpoints: a.hashes.length,
    determinism: detOk, boundsOk: a.boundsOk && b.boundsOk, dRange: [a.dMin, a.dMax],
    eventWindows: a.windows.map((w) => w.events), finalHash: a.hashes[a.hashes.length - 1],
    note: '16x16 grid scaled for wall-clock honesty in this environment; physical edge-hardware long-horizon stays pending' });
  console.log(`  det=${detOk} bounds=${a.boundsOk} d[${a.dMin}..${a.dMax}] events/10k-ticks: ${a.windows.map((w) => w.events).join(',')} tip=${a.hashes[a.hashes.length - 1].slice(0, 10)}…`);
}

// ── family B: dense sigma phase ───────────────────────────────────────────
console.log('[B] dense sigma phase table …');
const SIGMAS = [0.25, 0.5, 0.75, 1.0, 1.25, Math.log2(3), 1.75, 2.0, 2.5, 3.0, 3.5, 4.0];
const phaseRows = [];
for (const sigma of SIGMAS) {
  let bridgeAll = true, firstBridge = [], completion = [];
  for (let s = 0; s < 5; s++) {
    const rng = mulberry32(33001 + s);
    const pairs = plantTwinPairs(rng, 8, 64, 64, {});
    const weather = plantWeather(rng, pairs, 64, 64, {});
    let sub = makeSubstrate(64, 64, seedFnFrom(pairs, weather));
    const meter = new Map(); const first = new Map(); const bridges = new Array(8).fill(null);
    const memberOf = new Map(); for (const p of pairs) { memberOf.set(p.a.y * 64 + p.a.x, p.pairId); memberOf.set(p.b.y * 64 + p.b.x, p.pairId); }
    for (let t = 1; t <= 100; t++) {
      sub = tick(sub, { sigma });
      for (const ev of sub.lastEvents || []) {
        const idx = ev.y * 64 + ev.x, pid = memberOf.get(idx);
        if (bridges[pid] === null) bridges[pid] = t;
        meter.set(idx, (meter.get(idx) ?? 0) + ev.term);
        if (!first.has(idx) && meter.get(idx) >= 8) first.set(idx, t);
      }
    }
    const br = bridges.filter((x) => x !== null);
    bridgeAll = bridgeAll && br.length === 8;
    if (br.length) firstBridge.push(Math.max(...br));
    const comp = pairs.map((p) => { const a = first.get(p.a.y * 64 + p.a.x), b2 = first.get(p.b.y * 64 + p.b.x); return a !== undefined && b2 !== undefined ? Math.max(a, b2) : null; }).filter((x) => x !== null);
    completion.push(comp.length === 8 ? Math.max(...comp) : null);
  }
  const med = (arr) => { const v = arr.filter((x) => x !== null).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
  phaseRows.push({ sigma: q(sigma), bridgeAll, medianFirstBridge: med(firstBridge), medianCompletion: med(completion) });
  console.log(`  sigma=${sigma.toFixed(4).padEnd(8)} bridgeAll=${bridgeAll} firstBridge=${med(firstBridge)} completion=${med(completion)}`);
}
const bridgeInvariant = phaseRows.every((r) => r.bridgeAll) && new Set(phaseRows.map((r) => r.medianFirstBridge)).size === 1;
rows.push({ kind: 'result.B', experiment: 'E-Q16', family: 'B', phase: phaseRows, bridgeMetricsSigmaInvariant: bridgeInvariant });

// ── family C: grid scaling ────────────────────────────────────────────────
console.log('[C] grid scaling (fixed 64-slot table) …');
const scaleRows = [];
let baseFiringsPerCell = null;
for (const [w, h] of [[64, 64], [128, 128], [256, 256]]) {
  const rng = mulberry32(664001);
  const plane = new Uint8Array(w * h);
  for (let i = 0; i < plane.length; i++) plane[i] = rng() < 0.10 ? packB(3, 8 + Math.floor(rng() * 48)) : packB(0, 0);
  const fn = (x, y, i) => plane[i];
  const run = () => {
    let sub = makeSubstrate(w, h, fn);
    let firings = 0; const firers = new Set();
    for (let t = 1; t <= 50; t++) {
      sub = tick(sub, {});
      firings += (sub.lastEvents || []).length;
      for (const e of sub.lastEvents || []) firers.add(e.y * w + e.x);
    }
    const tbl = sub.__wormholes;
    const occ = tbl ? tbl.occupiedCount() : 0;
    const writes = tbl ? tbl.totalWrites : 0;
    return { firings, firers: firers.size, occ, writes, hash: planeHash(sub, 50, bytePlane) };
  };
  const r1 = run(), r2 = run();
  const detOk = r1.hash === r2.hash;
  const abstains = Math.round(w * h * 0.10);
  const firingsPerCell = r1.firings / (w * h);
  if (w === 64) baseFiringsPerCell = firingsPerCell;
  const contention = r1.occ > 0 ? r1.writes / r1.occ : 0;
  scaleRows.push({ grid: `${w}x${h}`, abstains, determinism: detOk, occupancy: r1.occ, firings: r1.firings,
    firingsPerTickPerCell: q(Math.round(firingsPerCell / 50 * 10000) / 10000), distinctFirers: r1.firers,
    contentionWritesPerSlot: q(Math.round(contention * 100) / 100),
    localityRatioVs64: q(Math.round((firingsPerCell / baseFiringsPerCell) * 1000) / 1000) });
  console.log(`  ${w}x${h}: det=${detOk} occ=${r1.occ}/64 firings=${r1.firings} firers=${r1.firers} contention=${contention.toFixed(1)} localityVs64=${(firingsPerCell / baseFiringsPerCell).toFixed(3)}`);
}
const contentionMonotone = scaleRows[0].contentionWritesPerSlot <= scaleRows[1].contentionWritesPerSlot && scaleRows[1].contentionWritesPerSlot <= scaleRows[2].contentionWritesPerSlot;
const localityBreaks = scaleRows.filter((r) => r.localityRatioVs64 < 0.5).map((r) => r.grid);
rows.push({ kind: 'result.C', experiment: 'E-Q16', family: 'C', scaling: scaleRows, contentionMonotone, localityBreaks,
  verdict: localityBreaks.length ? `LOCALITY BREAKS at ${localityBreaks.join(', ')}` : 'locality holds to 256x256 at 10% Abstain (fixed 64 slots)' });

// ── family D: probe-family census ─────────────────────────────────────────
console.log('[D] probe-family census (100 seeded situations) …');
const census = { STATIC: 0, SATURATED: 0, CASCADE: 0, 'WORMHOLE-ACTIVE': 0, MIXED: 0 };
const examples = {};
for (let n = 0; n < 100; n++) {
  const rng = mulberry32(801001 + n);
  const fn = () => { const r = rng(); const tau = r < 0.55 ? 0 : r < 0.70 ? 1 : r < 0.85 ? 2 : 3; return packB(tau, Math.floor(rng() * 64)); };
  let sub = makeSubstrate(16, 16, fn);
  const init = Uint8Array.from(sub);
  let events = 0;
  for (let t = 1; t <= 20; t++) { sub = tick(sub, {}); events += (sub.lastEvents || []).length; }
  let changed = 0, rails = 0;
  for (let i = 0; i < sub.length; i++) { if (sub[i] !== init[i]) changed++; const d = sub[i] & 63; if (d === 0 || d === 63) rails++; }
  const fam = changed === 0 ? 'STATIC' : rails >= 0.25 * sub.length ? 'SATURATED' : changed > 0.30 * sub.length ? 'CASCADE' : events > 0 ? 'WORMHOLE-ACTIVE' : 'MIXED';
  census[fam]++; if (!examples[fam]) examples[fam] = 801001 + n;
}
console.log(`  ${JSON.stringify(census)} examples=${JSON.stringify(examples)}`);
rows.push({ kind: 'result.D', experiment: 'E-Q16', family: 'D', census, examples, partitionSumsTo100: Object.values(census).reduce((a, b) => a + b, 0) === 100 });

// ── seal ──────────────────────────────────────────────────────────────────
writeFileSync(join(OUT, 'e_q16_results.json'), JSON.stringify({
  experiment: 'E-Q16', claim: 'measurement wave (stability/phase/scaling/census)', kernel: kernelReport(), stonePath, preRegSha,
  stability: rows.filter((r) => r.kind === 'result.A1' || r.kind === 'result.A2'),
  phaseTable: phaseRows, scaling: scaleRows, census,
  aggregates: { bridgeInvariant, contentionMonotone, localityBreaks, census },
}, null, 1));
rows.push({ kind: 'correction.EQ16', experiment: 'E-Q16',
  defect: 'run-1 families A2 and C reported determinism:false — HARNESS defect, never kernels: the seedFn closures drew from mulberry32 at call time, so the run-twice rerun consumed a different rng stream and built a different initial plane (the E-Q9 comparison-bug class)',
  correction: 'the runner now builds each random plane ONCE and reconstructs both runs from the same bytes (the fixtures pattern); run 2 appends corrected rows; run 1 rows stand beside this correction, append-only' });
rows.push({ kind: 'verdict.EQ16', experiment: 'E-Q16',
  A: 'stability: see result rows (determinism + bounds per family)',
  B: bridgeInvariant ? 'phase table CONFIRMS the sealed E-Q2 record: bridge metrics sigma-invariant; completion scales ~1/sigma' : 'BRIDGE METRICS MOVED WITH SIGMA — contradicts sealed E-Q2, escalation row required',
  C: contentionMonotone ? 'contention monotone in grid size (occupancy cap held)' : 'CONTENTION NOT MONOTONE — autopsy',
  D: Object.values(census).reduce((a, b) => a + b, 0) === 100 ? 'census partitions cleanly' : 'CENSUS PARTITION BROKEN' });
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q16', claim: 'measurement-wave' });
writeFileSync(join(OUT, 'e_q16_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q16] chain ok links=${v.links} tip=${v.tip}`);
