// fixedpoint/cost_benchmark.mjs — ORCH-6 (roadmap phase 6): the MEASURED
// runtime cost of staying exact. The sealed corpus priced the SEMANTIC cost
// (F_E: zero on swept sigmas, one S-unit at the coupled 2/3 point, the
// exact-zero families on adversarial rationals) but never timed the two
// planes. This benchmark closes that gap honestly:
//   (a) wall-clock per workload run, float kernel vs fixed kernel, medians
//       over fresh reruns (timings are receipted STRINGS — wall-clock never
//       enters hashed chain content);
//   (b) light re-verification of the semantic record on THIS machine:
//       zero divergence on swept sigmas (2 seeds x 200 ticks x 5 arms),
//       known divergence at sigma = 2/3 (the frozen coupled point).
// Appends one row to fixedpoint/receipts/fixedpoint_chain.jsonl (append-only).
import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as FLOAT from '../experiments/_adapter.mjs';
import * as FIXED from './qthe_fixed.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, plantTwinPairs, plantWeather, seedFnFrom, q, fileSha256 } from '../experiments/_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
mkdirSync(OUT, { recursive: true });
const CHAIN = join(HERE, 'receipts', 'fixedpoint_chain.jsonl');

await FLOAT.loadKernel();
const { stone } = await linkStone();
console.log('[cost] kernels loaded: float(qthe.mjs) + fixed(qthe_fixed.mjs)');

const W = 64, H = 64, T = 400, REPS = 5;

function buildSeedFn(seed) {
  const rng = FLOAT.mulberry32(seed);
  const pairs = plantTwinPairs(rng, 8, W, H, {});
  const weather = plantWeather(rng, pairs, W, H, {});
  return seedFnFrom(pairs, weather);
}

// ── (a) runtime: median wall-clock per full workload ───────────────────────
function timeWorkload(kernel /* 'float' | 'fixed' */, seed) {
  const seedFn = buildSeedFn(seed);
  const times = [];
  for (let r = 0; r < REPS; r++) {
    let sub = kernel === 'float'
      ? FLOAT.makeSubstrate(W, H, seedFn)
      : FIXED.makeSubstrate(W, H, seedFn);
    const t0 = performance.now();
    for (let t = 0; t < T; t++) sub = kernel === 'float' ? FLOAT.tick(sub, {}) : FIXED.tick(sub, {});
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)]; // median
}

const seeds = [33001, 33002];
const timing = {};
for (const kernel of ['float', 'fixed']) {
  const medians = seeds.map((s) => timeWorkload(kernel, s));
  const med = medians.sort((a, b) => a - b)[Math.floor(medians.length / 2)];
  timing[kernel] = { perRunMs: q(Math.round(med * 100) / 100), msPerTickPer1kCells: q(Math.round((med / T) / (W * H / 1000) * 10000) / 10000), medians: medians.map((m) => q(Math.round(m * 100) / 100)) };
  console.log(`[cost] ${kernel}: median ${med.toFixed(2)} ms per ${T}-tick ${W}x${H} run (seeds ${seeds})`);
}
const ratio = timing.fixed.perRunMs / timing.float.perRunMs;
console.log(`[cost] fixed/float runtime ratio = ${ratio.toFixed(3)}x`);

// ── (b) semantic re-verification on this machine ──────────────────────────
// swept sigmas: float arm sigma vs fixed arm sigmaQ = round(sigma * 2^32)
const sweptArms = [
  { name: '0.5', f: 0.5, qv: FIXED.sigmaToFixed(0.5) },
  { name: '1', f: 1, qv: FIXED.sigmaToFixed(1) },
  { name: 'log2(3)', f: Math.log2(3), qv: FIXED.DEFAULT_SIGMA_Q },
  { name: '2', f: 2, qv: FIXED.sigmaToFixed(2) },
  { name: '4', f: 4, qv: FIXED.sigmaToFixed(4) },
];
const semChecks = { swept: [], coupled23: null };
for (const arm of sweptArms) {
  let allEqual = true;
  for (const seed of [33001, 33002]) {
    const seedFn = buildSeedFn(seed);
    let sf = FLOAT.makeSubstrate(W, H, seedFn);
    let sq = FIXED.makeSubstrate(W, H, seedFn);
    for (let t = 1; t <= 200; t++) {
      sf = FLOAT.tick(sf, { sigma: arm.f });
      sq = FIXED.tick(sq, { sigmaQ: arm.qv });
      if (t % 50 === 0) {
        const hf = planeHash(sf, t, FLOAT.bytePlane);
        const hq = planeHash(sq, t, () => sq);
        if (hf !== hq) { allEqual = false; break; }
      }
    }
    if (!allEqual) break;
  }
  semChecks.swept.push({ sigma: arm.name, planesIdentical: allEqual });
  console.log(`[cost] swept sigma=${arm.name}: planes identical = ${allEqual}`);
}
// coupled 2/3: divergence EXPECTED (the frozen point) — verify it fires
{
  const seedFn = buildSeedFn(33001);
  let sf = FLOAT.makeSubstrate(W, H, seedFn);
  let sq = FIXED.makeSubstrate(W, H, seedFn);
  let firstDiv = null;
  for (let t = 1; t <= 200 && firstDiv === null; t++) {
    sf = FLOAT.tick(sf, { sigma: 2 / 3 });
    sq = FIXED.tick(sq, { sigmaQ: 2863311531 });
    if (planeHash(sf, t, FLOAT.bytePlane) !== planeHash(sq, t, () => sq)) firstDiv = t;
  }
  semChecks.coupled23 = { firstDivergenceTick: q(firstDiv), expected: 'diverges (the frozen coupled boundary)' };
  console.log(`[cost] coupled 2/3: first divergence tick = ${firstDiv} (expected: diverges)`);
}

writeFileSync(join(OUT, 'cost_benchmark.json'), JSON.stringify({
  benchmark: 'cost-of-exactness (ORCH-6)', workload: { w: W, h: H, T, reps: REPS, seeds, task: 'E-Q1 twin-delivery class, wormholes ON (default sigma path)' },
  timing, ratioFixedOverFloat: q(Math.round(ratio * 1000) / 1000),
  semanticReverification: semChecks,
  note: 'timings are wall-clock medians, receipted as strings; semantic checks are plane-hash booleans on this machine',
}, null, 1));

const rows = [{ kind: 'cost_benchmark.ORCH6',
  workload: `${W}x${H} x ${T} ticks x ${REPS} fresh reruns x seeds ${seeds.join(',')} (twin-delivery class, wormholes ON)`,
  float_median_ms: timing.float.perRunMs, fixed_median_ms: timing.fixed.perRunMs,
  ratio_fixed_over_float: q(Math.round(ratio * 1000) / 1000),
  semantic_swept_all_identical: semChecks.swept.every((s) => s.planesIdentical),
  coupled23_first_divergence_tick: semChecks.coupled23.firstDivergenceTick,
  receipt_note: 'runtime cost measured for the first time in the corpus (REPRESENTATION-LAW.md gap closed); wall-clock rides as strings only' }];
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'fixedpoint', claim: 'R8' });
console.log(`[cost] chain ok links=${v.links} tip=${v.tip}`);
