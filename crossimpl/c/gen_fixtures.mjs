// crossimpl/c/gen_fixtures.mjs — ORCH-7: generate the conformance fixture
// battery from the REAL kernels (qthe.mjs float plane + qthe_fixed.mjs R8
// plane). The C port must reproduce every hash, event tuple, and term BIT.
// Sigma travels as IEEE754 bit patterns (16 hex chars) — the C side never
// calls libm, so no platform log2 disagreement is possible.
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as FLOAT from '../../experiments/_adapter.mjs';
import * as FIXED from '../../fixedpoint/qthe_fixed.mjs';
import { planeHash, plantTwinPairs, plantWeather, seedFnFrom } from '../../experiments/_harness.mjs';
import { createHash } from 'node:crypto';

await FLOAT.loadKernel();
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'fixtures.txt');

const bits = (d) => { const b = new Float64Array([d]); return new BigUint64Array(b.buffer)[0].toString(16).padStart(16, '0'); };
const packB = (tau, d) => ((tau & 3) << 6) | (d & 63);
const lines = ['QTHEFIX 1'];

// ── vectorPass battery ─────────────────────────────────────────────────────
function rngOf(seed) { return FLOAT.mulberry32(seed); }
{
  const rng = rngOf(0x5EED34E);
  const specs = [[4, 6], [8, 3], [1, 1], [5, 5]];
  for (const [rows, cols] of specs) {
    const weights = [];
    for (let i = 0; i < rows * cols; i++) weights.push(Math.floor(rng() * 256));
    const xs = [];
    for (let i = 0; i < cols; i++) xs.push(Math.floor(rng() * 200) - 100);
    const out = (await import('../../qthe.mjs')).vectorPass(
      Array.from({ length: rows }, (_, j) => weights.slice(j * cols, (j + 1) * cols)), xs);
    lines.push(`VEC v${rows}x${cols} ${rows} ${cols}`);
    lines.push(`W ${weights.map((b) => b.toString(16).padStart(2, '0')).join('')}`);
    lines.push(`X ${xs.join(',')}`);
    lines.push(`OUT ${out.map((o) => o.re).join(',')}|${out.map((o) => o.im).join(',')}`);
  }
}

// ── substrate battery ─────────────────────────────────────────────────────
function runCase(id, w, h, seedFn, T, mode, wormholes, sigmaSpec) {
  // mode: 'float' | 'fixed'; sigmaSpec: {kind:'default'} | {kind:'bits', hex} | {kind:'q', hex}
  let sub = mode === 'float' ? FLOAT.makeSubstrate(w, h, seedFn) : FIXED.makeSubstrate(w, h, seedFn);
  const events = [];
  const init = Uint8Array.from(sub);
  for (let t = 1; t <= T; t++) {
    let opts;
    if (mode === 'float') {
      opts = { wormholes };
      if (sigmaSpec.kind === 'bits') opts.sigma = bitsToDouble(sigmaSpec.hex);
    } else {
      opts = { wormholes };
      if (sigmaSpec.kind === 'q') opts.sigmaQ = BigInt('0x' + sigmaSpec.hex);
    }
    sub = mode === 'float' ? FLOAT.tick(sub, opts) : FIXED.tick(sub, opts);
    for (const ev of sub.lastEvents ?? []) {
      events.push({ t, x: ev.x, y: ev.y, slot: ev.slot, resonance: ev.resonance, termHex: mode === 'float' ? bits(ev.term) : null, termQ: mode === 'fixed' ? String(ev.term) : null });
    }
  }
  const hash = planeHash(sub, T, (s) => (s instanceof Uint8Array ? s : s));
  lines.push(`CASE ${id} ${w} ${h} ${T} ${mode} ${wormholes ? 1 : 0} ${sigmaSpec.kind} ${sigmaSpec.hex ?? '-'}`);
  lines.push(`PLANE ${Array.from(init).map((b) => b.toString(16).padStart(2, '0')).join('')}`);
  lines.push(`EVENTS ${events.length}`);
  for (const e of events) lines.push(`E ${e.t} ${e.x} ${e.y} ${e.slot} ${e.resonance} ${e.termHex ?? e.termQ}`);
  lines.push(`HASH ${hash}`);
  lines.push('END');
  console.log(`[fixtures] ${id}: events=${events.length} hash=${hash.slice(0, 12)}…`);
}
function bitsToDouble(hex) { const u = new BigUint64Array(1); u[0] = BigInt('0x' + hex); return new Float64Array(u.buffer)[0]; }

const LOG2_3 = bits(Math.log2(3));
const TWO_THIRDS = bits(2 / 3);
const EIGHT_FIFTHS = bits(1.6);

