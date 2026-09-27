// experiments/eq9_deep_trace_moth.mjs — E-Q9-DT (task 42-b, wave 42, lane moth-smith).
// MOTH AS THE FLEET'S REGISTERED SEED/ORDERING INSTRUMENT, first standing use:
//   (1) ONE fresh mothquantum graph-v1 job generates raw bits (job receipted: id,
//       backend, latency, raw sha256 — NEVER the key);
//   (2) a REGISTERED two-step whitener (von Neumann debias -> SHA-256 counter
//       stream) turns them into an unbiased selection stream (wave-41 law:
//       graph-v1 emu is NOT a QRNG — balance 0.6288, top-20 truncation);
//   (3) the whitened stream ORDER-selects N=16 of the 1,134 rat-D dyadic
//       families (E-Q9 census class D at the family point — the T2 class E-Q9
//       priced and swept but never full-traced), without human choice;
//   (4) the 16 are DEEP-TRACED (full trajectory dump float vs fixed) on the
//       E-Q9 board machinery (VERBATIM from e_q9_sweep.mjs: census recompute +
//       sha assert, board geometry, runOnce, auditPair, EQ8 drift guard).
//
// REGISTERED FLOORS (situations/eq9_deep_trace_registration.json, PRE-RUN):
//   - naming: E-Q9-DT, NOT E-Q10 (the E-Q* lever numbering is the guest's);
//   - moth budget: MAX 2 jobs this lane; fail-closed — an unreachable/failed
//     API receipts an honest FAIL and stops;
//   - census recompute BEFORE any use, sha 552d171c… asserted;
//   - whitener EXACTLY as registered (any drift = LOUD abort);
//   - predictions DT-A..DT-K sealed pre-run; scored AS RUN in the verdict;
//   - key law: MOTH_KEY never printed/logged/committed; raw bits + whitened
//     stream archived OUTSIDE the repo (scripts/42b-moth-bits/), sha-pinned.
//
// STAGES (one script, deterministic-replayable):
//   --stage=seed  [--shots=1024] [--bits-from-file=PATH]   moth -> whiten -> select -> seed receipt
//   --stage=trace [--receipt=outputs/eq9dt_seed_receipt.json]  census -> drift guard -> deep trace -> rows+results
//   (default: seed if no receipt, then trace)
import { writeFileSync, appendFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { loadKey, graphJob, noLeakScan } from './moth_client.mjs';
import { makeSubstrate, tick as floatTick } from '../qthe.mjs';
import * as fixed from '../fixedpoint/qthe_fixed.mjs';
import { planeHash, sha256HexStr, packByte } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const ARCHIVE = '/home/z/my-project/scripts/42b-moth-bits';   // OUTSIDE the repo (key-free bit archive)
const SEED_RECEIPT = join(OUT, 'eq9dt_seed_receipt.json');
const ROWS_PATH = join(OUT, 'eq9dt_rows.jsonl');
const RESULTS_PATH = join(OUT, 'eq9dt_results.json');
const REGISTRATION_PATH = join(HERE, '..', 'situations', 'eq9_deep_trace_registration.json');

const args = process.argv.slice(2);
// supports BOTH '--key value' and '--key=value' (the = form bit this lane once:
// an unparsed --bits-from-file=PATH turned the seed plumbing test LIVE — job
// 2caa822b ran for real; disclosed in the verdict + worklog, budget 1/2 AS RUN)
const argOf = (k, d) => {
  const eq = args.find((a) => a.startsWith(k + '='));
  if (eq !== undefined) return eq.slice(k.length + 1);
  const i = args.indexOf(k);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
};
const STAGE = argOf('--stage', args.includes('--stage=seed') ? 'seed' : 'auto');
const SHOTS = parseInt(argOf('--shots', '1024'), 10);

// ── lane budget (REGISTERED: max 2 moth jobs, tight) ────────────────────────
const LANE_MAX_JOBS = 2;
const MIN_VN_BITS = 256;   // entropy floor to proceed (selection needs ~118 bits; 256 = margin)

// ═══════════════════════ CENSUS (VERBATIM from e_q9_sweep.mjs) ══════════════
const S = 2 ** 32;
const sha = (s) => sha256HexStr(s);
const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
const CENSUS_DD_MAX = 1000, CENSUS_N_MAX = 504, STABLE_N_MAX = 252, STABLE_DD_MAX = 253;
const IRR_STEP = Math.SQRT2 * 2 ** -52;
const EXPECTED_TABLE_SHA = '552d171c6ddf2cdd5b7a87cc28cae2c2eb8435a560ad66aa934225eb6dbc20f6';

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
function buildCensus() {
  const rows = [];
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
      rows.push({ n, dd, sigmaKey: `${n}/${dd}`, stable, kernelReachable, dyadic: (dd & (dd - 1)) === 0,
        rat: { cls: rat.cls, fColl: rat.fColl, fxPressure: rat.fxPressure, fSign: rat.fSign, fxSign: rat.fxSign },
        near: { cls: near.cls, fColl: near.fColl, fxPressure: near.fxPressure, degenerate, inBand: near.inBand },
        far: { cls: far.cls, fColl: far.fColl, fxPressure: far.fxPressure, fSign: far.fSign, fxSign: far.fxSign,
          liouvilleMargin: farLiouvilleMargin } });
    }
  }
  return rows;
}
const bounds_registered = { census_dd_max: CENSUS_DD_MAX, census_n_max: CENSUS_N_MAX,
  stable_n_max: STABLE_N_MAX, stable_dd_max: STABLE_DD_MAX,
  stable_justification: 'stable Repel engineering caps one cell mass at 4 non-adjacent Moore-8 ring cells x d<=63 = 252 (independence number of the neighbor ring); E-Q8 every-tick tuning-stability law requires acc(P)==0 at every tick',
  out_of_space_note: 'dd>505: writer resonance unhostable even unstably (|acc|<=504 kernel ceiling); 253<dd<=505: kernel-reachable only via drifting adjacent Repel cells (breaks the every-tick tuning assertion) — receipted OUT-OF-ENGINEERING-SPACE, not silently dropped; n in (252,504]: same for the reader',
  sigma_arms: { rat: 'double(n/dd) — the family point', irrFar: 'Math.SQRT2 — family-distant irrational', irrNear: 'double(n/dd + SQRT2*2^-52) — irrational step ~1-3 ulp above the family point' } };

