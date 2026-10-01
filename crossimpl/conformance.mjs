// crossimpl/conformance.mjs — Task 34-e conformance harness: Node drives BOTH
// implementations and compares them byte-exact.
//
//   JS side : qthe/qthe.mjs (the reference kernel, imported READ-ONLY)
//   PY side : crossimpl/py/qthe_layer0.py via crossimpl/py/worker.py
//             (spawned python3, JSON job on stdin, canonical JSON on stdout)
//
// Discipline (crossimpl/AMBIGUITY.md, frozen before any run):
//   A. bijection  — EXHAUSTIVE on the full 2^8 domain (256 inputs), byte-exact
//   B. psi        — EXHAUSTIVE on its full domain ({0,1,2,3}), byte-exact
//   C. vectorPass — 10,000 seeded randomized vectors (mulberry32, SEED
//                   0x5EED34E) + 12 fixed edge vectors, byte-exact
//   NC1a/NC1b/NC2 — negative controls: the harness must DETECT tampering
//                   (transit byte-flip; source-side lie via QTHE_TAMPER_VECTOR)
// Comparison is BYTE-EXACT: the Python worker emits stone-v1 canonical JSON
// (sorted keys, no whitespace) with its own independent serializer; the JS
// side canonicalizes its own expected object through THE STONE's
// canonicalJSON; the two TEXTS must be identical (and equal sha256), plus a
// per-vector integer diff for precise failure localization.

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const HERE = new URL('.', import.meta.url).pathname;          // crossimpl/
const REPO = new URL('..', import.meta.url).pathname;         // qthe repo root
const ART = HERE + 'artifacts/';
mkdirSync(ART, { recursive: true });

// ── READ-ONLY imports ──────────────────────────────────────────────────────
const kernel = await import(pathToFileURL(REPO + 'qthe.mjs').href);
const { pack, unpack, psi, vectorPass, PSI, mulberry32 } = kernel;

// THE STONE — canonical receipt-chain module, linked READ-ONLY (never forked),
// same discipline as experiments/_stone_link.mjs.
const STONE_CANDIDATES = [
  '../quilt-stone/stone.mjs',                                  // crossimpl/-relative
  '../../quilt-stone/stone.mjs',
  '/home/z/my-project/download/quilt-stone/stone.mjs',
];
let stone = null, stonePath = null;
for (const c of STONE_CANDIDATES) {
  try {
    const m = await import(c.startsWith('/') ? pathToFileURL(c).href : new URL(c, import.meta.url).href);
    if (typeof m.canonicalJSON === 'function' && typeof m.sha256Hex === 'function') {
      stone = m; stonePath = c; break;
    }
  } catch { /* try next candidate */ }
}
if (!stone) throw new Error('THE STONE could not be resolved READ-ONLY');
const { canonicalJSON, sha256Hex } = stone;

const WORKER = HERE + 'py/worker.py';
const SEED = 0x5EED34E;         // pre-registered (AMBIGUITY.md), hex normative
const N_BATTERY = 10000;
const N_EDGES = 12;

// ── pre-registered battery generation (AMBIGUITY.md, verbatim) ─────────────
function genBattery() {
  const r = mulberry32(SEED);
  const vectors = [];
  for (let id = 0; id < N_BATTERY; id++) {
    const J = 1 + Math.floor(r() * 6);
    const K = 1 + Math.floor(r() * 8);
    const weights = [];
    for (let j = 0; j < J; j++) {
      const row = [];
      for (let k = 0; k < K; k++) row.push(Math.floor(r() * 256));
      weights.push(row);
    }
    const xs = [];
    for (let k = 0; k < K; k++) {
      const mix = r();
      if (mix < 0.5) xs.push(Math.floor(r() * 256) - 128);        // [-128,127]
      else if (mix < 0.8) xs.push(Math.floor(r() * 256));         // [0,255]
      else {
        const sign = r() < 0.5 ? -1 : 1;
        const mag = 2 ** 36 + Math.floor(r() * (2 ** 40 - 2 ** 36)); // [2^36,2^40)
        xs.push(sign * mag);
      }
    }
    vectors.push({ id, weights, xs });
  }
  return vectors;
}

