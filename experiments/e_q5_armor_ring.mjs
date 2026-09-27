// experiments/e_q5_armor_ring.mjs — E-Q5: THE ARMOR RING (claim C5): the
// substrate self-repairs? Lane 33-b (field-smith). Runs on the REAL kernel
// (qthe.mjs, commit 492333e) via _adapter.mjs.
//
// INTERPRETATION DECISION (sealed in pre_registration.json BEFORE runs):
// SPEC tick() never changes timbre (qthe.mjs honors this: "tau NEVER changes
// here"), so a timbre-flipped cell cannot repair under any reading. C5 is
// therefore priced on d-DEPLETION damage (d -> 0, tau kept at Repel) — the
// claim's fair reading. Timbre repair would require an injector by
// construction. This decision is itself receipted.
//
// GEOMETRY (amendment 1): 64x64, center (32,32), unwrapped Euclidean r2 =
// dx*dx + dy*dy; ring = Repel(d=55) on 900 <= r2 <= 1156 (r in [30, 34]);
// core = Attract(d=63) on r2 <= 64 (r <= 8); else Ground(0).
//
// DAMAGE (sealed): N=12 thin cuts; cut i centered at angle 2*pi*i/12 +
// jitter(U[-0.2, 0.2] rad) from the trial seed; a ring cell is carved iff its
// angular distance to a cut center < 0.75/32 rad (half-arc 0.75 cells, full
// radial thickness); carved cells set to d=0, tau=2 kept. ASSERT per trial:
// 60 <= carved <= 120 AND post-damage integrity < 0.95 (else the trial design
// is VOID — the 95% gate must be breachable to be meaningful).
//
// ARMS (sealed): A0 pristine control (detects SELF-EROSION of an undamaged
// ring); A1 damaged, 400 ticks; A2 damaged + at t=50 ALL ring cells injected
// back to d=55 via setCell (the 'repair requires an injector' reading).
//
// METRICS: integrity(t) = sum(min(d,55) over ring) / (55*|ring|);
// repairTick = first t with integrity >= 0.95 SUSTAINED 10 consecutive ticks
// (null if never); carvedRestoration(t); newlyDepleted(t) = ring cells (not
// carved) with d < 55; halfErosionTick = first t with integrity <= 0.5.
//
// HONEST EXPECTATION (sealed BEFORE runs — pre_registration.json):
//  P1 A1: integrity NON-INCREASING, repairTick = null in 20/20 (a carved Repel
//     cell is surrounded by Repel -> net-negative pressure -> d toward 0,
//     never toward 55; no positive source near the ring);
//  P2 A0: the PRISTINE ring also self-erodes (every ring cell is surrounded
//     by like-timbre Repel) — integrity crosses 0.95 within a few ticks,
//     reaches ~0 by ~55; if pristine instead HOLDS, the kernel shields
//     own-cells from like-timbre pressure and the autopsy follows;
//  P3 A2: injected repair does NOT hold (re-erosion) unless P2's shielding
//     exists (then verdict = injector-only repair).
//  FALSIFIER: any arm reaching sustained >= 0.95 after damage WITHOUT
//  injection => C5 LIVES with a mechanism-level explanation.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, setCell, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, packByte, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });

const W = 64, H = 64, CX = 32, CY = 32;
const RING_BYTES = 55, CORE_D = 63;
const N_CUTS = 12, HALF_ARC = 0.75 / 32, JITTER = 0.2;
const T = 400, INJECT_AT = 50, TRIALS = 20, BASE_SEED = 55001;
const CHECKPOINTS = [0, 50, 100, 200, 300, 400];
const REPAIR_THRESHOLD = 0.95, SUSTAIN = 10;
const CHAIN = join(RECEIPTS, 'e_q5_chain.jsonl');

const { stone, stonePath } = await linkStone();
const { kernelKind } = await loadKernel();
console.log(`[e-q5] kernel=${kernelKind} stone=${stonePath}`);
const preRegSha = existsSync(join(HERE, 'pre_registration.json')) ? fileSha256(join(HERE, 'pre_registration.json')) : null;
const amendSha = existsSync(join(HERE, 'pre_registration_amendment_1.json')) ? fileSha256(join(HERE, 'pre_registration_amendment_1.json')) : null;

// ---- geometry (exact integers for membership; floats only for cut angles) --
const ringCells = [], coreCells = [];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - CX, dy = y - CY, r2 = dx * dx + dy * dy;
    if (r2 <= 64) coreCells.push({ x, y, i: y * W + x, alpha: Math.atan2(dy, dx) });
    else if (r2 >= 900 && r2 <= 1156) ringCells.push({ x, y, i: y * W + x, alpha: Math.atan2(dy, dx) });
  }
}
const RING_N = ringCells.length;

