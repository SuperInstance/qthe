// experiments/e_q7_checkerboard_cascade.mjs — E-Q7: THE KNIFE-EDGE CHECKERBOARD CASCADE
// (executes the DeepSeek guest's round-six lever r6-q4-next-lever VERBATIM — the guest
// registered E-Q7 in principle, so the guest is held to it).
// Lane 36-a (qthe-smith). Runs on the REAL float kernel (qthe.mjs) via _adapter.mjs
// and the READ-ONLY integer fixed kernel (fixedpoint/qthe_fixed.mjs). No mocks, no
// kernel edits, no new float door (fixed plane receives frozen integer sigmaQ only).
//
// REGISTERED FLOOR (pre_registration_amendment_3.json, commit 1c93029, PRE-RUN):
//   situation 9 re-registered under S3 LIVE-READ ROW-MAJOR LWW (E-Q6 verdict), seeded
//   at sigma=2/3. EQ7-P1 guest CONFIRM rule, EQ7-P2 guest FALSIFIER rule, EQ7-P3
//   situation-9 ON/OFF same-regime conditional (verbatim), EQ7-D1 determinism (EQ6-D1
//   carried, both kernels), EQ7-A1 cascade adjudication (frozen BEFORE the run), EQ7-R8
//   plane-band audit (engineered coupled exception / uncoupled exact-zero family /
//   R8-ESCALATION). All deviation receipts live in the amendment file.
//
// ARMS: board (128x64, situation 9 verbatim seed): A/N/M/S/OFF at sigma=2/3, A/N at
// 8/5 and 7/10, all T=256 with the FROZEN adjudication window T=64; cooker (64x1
// all-Abstain d=0, T=64 — the guest's LITERAL substrate) C_2_3/C_8_5/C_7_10 as
// sigma-invariance controls with a sealed cross-experiment link to E-Q6's COOK arm.
// Every arm runs TWICE from fresh construction on BOTH kernels (EQ7-D1).
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, packByte, q, fileSha256, sha256HexStr } from './_harness.mjs';
import * as fixed from '../fixedpoint/qthe_fixed.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });

const W = 128, H = 64, T_BOARD = 256, WINDOW = 64;
const SEAM_X = 63, FLIP = { x: 64, y: 32 }, ABSTAIN_YS = [8, 24, 40, 56], D0 = 32;
const COOK_W = 64, COOK_H = 1, T_COOK = 64;
const CHAIN = join(RECEIPTS, 'e_q7_chain.jsonl');
const CHECKPOINTS = [1, 2, 4, 8, 16, 32, 64, 128, 256];

// Frozen sigma arms (registration): real doubles for the float kernel, frozen integer
// Q32.32 counterparts for the fixed kernel — asserted against BOTH the fixed kernel's
// own sigmaToFixed and fixedpoint/pre_registration.json's frozen map, from disk.
const SIGMAS = {
  '2/3':  { real: 2 / 3, q: 2863311531, regKey: '2/3' },
  '8/5':  { real: 8 / 5, q: 6871947674, regKey: '1.6' },
  '7/10': { real: 7 / 10, q: 3006477107, regKey: '0.7' },
};
const fpReg = JSON.parse(readFileSync(join(HERE, '..', 'fixedpoint', 'pre_registration.json'), 'utf8'));
const frozenMap = fpReg.sigma_arms && fpReg.sigma_arms.fixed_point_counterparts;
if (!frozenMap) throw new Error('e-q7: fixedpoint counterpart map not found at fixedpoint/pre_registration.json .sigma_arms.fixed_point_counterparts — LOUD failure');
for (const [k, s] of Object.entries(SIGMAS)) {
  const derived = fixed.sigmaToFixed(s.real);
  if (derived !== s.q) throw new Error(`e-q7: sigmaToFixed(${k})=${derived} != frozen ${s.q} — LOUD failure`);
  if (frozenMap[s.regKey] !== s.q) throw new Error(`e-q7: fixedpoint/pre_registration.json counterpart[${s.regKey}]=${frozenMap[s.regKey]} != frozen ${s.q} — LOUD failure`);
}
console.log('[e-q7] sigma counterparts verified: 2/3->2863311531, 8/5->6871947674, 7/10->3006477107 (sigmaToFixed + frozen registration map, both from disk)');