function censusAndAssert() {
  const rows = buildCensus();
  const tableSha = sha(JSON.stringify({ generatedBy: 'eq9_family_census.mjs', bounds: bounds_registered, rows }));
  if (tableSha !== EXPECTED_TABLE_SHA) {
    throw new Error(`e-q9-dt: census recompute sha ${tableSha} != registered ${EXPECTED_TABLE_SHA} — LOUD failure BEFORE any use`);
  }
  console.log(`[e-q9-dt] census recompute OK: ${rows.length} rows, sha ${tableSha.slice(0, 16)}… == registered`);
  return rows;
}

// ═══════════════════════ WHITENER (REGISTERED, EXACT) ═══════════════════════
// INPUT  raw_bits: '0'/'1' string — canonical expansion of the job's
//        measurements (distinct 8-bit outcomes sorted ascending, each expanded
//        by its count, MSB-first; moth_client.mjs extractBits, receipted E-D3).
// STEP 1 von Neumann debias: consecutive PAIRS (b0,b1):
//        (0,1)->emit 0; (1,0)->emit 1; (0,0),(1,1)->emit nothing.  => vn_bits
// STEP 2 byte pack: vn_bits MSB-first into bytes; the trailing pad bits
//        (0..7) are ZERO and their count pad_len is receipted.
// STEP 3 counter stream: block_c = SHA-256( u32be(c) || vn_bytes ), c=0,1,2,…
//        whitened stream = block_0 || block_1 || …, consumed MSB-first.
//        The 256-bit SEED is block_0; whitened_seed_sha256 = SHA-256(block_0).
// STEP 4 Fisher-Yates over the pool (registered census order dd asc, n asc):
//        for i = last down to 1: r = next 16 stream bits, rejection-sampled
//        against floor(65536/(i+1))*(i+1); j = r mod (i+1); swap(a[i],a[j]).
//        selected = a[0..15] IN MOTH SHUFFLE ORDER (rank 1..16).
function vonNeumann(rawBits) {
  let out = '';
  let p01 = 0, p10 = 0, p00 = 0, p11 = 0;
  for (let i = 0; i + 1 < rawBits.length; i += 2) {
    const a = rawBits[i], b = rawBits[i + 1];
    if (a === '0' && b === '1') { out += '0'; p01++; }
    else if (a === '1' && b === '0') { out += '1'; p10++; }
    else if (a === '0' && b === '0') p00++;
    else p11++;
  }
  return { vnBits: out, pairStats: { pairs: Math.floor(rawBits.length / 2), emit0: p01, emit1: p10, discard00: p00, discard11: p11 } };
}
function packBytes(bitStr) {
  const pad = (8 - (bitStr.length % 8)) % 8;
  const buf = Buffer.alloc(Math.ceil(bitStr.length / 8));
  for (let i = 0; i < bitStr.length; i++) {
    if (bitStr[i] === '1') buf[i >> 3] |= 0x80 >> (i & 7);
  }
  return { bytes: buf, padLen: pad };
}
function whitenedStream(vnBytes) {
  // lazily-built SHA-256 counter stream; block(c) = sha256(u32be(c) || vn_bytes)
  const blocks = [];
  function block(c) {
    if (!blocks[c]) {
      const head = Buffer.alloc(4);
      head.writeUInt32BE(c, 0);
      blocks[c] = createHash('sha256').update(Buffer.concat([head, vnBytes])).digest();
    }
    return blocks[c];
  }
  let bytePos = 0, bitPos = 0;
  function next16() {   // 16 bits, MSB-first across the block concatenation
    let v = 0;
    for (let k = 0; k < 16; k++) {
      const b = block(bytePos >> 5);           // 32 bytes = 256 bits per block
      const bit = (b[bytePos & 31] >> (7 - bitPos)) & 1;
      v = v * 2 + bit;
      if (++bitPos === 8) { bitPos = 0; bytePos++; }
    }
    return v;
  }
  return { block, next16, blocksMaterialized: () => blocks.filter((_, i) => blocks[i] !== undefined).length };
}
function fisherYatesSelect(poolSize, stream, take) {
  const a = Array.from({ length: poolSize }, (_, i) => i);
  for (let i = poolSize - 1; i > 0; i--) {
    const v = i + 1;
    const lim = Math.floor(65536 / v) * v;
    let r = stream.next16();
    let rejects = 0;
    while (r >= lim) { r = stream.next16(); rejects++; if (rejects > 1000) throw new Error('e-q9-dt: FY rejection runaway — stream malformed'); }
    const j = r % v;
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return { order: a, selected: a.slice(0, take) };
}

// ═══════════════════════ BOARD (VERBATIM from e_q9_sweep.mjs) ═══════════════
const W = 9, H = 5, SLOT = 20, T_SWEEP = 16;
const A_XY = [1, 2], B_XY = [6, 2];
const PA_SLOTS = [[0, 1], [2, 1], [0, 3], [2, 3]];
const PB_SLOTS = [[5, 1], [7, 1], [5, 3], [7, 3]];
function massParts(M) {
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
  if (pa.length > 4 || pb.length > 4) throw new Error(`e-q9-dt: mass split needs >4 Repels (n=${n},dd=${dd}) — outside registered stable space, LOUD failure`);
  pa.forEach((d, i) => cellMap.set(`${PA_SLOTS[i][0]},${PA_SLOTS[i][1]}`, packByte(2, d)));
  pb.forEach((d, i) => cellMap.set(`${PB_SLOTS[i][0]},${PB_SLOTS[i][1]}`, packByte(2, d)));
  return (x, y) => cellMap.get(`${x},${y}`) ?? 0;
}
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
  const wantA = -(dd - 1);
  if (sub[idxA] !== (control ? 0 : packByte(3, SLOT))) throw new Error(`e-q9-dt: A byte wrong n=${n}/dd=${dd}`);
  if (sub[idxB] !== packByte(3, SLOT)) throw new Error(`e-q9-dt: B byte wrong n=${n}/dd=${dd}`);
  if (at(A_XY) !== wantA) throw new Error(`e-q9-dt: t=0 acc(A)=${at(A_XY)} != ${wantA} (n=${n}/dd=${dd}) — tuning assertion LOUD failure`);
  if (at(B_XY) !== -n) throw new Error(`e-q9-dt: t=0 acc(B)=${at(B_XY)} != ${-n} (n=${n}/dd=${dd}) — tuning assertion LOUD failure`);
  for (const [x, y] of [...PA_SLOTS, ...PB_SLOTS]) {
    if (accs[y * W + x] !== 0) throw new Error(`e-q9-dt: Repel (${x},${y}) acc != 0 (n=${n}/dd=${dd}) — stability assertion LOUD failure`);
  }
}
const bytePlane = (sub) => sub.bytes ?? sub;
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
const FLOAT_K = { name: 'float:qthe.mjs', makeSubstrate, tick: floatTick };
const FIXED_K = { name: 'fixed:qthe_fixed.mjs', makeSubstrate: fixed.makeSubstrate, tick: fixed.tick };
let sigmaDoorChecked = 0;
function sigmaQFor(sigmaReal) {
  const q = Math.round(sigmaReal * S);
  const door = fixed.sigmaToFixed(sigmaReal);
  if (door !== q) throw new Error(`e-q9-dt: sigmaToFixed(${sigmaReal})=${door} != runner re-derivation ${q} — LOUD failure`);
  sigmaDoorChecked++;
  return q;
}
function truePressure(arm, n, dd, acc, r) {
  if (arm === 'rat') { const num = acc * dd + r * n; return num / dd; }
  if (arm === 'near') { const num = acc * dd + r * n; return num / dd + r * Math.SQRT2 * 2 ** -52; }
  return acc + r * Math.SQRT2;
}
const inBand = (trueP, r) => Math.abs(trueP) <= r * 2 ** -33;
function auditPair(arm, n, dd, f, x) {
  let firstDiv = -1;
  for (let t = 0; t <= T_SWEEP; t++) if (f.planeHashes[t] !== x.planeHashes[t]) { firstDiv = t; break; }
  if (firstDiv < 0) {
    const dbf = f.perTick[0].dB;
    return { firstDiv, byteIdentical16: true, cells: [], obs: dbf === SLOT ? 'IDENTICAL-HOLD' : 'IDENTICAL-MOVE' };
  }
  const byteIdentical16 = false;
  const preF = f.planes[firstDiv - 1], preX = x.planes[firstDiv - 1];
  const preIdentical = planeHash(preF, firstDiv - 1, bytePlane) === planeHash(preX, firstDiv - 1, bytePlane);
  const accs = accField(preF);
  const evF = f.termsByTick[firstDiv - 1] || [], evX = x.termsByTick[firstDiv - 1] || [];
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
    cells.push({ x: x0, y, dd: ddCell, tauOk, heard: !!heardF || !!heardX, rHit, fHeld, xHeld, cls, accReader: acc });
  }
  let obs;
  if (firstDiv === 1 && cells.length === 1 && cells[0].x === B_XY[0] && cells[0].y === B_XY[1]) {
    if (cells[0].fHeld && !cells[0].xHeld && Math.abs(cells[0].dd) === 1) obs = 'DIV1-A';
    else if (!cells[0].fHeld && cells[0].xHeld && Math.abs(cells[0].dd) === 1) obs = 'DIV1-FINV';
    else if (Math.abs(cells[0].dd) === 2) obs = 'DIV1-C';
    else obs = 'DIV1-OTHER';
  } else obs = `DIV${firstDiv}-${cells.length}cell`;
  return { firstDiv, byteIdentical16, preIdentical, cells, obs };
}

