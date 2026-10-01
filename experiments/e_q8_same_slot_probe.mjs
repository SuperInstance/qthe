// experiments/e_q8_same_slot_probe.mjs — E-Q8: THE SAME-SLOT S3 LIVE-READ PROBE
// (the wave-37 probe all three houses converged on at tavern round seven).
// Lane 37-b (qthe-smith). Runs on the REAL float kernel (qthe.mjs) via
// _adapter.mjs and the READ-ONLY integer fixed kernel (fixedpoint/qthe_fixed.mjs).
// No mocks, no kernel edits (CR3; fixed plane receives frozen integer sigmaQ only).
//
// REGISTERED FLOOR (pre_registration_e_q8.json, commit 26b1d3b, PRE-RUN):
//   PRIMARY family sigma=2/3 chosen by MOTH graph-v1 job 1f674719-… (first bit of
//   the canonical 1264-bit stream = 1; mapping declared pre-fire; receipt sha
//   9d1856e8…). SECONDARY 8/5 run regardless. Minimal 6x3 board, exactly TWO
//   Abstain writers A(1,1)/B(2,1) BOTH d=20 (SAME slot 20), row-major pinned
//   A-before-B => at t=1 B hears A's SAME-TICK write (S3 live-read, E-Q6 R2/R4).
//   REGISTERED CLAIM: float cell HOLDS (double rounding collapses r*double(sigma)
//   to exactly m cancelling acc_reader=-m) while fixed cell MOVES (+1 S-unit,
//   honest remainder) — planes disagree ONLY via sigma representation, write-order
//   semantics identical (twin tuples identical across kernels at the first hit).
//   REGISTERED FALSIFIER: planes agree in BOTH families, or divergence
//   attributable to anything else (audit via kernelReport + order audit).
//   EQ8-D1 determinism (EQ7-D1 carried): every arm TWICE from fresh construction,
//   BOTH kernels, byte-identical. EQ8-R8 attribution audit at first divergence.
//   Secondary cooker_diff arm (typesafe, 0.76): 64x1 all-Abstain d=0 T=64 at
//   sigma=2/3, float-vs-fixed byte-diff, cross-linked to E-Q7 C_2_3 / E-Q6 COOK.
// Everything AS RUN — if the hypothesis fails, the FAIL ships honestly.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, bytePlane, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, packByte, q, fileSha256, sha256HexStr } from './_harness.mjs';
import * as fixed from '../fixedpoint/qthe_fixed.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });

const W = 6, H = 3, T_PROBE = 16, SLOT = 20;
const A_XY = [1, 1], B_XY = [2, 1], PA_XY = [0, 1], PB_XY = [3, 1];
const COOK_W = 64, COOK_H = 1, T_COOK = 64;
const CHAIN = join(RECEIPTS, 'e_q8_chain.jsonl');
const REG_SHA = fileSha256(join(HERE, 'pre_registration_e_q8.json'));
const MOTH_RECEIPT_SHA = '9d1856e812c8150a5fb58ed1e4a02f8e5ca6dcd7277a6a191e5180ec684ffe16';

// Frozen families (registration): real doubles for the float kernel, frozen
// Q32.32 counterparts for the fixed kernel — asserted against BOTH the fixed
// kernel's own sigmaToFixed and fixedpoint/pre_registration.json's frozen map.
// m = the integer the float term collapses to; r = the earlier writer's
// resonance = |acc_A|+1; accA = acc(A) = -(r-1); accB = acc(B) = -m;
// pA/pB = the Repel d-values engineering those accs.
const FAMILIES = {
  '2/3': { real: 2 / 3, q: 2863311531, regKey: '2/3', m: 2, r: 3, accA: -2, pA: 2, pB: 2, primary: true },
  '8/5': { real: 8 / 5, q: 6871947674, regKey: '1.6', m: 8, r: 5, accA: -4, pA: 4, pB: 8, primary: false },
};
const fpReg = JSON.parse(readFileSync(join(HERE, '..', 'fixedpoint', 'pre_registration.json'), 'utf8'));
const frozenMap = fpReg.sigma_arms && fpReg.sigma_arms.fixed_point_counterparts;
if (!frozenMap) throw new Error('e-q8: fixedpoint counterpart map not found at fixedpoint/pre_registration.json .sigma_arms.fixed_point_counterparts — LOUD failure');
for (const [k, f] of Object.entries(FAMILIES)) {
  const derived = fixed.sigmaToFixed(f.real);
  if (derived !== f.q) throw new Error(`e-q8: sigmaToFixed(${k})=${derived} != frozen ${f.q} — LOUD failure`);
  if (frozenMap[f.regKey] !== f.q) throw new Error(`e-q8: fixedpoint/pre_registration.json counterpart[${f.regKey}]=${frozenMap[f.regKey]} != frozen ${f.q} — LOUD failure`);
  // the family arithmetic itself, sealed pre-run: float collapse + fixed remainder
  if (f.r * f.real !== f.m) throw new Error(`e-q8: ${f.r}*double(${k}) !== ${f.m} — float-collapse premise broken, LOUD failure`);
  const rem = -f.m * fixed.SCALE + f.r * f.q;
  if (rem <= 0 || rem > f.r) throw new Error(`e-q8: fixed remainder at ${k} = ${rem}, outside (0, r] — premise broken, LOUD failure`);
}
console.log('[e-q8] sigma counterparts verified: 2/3->2863311531, 8/5->6871947674 (sigmaToFixed + frozen registration map, both from disk)');
console.log('[e-q8] family arithmetic verified: 3*double(2/3)===2, 5*double(8/5)===8; fixed remainders +1/+2 in (0, r]');