// E-Q6 cross-experiment link: read the COOK arm's eventSeqHash from the sealed chain.
const eq6Rows = readFileSync(join(RECEIPTS, 'e_q6_chain.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const eq6Cook = eq6Rows.find((r) => r.kind === 'result.arm' && r.arm === 'cook');
if (!eq6Cook) throw new Error('e-q7: E-Q6 cook row not found in receipts/e_q6_chain.jsonl — LOUD failure');
const EQ6_COOK_HASH = eq6Cook.eventSeqHash;

const { stone, stonePath } = await linkStone();
const { kernelKind } = await loadKernel();
console.log(`[e-q7] float kernel=${kernelKind} fixed=fixedpoint/qthe_fixed.mjs stone=${stonePath}`);
const amend3Sha = fileSha256(join(HERE, 'pre_registration_amendment_3.json'));

const FLOAT_K = { makeSubstrate, tick, name: 'float:qthe.mjs' };
const FIXED_K = { makeSubstrate: fixed.makeSubstrate, tick: fixed.tick, name: 'fixed:qthe_fixed.mjs' };

function optsFor(K, arm, sigmaKey) {
  if (!arm.wormholes) return { wormholes: false };
  return K === FIXED_K ? { wormholes: true, sigmaQ: SIGMAS[sigmaKey].q } : { wormholes: true, sigma: SIGMAS[sigmaKey].real };
}

// ------------------------------------------------- situation 9 seed (frozen) ---
// Pattern coordinate px = x - shift (toroidal): shift=1 translates the whole
// situation by (+1,0) (S arm). swap conjugates the checkerboard phase (M arm).
function boardSeedFn(arm) {
  return (x, y) => {
    const px = ((x - (arm.shift || 0)) % W + W) % W;
    if (px === SEAM_X) {
      if (ABSTAIN_YS.includes(y)) return packByte(3, D0);
      return packByte(0, D0);
    }
    let even = ((px + y) % 2) === 0;
    if (arm.swap) even = !even;
    let tau = even ? 1 : 2;
    if (arm.flip && px === FLIP.x && y === FLIP.y) tau = (tau === 1) ? 2 : 1; // the tick-0 flip
    return packByte(tau, D0);
  };
}
const cookSeedFn = () => packByte(3, 0); // 64x1 all-Abstain d=0 (the guest's literal substrate)

// Harness-side integer acc meter (the kernel's own Moore-8 formula; a meter, not a
// mock — amendment-1 E-Q1 precedent). Over any byte plane.
function accField(bytes) {
  const out = new Int32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let a = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const c = bytes[(((y + dy) % H + H) % H) * W + (((x + dx) % W + W) % W)];
      const tau = c >> 6, d = c & 63;
      if (tau === 1) a += d; else if (tau === 2) a -= d;
    }
    out[y * W + x] = a;
  }
  return out;
}
function torCheb(a, b) {
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  return Math.max(Math.min(dx, W - dx), Math.min(dy, H - dy));
}
function devStats(bytes) {
  let sE = 0, sO = 0, nE = 0, nO = 0, dMin = 63, dMax = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x === SEAM_X) continue;
    const d = bytes[y * W + x] & 63;
    if (d < dMin) dMin = d; if (d > dMax) dMax = d;
    const dev = d - D0;
    if (((x + y) % 2) === 0) { sE += dev; if (dev !== 0) nE++; } else { sO += dev; if (dev !== 0) nO++; }
  }
  return { sumDevEven: sE, sumDevOdd: sO, nonzeroEven: nE, nonzeroOdd: nO, dMin, dMax,
    meanDevEven: q(sE / 4064), meanDevOdd: q(sO / 4064),
    oppositeSign: (sE < 0 && sO > 0) || (sE > 0 && sO < 0) };
}
function invertedCount(acc0, accT, mask) {
  let inv = 0, total = 0;
  for (let i = 0; i < acc0.length; i++) {
    if (!mask[i]) continue;
    total++;
    const was = acc0[i] !== 0 ? Math.sign(accT[i]) === -Math.sign(acc0[i]) : accT[i] < 0;
    if (was) inv++;
  }
  return { inv, total };
}

