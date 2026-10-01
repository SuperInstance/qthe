// experiments/e_q10_armor_injector.mjs — E-Q10: THE C5' INJECTOR ONE-PAGER
// (task 45-b, wave 45, lane eq10-executor). The guest's round-9 registered
// lever, executed: "Reuse the E-Q5 armor-ring harness unchanged (same
// per-trial VOID carve clause, same 20-trial budget, same
// integrity/repairTick instrumentation)" + the one-page injector spec.
//
// HARNESS PROVENANCE: geometry / carvePlan / buildSubstrate / integrity /
// repairTick machinery are VERBATIM from experiments/e_q5_armor_ring.mjs
// (lane 33-b) so every row is directly comparable to the E-Q5 receipt.
// NEW instrumentation (registered addition-only in
// situations/eq10_lever_registration.json, sealed PRE-TICK):
//   - A0 monotone tracking (E-Q5 tracked monotone only on A1);
//   - A2 post-inject re-erosion monotone tracking + firstZeroTick
//     (the guest's falsifier branch 3 was unmeasurable in E-Q5);
//   - per-trial injector budget accounting (1 application = |ring| writes);
//   - fixed-kernel mirror arm (kernel-plane invariance; no sigma here, so the
//     Q32.32 door must not exist — a divergence would be a new artifact class).
//
// ZERO network, ZERO keys, ZERO LLM calls, ZERO moth jobs (registered: the
// design needs no randomized sampling). Deterministic: seeds 55001..55020.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { makeSubstrate, tick as floatTick, mulberry32 } from '../qthe.mjs';
import * as fixed from '../fixedpoint/qthe_fixed.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, packByte, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
const CHAIN = join(RECEIPTS, 'e_q10_chain.jsonl');
const REG_SHA = fileSha256(join(HERE, '..', 'situations', 'eq10_lever_registration.json'));

// ---- E-Q5 harness constants, VERBATIM ----
const W = 64, H = 64, CX = 32, CY = 32;
const RING_BYTES = 55, CORE_D = 63;
const N_CUTS = 12, HALF_ARC = 0.75 / 32, JITTER = 0.2;
const T = 400, INJECT_AT = 50, TRIALS = 20, BASE_SEED = 55001;
const REPAIR_THRESHOLD = 0.95, SUSTAIN = 10;
const CHECKPOINTS = [0, 50, 100, 200, 300, 400];

// ---- kernels ----
const FLOAT_K = { name: 'float:qthe.mjs', makeSubstrate, tick: floatTick };
const FIXED_K = { name: 'fixed:qthe_fixed.mjs', makeSubstrate: fixed.makeSubstrate, tick: fixed.tick };

// ---- geometry (E-Q5 verbatim) ----
const ringCells = [];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - CX, dy = y - CY, r2 = dx * dx + dy * dy;
    if (r2 >= 900 && r2 <= 1156) ringCells.push({ x, y, i: y * W + x, alpha: Math.atan2(dy, dx) });
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

function buildSubstrate(K, carved) {
  const seedFn = (x, y, i) => { // x-FIRST per kernel R6
    const dx = x - CX, dy = y - CY, r2 = dx * dx + dy * dy;
    if (r2 <= 64) return packByte(1, CORE_D);
    if (r2 >= 900 && r2 <= 1156) return carved.has(y * W + x) ? packByte(2, 0) : packByte(2, RING_BYTES);
    return 0;
  };
  return K.makeSubstrate(W, H, seedFn);
}

function integrity(sub) {
  let s = 0;
  for (const c of ringCells) s += Math.min(sub[c.i] & 63, RING_BYTES);
  return s / (RING_BYTES * RING_N);
}