// Kernel provenance (E-Q7 pattern): float kernel must be byte-identical to the
// nested UNTRACKED clone (qthe/ @ 7569060) when that clone is present on disk.
const floatPath = join(HERE, '..', 'qthe.mjs');
const clonePath = join(HERE, '..', 'qthe', 'qthe.mjs');
let cloneProvenance = 'nested clone not present at run time';
if (existsSync(clonePath)) {
  cloneProvenance = readFileSync(floatPath).equals(readFileSync(clonePath))
    ? 'float kernel byte-identical to nested untracked clone qthe/ @ 7569060 (never committed)'
    : 'DRIFT: float kernel differs from nested clone — LOUD receipt';
  if (!cloneProvenance.startsWith('float kernel byte-identical')) throw new Error('e-q8: ' + cloneProvenance);
}

const { stone, stonePath } = await linkStone();
const { kernelKind } = await loadKernel();
console.log(`[e-q8] float kernel=${kernelKind} fixed=fixedpoint/qthe_fixed.mjs stone=${stonePath}`);

const FLOAT_K = { makeSubstrate, tick, name: 'float:qthe.mjs' };
const FIXED_K = { makeSubstrate: fixed.makeSubstrate, tick: fixed.tick, name: 'fixed:qthe_fixed.mjs' };
function optsFor(K, famKey) {
  const f = FAMILIES[famKey];
  return K === FIXED_K ? { wormholes: true, sigmaQ: f.q } : { wormholes: true, sigma: f.real };
}

// ------------------------------------------------- board seed (frozen) ---
// A(1,1) + B(2,1) Abstain d=20 (SAME slot 20); P_A(0,1)/P_B(3,1) Repel d=pA/pB;
// everything else Ground d=0. Control: A -> Ground (single-writer no-twin baseline).
function boardSeedFn(famKey, control) {
  const f = FAMILIES[famKey];
  const cellMap = new Map();
  cellMap.set(`${PA_XY[0]},${PA_XY[1]}`, packByte(2, f.pA));
  cellMap.set(`${PB_XY[0]},${PB_XY[1]}`, packByte(2, f.pB));
  if (!control) cellMap.set(`${A_XY[0]},${A_XY[1]}`, packByte(3, SLOT));
  cellMap.set(`${B_XY[0]},${B_XY[1]}`, packByte(3, SLOT));
  return (x, y) => cellMap.get(`${x},${y}`) ?? 0;
}

// Harness-side integer acc meter (the kernel's own Moore-8 formula; a meter, not
// a mock — amendment-1 E-Q1 precedent), generalized to any w/h.
function accField(bytes, w, h) {
  const out = new Int32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let a = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const c = bytes[(((y + dy) % h + h) % h) * w + (((x + dx) % w + w) % w)];
      const tau = c >> 6, d = c & 63;
      if (tau === 1) a += d; else if (tau === 2) a -= d;
    }
    out[y * w + x] = a;
  }
  return out;
}

// t=0 assertions (registration: engineered_accumulators_asserted_at_t0) — LOUD.
function assertSeed(famKey, control, sub) {
  const f = FAMILIES[famKey];
  const accs = accField(new Uint8Array(sub), W, H);
  const at = (p) => accs[p[1] * W + p[0]];
  const byteAt = (p) => sub[p[1] * W + p[0]];
  const expect = [
    [`A(1,1) byte`, byteAt(A_XY), control ? 0 : packByte(3, SLOT)],
    [`B(2,1) byte`, byteAt(B_XY), packByte(3, SLOT)],
    [`P_A(0,1) byte`, byteAt(PA_XY), packByte(2, f.pA)],
    [`P_B(3,1) byte`, byteAt(PB_XY), packByte(2, f.pB)],
    [`acc(A)`, at(A_XY), control ? -f.pA : f.accA], // control: A is Ground but still SEES P_A (acc -pA, d=0 rail => harmless); probe: engineered tuning
    [`acc(B)`, at(B_XY), -f.m],
    [`acc(P_A) stability`, at(PA_XY), 0],
    [`acc(P_B) stability`, at(PB_XY), 0],
  ];
  for (const [name, got, want] of expect) {
    if (got !== want) throw new Error(`e-q8: t=0 assertion FAILED ${famKey}${control ? ' CONTROL' : ''}: ${name} = ${got}, expected ${want} — LOUD failure`);
  }
}

