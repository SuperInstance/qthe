// experiments/e_q1_wormhole.mjs — E-Q1: THE HEADLINE (claim C2): wormhole
// (Abstain) vs no-wormhole paired arms on planted twin-resonance tasks.
// Lane 33-b (field-smith). Runs against the SPEC.md LAYER 0/1 interface via
// experiments/_adapter.mjs (real qthe.mjs when core-smith lands it, else the
// TEST-ONLY _ref_kernel.mjs — the receipt records which kernel ran).
//
// PRE-REGISTERED FLOORS (experiments/pre_registration.json, committed BEFORE
// any run — this header restates them; the registration file is the canon):
//  F0 DETERMINISM       — every trial's runs reproduce byte-identical
//                         checkpoint plane hashes on fresh rebuild, 40/40,
//                         else the experiment is VOID.
//  F1 CONTROL CLEANLINESS — no-Abstain control substrates: wormholes ON vs OFF
//                         byte-identical at every checkpoint, 20/20; any
//                         divergence = the flag leaks into non-Abstain
//                         dynamics = kernel defect finding.
//  F2 MECHANISTIC FLOOR — OFF arm delivers 0 pairs in 20/20 trials (no table,
//                         no imaginary receipts; local influence cannot
//                         propagate through Ground under SPEC L1 s5). Any
//                         OFF delivery falsifies the mechanism model.
//  F3 CLAIM FLOOR (C2)  — C2 LIVES iff ON median pairs-delivered >= K/2 = 4
//                         of 8 within T=200 AND F2 holds. ON median < 4 =>
//                         C2 DIES as an honest null + mechanism autopsy.
//                         On the TEST-ONLY ref kernel, verdict is staged:
//                         LIVES-ON-REF / REAL-KERNEL-REPLICATION-OPEN.
//
// TASK CLASS: 64x64; K=8 Abstain pairs, per-pair distinct d in 8..15, members
// Chebyshev >= 24, cross-pair >= 8; 3 weather cells (non-Abstain) >= 10 away
// so the plane evolves. T=200, theta_del = 8, 20 trials, seeds 33001..33020.
// DELIVERY: member delivers at first tick its cumulative imaginary accumulator
// >= 8; pair delivers at max of its members' first-delivery ticks.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, imagAcc, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, plantTwinPairs, plantWeather, seedFnFrom, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });

const T = 200, K = 8, THETA = 8, TRIALS = 20, BASE_SEED = 33001;
const CHECKPOINTS = [0, 50, 100, 150, 200];
const CHAIN = join(RECEIPTS, 'e_q1_chain.jsonl');

const { stone, stonePath } = await linkStone();
const { kernelKind } = await loadKernel();
console.log(`[e-q1] kernel=${kernelKind} stone=${stonePath}`);

const preRegSha = existsSync(join(HERE, 'pre_registration.json')) ? fileSha256(join(HERE, 'pre_registration.json')) : null;

function buildTrial(seed) {
  const rng = mulberry32(seed);
  const pairs = plantTwinPairs(rng, K, 64, 64, {});
  const weather = plantWeather(rng, pairs, 64, 64, {});
  return { pairs, weather, seedFn: seedFnFrom(pairs, weather) };
}

function runArm(seedFn, wormholes, Ticks) {
  const sub = makeSubstrate(64, 64, seedFn);
  const hashes = [];
  const imag0 = imagAcc(sub);
  if (!imag0) throw new Error('kernel exposes no imaginary-accumulator readback — ADAPT _adapter.mjs');
  const firstDeliver = []; // per placed member (index into members array)
  const members = [];
  const plane = bytePlane(sub);
  for (let i = 0; i < plane.length; i++) if ((plane[i] >> 6) === 3) members.push(i);
  if (members.length !== 2 * K) throw new Error(`E-Q1: planted ${members.length} Abstain cells, expected ${2 * K} — LOUD`);
  const firstExceed = new Map();
  const bridgeTick = []; // per pair: first tick EITHER member's imag increases
  const imagPrev = new Map();
  for (const i of members) imagPrev.set(i, imag0[i]);

  hashes.push(planeHash(sub, 0, bytePlane));
  for (let t = 1; t <= Ticks; t++) {
    tick(sub, { wormholes });
    const im = imagAcc(sub);
    if (CHECKPOINTS.includes(t)) hashes.push(planeHash(sub, t, bytePlane));
    for (const i of members) {
      if (im[i] > imagPrev.get(i)) {
        const pairIdx = Math.floor(members.indexOf(i) / 2);
        if (bridgeTick[pairIdx] === undefined) bridgeTick[pairIdx] = t;
        imagPrev.set(i, im[i]);
        if (firstExceed.get(i) === undefined && im[i] >= THETA) firstExceed.set(i, t);
      } else if (im[i] < imagPrev.get(i)) {
        throw new Error(`E-Q1: imaginary accumulator DECREASED at t=${t} — monotonicity violation, LOUD`);
      }
    }
  }
  const perPair = [];
  for (let p = 0; p < K; p++) {
    const ia = members[2 * p], ib = members[2 * p + 1];
    const ta = firstExceed.get(ia) ?? null, tb = firstExceed.get(ib) ?? null;
    perPair.push({ pairId: p, aDeliver: ta, bDeliver: tb, pairDeliver: ta !== null && tb !== null ? Math.max(ta, tb) : null, bridgeTick: bridgeTick[p] ?? null });
  }
  const delivered = perPair.filter((p) => p.pairDeliver !== null).length;
  return { hashes, perPair, delivered, members };
}

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ---------------------------------------------------------------- trials ---
const trials = [];
for (let i = 0; i < TRIALS; i++) {
  const seed = BASE_SEED + i;
  const { seedFn } = buildTrial(seed);

  const on = runArm(seedFn, true, T);
  const off = runArm(seedFn, false, T);
  const rerunOn = runArm(seedFn, true, T);
  const rerunOff = runArm(seedFn, false, T);

  const detOn = JSON.stringify(on.hashes) === JSON.stringify(rerunOn.hashes);
  const detOff = JSON.stringify(off.hashes) === JSON.stringify(rerunOff.hashes);

  // F1 control: same seed, NO Abstain cells planted, both flags
  const { weather } = buildTrial(seed);
  const controlSeedFn = seedFnFrom([], weather);
  const cOn = runArm(controlSeedFn, true, T);
  const cOff = runArm(controlSeedFn, false, T);
  const controlEqual = JSON.stringify(cOn.hashes) === JSON.stringify(cOff.hashes);

  // the byte plane must be arm-invariant (imaginary is not in the plane):
  const planeArmEqual = JSON.stringify(on.hashes) === JSON.stringify(off.hashes);

  trials.push({
    seed, on: on.perPair, off: off.perPair,
    onDelivered: on.delivered, offDelivered: off.delivered,
    detOk: detOn && detOff, controlEqual, planeArmEqual,
    hashesOn: on.hashes, hashesOff: off.hashes,
  });
  console.log(`[e-q1] trial ${i + 1}/${TRIALS} seed=${seed} ON=${on.delivered}/${K} OFF=${off.delivered}/${K} det=${detOn && detOff} ctrl=${controlEqual}`);
}

