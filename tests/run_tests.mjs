// tests/run_tests.mjs — QTHE reference-kernel GATE RUN.
//
// ═══════════════════════════════════════════════════════════════════════════
// PRE-REGISTERED GATES — written into this header BEFORE the first run, per
// house law (rules sealed before results). Each gate carries a PREDICTION;
// the run records OBSERVED numbers; honest FAILs stay in the receipt chain,
// never rewritten. Kernel: ../qthe.mjs (interpretation receipts R1-R6 there).
// ═══════════════════════════════════════════════════════════════════════════
//
// G0  demo-sha256 cross-substrate agreement
//     PRED: 3/3 published SHA-256 vectors byte-exact from demo/sha256.mjs
//     ("", "abc", 56-char NIST vector) + identical digests vs stone's
//     node:crypto sha256Hex on kernel fixture strings.
//
// G1  pack/unpack bijection (LAYER 0 item 1)
//     PRED: 256/256 values round-trip exact; 256 DISTINCT packed outputs
//     over the 4x64 (tau,d) grid; PSI === [0, 1, -1, 'i'].
//
// G2  bounds invariance by EXHAUSTION (LAYER 0 item 2, by exhaustion)
//     PRED: (a) pure rule nextD: 256 states x 9 pressures
//     [-504,-2,-1.585,-0.5,0,0.5,1,1.585,504] = 2304/2304 results in [0,63];
//     (b) full tick: 5 arms (uniform tau=0 / tau=1 / tau=2 / tau=3 /
//     mixed all-256-states 16x16) x 3 ticks x 256 cells = 3840/3840
//     cell-updates with tau preserved EXACTLY and d in [0,63]. Timbre never
//     changes inside tick.
//
// G3  determinism seed-to-hash (LAYER 1 item 6)
//     PRED: two substrates from mulberry32(20260927), 24x16, 1000 ticks,
//     wormholes ON -> all 1000 per-tick trace hashes byte-identical between
//     runs; final cell planes byte-identical; a different-seed run (20260928)
//     hashes DIFFERENT (non-degenerate trace); static scan of qthe.mjs finds
//     ZERO Math.random occurrences.
//
// G4  split-channel exactness, hand-computed fixture (LAYER 0 item 3)
//     xs = [2, 3, 5, 7]; literals written BEFORE the run:
//       row0 [A10, R4, I6, G63]  -> { re: 10*2 - 4*3 =   8, im: 6*5 = 30 }
//       row1 [I1, I2, A7, R0]    -> { re:  7*2 - 0*3 =  14, im: 1*2+2*3 = 8 }
//       ROW1 CORRECTION (run 1, kept beside the fix — never rewrite a
//       registered gate): the re literal above was MY hand-arithmetic error
//       (d=7 multiplies x=xs[2]=5, not x=2). Correct: re = 7*5 - 0*3 = 35.
//       G4 therefore FAILS BY LETTER forever; post-hoc gate G4-P2 checks the
//       corrected literal and the kernel verdict. Prediction was wrong, not
//       the kernel.
//       row2 [G1, G2, G3, G4]    -> { re: 0, im: 0 }   (Ground excluded even
//                                        with d>0 — the tau=0 exclusion rule)
//       row3 [R9, R1]            -> { re: -(9*2+1*3) = -21, im: 0 }
//     PRED: exact equality, every output Number.isInteger.
//
// G5  wormhole twin-resonance (LAYER 1 item 4), exact pinned schedule
//     Fixture: 8x8; A=(1,1), B=(6,6) both pack(3,40); all else Ground 0
//     (so real_acc=0, written resonance = |0|+1 = 1). sigma = log2(3).
//     Schedule hand-derived from R2/R4 (live reads, row-major order,
//     last-writer-wins, never resonate with own write) and dev-smoked:
//       t0: events=[twin B s40]           A.d=40 B.d=41  s40={6,6,1}
//       t1: events=[twin A s40]           A.d=41 B.d=41  s40={1,1,1}
//       t2: events=[twin A s41, twin B s41] A.d=42 B.d=42 s41={6,6,1}
//       t3: events=[twin B s42]           A.d=42 B.d=43  s42={6,6,1}
//       t4: events=[twin A s42]           A.d=43 B.d=43  s42={1,1,1}
//       t5: events=[twin A s43, twin B s43] A.d=44 B.d=44 s43={6,6,1}
//     every event term === Math.log2(3) exactly; totalWrites = 12 after 6
//     ticks. Guards: a LONE Abstain cell (d=25) never twins after its own
//     first write (own-(x,y) guard): 6 ticks, zero events, d stays 25;
//     wormholes=false arm: zero events, A.d=B.d=40, no table created.
//     PRED: all of the above exact.
//
// G6  paired-arm sanity (the gate that makes the field lane's C2 arms
//     meaningful): wormholes ON vs OFF, same seed, 200 ticks, 24x16.
//     S1 seed 33, tau uniform over {0,1,2,3} (~96 Abstain cells over 64
//     slots — collisions inevitable):
//       PRED: ON-trace != OFF-trace (a first-divergence tick EXISTS); the
//       first cell-plane divergence tick is reported (strong prediction:
//       the sigma term flips some d — if it never does in 200 ticks that
//       observation is recorded honestly as a secondary note).
//     S2 seed 33, tau uniform over {0,1,2} (ZERO Abstain cells):
//       PRED: ON-trace === OFF-trace byte-identical at ALL 200 ticks — the
//       wormhole flag must not leak into non-Abstain dynamics.
//
// Receipt: tests/receipt.json (verdicts + observed) + tests/receipts.jsonl
// (stone-v1 chain, fully deterministic — a re-run rewrites identical bytes).
// Exit code 0 iff all gates PASS.
//
// Run: node tests/run_tests.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// stone import: sibling-repo layout first (dev box), org co-clone second —
// the fleet pattern from embassy/vc-oracle/oracle.test.mjs (paths adjusted
// for this file's depth: tests/ sits two levels under download/).
const STONE_PATHS = ['../../quilt-stone/stone.mjs', 'quilt-stone/stone.mjs'];
let stone = null, stoneLoadedFrom = null;
for (const p of STONE_PATHS) {
  try { stone = await import(p); stoneLoadedFrom = p; break; } catch { /* next */ }
}
if (!stone) throw new Error('stone.mjs not found (tried: ' + STONE_PATHS.join(', ') + ')');
const { sha256Hex, canonicalJSON, sealChain, verifyChainFile, ALGS } = stone;

