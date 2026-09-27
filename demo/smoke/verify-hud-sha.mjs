// demo/smoke/verify-hud-sha.mjs — 34-c window-smith: an independent Node reader
// for the A2UI HUD. The browser shows "sha256 <hex>" of the live substrate at
// tick T; this script replays the SAME trajectory (same kernel qthe.mjs, same
// demo seed, same wormhole table semantics) in Node and checks the pair
// TICK:SHA — determinism verified from OUTSIDE the browser, across runtimes.
//
// Seed replicated byte-for-byte from demo/a2ui.mjs seed('ring') (lines 25-35)
// and the frame() loop's tick call: tick(sub, { wormholes: true, table }) with
// a fresh WormholeTable per seed — the exact state a page reload produces.
//
// Usage:
//   node verify-hud-sha.mjs                  → prints trajectory table
//                                               (ticks 0..8, then sampled)
//   node verify-hud-sha.mjs 421:bfed2e44...  → exit 0 iff every pair matches
//
// Also re-receipts G0 here: demo/sha256.mjs == node:crypto sha256 on the
// exact byte plane the HUD hashes.

import { makeSubstrate, tick, WormholeTable, pack, TAU } from '../../qthe.mjs';
import { sha256Bytes } from '../sha256.mjs';
import crypto from 'node:crypto';

const W = 96, H = 64;

// ── seed('ring') from demo/a2ui.mjs — kept byte-identical to the demo ──────
function ringSeed() {
  return makeSubstrate(W, H, (x, y) => {
    const dx = x - W / 2, dy = y - H / 2, r = Math.max(Math.abs(dx), Math.abs(dy));
    if (r === 14) return pack(TAU.ATTRACT, 50);
    if (r === 15) return pack(TAU.REPEL, 30);
    if (r < 14 && (x === 40 || x === 56) && (y === 22 || y === 42))
      return pack(TAU.ABSTAIN, 40);
    return pack(TAU.GROUND, 8);
  });
}

// ── one trajectory = one page load: fresh substrate + fresh table, ON ──────
function trajectory(ticks) {
  const sub = ringSeed();
  const table = new WormholeTable();          // as seed() does
  const shas = [sha256Bytes(sub)];            // tick 0 = the raw seed plane
  for (let i = 0; i < ticks; i++) {
    tick(sub, { wormholes: true, table });    // as frame() does, ON arm
    shas.push(sha256Bytes(sub));
  }
  return shas;
}

const N = 600;
const shas = trajectory(N);

// G0 re-receipt in THIS runtime: the demo's pure-JS hash == node:crypto
const seedPlane = ringSeed();
const js = sha256Bytes(seedPlane);
const node = crypto.createHash('sha256').update(seedPlane).digest('hex');
console.log(`G0-in-node: demo/sha256.mjs ${js}`);
console.log(`G0-in-node: node:crypto    ${node} ${js === node ? 'MATCH' : 'MISMATCH'}`);

// where does the ring trajectory stop changing? (the frozen-HUD question)
let freeze = null;
for (let t = 1; t <= N; t++) if (shas[t] === shas[t - 1]) { freeze = t; break; }
console.log(`trajectory: ${N + 1} ticks; sha(tick0)=${shas[0].slice(0, 16)}…; freeze at ${freeze === null ? `none in 0..${N}` : `tick ${freeze}`}`);
console.log(`early shas: t1=${shas[1].slice(0, 16)}… t2=${shas[2].slice(0, 16)}… t3=${shas[3].slice(0, 16)}… t4=${shas[4].slice(0, 16)}…`);

// pair checks against the browser HUD
const pairs = process.argv.slice(2);
if (pairs.length) {
  let ok = true;
  for (const p of pairs) {
    const m = p.match(/^(\d+):([0-9a-f]{64})$/);
    if (!m) { console.error(`BAD ARG ${p} (want TICK:64hex)`); process.exit(2); }
    const t = Number(m[1]);
    if (t > N) { console.error(`tick ${t} beyond simulated ${N}`); process.exit(2); }
    const match = shas[t] === m[2];
    ok = ok && match;
    console.log(`browser pair tick ${t}: ${match ? 'MATCH' : `MISMATCH (node ${shas[t]})`}`);
  }
  process.exit(ok ? 0 : 1);
}