// 12 fixed edge vectors (pre-registered list, AMBIGUITY.md)
function genEdges() {
  const P = (t, d) => pack(t, d);
  return [
    { id: 10000, weights: [[0, 0, 0]], xs: [5, -5, 100], label: 'all-ground' },
    { id: 10001, weights: [[P(1, 63), P(2, 63), P(3, 63)]], xs: [0, 0, 0], label: 'all-zero-x' },
    { id: 10002, weights: [[P(0, 9), P(1, 9), P(2, 9), P(3, 9), P(0, 9), P(1, 9), P(2, 9), P(3, 9)]], xs: [1, 2, 3, 4, 5, 6, 7, 8], label: 'tau-cycling' },
    { id: 10003, weights: [[P(2, 63)]], xs: [-3], label: 'single-cell-J1K1' },
    { id: 10004, weights: [[P(1, 1), P(3, 1)]], xs: [7, 7], label: 'J=1-row' },
    { id: 10005, weights: [[P(3, 63)], [P(1, 63)], [P(2, 63)]], xs: [2], label: 'K=1-column' },
    { id: 10006, weights: [[63, 127, 191, 255]], xs: [10, 10, 10, 10], label: 'max-d-63-all-tau' },
    { id: 10007, weights: [[P(1, 63), P(3, 63)]], xs: [2 ** 40, -(2 ** 40)], label: 'x-at-2^40' },
    { id: 10008, weights: [[P(1, 7), P(2, 7), P(1, 7), P(2, 7)]], xs: [1, 1, 1, 1], label: 'attract-repel-cancel' },
    { id: 10009, weights: [[0, 1, 2, 3, 4, 5, 6, 7].map((d) => P(3, d))], xs: [-1, 1, -2, 2, -3, 3, -4, 4], label: 'all-abstain' },
    { id: 10010, weights: [[0, P(3, 1), 128, P(3, 2)]], xs: [9, 9, 9, 9], label: 'ground-abstain-mix' },
    { id: 10011, weights: [[]], xs: [], label: 'K=0-probe-A9' },
  ];
}

// ── worker + JS-side mirror of the worker's object shapes ──────────────────
function runWorker(job, tamperId) {
  const env = { ...process.env };
  if (tamperId === undefined) delete env.QTHE_TAMPER_VECTOR;
  else env.QTHE_TAMPER_VECTOR = String(tamperId);
  const p = spawnSync('python3', [WORKER], {
    input: JSON.stringify(job), encoding: 'utf8', env,
    maxBuffer: 256 * 1024 * 1024, cwd: REPO,
  });
  if (p.status !== 0) throw new Error(`worker failed (${p.status}): ${p.stderr.slice(0, 2000)}`);
  return { text: p.stdout.trim(), stderr: p.stderr };
}

function jsBijection() {
  const unpacked = [], repacked = [];
  for (let c = 0; c < 256; c++) {
    const u = unpack(c);
    unpacked.push([u.tau, u.d]);
    repacked.push(pack(u.tau, u.d));
  }
  return { task: 'bijection', unpack: unpacked, repack: repacked };
}

function jsPsi() {
  // The kernel's PSI literal is [0,1,-1,'i'] — 'i' is the operator CHARACTER;
  // the exact-integer reading (SPEC's own channel expansion y^I = Σ_{τ=3} d·x)
  // maps it to real-coeff 0 / imag-coeff +1. Recorded as A2 resolution.
  const real = [], imag = [];
  for (let t = 0; t < 4; t++) {
    const v = psi(t);
    if (v === 'i') { real.push(0); imag.push(1); } else { real.push(v); imag.push(0); }
  }
  return { task: 'psi', real, imag };
}

function jsVectorPass(vectors) {
  return {
    task: 'vectorpass',
    results: vectors.map((v) => {
      const out = vectorPass(v.weights, v.xs);
      return { id: v.id, yR: out.map((o) => o.re), yI: out.map((o) => o.im) };
    }),
  };
}

// ── comparison ─────────────────────────────────────────────────────────────
function diffVectorResults(jsObj, pyObj) {
  const misses = [];
  const jsById = new Map(jsObj.results.map((r) => [r.id, r]));
  let matched = 0;
  for (const pr of pyObj.results) {
    const jr = jsById.get(pr.id);
    if (!jr) { misses.push({ id: pr.id, why: 'no js counterpart' }); continue; }
    let ok = jr.yR.length === pr.yR.length && jr.yI.length === pr.yI.length;
    if (ok) {
      for (let j = 0; j < jr.yR.length; j++) {
        if (!Number.isInteger(pr.yR[j]) || pr.yR[j] !== jr.yR[j]) {
          misses.push({ id: pr.id, channel: 'yR', j, js: jr.yR[j], py: pr.yR[j] }); ok = false; break;
        }
        if (!Number.isInteger(pr.yI[j]) || pr.yI[j] !== jr.yI[j]) {
          misses.push({ id: pr.id, channel: 'yI', j, js: jr.yI[j], py: pr.yI[j] }); ok = false; break;
        }
      }
    } else misses.push({ id: pr.id, why: 'shape', js: [jr.yR.length, jr.yI.length], py: [pr.yR.length, pr.yI.length] });
    if (ok) matched++;
  }
  return { matched, misses };
}