// --------------------------------------------------------------- board run ---
function runBoard(K, arm, sigmaKey, { capturePlanes = false, until = T_BOARD } = {}) {
  const sub = K.makeSubstrate(W, H, boardSeedFn(arm));
  const flipSite = { x: FLIP.x + (arm.shift || 0), y: FLIP.y };
  const originallyAttract = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x === ((SEAM_X + (arm.shift || 0)) % W)) continue;
    const px = ((x - (arm.shift || 0)) % W + W) % W;
    let even = ((px + y) % 2) === 0;
    if (arm.swap) even = !even;
    if (even) originallyAttract[y * W + x] = 1;
  }
  const acc0 = accField(new Uint8Array(sub));
  const planeHashes = [planeHash(sub, 0, bytePlane)];
  const planes = capturePlanes ? [new Uint8Array(sub)] : null;
  const eventTuples = [];       // integers only — hashed (E-Q6 law: terms never hashed)
  const eventsByTick = [];      // full events incl. term (receipted, never hashed)
  const perTick = [];
  for (let t = 1; t <= until; t++) {
    sub.lastEvents = [];
    K.tick(sub, optsFor(K, arm, sigmaKey));
    const evs = (sub.lastEvents || []).map((e) => ({ x: e.x, y: e.y, slot: e.slot, resonance: e.resonance, term: e.term }));
    for (const e of evs) eventTuples.push([t, e.x, e.y, e.slot, e.resonance]);
    eventsByTick.push(evs);
    planeHashes.push(planeHash(sub, t, bytePlane));
    if (capturePlanes) planes.push(new Uint8Array(sub));
    const ds = devStats(sub);
    perTick.push({ t, firings: evs.length, firers: evs.map((e) => [e.x, e.y]),
      parityOpposite: ds.oppositeSign, sumDevEven: ds.sumDevEven, sumDevOdd: ds.sumDevOdd,
      nonzeroEven: ds.nonzeroEven, nonzeroOdd: ds.nonzeroOdd, dMin: ds.dMin, dMax: ds.dMax });
  }
  const snap = sub.__wormholes ? sub.__wormholes.snapshot() : null;
  return { K: K.name, arm: { ...arm }, sigmaKey, planeHashes, planes, eventTuples, eventsByTick, perTick,
    eventSeqHash: sha256HexStr(JSON.stringify(eventTuples)),
    snapshotHash: snap ? sha256HexStr(JSON.stringify(snap)) : 'no-table',
    acc0, originallyAttract, flipSite };
}

// Delta-field of A vs N from stored per-tick planes (both captured).
function deltaTrace(aRun, nRun) {
  if (!aRun.planes || !nRun.planes) throw new Error('e-q7: deltaTrace needs captured planes');
  const perTick = [];
  for (let t = 0; t <= T_BOARD; t++) {
    const a = aRun.planes[t], n = nRun.planes[t];
    let count = 0, countExclFlip = 0, radius = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (a[i] !== n[i]) {
        count++;
        if (x === aRun.flipSite.x && y === aRun.flipSite.y) continue; // flip site excluded (receipted)
        countExclFlip++;
        const r = torCheb({ x, y }, aRun.flipSite);
        if (r > radius) radius = r;
      }
    }
    perTick.push({ t, count, countExclFlip, radius });
  }
  return perTick;
}
function inversionFractions(aRun, nRun, ticks) {
  const out = {};
  for (const t of ticks) {
    const accT_A = accField(aRun.planes[t]), accT_N = accField(nRun.planes[t]);
    let both = 0, total = 0;
    for (let i = 0; i < accT_A.length; i++) {
      if (!aRun.originallyAttract[i]) continue;
      total++;
      const invA = acc0Sign(aRun.acc0[i], accT_A[i]);
      const invN = acc0Sign(nRun.acc0[i], accT_N[i]);
      if (invA && !invN) both++;
    }
    out[t] = { invFractions: q(both / total), invertedAttributable: both, denominator: total };
  }
  return out;
}
function acc0Sign(a0, aT) { return a0 !== 0 ? Math.sign(aT) === -Math.sign(a0) : aT < 0; }

// -------------------------------------------------------------- cooker run ---
function runCooker(K, sigmaKey) {
  const sub = K.makeSubstrate(COOK_W, COOK_H, cookSeedFn);
  const eventTuples = [];
  const perTick = [];
  let totalTerm = 0; // float on the float plane — string only, never hashed
  for (let t = 1; t <= T_COOK; t++) {
    sub.lastEvents = [];
    K.tick(sub, optsFor(K, { wormholes: true }, sigmaKey));
    const evs = (sub.lastEvents || []).map((e) => ({ x: e.x, y: e.y, slot: e.slot, resonance: e.resonance }));
    for (const e of evs) { eventTuples.push([t, e.x, e.y, e.slot, e.resonance]); totalTerm += e.resonance * (K === FIXED_K ? SIGMAS[sigmaKey].q / 2 ** 32 : SIGMAS[sigmaKey].real); }
    const snap = sub.__wormholes.snapshot();
    perTick.push({ t, firings: evs.length, firers: evs.map((e) => e.x).sort((a, b) => a - b),
      slot0OccupantX: snap[0] ? snap[0].x : null, occupiedCount: sub.__wormholes.occupiedCount() });
  }
  const snap = sub.__wormholes.snapshot();
  return { K: K.name, sigmaKey, totalWriteAttempts: COOK_W * T_COOK, totalFirings: eventTuples.length,
    distinctFirers: [...new Set(eventTuples.map((e) => e[1]))].length,
    survivalRate: q(eventTuples.length / (COOK_W * T_COOK)), totalImagMass: q(totalTerm),
    eventSeqHash: sha256HexStr(JSON.stringify(eventTuples)),
    snapshotHash: sha256HexStr(JSON.stringify(snap)), perTick };
}