// ------------------------------------------------------------- aggregates ---
const onDelivered = trials.map((t) => t.onDelivered);
const offDelivered = trials.map((t) => t.offDelivered);
const onMedian = median(onDelivered);
const offAny = offDelivered.some((d) => d !== 0);
const allDet = trials.every((t) => t.detOk);
const allControl = trials.every((t) => t.controlEqual);
const allPlaneArmEqual = trials.every((t) => t.planeArmEqual);

const F0 = allDet, F1 = allControl, F2 = !offAny;
const F3 = onMedian >= K / 2;
const staged = kernelKind !== 'real';
const verdict = !F0 ? 'VOID(determinism)' : !(F1 && F2) ? 'FLOOR-BROKEN(autopsy)' : F3 ? (staged ? 'C2 LIVES-ON-REF / REAL-KERNEL-REPLICATION-OPEN' : 'C2 LIVES') : 'C2 DIES (honest null)';

console.log(`[e-q1] ON median=${onMedian} K/2=${K / 2} | OFF any=${offAny} | det=${allDet} ctrl=${allControl} planeArm=${allPlaneArmEqual} => ${verdict}`);

// ----------------------------------------------------------------- outputs ---
writeFileSync(join(OUT, 'e_q1_results.json'), JSON.stringify({
  experiment: 'E-Q1', claim: 'C2', kernel: kernelReport(), stonePath, preRegSha,
  task: { w: 64, h: 64, K, T, theta_del: THETA, trials: TRIALS, baseSeed: BASE_SEED },
  trials, aggregates: { onDelivered, offDelivered, onMedian, offAnyDelivery: offAny, allDet, allControl, allPlaneArmEqual, verdict },
}, null, 1));

// ---------------------------------------------------------------- receipts ---
const rows = [
  { kind: 'rules.EQ1', frozen_by: 'experiments/pre_registration.json (committed before runs)', pre_reg_sha256: preRegSha,
    floors: 'F0 determinism 40/40; F1 control ON==OFF 20/20; F2 OFF delivers 0 in 20/20; F3 C2 LIVES iff ON median >= 4/8 within T=200 and F2 holds' },
  { kind: 'run.config', experiment: 'E-Q1', kernel: kernelReport(), stone_linked: stonePath,
    contract: 'tick(substrate,{wormholes}) / makeSubstrate(w,h,seedFn) / mulberry32 / WormholeTable(sigma)',
    task: '64x64, K=8 Abstain pairs d=8..15, pair sep >= 24, cross >= 8, 3 weather cells, T=200, theta=8, seeds 33001..33020, paired arms ON/OFF + no-Abstain control' },
];
for (const t of trials) {
  rows.push({ kind: 'result.trial', experiment: 'E-Q1', seed: t.seed,
    onDelivered: t.onDelivered, offDelivered: t.offDelivered, K,
    onFirstTicks: t.on.map((p) => q(p.pairDeliver)), offFirstTicks: t.off.map((p) => q(p.pairDeliver)),
    determinism: t.detOk, controlClean: t.controlEqual, planeArmInvariant: t.planeArmEqual,
    finalPlaneHash: t.hashesOn[t.hashesOn.length - 1] });
}
rows.push({ kind: 'result.determinism', experiment: 'E-Q1', rerunRuns: 4 * TRIALS, mismatches: allDet ? 0 : trials.filter((t) => !t.detOk).length });
rows.push({ kind: 'verdict.EQ1', experiment: 'E-Q1', F0: F0, F1: F1, F2: F2, F3: F3,
  onMedian: q(onMedian), offAnyDelivery: offAny, kernelKind, verdict });

const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q1', claim: 'C2' });
console.log(`[e-q1] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q1_tip.txt'), `${v.tip} links=${v.links}\n`);