// --------------------------------------------------------------- probe run ---
function runProbe(K, famKey, control) {
  const sub = K.makeSubstrate(W, H, boardSeedFn(famKey, control));
  assertSeed(famKey, control, sub);
  const f = FAMILIES[famKey];
  const idxA = A_XY[1] * W + A_XY[0], idxB = B_XY[1] * W + B_XY[0];
  const planeHashes = [planeHash(sub, 0, bytePlane)];
  const planes = [new Uint8Array(sub)]; // tiny board: capture every tick (audit + trajectories)
  const eventTuples = [];               // [t, x, y, slot, resonance] integers only (term NEVER hashed)
  const termsByTick = [];               // raw term values per tick (float on float plane) — receipted as strings, never hashed
  const perTick = [];
  for (let t = 1; t <= T_PROBE; t++) {
    sub.lastEvents = [];
    K.tick(sub, optsFor(K, famKey));
    const evs = (sub.lastEvents || []).map((e) => ({ x: e.x, y: e.y, slot: e.slot, resonance: e.resonance, term: e.term }));
    for (const e of evs) eventTuples.push([t, e.x, e.y, e.slot, e.resonance]);
    termsByTick.push(evs.map((e) => ({ x: e.x, y: e.y, slot: e.slot, resonance: e.resonance, term: String(e.term) })));
    planeHashes.push(planeHash(sub, t, bytePlane));
    planes.push(new Uint8Array(sub));
    const snap = sub.__wormholes.snapshot();
    const occ20 = snap[SLOT];
    perTick.push({
      t, firings: evs.length,
      firers: evs.map((e) => [e.x, e.y]),
      slot20Occupant: occ20 ? { x: occ20.x, y: occ20.y, resonance: occ20.resonance } : null,
      dA: sub[idxA] & 63, dB: sub[idxB] & 63,
      occupiedCount: sub.__wormholes.occupiedCount(),
    });
  }
  const snap = sub.__wormholes.snapshot();
  return { K: K.name, famKey, control, planes, planeHashes, eventTuples, termsByTick, perTick,
    eventSeqHash: sha256HexStr(JSON.stringify(eventTuples)),
    snapshotHash: sha256HexStr(JSON.stringify(snap)),
    finalSnapshot: snap };
}

// ------------------------------------------------------------- cooker run ---
// typesafe's cooker_diff arm: 64x1 all-Abstain d=0 (byte 192), T=64, sigma=2/3 —
// EXACTLY E-Q7's C_2_3 shape; float-vs-fixed byte-diff per tick + term band.
const cookSeedFn = () => packByte(3, 0);
function runCooker(K) {
  const sub = K.makeSubstrate(COOK_W, COOK_H, cookSeedFn);
  const eventTuples = [];
  const terms = [];
  const planeHashes = [planeHash(sub, 0, bytePlane)];
  const perTick = [];
  for (let t = 1; t <= T_COOK; t++) {
    sub.lastEvents = [];
    K.tick(sub, K === FIXED_K ? { wormholes: true, sigmaQ: FAMILIES['2/3'].q } : { wormholes: true, sigma: FAMILIES['2/3'].real });
    const evs = (sub.lastEvents || []).map((e) => ({ x: e.x, y: e.y, slot: e.slot, resonance: e.resonance, term: e.term }));
    for (const e of evs) eventTuples.push([t, e.x, e.y, e.slot, e.resonance]);
    terms.push(...evs.map((e) => String(e.term)));
    planeHashes.push(planeHash(sub, t, bytePlane));
    const snap = sub.__wormholes.snapshot();
    perTick.push({ t, firings: evs.length, occupiedCount: sub.__wormholes.occupiedCount() });
  }
  const snap = sub.__wormholes.snapshot();
  return { K: K.name, eventTuples, terms, planeHashes, perTick,
    totalWriteAttempts: COOK_W * T_COOK, totalFirings: eventTuples.length,
    eventSeqHash: sha256HexStr(JSON.stringify(eventTuples)),
    snapshotHash: sha256HexStr(JSON.stringify(snap)) };
}

// --------------------------------------------------------------- arm loop ---
const detRows = [], results = { probe: {}, control: {}, cooker: {} };
let allDet = true;

