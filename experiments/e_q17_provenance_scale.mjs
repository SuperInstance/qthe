// experiments/e_q17_provenance_scale.mjs — E-Q17 (ORCH-R12 lane T3-b):
// provenance-correct wormhole at scale. hy4's r10 proposal priced against
// HIERARCHICAL-WORMHOLES' second-consumer trigger. E-Q16 sealed locality +
// contention at scale; E-Q17's new ground is PROVENANCE at scale — WHO
// delivered, not how much.
//
// Registration: experiments/pre_registration_e_q17.json (amended pre-run:
// EQ17-AM1 recovery-equivalence law, EQ17-AM2 results schema, EQ17-AM3
// K=8 E-Q14-verbatim planting after the LOUD weather-feasibility throw).
// Consult: situations/e_q17_design_attack.jsonl (Seed-2.0-mini, ATTACK-briefed,
// 6 attacks — 4 refuted, A5 -> AM1, A6 -> AM2; AS-SAID).
//
// DESIGN (frozen in the registration): grid ladder 64x64/128x128/256x256,
// fixed flat 64-slot table, the E-Q14 family-B twin-delivery task at matched
// geometry (K=8 pairs, d 8..15, minPairSep 24, minCrossSep 8, weather 2x
// Attract 40/41 + 1x Repel 30, theta_del=8, T=200, seeds 77001..77010).
// Arms per scale: clean (0 polluters) + density (E-Q14-matched 256/4096 area
// density -> 256/1024/4096 polluters) + fixed256 (256 polluters everywhere;
// coincident with density at 64x64 — receipted, run once under both labels).
// Metric: pf = pollutionFraction = pollutedEvents/pairEvents, E-Q14's own
// field and computation (occupant==partner -> partnerEvents, else polluted,
// null occupant counts polluted); provFrac = partnerEvents/pairEvents is its
// per-run complement, reported beside it (interpretation-proof record).
// Primary null H0: |pfMed(256x256,clean) - pfMed(64x64,clean)| <= 0.02.
// FIRE band (verbatim registration): pfMed(256) < pfMed(64) - 0.05 on clean
// or density. MIRROR band (pre-registered complement reading): pfMed(256) >
// pfMed(64) + 0.05 on clean or density = provenance DEGRADES at scale.
// Floors: delivery 100% per arm; pf calibration >= 0.90 at 64x64 clean
// (E-Q14 sealed 0.9431); occupancy cap <= 64; determinism F0 (run twice,
// byte-identical checkpoints [0,50,100,150,200]).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, kernelReport, WormholeTable } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, plantTwinPairs, plantWeather, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });
const CHAIN = join(RECEIPTS, 'e_q17_chain.jsonl');

const K = 8;                 // EQ17-AM3: E-Q14-verbatim pair count, constant across scales
const T = 200;               // E-Q14 family-B horizon
const THETA = 8;             // E-Q14 delivery threshold (meter >= 8)
const SEEDS = Array.from({ length: 10 }, (_, i) => 77001 + i); // E-Q14 family-B seeds
const CP = [0, 50, 100, 150, 200];
const AM1_PREFIX_TICKS = 25; // EQ17-AM1: bucketed-vs-linear assertion window
const AM1_FULL_SEED = 77001; // EQ17-AM1: full-run cross-check seed at 256x256

const { stone, stonePath } = await linkStone();
const KMOD = (await loadKernel()).kernel;
const { kernelKind } = await loadKernel();
const SIGMA = KMOD.DEFAULT_SIGMA;
console.log(`[e-q17] kernel=${kernelKind} stone=${stonePath} sigma=${SIGMA}`);
const preRegSha = fileSha256(join(HERE, 'pre_registration_e_q17.json'));
const preReg = JSON.parse((await import('node:fs')).readFileSync(join(HERE, 'pre_registration_e_q17.json'), 'utf8'));
const preRegShaV1 = preReg.consult_outcome.pre_consult_sha256;
const attackSha = fileSha256(join(HERE, '..', 'situations', 'e_q17_design_attack.jsonl'));
console.log(`[e-q17] pre-reg (amended) sha=${preRegSha.slice(0, 12)}… v1=${preRegShaV1.slice(0, 12)}… attack-file=${attackSha.slice(0, 12)}…`);