function carvePlan(seed) {
  const rng = mulberry32(seed);
  const cuts = [];
  for (let i = 0; i < N_CUTS; i++) cuts.push((2 * Math.PI * i) / N_CUTS + (rng() * 2 - 1) * JITTER);
  const carved = new Set();
  for (const c of ringCells) {
    for (const th of cuts) {
      const delta = Math.atan2(Math.sin(c.alpha - th), Math.cos(c.alpha - th));
      if (Math.abs(delta) < HALF_ARC) { carved.add(c.i); break; }
    }
  }
  return { cuts, carved };
}

function buildSubstrate(carved) {
  const seedFn = (x, y, i) => { // x-FIRST per kernel R6
    const dx = x - CX, dy = y - CY, r2 = dx * dx + dy * dy;
    if (r2 <= 64) return packByte(1, CORE_D);
    if (r2 >= 900 && r2 <= 1156) return carved.has(y * W + x) ? packByte(2, 0) : packByte(2, RING_BYTES);
    return 0;
  };
  return makeSubstrate(W, H, seedFn);
}

function integrity(sub) {
  let s = 0;
  for (const c of ringCells) s += Math.min(sub[c.i] & 63, RING_BYTES);
  return s / (RING_BYTES * RING_N);
}

function runArm(carved, { inject = false } = {}) {
  let sub = buildSubstrate(carved);
  const timeline = []; // {t, integrity, phase} — post-tick states
  const hashes = [planeHash(sub, 0, bytePlane)];
  const depletedAt = {}; // checkpoint -> newly depleted (not carved) count
  const carvedRestoredAt = {};
  const countDepleted = (s) => ringCells.reduce((n, c) => n + (!carved.has(c.i) && (s[c.i] & 63) < RING_BYTES ? 1 : 0), 0);
  const countRestored = (s) => ringCells.reduce((n, c) => n + (carved.has(c.i) && (s[c.i] & 63) >= RING_BYTES ? 1 : 0), 0);
  let postInjectIntegrity = null;
  let monotone = true, prevInt = integrity(sub);

  depletedAt[0] = countDepleted(sub);
  carvedRestoredAt[0] = countRestored(sub);
  for (let t = 1; t <= T; t++) {
    sub = tick(sub, { wormholes: true }); // no Abstain cells exist: flag is inert, receipted
    if (inject && t === INJECT_AT + 1) {
      // injected state was written AFTER tick INJECT_AT; record it, then this
      // tick has already consumed one erosion step — see timeline phases below
    }
    if (inject && t === INJECT_AT) {
      // capture post-tick-50 state, then inject between ticks (setCell path)
      hashes.push(planeHash(sub, t, bytePlane));
      timeline.push({ t, integrity: q(integrity(sub)), phase: 'pre-inject' });
      for (const c of ringCells) setCell(sub, c.x, c.y, packByte(2, RING_BYTES));
      postInjectIntegrity = q(integrity(sub));
      timeline.push({ t, integrity: postInjectIntegrity, phase: 'post-inject' });
      prevInt = integrity(sub);
      continue;
    }
    const it = integrity(sub);
    if (it > prevInt + 1e-12 && !inject) monotone = false; // A1 must be non-increasing
    prevInt = it;
    timeline.push({ t, integrity: q(it), phase: 'tick' });
    if (CHECKPOINTS.includes(t)) hashes.push(planeHash(sub, t, bytePlane));
    if (CHECKPOINTS.includes(t)) { depletedAt[t] = countDepleted(sub); carvedRestoredAt[t] = countRestored(sub); }
  }

  // repairTick: first t (post-damage) with SUSTAIN consecutive >= threshold
  let repairTick = null, bestRun = 0, run = 0, halfErosion = null;
  for (const e of timeline) {
    const v = typeof e.integrity === 'number' ? e.integrity : parseFloat(e.integrity);
    if (halfErosion === null && v <= 0.5 && e.phase !== 'pre-inject') halfErosion = e.phase === 'post-inject' ? `${e.t}(post-inject)` : e.t;
    if (v >= REPAIR_THRESHOLD) { run++; bestRun = Math.max(bestRun, run); if (repairTick === null && run >= SUSTAIN && e.t > 0) repairTick = e.t - SUSTAIN + 1; }
    else run = 0;
  }
  const finalIntegrity = timeline[timeline.length - 1].integrity;
  return { hashes, timeline, depletedAt, carvedRestoredAt, postInjectIntegrity, monotone, repairTick, bestRun, halfErosion, finalIntegrity };
}