function compactProbe(r) {
  return JSON.stringify(r.perTick.map((p) => [p.t, p.firings, p.firers, p.slot20Occupant, p.dA, p.dB, p.occupiedCount]));
}
function detCheck(kind, arm, r1, r2, compact) {
  const det = r1.eventSeqHash === r2.eventSeqHash && r1.snapshotHash === r2.snapshotHash &&
    JSON.stringify(r1.planeHashes) === JSON.stringify(r2.planeHashes) && compact(r1) === compact(r2);
  if (!det) allDet = false;
  detRows.push({ kind, experiment: 'E-Q8', arm, rerunIdentical: det, eventSeqHash: r1.eventSeqHash, snapshotHash: r1.snapshotHash });
  return det;
}

console.log('[e-q8] probe + control arms (both kernels, x2 fresh reruns, EQ8-D1)...');
for (const famKey of ['2/3', '8/5']) {
  for (const control of [false, true]) {
    const armName = `${control ? 'CONTROL' : 'PROBE'}_${famKey.replace('/', '_')}`;
    const t0 = Date.now();
    const f1 = runProbe(FLOAT_K, famKey, control);
    const f2 = runProbe(FLOAT_K, famKey, control);
    const x1 = runProbe(FIXED_K, famKey, control);
    const x2 = runProbe(FIXED_K, famKey, control);
    const detF = detCheck('det.arm', `float:${armName}`, f1, f2, compactProbe);
    const detX = detCheck('det.arm', `fixed:${armName}`, x1, x2, compactProbe);
    // control sigma-inert: the no-twin baseline must be byte-identical ACROSS kernels
    const sigmaInert = control
      ? (JSON.stringify(f1.planeHashes) === JSON.stringify(x1.planeHashes) && f1.eventSeqHash === x1.eventSeqHash && f1.snapshotHash === x1.snapshotHash)
      : null;
    if (control && !sigmaInert) allDet = false;
    results[control ? 'control' : 'probe'][famKey] = {
      float: f1, fixed: x1,
      run2Hashes: { float: { eventSeqHash: f2.eventSeqHash, snapshotHash: f2.snapshotHash }, fixed: { eventSeqHash: x2.eventSeqHash, snapshotHash: x2.snapshotHash } },
      determinism: { float: detF, fixed: detX }, sigmaInert,
      twinEventsTotal: f1.eventTuples.length,
    };
    console.log(`[e-q8] ${armName}: floatTwinEvents=${f1.eventTuples.length} fixedTwinEvents=${x1.eventTuples.length} t1float(dA=${f1.perTick[0].dA},dB=${f1.perTick[0].dB}) t1fixed(dA=${x1.perTick[0].dA},dB=${x1.perTick[0].dB}) detF=${detF} detX=${detX}${control ? ` sigmaInert=${sigmaInert}` : ''} (${Date.now() - t0}ms)`);
  }
}

