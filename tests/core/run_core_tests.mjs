// tests/core/run_core_tests.mjs — @qthe/core v0 API GATE RUN.
//
// ═══════════════════════════════════════════════════════════════════════════
// PRE-REGISTERED GATES — written into this header BEFORE the first run, per
// house law (rules sealed before results). Each gate carries a PREDICTION;
// honest FAILs stay, never rewritten. SUT: qthe-core/src/ (the v0 API:
// errors, codec, sha256, canonical, engine, compat, index).
//
// SCOPE HONESTY (RC-05 split, binding — these gates price what is priceable
// and do not touch the unpriced half): single-writer logs produced and
// replayed by THIS build are exact — THAT is what C-CANARY/C-REPLAY price.
// Cross-implementation multi-writer op-log determinism remains NOT YET
// PRICED (P1 exit: the falsification-bench differential fuzzer + multi-
// writer corpus). Nothing here may be cited as pricing that half.
// ═══════════════════════════════════════════════════════════════════════════
//
// C-SHA      pure-JS sha256 correctness
//            PRED: 3/3 published NIST vectors byte-exact ("", "abc", the
//            56-char vector) + 20/20 pseudo-random buffers agreeing with
//            node:crypto both as bytes and hex.
//
// C-JCS      canonicalJson (OLOG-SPEC §7.1 / RFC 8785 subset)
//            PRED: key sort, float form (log2(3) → 1.584962500721156), -0 →
//            "0"; 6/6 unclean values throw (undefined, NaN, Infinity,
//            function, Uint8Array, Map); the §7.3 Appendix-A canonical
//            string round-trips byte-identically.
//
// C-CODEC    checked codec (LAYER 0)
//            PRED: pack/unpack bijection 256/256; 6/6 out-of-domain inputs
//            throw the exact E_CODEC_* code; vectorPass exact on the G4
//            fixture (corrected literals; row3 padded — core rejects ragged,
//            the kernel's short-row tolerance is a compat-only behavior).
//
// C-STAMP    package/source stamp sync
//            PRED: PACKAGE_VERSION === package.json version (0.2.0);
//            KERNEL_SCHEMA_VERSION "0.1.0" / SPEC "1.0.0" / OLOG "1" /
//            SNAPSHOT "1" / HASH "qth1" — the canary's stamps.
//
// C-CANARY   THE OLOG-SPEC §7.3 CANARY (the keystone gate)
//            Fixture: 8×8, seed pack((x+y)&3, (x*5+y*3)&63) journaled as
//            setBytes at at:0, 3 default ticks.
//            PRED: seed bytes = Appendix A's 64 bytes; opsHash =
//            d5e0fc61…; cellsHex = 004887d2…70bb; table = the 33 Appendix
//            tuples exactly; last-tick events = the 13 Appendix twins
//            (modulo the engine's added 1-based `tick` field = 3);
//            stateHash = qth1:69d81dfc5d4b9f5b708e7524dfb0a632f1fd881d342bf
//            85eec90bfdda95efb3a; hashTrace(trace) === trace.stateHash;
//            replayTrace(trace) matches with eventsByTick[2] === the 13
//            twins. ANY divergence anywhere is a hard FAIL — the canary is
//            the cross-implementation judge, not a suggestion.
//
// C-SEED     seed-capture ladder (Flag 2: the seed IS the ops at at:0)
//            PRED: bytes→setBytes, uniform→fillRect, mulberry32→
//            seedMulberry32, legacyFn→setBytes (fn runs once, bad byte
//            throws); no seed → zero ops; two empty seeds on the same dims
//            hash equal.
//
// C-I6       every dynamics parameter is journaled
//            PRED: sigma starts at DEFAULT_SIGMA; changes ONLY via
//            setOptions ops (journal carries them; getter has no setter —
//            assignment throws TypeError in strict mode); the C3 σ-sweep
//            recipe (inject setOptions, run) replays exactly per arm.
//
// C-AT       boundary discipline (§4)
//            PRED: omitted at fills the current tick count; at≠ticks on
//            inject throws E_OP_AT both directions; replay refuses
//            non-monotonic logs and at > tickCount (E_OP_AT) and missing at
//            (E_OP_SHAPE); post-run ops at at===tickCount are journaled,
//            affect the hash, and are never ticked after.
//
// C-HOSTILE  validation hostility (§3: nothing masked, clipped, coerced)
//            PRED: 24/24 bad-op cases throw the exact code (E_OP_UNKNOWN/
//            SHAPE/BOUNDS); a batch with one invalid op applies NOTHING
//            (atomicity); mulberry32 refuses -1, 2^32, 5.7 with
//            PrngSeedError (a TypeError carrying E_CODEC_PRNG_SEED).
//
// C-RTRIP    snapshot round-trip law
//            PRED: for 3 scenarios (plain seeded+ticks; whWrite+setOptions
//            sweeps+post-run op; empty no-tick), restore(snap).hash() ===
//            s.hash(); structuredClone(snap) crosses cleanly; tampered σ,
//            wrong v, wrong stamps throw E_SNAPSHOT_SHAPE/VERSION.
//
// C-REPLAY   replay = determinism (priced half; see SCOPE HONESTY)
//            PRED: the 19-tick scenario trace replays with matches=true,
//            identical eventsByTick, identical journal; JSON round-trip of
//            the trace replays identically; hashTrace === stateHash on the
//            honest trace; tampered ops → E_REPLAY_HASH; tampered cellsHex
//            → detected by hashTrace (mismatch) while replayTrace still
//            matches (physics honest — the two tools guard different
//            halves); unknown op → E_OP_UNKNOWN; wrong stamps →
//            E_REPLAY_VERSION; expectMatch:false returns matches:false
//            without throwing.
//
// C-DIFF     engine-vs-kernel differential (the physics equality proof)
//            PRED: 25/25 pseudo-random substrates (dims 5..24, seeded
//            planes, 30 ticks each): per-tick byte planes identical, event
//            streams identical modulo the engine's `tick` field, table
//            tuples identical, totalWrites identical. Plus 3 stress arms:
//            wormholes-OFF (kernel per-tick opts vs engine setOptions),
//            σ=5 sweep (kernel per-tick sigma vs engine sticky sigma), and
//            a whWrite schedule — all byte-identical.
//
// C-COMPAT   compat is the kernel, frozen
//            PRED: all 17 compat exports === the kernel module's (identity,
//            not deep-equality); the frozen defects pin: pack(7,100)===
//            pack(3,36)===228; mulberry32(2^32+5) ≡ mulberry32(5); psi(7)
//            === psi(3) === 'i'.
//
// Exit code 0 iff ALL gates PASS. No chains, no stone (selfcheck law — the
// receipt is the console log + CI green).
// ═══════════════════════════════════════════════════════════════════════════

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as kernel from '../../qthe-core/kernel/qthe.mjs';
import * as compat from '../../qthe-core/src/compat.mjs';
import { sha256Hex, sha256Bytes } from '../../qthe-core/src/sha256.mjs';
import { canonicalJson } from '../../qthe-core/src/canonical.mjs';
import {
  Substrate, WormholeTable, replayTrace, validateTrace, hashTrace,
  mulberry32, nextD, canonicalJson as engineCanonicalJson,
  PACKAGE_VERSION, KERNEL_SCHEMA_VERSION, SPEC_VERSION, OLOG_VERSION,
  SNAPSHOT_VERSION, HASH_VERSION, HASH_ALGORITHM, DEFAULT_SIGMA, SLOT_COUNT,
} from '../../qthe-core/src/engine.mjs';
import * as codec from '../../qthe-core/src/codec.mjs';
import {
  QtheError, CodecError, OpError, ReplayError, SnapshotError, DimensionError, PrngSeedError,
} from '../../qthe-core/src/errors.mjs';

