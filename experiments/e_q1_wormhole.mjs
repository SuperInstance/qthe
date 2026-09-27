// experiments/e_q1_wormhole.mjs — E-Q1: THE HEADLINE (claim C2): wormhole
// (Abstain) vs no-wormhole paired arms on planted twin-resonance tasks.
// Lane 33-b (field-smith). Runs on the REAL kernel (qthe.mjs, commit 492333e,
// interpretation receipts R1-R5) via experiments/_adapter.mjs.
//
// PRE-REGISTERED FLOORS (experiments/pre_registration.json, committed BEFORE
// any run — this header restates them; the registration file is the canon):
//  F0 DETERMINISM       — every trial's ON/OFF runs reproduce byte-identical
//                         checkpoint plane hashes on fresh rebuild, 40/40,
//                         else the experiment is VOID.
//  F1 CONTROL CLEANLINESS — no-Abstain control substrates: wormholes ON vs OFF
//                         byte-identical at every checkpoint, 20/20; any
//                         divergence = the flag leaks into non-Abstain
//                         dynamics = kernel defect finding.
//  F2 MECHANISTIC FLOOR — OFF arm delivers 0 pairs in 20/20 trials (no table,
//                         no imaginary receipts). Any OFF delivery falsifies
//                         the mechanism model and triggers autopsy.
//  F3 CLAIM FLOOR (C2)  — C2 LIVES iff ON median pairs-delivered >= K/2 = 4
//                         of 8 within T=200 AND F2 holds. ON median < 4 =>
//                         C2 DIES as an honest null + mechanism autopsy.
//
// TASK CLASS: 64x64 toroidal [R1]; K=8 Abstain pairs, per-pair distinct d in
// 8..15, members toroidal-Chebyshev >= 24, cross-pair >= 8; 3 weather cells
// (non-Abstain) >= 10 away so planes evolve and determinism is non-trivial.
// T=200, theta_del = 8, 20 trials, seeds 33001..33020, world sigma = kernel
// default log2(3).
// DELIVERY METER (amendment 1, receipted before runs): the kernel emits twin
// hits as events {kind:'twin', x, y, slot, resonance, term} [R2/R3] and keeps
// no per-cell imaginary accumulator; the harness accumulates
//   imag[x,y] += term   over the event stream
// — the cumulative imaginary channel of that cell in the SPEC L0 sense. A
// member DELIVERS at the first tick its meter >= 8; a PAIR delivers at the
// max of its members' first-delivery ticks; a pair BRIDGES at the first tick
// either member receives any twin event.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, kernelReport } from './_adapter.mjs';
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

// One paired-arm run on a freshly built substrate.
function runArm(seedFn, pairs, wormholes) {
  let sub = makeSubstrate(64, 64, seedFn);
  const meter = new Float64Array(64 * 64);
  const memberPair = new Map(); // cell idx -> {pairId, member}
  for (const p of pairs) {
    memberPair.set(p.a.y * 64 + p.a.x, { pairId: p.pairId, member: 'a' });
    memberPair.set(p.b.y * 64 + p.b.x, { pairId: p.pairId, member: 'b' });
  }
  const firstExceed = new Map(); // cell idx -> tick
  const bridgeTick = new Array(K).fill(null);
  const hashes = [planeHash(sub, 0, bytePlane)];
  let events = 0;

  for (let t = 1; t <= T; t++) {
    sub = tick(sub, { wormholes }); // real kernel: returns NEXT substrate [R5]
    for (const ev of sub.lastEvents) {
      const idx = ev.y * 64 + ev.x;
      const who = memberPair.get(idx);
      if (who === undefined) throw new Error(`E-Q1: twin event at non-member cell (${ev.x},${ev.y}) — LOUD`);
      events++;
      meter[idx] += ev.term;
      if (bridgeTick[who.pairId] === null) bridgeTick[who.pairId] = t;
      if (!firstExceed.has(idx) && meter[idx] >= THETA) firstExceed.set(idx, t);
    }
    if (CHECKPOINTS.includes(t)) hashes.push(planeHash(sub, t, bytePlane));
  }

  const perPair = pairs.map((p, i) => {
    const ia = p.a.y * 64 + p.a.x, ib = p.b.y * 64 + p.b.x;
    const ta = firstExceed.has(ia) ? firstExceed.get(ia) : null;
    const tb = firstExceed.has(ib) ? firstExceed.get(ib) : null;
    return {
      pairId: p.pairId, d: p.d, a: p.a, b: p.b,
      aDeliver: ta, bDeliver: tb,
      pairDeliver: ta !== null && tb !== null ? Math.max(ta, tb) : null,
      bridgeTick: bridgeTick[i],
      aMeter: q(meter[ia]), bMeter: q(meter[ib]),
      aFinalD: sub[ia] & 63, bFinalD: sub[ib] & 63,
    };
  });
  const delivered = perPair.filter((p) => p.pairDeliver !== null).length;
  return { hashes, perPair, delivered, events };
}