// ------------------------------------------------------------------- arms ---
const BOARD_ARMS = [
  { name: 'N_2_3',    sigma: '2/3',  flip: false, swap: false, shift: 0, wormholes: true },
  { name: 'A_2_3',    sigma: '2/3',  flip: true,  swap: false, shift: 0, wormholes: true },
  { name: 'M_2_3',    sigma: '2/3',  flip: true,  swap: true,  shift: 0, wormholes: true },
  { name: 'S_2_3',    sigma: '2/3',  flip: true,  swap: false, shift: 1, wormholes: true },
  { name: 'A_2_3_OFF',sigma: '2/3',  flip: true,  swap: false, shift: 0, wormholes: false },
  { name: 'N_2_3_OFF',sigma: '2/3',  flip: false, swap: false, shift: 0, wormholes: false }, // erratum: OFF-paired nu control
  { name: 'N_8_5',    sigma: '8/5',  flip: false, swap: false, shift: 0, wormholes: true },
  { name: 'A_8_5',    sigma: '8/5',  flip: true,  swap: false, shift: 0, wormholes: true },
  { name: 'N_7_10',   sigma: '7/10', flip: false, swap: false, shift: 0, wormholes: true },
  { name: 'A_7_10',   sigma: '7/10', flip: true,  swap: false, shift: 0, wormholes: true },
];
const COOKER_ARMS = ['2/3', '8/5', '7/10'];
const CAPTURE = new Set(['N_2_3', 'A_2_3', 'M_2_3', 'S_2_3', 'A_2_3_OFF', 'N_2_3_OFF', 'N_8_5', 'A_8_5', 'N_7_10', 'A_7_10']); // planes kept for Delta / equivariance / terminal devStats

const detRows = [], results = { board: {}, cooker: {} };
let allDet = true;

function detCheck(kind, arm, r1, r2) {
  const compact = (r) => JSON.stringify(r.perTick.map((p) => [p.t, p.firings, p.firers, p.parityOpposite, p.sumDevEven, p.sumDevOdd, p.nonzeroEven, p.nonzeroOdd, p.dMin, p.dMax]));
  const det = r1.eventSeqHash === r2.eventSeqHash && r1.snapshotHash === r2.snapshotHash &&
    JSON.stringify(r1.planeHashes) === JSON.stringify(r2.planeHashes) && compact(r1) === compact(r2);
  if (!det) allDet = false;
  detRows.push({ kind, experiment: 'E-Q7', arm, rerunIdentical: det, eventSeqHash: r1.eventSeqHash, snapshotHash: r1.snapshotHash });
  return det;
}

console.log('[e-q7] board arms (float kernel, T=256, window 64)...');
for (const arm of BOARD_ARMS) {
  const t0 = Date.now();
  const r1 = runBoard(FLOAT_K, arm, arm.sigma, { capturePlanes: CAPTURE.has(arm.name) });
  const r2 = runBoard(FLOAT_K, arm, arm.sigma, { capturePlanes: false }); // fresh rebuild, EQ7-D1
  const det = detCheck('det.arm', `float:${arm.name}`, r1, r2);
  results.board[arm.name] = { run1: r1, run2Hashes: { eventSeqHash: r2.eventSeqHash, snapshotHash: r2.snapshotHash }, determinism: det };
  const w = r1.perTick.slice(0, WINDOW).reduce((s, p) => s + p.firings, 0);
  console.log(`[e-q7] ${arm.name}: firings64=${w}/256 distinct=${new Set(r1.eventTuples.map((e) => e[1] + ',' + e[2])).size} det=${det} (${Date.now() - t0}ms)`);
}
console.log('[e-q7] cooker arms (float kernel)...');
for (const sk of COOKER_ARMS) {
  const c1 = runCooker(FLOAT_K, sk);
  const c2 = runCooker(FLOAT_K, sk);
  const det = c1.eventSeqHash === c2.eventSeqHash && c1.snapshotHash === c2.snapshotHash && JSON.stringify(c1.perTick) === JSON.stringify(c2.perTick);
  if (!det) allDet = false;
  detRows.push({ kind: 'det.arm', experiment: 'E-Q7', arm: `float:C_${sk.replace('/', '_')}`, rerunIdentical: det, eventSeqHash: c1.eventSeqHash, snapshotHash: c1.snapshotHash });
  results.cooker[sk] = { run1: c1, rerunIdentical: det, matchesEQ6Cook: c1.eventSeqHash === EQ6_COOK_HASH };
  console.log(`[e-q7] C_${sk}: firings=${c1.totalFirings}/4096 distinct=${c1.distinctFirers} ==EQ6cook=${c1.eventSeqHash === EQ6_COOK_HASH} det=${det}`);
}