function byteCompare(jsText, pyText) {
  return { byteExact: jsText === pyText, shaJs: sha256Hex(jsText), shaPy: sha256Hex(pyText) };
}

function verdictOf(ok) { return ok ? 'PASS' : 'FAIL'; }

// ── the run ────────────────────────────────────────────────────────────────
const LOG = [];
const log = (s) => { LOG.push(s); console.log(s); };
log(`stone linked READ-ONLY: ${stonePath}`);
log(`kernel qthe.mjs sha256: ${sha256Hex(readFileSync(REPO + 'qthe.mjs', 'utf8'))}`);

// — A. bijection (exhaustive, 256) —
const jsB = jsBijection();
const jsBText = canonicalJSON(jsB);
const pyB = runWorker({ task: 'bijection' });
const byteB = byteCompare(jsBText, pyB.text);
const pyBObj = JSON.parse(pyB.text);
const bPairsDistinct = new Set(pyBObj.unpack.map((p) => p.join(':'))).size;
const bFullProduct = new Set(pyBObj.unpack.map((p) => p.join(':'))).size === 256 &&
  jsB.unpack.every(([t, d]) => t >= 0 && t <= 3 && d >= 0 && d <= 63);
const secB = {
  n: 256, matched: byteB.byteExact ? 256 : 0, divergences: byteB.byteExact ? 0 : 1,
  pairsDistinct: bPairsDistinct, fullProduct: bFullProduct,
  ...byteB, verdict: verdictOf(byteB.byteExact && bPairsDistinct === 256 && bFullProduct),
};
log(`A bijection: n=256 byteExact=${byteB.byteExact} sha=${byteB.shaJs.slice(0, 16)}.. verdict=${secB.verdict}`);

// — B. psi (exhaustive, 4) —
const jsP = jsPsi();
const jsPText = canonicalJSON(jsP);
const pyP = runWorker({ task: 'psi' });
const byteP = byteCompare(jsPText, pyP.text);
const secP = { n: 4, matched: byteP.byteExact ? 4 : 0, divergences: byteP.byteExact ? 0 : 1, ...byteP, verdict: verdictOf(byteP.byteExact) };
log(`B psi: n=4 byteExact=${byteP.byteExact} verdict=${secP.verdict}`);

// — C. vectorPass (10,000 randomized + 12 edges) —
const vectors = genBattery().concat(genEdges());
const jsV = jsVectorPass(vectors);
const jsVText = canonicalJSON(jsV);
const pyV = runWorker({ task: 'vectorpass', vectors });
const byteV = byteCompare(jsVText, pyV.text);
const pyVObj = JSON.parse(pyV.text);
const diffV = diffVectorResults(jsV, pyVObj);
const secV = {
  n: vectors.length, nRandomized: N_BATTERY, nEdges: N_EDGES, seed: SEED,
  matched: diffV.matched, divergences: vectors.length - diffV.matched,
  firstMisses: diffV.misses.slice(0, 5),
  ...byteV, verdict: verdictOf(byteV.byteExact && diffV.misses.length === 0),
};
log(`C vectorPass: n=${vectors.length} (${N_BATTERY} randomized seed=${SEED} + ${N_EDGES} edges) matched=${diffV.matched} byteExact=${byteV.byteExact} verdict=${secV.verdict}`);
if (diffV.misses.length) log(`C first misses: ${JSON.stringify(diffV.misses.slice(0, 5))}`);

// — NC1a: transit tamper — flip ONE VALUE in the Python-emitted results —
const tamperTargetId = 5000;
const pyVObjTampered = structuredClone(pyVObj);
const tamperedRow = pyVObjTampered.results.find((r) => r.id === tamperTargetId);
const origVal = tamperedRow.yR[0];
tamperedRow.yR[0] = origVal + 1;                       // one integer flipped
const nc1a = byteCompare(jsVText, canonicalJSON(pyVObjTampered));
const nc1aDetected = !nc1a.byteExact;
const nc1aDiff = diffVectorResults(jsV, pyVObjTampered);
log(`NC1a transit tamper (id=${tamperTargetId} yR[0] ${origVal} -> ${origVal + 1}): detected=${nc1aDetected} localized=${nc1aDiff.misses.some((m) => m.id === tamperTargetId)}`);