function median(a) { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

// ---------------------------------------------------------------- trials ---
const trials = [];
for (let i = 0; i < TRIALS; i++) {
  const seed = BASE_SEED + i;
  const { seedFn, pairs } = buildTrial(seed);

  const on = runArm(seedFn, pairs, true);
  const off = runArm(seedFn, pairs, false);
  const rerunOn = runArm(seedFn, pairs, true);
  const rerunOff = runArm(seedFn, pairs, false);
  const detOk = JSON.stringify(on.hashes) === JSON.stringify(rerunOn.hashes)
    && JSON.stringify(off.hashes) === JSON.stringify(rerunOff.hashes)
    && on.hashes[on.hashes.length - 1] === rerunOn.hashes[rerunOn.hashes.length - 1];

  // F1 control: same seed, NO Abstain cells planted, both flags
  const { weather } = buildTrial(seed);
  const cSeedFn = seedFnFrom([], weather);
  const cOn = runArm(cSeedFn, [], true);
  const cOff = runArm(cSeedFn, [], false);
  const controlEqual = JSON.stringify(cOn.hashes) === JSON.stringify(cOff.hashes);

  // somatic fingerprint of the wormhole on the byte plane (data, not gate —
  // R3 couples twin terms into pressure, so ON/OFF planes are expected to
  // diverge; first checkpoint where they do is receipted as a finding)
  let somaticAt = null;
  for (let c = 0; c < on.hashes.length; c++) {
    if (on.hashes[c] !== off.hashes[c]) { somaticAt = CHECKPOINTS[c]; break; }
  }

  trials.push({ seed, on: on.perPair, off: off.perPair, onDelivered: on.delivered, offDelivered: off.delivered,
    onEvents: on.events, offEvents: off.events, detOk, controlEqual, somaticAt, hashesOn: on.hashes, hashesOff: off.hashes });
  console.log(`[e-q1] trial ${i + 1}/${TRIALS} seed=${seed} ON=${on.delivered}/${K} (ev=${on.events}) OFF=${off.delivered}/${K} (ev=${off.events}) det=${detOk} ctrl=${controlEqual} somatic@${somaticAt}`);
}

// ------------------------------------------------------------- aggregates ---
const onDelivered = trials.map((t) => t.onDelivered);
const offDelivered = trials.map((t) => t.offDelivered);
const onMedian = median(onDelivered);
const offAny = offDelivered.some((d) => d !== 0);
const allDet = trials.every((t) => t.detOk);
const allControl = trials.every((t) => t.controlEqual);

const F0 = allDet, F1 = allControl, F2 = !offAny;
const F3 = onMedian >= K / 2;
const verdict = !F0 ? 'VOID(determinism)' : !(F1 && F2) ? 'FLOOR-BROKEN(autopsy)' : F3 ? 'C2 LIVES' : 'C2 DIES (honest null)';

console.log(`[e-q1] ON median=${onMedian} K/2=${K / 2} | OFF any=${offAny} | det=${allDet} ctrl=${allControl} => ${verdict}`);

// ----------------------------------------------------------------- outputs ---
writeFileSync(join(OUT, 'e_q1_results.json'), JSON.stringify({
  experiment: 'E-Q1', claim: 'C2', kernel: kernelReport(), stonePath, preRegSha,
  task: { w: 64, h: 64, K, T, theta_del: THETA, trials: TRIALS, baseSeed: BASE_SEED, sigma: 'kernel default log2(3)' },
  trials, aggregates: { onDelivered, offDelivered, onMedian: q(onMedian), offAnyDelivery: offAny, allDet, allControl, verdict },
}, null, 1));

// ---------------------------------------------------------------- receipts ---
const rows = [
  { kind: 'rules.EQ1', frozen_by: 'experiments/pre_registration.json (committed before runs)', pre_reg_sha256: preRegSha,
    floors: 'F0 determinism 40/40; F1 control ON==OFF 20/20; F2 OFF delivers 0 in 20/20; F3 C2 LIVES iff ON median >= 4/8 within T=200 and F2 holds',
    meter: 'amendment 1: cumulative per-cell sum of twin-event terms (kernel keeps no imag accumulator); OFF meter is identically 0' },
  { kind: 'run.config', experiment: 'E-Q1', kernel: kernelReport(), stone_linked: stonePath,
    contract: 'tick(substrate,{wormholes}) returns next substrate [R5]; toroidal Moore-8 [R1]; live wormhole reads [R2]; sigma=log2(3) default',
    task: '64x64, K=8 Abstain pairs d=8..15, toroidal pair sep >= 24, cross >= 8, 3 weather cells, T=200, theta=8, seeds 33001..33020, paired arms ON/OFF + no-Abstain control' },
];
for (const t of trials) {
  rows.push({ kind: 'result.trial', experiment: 'E-Q1', seed: t.seed,
    onDelivered: t.onDelivered, offDelivered: t.offDelivered, K,
    onPairDeliverTicks: t.on.map((p) => q(p.pairDeliver)),
    offPairDeliverTicks: t.off.map((p) => q(p.pairDeliver)),
    onEvents: t.onEvents, offEvents: t.offEvents,
    determinism: t.detOk, controlClean: t.controlEqual, somaticDivergenceTick: t.somaticAt,
    finalPlaneHashON: t.hashesOn[t.hashesOn.length - 1] });
}
rows.push({ kind: 'result.determinism', experiment: 'E-Q1', rerunRuns: 4 * TRIALS, mismatches: allDet ? 0 : trials.filter((t) => !t.detOk).length });
rows.push({ kind: 'verdict.EQ1', experiment: 'E-Q1', F0, F1, F2, F3, onMedian: q(onMedian), offAnyDelivery: offAny, kernelKind, verdict });

const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q1', claim: 'C2' });
console.log(`[e-q1] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q1_tip.txt'), `${v.tip} links=${v.links}\n`);