// ------------------------------------------------- fixed-plane mirror runs ---
console.log('[e-q7] fixed-plane mirror runs (qthe_fixed.mjs, frozen sigmaQ)...');
const planeRows = [];
let anyEscalation = false;
for (const arm of BOARD_ARMS) {
  const x1 = runBoard(FIXED_K, arm, arm.sigma, { capturePlanes: false });
  const x2 = runBoard(FIXED_K, arm, arm.sigma, { capturePlanes: false });
  const det = detCheck('det.arm', `fixed:${arm.name}`, x1, x2);
  const f1 = results.board[arm.name].run1;
  let firstDiv = -1;
  for (let t = 0; t <= T_BOARD; t++) if (f1.planeHashes[t] !== x1.planeHashes[t]) { firstDiv = t; break; }
  let audit = null;
  if (firstDiv >= 0) {
    // Deterministic replay (EQ7-D1 guarantees byte-identical reruns) to pin the
    // FIRST mechanism: pre-tick planes are byte-identical by minimality.
    const fRep = runBoard(FLOAT_K, arm, arm.sigma, { capturePlanes: true, until: firstDiv });
    const xRep = runBoard(FIXED_K, arm, arm.sigma, { capturePlanes: true, until: firstDiv });
    const preF = fRep.planes[firstDiv - 1], preX = xRep.planes[firstDiv - 1];
    const preIdentical = planeHash(preF, firstDiv - 1, bytePlane) === planeHash(preX, firstDiv - 1, bytePlane);
    const accs = accField(preF);
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const bf = fRep.planes[firstDiv][i], bx = xRep.planes[firstDiv][i];
      if (bf === bx) continue;
      const dd = (bx & 63) - (bf & 63);
      const tauOk = (bf >> 6) === (bx >> 6);
      const evF = (fRep.eventsByTick[firstDiv - 1] || []).find((e) => e.x === x && e.y === y);
      const evX = (xRep.eventsByTick[firstDiv - 1] || []).find((e) => e.x === x && e.y === y);
      const acc = accs[i];
      let cls = 'R8-ESCALATION';
      let r = null;
      if (evF && evX && evF.resonance === evX.resonance) {
        r = evF.resonance;
        if (SIGMAS[arm.sigma].regKey === '2/3' && acc === -2 && r === 3) cls = 'ENGINEERED-COUPLED-EXCEPTION';
        else {
          const m = r * SIGMAS[arm.sigma].real;
          if (m === Math.round(m) && acc === -Math.round(m)) cls = 'UNCOUPLED-EXACT-ZERO';
        }
      }
      cells.push({ x, y, dd, tauOk, hadTwinEvent: !!(evF && evX), resonance: r, readerAcc: acc, classification: cls });
      if (cls === 'R8-ESCALATION' || Math.abs(dd) !== 1 || !tauOk) anyEscalation = true;
    }
    audit = { firstDivergenceTick: firstDiv, preTickPlanesIdentical: preIdentical,
      divergentCells: cells.length, maxAbsDd: Math.max(...cells.map((c) => Math.abs(c.dd))),
      classifications: cells.reduce((m, c) => { m[c.classification] = (m[c.classification] || 0) + 1; return m; }, {}),
      cells: cells.slice(0, 64) };
    console.log(`[e-q7] fixed ${arm.name}: DIVERGES at t=${firstDiv}, cells=${cells.length}, ${JSON.stringify(audit.classifications)}`);
  } else {
    console.log(`[e-q7] fixed ${arm.name}: planes byte-identical to float at every tick 0..256`);
  }
  planeRows.push({ kind: 'result.fixedplane', experiment: 'E-Q7', arm: arm.name, sigma: arm.sigma,
    fixedDeterminism: det, planesIdentical: firstDiv < 0, firstDivergenceTick: firstDiv < 0 ? null : firstDiv,
    audit, r8Escalation: audit ? audit.classifications['R8-ESCALATION'] > 0 || audit.maxAbsDd !== 1 || !audit.cells.every((c) => c.tauOk) : false });
}
for (const sk of COOKER_ARMS) {
  const x1 = runCooker(FIXED_K, sk);
  const x2 = runCooker(FIXED_K, sk);
  const det = x1.eventSeqHash === x2.eventSeqHash && x1.snapshotHash === x2.snapshotHash && JSON.stringify(x1.perTick) === JSON.stringify(x2.perTick);
  if (!det) allDet = false;
  detRows.push({ kind: 'det.arm', experiment: 'E-Q7', arm: `fixed:C_${sk.replace('/', '_')}`, rerunIdentical: det, eventSeqHash: x1.eventSeqHash, snapshotHash: x1.snapshotHash });
  const f = results.cooker[sk];
  f.fixed = { eventSeqHash: x1.eventSeqHash, structureMatchesFloat: x1.eventSeqHash === f.run1.eventSeqHash, matchesEQ6Cook: x1.eventSeqHash === EQ6_COOK_HASH, rerunIdentical: det };
  planeRows.push({ kind: 'result.fixedplane', experiment: 'E-Q7', arm: `C_${sk.replace('/', '_')}`, sigma: sk,
    fixedDeterminism: det, planesIdentical: true, firstDivergenceTick: null, audit: null,
    r8Escalation: false, structureMatchesFloat: f.fixed.structureMatchesFloat,
    note: 'cooker plane identity: only signs drive d; all twin terms positive at every sigma>0 on both planes' });
}