function median(a) { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

// ---------------------------------------------------------------- trials ---
// HARNESS NOTE (receipted at run time, pre-run floor UNTOUCHED): the sealed
// damage clause is per-TRIAL — "ASSERT per trial: 60 <= carved <= 120 AND
// post-damage integrity < 0.95 (else the trial design is VOID)". A void
// seed is therefore receipted loudly and SKIPPED, and the run proceeds on
// the admissible remainder; the original draft aborted the whole experiment
// on the first void, which misreads the registered clause (harness defect,
// fixed here — kernel untouched). Side-effect finding: amendment 1's claim
// that the [60,120] window is "safely met on every seed" is falsified by
// arithmetic (seeds 55003/55012/55016 carve 57/58/59) — recorded, floors
// unchanged, no post-run edits.
const voidTrials = [];
const trials = [];
for (let i = 0; i < TRIALS; i++) {
  const seed = BASE_SEED + i;
  const { cuts, carved } = carvePlan(seed);
  if (carved.size < 60 || carved.size > 120) {
    const reason = `carved=${carved.size} outside registered window [60,120] — per-TRIAL VOID per pre_registration.json damage clause`;
    voidTrials.push({ seed, carvedCount: carved.size, reason });
    console.log(`[e-q5] trial ${i + 1}/${TRIALS} seed=${seed} carved=${carved.size} — PER-TRIAL VOID (receipted, skipped)`);
    continue;
  }
  const damagedIntegrity = integrity(buildSubstrate(carved));
  if (damagedIntegrity >= REPAIR_THRESHOLD) {
    const reason = `post-damage integrity ${Number(damagedIntegrity).toFixed(4)} >= 0.95 — gate pre-met, per-TRIAL VOID per pre_registration.json damage clause`;
    voidTrials.push({ seed, carvedCount: carved.size, reason });
    console.log(`[e-q5] trial ${i + 1}/${TRIALS} seed=${seed} — PER-TRIAL VOID (gate pre-met, receipted, skipped)`);
    continue;
  }

  const a0 = runArm(new Set());
  const a1 = runArm(carved);
  const a1r = runArm(carved);
  const detOk = JSON.stringify(a1.hashes) === JSON.stringify(a1r.hashes);
  const a2 = runArm(carved, { inject: true });

  trials.push({ seed, carvedCount: carved.size, damagedIntegrity: q(damagedIntegrity), cuts: cuts.map(q),
    a0: { finalIntegrity: a0.finalIntegrity, halfErosion: a0.halfErosion, timeline: a0.timeline, hashes: a0.hashes },
    a1: { finalIntegrity: a1.finalIntegrity, repairTick: a1.repairTick, bestRun: a1.bestRun, monotone: a1.monotone, halfErosion: a1.halfErosion, depletedAt: a1.depletedAt, carvedRestoredAt: a1.carvedRestoredAt, timeline: a1.timeline, hashes: a1.hashes },
    a2: { finalIntegrity: a2.finalIntegrity, repairTick: a2.repairTick, bestRun: a2.bestRun, postInjectIntegrity: a2.postInjectIntegrity, halfErosion: a2.halfErosion, depletedAt: a2.depletedAt, carvedRestoredAt: a2.carvedRestoredAt, timeline: a2.timeline },
    detOk });
  console.log(`[e-q5] trial ${i + 1}/${TRIALS} seed=${seed} carved=${carved.size} int0=${Number(damagedIntegrity).toFixed(3)} | A0 final=${Number(a0.finalIntegrity).toFixed(3)} half@${a0.halfErosion} | A1 repair=${a1.repairTick} monotone=${a1.monotone} | A2 postInj=${Number(a2.postInjectIntegrity).toFixed(3)} repair=${a2.repairTick} det=${detOk}`);
}

// -------------------------------------------------------------- aggregates ---
const P1 = trials.every((t) => t.a1.repairTick === null && t.a1.monotone);
const P2 = trials.every((t) => Number(t.a0.finalIntegrity) < REPAIR_THRESHOLD);
const P3 = trials.every((t) => t.a2.repairTick === null);
const repairedWithoutInjection = trials.some((t) => t.a1.repairTick !== null);
const injectorHeld = trials.every((t) => t.a2.repairTick !== null);
const allDet = trials.every((t) => t.detOk);

let C5;
if (!allDet) C5 = 'VOID(determinism)';
else if (repairedWithoutInjection) C5 = 'C5 LIVES (repair without injection — mechanism autopsy required)';
else if (injectorHeld) C5 = 'C5 RESHAPED: injector-mediated repair ONLY; self-repair impossible under tick() (honest null for unassisted C5)';
else C5 = 'C5 DIES (honest null): no repair in any arm — ring is self-dissolving under like-timbre negative pressure';

console.log(`[e-q5] P1=${P1} P2=${P2} P3=${P3} det=${allDet} => ${C5}`);

// ----------------------------------------------------------------- outputs ---
writeFileSync(join(OUT, 'e_q5_results.json'), JSON.stringify({
  experiment: 'E-Q5', claim: 'C5', kernel: kernelReport(), stonePath, preRegSha, amendSha,
  task: { w: W, h: H, ring: '900<=r2<=1156 Repel d=55', core: 'r2<=64 Attract d=63', cuts: N_CUTS, halfArc: HALF_ARC, T, injectAt: INJECT_AT, trials: TRIALS, baseSeed: BASE_SEED, ringCells: RING_N },
  voidTrials, admissibleTrials: trials.length,
  trials, aggregates: { P1, P2, P3, allDet, repairedWithoutInjection, injectorHeld, C5,
    a1RepairTicks: trials.map((t) => t.a1.repairTick), a1FinalIntegrity: trials.map((t) => t.a1.finalIntegrity),
    a0HalfErosion: trials.map((t) => t.a0.halfErosion), a2HalfErosion: trials.map((t) => t.a2.halfErosion) },
}, null, 1));

// ---------------------------------------------------------------- receipts ---
const rows = [
  { kind: 'rules.EQ5', frozen_by: 'pre_registration.json + pre_registration_amendment_1.json (both committed before runs)', pre_reg_sha256: preRegSha, amend_sha256: amendSha,
    interpretation: 'd-DEPLETION damage only (timbre immutable in tick — fair reading of C5); floors: P1 A1 monotone non-increasing + repair null; P2 pristine self-erodes; P3 injected repair does not hold; falsifier = repair without injection => C5 LIVES',
    geometry: `ring ${RING_N} cells 900<=r2<=1156, core ${coreCells.length} cells r2<=64, 12 cuts half-arc 0.75 cells, carved window [60,120] asserted per trial, integrity gate < 0.95 asserted per trial` },
  { kind: 'run.config', experiment: 'E-Q5', kernel: kernelReport(), stone_linked: stonePath,
    task: '64x64 armor ring; arms A0 pristine / A1 damaged / A2 injector at t=50 (setCell path, substrate is Uint8Array [R5]); T=400; seeds 55001..55020; wormhole flag inert (no tau=3 cells) and receipted as such' },
];
for (const vt of voidTrials) {
  rows.push({ kind: 'trial.void', experiment: 'E-Q5', seed: vt.seed, carvedCount: vt.carvedCount, reason: vt.reason });
}
if (voidTrials.length > 0) {
  rows.push({ kind: 'finding.EQ5', experiment: 'E-Q5', finding: `amendment-1 side-claim 'carved window [60,120] safely met on every seed' is FALSIFIED by arithmetic: voidTrials=${JSON.stringify(voidTrials.map((v) => v.seed))}; the per-trial void clause of the base registration handled these seeds; floors untouched, no post-run edits; ${trials.length}/${TRIALS} trials admissible` });
}
for (const t of trials) {
  rows.push({ kind: 'result.trial', experiment: 'E-Q5', seed: t.seed, carvedCount: t.carvedCount, damagedIntegrity: t.damagedIntegrity,
    a0Final: t.a0.finalIntegrity, a0HalfErosion: q(t.a0.halfErosion),
    a1RepairTick: t.a1.repairTick, a1Monotone: t.a1.monotone, a1Final: t.a1.finalIntegrity, a1BestRun: t.a1.bestRun,
    a2PostInject: t.a2.postInjectIntegrity, a2RepairTick: t.a2.repairTick, a2Final: t.a2.finalIntegrity,
    determinism: t.detOk,
    finalPlaneHashA1: t.a1.hashes[t.a1.hashes.length - 1] });
}
rows.push({ kind: 'verdict.EQ5', experiment: 'E-Q5', P1, P2, P3, allDet, repairedWithoutInjection, injectorHeld, admissibleTrials: trials.length, voidCount: voidTrials.length, C5 });
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q5', claim: 'C5' });
console.log(`[e-q5] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q5_tip.txt'), `${v.tip} links=${v.links}\n`);