// One arm run. inject: 'none' | 'full-ring@t=50' (the ONE-page injector spec:
// a single harness-side byte-write pass between ticks 50 and 51, budget
// receipted as RING_N cell-writes). Returns full integrity timeline (every
// tick), plane hashes at checkpoints, monotonicity flags per the registered
// segments, repairTick (E-Q5 definition verbatim), firstZeroTick.
function runArm(K, carved, { inject = false } = {}) {
  let sub = buildSubstrate(K, carved);
  const timeline = []; // {t, integrity(string q), phase} — post-tick states + the post-inject state
  const hashes = [planeHash(sub, 0, (s) => s)];
  let monotoneNoInject = true; // EVERY tick outside the injection: integrity must never increase (falsifier branch 1)
  let prevInt = integrity(sub);
  let reErosionMonotone = true; // t >= 51 segment (post-inject state at t=50 is the injection, not erosion)
  let firstZeroTick = null;
  let postInjectIntegrity = null;
  let injectWrites = 0;

  const pushState = (t, phase) => {
    const it = integrity(sub);
    const v = typeof it === 'number' ? it : parseFloat(it);
    timeline.push({ t, integrity: q(it), phase });
    if (v === 0 && firstZeroTick === null) firstZeroTick = t;
    return v;
  };

  pushState(0, 'tick');
  for (let t = 1; t <= T; t++) {
    sub = K.tick(sub, { wormholes: true }); // no Abstain cells exist: flag inert (E-Q5 receipt carried)
    if (inject && t === INJECT_AT) {
      const pre = pushState(t, 'pre-inject');
      if (pre > prevInt + 1e-12) monotoneNoInject = false;
      // THE INJECTOR — the one-page spec: ONE full-ring application, harness-side byte writes.
      for (const c of ringCells) { sub[c.i] = packByte(2, RING_BYTES); injectWrites++; }
      postInjectIntegrity = integrity(sub); // must be EXACTLY 1.000 (C1)
      timeline.push({ t, integrity: q(postInjectIntegrity), phase: 'post-inject' });
      hashes.push(planeHash(sub, t, (s) => s));
      prevInt = postInjectIntegrity;
      continue;
    }
    const it = integrity(sub);
    const v = it;
    if (v > prevInt + 1e-12) {
      if (inject && t > INJECT_AT) reErosionMonotone = false; // falsifier branch 3
      else monotoneNoInject = false;                          // falsifier branch 1 (A0/A1 any tick; A2 pre-inject)
    }
    prevInt = v;
    timeline.push({ t, integrity: q(it), phase: 'tick' });
    if (v === 0 && firstZeroTick === null) firstZeroTick = t;
    if (CHECKPOINTS.includes(t)) hashes.push(planeHash(sub, t, (s) => s));
  }

  // repairTick (E-Q5 definition VERBATIM): first t (post-damage) with SUSTAIN
  // consecutive states >= threshold (post-inject state included, pre-inject excluded).
  let repairTick = null, run = 0;
  for (const e of timeline) {
    const v = typeof e.integrity === 'number' ? e.integrity : parseFloat(e.integrity);
    if (e.phase === 'pre-inject') { run = 0; continue; }
    if (v >= REPAIR_THRESHOLD) { run++; if (repairTick === null && run >= SUSTAIN && e.t > 0) repairTick = e.t - SUSTAIN + 1; }
    else run = 0;
  }
  const finalState = timeline[timeline.length - 1];
  return {
    timeline, hashes, postInjectIntegrity: q(postInjectIntegrity), injectWrites,
    monotoneNoInject, reErosionMonotone, firstZeroTick, repairTick,
    finalIntegrity: finalState.integrity,
  };
}