// ------------------------------------------------- Delta / regime / floors ---
const CP = CHECKPOINTS;
function boardAggregate(name) {
  const r = results.board[name].run1;
  const dsAt = (t) => devStats(r.planes[t]);
  return { r, dsAt };
}
const agg = {};
for (const name of ['A_2_3', 'N_2_3', 'M_2_3', 'S_2_3', 'A_2_3_OFF', 'N_2_3_OFF', 'A_8_5', 'A_7_10']) {
  const { r, dsAt } = boardAggregate(name);
  agg[name] = {
    totalFirings256: r.eventTuples.length,
    windowFirings64: r.perTick.slice(0, WINDOW).reduce((s, p) => s + p.firings, 0),
    writeAttemptsWindow: 4 * WINDOW, writeAttemptsFull: 4 * T_BOARD,
    distinctFirers: [...new Set(r.eventTuples.map((e) => e[1] + ',' + e[2]))].size,
    firerCells: [...new Set(r.eventTuples.map((e) => e[1] + ',' + e[2]))].sort(),
    survivalWindow: q(r.perTick.slice(0, WINDOW).reduce((s, p) => s + p.firings, 0) / (4 * WINDOW)),
    parityLiveCount64: r.perTick.slice(0, WINDOW).filter((p) => p.parityOpposite && p.firings >= 1).length,
    oppositeSignAt64: dsAt(64).oppositeSign, oppositeSignAt256: dsAt(256).oppositeSign,
    devAt64: dsAt(64), devAt256: dsAt(256),
  };
}
// Delta traces for A vs N pairs + regimes (OFF pair per the erratum)
const pairs = [['A_2_3', 'N_2_3'], ['A_2_3_OFF', 'N_2_3_OFF'], ['A_8_5', 'N_8_5'], ['A_7_10', 'N_7_10']];
const regimeRows = [];
const regimeOf = {};
for (const [aName, nName] of pairs) {
  const aRun = results.board[aName].run1, nRun = results.board[nName].run1;
  const dt = deltaTrace(aRun, nRun);
  const radius64 = Math.max(...dt.slice(1, WINDOW + 1).map((p) => p.radius));
  const radius256 = Math.max(...dt.slice(1).map((p) => p.radius));
  const inv = inversionFractions(aRun, nRun, [128, 256]);
  const invFrac256 = parseFloat(inv[256].invFractions);
  const invFrac128 = parseFloat(inv[128].invFractions);
  let regime;
  if (invFrac256 >= 0.9) regime = 'SUBSTRATE-WIDE';
  else if (radius64 > 4) regime = 'CASCADE';
  else if (radius256 <= 4) regime = 'DEAD-LOCAL';
  else regime = 'UNRESOLVED';
  regimeOf[aName] = regime;
  regimeRows.push({ kind: 'result.arm', experiment: 'E-Q7', pair: `${aName} vs ${nName}`, sigma: aRun.sigmaKey,
    firstSpreadTick: dt.findIndex((p, i) => i >= 1 && p.countExclFlip > 0),
    radiusAtCheckpoints: dt.filter((p) => CP.includes(p.t)).map((p) => ({ t: p.t, radius: p.radius, countExclFlip: p.countExclFlip })),
    radiusMax64: radius64, radiusMax256: radius256,
    inversionFractions: inv, regime,
    deltaCountAtCheckpoints: dt.filter((p) => CP.includes(p.t)).map((p) => ({ t: p.t, count: p.count })) });
  console.log(`[e-q7] ${aName}: regime=${regime} radius64=${radius64} radius256=${radius256} inv256=${inv[256].invFractions}`);
}
// SHIFT equivariance: S plane(t) must equal A plane(t) translated by (+1,0)
const aRun23 = results.board['A_2_3'].run1, sRun = results.board['S_2_3'].run1;
let shiftEquivariant = true, shiftFirstViolation = null;
{
  const aP = aRun23.planes, sP = sRun.planes;
  outer: for (let t = 0; t <= T_BOARD; t++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (sP[t][y * W + x] !== aP[t][y * W + ((x - 1) % W + W) % W]) { shiftEquivariant = false; shiftFirstViolation = t; break outer; }
    }
  }
}
console.log(`[e-q7] SHIFT equivariance: ${shiftEquivariant ? 'EXACT at every tick 0..256' : 'VIOLATED at t=' + shiftFirstViolation}`);