const packB = (tau, d) => ((tau & 3) << 6) | (d & 63);

// ── E-Q14 instrumentation, VERBATIM ────────────────────────────────────────
// Instrumented table: read() logs every live read's occupant (family-B
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
// VERBATIM E-Q14 recoverProvenance (the recovery of record per EQ17-AM1).
function recoverProvenanceVerbatim(events, readsLog) {
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

// EQ17-AM1 bucketed matcher (order-equivalent by construction): reads grouped
// by (slot, resonance) in log order; per event, first unused read in the
// bucket whose occupant is a different cell. Same predicate, O(n) instead of
// O(n^2) — used ONLY at 256x256, behind live equivalence assertions.
function recoverProvenanceBucketed(events, readsLog) {
  const buckets = new Map();
  for (let i = 0; i < readsLog.length; i++) {
    const rl = readsLog[i];
    if (!rl.hit) continue;
    if (rl.hit.resonance > 1023) throw new Error('bucket key invariant broken (resonance > 1023) — LOUD');
    const key = rl.slot * 1024 + rl.hit.resonance;
    let b = buckets.get(key);
    if (!b) { b = []; buckets.set(key, b); }
    b.push(i);
  }
  const used = new Uint8Array(readsLog.length);
  const out = [];
  for (const ev of events) {
    let src = null;
    const b = buckets.get(ev.slot * 1024 + ev.resonance);
    if (b) {
      for (let j = 0; j < b.length; j++) {
        const i = b[j];
        if (used[i]) continue;
        const rl = readsLog[i];
        if (rl.hit.x !== ev.x || rl.hit.y !== ev.y) { src = rl.hit; used[i] = 1; break; }
      }
    }
    out.push({ ev, occupant: src });
  }
  return out;
}

function assertSameProvenance(a, b, where) {
  if (a.length !== b.length) throw new Error(`AM1 equivalence VIOLATED at ${where}: ${a.length} vs ${b.length} recovered events — LOUD, run void`);
  for (let i = 0; i < a.length; i++) {
    const oa = a[i].occupant, ob = b[i].occupant;
    const sa = oa ? oa.x + ',' + oa.y : 'null';
    const sb = ob ? ob.x + ',' + ob.y : 'null';
    if (sa !== sb) throw new Error(`AM1 equivalence VIOLATED at ${where} event ${i}: verbatim ${sa} vs bucketed ${sb} — LOUD, run void`);
  }
}

// ── one run of one (grid, nPoll, seed) config ──────────────────────────────
function runOnce(w, h, nPoll, seed) {
  const rng = mulberry32(seed);
  const pairs = plantTwinPairs(rng, K, w, h, { dMin: 8, dMax: 15 }); // E-Q14-verbatim (EQ17-AM3)
  const weather = plantWeather(rng, pairs, w, h, {});
  // polluters: E-Q14-verbatim placement (>= 2 toroidal-Chebyshev from every
  // pair member, unique positions, seeded d assignment from the pair d values).
  // Perf-only deviation (receipted): uniqueness via Set — identical
  // accept/reject decisions, so the seeded draw stream is unchanged.
  const forbidden = [];
  for (const p of pairs) { forbidden.push(p.a, p.b); }
  const ds = pairs.map((p) => p.d);
  const polluters = [];
  const taken = new Set();
  let guard = 0;
  while (polluters.length < nPoll && guard++ < 200000) {
    const x = Math.floor(rng() * w), y = Math.floor(rng() * h);
    if (forbidden.some((f) => { const dx = Math.abs(f.x - x), dy = Math.abs(f.y - y); return Math.max(Math.min(dx, w - dx), Math.min(dy, h - dy)) < 2; })) continue;
    const key = y * 4096 + x;
    if (taken.has(key)) continue;
    taken.add(key);
    polluters.push({ x, y, d: ds[Math.floor(rng() * ds.length)] });
  }
  if (polluters.length < nPoll) throw new Error('polluter placement budget exhausted — LOUD');

  // E-Q14-verbatim seedFn map (key stride 4096 >= max(w): unique at every ladder scale)
  const map = new Map();
  for (const p of pairs) { map.set(p.a.y * 4096 + p.a.x, packB(3, p.d)); map.set(p.b.y * 4096 + p.b.x, packB(3, p.d)); }
  for (const c of weather) map.set(c.y * 4096 + c.x, c.byte);
  for (const c of polluters) map.set(c.y * 4096 + c.x, packB(3, c.d));
  const seedFn = (x, y) => map.get(y * 4096 + x) ?? 0;

  const partnerOf = new Map();
  for (const p of pairs) { partnerOf.set(p.a.y * w + p.a.x, p.b.y * w + p.b.x); partnerOf.set(p.b.y * w + p.b.x, p.a.y * w + p.a.x); }

  const { table, readsLog } = makeInstrumentedTable();
  let sub = makeSubstrate(w, h, seedFn);
  const hashes = [planeHash(sub, 0, bytePlane)];
  const abstains0 = Array.from(sub).filter((c) => (c >> 6) === 3).length;
  const meter = new Float64Array(w * h);
  const firstExceed = new Map();
  let pairEvents = 0, pollutedEvents = 0, partnerEvents = 0;
  let occupancyMax = 0;
  let am1PrefixChecks = 0, am1FullCheck = false;
  const useBucketed = w === 256; // EQ17-AM1: bucketed only at 256x256, behind assertions
  const fullCrossCheck = useBucketed && seed === AM1_FULL_SEED;

  for (let t = 1; t <= T; t++) {
    readsLog.length = 0;
    sub = tick(sub, { wormholes: true, table });
    const events = sub.lastEvents;
    let prov;
    if (!useBucketed) {
      prov = recoverProvenanceVerbatim(events, readsLog); // recovery of record at 64/128
    } else {
      prov = recoverProvenanceBucketed(events, readsLog);
      if (t <= AM1_PREFIX_TICKS || fullCrossCheck) {
        const ref = recoverProvenanceVerbatim(events, readsLog);
        assertSameProvenance(ref, prov, `${w}x${h} nPoll=${nPoll} seed=${seed} t=${t}`);
        if (t <= AM1_PREFIX_TICKS) am1PrefixChecks++;
        else am1FullCheck = true;
      }
    }
    for (const { ev, occupant } of prov) {
      const idx = ev.y * w + ev.x;
      if (!partnerOf.has(idx)) continue; // only pair-member events count (E-Q14)
      meter[idx] += ev.term;
      if (!firstExceed.has(idx) && meter[idx] >= THETA) firstExceed.set(idx, t);
      pairEvents++;
      if (occupant && partnerOf.get(idx) === occupant.y * w + occupant.x) partnerEvents++;
      else pollutedEvents++;
    }
    if (CP.includes(t)) {
      hashes.push(planeHash(sub, t, bytePlane));
      const occ = table.occupiedCount();
      if (occ > occupancyMax) occupancyMax = occ;
      if (occ > 64) throw new Error(`occupancy cap violated (${occ} > 64) at ${w}x${h} nPoll=${nPoll} seed=${seed} t=${t} — kernel defect finding, LOUD`);
    }
  }
  const pairDelivers = pairs.map((p) => {
    const ia = p.a.y * w + p.a.x, ib = p.b.y * w + p.b.x;
    const ta = firstExceed.has(ia) ? firstExceed.get(ia) : null;
    const tb = firstExceed.has(ib) ? firstExceed.get(ib) : null;
    return ta !== null && tb !== null ? Math.max(ta, tb) : null;
  });
  const delivered = pairDelivers.filter((t) => t !== null).length;
  const occupancyFinal = table.occupiedCount();
  const totalWrites = table.totalWrites;
  return {
    hashes, delivered, pairDelivers, pairEvents, partnerEvents, pollutedEvents,
    polluters: polluters.length, abstains0, occupancyFinal, occupancyMax, totalWrites,
    am1PrefixChecks, am1FullCheck,
  };
}

// ── the ladder x arms (EQ17-AM2 schema: canonical configs, arm_labels) ──────
const CONFIGS = [
  { grid: '64x64', w: 64, h: 64, nPoll: 0, arms: ['clean'] },
  { grid: '64x64', w: 64, h: 64, nPoll: 256, arms: ['density', 'fixed256'], note: 'coincident arm at 64x64: 256 polluters is both the density-matched and the fixed-256 condition (receipted; executed once)' },
  { grid: '128x128', w: 128, h: 128, nPoll: 0, arms: ['clean'] },
  { grid: '128x128', w: 128, h: 128, nPoll: 1024, arms: ['density'] },
  { grid: '128x128', w: 128, h: 128, nPoll: 256, arms: ['fixed256'] },
  { grid: '256x256', w: 256, h: 256, nPoll: 0, arms: ['clean'] },
  { grid: '256x256', w: 256, h: 256, nPoll: 4096, arms: ['density'] },
  { grid: '256x256', w: 256, h: 256, nPoll: 256, arms: ['fixed256'] },
];

const runs = [];
for (const cfg of CONFIGS) {
  for (const seed of SEEDS) {
    const r1 = runOnce(cfg.w, cfg.h, cfg.nPoll, seed);
    const r2 = runOnce(cfg.w, cfg.h, cfg.nPoll, seed);
    const detOk = JSON.stringify(r1.hashes) === JSON.stringify(r2.hashes);
    const pf = r1.pairEvents > 0 ? r1.pollutedEvents / r1.pairEvents : null;
    const prov = r1.pairEvents > 0 ? r1.partnerEvents / r1.pairEvents : null;
    runs.push({
      grid: cfg.grid, nPoll: cfg.nPoll, arm_labels: cfg.arms, seed, determinism: detOk,
      delivered: r1.delivered, pairDelivers: r1.pairDelivers.map(q),
      pairEvents: r1.pairEvents, partnerEvents: r1.partnerEvents, pollutedEvents: r1.pollutedEvents,
      pollutionFraction: pf === null ? null : q(pf), provFrac: prov === null ? null : q(prov),
      abstains0: r1.abstains0, polluters: r1.polluters,
      occupancyFinal: r1.occupancyFinal, occupancyMax: r1.occupancyMax, totalWrites: r1.totalWrites,
      writesPerOccupiedSlot: q(Math.round((r1.totalWrites / Math.max(r1.occupancyFinal, 1)) * 100) / 100),
      am1PrefixChecks: r1.am1PrefixChecks, am1FullCheck: r1.am1FullCheck,
      finalHash: r1.hashes[r1.hashes.length - 1],
    });
    console.log(`[e-q17] ${cfg.grid} nPoll=${String(cfg.nPoll).padStart(4)} seed=${seed} delivered=${r1.delivered}/${K} events=${r1.pairEvents} partner=${r1.partnerEvents} polluted=${r1.pollutedEvents} pf=${pf === null ? 'null' : pf.toFixed(4)} det=${detOk} occ=${r1.occupancyFinal} writes=${r1.totalWrites} am1={prefix:${r1.am1PrefixChecks},full:${r1.am1FullCheck}}`);
  }
}

// ── aggregates: STRICTLY per (grid, arm) cell over its 10 distinct seeds ───
const median = (vals) => { const v = [...vals].sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; }; // upper middle (corpus convention)
const num = (x) => parseFloat(String(x)); // PG6 law: PARSE BEFORE COMPARING
const aggregates = {};
for (const cfg of CONFIGS) {
  for (const arm of cfg.arms) {
    const rs = runs.filter((r) => r.grid === cfg.grid && r.nPoll === cfg.nPoll);
    if (rs.length !== SEEDS.length) throw new Error(`aggregate cell ${cfg.grid}/${arm}: ${rs.length} runs, expected ${SEEDS.length} — LOUD`);
    const pfs = rs.map((r) => num(r.pollutionFraction));
    const provs = rs.map((r) => num(r.provFrac));
    aggregates[`${cfg.grid}|${arm}`] = {
      grid: cfg.grid, arm, nPoll: cfg.nPoll, arm_labels: cfg.arms,
      pfMed: q(median(pfs)), provMed: q(median(provs)),
      pfSeeds: rs.map((r) => r.pollutionFraction),
      deliveredFull: rs.filter((r) => r.delivered === K).length,
      deliveredTotal: rs.reduce((s, r) => s + r.delivered, 0),
      pairTrials: K * SEEDS.length,
      pairEvents: rs.reduce((s, r) => s + r.pairEvents, 0),
      partnerEvents: rs.reduce((s, r) => s + r.partnerEvents, 0),
      pollutedEvents: rs.reduce((s, r) => s + r.pollutedEvents, 0),
      occupancyFinalMed: median(rs.map((r) => r.occupancyFinal)),
      totalWritesMed: median(rs.map((r) => r.totalWrites)),
      writesPerOccupiedSlotMed: q(median(rs.map((r) => num(r.writesPerOccupiedSlot)))),
      abstains0: rs[0].abstains0,
      determinismAll: rs.every((r) => r.determinism),
      am1Checks: { prefixPerSeed: rs[0].am1PrefixChecks, fullCrossCheckSeed: rs.some((r) => r.am1FullCheck) },
    };
  }
}

// ── floors and bands (pre-registered, applied verbatim) ────────────────────
const pfMed = (grid, arm) => num(aggregates[`${grid}|${arm}`].pfMed);
const cells = [['64x64', 'clean'], ['64x64', 'density'], ['64x64', 'fixed256'], ['128x128', 'clean'], ['128x128', 'density'], ['128x128', 'fixed256'], ['256x256', 'clean'], ['256x256', 'density'], ['256x256', 'fixed256']];
for (const [g, a] of cells) if (!aggregates[`${g}|${a}`]) throw new Error(`missing aggregate cell ${g}/${a} — LOUD`);

const deliveryFloorOk = runs.every((r) => r.delivered === K);
const deliveredTotalAll = runs.reduce((s, r) => s + r.delivered, 0);
const pairTrialsAll = runs.length * K;
const pfCalValue = pfMed('64x64', 'clean');
const pfCalFloorOk = pfCalValue >= 0.90;
const occupancyCapOk = runs.every((r) => r.occupancyMax <= 64);
const F0 = runs.every((r) => r.determinism);

const deltaClean = pfMed('256x256', 'clean') - pfMed('64x64', 'clean');
const deltaDensity = pfMed('256x256', 'density') - pfMed('64x64', 'density');
const deltaFixed = pfMed('256x256', 'fixed256') - pfMed('64x64', 'fixed256');
const H0 = Math.abs(deltaClean) <= 0.02;
const fireVerbatim = { clean: pfMed('256x256', 'clean') < pfMed('64x64', 'clean') - 0.05, density: pfMed('256x256', 'density') < pfMed('64x64', 'density') - 0.05 };
const mirrorBand = { clean: pfMed('256x256', 'clean') > pfMed('64x64', 'clean') + 0.05, density: pfMed('256x256', 'density') > pfMed('64x64', 'density') + 0.05 };
const judgmentBand = { clean: !H0 && !fireVerbatim.clean && !mirrorBand.clean, density: Math.abs(deltaDensity) > 0.02 && !fireVerbatim.density && !mirrorBand.density };
const triggerFires = fireVerbatim.clean || fireVerbatim.density;      // the pre-registered FIRE band, verbatim
const triggerMirror = mirrorBand.clean || mirrorBand.density;          // the complementary reading, pre-registered

const fmt = (x) => (Math.round(x * 10000) / 10000).toFixed(4);
const verdict = `E-Q17 VERDICT: provenance at scale {pf medians (E-Q14 pollutionFraction, upper-median of 10 seeds) clean ${fmt(pfMed('64x64', 'clean'))}/${fmt(pfMed('128x128', 'clean'))}/${fmt(pfMed('256x256', 'clean'))} density ${fmt(pfMed('64x64', 'density'))}/${fmt(pfMed('128x128', 'density'))}/${fmt(pfMed('256x256', 'density'))} fixed256 ${fmt(pfMed('64x64', 'fixed256'))}/${fmt(pfMed('128x128', 'fixed256'))}/${fmt(pfMed('256x256', 'fixed256'))} at 64/128/256; H0 |pf(256,clean)-pf(64,clean)|=${fmt(Math.abs(deltaClean))} <= 0.02 -> ${H0 ? 'SCALE-INERT (null holds)' : 'FALSIFIED'}; FIRE band (verbatim, pf drop > 0.05) clean=${fireVerbatim.clean} density=${fireVerbatim.density} -> trigger ${triggerFires ? 'FIRES (H1 registered for build)' : 'does NOT fire'}; MIRROR band (complement reading, pf rise > 0.05 = provenance degrades) clean=${mirrorBand.clean} density=${mirrorBand.density} -> ${triggerMirror ? 'DEGRADATION at scale (judgment escalation)' : 'no degradation'}; judgment band clean=${judgmentBand.clean} density=${judgmentBand.density}; delivery floor ${deliveryFloorOk ? 'HELD' : 'BROKEN — THE FINDING'} (${deliveredTotalAll}/${pairTrialsAll} pair-trials); pf calibration floor ${pfCalFloorOk ? 'held' : 'VIOLATED — calibration finding'} (pf(64,clean)=${fmt(pfCalValue)} vs E-Q14 sealed 0.9431, floor 0.90); occupancy cap ${occupancyCapOk ? 'held' : 'VIOLATED'}; determinism ${F0 ? 'ALL byte-identical (2x fresh per config)' : 'VOID'}}`;

console.log(`\n[e-q17] ${verdict}`);

// ── seal: results JSON (AS-SAID), chain rows, tip ──────────────────────────
writeFileSync(join(OUT, 'e_q17_results.json'), JSON.stringify({
  experiment: 'E-Q17', claim: 'provenance-correct wormhole at scale', kernel: kernelReport(), stonePath, preRegSha, preRegShaV1,
  registration: 'experiments/pre_registration_e_q17.json (amended pre-run: EQ17-AM1 recovery equivalence, EQ17-AM2 results schema, EQ17-AM3 K=8 E-Q14-verbatim planting)',
  consult: {
    file: 'situations/e_q17_design_attack.jsonl', sha256: attackSha, seat: 'ByteDance/Seed-2.0-mini', call_id: 'r12-eq17-seed20mini-designattack',
    attacks: 6, dispositions: 'A1 refuted, A2 refuted, A3 refuted, A4 refuted, A5 accepted-in-part (AM1), A6 accepted-as-clarification (AM2)',
    usd: 0.004255, elapsed_ms: 70821,
  },
  task: { K, dWindow: [8, 15], minPairSep: 24, minCrossSep: 8, weather: '2x Attract d=40,41 + 1x Repel d=30 (awayFromPairs=10, mutual=4)', thetaDel: THETA, T, seeds: SEEDS, sigma: 'kernel default log2(3)', detReruns: 2, checkpoints: CP },
  configs: CONFIGS,
  runs,
  aggregates,
  floors: { deliveryFloorOk, deliveredTotalAll, pairTrialsAll, pfCalFloorOk, pfCalValue: q(pfCalValue), occupancyCapOk, F0 },
  bands: {
    deltaCleanPf: q(deltaClean), deltaDensityPf: q(deltaDensity), deltaFixedPf: q(deltaFixed),
    H0, fireVerbatim, mirrorBand, judgmentBand, triggerFires, triggerMirror,
    definitions: { H0: '|pfMed(256x256,clean) - pfMed(64x64,clean)| <= 0.02', fire: 'pfMed(256,arm) < pfMed(64,arm) - 0.05 on clean or density (verbatim registration band, pf = pollutionFraction)', mirror: 'pfMed(256,arm) > pfMed(64,arm) + 0.05 on clean or density (the same band under the complement reading provFrac = 1 - pf: provenance degrades at scale)' },
  },
  verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ17', frozen_by: 'experiments/pre_registration_e_q17.json (ORCH-R12/T3-b; v1 sha ' + preRegShaV1.slice(0, 16) + '…; amended pre-run by EQ17-AM1/AM2/AM3 after the Seed-2.0-mini design attack and the LOUD planting throw)', pre_reg_sha256: preRegSha, pre_reg_v1_sha256: preRegShaV1,
    proposal_cited: 'hy4 r10 (situations/arena_rows_r10.jsonl, call_id r10-hy4p-audit, missing_experiment): "E-Q17: provenance-correct wormhole at scale — Run 256x256/10% Abstain with identity-tagged wormhole writes and assert the rendezvous/non-local demo agrees with the planted twin, not an aliased slot-63/adjacent-d impostor. It prices whether C2\'s non-local advantage survives at scale and whether the 64-slot table is a hard adoption wall."',
    floors: 'delivery 100% per arm (20-pair trials -> K=8 per run, 10 seeds); pf calibration >= 0.90 at 64x64 clean (E-Q14 sealed 0.9431); occupancy <= 64; determinism F0 2x fresh byte-identical',
    bands: 'H0 |pf(256,clean)-pf(64,clean)| <= 0.02; FIRE (verbatim) pf(256,arm) < pf(64,arm) - 0.05 clean|density; MIRROR (complement reading) pf(256,arm) > pf(64,arm) + 0.05 clean|density; between: judgment band, documented' },
  { kind: 'run.config', experiment: 'E-Q17', kernel: kernelReport(), stone_linked: stonePath,
    design: 'grid ladder 64x64/128x128/256x256, fixed flat 64-slot table, E-Q14 family-B twin-delivery task at matched geometry (K=8 pairs d 8..15, minPairSep 24, minCrossSep 8, weather 2xAttract+1xRepel), T=200, theta=8, seeds 77001..77010, 2x fresh determinism reruns; arms: clean 0 / density 256-per-4096-cells (256/1024/4096) / fixed256; 64x64 density==fixed256 (coincident, run once, both labels)',
    consult: 'Seed-2.0-mini design attack sealed AS-SAID at situations/e_q17_design_attack.jsonl sha ' + attackSha.slice(0, 16) + '… (6 attacks: 4 refuted, A5->AM1, A6->AM2; $0.004255, 70.8s)' },
];
for (const [g, a] of cells) {
  const A = aggregates[`${g}|${a}`];
  rows.push({ kind: 'result.EQ17', experiment: 'E-Q17', grid: g, arm: a, nPoll: A.nPoll, arm_labels: A.arm_labels,
    pfMed: A.pfMed, provMed: A.provMed, pfSeeds: A.pfSeeds,
    deliveredFull: A.deliveredFull, deliveredTotal: A.deliveredTotal, pairTrials: A.pairTrials,
    pairEvents: A.pairEvents, partnerEvents: A.partnerEvents, pollutedEvents: A.pollutedEvents,
    occupancyFinalMed: A.occupancyFinalMed, totalWritesMed: A.totalWritesMed, writesPerOccupiedSlotMed: A.writesPerOccupiedSlotMed,
    abstains0: A.abstains0, determinismAll: A.determinismAll, am1Checks: A.am1Checks });
}
rows.push({ kind: 'verdict.EQ17', experiment: 'E-Q17',
  H0, deltaCleanPf: q(deltaClean), fireVerbatim, mirrorBand, judgmentBand, triggerFires, triggerMirror,
  deliveryFloorOk, deliveredTotalAll, pairTrialsAll, pfCalFloorOk, pfCalValue: q(pfCalValue), occupancyCapOk, F0,
  pfMedClean: { '64x64': aggregates['64x64|clean'].pfMed, '128x128': aggregates['128x128|clean'].pfMed, '256x256': aggregates['256x256|clean'].pfMed },
  pfMedDensity: { '64x64': aggregates['64x64|density'].pfMed, '128x128': aggregates['128x128|density'].pfMed, '256x256': aggregates['256x256|density'].pfMed },
  pfMedFixed256: { '64x64': aggregates['64x64|fixed256'].pfMed, '128x128': aggregates['128x128|fixed256'].pfMed, '256x256': aggregates['256x256|fixed256'].pfMed },
  verdict });

const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q17', claim: 'provenance-at-scale' });
console.log(`[e-q17] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q17_tip.txt'), `${v.tip} links=${v.links}\n`);