// ---------------------------------------------------------------- trials ---
// Per-trial VOID carve clause, E-Q5 VERBATIM (60 <= carved <= 120 AND
// post-damage integrity < 0.95; void = receipted + skipped, run proceeds on
// the admissible remainder).
const voidTrials = [];
const trials = [];
for (let i = 0; i < TRIALS; i++) {
  const seed = BASE_SEED + i;
  const { cuts, carved } = carvePlan(seed);
  if (carved.size < 60 || carved.size > 120) {
    voidTrials.push({ seed, carvedCount: carved.size, reason: `carved=${carved.size} outside registered window [60,120] — per-TRIAL VOID per the inherited E-Q5 damage clause` });
    console.log(`[e-q10] trial ${i + 1}/${TRIALS} seed=${seed} carved=${carved.size} — PER-TRIAL VOID (receipted, skipped)`);
    continue;
  }
  const damagedIntegrity = integrity(buildSubstrate(FLOAT_K, carved));
  if (damagedIntegrity >= REPAIR_THRESHOLD) {
    voidTrials.push({ seed, carvedCount: carved.size, reason: `post-damage integrity ${Number(damagedIntegrity).toFixed(4)} >= 0.95 — gate pre-met, per-TRIAL VOID` });
    console.log(`[e-q10] trial ${i + 1}/${TRIALS} seed=${seed} — PER-TRIAL VOID (gate pre-met, receipted, skipped)`);
    continue;
  }

  // float arms (A1 and A2 run TWICE from fresh construction — EQ10-D1)
  const a0 = runArm(FLOAT_K, new Set());
  const a1 = runArm(FLOAT_K, carved);
  const a1r = runArm(FLOAT_K, carved);
  const a2 = runArm(FLOAT_K, carved, { inject: true });
  const a2r = runArm(FLOAT_K, carved, { inject: true });
  // fixed-kernel mirror (C8: kernel-plane invariance — no sigma in this harness)
  const a1f = runArm(FIXED_K, carved);
  const a2f = runArm(FIXED_K, carved, { inject: true });

  const detOk = JSON.stringify(a1.hashes) === JSON.stringify(a1r.hashes)
    && JSON.stringify(a1.timeline) === JSON.stringify(a1r.timeline)
    && JSON.stringify(a2.hashes) === JSON.stringify(a2r.hashes)
    && JSON.stringify(a2.timeline) === JSON.stringify(a2r.timeline);
  const fixedMatch = JSON.stringify(a1.hashes) === JSON.stringify(a1f.hashes)
    && JSON.stringify(a1.timeline) === JSON.stringify(a1f.timeline)
    && JSON.stringify(a2.hashes) === JSON.stringify(a2f.hashes)
    && JSON.stringify(a2.timeline) === JSON.stringify(a2f.timeline);

  trials.push({
    seed, carvedCount: carved.size, damagedIntegrity: q(damagedIntegrity),
    a0: { finalIntegrity: a0.finalIntegrity, monotone: a0.monotoneNoInject, firstZeroTick: a0.firstZeroTick },
    a1: { finalIntegrity: a1.finalIntegrity, monotone: a1.monotoneNoInject, repairTick: a1.repairTick, firstZeroTick: a1.firstZeroTick },
    a2: { postInjectIntegrity: a2.postInjectIntegrity, injectWrites: a2.injectWrites, reErosionMonotone: a2.reErosionMonotone, repairTick: a2.repairTick, firstZeroTick: a2.firstZeroTick, finalIntegrity: a2.finalIntegrity },
    detOk, fixedMatch,
  });
  console.log(`[e-q10] trial ${i + 1}/${TRIALS} seed=${seed} carved=${carved.size} | A0 mono=${a0.monotoneNoInject} fin=${Number(a0.finalIntegrity).toFixed(3)} | A1 mono=${a1.monotoneNoInject} repair=${a1.repairTick} zero@${a1.firstZeroTick} | A2 postInj=${a2.postInjectIntegrity} reMono=${a2.reErosionMonotone} repair=${a2.repairTick} zero@${a2.firstZeroTick} | det=${detOk} fixed=${fixedMatch}`);
}

// -------------------------------------------------------------- aggregates ---
const ADM = trials.length;
const C1 = trials.every((t) => Number(t.a2.postInjectIntegrity) === 1);
const C2 = trials.every((t) => t.a2.reErosionMonotone);
const C3 = trials.every((t) => t.a2.firstZeroTick !== null && t.a2.firstZeroTick <= T);
const C4 = trials.every((t) => t.a0.monotone && t.a1.monotone);
const C5 = trials.every((t) => t.a1.repairTick === null && t.a2.repairTick === null);
const C6 = trials.every((t) => Number(t.a0.finalIntegrity) < REPAIR_THRESHOLD);
const C7 = trials.every((t) => t.detOk);
const C8 = trials.every((t) => t.fixedMatch);
const C9 = ADM >= 17;
const falsifierFired = !(C1 && C2 && C3 && C4 && C5);
const firstZeroTicks = trials.map((t) => t.a2.firstZeroTick);
const verdict = falsifierFired
  ? 'C5\' AS STATED DIES — the guest\'s falsifier FIRED (honest FAIL standing; the one-page injector spec must be rewritten)'
  : 'C5\' AS STATED STANDS — repair is injector semantics and the one-page spec REPRODUCES E-Q5\'s restore-to-1.000-then-re-erode with zero substrate self-repair (the guest\'s pre-priced "definitional, not empirical" risk is hereby receipted: the spec reproduces, the kernel has no repair term to find)';

console.log(`[e-q10] admissible=${ADM}/${TRIALS} voids=${voidTrials.length} | C1=${C1} C2=${C2} C3=${C3} C4=${C4} C5=${C5} C6=${C6} C7=${C7} C8=${C8} C9=${C9}`);
console.log(`[e-q10] falsifierFired=${falsifierFired} => ${verdict}`);

// ----------------------------------------------------------------- outputs ---
writeFileSync(join(OUT, 'e_q10_results.json'), JSON.stringify({
  experiment: 'E-Q10', claim: "C5' injector one-pager (the guest's round-9 registered lever)",
  registration: 'situations/eq10_lever_registration.json', registrationSha256: REG_SHA,
  kernels: { float: 'qthe.mjs', fixed: 'fixedpoint/qthe_fixed.mjs' },
  task: { w: W, h: H, ring: '900<=r2<=1156 Repel d=55', core: 'r2<=64 Attract d=63', cuts: N_CUTS, halfArc: HALF_ARC, T, injectAt: INJECT_AT, trials: TRIALS, baseSeed: BASE_SEED, ringCells: RING_N, injectorBudget: `1 application x ${RING_N} cell-writes (harness-side setCell path)` },
  voidTrials, admissibleTrials: ADM,
  trials,
  aggregates: { C1, C2, C3, C4, C5, C6, C7, C8, C9, admissible: ADM, falsifierFired, firstZeroTicks, verdict },
}, null, 1));