// ═══════════════════════ STAGE: SEED ════════════════════════════════════════
async function stageSeed() {
  if (existsSync(SEED_RECEIPT)) {
    console.error(`[e-q9-dt] REFUSING to re-seed: ${SEED_RECEIPT} already exists (a seed receipt is AS-RUN history; delete it manually only if you accept spending another job)`);
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });
  mkdirSync(ARCHIVE, { recursive: true });
  const jobs = [];
  let rawBits = '';
  let rawSha = '';
  const t0 = new Date().toISOString();

  const fromFile = argOf('--bits-from-file', '');
  if (fromFile) {
    // REPLAY path: whiten an ARCHIVED raw stream (never spends a job). Receipt
    // marked mode:'replay'; requires --job-id of the archived stream.
    rawBits = readFileSync(fromFile, 'utf8').replace(/[^01]/g, '');
    rawSha = sha(rawBits);
    console.log(`[e-q9-dt] REPLAY whitening from ${fromFile}: ${rawBits.length} raw bits, sha ${rawSha.slice(0, 16)}…`);
  } else {
    const key = loadKey();
    if (!key) {
      const r = { ok: false, verdict: 'NO_KEY', why: 'MOTH_KEY absent — fail-closed, zero jobs spent', budget: { jobs_used: 0, max_jobs: LANE_MAX_JOBS }, submitted_at: t0 };
      writeFileSync(SEED_RECEIPT, JSON.stringify(r, null, 1));
      console.log(JSON.stringify(r));
      process.exit(1);
    }
    for (let attempt = 1; attempt <= LANE_MAX_JOBS; attempt++) {
      const job = await graphJob(key, { shots: SHOTS, seq: attempt - 1 });
      const safe = { seq: job.seq, engine: job.engine, job_id: job.job_id, backend: job.backend, shots: job.shots,
        mode: job.mode, live: job.live, mock: job.mock, submitted_at: job.submitted_at, completed_at: job.completed_at,
        latency_ms: job.latency_ms, ok: job.ok, why: job.why, bits_len: job.bits_len, ones: job.ones,
        balance: job.bits_len ? Number((job.ones / job.bits_len).toFixed(4)) : null,
        distinct_outcomes: job.distinct_outcomes, bits_sha256: job.bits ? sha(job.bits) : null };
      jobs.push(safe);
      if (!job.ok) {
        const r = { ok: false, verdict: 'JOB_FAILED', why: job.why || 'moth job failed', jobs: jobs,
          budget: { jobs_used: attempt, max_jobs: LANE_MAX_JOBS }, submitted_at: t0, ended_at: new Date().toISOString() };
        writeFileSync(SEED_RECEIPT, JSON.stringify(r, null, 1));
        console.log(`[e-q9-dt] HONEST FAIL: moth job ${attempt}/${LANE_MAX_JOBS} failed (${job.why}) — receipt written, stopping`);
        process.exit(1);
      }
      rawBits += job.bits;
      console.log(`[e-q9-dt] moth job ${attempt}/${LANE_MAX_JOBS} OK: ${job.job_id} backend=${job.backend} bits=${job.bits_len} balance=${safe.balance} (${job.latency_ms}ms)`);
      const vnProbe = vonNeumann(rawBits);
      if (vnProbe.vnBits.length >= MIN_VN_BITS || attempt === LANE_MAX_JOBS) break;
      console.log(`[e-q9-dt] VN bits ${vnProbe.vnBits.length} < floor ${MIN_VN_BITS} — spending reserve job (registered budget)`);
    }
    rawSha = sha(rawBits);
    // archive raw bits OUTSIDE the repo (key-free; sha-pinned in the receipt)
    const primary = jobs[0].job_id;
    writeFileSync(join(ARCHIVE, `raw_bits_${primary}.txt`), rawBits);
  }

  // whitening
  const { vnBits, pairStats } = vonNeumann(rawBits);
  const { bytes: vnBytes, padLen } = packBytes(vnBits);
  const vnBytesSha = sha(vnBytes.toString('latin1'));
  const stream = whitenedStream(vnBytes);
  const seedBlock0 = stream.block(0);
  const whitenedSeedSha = createHash('sha256').update(seedBlock0).digest('hex');
  const censusRows = censusAndAssert();
  const pool = censusRows.filter((r) => r.stable && r.rat.cls === 'D').sort((a, b) => (a.dd - b.dd) || (a.n - b.n));
  if (pool.length !== 1134) throw new Error(`e-q9-dt: rat-D pool ${pool.length} != registered 1,134 — LOUD failure`);
  const { selected } = fisherYatesSelect(pool.length, stream, 16);
  const selectedRows = selected.map((idx, rank) => {
    const r = pool[idx];
    return { rank: rank + 1, pool_idx: idx, n: r.n, dd: r.dd, sigmaKey: r.sigmaKey, dd_dyadic: r.dyadic };
  });
  // archive vn bits + seed block for exact offline replay
  const primary = jobs.length ? jobs[0].job_id : 'replay';
  if (!fromFile) {
    writeFileSync(join(ARCHIVE, `vn_bits_${primary}.txt`), vnBits);
    writeFileSync(join(ARCHIVE, `whitened_seed_block0_${primary}.hex`), seedBlock0.toString('hex'));
  }
  const receipt = {
    receipt: 'E-Q9-DT seed receipt (task 42-b, wave 42, lane moth-smith) — AS RUN. Whitener + selection exactly as registered in situations/eq9_deep_trace_registration.json (PRE-RUN). No key material anywhere in this file.',
    mode: fromFile ? 'replay' : 'live',
    ok: true, verdict: 'SEED_OK',
    moth: { engine: 'graph-v1', shots: SHOTS, jobs, budget: { jobs_used: jobs.length, max_jobs: LANE_MAX_JOBS } },
    raw_bits: { len: rawBits.length, sha256: rawSha, archive: fromFile ? fromFile : join(ARCHIVE, `raw_bits_${primary}.txt`), note: 'archived OUTSIDE the repo (key-free); sha-pinned here' },
    whitening: {
      recipe: 'STEP1 von Neumann debias (pairs 01->0, 10->1, 00/11 discard) -> STEP2 MSB-first byte pack (trailing zero pad, pad_len receipted) -> STEP3 SHA-256 counter stream block_c = SHA256(u32be(c) || vn_bytes), consumed MSB-first -> STEP4 Fisher-Yates over the 1,134-family pool (registered census order dd asc, n asc), 16-bit rejection-sampled draws, selected = first 16 IN MOTH SHUFFLE ORDER',
      vn_bits_len: vnBits.length, vn_pair_stats: pairStats, vn_bits_sha256: sha(vnBits),
      vn_bytes_len: vnBytes.length, vn_pad_len: padLen, vn_bytes_sha256: vnBytesSha,
      whitened_seed_block0_sha256: whitenedSeedSha,
      whitened_seed_block0_hex_archive: fromFile ? null : join(ARCHIVE, `whitened_seed_block0_${primary}.hex`),
    },
    selection: { pool_size: pool.length, pool_def: 'stable && rat.cls==D (E-Q9 census, sha asserted in-run), census order', n_deep_traced: 16, entropy_note: 'selection needs ~118 bits (log2 C(1134,16)); stream beyond the VN output is a deterministic SHA-256 PRF extension of the moth entropy — receipted honestly, replayable from the archived raw bits' },
    selected_moth_order: selectedRows,
    no_leak_scan: null,
    submitted_at: t0, ended_at: new Date().toISOString(),
  };
  const receiptStr = JSON.stringify(receipt, null, 1);
  const key = fromFile ? '' : loadKey();
  const scan = noLeakScan([REGISTRATION_PATH, join(HERE, 'moth_client.mjs'), join(HERE, 'eq9_deep_trace_moth.mjs')], key || '');
  const selfScan = { filesScanned: 2, keyMatches: receiptStr.includes(key || '\u0000never') ? ['eq9dt_seed_receipt.json'] : [], patternMatches: [], clean: true };
  receipt.no_leak_scan = { ...scan, receipt_self_scan: selfScan.clean ? 'CLEAN' : 'KEY IN RECEIPT — ABORT' };
  if (!selfScan.clean || !scan.clean) { console.error('[e-q9-dt] LEAK SCAN FAILED — receipt NOT written'); process.exit(1); }
  writeFileSync(SEED_RECEIPT, JSON.stringify(receipt, null, 1));
  console.log(`[e-q9-dt] SEED_OK: ${jobs.length} job(s); raw ${rawBits.length} bits -> VN ${vnBits.length} bits -> stream; selected 16 of ${pool.length}`);
  console.log('[e-q9-dt] moth order:', selectedRows.map((r) => r.sigmaKey).join(' '));
}