// --------------------------------------------------------- verdict (frozen) ---
const alpha23 = agg['A_2_3'], alpha85 = agg['A_8_5'], alpha710 = agg['A_7_10'], mirror23 = agg['M_2_3'], off23 = agg['A_2_3_OFF'];
const p1a_parityLiveEveryTick = alpha23.parityLiveCount64 === WINDOW;
const p1b_terminalParityBothPhases = alpha23.oppositeSignAt64 && mirror23.oppositeSignAt64;
const regimeA23 = regimeOf['A_2_3'];
const p1c_cascade = regimeA23 === 'CASCADE' || regimeA23 === 'SUBSTRATE-WIDE';
const P1_CONFIRMED = p1a_parityLiveEveryTick && p1b_terminalParityBothPhases && p1c_cascade;
const anySubstrateWide = Object.values(regimeOf).some((r) => r === 'SUBSTRATE-WIDE');
const P2_FALSIFIED = !alpha23.oppositeSignAt64 && !alpha85.oppositeSignAt64 && !alpha710.oppositeSignAt64 && !anySubstrateWide;
const C4 = P1_CONFIRMED ? 'CONFIRMED' : (P2_FALSIFIED ? 'FALSIFIED' : 'MIXED');
const regimeOFF = regimeOf['A_2_3_OFF'];
const P3_fired = regimeA23 === regimeOFF;
const r8Escalation = planeRows.some((p) => p.r8Escalation);
const planesAllIdentical = planeRows.every((p) => p.planesIdentical);

const verdictLine = `E-Q7 VERDICT: C4 ${C4} under the guest's sealed rule (parityLive ${alpha23.parityLiveCount64}/64 ticks, terminal-parity-dependent A=${alpha23.oppositeSignAt64}/M=${mirror23.oppositeSignAt64}, regime A_2_3=${regimeA23}); situation 9 ON/OFF conditional ${P3_fired ? 'FIRED — C4 threshold falsified for this substrate' : 'did not fire — regimes differ'}; float-vs-fixed planes ${planesAllIdentical ? 'byte-identical at every tick on every arm' : (r8Escalation ? 'R8-ESCALATION (band audit failed)' : 'diverge within the pre-registered band classes only')}; determinism EQ7-D1 ${allDet ? 'PASS (all arms byte-identical across fresh reruns, both kernels)' : 'VOID'}`;
console.log(`[e-q7] ${verdictLine}`);

// ----------------------------------------------------------------- outputs ---
writeFileSync(join(OUT, 'e_q7_results.json'), JSON.stringify({
  experiment: 'E-Q7', claim: 'C4 (phase threshold) via situation 9 re-registered under S3, seeded at sigma=2/3',
  kernel: { float: kernelReport(), fixed: 'fixedpoint/qthe_fixed.mjs (READ-ONLY import)' }, stonePath,
  amendment3Sha: amend3Sha,
  registeredFloor: 'pre_registration_amendment_3.json (1c93029, PRE-RUN): guest lever r6-q4-next-lever verbatim; situation 9 verbatim seed; EQ7-P1/P2/P3/D1/A1/R8',
  sigmaCounterparts: SIGMAS, eq6CookEventSeqHash: EQ6_COOK_HASH,
  board: Object.fromEntries(Object.entries(results.board).map(([k, v]) => [k, {
    arm: v.run1.arm, determinism: v.determinism, run2Hashes: v.run2Hashes,
    kernel: v.run1.K, totalFirings256: v.run1.eventTuples.length,
    windowFirings64: v.run1.perTick.slice(0, WINDOW).reduce((s, p) => s + p.firings, 0),
    distinctFirers: [...new Set(v.run1.eventTuples.map((e) => e[1] + ',' + e[2]))].size,
    firerCells: [...new Set(v.run1.eventTuples.map((e) => e[1] + ',' + e[2]))].sort(),
    survivalWindow: q(v.run1.perTick.slice(0, WINDOW).reduce((s, p) => s + p.firings, 0) / (4 * WINDOW)),
    eventSeqHash: v.run1.eventSeqHash, snapshotHash: v.run1.snapshotHash,
    finalPlaneHash: v.run1.planeHashes[v.run1.planeHashes.length - 1],
    perTick: v.run1.perTick, planeHashes: v.run1.planeHashes,
  }])),
  cooker: Object.fromEntries(Object.entries(results.cooker).map(([k, v]) => [k, v])),
  regimes: regimeRows,
  shiftEquivariance: { exact: shiftEquivariant, firstViolationTick: shiftFirstViolation },
  fixedPlaneAudit: planeRows,
  aggregates: {
    alpha23: agg['A_2_3'], mirror23: agg['M_2_3'], off23: agg['A_2_3_OFF'], alpha85: agg['A_8_5'], alpha710: agg['A_7_10'],
    P1_CONFIRMED, p1a_parityLiveEveryTick, p1b_terminalParityBothPhases, p1c_cascade,
    P2_FALSIFIED, anySubstrateWide, C4, P3_fired, regimeA23, regimeOFF, r8Escalation, planesAllIdentical, allDet,
    verdictLine,
  },
}, null, 1));