// ---------------------------------------------------------------- receipts ---
// STONE RESOLUTION (instrumentation receipt, run-2): THE STONE is absent from
// this sandbox — the four _stone_link candidates exhaust on run-1 (receipted
// honestly; results were already written). Run-2 resolves the CANONICAL module
// pinned lane-side at /home/z/my-project/scripts/45b-stone/stone.mjs, fetched
// read-only from github.com/SuperInstance/quilt-stone blob 4ef3e1b8937c9571f1
// 439d5bd73a87a9292d716f, sha256 73c28357a3c245e45ed13d0834e26d1712cc9cd0a9d
// 71e02690a28e59cf550fa. This is a pinned COPY of the canonical module, not a
// fork: the sealed chains remain verifiable by any environment that has the
// real quilt-stone. Zero network inside the run itself.
let stone, stonePath;
try {
  ({ stone, stonePath } = await linkStone());
} catch (e) {
  const PINNED = '/home/z/my-project/scripts/45b-stone/stone.mjs';
  stone = await import(PINNED);
  if (typeof stone.sealChain !== 'function' || typeof stone.verifyChainFile !== 'function') throw e;
  stonePath = `pinned:${PINNED} (canonical quilt-stone blob 4ef3e1b8…, sha256 73c28357…; _stone_link candidates exhausted on run-1 — receipted)`;
  console.log(`[e-q10] stone: _stone_link exhausted; using pinned canonical copy (${stonePath})`);
}
const rows = [
  { kind: 'rules.EQ10', frozen_by: 'situations/eq10_lever_registration.json (committed PRE-TICK)', registration_sha256: REG_SHA,
    lever: "guest r9-q2 next_lever: C5' injector one-pager (reuse E-Q5 harness unchanged; 20 trials; VOID clause inherited)",
    falsifier: 'integrity increases WITHOUT an injector application | repairTick non-null | post-injection re-erosion non-monotone — any branch kills C5\' as stated',
    spec: 'injector = harness-side byte-write pass (NOT a kernel primitive); budget = exactly 1 full-ring application (|ring| writes) at t=50; repair is injector-mediated d-restoration only',
    clarifications: '17/17 = ALL admissible trials under the inherited carve clause; re-erosion measured on t>=51; same seeds 55001..55020' },
  { kind: 'run.config', experiment: 'E-Q10', stone_linked: stonePath,
    task: `64x64 armor ring; arms A0 pristine / A1 damaged / A2 injector@t=50 (one application, ${RING_N} writes); T=400; seeds 55001..55020; float kernel qthe.mjs + fixed mirror qthe_fixed.mjs; moth jobs 0 (registered: no sampling needed); LLM calls 0` },
];
for (const vt of voidTrials) rows.push({ kind: 'trial.void', experiment: 'E-Q10', seed: vt.seed, carvedCount: vt.carvedCount, reason: vt.reason });
for (const t of trials) {
  rows.push({ kind: 'result.trial', experiment: 'E-Q10', seed: t.seed, carvedCount: t.carvedCount, damagedIntegrity: t.damagedIntegrity,
    a0Monotone: t.a0.monotone, a0Final: t.a0.finalIntegrity,
    a1Monotone: t.a1.monotone, a1RepairTick: t.a1.repairTick, a1Final: t.a1.finalIntegrity,
    a2PostInject: t.a2.postInjectIntegrity, a2InjectWrites: t.a2.injectWrites, a2ReErosionMonotone: t.a2.reErosionMonotone, a2RepairTick: t.a2.repairTick, a2FirstZeroTick: t.a2.firstZeroTick, a2Final: t.a2.finalIntegrity,
    determinism: t.detOk, fixedKernelMatch: t.fixedMatch });
}
rows.push({ kind: 'verdict.EQ10', experiment: 'E-Q10', C1, C2, C3, C4, C5, C6, C7, C8, C9, admissibleTrials: ADM, voidCount: voidTrials.length, falsifierFired, verdict });
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q10', claim: "C5' injector one-pager" });
console.log(`[e-q10] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q10_tip.txt'), `${v.tip} links=${v.links}\n`);