let fails = 0;
let checks = 0;
const failedNames = [];
function ok(name, pass, detail = '') {
  checks++;
  if (!pass) { fails++; failedNames.push(name); }
  console.log(`  ${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
}
function gateHeader(name) { console.log(`\n${name}`); }
function errCode(fn) {
  try { fn(); return null; } catch (e) { return e.code ?? `<<${e.constructor.name}: ${e.message.slice(0, 60)}>>`; }
}
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ═══════════════════════════════ C-SHA ═══════════════════════════════════
gateHeader('C-SHA — pure-JS sha256 correctness');
{
  const vectors = [
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'],
  ];
  let n = 0;
  for (const [input, hex] of vectors) {
    const got = sha256Hex(input);
    if (got === hex) n++;
    else console.log(`    digest(${JSON.stringify(input.slice(0, 12))}…) = ${got}`);
  }
  ok('S1 NIST vectors', n === 3, `${n}/3 byte-exact`);

  const nodeHex = (buf) => createHash('sha256').update(buf).digest('hex');
  const rng = mulberry32(31337); // engine PRNG — independent of the sha under test
  let agree = 0, cases = 0;
  for (let i = 0; i < 20; i++) {
    const len = 1 + Math.floor(rng() * 5000);
    const buf = new Uint8Array(len);
    for (let j = 0; j < len; j++) buf[j] = Math.floor(rng() * 256);
    cases++;
    if (sha256Hex(buf) === nodeHex(buf) &&
        Array.from(sha256Bytes(buf)).every((b, k) => b === parseInt(nodeHex(buf).slice(2 * k, 2 * k + 2), 16))) agree++;
  }
  ok('S2 node:crypto differential', agree === cases, `${agree}/${cases} buffers agree (hex + raw bytes)`);
}

// ═══════════════════════════════ C-JCS ══════════════════════════════════
gateHeader('C-JCS — canonicalJson (§7.1)');
{
  ok('J1 key sort + no whitespace',
    canonicalJson({ b: 1, a: 2 }) === '{"a":2,"b":1}' &&
    canonicalJson({ v: { hash: 'qth1', kernel: '0.1.0' }, w: 8 }) === '{"v":{"hash":"qth1","kernel":"0.1.0"},"w":8}');
  ok('J2 float form (σ)', canonicalJson(DEFAULT_SIGMA) === '1.584962500721156',
    `got ${canonicalJson(DEFAULT_SIGMA)}`);
  ok('J3 -0 → "0"', canonicalJson(-0) === '0');
  ok('J4 nested arrays keep order',
    canonicalJson([1, { z: null, y: [true, 'x'] }]) === '[1,{"y":[true,"x"],"z":null}]');
  // §7.3 Appendix A: the exact canonical digest input must round-trip
  const appendixA = '{"cellsHex":"004887d2115c9be04686d0155499e42983ce135297e22766cc115095e02564af094e93de2362a7ec5291dc2160a5f0358fda1f5ea3ee3372d21d5ca7e63170bb","h":8,"opsHash":"d5e0fc61b417b9bf45d96c6ba9863a39aa9da2336df8f77eb8f40c5080230b16","sigma":1.584962500721156,"table":[[9,0,3,9],[10,0,3,7],[11,0,3,5],[12,1,2,11],[13,1,2,13],[14,2,1,11],[15,2,1,13],[16,3,0,7],[17,3,0,5],[19,0,7,17],[20,0,7,17],[21,0,7,17],[23,1,6,9],[24,1,6,11],[25,1,6,13],[26,2,5,9],[27,2,5,9],[28,3,4,9],[29,3,4,9],[30,4,3,9],[31,4,3,9],[32,5,2,9],[33,5,2,9],[34,6,1,11],[35,6,1,13],[39,4,7,17],[40,4,7,17],[41,4,7,17],[43,5,6,9],[44,5,6,9],[45,5,6,9],[46,6,5,9],[47,6,5,9]],"ticks":3,"v":{"hash":"qth1","kernel":"0.1.0","olog":"1","spec":"1.0.0"},"w":8}';
  const parsedA = JSON.parse(appendixA);
  ok('J5 Appendix-A canonical string round-trips', canonicalJson(parsedA) === appendixA);
  const unclean = [
    ['undefined', () => canonicalJson(undefined)],
    ['NaN', () => canonicalJson(NaN)],
    ['Infinity', () => canonicalJson(Infinity)],
    ['function', () => canonicalJson(() => 1)],
    ['Uint8Array', () => canonicalJson(new Uint8Array([1, 2]))],
    ['Map', () => canonicalJson(new Map())],
  ];
  let thrown = 0;
  for (const [, fn] of unclean) { try { fn(); } catch (e) { if (e instanceof TypeError) thrown++; } }
  ok('J6 unclean values throw TypeError', thrown === 6, `${thrown}/6`);
  ok('J7 engine re-export is the same function', engineCanonicalJson === canonicalJson);
}

// ═══════════════════════════════ C-CODEC ═════════════════════════════════
gateHeader('C-CODEC — checked codec (LAYER 0)');
{
  let bad = 0;
  for (let c = 0; c < 256; c++) {
    const { tau, d } = codec.unpack(c);
    if (codec.pack(tau, d) !== c) bad++;
  }
  ok('K1 pack/unpack bijection', bad === 0, `${256 - bad}/256 round-trips`);
  const cases = [
    [() => codec.pack(7, 0), 'E_CODEC_TAU'],
    [() => codec.pack(0, 64), 'E_CODEC_D'],
    [() => codec.pack(0.5, 0), 'E_CODEC_TAU'],
    [() => codec.tauOf(-1), 'E_CODEC_BYTE'],
    [() => codec.tauOf(256), 'E_CODEC_BYTE'],
    [() => codec.psi(4), 'E_CODEC_TAU'],
  ];
  let good = 0;
  for (const [fn, code] of cases) if (errCode(fn) === code) good++;
  ok('K2 out-of-domain throws exact codes', good === 6, `${good}/6`);
  // G4 fixture (corrected literals; row3 padded to full width — core
  // rejects ragged rows, E_CODEC_VECTOR, where the kernel consumed xs
  // positionally: a documented core/kernel divergence, compat-only).
  const A = (d) => codec.pack(1, d), R = (d) => codec.pack(2, d), I = (d) => codec.pack(3, d), G = (d) => codec.pack(0, d);
  const w = [
    [A(10), R(4), I(6), G(63)],
    [I(1), I(2), A(7), R(0)],
    [G(1), G(2), G(3), G(4)],
    [R(9), R(1), G(0), G(0)],
  ];
  const xs = [2, 3, 5, 7];
  const out = codec.vectorPass(w, xs);
  ok('K3 vectorPass split channels (G4 fixture)',
    out[0].re === 8 && out[0].im === 30 &&
    out[1].re === 35 && out[1].im === 8 &&
    out[2].re === 0 && out[2].im === 0 &&
    out[3].re === -21 && out[3].im === 0,
    `got ${JSON.stringify(out)}`);
  ok('K4 vectorPass ragged row throws', errCode(() => codec.vectorPass([[1, 2]], [1])) === 'E_CODEC_VECTOR');
  ok('K5 vectorPass bad weight throws', errCode(() => codec.vectorPass([[300]], [1])) === 'E_CODEC_BYTE');
  ok('K6 vectorPass non-integer x throws', errCode(() => codec.vectorPass([[1]], [5.5])) === 'E_CODEC_HORIZON');
  ok('K7 vectorPass beyond-horizon x throws', errCode(() => codec.vectorPass([[1]], [2 ** 54])) === 'E_CODEC_HORIZON');
}

// ═══════════════════════════════ C-STAMP ═════════════════════════════════
gateHeader('C-STAMP — stamp sync (Flag 1)');
{
  const here = fileURLToPath(import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL('../../qthe-core/package.json', import.meta.url), 'utf8'));
  ok('T1 PACKAGE_VERSION === package.json version', PACKAGE_VERSION === pkg.version, `${PACKAGE_VERSION} vs ${pkg.version}`);
  ok('T2 digest stamps are the canary\'s',
    KERNEL_SCHEMA_VERSION === '0.1.0' && SPEC_VERSION === '1.0.0' && OLOG_VERSION === '1' &&
    SNAPSHOT_VERSION === '1' && HASH_VERSION === 'qth1' && HASH_ALGORITHM === 'sha256' &&
    SLOT_COUNT === 64);
  ok('T3 DEFAULT_SIGMA is log2(3)', DEFAULT_SIGMA === Math.log2(3));
  void here;
}

// ═══════════════════════════════ C-CANARY ════════════════════════════════
gateHeader('C-CANARY — the OLOG-SPEC §7.3 canary (keystone)');
{
  // Seed: pack((x+y)&3, (x*5+y*3)&63) over 8×8, row-major.
  const seedBytes = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) seedBytes.push(codec.pack((x + y) & 3, (x * 5 + y * 3) & 63));
  const appendixBytes = [0,69,138,207,20,89,158,227,67,136,205,18,87,156,225,38,134,203,16,85,154,223,36,105,201,14,83,152,221,34,103,172,12,81,150,219,32,101,170,239,79,148,217,30,99,168,237,50,146,215,28,97,166,235,48,117,213,26,95,164,233,46,115,184];
  ok('N1 seed recipe = Appendix A bytes', deepEq(seedBytes, appendixBytes), `${seedBytes.length} bytes`);

  const sub = Substrate.create({ w: 8, h: 8, seed: { kind: 'bytes', bytes: seedBytes } });
  sub.run(3);

  const EXPECT_OPSHASH = 'd5e0fc61b417b9bf45d96c6ba9863a39aa9da2336df8f77eb8f40c5080230b16';
  const EXPECT_CELLSHEX = '004887d2115c9be04686d0155499e42983ce135297e22766cc115095e02564af094e93de2362a7ec5291dc2160a5f0358fda1f5ea3ee3372d21d5ca7e63170bb';
  const EXPECT_TABLE = [[9,0,3,9],[10,0,3,7],[11,0,3,5],[12,1,2,11],[13,1,2,13],[14,2,1,11],[15,2,1,13],[16,3,0,7],[17,3,0,5],[19,0,7,17],[20,0,7,17],[21,0,7,17],[23,1,6,9],[24,1,6,11],[25,1,6,13],[26,2,5,9],[27,2,5,9],[28,3,4,9],[29,3,4,9],[30,4,3,9],[31,4,3,9],[32,5,2,9],[33,5,2,9],[34,6,1,11],[35,6,1,13],[39,4,7,17],[40,4,7,17],[41,4,7,17],[43,5,6,9],[44,5,6,9],[45,5,6,9],[46,6,5,9],[47,6,5,9]];
  const EXPECT_HASH = 'qth1:69d81dfc5d4b9f5b708e7524dfb0a632f1fd881d342bf85eec90bfdda95efb3a';
  const EXPECT_EVENTS = [
    { x: 7, y: 0, slot: 33, resonance: 9, term: 14.264662506490405 },
    { x: 2, y: 1, slot: 15, resonance: 9, term: 14.264662506490405 },
    { x: 6, y: 1, slot: 35, resonance: 33, term: 52.30376252379815 },
    { x: 1, y: 2, slot: 13, resonance: 9, term: 14.264662506490405 },
    { x: 5, y: 2, slot: 33, resonance: 33, term: 52.30376252379815 },
    { x: 0, y: 3, slot: 11, resonance: 9, term: 14.264662506490405 },
    { x: 4, y: 3, slot: 31, resonance: 9, term: 14.264662506490405 },
    { x: 3, y: 4, slot: 29, resonance: 9, term: 14.264662506490405 },
    { x: 7, y: 4, slot: 45, resonance: 9, term: 14.264662506490405 },
    { x: 2, y: 5, slot: 27, resonance: 9, term: 14.264662506490405 },
    { x: 6, y: 5, slot: 47, resonance: 33, term: 52.30376252379815 },
    { x: 1, y: 6, slot: 25, resonance: 9, term: 14.264662506490405 },
    { x: 5, y: 6, slot: 45, resonance: 33, term: 52.30376252379815 },
  ];

  const trace = sub.trace();
  const journalOps = sub.ops;
  const gotOpsHash = sha256Hex(canonicalJson(journalOps));
  ok('N2 opsHash', gotOpsHash === EXPECT_OPSHASH, gotOpsHash);
  ok('N3 cellsHex', trace.cellsHex === EXPECT_CELLSHEX, trace.cellsHex.slice(0, 32) + '…');
  ok('N4 table tuples', deepEq(sub.wormholes.slots().map((s) => [s.slot, s.x, s.y, s.resonance]), EXPECT_TABLE),
    `${sub.wormholes.occupiedCount()} occupied`);
  const strip = (ev) => ev.map(({ x, y, slot, resonance, term }) => ({ x, y, slot, resonance, term }));
  const ev = strip(sub.events);
  ok('N5 last-tick events (13 twins)', ev.length === 13 && deepEq(ev, EXPECT_EVENTS),
    `${ev.length} events, all tick=${sub.events[0]?.tick}`);
  ok('N6 events carry 1-based tick', sub.events.every((e) => e.tick === 3));
  ok('N7 stateHash', sub.hash() === EXPECT_HASH, sub.hash());
  ok('N8 trace.stateHash === hash()', trace.stateHash === sub.hash());
  ok('N9 hashTrace(trace) === stateHash', hashTrace(trace) === EXPECT_HASH, hashTrace(trace));
  const rr = replayTrace(trace);
  ok('N10 replayTrace matches', rr.matches === true && rr.hash === EXPECT_HASH);
  ok('N11 replay eventsByTick[2] = the 13 twins',
    rr.eventsByTick.length === 3 &&
    deepEq(rr.eventsByTick[2].map(({ x, y, slot, resonance, term }) => ({ x, y, slot, resonance, term })), EXPECT_EVENTS));
  ok('N12 replayed journal identical to trace ops', deepEq(rr.substrate.ops, trace.ops));
  ok('N13 validateTrace normalizes (fresh object)', validateTrace(trace) !== trace && validateTrace(trace).stateHash === EXPECT_HASH);
}

// ═══════════════════════════════ C-SEED ══════════════════════════════════
gateHeader('C-SEED — seed-capture ladder (Flag 2)');
{
  const b = Substrate.create({ w: 4, h: 3, seed: { kind: 'bytes', bytes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } });
  ok('D1 bytes → setBytes at 0',
    deepEq(b.ops, [{ op: 'setBytes', at: 0, x: 0, y: 0, w: 4, bytes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }]) && b.getByte(0, 0) === 1 && b.getByte(3, 2) === 12);
  const u = Substrate.create({ w: 4, h: 3, seed: { kind: 'uniform', tau: 3, d: 20 } });
  ok('D2 uniform → fillRect at 0',
    deepEq(u.ops, [{ op: 'fillRect', at: 0, x: 0, y: 0, w: 4, h: 3, tau: 3, d: 20 }]) && u.getByte(2, 1) === codec.pack(3, 20));
  const m = Substrate.create({ w: 4, h: 3, seed: { kind: 'mulberry32', seed: 77, tauFromRng: true, dFromRng: true } });
  ok('D3 mulberry32 → seedMulberry32 at 0',
    deepEq(m.ops, [{ op: 'seedMulberry32', at: 0, seed: 77, tauFromRng: true, dFromRng: true }]));
  const m2 = Substrate.create({ w: 4, h: 3, seed: { kind: 'mulberry32', seed: 77, tauFromRng: true, dFromRng: true } });
  ok('D4 mulberry32 seed is re-derivable', deepEq(Array.from(m.cells), Array.from(m2.cells)));
  const l = Substrate.create({ w: 3, h: 2, seed: { kind: 'legacyFn', fn: (x, y, i) => codec.pack((x + y) & 3, i) } });
  ok('D5 legacyFn → captured setBytes (runs ONCE)',
    deepEq(l.ops, [{ op: 'setBytes', at: 0, x: 0, y: 0, w: 3, bytes: [0, 65, 130, 67, 132, 197] }]));
  const e = Substrate.create({ w: 4, h: 4 });
  const e2 = Substrate.create({ w: 4, h: 4 });
  ok('D6 no seed → zero ops; empty seeds hash equal', e.ops.length === 0 && e.hash() === e2.hash() && e.hash() !== Substrate.create({ w: 4, h: 5 }).hash());
  ok('D7 legacyFn bad byte throws', errCode(() => Substrate.create({ w: 2, h: 1, seed: { kind: 'legacyFn', fn: () => 300 } })) === 'E_OP_BOUNDS');
  ok('D8 bytes wrong length throws', errCode(() => Substrate.create({ w: 2, h: 2, seed: { kind: 'bytes', bytes: [1, 2, 3] } })) === 'E_OP_SHAPE');
  ok('D9 unknown kind throws', errCode(() => Substrate.create({ w: 2, h: 2, seed: { kind: 'wat' } })) === 'E_OP_SHAPE');
}

// ═══════════════════════════════ C-I6 ════════════════════════════════════
gateHeader('C-I6 — every dynamics parameter is journaled');
{
  const sub = Substrate.create({ w: 8, h: 8, seed: { kind: 'mulberry32', seed: 9, tauFromRng: true, dFromRng: true } });
  ok('I1 sigma starts at DEFAULT_SIGMA', sub.sigma === DEFAULT_SIGMA);
  let setterThrew = false;
  try { sub.sigma = 9; } catch (err) { setterThrew = err instanceof TypeError; }
  ok('I2 sigma has no setter (assignment throws)', setterThrew && sub.sigma === DEFAULT_SIGMA);
  sub.inject({ op: 'setOptions', sigma: 5 });
  ok('I3 setOptions changes sigma + is journaled', sub.sigma === 5 && sub.ops[sub.ops.length - 1].op === 'setOptions' && sub.ops[sub.ops.length - 1].sigma === 5);
  // C3 σ-sweep recipe: each arm injects setOptions then runs — replays exactly.
  const arms = [1, 2.5, 5];
  const traces = arms.map((s) => {
    const a = Substrate.create({ w: 10, h: 8, seed: { kind: 'mulberry32', seed: 4242, tauFromRng: true, dFromRng: true } });
    a.inject({ op: 'setOptions', sigma: s });
    a.run(12);
    return a.trace();
  });
  ok('I4 σ-sweep arms replay exactly (C3 recipe)',
    traces.every((t) => replayTrace(t).matches) &&
    new Set(traces.map((t) => t.stateHash)).size === 3);
  // The OFF arm is a setOptions op too (G6 paired-arm recipe).
  const off = Substrate.create({ w: 10, h: 8, seed: { kind: 'mulberry32', seed: 4242, tauFromRng: true, dFromRng: true } });
  off.inject({ op: 'setOptions', wormholes: false });
  off.run(10);
  ok('I5 OFF arm (setOptions wormholes:false) replays exactly', replayTrace(off.trace()).matches);
}

// ═══════════════════════════════ C-AT ════════════════════════════════════
gateHeader('C-AT — boundary discipline (§4)');
{
  const sub = Substrate.create({ w: 4, h: 4 });
  sub.run(2);
  sub.inject({ op: 'setByte', x: 0, y: 0, c: 7 }); // at omitted → filled
  ok('A1 omitted at fills current ticks', sub.ops[sub.ops.length - 1].at === 2);
  ok('A2 at === ticks accepted', errCode(() => sub.inject({ op: 'setByte', x: 1, y: 0, c: 7, at: 2 })) === null);
  ok('A3 retro-injection refused', errCode(() => sub.inject({ op: 'setByte', x: 0, y: 0, c: 1, at: 0 })) === 'E_OP_AT');
  ok('A4 pre-queueing refused', errCode(() => sub.inject({ op: 'setByte', x: 0, y: 0, c: 1, at: 3 })) === 'E_OP_AT');
  // post-run ops at at === tickCount: journaled, hashed, never ticked after
  const before = sub.hash();
  sub.inject({ op: 'setByte', x: 3, y: 3, c: 255, at: 2 });
  const after = sub.hash();
  ok('A5 post-run op at at===tickCount affects hash', before !== after && replayTrace(sub.trace()).matches);
  // replay-side validation
  const good = sub.trace();
  const nonMono = JSON.parse(JSON.stringify(good));
  nonMono.ops = [{ op: 'setByte', x: 0, y: 0, c: 1, at: 1 }, { op: 'setByte', x: 1, y: 0, c: 1, at: 0 }];
  ok('A6 replay refuses non-monotonic log', errCode(() => replayTrace(nonMono)) === 'E_OP_AT');
  const beyond = JSON.parse(JSON.stringify(good));
  beyond.ops = [{ op: 'setByte', x: 0, y: 0, c: 1, at: 3 }]; // tickCount is 2
  ok('A7 replay refuses at > tickCount', errCode(() => replayTrace(beyond)) === 'E_OP_AT');
  const noAt = JSON.parse(JSON.stringify(good));
  delete noAt.ops[0].at;
  ok('A8 replay refuses missing at', errCode(() => replayTrace(noAt)) === 'E_OP_SHAPE');
}

// ═══════════════════════════════ C-HOSTILE ═══════════════════════════════
gateHeader('C-HOSTILE — validation hostility (§3)');
{
  const sub = Substrate.create({ w: 8, h: 8 }); // 8x8 grid
  const cases = [
    [{ op: 'nope', x: 0, y: 0 }, 'E_OP_UNKNOWN'],
    [{ op: 'setTau', x: 0, y: 0, tau: 4 }, 'E_OP_BOUNDS'],
    [{ op: 'setTau', x: 0, y: 0, tau: 1.5 }, 'E_OP_SHAPE'],
    [{ op: 'setTau', x: 0, y: 0 }, 'E_OP_SHAPE'],
    [{ op: 'setD', x: 0, y: 0, d: 64 }, 'E_OP_BOUNDS'],
    [{ op: 'setD', x: 0, y: 0, d: -1 }, 'E_OP_BOUNDS'],
    [{ op: 'setByte', x: 0, y: 0, c: 256 }, 'E_OP_BOUNDS'],
    [{ op: 'setCell', x: 0, y: 0 }, 'E_OP_SHAPE'],
    [{ op: 'setBytes', x: 7, y: 0, w: 2, bytes: [1, 2, 3, 4] }, 'E_OP_BOUNDS'],
    [{ op: 'setBytes', x: 0, y: 0, w: 3, bytes: [1, 2, 3, 4] }, 'E_OP_SHAPE'],
    [{ op: 'setBytes', x: 0, y: 0, w: 2, bytes: [0, 300] }, 'E_OP_BOUNDS'],
    [{ op: 'setBytes', x: 0, y: 0, w: 2, bytes: 'no' }, 'E_OP_SHAPE'],
    [{ op: 'fillRect', x: 0, y: 0, w: 4, h: 4, byte: 5, tau: 1, d: 2 }, 'E_OP_SHAPE'],
    [{ op: 'fillRect', x: 0, y: 0, w: 4, h: 4 }, 'E_OP_SHAPE'],
    [{ op: 'fillRect', x: 5, y: 5, w: 4, h: 4, byte: 0 }, 'E_OP_BOUNDS'],
    [{ op: 'seedMulberry32', seed: 2 ** 32, tauFromRng: true, dFromRng: true }, 'E_OP_BOUNDS'],
    [{ op: 'seedMulberry32', seed: 5, tauFromRng: 1, dFromRng: true }, 'E_OP_SHAPE'],
    [{ op: 'whWrite', slot: 64, x: 0, y: 0, resonance: 1 }, 'E_OP_BOUNDS'],
    [{ op: 'whWrite', slot: 1, x: 0, y: 0, resonance: -1 }, 'E_OP_BOUNDS'],
    [{ op: 'whWrite', slot: 1, x: 9, y: 0, resonance: 1 }, 'E_OP_BOUNDS'],
    [{ op: 'setOptions', sigma: NaN }, 'E_OP_SHAPE'],
    [{ op: 'setOptions', wormholes: 'yes' }, 'E_OP_SHAPE'],
    [{ op: 'setTau', x: 0, y: 0, tau: 1, extra: 1 }, 'E_OP_SHAPE'],
    [{ op: 'setTau', x: 0, y: 0, tau: undefined }, 'E_OP_SHAPE'],
  ];
  let good = 0;
  for (const [op, code] of cases) {
    const got = errCode(() => sub.inject(op));
    if (got === code) good++;
    else console.log(`    case ${op.op}: expected ${code}, got ${got}`);
  }
  ok('H1 24 bad-op cases throw exact codes', good === 24, `${good}/24`);
  // atomicity: a batch with one invalid op applies NOTHING
  const sub2 = Substrate.create({ w: 8, h: 8 });
  const opsBefore = sub2.ops.length;
  const planeBefore = sub2.copyCells();
  errCode(() => sub2.inject([{ op: 'setByte', x: 0, y: 0, c: 42 }, { op: 'setByte', x: 0, y: 0, c: 999 }]));
  ok('H2 batch atomicity (invalid op → nothing applied)',
    sub2.ops.length === opsBefore && deepEq(Array.from(planeBefore), Array.from(sub2.cells)) && sub2.getByte(0, 0) === 0);
  // direct table writes are validated + journaled (NaN is a TYPING violation →
  // E_OP_SHAPE per the validator's typing-first convention; the kernel
  // coerced it to 0 through Int32Array — C2/V6 — core refuses loudly)
  ok('H3 table.write NaN resonance refused', errCode(() => sub2.wormholes.write(0, 0, 0, NaN)) === 'E_OP_SHAPE');
  sub2.wormholes.write(3, 1, 1, 5);
  ok('H4 table.write is journaled as whWrite',
    deepEq(sub2.ops[sub2.ops.length - 1], { op: 'whWrite', at: 0, slot: 3, x: 1, y: 1, resonance: 5 }) &&
    deepEq(sub2.wormholes.read(3), { slot: 3, x: 1, y: 1, resonance: 5 }));
  ok('H5 table.read out-of-range throws', errCode(() => sub2.wormholes.read(64)) === 'E_OP_BOUNDS');
  // mulberry32 seed validation (PrngSeedError: TypeError + stable code)
  let prngOk = 0;
  for (const bad of [-1, 2 ** 32, 5.7]) {
    try { mulberry32(bad); } catch (e) { if (e instanceof TypeError && e instanceof PrngSeedError && e.code === 'E_CODEC_PRNG_SEED') prngOk++; }
  }
  ok('H6 mulberry32 refuses -1, 2^32, 5.7 (PrngSeedError)', prngOk === 3, `${prngOk}/3`);
  ok('H7 mulberry32(0) and mulberry32(2^32-1) are legal', mulberry32(0)() >= 0 && mulberry32(2 ** 32 - 1)() >= 0);
  // nothing masked: a valid op that WOULD have been masked by the kernel changes state visibly
  const sub3 = Substrate.create({ w: 2, h: 2 });
  sub3.inject({ op: 'setTau', x: 0, y: 0, tau: 3 });
  ok('H8 core state reflects exactly what was injected (no &3)', sub3.getByte(0, 0) === 192);
}

// ═══════════════════════════════ C-RTRIP ═════════════════════════════════
gateHeader('C-RTRIP — snapshot round-trip law');
{
  const mk = {
    plain: () => {
      const s = Substrate.create({ w: 12, h: 9, seed: { kind: 'mulberry32', seed: 1010, tauFromRng: true, dFromRng: true } });
      s.run(10);
      return s;
    },
    rich: () => {
      const s = Substrate.create({ w: 12, h: 9, seed: { kind: 'mulberry32', seed: 2020, tauFromRng: true, dFromRng: true } });
      s.run(5);
      s.inject([{ op: 'whWrite', slot: 20, x: 3, y: 3, resonance: 7 }, { op: 'setOptions', sigma: 2.5 }]);
      s.run(5);
      s.inject({ op: 'setOptions', wormholes: false });
      s.run(2);
      s.inject({ op: 'setOptions', wormholes: true });
      s.run(4);
      s.inject({ op: 'setByte', x: 11, y: 8, c: 200 }); // post-run
      return s;
    },
    empty: () => Substrate.create({ w: 4, h: 4 }),
  };
  let n = 0;
  for (const [name, build] of Object.entries(mk)) {
    const s = build();
    const snap = s.snapshot();
    const restored = Substrate.restore(snap);
    const cloneRestored = Substrate.restore(structuredClone(snap));
    const pass = restored.hash() === s.hash() && cloneRestored.hash() === s.hash() &&
      restored.ticks === s.ticks && restored.sigma === s.sigma &&
      deepEq(restored.wormholes.slots(), s.wormholes.slots()) &&
      restored.wormholes.totalWrites === s.wormholes.totalWrites;
    if (pass) n++;
    else console.log(`    scenario '${name}' failed round-trip`);
  }
  ok('R1 restore(snap).hash() === s.hash() (3 scenarios + structuredClone crossing)', n === 3, `${n}/3`);
  const s = mk.rich();
  const snap = s.snapshot();
  const badSigma = structuredClone(snap);
  badSigma.sigma = 9.9; // disagrees with the journal-derived σ
  ok('R2 tampered σ refused (journal-verified)', errCode(() => Substrate.restore(badSigma)) === 'E_SNAPSHOT_SHAPE');
  const badV = structuredClone(snap); badV.v = '2';
  ok('R3 wrong snapshot version refused', errCode(() => Substrate.restore(badV)) === 'E_SNAPSHOT_VERSION');
  const badStamps = structuredClone(snap); badStamps.kernelSchemaVersion = '0.0.9';
  ok('R4 wrong stamps refused', errCode(() => Substrate.restore(badStamps)) === 'E_SNAPSHOT_VERSION');
  const badCells = structuredClone(snap); badCells.cells = new Uint8Array(3);
  ok('R5 wrong cells shape refused', errCode(() => Substrate.restore(badCells)) === 'E_SNAPSHOT_SHAPE');
  ok('R6 restore is an alias of fromSnapshot', Substrate.restore(snap).hash() === Substrate.fromSnapshot(snap).hash());
  // restores continue living correctly (the handle is not a husk)
  const r = Substrate.restore(snap);
  const rEvents = r.run(3);
  const s2 = mk.rich();
  const s2Events = s2.run(3);
  ok('R7 restored substrate keeps ticking identically',
    r.hash() === s2.hash() && deepEq(rEvents, s2Events), 'hash + per-tick events over 3 further ticks');
}

// ═══════════════════════════════ C-REPLAY ════════════════════════════════
gateHeader('C-REPLAY — replay = determinism (priced half)');
{
  const driveScenario = () => {
    // drives the 19-tick scenario while recording the per-tick event stream
    const perTick = [];
    const s = Substrate.create({ w: 12, h: 9, seed: { kind: 'mulberry32', seed: 424242, tauFromRng: true, dFromRng: true } });
    perTick.push(...s.run(5));
    s.inject({ op: 'whWrite', slot: 20, x: 3, y: 3, resonance: 7 });
    s.inject([
      { op: 'setTau', x: 0, y: 0, tau: 3 },
      { op: 'setD', x: 0, y: 0, d: 20 },
      { op: 'fillRect', x: 8, y: 6, w: 4, h: 3, tau: 1, d: 30 },
    ]);
    perTick.push(...s.run(5));
    s.inject({ op: 'setOptions', sigma: 2.5 });
    perTick.push(...s.run(3));
    s.inject({ op: 'setOptions', wormholes: false });
    perTick.push(...s.run(2));
    s.inject({ op: 'setOptions', wormholes: true });
    perTick.push(...s.run(4));
    s.inject({ op: 'setByte', x: 11, y: 8, c: 200 });
    return { s, perTick };
  };
  const { s, perTick: liveRun } = driveScenario();
  const trace = s.trace(); // 19 ticks, 9 ops (1 seed + 1 whWrite + 3 writes + 3 setOptions + 1 post-run)
  ok('P1 scenario has 19 ticks + 9 ops', trace.tickCount === 19 && trace.ops.length === 9);
  const rr = replayTrace(trace);
  ok('P2 replay matches (hash + journal)', rr.matches && rr.hash === trace.stateHash && deepEq(rr.substrate.ops, trace.ops));
  ok('P3 eventsByTick identical to live per-tick streams', deepEq(rr.eventsByTick, liveRun));
  const json = JSON.parse(JSON.stringify(trace));
  ok('P4 JSON round-trip of the trace replays identically', replayTrace(json).matches && replayTrace(json).hash === trace.stateHash);
  ok('P5 hashTrace === stateHash on the honest trace', hashTrace(trace) === trace.stateHash);
  // tampering: ops → replay hash mismatch; views → hashTrace mismatch (physics honest)
  const tamperedOps = JSON.parse(JSON.stringify(trace));
  tamperedOps.ops = tamperedOps.ops.filter((o) => !(o.op === 'setD' && o.d === 20));
  ok('P6 tampered op-log → E_REPLAY_HASH', errCode(() => replayTrace(tamperedOps)) === 'E_REPLAY_HASH');
  const tamperedView = JSON.parse(JSON.stringify(trace));
  tamperedView.cellsHex = tamperedView.cellsHex.slice(0, -2) + 'ff';
  ok('P7 tampered cellsHex → hashTrace detects, replay still matches (different guards)',
    hashTrace(tamperedView) !== trace.stateHash && replayTrace(tamperedView).matches === true);
  const tamperedSeal = JSON.parse(JSON.stringify(trace));
  tamperedSeal.stateHash = 'qth1:' + '0'.repeat(64);
  ok('P8 tampered stateHash → E_REPLAY_HASH', errCode(() => replayTrace(tamperedSeal)) === 'E_REPLAY_HASH');
  const unknownOp = JSON.parse(JSON.stringify(trace));
  unknownOp.ops[0] = { op: 'teleport', at: 0, x: 0, y: 0 };
  ok('P9 unknown op in trace → E_OP_UNKNOWN', errCode(() => replayTrace(unknownOp)) === 'E_OP_UNKNOWN');
  const wrongStamps = JSON.parse(JSON.stringify(trace));
  wrongStamps.kernelSchemaVersion = '0.0.1';
  ok('P10 wrong stamps → E_REPLAY_VERSION', errCode(() => replayTrace(wrongStamps)) === 'E_REPLAY_VERSION');
  const probing = replayTrace(tamperedOps, { expectMatch: false });
  ok('P11 expectMatch:false returns matches:false without throwing', probing.matches === false);
  ok('P12 replay twice → identical results', deepEq(replayTrace(trace).eventsByTick, replayTrace(trace).eventsByTick));
}

// ═══════════════════════════════ C-DIFF ══════════════════════════════════
gateHeader('C-DIFF — engine-vs-kernel differential (physics equality)');
{
  const rng = mulberry32(20261103);
  let identical = 0;
  const cases = 25;
  for (let ci = 0; ci < cases; ci++) {
    const W = 5 + Math.floor(rng() * 20);
    const H = 5 + Math.floor(rng() * 20);
    const seedBytes = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) seedBytes[i] = Math.floor(rng() * 256);
    const k = kernel.makeSubstrate(W, H, (x, y, i) => seedBytes[i]);
    const e = Substrate.create({ w: W, h: H, seed: { kind: 'bytes', bytes: seedBytes } });
    // the engine's events carry the 1-based `tick` field the kernel's do not —
    // strip BOTH sides to the common shape before comparing
    const strip = (ev) => ev.map(({ kind, x, y, slot, resonance, term }) => ({ kind, x, y, slot, resonance, term }));
    let tickOk = true;
    for (let t = 0; t < 30; t++) {
      kernel.tick(k, {}); // kernel tick() returns the SUBSTRATE (R6 mutate-and-return)
      const kev = k.lastEvents; // events live here in the kernel API
      const eev = e.tick(); // engine tick() returns THIS TICK'S EVENTS (I4)
      if (JSON.stringify(Array.from(k)) !== JSON.stringify(Array.from(e.cells)) || !deepEq(strip(kev), strip(eev))) {
        tickOk = false; break;
      }
    }
    const kTable = (k.__wormholes ? k.__wormholes.snapshot() : []).filter(Boolean).map((s) => [s.slot, s.x, s.y, s.resonance]);
    const eTable = e.wormholes.slots().map((s) => [s.slot, s.x, s.y, s.resonance]);
    if (!tickOk || !deepEq(kTable, eTable) || k.__wormholes.totalWrites !== e.wormholes.totalWrites) {
      console.log(`    case ${ci} (${W}x${H}) diverged`);
    } else identical++;
  }
  ok('F1 25/25 random substrates byte-identical over 30 ticks', identical === cases, `${identical}/${cases} (planes, events, table, totalWrites)`);

  // OFF arm: kernel per-tick {wormholes:false} vs engine setOptions sticky
  {
    const W = 16, H = 12, N = 40;
    const seedBytes = new Uint8Array(W * H);
    const r2 = mulberry32(555);
    for (let i = 0; i < W * H; i++) seedBytes[i] = Math.floor(r2() * 256);
    const k = kernel.makeSubstrate(W, H, (x, y, i) => seedBytes[i]);
    for (let t = 0; t < N; t++) kernel.tick(k, { wormholes: false });
    const e = Substrate.create({ w: W, h: H, seed: { kind: 'bytes', bytes: seedBytes } });
    e.inject({ op: 'setOptions', wormholes: false });
    e.run(N);
    ok('F2 OFF arm identical (kernel per-tick opts vs engine sticky)',
      deepEq(Array.from(k), Array.from(e.cells)) && e.wormholes.occupiedCount() === 0);
  }

  // σ arm: kernel per-tick {sigma:5} vs engine setOptions sigma 5
  {
    const W = 16, H = 12, N = 40;
    const seedBytes = new Uint8Array(W * H);
    const r3 = mulberry32(777);
    for (let i = 0; i < W * H; i++) seedBytes[i] = Math.floor(r3() * 256);
    const k = kernel.makeSubstrate(W, H, (x, y, i) => seedBytes[i]);
    for (let t = 0; t < N; t++) kernel.tick(k, { sigma: 5 });
    const kLast = k.lastEvents; // kernel events ride the substrate (R6), not the return
    const e = Substrate.create({ w: W, h: H, seed: { kind: 'bytes', bytes: seedBytes } });
    e.inject({ op: 'setOptions', sigma: 5 });
    const eLast = e.run(N).at(-1);
    const strip = (ev) => ev.map(({ kind, x, y, slot, resonance, term }) => ({ kind, x, y, slot, resonance, term }));
    ok('F3 σ=5 arm identical (sticky setOptions ≡ kernel per-tick σ, sans the F1 leak)',
      deepEq(Array.from(k), Array.from(e.cells)) && deepEq(strip(kLast), strip(eLast)));
  }

  // whWrite schedule: pre-seeded wormholes drive identical twin dynamics
  {
    const W = 10, H = 10, N = 20;
    const seedBytes = new Uint8Array(W * H);
    const r4 = mulberry32(999);
    for (let i = 0; i < W * H; i++) seedBytes[i] = Math.floor(r4() * 256);
    const k = kernel.makeSubstrate(W, H, (x, y, i) => seedBytes[i]);
    const kTable = new kernel.WormholeTable(kernel.DEFAULT_SIGMA);
    kTable.write(20, 4, 4, 3); kTable.write(30, 7, 2, 5);
    for (let t = 0; t < N; t++) kernel.tick(k, { table: kTable });
    const e = Substrate.create({ w: W, h: H, seed: { kind: 'bytes', bytes: seedBytes } });
    e.inject([{ op: 'whWrite', slot: 20, x: 4, y: 4, resonance: 3 }, { op: 'whWrite', slot: 30, x: 7, y: 2, resonance: 5 }]);
    e.run(N);
    // compare final planes + the explicitly-written slots (the shared table's
    // occupancy after physics is engine-owned but the physics writes must agree)
    const kOcc = kTable.snapshot().filter(Boolean).map((s) => [s.slot, s.x, s.y, s.resonance]);
    const eOcc = e.wormholes.slots().map((s) => [s.slot, s.x, s.y, s.resonance]);
    ok('F4 whWrite schedule identical (planes + table + replay)',
      deepEq(Array.from(k), Array.from(e.cells)) && deepEq(kOcc, eOcc) && replayTrace(e.trace()).matches);
  }
}

// ═══════════════════════════════ C-COMPAT ════════════════════════════════
gateHeader('C-COMPAT — compat is the kernel, frozen');
{
  const shared = ['TAU', 'D_MAX', 'PSI', 'psi', 'pack', 'unpack', 'tauOf', 'dOf', 'vectorPass',
    'SLOT_COUNT', 'DEFAULT_SIGMA', 'makeSubstrate', 'tick', 'traceView', 'nextD', 'mulberry32', 'WormholeTable'];
  let same = 0;
  for (const name of shared) {
    if (/** @type {any} */ (compat)[name] === /** @type {any} */ (kernel)[name]) same++;
    else console.log(`    export '${name}' diverged`);
  }
  ok('M1 compat exports are kernel identity (17/17)', same === 17, `${same}/17`);
  ok('M2 LegacyWormholeTable is the kernel class', compat.LegacyWormholeTable === kernel.WormholeTable);
  ok('M3 frozen defect: pack masks (C2/V4)', compat.pack(7, 100) === compat.pack(3, 36) && compat.pack(3, 36) === 228);
  ok('M4 frozen defect: mulberry32 wraps (C2/V3)',
    compat.mulberry32(2 ** 32 + 5)() === compat.mulberry32(5)() && compat.mulberry32(-1)() === compat.mulberry32(2 ** 32 - 1)());
  ok('M5 frozen defect: psi masks', compat.psi(7) === compat.psi(3) && compat.psi(7) === 'i');
  // engine nextD is kernel nextD behavior (same rule table)
  let nextDAgree = true;
  for (const d of [0, 1, 31, 62, 63]) for (const p of [-504, -1, -0.5, 0, 0.5, 1, 504]) {
    if (nextD(d, p) !== compat.nextD(d, p)) nextDAgree = false;
  }
  ok('M6 engine nextD ≡ kernel nextD', nextDAgree);
}

// ═════════════════════ summary ═══════════════════════════════════════════
console.log(`\n${'═'.repeat(72)}`);
if (fails === 0) {
  console.log(`@qthe/core v0 gate run: ALL PASS — ${checks} checks across 12 gates`);
  console.log('  priced here: single-writer same-build op-log replay (the RC-05 priced half).');
  console.log('  still unpriced: cross-implementation multi-writer op-logs (falsification-bench P1).');
} else {
  console.log(`@qthe/core v0 gate run: ${fails} FAILED of ${checks} checks`);
  for (const n of failedNames) console.log(`  FAIL: ${n}`);
}
process.exit(fails === 0 ? 0 : 1);