const q = await import('../qthe.mjs');
const { sha256Hex: demoSha256 } = await import('../demo/sha256.mjs');

// ── harness ────────────────────────────────────────────────────────────────
const gates = [];
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function gate(id, name, predicted, pass, observed) {
  gates.push({ id, name, predicted, pass, observed });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name} :: ${JSON.stringify(observed)}`);
  return pass;
}

// ── G0: demo sha256 cross-substrate agreement ─────────────────────────────
{
  const vectors = [
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
     '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'],
  ];
  let ok = 0;
  const misses = [];
  for (const [msg, want] of vectors) {
    const got = demoSha256(msg);
    if (got === want) ok++; else misses.push({ msg: msg.slice(0, 12), got, want });
  }
  // cross-check vs stone (node:crypto) on a kernel-flavored fixture
  const fixtureSeed = q.makeSubstrate(4, 4, (x, y) => q.pack((x + y) & 3, (x * 7 + y) & 63));
  const fixtureStr = canonicalJSON(q.traceView(fixtureSeed, []));
  const a = demoSha256(fixtureStr), b = sha256Hex(fixtureStr);
  const crossOk = a === b;
  if (crossOk) ok++;
  else misses.push({ msg: 'cross-check', a, b });
  gate('G0', 'demo-sha256 == stone sha256Hex (3 published vectors + 1 fixture)',
    '4/4 byte-identical digests', ok === 4, { ok, misses });
}

// ── G1: pack/unpack bijection ─────────────────────────────────────────────
{
  let rt = 0, miss = -1;
  for (let c = 0; c < 256; c++) {
    const { tau, d } = q.unpack(c);
    if (q.pack(tau, d) === c && q.tauOf(c) === (c >> 6) && q.dOf(c) === (c & 63)) rt++;
    else if (miss < 0) miss = c;
  }
  const distinct = new Set();
  for (let t = 0; t < 4; t++) for (let d = 0; d < 64; d++) distinct.add(q.pack(t, d));
  const psiOk = q.psi(0) === 0 && q.psi(1) === 1 && q.psi(2) === -1 && q.psi(3) === 'i'
    && deepEq(q.PSI, [0, 1, -1, 'i']);
  gate('G1', 'pack/unpack bijection over all 256 values + Psi map',
    '256/256 round-trips; 256 distinct; PSI=[0,1,-1,i]',
    rt === 256 && distinct.size === 256 && psiOk,
    { roundTrips: rt, distinctPacked: distinct.size, psiOk, firstMiss: miss });
}

// ── G2: bounds invariance by exhaustion ───────────────────────────────────
{
  const pressures = [-504, -2, -1.585, -0.5, 0, 0.5, 1, 1.585, 504];
  let cases = 0, inB = 0, bad = null;
  for (let c = 0; c < 256; c++) {
    const d = c & 63;
    for (const p of pressures) {
      const nd = q.nextD(d, p);
      cases++;
      if (nd >= 0 && nd <= 63) inB++; else if (!bad) bad = { d, p, nd };
    }
  }
  // full-tick arms: 5 x 16x16 substrates x 3 ticks x 256 cells
  const arms = [
    ['uniform-tau0', (x, y) => q.pack(0, (x * 13 + y * 7) & 63)],
    ['uniform-tau1', (x, y) => q.pack(1, (x * 13 + y * 7) & 63)],
    ['uniform-tau2', (x, y) => q.pack(2, (x * 13 + y * 7) & 63)],
    ['uniform-tau3', (x, y) => q.pack(3, (x * 13 + y * 7) & 63)],
    ['mixed-all256', (x, y, i) => i & 0xff],
  ];
  let cellsChecked = 0, cellsOk = 0, tauFlip = null, oob = null;
  for (const [name, seedFn] of arms) {
    const sub = q.makeSubstrate(16, 16, seedFn);
    const tauBefore = Array.from(sub, q.tauOf);
    for (let t = 0; t < 3; t++) {
      q.tick(sub, {});                       // lazy persistent table where needed
      for (let i = 0; i < 256; i++) {
        cellsChecked++;
        const tau = q.tauOf(sub[i]), d = q.dOf(sub[i]);
        if (tau !== tauBefore[i]) { if (!tauFlip) tauFlip = { name, t, i }; continue; }
        if (d >= 0 && d <= 63) cellsOk++; else if (!oob) oob = { name, t, i, d };
      }
    }
  }
  gate('G2', 'bounds invariance by exhaustion (nextD + full tick, tau frozen)',
    '2304/2304 nextD; 3840/3840 tick cells in [0,63] with tau preserved',
    inB === cases && cellsOk === cellsChecked && !tauFlip && !oob,
    { nextD_cases: cases, nextD_inBounds: inB, tick_cellsChecked: cellsChecked, tick_cellsOk: cellsOk, tauFlip, oob });
}

// ── G3: determinism seed-to-hash ──────────────────────────────────────────
function seededSubstrate(seed, w = 24, h = 16, tauSpan = 4) {
  const rng = q.mulberry32(seed);
  return q.makeSubstrate(w, h, (x, y) => q.pack(Math.floor(rng() * tauSpan), Math.floor(rng() * 64)));
}
function runTrace(seed, ticks) {
  const sub = seededSubstrate(seed);
  const perTick = [];
  for (let t = 0; t < ticks; t++) {
    q.tick(sub, {});                          // lazy persistent table per substrate
    perTick.push(sha256Hex(canonicalJSON(q.traceView(sub))));
  }
  return { sub, perTick, digest: sha256Hex(perTick.join('\n')) };
}
{
  const A1 = runTrace(20260927, 1000);
  const A2 = runTrace(20260927, 1000);
  const B  = runTrace(20260928, 1000);
  let match = 0;
  for (let t = 0; t < 1000; t++) if (A1.perTick[t] === A2.perTick[t]) match++;
  const planeEq = deepEq(Array.from(A1.sub), Array.from(A2.sub));
  const diffSeed = A1.digest !== B.digest;
  const kernelSrc = fs.readFileSync(path.join(HERE, '..', 'qthe.mjs'), 'utf8');
  // static scan runs on COMMENT-STRIPPED source (run 1 finding: the scan hit
  // this project's own determinism-contract comment — a docstring false
  // positive, the same lesson Task 26-b's e_st1 scanner learned)
  const stripped = kernelSrc.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, '');
  const randHits = (stripped.match(/Math\.random/g) || []).length;
  gate('G3', 'determinism: same seed -> byte-identical 1000-tick trace; no Math.random in kernel',
    'A1==A2 1000/1000 per-tick; planes equal; seed 20260928 differs; randHits=0',
    match === 1000 && planeEq && diffSeed && randHits === 0,
    { perTickMatch: match, planeEq, traceDigest_A: A1.digest, traceDigest_B: B.digest, diffSeed, randHits });
}

// ── G4: split-channel exactness (literals pre-registered in the header) ───
{
  const xs = [2, 3, 5, 7];
  const weights = [
    [q.pack(1, 10), q.pack(2, 4),  q.pack(3, 6),  q.pack(0, 63)],
    [q.pack(3, 1),  q.pack(3, 2),  q.pack(1, 7),  q.pack(2, 0)],
    [q.pack(0, 1),  q.pack(0, 2),  q.pack(0, 3),  q.pack(0, 4)],
    [q.pack(2, 9),  q.pack(2, 1)],
  ];
  const EXPECT = [{ re: 8, im: 30 }, { re: 14, im: 8 }, { re: 0, im: 0 }, { re: -21, im: 0 }];
  const got = q.vectorPass(weights, xs);
  const allInt = got.every((o) => Number.isInteger(o.re) && Number.isInteger(o.im));
  const g4 = gate('G4', 'split-channel vectorPass exact vs hand-computed literals',
    'exact [{re:8,im:30},{re:14,im:8},{re:0,im:0},{re:-21,im:0}], all integers (see header CORRECTION)',
    deepEq(got, EXPECT) && allInt,
    { got, allInt });
  // POST-HOC G4-P2 (run 1 correction — the registered gate above stays as
  // written): corrected literal for row1 is re = 7*5 = 35.
  const g4p2 = gate('G4-P2', 'post-hoc: corrected row1 literal (prediction error, not kernel error)',
    'exact [{re:8,im:30},{re:35,im:8},{re:0,im:0},{re:-21,im:0}], all integers',
    deepEq(got, [{ re: 8, im: 30 }, { re: 35, im: 8 }, { re: 0, im: 0 }, { re: -21, im: 0 }]) && allInt,
    { got, allInt });
  gates[gates.length - 2].postHocPass = g4p2;      // G4's failure is a prediction error...
  gates[gates.length - 2].postHocOf = 'G4-P2';     // ...vindicated by the corrected literal
  gates[gates.length - 1].isPostHocFor = 'G4';     // G4-P2 exists only because G4's literal was wrong
}

// ── G5: wormhole twin-resonance, pinned schedule ──────────────────────────
function twinFixture() {
  const sub = q.makeSubstrate(8, 8, (x, y) =>
    ((x === 1 && y === 1) || (x === 6 && y === 6)) ? q.pack(3, 40) : q.pack(0, 0));
  return sub;
}
{
  const sub = twinFixture();
  const table = new q.WormholeTable();
  const S = Math.log2(3);
  // pinned schedule (pre-registered in the header): events by tick
  const PRED = [
    { ev: [[6, 6, 40]], A: 40, B: 41, s40: [6, 6, 1] },
    { ev: [[1, 1, 40]], A: 41, B: 41, s40: [1, 1, 1] },
    { ev: [[1, 1, 41], [6, 6, 41]], A: 42, B: 42, s41: [6, 6, 1] },
    { ev: [[6, 6, 42]], A: 42, B: 43, s42: [6, 6, 1] },
    { ev: [[1, 1, 42]], A: 43, B: 43, s42: [1, 1, 1] },
    { ev: [[1, 1, 43], [6, 6, 43]], A: 44, B: 44, s43: [6, 6, 1] },
  ];
  const misses = [];
  for (let t = 0; t < 6; t++) {
    q.tick(sub, { table });
    const p = PRED[t];
    const ev = sub.lastEvents.map((e) => [e.x, e.y, e.slot]);
    if (!deepEq(ev, p.ev)) misses.push({ t, field: 'events', got: ev, want: p.ev });
    if (!sub.lastEvents.every((e) => e.kind === 'twin' && e.resonance === 1 && e.term === S))
      misses.push({ t, field: 'term/resonance', got: sub.lastEvents });
    const A = q.dOf(sub[1 * 8 + 1]), B = q.dOf(sub[6 * 8 + 6]);
    if (A !== p.A || B !== p.B) misses.push({ t, field: 'd', got: [A, B], want: [p.A, p.B] });
    for (const [slot, want] of [['s40', p.s40], ['s41', p.s41], ['s42', p.s42], ['s43', p.s43]]) {
      if (!want) continue;
      const hit = table.read(Number(slot.slice(1)));
      if (!hit || hit.x !== want[0] || hit.y !== want[1] || hit.resonance !== want[2])
        misses.push({ t, field: slot, got: hit, want });
    }
  }
  // lone-Abstain guard: own-(x,y) write never resonates
  const lone = q.makeSubstrate(8, 8, (x, y) => (x === 3 && y === 3) ? q.pack(3, 25) : q.pack(0, 0));
  let loneEvents = 0;
  for (let t = 0; t < 6; t++) { q.tick(lone, {}); loneEvents += lone.lastEvents.length; }
  const loneD = q.dOf(lone[3 * 8 + 3]);
  // OFF arm: no events, no table created, d frozen
  const off = twinFixture();
  let offEvents = 0;
  for (let t = 0; t < 3; t++) { q.tick(off, { wormholes: false }); offEvents += off.lastEvents.length; }
  const offOk = offEvents === 0 && q.dOf(off[9]) === 40 && q.dOf(off[54]) === 40
    && off.__wormholes === undefined;
  gate('G5', 'twin resonance: pinned schedule t0..t5 + own-write guard + OFF arm',
    'exact schedule (see header); term=log2(3); lone cell silent; OFF arm silent+tableless',
    misses.length === 0 && loneEvents === 0 && loneD === 25 && table.totalWrites === 12 && offOk,
    { misses, loneEvents, loneD, totalWrites: table.totalWrites, offOk });
}

// ── G6: paired-arm sanity (wormholes ON vs OFF) ───────────────────────────
function pairedArm(seed, tauSpan, ticks = 200) {
  const mk = () => seededSubstrate(seed, 24, 16, tauSpan);
  const on = mk(), off = mk();
  const onH = [], offH = [];
  for (let t = 0; t < ticks; t++) {
    q.tick(on, {});  onH.push(sha256Hex(canonicalJSON(q.traceView(on))));
    q.tick(off, { wormholes: false }); offH.push(sha256Hex(canonicalJSON(q.traceView(off))));
  }
  let firstDiff = -1, firstCellDiff = -1;
  const onPlane = Array.from(on), offPlane = Array.from(off);
  for (let t = 0; t < ticks; t++) if (firstDiff < 0 && onH[t] !== offH[t]) firstDiff = t;
  for (let i = 0; i < onPlane.length; i++) if (onPlane[i] !== offPlane[i]) { firstCellDiff = i; break; }
  return { abstains: onPlane.filter((c) => c >> 6 === 3).length, firstDiff, firstCellDiff,
           identical: onH.join('') === offH.join(''), onDigest: sha256Hex(onH.join('\n')) };
}
{
  const s1 = pairedArm(33, 4);
  const s2 = pairedArm(33, 3);
  gate('G6', 'paired arms: differ iff Abstain cells exist; no leak otherwise',
    'S1 (Abstain present) traces DIVERGE (firstDiff tick exists); S2 (no Abstain) IDENTICAL 200/200',
    s1.firstDiff >= 0 && s2.identical,
    { S1: s1, S2: { abstains: s2.abstains, identical: s2.identical, firstDiff: s2.firstDiff,
                    onDigest: s2.onDigest } });
}

// ── receipt: stone-v1 chain + verdict json (deterministic, no wall-clock) ─
// all_pass: every registered gate passes, or its failure is diagnosed as a
// PREDICTION error with the post-hoc corrected gate passing (house pattern:
// falsified predictions stay beside their post-hoc labels — never rewritten).
const allPass = gates.every((g) => g.pass || g.postHocPass === true);
const kernelPath = path.join(HERE, '..', 'qthe.mjs');
const receipt = {
  kernel: 'qthe.mjs',
  kernel_sha256: sha256Hex(fs.readFileSync(kernelPath, 'utf8')),
  gates,
  all_pass: allPass,
  stone_loaded_from: stoneLoadedFrom,
  chain: null,
};
const rows = [
  {
    kind: 'stone.header', alg: 'stone-v1', genesis: ALGS['stone-v1'].genesis,
    repo: 'SuperInstance/qthe', lane: '33-a core-smith',
    owns: 'qthe.mjs, tests/, index.html, demo/',
    experiment: 'QTHE reference-kernel gate run G0-G6 (pre-registered in tests/run_tests.mjs header)',
  },
  ...gates.map((g) => ({
    kind: 'qthe.gate', id: g.id, name: g.name, pass: g.pass,
    predicted: g.predicted, observed: g.observed,
  })),
  {
    kind: 'qthe.gate.summary', all_pass: allPass,
    gates_passed: gates.filter((g) => g.pass).length, gates_total: gates.length,
    note: 'honest FAILs stay in the record; re-run rewrites identical bytes (no wall-clock)',
  },
];
sealChain(rows, undefined, { alg: 'stone-v1' });
const chainFile = path.join(HERE, 'receipts.jsonl');
fs.writeFileSync(chainFile, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
const vDisk = verifyChainFile(chainFile);
receipt.chain = { file: 'tests/receipts.jsonl', links: vDisk.links, tip: vDisk.tip, alg: vDisk.alg, verified: vDisk.ok };
fs.writeFileSync(path.join(HERE, 'receipt.json'), JSON.stringify(receipt, null, 1) + '\n');
console.log(JSON.stringify({ all_pass: allPass, chain: receipt.chain, gates: gates.map((g) => [g.id, g.pass]) }));
if (!vDisk.ok) { console.error('CHAIN BROKEN after write: ' + vDisk.why); process.exit(1); }
process.exit(allPass ? 0 : 1);