// ---------------------------------------- first-divergence audit (EQ8-R8) ---
// At the FIRST divergent tick t*: pre-tick planes byte-identical (minimality),
// every divergent cell a twin-HEARING cell with |dd|=1, tau preserved, classified:
//   ENGINEERED-COUPLED-EXCEPTION: sigma=2/3, acc_reader=-2, r_writer=3 (class i)
//   SIGMA-REPRESENTATION: r*double(sigma)===integer m, acc_reader=-m (class ii)
//   else UNEXPLAINED (falsifier territory).
const auditRows = [];
let anyUnexplained = false;
const familyVerdicts = {};
for (const famKey of ['2/3', '8/5']) {
  const f1 = results.probe[famKey].float, x1 = results.probe[famKey].fixed;
  const f = FAMILIES[famKey];
  let firstDiv = -1;
  for (let t = 0; t <= T_PROBE; t++) if (f1.planeHashes[t] !== x1.planeHashes[t]) { firstDiv = t; break; }
  let audit = null;
  if (firstDiv >= 0) {
    const preF = f1.planes[firstDiv - 1], preX = x1.planes[firstDiv - 1];
    const preIdentical = planeHash(preF, firstDiv - 1, bytePlane) === planeHash(preX, firstDiv - 1, bytePlane);
    const accs = accField(preF, W, H);
    const evF = f1.termsByTick[firstDiv - 1] || [], evX = x1.termsByTick[firstDiv - 1] || [];
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const bf = f1.planes[firstDiv][i], bx = x1.planes[firstDiv][i];
      if (bf === bx) continue;
      const dd = (bx & 63) - (bf & 63);
      const tauOk = (bf >> 6) === (bx >> 6);
      const heardF = evF.find((e) => e.x === x && e.y === y) || null;
      const heardX = evX.find((e) => e.x === x && e.y === y) || null;
      const acc = accs[i];
      const sameTwinStructure = !!(heardF && heardX && heardF.resonance === heardX.resonance && heardF.slot === heardX.slot);
      const rHit = heardF ? heardF.resonance : (heardX ? heardX.resonance : null);
      let cls = 'UNEXPLAINED';
      if (sameTwinStructure && tauOk && Math.abs(dd) === 1) {
        if (famKey === '2/3' && acc === -2 && rHit === 3) cls = 'ENGINEERED-COUPLED-EXCEPTION';
        else if (rHit !== null && Number.isInteger(f.m) && rHit * f.real === f.m && acc === -f.m) cls = 'SIGMA-REPRESENTATION';
      }
      if (cls === 'UNEXPLAINED' || Math.abs(dd) !== 1 || !tauOk || !sameTwinStructure) anyUnexplained = true;
      cells.push({ x, y, dd, tauOk, twinHeard: sameTwinStructure, rHit, readerAcc: acc,
        floatTerm: heardF ? String(heardF.term) : null, fixedTerm: heardX ? String(heardX.term) : null,
        classification: cls });
    }
    audit = { firstDivergenceTick: firstDiv, preTickPlanesIdentical: preIdentical,
      divergentCells: cells.length, maxAbsDd: Math.max(...cells.map((c) => Math.abs(c.dd))),
      classifications: cells.reduce((m, c) => { m[c.classification] = (m[c.classification] || 0) + 1; return m; }, {}),
      cells };
    console.log(`[e-q8] ${famKey}: DIVERGES at t=${firstDiv}, cells=${cells.length}, ${JSON.stringify(audit.classifications)}`);
  } else {
    console.log(`[e-q8] ${famKey}: planes byte-identical to fixed at every tick 0..${T_PROBE}`);
  }
  // hold/move at the first twin hit, mechanically from the d trajectories
  const tStar = firstDiv >= 0 ? firstDiv : 1;
  const fdA = f1.perTick[tStar - 1].dA, fdB = f1.perTick[tStar - 1].dB;
  const xdA = x1.perTick[tStar - 1].dA, xdB = x1.perTick[tStar - 1].dB;
  const pfdB = tStar >= 2 ? f1.perTick[tStar - 2].dB : SLOT, pxdB = tStar >= 2 ? x1.perTick[tStar - 2].dB : SLOT;
  const floatHeld = fdB === pfdB, fixedMoved = xdB !== pxdB;
  const floatHeldA = fdA === (tStar >= 2 ? f1.perTick[tStar - 2].dA : SLOT);
  const firstHitTuplesIdentical =
    JSON.stringify(f1.eventTuples.filter((e) => e[0] === 1)) === JSON.stringify(x1.eventTuples.filter((e) => e[0] === 1));
  const firstHitTuples = f1.eventTuples.filter((e) => e[0] === 1);
  auditRows.push({ kind: 'result.attribution', experiment: 'E-Q8', family: famKey,
    firstDivergenceTick: firstDiv < 0 ? null : firstDiv, audit,
    holdMove: { tStar, floatdB: fdB, floatdBPrev: pfdB, floatHeld, fixeddB: xdB, fixeddBPrev: pxdB, fixedMoved,
      floatdA: fdA, fixeddA: xdA, floatHeldA, fixedMovedA: xdA !== (tStar >= 2 ? x1.perTick[tStar - 2].dA : SLOT) },
    writeOrderEvidence: { firstHitTuples, firstHitTuplesIdentical,
      note: 'twin tuples at the FIRST hit (t=1) identical across kernels => write-order semantics identical; later-tick tuple divergence is the deterministic amplification of the sigma-representation d-split (EQ7-R8: amplification after the audited first divergence is not re-audited)' } });
  familyVerdicts[famKey] = { firstDiv, floatHeld, fixedMoved, audit, firstHitTuplesIdentical };
}

// ---------------------------------------------------- cooker_diff (secondary) ---
console.log('[e-q8] cooker_diff secondary (typesafe 0.76): 64x1 all-Abstain d=0, T=64, sigma=2/3, both kernels x2...');
const cF1 = runCooker(FLOAT_K), cF2 = runCooker(FLOAT_K), cX1 = runCooker(FIXED_K), cX2 = runCooker(FIXED_K);
const cookerDet = {
  float: cF1.eventSeqHash === cF2.eventSeqHash && cF1.snapshotHash === cF2.snapshotHash && JSON.stringify(cF1.planeHashes) === JSON.stringify(cF2.planeHashes),
  fixed: cX1.eventSeqHash === cX2.eventSeqHash && cX1.snapshotHash === cX2.snapshotHash && JSON.stringify(cX1.planeHashes) === JSON.stringify(cX2.planeHashes),
};
if (!cookerDet.float || !cookerDet.fixed) allDet = false;
detRows.push({ kind: 'det.arm', experiment: 'E-Q8', arm: 'float:COOKER_2_3', rerunIdentical: cookerDet.float, eventSeqHash: cF1.eventSeqHash, snapshotHash: cF1.snapshotHash });
detRows.push({ kind: 'det.arm', experiment: 'E-Q8', arm: 'fixed:COOKER_2_3', rerunIdentical: cookerDet.fixed, eventSeqHash: cX1.eventSeqHash, snapshotHash: cX1.snapshotHash });