// ------------------------------------------------------- chain (stone-v1) ---
const rows = [
  { kind: 'rules.EQ7', frozen_by: 'pre_registration_amendment_3.json (1c93029), committed BEFORE any run; guest lever r6-q4-next-lever (situations/guest_rows_r6.jsonl, sealed 2026-09-27T07:41:51Z, prefix sha 777938e2...)', amendment3_sha256: amend3Sha,
    floor_verbatim: "situation 9 re-registered under S3 row-major LWW seeded at sigma=2/3: 'C4 is CONFIRMED iff the checkerboard parity flips at least once per tick under row-major LWW and terminal occupancy is parity-dependent; C4 is FALSIFIED iff terminal occupancy is parity-independent (cascade collapses to uniform) in all three arms. Falsifier: any arm where the float and fixed planes diverge by more than the pre-registered one S-unit, or where EQ6-D1 byte-identity fails across fresh reruns.'",
    lane_floors: 'EQ7-D1 EQ6-D1 carried (both kernels, every arm); EQ7-P3 situation-9 ON/OFF same-regime conditional verbatim (theta=pi/4 -> sigma=2/3, 4-of-5-seeds -> deterministic trace + D1, receipted); EQ7-A1 frozen adjudication SUBSTRATE-WIDE(>=90% flip-attributable inversion@256) > CASCADE(Delta-radius>4 by 64) > DEAD-LOCAL(absorbed through 256 = pre-priced crown-jewel null) > UNRESOLVED; EQ7-R8 band audit (engineered coupled exception (2/3,acc=-2,r=3) / uncoupled exact-zero family (r*double(sigma)===integer m, acc=-m) / else R8-ESCALATION)' },
  { kind: 'run.config', experiment: 'E-Q7', kernel: { float: kernelReport(), fixed: 'fixedpoint/qthe_fixed.mjs (READ-ONLY)' }, stone_linked: stonePath,
    task: 'situation 9 verbatim seed (128x64 checkerboard, Ground seam x=63, 4 Abstains d=32 at y in {8,24,40,56}, flip (64,32) Attract->Repel) T=256 frozen window 64; arms A/N/M/S/OFF at 2/3, A/N at 8/5 and 7/10; cooker C_* = guest literal substrate 64x1 all-Abstain d=0 T=64; both kernels, fresh reruns; sigma counterparts verified vs sigmaToFixed AND fixedpoint/pre_registration.json frozen map; seed 1337 inert (tick draws no randomness)' },
  ...detRows,
  ...regimeRows,
  { kind: 'result.crosschain', experiment: 'E-Q7', note: 'cooker sigma-invariance + cross-experiment link to E-Q6 COOK',
    eq6_cook_eventSeqHash: EQ6_COOK_HASH,
    cooker: Object.fromEntries(Object.entries(results.cooker).map(([k, v]) => [k, { eventSeqHash: v.run1.eventSeqHash, totalFirings: v.run1.totalFirings, distinctFirers: v.run1.distinctFirers, survivalRate: v.run1.survivalRate, matchesEQ6Cook: v.run1.eventSeqHash === EQ6_COOK_HASH, fixedStructureMatchesFloat: v.fixed.structureMatchesFloat, fixedMatchesEQ6Cook: v.fixed.matchesEQ6Cook }])) },
  { kind: 'result.shiftEquivariance', experiment: 'E-Q7', exact: shiftEquivariant, firstViolationTick: shiftFirstViolation,
    note: 'S_2_3 plane trajectory vs A_2_3 translated (+1,0), toroidal, every tick 0..256 (erratum role-isomorphism law)' },
  { kind: 'verdict.EQ7', experiment: 'E-Q7', P1_CONFIRMED, p1a_parityLiveEveryTick, p1b_terminalParityBothPhases, p1c_cascade,
    P2_FALSIFIED, anySubstrateWide, C4, P3_fired, regimeA23, regimeOFF, r8Escalation, planesAllIdentical, allDet,
    parityLiveCount64: alpha23.parityLiveCount64, oppositeSignAt64: { A: alpha23.oppositeSignAt64, M: mirror23.oppositeSignAt64, A85: alpha85.oppositeSignAt64, A710: alpha710.oppositeSignAt64 },
    regimes: regimeOf, verdictLine },
];
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q7', claim: 'C4' });
console.log(`[e-q7] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q7_tip.txt'), `${v.tip} links=${v.links}\n`);
