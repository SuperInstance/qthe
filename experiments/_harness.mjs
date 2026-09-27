// experiments/_harness.mjs — shared discipline for lane 33-b (field-smith):
// stone-v1 chain append with verify-from-disk (refuse-if-broken), canonical
// plane hashing, deterministic planting helpers shared by E-Q1/E-Q2/E-Q5.
//
// HOUSE LAWS HONORED HERE:
//  - a receipt without a chain is a rumor: every append re-verifies the whole
//    chain FROM DISK and refuses loudly on any break;
//  - no wall-clock, no Math.random, no BigInts, no floats inside hashed chain
//    content (floats ride as receipted strings);
//  - hash is the last write to a row (stone sealChain is the last toucher);
//  - JSON.stringify only for .jsonl rows, never pretty-printed.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export function sha256HexStr(s) { return createHash('sha256').update(s, 'utf8').digest('hex'); }
export function fileSha256(path) { return sha256HexStr(readFileSync(path, 'utf8')); }

// Canonical plane hash: sha256 over "w x h@tick=<t>:<hex of byte plane>".
// The imaginary plane is NEVER hashed (floats) — it rides in outputs as strings.
export function planeHash(sub, t, bytePlaneFn) {
  const bytes = bytePlaneFn(sub);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return sha256HexStr(`${sub.w}x${sub.h}@t=${t}:${hex}`);
}

// num → chain-safe value: exact integers stay numbers, everything else a string
export function q(v) {
  if (Number.isInteger(v)) return v;
  return String(v);
}

// ---------------------------------------------------------------------------
// stone-v1 chain appender with verify-from-disk (refuse-if-broken).
// rows: array of UNSEALED payload rows (kind + fields, no row_hash).
// The header (stone.header) is created once as row 0 on first append.
// ---------------------------------------------------------------------------
export async function appendAndVerify(stone, chainPath, rows, headerMeta) {
  const lines = [];
  if (existsSync(chainPath)) {
    const text = readFileSync(chainPath, 'utf8');
    for (const line of text.split('\n')) {
      const s = line.trim();
      if (s !== '') lines.push(s);
    }
  }
  const parsed = lines.map((l) => JSON.parse(l));
  if (parsed.length === 0) {
    parsed.push({
      kind: 'stone.header',
      alg: 'stone-v1',
      genesis: 'STONE-GENESIS-1',
      repo: 'SuperInstance/qthe',
      lane: '33-b field-smith',
      owns: 'experiments/ receipts/',
      ...headerMeta,
    });
  }
  for (const r of rows) parsed.push(r);
  stone.sealChain(parsed, undefined, { alg: 'stone-v1' });
  const body = parsed.map((r) => JSON.stringify(r)).join('\n') + '\n';
  writeFileSync(chainPath, body, 'utf8');
  const verdict = stone.verifyChainFile(chainPath); // verify FROM DISK, not memory
  if (!verdict.ok) {
    throw new Error(`CHAIN BROKEN after append to ${chainPath}: ${verdict.why} at index ${verdict.firstBadIndex} — refusing to continue (refuse-if-broken law)`);
  }
  return verdict;
}

// ---------------------------------------------------------------------------
// Planting helpers (deterministic; rng comes from the kernel's mulberry32).
// GEOMETRY NOTE (adapted to the landed kernel, R1 TOROIDAL edges): separation
// constraints are enforced on TOROIDAL Chebyshev distance min(|dx|, w-|dx|),
// so "distant" means distant on the actual manifold the tick couples through.
// ---------------------------------------------------------------------------
export function packByte(tau, d) { return ((tau & 3) << 6) | (d & 0x3f); }

export function torCheb(a, b, w = 64, h = 64) {
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  return Math.max(Math.min(dx, w - dx), Math.min(dy, h - dy));
}

// Rejection-sample K twin-Abstain pairs: per-pair distinct d, members >= 24
// apart (toroidal Chebyshev), all placed cells >= crossSep from each other.
// Fails LOUDLY (no silent redesign) if placement is impossible in budget.
export function plantTwinPairs(rng, K, w, h, { dMin = 8, dMax = 15, minPairSep = 24, minCrossSep = 8, maxAttempts = 20000 } = {}) {
  if (K > dMax - dMin + 1) throw new Error('plantTwinPairs: K exceeds distinct d budget');
  const ds = [];
  for (let d = dMin; ds.length < K && d <= dMax; d++) ds.push(d);
  const placed = [];
  const pairs = [];
  for (let i = 0; i < K; i++) {
    const a = sampleFar(rng, placed, minCrossSep, w, h, maxAttempts);
    placed.push(a);
    const b = sampleFar(rng, placed, minCrossSep, w, h, maxAttempts, { awayFrom: [{ p: a, sep: minPairSep }] });
    placed.push(b);
    pairs.push({ pairId: i, d: ds[i], a, b });
  }
  return pairs;
}

function sampleFar(rng, placed, sep, w, h, maxAttempts, extra = {}) {
  for (let n = 0; n < maxAttempts; n++) {
    const p = { x: Math.floor(rng() * w), y: Math.floor(rng() * h) };
    if (placed.some((q0) => torCheb(p, q0, w, h) < sep)) continue;
    if (extra.awayFrom && extra.awayFrom.some(({ p: q0, sep: s }) => torCheb(p, q0, w, h) < s)) continue;
    return p;
  }
  throw new Error(`sampleFar: placement budget (${maxAttempts}) exhausted — registration geometry infeasible, LOUD failure`);
}

// 'Weather' cells (non-Abstain activity so byte planes evolve and determinism
// hashes are non-trivial): 2x Attract (d=40,41), 1x Repel (d=30), kept >= 10
// from every pair member and >= 4 from each other.
export function plantWeather(rng, pairs, w, h, { awayFromPairs = 10, mutual = 4, maxAttempts = 20000 } = {}) {
  const forbidden = [];
  for (const p of pairs) { forbidden.push({ p: p.a, sep: awayFromPairs }); forbidden.push({ p: p.b, sep: awayFromPairs }); }
  const placed = [];
  const out = [];
  const specs = [{ tau: 1, d: 40 }, { tau: 1, d: 41 }, { tau: 2, d: 30 }];
  for (const s of specs) {
    let ok = false;
    for (let n = 0; n < maxAttempts && !ok; n++) {
      const p = { x: Math.floor(rng() * w), y: Math.floor(rng() * h) };
      if (forbidden.some(({ p: q0, sep }) => torCheb(p, q0, w, h) < sep)) continue;
      if (placed.some((q0) => torCheb(p, q0, w, h) < mutual)) continue;
      placed.push(p);
      out.push({ x: p.x, y: p.y, byte: packByte(s.tau, s.d), tau: s.tau, d: s.d });
      ok = true;
    }
    if (!ok) throw new Error('plantWeather: budget exhausted — LOUD failure');
  }
  return out;
}

// seedFn in the KERNEL's signature (i, x, y) [R5]. Key y*4096+x is unique for
// 64x64 (x < 64 < 4096).
export function seedFnFrom(pairs, weather) {
  const map = new Map();
  for (const p of pairs) { map.set(p.a.y * 4096 + p.a.x, packByte(3, p.d)); map.set(p.b.y * 4096 + p.b.x, packByte(3, p.d)); }
  for (const c of weather) map.set(c.y * 4096 + c.x, c.byte);
  return (i, x, y) => map.get(y * 4096 + x) ?? 0;
}