// — NC1b: raw-byte transit tamper — flip ONE CHARACTER in the emitted text —
const idx = pyV.text.indexOf(`"id":${tamperTargetId}`);
const flipAt = idx + 40;                                // inside that vector's payload region
const raw = pyV.text;
const flippedChar = raw[flipAt] === '7' ? '8' : '7';
const rawTampered = raw.slice(0, flipAt) + flippedChar + raw.slice(flipAt + 1);
let nc1b = { flippedAt: flipAt, from: raw[flipAt], to: flippedChar };
let parseOk = true;
try {
  JSON.parse(rawTampered);
} catch { parseOk = false; }
nc1b.parseOkAfterFlip = parseOk;
if (parseOk) {
  const bc = byteCompare(jsVText, rawTampered);
  nc1b.detected = !bc.byteExact;
  nc1b.pyShaAfterFlip = bc.shaPy;
} else {
  nc1b.detected = true;                                 // malformed line = detected (disk-format tamper evidence)
}
log(`NC1b raw byte flip @${flipAt} ('${raw[flipAt]}'->'${flippedChar}', parseOk=${parseOk}): detected=${nc1b.detected}`);

// — NC2: source tamper — the worker itself lies via QTHE_TAMPER_VECTOR —
const pyVLie = runWorker({ task: 'vectorpass', vectors }, tamperTargetId);
const nc2Byte = byteCompare(jsVText, pyVLie.text);
const nc2Diff = diffVectorResults(jsV, JSON.parse(pyVLie.text));
const nc2 = {
  tamperEnv: `QTHE_TAMPER_VECTOR=${tamperTargetId}`,
  detected: !nc2Byte.byteExact,
  localized: nc2Diff.misses.some((m) => m.id === tamperTargetId),
  workerStderr: pyVLie.stderr.trim(),
  ...nc2Byte,
};
log(`NC2 source tamper (${nc2.tamperEnv}): detected=${nc2.detected} localized=${nc2.localized}`);

// ── verdict + artifacts ────────────────────────────────────────────────────
const verdict = {
  lane: '34-e porter-smith', task: 'LAYER 0 cross-implementation conformance',
  kernel: 'qthe/qthe.mjs (b99265e lineage)', kernelSha256: sha256Hex(readFileSync(REPO + 'qthe.mjs', 'utf8')),
  python: 'crossimpl/py/qthe_layer0.py', pythonSha256: sha256Hex(readFileSync(HERE + 'py/qthe_layer0.py', 'utf8')),
  stone: stonePath, canonicalization: 'stone-v1 canonicalJSON, byte-exact text equality',
  seed: SEED, seedHex: '0x5EED34E',
  sections: { A_bijection: secB, B_psi: secP, C_vectorPass: secV },
  controls: { NC1a: { detected: nc1aDetected, tamperTargetId, ...nc1a }, NC1b: nc1b, NC2: nc2 },
  verdict: verdictOf(secB.verdict === 'PASS' && secP.verdict === 'PASS' && secV.verdict === 'PASS'),
  controlsDetected: nc1aDetected && nc1b.detected && nc2.detected,
};
log(`VERDICT: ${verdict.verdict} (controlsDetected=${verdict.controlsDetected})`);

const vectorsText = canonicalJSON({ seed: SEED, vectors });
writeFileSync(ART + 'vectors.json', vectorsText + '\n');
writeFileSync(ART + 'py_results.json', pyV.text + '\n');
writeFileSync(ART + 'js_results.json', jsVText + '\n');
writeFileSync(ART + 'verdict.json', canonicalJSON(verdict) + '\n');
writeFileSync(ART + 'run.log', LOG.join('\n') + '\n');

// machine-readable summary for the receipt sealer
const summary = {
  verdict: verdict.verdict, controlsDetected: verdict.controlsDetected,
  A: { n: secB.n, matched: secB.matched, divergences: secB.divergences },
  B: { n: secP.n, matched: secP.matched, divergences: secP.divergences },
  C: { n: secV.n, randomized: N_BATTERY, edges: N_EDGES, seed: SEED, matched: secV.matched, divergences: secV.divergences },
  shas: {
    vectors: sha256Hex(vectorsText), py_results: sha256Hex(pyV.text), js_results: sha256Hex(jsVText),
    bijection_js: byteB.shaJs, bijection_py: byteB.shaPy,
    psi_js: byteP.shaJs, psi_py: byteP.shaPy,
    vectorpass_js: byteV.shaJs, vectorpass_py: byteV.shaPy,
  },
  controls: { NC1a: nc1aDetected, NC1b: nc1b.detected, NC2: nc2.detected },
};
writeFileSync(ART + 'summary.json', canonicalJSON(summary) + '\n');

process.exit(verdict.verdict === 'PASS' && verdict.controlsDetected ? 0 : 1);
