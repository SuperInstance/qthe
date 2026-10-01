// experiments/e_q9_sweep.mjs — E-Q9 RUN (task 40-c, wave 40, lane qthe-smith).
// The round-8 lever executed: the registered family sweep over the E-Q8 same-slot
// S3 live-read probe, float kernel (qthe.mjs) vs fixed kernel (fixedpoint/qthe_fixed.mjs),
// sigma arms rat / irrFar / irrNear per the E-Q9 registration (8e8578e) and
// situations/eq9_predictions.json. ZERO network, ZERO keys, pure deterministic compute.
//
// REGISTERED FLOORS HONORED HERE (no floor edited):
//   - census recompute from the registered bounds + sha256 assert (552d171c…) BEFORE the first tick
//   - family predicate: k=1 exact-zero family of sigma=n/dd (lowest terms): acc_reader=-n,
//     writer resonance r=dd, writer acc=-(dd-1); stable space n<=252, dd<=253
//   - sigma arms: rat=double(n/dd), irrFar=Math.SQRT2, irrNear=double(n/dd + SQRT2*2^-52)
//   - fixed kernel gets the frozen integer sigmaQ = Math.round(sigma*2^32), asserted
//     against fixedpoint/qthe_fixed.mjs sigmaToFixed at run time (the ONE float door)
//   - EQ9-D1: every (family x arm x kernel) run TWICE from fresh construction, byte-identical
//   - EQ8-R8 taxonomy extended BY ADDITION: QUANTIZATION-BLINDNESS (twin-heard, |dd|=2,
//     opposite directions, true pressure inside r*2^-33 band), FIXED-BLIND-INVERSION
//     (twin-heard, |dd|=1, fixed holds while float moves); everything else UNEXPLAINED
//   - primaries: 2/3, 8/5, 7/10 full per-tick traces + twin tuples + no-twin controls
//     (A -> Ground) with sigmaInert REQUIRED
//   - board: E-Q8 same-slot probe geometry SCALED TO THE REPEL MASS (registered language):
//     W=9 H=5 torus, A=(1,2) B=(6,2) Abstain d=20 SAME slot 20 (row-major A before B —
//     S3 live-read preserved), each writer tuned by up to 4 PAIRWISE NON-ADJACENT Repel
//     ring cells (the registered independence-number cap 4 x d<=63 = 252), all other
//     cells Ground d=0; t=0 acc assertions LOUD per run (acc(A)=-(dd-1), acc(B)=-n,
//     every Repel acc=0)
import { writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { makeSubstrate, tick as floatTick } from '../qthe.mjs';
import * as fixed from '../fixedpoint/qthe_fixed.mjs';
import { planeHash, sha256HexStr, packByte } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');

// ── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const LIMIT = parseInt(argOf('--limit', '0'), 10);        // 0 = full registered sweep
const ONLY = argOf('--only', '');                          // "n/dd,n/dd" primary-style subset
const RESUME = args.includes('--resume');

// ── registered constants (VERBATIM from eq9_family_census.mjs) ──────────────
const S = 2 ** 32;
const sha = (s) => sha256HexStr(s);
const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
const CENSUS_DD_MAX = 1000, CENSUS_N_MAX = 504, STABLE_N_MAX = 252, STABLE_DD_MAX = 253;
const IRR_STEP = Math.SQRT2 * 2 ** -52;
const EXPECTED_TABLE_SHA = '552d171c6ddf2cdd5b7a87cc28cae2c2eb8435a560ad66aa934225eb6dbc20f6';

// ── census recompute (VERBATIM arithmetic from eq9_family_census.mjs) ───────
function classify(n, dd, sigmaDouble, truePressureInBand) {
  const termF = dd * sigmaDouble;
  const fColl = termF === n;
  const fPressure = -n + termF;
  const sigmaQ = Math.round(sigmaDouble * S);
  const fxPressure = dd * sigmaQ - n * S;
  const fxHold = fxPressure === 0;
  const fSign = sign(fPressure), fxSign = sign(fxPressure);
  let cls;
  if (fColl && fxHold) cls = 'D';
  else if (fColl && !fxHold) cls = 'A';
  else if (!fColl && fxHold) cls = 'F-INV';
  else if (fSign === fxSign) cls = 'B';
  else cls = 'C';
  return { fColl, fPressure, sigmaQ, fxPressure, fxHold, fSign, fxSign, cls, inBand: truePressureInBand };
}
const censusRows = [];
for (let dd = 1; dd <= CENSUS_DD_MAX; dd++) {
  for (let n = 1; n <= CENSUS_N_MAX; n++) {
    if (gcd(n, dd) !== 1) continue;
    const sigma = n / dd;
    if (!(sigma < 1024)) continue;
    const stable = n <= STABLE_N_MAX && dd <= STABLE_DD_MAX;
    const kernelReachable = n <= CENSUS_N_MAX && dd <= 505;
    const rat = classify(n, dd, sigma, true);
    const sigma2 = sigma + IRR_STEP;
    const true2 = -n + dd * (sigma + Math.SQRT2 * 2 ** -52);
    const near = classify(n, dd, sigma2, Math.abs(true2) <= dd * 2 ** -33);
    const degenerate = sigma2 === sigma;
    const far = classify(n, dd, Math.SQRT2, false);
    const farLiouvilleMargin = Math.abs(n * n - 2 * dd * dd) / (dd * dd * (Math.SQRT2 + sigma));
    censusRows.push({ n, dd, sigmaKey: `${n}/${dd}`, stable, kernelReachable, dyadic: (dd & (dd - 1)) === 0,
      rat: { cls: rat.cls, fColl: rat.fColl, fxPressure: rat.fxPressure, fSign: rat.fSign, fxSign: rat.fxSign },
      near: { cls: near.cls, fColl: near.fColl, fxPressure: near.fxPressure, degenerate, inBand: near.inBand },
      far: { cls: far.cls, fColl: far.fColl, fxPressure: far.fxPressure, fSign: far.fSign, fxSign: far.fxSign,
        liouvilleMargin: farLiouvilleMargin } });
  }
}
const bounds_registered = { census_dd_max: CENSUS_DD_MAX, census_n_max: CENSUS_N_MAX,
  stable_n_max: STABLE_N_MAX, stable_dd_max: STABLE_DD_MAX,
  stable_justification: 'stable Repel engineering caps one cell mass at 4 non-adjacent Moore-8 ring cells x d<=63 = 252 (independence number of the neighbor ring); E-Q8 every-tick tuning-stability law requires acc(P)==0 at every tick',
  out_of_space_note: 'dd>505: writer resonance unhostable even unstably (|acc|<=504 kernel ceiling); 253<dd<=505: kernel-reachable only via drifting adjacent Repel cells (breaks the every-tick tuning assertion) — receipted OUT-OF-ENGINEERING-SPACE, not silently dropped; n in (252,504]: same for the reader',
  sigma_arms: { rat: 'double(n/dd) — the family point', irrFar: 'Math.SQRT2 — family-distant irrational', irrNear: 'double(n/dd + SQRT2*2^-52) — irrational step ~1-3 ulp above the family point' } };
const tableSha = sha(JSON.stringify({ generatedBy: 'eq9_family_census.mjs', bounds: bounds_registered, rows: censusRows }));
if (tableSha !== EXPECTED_TABLE_SHA) {
  throw new Error(`e-q9: census recompute sha ${tableSha} != registered ${EXPECTED_TABLE_SHA} — LOUD failure BEFORE first tick`);
}
console.log(`[e-q9] census recompute OK: ${censusRows.length} rows, sha ${tableSha.slice(0, 16)}… == registered`);

// ── kernel doors ────────────────────────────────────────────────────────────
const FLOAT_K = { name: 'float:qthe.mjs', makeSubstrate, tick: floatTick };
const FIXED_K = { name: 'fixed:qthe_fixed.mjs', makeSubstrate: fixed.makeSubstrate, tick: fixed.tick };
// sigmaQ re-derivation assert (registered): the runner's Math.round(sigma*S) must equal
// the fixed kernel's own sigmaToFixed door on every arm sigma used.
let sigmaDoorChecked = 0;
function sigmaQFor(sigmaReal) {
  const q = Math.round(sigmaReal * S);
  const door = fixed.sigmaToFixed(sigmaReal);
  if (door !== q) throw new Error(`e-q9: sigmaToFixed(${sigmaReal})=${door} != runner re-derivation ${q} — LOUD failure`);
  sigmaDoorChecked++;
  return q;
}

// ── board (E-Q8 same-slot probe geometry scaled to the Repel mass) ──────────
const W = 9, H = 5, SLOT = 20, T_SWEEP = 16;
const A_XY = [1, 2], B_XY = [6, 2];
const PA_SLOTS = [[0, 1], [2, 1], [0, 3], [2, 3]];   // 4 pairwise non-adjacent ring cells of A
const PB_SLOTS = [[5, 1], [7, 1], [5, 3], [7, 3]];   // 4 pairwise non-adjacent ring cells of B
function massParts(M) {                               // deterministic fewest-parts split, each <= 63
  const parts = []; let m = M;
  while (m > 63) { parts.push(63); m -= 63; }
  if (m > 0) parts.push(m);
  return parts;
}
function boardSeedFn(n, dd, control) {
  const cellMap = new Map();
  if (!control) cellMap.set(`${A_XY[0]},${A_XY[1]}`, packByte(3, SLOT));
  cellMap.set(`${B_XY[0]},${B_XY[1]}`, packByte(3, SLOT));
  const pa = massParts(dd - 1), pb = massParts(n);
  if (pa.length > 4 || pb.length > 4) throw new Error(`e-q9: mass split needs >4 Repels (n=${n},dd=${dd}) — outside registered stable space, LOUD failure`);
  pa.forEach((d, i) => cellMap.set(`${PA_SLOTS[i][0]},${PA_SLOTS[i][1]}`, packByte(2, d)));
  pb.forEach((d, i) => cellMap.set(`${PB_SLOTS[i][0]},${PB_SLOTS[i][1]}`, packByte(2, d)));
  return (x, y) => cellMap.get(`${x},${y}`) ?? 0;
}
// harness-side integer acc meter (E-Q8 pattern, generalized)
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
function assertSeed(n, dd, control, sub) {
  const accs = accField(new Uint8Array(sub));
  const at = (p) => accs[p[1] * W + p[0]];
  const idxA = A_XY[1] * W + A_XY[0], idxB = B_XY[1] * W + B_XY[0];
  const wantA = -(dd - 1); // A sees its Repel ring whether Abstain (probe) or Ground (control) — E-Q8 control precedent
  if (sub[idxA] !== (control ? 0 : packByte(3, SLOT))) throw new Error(`e-q9: A byte wrong n=${n}/dd=${dd}`);
  if (sub[idxB] !== packByte(3, SLOT)) throw new Error(`e-q9: B byte wrong n=${n}/dd=${dd}`);
  if (at(A_XY) !== wantA) throw new Error(`e-q9: t=0 acc(A)=${at(A_XY)} != ${wantA} (n=${n}/dd=${dd}) — tuning assertion LOUD failure`);
  if (at(B_XY) !== -n) throw new Error(`e-q9: t=0 acc(B)=${at(B_XY)} != ${-n} (n=${n}/dd=${dd}) — tuning assertion LOUD failure`);
  for (const [x, y] of [...PA_SLOTS, ...PB_SLOTS]) {
    if (accs[y * W + x] !== 0) throw new Error(`e-q9: Repel (${x},${y}) acc != 0 (n=${n}/dd=${dd}) — stability assertion LOUD failure`);
  }
}

// ── one run ─────────────────────────────────────────────────────────────────
const bytePlane = (sub) => sub.bytes ?? sub;   // kernel substrate carries .bytes (itself); stored plane copies are raw
function optsFor(K, sigmaReal, sigmaQint) {
  return K === FIXED_K ? { wormholes: true, sigmaQ: sigmaQint } : { wormholes: true, sigma: sigmaReal };
}
function runOnce(K, n, dd, sigmaReal, sigmaQint, control, full, trace) {
  const sub = K.makeSubstrate(W, H, boardSeedFn(n, dd, control));
  assertSeed(n, dd, control, sub);
  const idxA = A_XY[1] * W + A_XY[0], idxB = B_XY[1] * W + B_XY[0];
  const planeHashes = [planeHash(sub, 0, bytePlane)];
  const planes = full ? [new Uint8Array(sub)] : null;
  const eventTuples = [];
  const termsByTick = full ? [] : null;
  const perTick = [];
  for (let t = 1; t <= T_SWEEP; t++) {
    sub.lastEvents = [];
    K.tick(sub, optsFor(K, sigmaReal, sigmaQint));
    const evs = (sub.lastEvents || []).map((e) => ({ x: e.x, y: e.y, slot: e.slot, resonance: e.resonance, term: e.term }));
    for (const e of evs) eventTuples.push([t, e.x, e.y, e.slot, e.resonance]);
    if (full) termsByTick.push(evs.map((e) => ({ x: e.x, y: e.y, slot: e.slot, resonance: e.resonance, term: String(e.term) })));
    planeHashes.push(planeHash(sub, t, bytePlane));
    if (full) planes.push(new Uint8Array(sub));
    perTick.push(full && trace
      ? { t, firings: evs.length, firers: evs.map((e) => [e.x, e.y]), dA: sub[idxA] & 63, dB: sub[idxB] & 63,
          slot20: (() => { const s = sub.__wormholes.snapshot()[SLOT]; return s ? { x: s.x, y: s.y, resonance: s.resonance } : null; })() }
      : { t, firings: evs.length, firers: evs.map((e) => [e.x, e.y]), dA: sub[idxA] & 63, dB: sub[idxB] & 63 });
  }
  const snap = sub.__wormholes.snapshot();
  return { K: K.name, planes, planeHashes, eventTuples, termsByTick, perTick,
    eventSeqHash: sha256HexStr(JSON.stringify(eventTuples)),
    snapshotHash: sha256HexStr(JSON.stringify(snap)),
    compact: JSON.stringify(perTick) };
}

// ── true-pressure helper for the in-band check (extended taxonomy) ──────────
// true pressure of a twin at (acc_reader, r_hit) under the arm's REAL sigma
function truePressure(arm, n, dd, acc, r) {
  if (arm === 'rat') { const num = acc * dd + r * n; return num / dd; }         // exact rational
  if (arm === 'near') { const num = acc * dd + r * n; return num / dd + r * Math.SQRT2 * 2 ** -52; }
  return acc + r * Math.SQRT2;                                                   // far
}
const inBand = (trueP, r) => Math.abs(trueP) <= r * 2 ** -33;

// ── first-divergence audit (EQ8-R8 + registered extension) ──────────────────
function auditPair(arm, n, dd, f, x) {
  let firstDiv = -1;
  for (let t = 0; t <= T_SWEEP; t++) if (f.planeHashes[t] !== x.planeHashes[t]) { firstDiv = t; break; }
  if (firstDiv < 0) {
    const dbf = f.perTick[0].dB;                          // byte-identical: read either plane
    return { firstDiv, byteIdentical16: true, cells: [], obs: dbf === SLOT ? 'IDENTICAL-HOLD' : 'IDENTICAL-MOVE' };
  }
  const byteIdentical16 = false;
  const preF = f.planes[firstDiv - 1], preX = x.planes[firstDiv - 1];
  const preIdentical = planeHash(preF, firstDiv - 1, bytePlane) === planeHash(preX, firstDiv - 1, bytePlane);
  const accs = accField(preF);
  const evF = f.termsByTick[firstDiv - 1] || [], evX = x.termsByTick[firstDiv - 1] || [];
  const sigmaReal = arm === 'rat' ? n / dd : arm === 'near' ? n / dd + IRR_STEP : Math.SQRT2;
  const cells = [];
  for (let y = 0; y < H; y++) for (let x0 = 0; x0 < W; x0++) {
    const i = y * W + x0;
    const bf = f.planes[firstDiv][i], bx = x.planes[firstDiv][i];
    if (bf === bx) continue;
    const ddCell = (bx & 63) - (bf & 63);
    const tauOk = (bf >> 6) === (bx >> 6);
    const heardF = evF.find((e) => e.x === x0 && e.y === y) || null;
    const heardX = evX.find((e) => e.x === x0 && e.y === y) || null;
    const acc = accs[i];
    const sameTwinStructure = !!(heardF && heardX && heardF.resonance === heardX.resonance && heardF.slot === heardX.slot);
    const rHit = heardF ? heardF.resonance : (heardX ? heardX.resonance : null);
    const fMoved = (bf & 63) !== (preF[i] & 63), xMoved = (bx & 63) !== (preX[i] & 63);
    const fHeld = !fMoved, xHeld = !xMoved;
    let cls = 'UNEXPLAINED';
    if (!sameTwinStructure || !tauOk) cls = 'UNEXPLAINED';
    else if (fHeld && xMoved && ddCell === 1 * sign((bx & 63) - (bf & 63)) && Math.abs(ddCell) === 1) cls = 'SIGMA-REPRESENTATION';
    else if (xHeld && fMoved && Math.abs(ddCell) === 1) cls = 'FIXED-BLIND-INVERSION';
    else if (Math.abs(ddCell) === 2 && sign(ddCell) === -(sign((bf & 63) - (preF[i] & 63)) * 1) && inBand(truePressure(arm, n, dd, acc, rHit), rHit)) cls = 'QUANTIZATION-BLINDNESS';
    cells.push({ x: x0, y, dd: ddCell, tauOk, heard: !!heardF || !!heardX, rHit, fHeld, xHeld, cls,
      accReader: acc, inBand: cls === 'QUANTIZATION-BLINDNESS' ? true : undefined });
  }
  // observed class for the sweep row (census-comparable)
  let obs;
  if (firstDiv === 1 && cells.length === 1 && cells[0].x === B_XY[0] && cells[0].y === B_XY[1]) {
    if (cells[0].fHeld && !cells[0].xHeld && Math.abs(cells[0].dd) === 1) obs = 'DIV1-A';
    else if (!cells[0].fHeld && cells[0].xHeld && Math.abs(cells[0].dd) === 1) obs = 'DIV1-FINV';
    else if (Math.abs(cells[0].dd) === 2) obs = 'DIV1-C';
    else obs = 'DIV1-OTHER';
  } else obs = `DIV${firstDiv}-${cells.length}cell`;
  return { firstDiv, byteIdentical16, preIdentical, cells, obs };
}

// ── family set ──────────────────────────────────────────────────────────────
let stable = censusRows.filter((r) => r.stable);
stable.sort((a, b) => (a.dd - b.dd) || (a.n - b.n));      // registered deterministic census order
if (ONLY) {
  const keys = new Set(ONLY.split(','));
  stable = stable.filter((r) => keys.has(r.sigmaKey));
}
if (LIMIT > 0) stable = stable.slice(0, LIMIT);
console.log(`[e-q9] sweep set: ${stable.length} families x 3 arms x 2 kernels x 2 (EQ9-D1), T=${T_SWEEP}, board ${W}x${H}`);

// ── resume support ──────────────────────────────────────────────────────────
const ROWS_PATH = join(OUT, 'eq9_sweep_rows.jsonl');
const done = new Set();
if (RESUME && existsSync(ROWS_PATH)) {
  for (const line of readFileSync(ROWS_PATH, 'utf8').split('\n')) {
    const s = line.trim(); if (!s) continue;
    const r = JSON.parse(s); done.add(`${r.k}|${r.a}`);
  }
  console.log(`[e-q9] resume: ${done.size} rows already on disk`);
}

// ── the sweep ───────────────────────────────────────────────────────────────
const t0 = Date.now();
let buf = [];
let flushAt = 2000;
function flush() { if (buf.length) { appendFileSync(ROWS_PATH, buf.join('\n') + '\n'); buf = []; } }

const tallies = { rat: {}, near: {}, far: {} };
const holes = [];            // UNEXPLAINED cells (full detail, capped)
const d1Failures = [];
const eFlags = { e1: true, e2: true, e3: true, e4: true, e5: true, e6: true, e7: true, e8: true, e9: true, e10: true };
const eMisses = { e1: [], e2: [], e3: [], e4: [], e5: [], e6: [], e7: [], e8: [], e9: [], e10: [] };
let primaries = {};

function scoreRow(censusCls, arm, res, key) {
  const { obs, firstDiv, cells } = res;
  if (arm === 'rat') {
    if (censusCls === 'A' && !(obs === 'DIV1-A' && firstDiv === 1 && cells.length === 1 && cells[0].heard && cells[0].tauOk)) { eFlags.e2 = false; eMisses.e2.push(key); }
    if (censusCls === 'B' && obs !== 'IDENTICAL-MOVE') { eFlags.e3 = false; eMisses.e3.push(key); }
    if (censusCls === 'C' && !(firstDiv === 1 && cells.length === 1 && Math.abs(cells[0]?.dd) === 2)) { eFlags.e4 = false; eMisses.e4.push(key); }
    if (censusCls === 'D' && obs !== 'IDENTICAL-HOLD') { eFlags.e5 = false; eMisses.e5.push(key); }
    if (obs.startsWith('DIV') && cells.length === 1 && (cells[0].x !== B_XY[0] || cells[0].y !== B_XY[1])) { eFlags.e10 = false; eMisses.e10.push(key); }
    if (obs.startsWith('DIV') && cells.length !== 1) { eFlags.e10 = false; eMisses.e10.push(key); }
  }
  if (arm === 'far' && !res.byteIdentical16) { eFlags.e6 = false; eMisses.e6.push(key); }
  for (const c of cells) if (c.cls === 'UNEXPLAINED') eFlags.e8 = false;
}

for (let fi = 0; fi < stable.length; fi++) {
  const row = stable[fi];
  const { n, dd, sigmaKey } = row;
  const key = sigmaKey;
  const perArm = {};
  for (const arm of ['rat', 'near', 'far']) {
    if (done.has(`${key}|${arm}`)) continue;
    const sigmaReal = arm === 'rat' ? n / dd : arm === 'near' ? n / dd + IRR_STEP : Math.SQRT2;
    const sigmaQint = sigmaQFor(sigmaReal);
    const f1 = runOnce(FLOAT_K, n, dd, sigmaReal, sigmaQint, false, true, false);
    const f2 = runOnce(FLOAT_K, n, dd, sigmaReal, sigmaQint, false, false, false);
    const x1 = runOnce(FIXED_K, n, dd, sigmaReal, sigmaQint, false, true, false);
    const x2 = runOnce(FIXED_K, n, dd, sigmaReal, sigmaQint, false, false, false);
    const d1f = f1.eventSeqHash === f2.eventSeqHash && f1.snapshotHash === f2.snapshotHash && f1.compact === f2.compact
      && JSON.stringify(f1.planeHashes) === JSON.stringify(f2.planeHashes);
    const d1x = x1.eventSeqHash === x2.eventSeqHash && x1.snapshotHash === x2.snapshotHash && x1.compact === x2.compact
      && JSON.stringify(x1.planeHashes) === JSON.stringify(x2.planeHashes);
    if (!d1f || !d1x) { eFlags.e9 = false; d1Failures.push({ key, arm }); eMisses.e9.push(`${key}/${arm}`); }
    const audit = auditPair(arm, n, dd, f1, x1);
    const res = {
      k: key, a: arm, obs: audit.obs, fd: audit.firstDiv,
      nc: audit.cells.length,
      cls: audit.cells.map((c) => c.cls),
      dds: audit.cells.map((c) => c.dd),
      bi: audit.byteIdentical16, pre: audit.byteIdentical16 ? undefined : audit.preIdentical,
      d1: d1f && d1x,
      cq: arm === 'rat' ? row.rat.cls : arm === 'near' ? (row.near.degenerate ? row.rat.cls : row.near.cls) : row.far.cls,
      deg: arm === 'near' ? row.near.degenerate : undefined,
    };
    // degenerate near arm must equal the rat arm byte-for-byte (arithmetic prediction:
    // sigma2 === sigma in double => identical kernel inputs => identical planes)
    if (arm === 'near' && row.near.degenerate && perArm.rat) {
      res.degMatch = f1.planeHashes.join('') === perArm.rat.fHashes.join('');
      if (!res.degMatch) { eFlags.e7 = false; eMisses.e7.push(`${key}/near-degenerate-mismatch`); }
    }
    // census-class ↔ obs mapping checks (E1/E7 at tally time)
    const tallyKey = arm === 'rat' ? (audit.byteIdentical16 ? (f1.perTick[0].dB === SLOT ? 'D' : 'B') : audit.obs === 'DIV1-A' ? 'A' : audit.obs === 'DIV1-FINV' ? 'F-INV' : audit.obs === 'DIV1-C' ? 'C' : 'OTHER')
      : arm === 'near' ? (audit.byteIdentical16 ? (f1.perTick[0].dB === SLOT ? 'D' : 'B') : audit.obs === 'DIV1-A' ? 'A' : audit.obs === 'DIV1-FINV' ? 'F-INV' : audit.obs === 'DIV1-C' ? 'C' : 'OTHER')
      : (audit.byteIdentical16 ? 'B' : 'OTHER');
    tallies[arm][tallyKey] = (tallies[arm][tallyKey] || 0) + 1;
    scoreRow(res.cq, arm, audit, `${key}/${arm}`);
    for (const c of audit.cells) if (c.cls === 'UNEXPLAINED' && holes.length < 4000) {
      holes.push({ key: `${key}/${arm}`, firstDiv: audit.firstDiv, cell: c });
    }
    perArm[arm] = res;
    perArm[arm].fHashes = f1.planeHashes;
    buf.push(JSON.stringify({ k: key, a: arm, obs: res.obs, fd: res.fd, nc: res.nc, cls: res.cls, dds: res.dds, bi: res.bi, pre: res.pre, d1: res.d1, cq: res.cq, deg: res.deg, dm: res.degMatch }));
  }
  if (fi % 2000 === 0) {
    flush();
    const el = (Date.now() - t0) / 1000;
    console.log(`[e-q9] ${fi}/${stable.length} families (${el.toFixed(0)}s, ${(el / (fi + 1) * stable.length / 60).toFixed(1)}min projected)`);
  }
  if (buf.length >= flushAt) flush();
}
flush();

console.log(`[e-q9] sweep loop done in ${((Date.now() - t0) / 1000).toFixed(0)}s — tallies: ${JSON.stringify(tallies)}`);

// ── primaries: 2/3, 8/5, 7/10 full traces + controls + sigmaInert ───────────
function fullTrace(n, dd, arm, control) {
  const sigmaReal = arm === 'rat' ? n / dd : arm === 'near' ? n / dd + IRR_STEP : Math.SQRT2;
  const sigmaQint = sigmaQFor(sigmaReal);
  const f = runOnce(FLOAT_K, n, dd, sigmaReal, sigmaQint, control, true, true);
  const f2 = runOnce(FLOAT_K, n, dd, sigmaReal, sigmaQint, control, false, false);
  const x = runOnce(FIXED_K, n, dd, sigmaReal, sigmaQint, control, true, true);
  const x2 = runOnce(FIXED_K, n, dd, sigmaReal, sigmaQint, control, false, false);
  return {
    sigmaReal: String(sigmaReal), sigmaQ: sigmaQint,
    // D1 note: det compares the rerun on shape-independent receipts only (event-seq hash +
    // table snapshot hash + all 17 plane hashes) — the compact perTick strings differ in SHAPE
    // between trace mode (slot20 occupant) and audit mode, so they are not comparable here;
    // the like-for-like compact D1 check runs in the sweep loop (E9, all rows).
    float: { planeHashes: f.planeHashes, eventTuples: f.eventTuples, termsByTick: f.termsByTick, perTick: f.perTick,
      eventSeqHash: f.eventSeqHash, snapshotHash: f.snapshotHash, det: f.eventSeqHash === f2.eventSeqHash && f.snapshotHash === f2.snapshotHash && JSON.stringify(f.planeHashes) === JSON.stringify(f2.planeHashes) },
    fixed: { planeHashes: x.planeHashes, eventTuples: x.eventTuples, termsByTick: x.termsByTick, perTick: x.perTick,
      eventSeqHash: x.eventSeqHash, snapshotHash: x.snapshotHash, det: x.eventSeqHash === x2.eventSeqHash && x.snapshotHash === x2.snapshotHash && JSON.stringify(x.planeHashes) === JSON.stringify(x2.planeHashes) },
    sigmaInert: control ? (JSON.stringify(f.planeHashes) === JSON.stringify(x.planeHashes) && f.eventSeqHash === x.eventSeqHash && f.snapshotHash === x.snapshotHash) : undefined,
    audit: control ? null : auditPair(arm, n, dd, f, x),
  };
}
// ── E-Q8 board primaries: the EXACT E-Q8 6x3 geometry (byte-level cross-experiment link) ──
const EQ8 = { W: 6, H: 3, SLOT: 20, A: [1, 1], B: [2, 1], PA: [0, 1], PB: [3, 1], T: 16 };
function runEq8Board(K, n, dd, control) {
  const sigmaReal = n / dd, sigmaQint = sigmaQFor(sigmaReal);
  const cellMap = new Map();
  cellMap.set(`${EQ8.PA[0]},${EQ8.PA[1]}`, packByte(2, dd - 1));
  cellMap.set(`${EQ8.PB[0]},${EQ8.PB[1]}`, packByte(2, n));
  if (!control) cellMap.set(`${EQ8.A[0]},${EQ8.A[1]}`, packByte(3, EQ8.SLOT));
  cellMap.set(`${EQ8.B[0]},${EQ8.B[1]}`, packByte(3, EQ8.SLOT));
  const sub = K.makeSubstrate(EQ8.W, EQ8.H, (x, y) => cellMap.get(`${x},${y}`) ?? 0);
  const accs = accField(new Uint8Array(sub));
  if (accs[EQ8.A[1] * EQ8.W + EQ8.A[0]] !== -(dd - 1)) throw new Error(`e-q9 eq8board: acc(A) != -(dd-1) for ${n}/${dd}`);
  if (accs[EQ8.B[1] * EQ8.W + EQ8.B[0]] !== -n) throw new Error(`e-q9 eq8board: acc(B) != -n for ${n}/${dd}`);
  const planeHashes = [planeHash(sub, 0, bytePlane)];
  const eventTuples = [], perTick = [];
  for (let t = 1; t <= EQ8.T; t++) {
    sub.lastEvents = [];
    K.tick(sub, K === FIXED_K ? { wormholes: true, sigmaQ: sigmaQint } : { wormholes: true, sigma: sigmaReal });
    for (const e of sub.lastEvents || []) eventTuples.push([t, e.x, e.y, e.slot, e.resonance]);
    planeHashes.push(planeHash(sub, t, bytePlane));
    const iA = EQ8.A[1] * EQ8.W + EQ8.A[0], iB = EQ8.B[1] * EQ8.W + EQ8.B[0];
    perTick.push({ t, dA: sub[iA] & 63, dB: sub[iB] & 63 });
  }
  return { planeHashes, eventTuples, eventSeqHash: sha256HexStr(JSON.stringify(eventTuples)), perTick };
}
// hard cross-experiment assert: same board bytes + same kernels at R8 => E-Q9's eq8board runs
// must reproduce the RECEIPTED E-Q8 plane hashes bit-for-bit (e_q8_results.json from disk)
const eq8Receipt = JSON.parse(readFileSync(join(HERE, 'outputs', 'e_q8_results.json'), 'utf8'));
for (const pk of ['2/3', '8/5']) {
  const [n, dd] = pk.split('/').map(Number);
  const f = runEq8Board(FLOAT_K, n, dd, false), x = runEq8Board(FIXED_K, n, dd, false);
  const rf = eq8Receipt.probe[pk].float.planeHashes, rx = eq8Receipt.probe[pk].fixed.planeHashes;
  const okF = JSON.stringify(f.planeHashes) === JSON.stringify(rf);
  const okX = JSON.stringify(x.planeHashes) === JSON.stringify(rx);
  if (!okF || !okX) throw new Error(`e-q9: eq8board ${pk} does NOT reproduce the receipted E-Q8 plane hashes (float=${okF} fixed=${okX}) — kernel drift, LOUD failure BEFORE the sweep`);
  console.log(`[e-q9] eq8board ${pk}: plane hashes reproduce receipted E-Q8 byte-for-byte (17/17 float, 17/17 fixed)`);
}

for (const pk of ['2/3', '8/5', '7/10']) {
  const [n, dd] = pk.split('/').map(Number);
  primaries[pk] = {
    rat: fullTrace(n, dd, 'rat', false),
    near: fullTrace(n, dd, 'near', false),
    far: fullTrace(n, dd, 'far', false),
    control_rat: fullTrace(n, dd, 'rat', true),
    eq8board_rat: { float: runEq8Board(FLOAT_K, n, dd, false), fixed: runEq8Board(FIXED_K, n, dd, false), control_float: runEq8Board(FLOAT_K, n, dd, true), control_fixed: runEq8Board(FIXED_K, n, dd, true) },
  };
  primaries[pk].eq8board_rat.controlSigmaInert = JSON.stringify(primaries[pk].eq8board_rat.control_float.planeHashes) === JSON.stringify(primaries[pk].eq8board_rat.control_fixed.planeHashes);
  console.log(`[e-q9] primary ${pk}: rat firstDiv=${primaries[pk].rat.audit?.firstDiv} obs=${primaries[pk].rat.audit?.obs} controlSigmaInert=${primaries[pk].control_rat.sigmaInert}/${primaries[pk].eq8board_rat.controlSigmaInert}`);
}

// ── E1/E7 census-count comparisons ──────────────────────────────────────────
const censusStable = { rat: { A: 0, D: 0, B: 0, C: 0 }, near: {}, far: {} };
for (const r of stable) {
  censusStable.rat[r.rat.cls]++;
  if (r.near.degenerate) censusStable.near[r.rat.cls] = (censusStable.near[r.rat.cls] || 0) + 1;
  else censusStable.near[r.near.cls] = (censusStable.near[r.near.cls] || 0) + 1;
  censusStable.far[r.far.cls] = (censusStable.far[r.far.cls] || 0) + 1;
}
// degenerate near families ran with sigma2 === sigma: their runs equal their rat runs —
// the near tally already recorded what the RUN observed; compare tallies to census-mapped counts
function mapObs(t) { // observed tallies (already census-named: A/F-INV/C/B/D/OTHER) -> comparison shape
  return {
    A: t['A'] || 0, 'F-INV': t['F-INV'] || 0, C: t['C'] || 0,
    B: t['B'] || 0, D: t['D'] || 0,
    OTHER: (t['OTHER'] || 0) + (t['DIV1-OTHER'] || 0)
      + Object.keys(t).filter((k) => k.startsWith('DIV') && k !== 'DIV1-A' && k !== 'DIV1-FINV' && k !== 'DIV1-C' && k !== 'DIV1-OTHER').reduce((s, k) => s + t[k], 0),
  };
}
const observedMapped = { rat: mapObs(tallies.rat), near: mapObs(tallies.near), far: mapObs(tallies.far) };
function countsEqual(a, b, ignore) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) { if (ignore && ignore.includes(k)) continue; if ((a[k] || 0) !== (b[k] || 0)) return false; }
  return true;
}
// E1: rat observed == census rat (A/D/B/C exact; an observed F-INV at rat would be a T2
// violation = kernel bug, so it must FAIL, not be ignored; OTHER = t>=2 first divergences)
eFlags.e1 = countsEqual(observedMapped.rat, censusStable.rat, ['OTHER']);
if (!eFlags.e1) eMisses.e1.push({ observed: observedMapped.rat, census: censusStable.rat });
// E7: near observed == census near (incl. F-INV 379 + degenerate behavior)
eFlags.e7 = countsEqual(observedMapped.near, censusStable.near, ['OTHER']);
if (!eFlags.e7) eMisses.e7.push({ observed: observedMapped.near, census: censusStable.near });