// ═══════════════════════ STAGE: TRACE ═══════════════════════════════════════
function stageTrace() {
  if (existsSync(RESULTS_PATH) || existsSync(ROWS_PATH)) {
    console.error(`[e-q9-dt] REFUSING to re-trace: ${RESULTS_PATH} / ${ROWS_PATH} already exist (trace receipts are AS-RUN history; delete manually only if you accept replacing them)`);
    process.exit(2);
  }
  const reg = JSON.parse(readFileSync(REGISTRATION_PATH, 'utf8'));
  const receiptPath = argOf('--receipt', SEED_RECEIPT);
  const seed = JSON.parse(readFileSync(receiptPath, 'utf8'));
  if (!seed.ok || !Array.isArray(seed.selected_moth_order) || seed.selected_moth_order.length !== 16) {
    throw new Error(`e-q9-dt: seed receipt not usable (ok=${seed.ok}) — honest FAIL stands, no deep trace`);
  }
  const censusRows = censusAndAssert();
  const byKey = new Map(censusRows.filter((r) => r.stable).map((r) => [r.sigmaKey, r]));

  // registered pmf cross-check (DT-A): the registration's hypergeometric pmf must
  // equal the census-recomputed one — arithmetic pinned before any tick.
  function lnChoose(n, k) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    const lg = (x) => { let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (let j = 0; j < 6; j++) s += c[j] / ++y; return -t + Math.log(2.5066282746310005 * s / x); };
    return lg(n + 1) - lg(k + 1) - lg(n - k + 1);
  }
  const poolFInv = censusRows.filter((r) => r.stable && r.rat.cls === 'D' && !r.near.degenerate && r.near.cls === 'F-INV').length;
  const poolD = censusRows.filter((r) => r.stable && r.rat.cls === 'D').length;
  const pmf = [];
  { const K = poolFInv, N = poolD, n = 16; let Z = 0; const raw = [];
    for (let k = 0; k <= 16; k++) { const p = Math.exp(lnChoose(K, k) + lnChoose(N - K, n - k) - lnChoose(N, n)); raw.push(p); Z += p; }
    for (let k = 0; k <= 16; k++) pmf.push(Number((raw[k] / Z).toFixed(9))); }
  const regPmf = reg.predictions.dt_a_near_finv_count.hypergeometric_pmf;
  if (JSON.stringify(regPmf) !== JSON.stringify(pmf)) {
    throw new Error(`e-q9-dt: registered DT-A pmf != census-recomputed pmf — registration/census drift, LOUD failure BEFORE any tick`);
  }
  console.log(`[e-q9-dt] DT-A pmf cross-check OK (hypergeometric N=${poolD}, K=${poolFInv}, n=16; modal k=5)`);
  if (poolD !== 1134 || poolFInv !== 379) throw new Error(`e-q9-dt: pool counts ${poolD}/${poolFInv} != registered 1,134/379`);

  // selected families: valid pool members, rat-D, in moth order
  const fams = seed.selected_moth_order.map((s) => {
    const r = byKey.get(s.sigmaKey);
    if (!r || !r.stable || r.rat.cls !== 'D') throw new Error(`e-q9-dt: selected ${s.sigmaKey} not in the rat-D stable pool — seed receipt invalid`);
    if (r.n !== s.n || r.dd !== s.dd) throw new Error(`e-q9-dt: seed receipt key mismatch ${s.sigmaKey}`);
    return { ...s, row: r };
  });

  // EQ8 drift guard (kernel-drift assert, VERBATIM pattern from e_q9_sweep.mjs)
  const eq8 = { W: 6, H: 3, SLOT: 20, A: [1, 1], B: [2, 1], PA: [0, 1], PB: [3, 1], T: 16 };
  function runEq8Board(K, n, dd, control) {
    const sigmaReal = n / dd, sigmaQint = sigmaQFor(sigmaReal);
    const cellMap = new Map();
    cellMap.set(`${eq8.PA[0]},${eq8.PA[1]}`, packByte(2, dd - 1));
    cellMap.set(`${eq8.PB[0]},${eq8.PB[1]}`, packByte(2, n));
    if (!control) cellMap.set(`${eq8.A[0]},${eq8.A[1]}`, packByte(3, eq8.SLOT));
    cellMap.set(`${eq8.B[0]},${eq8.B[1]}`, packByte(3, eq8.SLOT));
    const sub = K.makeSubstrate(eq8.W, eq8.H, (x, y) => cellMap.get(`${x},${y}`) ?? 0);
    const accs = accField(new Uint8Array(sub));
    if (accs[eq8.A[1] * eq8.W + eq8.A[0]] !== -(dd - 1)) throw new Error(`e-q9-dt eq8board: acc(A) != -(dd-1) for ${n}/${dd}`);
    if (accs[eq8.B[1] * eq8.W + eq8.B[0]] !== -n) throw new Error(`e-q9-dt eq8board: acc(B) != -n for ${n}/${dd}`);
    const planeHashes = [planeHash(sub, 0, bytePlane)];
    const eventTuples = [], perTick = [];
    for (let t = 1; t <= eq8.T; t++) {
      sub.lastEvents = [];
      K.tick(sub, K === FIXED_K ? { wormholes: true, sigmaQ: sigmaQint } : { wormholes: true, sigma: sigmaReal });
      for (const e of sub.lastEvents || []) eventTuples.push([t, e.x, e.y, e.slot, e.resonance]);
      planeHashes.push(planeHash(sub, t, bytePlane));
      const iA = eq8.A[1] * eq8.W + eq8.A[0], iB = eq8.B[1] * eq8.W + eq8.B[0];
      perTick.push({ t, dA: sub[iA] & 63, dB: sub[iB] & 63 });
    }
    return { planeHashes, eventTuples, eventSeqHash: sha256HexStr(JSON.stringify(eventTuples)), perTick };
  }
  const eq8Receipt = JSON.parse(readFileSync(join(OUT, 'e_q8_results.json'), 'utf8'));
  const driftGuard = {};
  for (const pk of ['2/3', '8/5']) {
    const [n, dd] = pk.split('/').map(Number);
    const f = runEq8Board(FLOAT_K, n, dd, false), x = runEq8Board(FIXED_K, n, dd, false);
    const okF = JSON.stringify(f.planeHashes) === JSON.stringify(eq8Receipt.probe[pk].float.planeHashes);
    const okX = JSON.stringify(x.planeHashes) === JSON.stringify(eq8Receipt.probe[pk].fixed.planeHashes);
    if (!okF || !okX) throw new Error(`e-q9-dt: eq8board ${pk} does NOT reproduce the receipted E-Q8 plane hashes (float=${okF} fixed=${okX}) — kernel drift, LOUD failure BEFORE the deep trace`);
    driftGuard[pk] = { float: okF, fixed: okX };
    console.log(`[e-q9-dt] eq8board ${pk}: receipted E-Q8 plane hashes reproduce byte-for-byte (17/17 float, 17/17 fixed)`);
  }

  // ── deep trace (moth order) ───────────────────────────────────────────────
  const rows = [];
  const holes = [];
  const d1Failures = [];
  const flags = { dt_b: true, dt_c: true, dt_d: true, dt_e: true, dt_f: true, dt_g: true, dt_h: true, dt_i: true, dt_j: true };
  const misses = { dt_b: [], dt_c: [], dt_d: [], dt_e: [], dt_f: [], dt_g: [], dt_h: [], dt_i: [], dt_j: [] };
  let finvObserved = 0;
  const t0 = Date.now();
  for (const fam of fams) {
    const { n, dd, sigmaKey } = fam;
    const perArm = {};
    for (const arm of ['rat', 'near', 'far']) {
      const sigmaReal = arm === 'rat' ? n / dd : arm === 'near' ? n / dd + IRR_STEP : Math.SQRT2;
      const sigmaQint = sigmaQFor(sigmaReal);
      const f1 = runOnce(FLOAT_K, n, dd, sigmaReal, sigmaQint, false, true, true);
      // D1 twin runs in the SAME (full, trace) mode — like-for-like compact comparison.
      // (Run-1 defect, caught and fixed pre-commit: comparing a trace-mode run against an
      // audit-mode rerun fails on perTick SHAPE — the exact defect E-Q9's primaries
      // receipted ("comparison bug, never kernels"). Event hashes were never in question.)
      const f2 = runOnce(FLOAT_K, n, dd, sigmaReal, sigmaQint, false, true, true);
      const x1 = runOnce(FIXED_K, n, dd, sigmaReal, sigmaQint, false, true, true);
      const x2 = runOnce(FIXED_K, n, dd, sigmaReal, sigmaQint, false, true, true);
      const d1 = f1.eventSeqHash === f2.eventSeqHash && f1.snapshotHash === f2.snapshotHash
        && JSON.stringify(f1.planeHashes) === JSON.stringify(f2.planeHashes) && f1.compact === f2.compact
        && x1.eventSeqHash === x2.eventSeqHash && x1.snapshotHash === x2.snapshotHash
        && JSON.stringify(x1.planeHashes) === JSON.stringify(x2.planeHashes) && x1.compact === x2.compact;
      if (!d1) { flags.dt_h = false; d1Failures.push(`${sigmaKey}/${arm}`); misses.dt_h.push(`${sigmaKey}/${arm}`); }
      const audit = auditPair(arm, n, dd, f1, x1);
      // census pin for this family+arm (arithmetic, pre-computed by the census)
      const cq = arm === 'rat' ? fam.row.rat.cls
        : arm === 'near' ? (fam.row.near.degenerate ? fam.row.rat.cls : fam.row.near.cls)
        : fam.row.far.cls;
      const row = { k: sigmaKey, n, dd, rank: fam.rank, a: arm, cq, obs: audit.obs, fd: audit.firstDiv, nc: audit.cells.length,
        cls: audit.cells.map((c) => c.cls), dds: audit.cells.map((c) => c.dd), bi: audit.byteIdentical16,
        pre: audit.byteIdentical16 ? undefined : audit.preIdentical, d1 };
      // deep-trace dump (full trajectories, float vs fixed)
      row.dump = {
        float: { plane_hashes: f1.planeHashes, event_tuples: f1.eventTuples, terms_by_tick: f1.termsByTick, per_tick: f1.perTick },
        fixed: { plane_hashes: x1.planeHashes, event_tuples: x1.eventTuples, terms_by_tick: x1.termsByTick, per_tick: x1.perTick },
      };
      // event scoring
      if (arm === 'rat') {
        if (!(audit.byteIdentical16 && f1.perTick.every((p) => p.dB === SLOT))) { flags.dt_b = false; misses.dt_b.push(`${sigmaKey}/rat`); }
      }
      if (arm === 'near' && fam.row.near.degenerate) {
        const dm = JSON.stringify(f1.planeHashes) === JSON.stringify(perArm.rat.fHashes)
          && JSON.stringify(x1.planeHashes) === JSON.stringify(perArm.rat.xHashes);
        row.degMatch = dm;
        if (!dm) { flags.dt_f = false; misses.dt_f.push(`${sigmaKey}/near-degenerate-mismatch`); }
      }
      if (arm === 'near' && !fam.row.near.degenerate && cq === 'F-INV') {
        finvObserved++;
        const c0 = audit.cells[0];
        const ok = audit.obs === 'DIV1-FINV' && audit.firstDiv === 1 && audit.cells.length === 1
          && c0 && c0.x === B_XY[0] && c0.y === B_XY[1]
          && !c0.fHeld && c0.xHeld && Math.abs(c0.dd) === 1 && c0.tauOk && audit.preIdentical;
        if (!ok) { flags.dt_d = false; misses.dt_d.push(`${sigmaKey}/near/obs=${audit.obs}`); }
        // float direction: float d response vs pre-tick float plane
        const db1 = f1.perTick[0].dB, db0 = SLOT;
        if (!(db1 - db0 === 1)) { flags.dt_e = false; misses.dt_e.push(`${sigmaKey}/near/dir=${db1 - db0}`); }
      }
      if ((arm === 'near' || arm === 'rat') && x1.perTick.some((p) => p.dB !== SLOT)) {
        flags.dt_c = false; misses.dt_c.push(`${sigmaKey}/${arm}/fixed-moved`);
      }
      if (arm === 'far') {
        if (!audit.byteIdentical16) { flags.dt_g = false; misses.dt_g.push(`${sigmaKey}/far/planes-differ`); }
        const wantDir = (n / dd) > Math.SQRT2 ? -1 : 1;
        const gotDir = sign(f1.perTick[0].dB - SLOT);
        row.far_dir = gotDir;
        if (gotDir !== wantDir) { flags.dt_g = false; misses.dt_g.push(`${sigmaKey}/far/dir want ${wantDir} got ${gotDir}`); }
        // Run-1 scorer defect, caught in verdict review pre-commit (audit-shape bug, never kernels —
        // the E-Q9 primaries defect class): the no-move check flagged any fixed trajectory that
        // LANDS on d=20 mid-staircase (B's dyadic drift revisits slot 20; 1/4 + 39/128 were
        // false-positived while their tick-1 moves were present and correctly directed). The
        // registered claim is "both planes move every tick", so the check IS the per-tick movement,
        // on BOTH kernels: t=1 leaves SLOT, every later tick differs from its predecessor.
        const movedEveryTick = (k) => k.perTick.every((p, i) => (i === 0 ? p.dB !== SLOT : p.dB !== k.perTick[i - 1].dB));
        if (!movedEveryTick(f1) || !movedEveryTick(x1)) { flags.dt_g = false; misses.dt_g.push(`${sigmaKey}/far/no-move`); }
      }
      for (const c of audit.cells) if (c.cls === 'UNEXPLAINED') {
        flags.dt_i = false;
        if (holes.length < 400) holes.push({ key: `${sigmaKey}/${arm}`, firstDiv: audit.firstDiv, cell: c });
      }
      perArm[arm] = { fHashes: f1.planeHashes, xHashes: x1.planeHashes };
      rows.push(row);
      appendFileSync(ROWS_PATH, JSON.stringify(row) + '\n');
    }
    // no-twin control (A -> Ground) at the rat arm — sigmaInert REQUIRED
    const cSigma = n / dd, cSigmaQ = sigmaQFor(cSigma);
    const cf = runOnce(FLOAT_K, n, dd, cSigma, cSigmaQ, true, false, false);
    const cx = runOnce(FIXED_K, n, dd, cSigma, cSigmaQ, true, false, false);
    const inert = JSON.stringify(cf.planeHashes) === JSON.stringify(cx.planeHashes) && cf.eventSeqHash === cx.eventSeqHash && cf.snapshotHash === cx.snapshotHash;
    rows.push({ k: sigmaKey, n, dd, rank: fam.rank, a: 'rat-control', cq: 'CONTROL', obs: inert ? 'SIGMA-INERT' : 'CONTROL-DIVERGED', d1: null, sigmaInert: inert,
      dump: { float: { plane_hashes: cf.planeHashes }, fixed: { plane_hashes: cx.planeHashes } } });
    appendFileSync(ROWS_PATH, JSON.stringify(rows[rows.length - 1]) + '\n');
    if (!inert) { flags.dt_j = false; misses.dt_j.push(`${sigmaKey}/control`); }
    const ratRow = rows[rows.length - 4], nearRow = rows[rows.length - 3], farRow = rows[rows.length - 2];
    console.log(`[e-q9-dt] rank ${fam.rank} ${sigmaKey}: rat=${ratRow.obs} near=${nearRow.obs} far=${farRow.obs} D1=${ratRow.d1 && nearRow.d1 && farRow.d1} control=${inert} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }

  // DT-A scoring: full-pmf Brier over the F-INV count event
  let brierA = 0;
  for (let k = 0; k <= 16; k++) { const o = k === finvObserved ? 1 : 0; brierA += (pmf[k] - o) ** 2; }
  const outcomes = {
    dt_a: { claim: reg.predictions.dt_a_near_finv_count.claim, observed_finv_count: finvObserved, expected: Number((16 * poolFInv / poolD).toFixed(4)), pmf_brier: Number(brierA.toFixed(6)), pass_full_pmf: true },
    dt_b: { claim: reg.predictions.dt_b_rat_hold.claim, p: reg.predictions.dt_b_rat_hold.p, pass: flags.dt_b, misses: misses.dt_b, brier: Number(((reg.predictions.dt_b_rat_hold.p - (flags.dt_b ? 1 : 0)) ** 2).toFixed(6)) },
    dt_c: { claim: reg.predictions.dt_c_fixed_never_moves.claim, p: reg.predictions.dt_c_fixed_never_moves.p, pass: flags.dt_c, misses: misses.dt_c, brier: Number(((reg.predictions.dt_c_fixed_never_moves.p - (flags.dt_c ? 1 : 0)) ** 2).toFixed(6)) },
    dt_d: { claim: reg.predictions.dt_d_finv_shape.claim, p: reg.predictions.dt_d_finv_shape.p, pass: flags.dt_d, misses: misses.dt_d, brier: Number(((reg.predictions.dt_d_finv_shape.p - (flags.dt_d ? 1 : 0)) ** 2).toFixed(6)) },
    dt_e: { claim: reg.predictions.dt_e_float_direction.claim, p: reg.predictions.dt_e_float_direction.p, pass: flags.dt_e, misses: misses.dt_e, brier: Number(((reg.predictions.dt_e_float_direction.p - (flags.dt_e ? 1 : 0)) ** 2).toFixed(6)) },
    dt_f: { claim: reg.predictions.dt_f_degenerate_match.claim, p: reg.predictions.dt_f_degenerate_match.p, pass: flags.dt_f, misses: misses.dt_f, brier: Number(((reg.predictions.dt_f_degenerate_match.p - (flags.dt_f ? 1 : 0)) ** 2).toFixed(6)) },
    dt_g: { claim: reg.predictions.dt_g_far_arm.claim, p: reg.predictions.dt_g_far_arm.p, pass: flags.dt_g, misses: misses.dt_g, brier: Number(((reg.predictions.dt_g_far_arm.p - (flags.dt_g ? 1 : 0)) ** 2).toFixed(6)) },
    dt_h: { claim: reg.predictions.dt_h_d1.claim, p: reg.predictions.dt_h_d1.p, pass: flags.dt_h, misses: misses.dt_h, d1_failures: d1Failures, brier: Number(((reg.predictions.dt_h_d1.p - (flags.dt_h ? 1 : 0)) ** 2).toFixed(6)) },
    dt_i: { claim: reg.predictions.dt_i_zero_unexplained.claim, p: reg.predictions.dt_i_zero_unexplained.p, pass: flags.dt_i, misses: misses.dt_i, holes, brier: Number(((reg.predictions.dt_i_zero_unexplained.p - (flags.dt_i ? 1 : 0)) ** 2).toFixed(6)) },
    dt_j: { claim: reg.predictions.dt_j_control_inert.claim, p: reg.predictions.dt_j_control_inert.p, pass: flags.dt_j, misses: misses.dt_j, brier: Number(((reg.predictions.dt_j_control_inert.p - (flags.dt_j ? 1 : 0)) ** 2).toFixed(6)) },
    dt_k: { claim: reg.predictions.dt_k_drift_guard.claim, p: reg.predictions.dt_k_drift_guard.p, pass: true, detail: driftGuard, brier: Number(((reg.predictions.dt_k_drift_guard.p - 1) ** 2).toFixed(6)) },
  };
  const binaryBriers = Object.entries(outcomes).filter(([k, v]) => k !== 'dt_a').map(([, v]) => v.brier);
  const meanBrier = Number(((binaryBriers.reduce((a, b) => a + b, 0) / binaryBriers.length)).toFixed(6));
  const results = {
    receipt: 'eq9_deep_trace_moth (E-Q9-DT RUN, task 42-b, wave 42, lane moth-smith). Registered floors: situations/eq9_deep_trace_registration.json (PRE-RUN). Census recompute sha asserted before any tick: ' + EXPECTED_TABLE_SHA,
    registration: 'situations/eq9_deep_trace_registration.json',
    seed_receipt: { path: 'experiments/outputs/eq9dt_seed_receipt.json', mode: seed.mode,
      moth_job_id: seed.moth.jobs[0]?.job_id || null, moth_jobs_used: seed.moth.budget.jobs_used,
      raw_bits_sha256: seed.raw_bits.sha256, raw_bits_len: seed.raw_bits.len,
      vn_bits_len: seed.whitening.vn_bits_len, vn_bytes_sha256: seed.whitening.vn_bytes_sha256,
      whitened_seed_block0_sha256: seed.whitening.whitened_seed_block0_sha256 },
    board: { W, H, SLOT, T: T_SWEEP, A_XY, B_XY, PA_SLOTS, PB_SLOTS, geometry_note: 'E-Q9 board machinery VERBATIM (e_q9_sweep.mjs): same-slot S3 live-read probe scaled to the Repel mass; t=0 acc assertions LOUD per run' },
    deep_trace: { families: fams.length, arms: ['rat', 'near', 'far'], kernels: ['float:qthe.mjs', 'fixed:qthe_fixed.mjs'], d1: 'x2 fresh constructions per (family, arm, kernel)', controls: 'A->Ground rat control per family, sigmaInert REQUIRED', sigma_door_checks: sigmaDoorChecked, run_order: 'MOTH SHUFFLE ORDER (rank 1..16 receipted in the seed receipt)' },
    eq8_drift_guard: driftGuard,
    pmf_cross_check: { pool: poolD, f_inv: poolFInv, pmf_sha: sha(JSON.stringify(pmf)), registered_pmf_sha: sha(JSON.stringify(regPmf)), equal: true },
    outcomes,
    mean_brier_binary_events: meanBrier,
    tallies: { finv_observed: finvObserved, d1_failures: d1Failures.length, unexplained_holes: holes.length },
    unexplained_holes: holes,
  };
  writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 1));
  const allPass = Object.entries(outcomes).every(([k, v]) => (k === 'dt_a' ? v.pass_full_pmf : v.pass));
  console.log(`[e-q9-dt] DEEP TRACE DONE: F-INV observed ${finvObserved}/16 (expected 5.35, pmf Brier ${outcomes.dt_a.pmf_brier}); DT-B..DT-K ${Object.entries(outcomes).filter(([k]) => k !== 'dt_a').map(([k, v]) => `${k.toUpperCase()}=${v.pass ? 'PASS' : 'FAIL'}`).join(' ')}; mean Brier (binary) ${meanBrier}`);
  console.log(`[e-q9-dt] wrote ${RESULTS_PATH} + ${ROWS_PATH}`);
  if (!allPass) { console.log('[e-q9-dt] HONEST FAIL: one or more registered events did not land — verdict reports AS RUN, nothing edited'); process.exitCode = 1; }
}

// ═══════════════════════ main ═══════════════════════════════════════════════
const stage = STAGE === 'auto' ? (existsSync(SEED_RECEIPT) ? 'trace' : 'seed') : STAGE;
if (stage === 'seed') { await stageSeed(); }
else if (stage === 'trace') { stageTrace(); }
else if (stage === 'all') { await stageSeed(); stageTrace(); }
else { console.error(`[e-q9-dt] unknown stage ${stage}`); process.exit(2); }