// byte-diff: per-tick plane hashes + event structure + term band (|termQ - termFloat*S| <= r)
const cookerPlaneByteIdentical = JSON.stringify(cF1.planeHashes) === JSON.stringify(cX1.planeHashes);
const cookerStructureIdentical = cF1.eventSeqHash === cX1.eventSeqHash;
let cookerStructurePaired = cF1.eventTuples.length === cX1.eventTuples.length;
let maxAbsTermDiff = 0, bandViolations = 0;
if (cookerStructurePaired) {
  const S = fixed.SCALE, r = 1; // cooker resonance is 1 everywhere (all accs 0)
  for (let i = 0; i < cF1.eventTuples.length; i++) {
    const tf = Number(cF1.terms[i]), tq = Number(cX1.terms[i]);
    if (!Number.isFinite(tf)) { cookerStructurePaired = false; break; }
    const diff = Math.abs(tq - tf * S);
    if (diff > maxAbsTermDiff) maxAbsTermDiff = diff;
    if (diff > r) bandViolations++;
  }
}

// cross-experiment link: == E-Q7 C_2_3 eventSeqHash (== E-Q6 COOK) read from disk
const eq7Rows = readFileSync(join(RECEIPTS, 'e_q7_chain.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const eq7Cross = eq7Rows.find((row) => row.kind === 'result.crosschain' && row.experiment === 'E-Q7');
const EQ7_C23_HASH = eq7Cross && eq7Cross.cooker && eq7Cross.cooker['2/3'] ? eq7Cross.cooker['2/3'].eventSeqHash : null;
const eq6Rows = readFileSync(join(RECEIPTS, 'e_q6_chain.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const eq6Cook = eq6Rows.find((row) => row.kind === 'result.arm' && row.arm === 'cook');
const EQ6_COOK_HASH = eq6Cook ? eq6Cook.eventSeqHash : null;
const cookerMatchesEQ7 = EQ7_C23_HASH !== null && cF1.eventSeqHash === EQ7_C23_HASH;
const cookerMatchesEQ6 = EQ6_COOK_HASH !== null && cF1.eventSeqHash === EQ6_COOK_HASH;
console.log(`[e-q8] cooker: firings=${cF1.totalFirings}/${cF1.totalWriteAttempts} planesByteIdentical=${cookerPlaneByteIdentical} structureIdentical=${cookerStructureIdentical} ==EQ7_C_2_3=${cookerMatchesEQ7} ==EQ6_COOK=${cookerMatchesEQ6} maxAbsTermDiff=${q(maxAbsTermDiff)} bandViolations=${bandViolations}`);

// ---------------------------------------------------------------- verdict ---
// ESTABLISHED: BOTH families float-held & fixed-moved at the first-divergence
// tick with a clean EQ8-R8 audit (no UNEXPLAINED, |dd|=1, tau preserved, twin
// heard, write-order tuples identical at the first hit), controls sigma-inert,
// EQ8-D1 PASS. NOT-ESTABLISHED: planes agree in BOTH families (audit clean).
// INCONCLUSIVE: anything else (audit violation / determinism failure) — ships honestly.
const fam23 = familyVerdicts['2/3'], fam85 = familyVerdicts['8/5'];
const bothFamiliesDiverge = fam23.firstDiv > 0 && fam85.firstDiv > 0;
const bothHoldMove = fam23.floatHeld && fam23.fixedMoved && fam85.floatHeld && fam85.fixedMoved;
const controlsInert = results.control['2/3'].sigmaInert === true && results.control['8/5'].sigmaInert === true;
const orderEvidence = fam23.firstHitTuplesIdentical && fam85.firstHitTuplesIdentical;
const verdictClean = bothFamiliesDiverge && bothHoldMove && !anyUnexplained && orderEvidence && controlsInert && allDet;
const ESTABLISHED = verdictClean;
const NOT_ESTABLISHED = !bothFamiliesDiverge && !anyUnexplained && controlsInert && allDet;
const VERDICT = ESTABLISHED ? 'ESTABLISHED' : (NOT_ESTABLISHED ? 'NOT-ESTABLISHED' : 'INCONCLUSIVE');
const attrSummary = auditRows.map((a) => `${a.family}:${JSON.stringify(a.audit ? a.audit.classifications : 'planes-identical')}`).join(' ');
const verdictLine = `E-Q8 VERDICT: FLOAT-ONLY-ARTIFACT ${VERDICT} — primary 2/3: float ${fam23.floatHeld ? 'held' : 'moved'} / fixed ${fam23.fixedMoved ? 'moved' : 'held'} at tick ${fam23.firstDiv > 0 ? fam23.firstDiv : 'n/a'} (contested slot ${SLOT}), secondary 8/5: float ${fam85.floatHeld ? 'held' : 'moved'} / fixed ${fam85.fixedMoved ? 'moved' : 'held'} at tick ${fam85.firstDiv > 0 ? fam85.firstDiv : 'n/a'}; first-divergence ticks 2/3=${fam23.firstDiv < 0 ? 'none' : fam23.firstDiv} 8/5=${fam85.firstDiv < 0 ? 'none' : fam85.firstDiv}; attribution ${attrSummary}; determinism EQ8-D1 ${allDet ? 'PASS (all arms byte-identical across fresh reruns, both kernels)' : 'VOID'}; cooker_diff ${cookerPlaneByteIdentical && cookerStructureIdentical ? 'byte-identical planes + identical structure, terms differ within band (maxAbsTermDiff=' + q(maxAbsTermDiff) + ', violations=' + bandViolations + '), ==E-Q7 C_2_3 / E-Q6 COOK: ' + cookerMatchesEQ7 + '/' + cookerMatchesEQ6 : 'DEVIATION FROM SEALED PREDICTION — receipted honestly'}. No floor edited post-run.`;
console.log(`[e-q8] ${verdictLine}`);

// ----------------------------------------------------------------- outputs ---
writeFileSync(join(OUT, 'e_q8_results.json'), JSON.stringify({
  experiment: 'E-Q8',
  claim: 'float-only artifact via S3 same-slot live-read at the uncoupled exact-zero families (registered claim verbatim in pre_registration_e_q8.json)',
  kernel: { float: kernelReport(), fixed: 'fixedpoint/qthe_fixed.mjs (READ-ONLY import)', floatCloneProvenance: cloneProvenance }, stonePath,
  registrationSha256: REG_SHA, mothReceiptSha256: MOTH_RECEIPT_SHA,
  registeredFloor: 'pre_registration_e_q8.json (26b1d3b, PRE-RUN): converged wave-37 probe; moth-chosen PRIMARY 2/3 (bit 1), SECONDARY 8/5; EQ8-D1 carried; EQ8-R8 attribution audit; cooker_diff secondary per typesafe',
  families: FAMILIES, board: { W, H, T_PROBE, SLOT, A_XY, B_XY, PA_XY, PB_XY, cook: { COOK_W, COOK_H, T_COOK } },
  probe: Object.fromEntries(Object.entries(results.probe).map(([k, v]) => [k, {
    determinism: v.determinism, run2Hashes: v.run2Hashes, twinEventsTotal: v.twinEventsTotal,
    float: { K: v.float.K, eventSeqHash: v.float.eventSeqHash, snapshotHash: v.float.snapshotHash,
      planeHashes: v.float.planeHashes, eventTuples: v.float.eventTuples, termsByTick: v.float.termsByTick,
      perTick: v.float.perTick },
    fixed: { K: v.fixed.K, eventSeqHash: v.fixed.eventSeqHash, snapshotHash: v.fixed.snapshotHash,
      planeHashes: v.fixed.planeHashes, eventTuples: v.fixed.eventTuples, termsByTick: v.fixed.termsByTick,
      perTick: v.fixed.perTick },
  }])),
  control: Object.fromEntries(Object.entries(results.control).map(([k, v]) => [k, {
    sigmaInert: v.sigmaInert, determinism: v.determinism, twinEventsTotal: v.twinEventsTotal,
    float: { eventSeqHash: v.float.eventSeqHash, planeHashes: v.float.planeHashes, perTick: v.float.perTick },
    fixed: { eventSeqHash: v.fixed.eventSeqHash, planeHashes: v.fixed.planeHashes, perTick: v.fixed.perTick },
  }])),
  attribution: auditRows,
  cookerDiff: {
    determinism: cookerDet, planesByteIdentical: cookerPlaneByteIdentical, structureIdentical: cookerStructureIdentical,
    totalFirings: cF1.totalFirings, totalWriteAttempts: cF1.totalWriteAttempts,
    maxAbsTermDiff: q(maxAbsTermDiff), bandViolations, bandR: 1,
    floatEventSeqHash: cF1.eventSeqHash, fixedEventSeqHash: cX1.eventSeqHash,
    matchesEQ7_C_2_3: cookerMatchesEQ7, matchesEQ6_COOK: cookerMatchesEQ6,
    eq7C23EventSeqHash: EQ7_C23_HASH, eq6CookEventSeqHash: EQ6_COOK_HASH,
    float: { planeHashes: cF1.planeHashes, perTick: cF1.perTick, termsFirst16: cF1.terms.slice(0, 16) },
    fixed: { planeHashes: cX1.planeHashes, perTick: cX1.perTick, termsFirst16: cX1.terms.slice(0, 16) },
  },
  aggregates: { anyUnexplained, bothFamiliesDiverge, bothHoldMove, controlsInert, orderEvidence, allDet, VERDICT, verdictLine },
}, null, 1));

// ------------------------------------------------------- chain (stone-v1) ---
const rows = [
  { kind: 'rules.EQ8', frozen_by: 'pre_registration_e_q8.json (26b1d3b), committed BEFORE any run; converged wave-37 probe of tavern round seven (deepseek guest r7-q3, deepseek-reasoner, true-cold flash iterator, typesafe cooker_diff 0.76 / p=0.47)',
    registration_sha256: REG_SHA, moth_receipt_sha256: MOTH_RECEIPT_SHA,
    moth_entropy: 'graph-v1 job 1f674719-fa72-45ba-98c5-d71abe31405b (256 shots, emu, 1264-bit canonical stream, 883 ones); mapping declared pre-fire (bit 1 -> 2/3 primary, bit 0 -> 8/5); FIRST bit = 1 -> PRIMARY 2/3; chat lane 404 x2 receipted (known-404, retry-at-most-once honored)',
    floor_verbatim: 'REGISTERED CLAIM: float kernel cell HOLDS (double-rounded sigma yields exactly-zero pressure under live-read) while fixed kernel cell MOVES (honest integer remainder) in the same tick — planes disagree in a way attributable ONLY to sigma representation, write-order semantics identical. REGISTERED FALSIFIER: planes agree at the same-slot same-tick probe in BOTH families, OR divergence attributable to anything other than sigma representation (receipt via kernelReport / order audit).',
    lane_floors: 'EQ8-D1 = EQ7-D1 carried (both kernels, every arm, byte-identical fresh reruns); EQ8-R8 attribution audit at first divergence (SIGMA-REPRESENTATION / ENGINEERED-COUPLED-EXCEPTION / UNEXPLAINED; pre-tick planes byte-identical; |dd|=1; tau preserved; twin-heard; write-order tuples identical at the first hit); controls sigma-inert REQUIRED; amendment-3 floors untouched (addition only)' },
  { kind: 'run.config', experiment: 'E-Q8', kernel: { float: kernelReport(), fixed: 'fixedpoint/qthe_fixed.mjs (READ-ONLY)' }, floatCloneProvenance: cloneProvenance, stone_linked: stonePath,
    task: 'minimal same-slot board 6x3 (A(1,1)+B(2,1) Abstain d=20 SAME slot 20, P_A(0,1)/P_B(3,1) Repel d per family, 14 Ground cells on the d=0 rail); T_PROBE=16; arms PROBE/CONTROL x {2/3, 8/5} both kernels x2 fresh reruns; t=0 acc assertions (accA=-2/-4, accB=-2/-8, P cells 0) LOUD; cooker_diff 64x1 all-Abstain d=0 T=64 sigma=2/3 both kernels x2; sigma counterparts verified vs sigmaToFixed AND fixedpoint/pre_registration.json frozen map; family arithmetic asserted (r*double(sigma)===m; fixed remainder in (0, r]); seed 1337 inert (tick draws no randomness; board hand-seeded)' },
  ...detRows,
  ...auditRows,
  { kind: 'result.cookerDiff', experiment: 'E-Q8', note: 'typesafe cooker_diff secondary: float-vs-fixed byte-diff of the existing 64x1 cooker at sigma=2/3 (E-Q7 C_2_3 shape)',
    planesByteIdentical: cookerPlaneByteIdentical, structureIdentical: cookerStructureIdentical,
    totalFirings: cF1.totalFirings, totalWriteAttempts: cF1.totalWriteAttempts,
    maxAbsTermDiff: q(maxAbsTermDiff), bandViolations, bandR: 1,
    eq7_c23_eventSeqHash: EQ7_C23_HASH, eq6_cook_eventSeqHash: EQ6_COOK_HASH,
    matchesEQ7_C_2_3: cookerMatchesEQ7, matchesEQ6_COOK: cookerMatchesEQ6,
    floatEventSeqHash: cF1.eventSeqHash, fixedEventSeqHash: cX1.eventSeqHash },
  { kind: 'verdict.EQ8', experiment: 'E-Q8', VERDICT, ESTABLISHED, NOT_ESTABLISHED,
    bothFamiliesDiverge, bothHoldMove, controlsInert, orderEvidence, anyUnexplained, allDet,
    familyVerdicts: Object.fromEntries(Object.entries(familyVerdicts).map(([k, v]) => [k, {
      firstDivergenceTick: v.firstDiv, floatHeld: v.floatHeld, fixedMoved: v.fixedMoved,
      classifications: v.audit ? v.audit.classifications : null, firstHitTuplesIdentical: v.firstHitTuplesIdentical }])),
    cooker: { planesByteIdentical: cookerPlaneByteIdentical, structureIdentical: cookerStructureIdentical, matchesEQ7: cookerMatchesEQ7, matchesEQ6: cookerMatchesEQ6, bandViolations },
    verdictLine },
];
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q8', claim: 'float-only artifact via S3 same-slot live-read' });
console.log(`[e-q8] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q8_tip.txt'), `${v.tip} links=${v.links}\n`);