const results = {
  receipt: 'e_q9_sweep (E-Q9 RUN, task 40-c, wave 40, lane qthe-smith). Registered floors: 8e8578e + situations/eq9_predictions.json. Census recompute sha asserted before first tick: ' + EXPECTED_TABLE_SHA,
  board: { W, H, SLOT, T: T_SWEEP, A_XY, B_XY, PA_SLOTS, PB_SLOTS,
    geometry_note: 'E-Q8 same-slot probe geometry scaled to the Repel mass: A and B keep the same slot 20 and row-major A-before-B live-read; each writer tuned by up to 4 pairwise non-adjacent Moore-8 ring Repels (registered independence cap 4 x 63 = 252); t=0 acc assertions LOUD per run' },
  sweep: { families: stable.length, arms: ['rat', 'near', 'far'], kernels: ['float:qthe.mjs', 'fixed:qthe_fixed.mjs'], d1: 'x2 fresh constructions per (family, arm, kernel)', sigma_door_checks: sigmaDoorChecked },
  tallies_observed: tallies,
  census_counts_for_this_set: censusStable,
  observed_mapped: observedMapped,
  e_events: { E1: eFlags.e1, E2: eFlags.e2, E3: eFlags.e3, E4: eFlags.e4, E5: eFlags.e5, E6: eFlags.e6, E7: eFlags.e7, E8: eFlags.e8, E9: eFlags.e9, E10: eFlags.e10 },
  e_misses: eMisses,
  d1_failures: d1Failures,
  unexplained_holes: holes,
  primaries,
};
writeFileSync(join(OUT, 'eq9_sweep_results.json'), JSON.stringify(results, null, 1));
console.log(`[e-q9] E1..E10: ${JSON.stringify(results.e_events)}`);
console.log(`[e-q9] wrote ${join(OUT, 'eq9_sweep_results.json')} + ${ROWS_PATH}`);