// twin-delivery class (E-Q1 planting, fresh seed family)
{
  const rng = rngOf(33001);
  const pairs = plantTwinPairs(rng, 8, 64, 64, {});
  const weather = plantWeather(rng, pairs, 64, 64, {});
  const seedFn = seedFnFrom(pairs, weather);
  runCase('c1_twin_on_default', 64, 64, seedFn, 200, 'float', true, { kind: 'default', hex: LOG2_3 });
  runCase('c2_twin_off', 64, 64, seedFn, 200, 'float', false, { kind: 'default', hex: LOG2_3 });
}
// random substrates (P-B3 style — hits the coupled families at 2/3)
runCase('c3_rand23', 24, 16, randSeedFn(34001), 20, 'float', true, { kind: 'bits', hex: TWO_THIRDS });
runCase('c4_rand_default', 24, 16, randSeedFn(34001), 20, 'float', true, { kind: 'default', hex: LOG2_3 });
// checkerboard cascade
runCase('c5_checker', 64, 64, (x, y) => (x === 32 && y === 32 ? packB(2, 32) : ((x + y) % 2 === 0 ? packB(1, 32) : packB(2, 32))), 64, 'float', true, { kind: 'default', hex: LOG2_3 });
// sigma sweep arms
runCase('c6_rand_sigma05', 32, 32, randSeedFn(4242), 100, 'float', true, { kind: 'bits', hex: bits(0.5) });
runCase('c11_rand_sigma4', 16, 16, randSeedFn(99), 50, 'float', true, { kind: 'bits', hex: bits(4) });
// cooker mini (all-Abstain d=0, LWW cascade)
runCase('c7_cooker', 8, 8, () => packB(3, 0), 32, 'float', true, { kind: 'default', hex: LOG2_3 });
// E-Q8 same-slot boards (the float-only artifact sites)
runCase('c8_eq8_23', 6, 3, eq8Board(), 16, 'float', true, { kind: 'bits', hex: TWO_THIRDS });
runCase('c9_eq8_85', 6, 3, eq8Board(), 16, 'float', true, { kind: 'bits', hex: EIGHT_FIFTHS });
// fresh twin family
{
  const rng = rngOf(66001);
  const pairs = plantTwinPairs(rng, 8, 64, 64, {});
  const weather = plantWeather(rng, pairs, 64, 64, {});
  runCase('c10_twin66001', 64, 64, seedFnFrom(pairs, weather), 50, 'float', true, { kind: 'default', hex: LOG2_3 });
}
// handcrafted mixed
runCase('c12_mixed', 10, 10, mixedSeedFn(), 40, 'float', true, { kind: 'bits', hex: bits(1) });

// ── fixed-plane battery (R8) ───────────────────────────────────────────────
runCase('f1_rand23_fixed', 24, 16, randSeedFn(34001), 20, 'fixed', true, { kind: 'q', hex: '2863311531' });
runCase('f2_rand_default_fixed', 24, 16, randSeedFn(34001), 20, 'fixed', true, { kind: 'q', hex: '6807362106' });
runCase('f3_eq8_23_fixed', 6, 3, eq8Board(), 16, 'fixed', true, { kind: 'q', hex: '2863311531' });

function randSeedFn(seed) {
  const rng = rngOf(seed);
  return () => Math.floor(rng() * 256);
}
function eq8Board() {
  // E-Q8 verbatim: A(1,1) and B(2,1) Abstain d=20; Repel tuners P_A(0,1) d=1,
  // P_B(3,1) d=3 (acc(B) = -8 needs 8 total: per E-Q8 registration the
  // tuners set reader acc; here we reproduce the 2/3 family with acc(B)=-2:
  // P_B(3,1) Repel d=2), rest Ground d=0 rail.
  return (x, y) => {
    if (x === 1 && y === 1) return packB(3, 20);
    if (x === 2 && y === 1) return packB(3, 20);
    if (x === 3 && y === 1) return packB(2, 2);
    if (x === 0 && y === 1) return packB(2, 1);
    return 0;
  };
}
function mixedSeedFn() {
  const rng = rngOf(777);
  return (x, y) => {
    const r = rng();
    if (r < 0.4) return 0;
    if (r < 0.6) return packB(1, Math.floor(rng() * 64));
    if (r < 0.8) return packB(2, Math.floor(rng() * 64));
    return packB(3, Math.floor(rng() * 64));
  };
}

writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
const sha = createHash('sha256').update(readFileSync(OUT)).digest('hex');
console.log(`[fixtures] wrote ${OUT} :: sha256 ${sha}`);
