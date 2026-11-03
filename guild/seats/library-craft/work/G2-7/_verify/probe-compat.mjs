// G2-7 probe re-run — receipts cited in api-surface-v0.1.d.ts / CRITIQUE.md,
// re-verified against the fetched kernel (main, 265 lines) before typing them.
import * as K from '../_kernel-reference.mjs';

// V1 — which expandos survive structuredClone?
const sub = K.makeSubstrate(4, 4, (x, y, i) => K.pack((x + y) & 3, (x * 5 + y * 3) & 63));
K.tick(sub);
const clone = structuredClone(sub);
console.log('V1 structuredClone expandos:');
for (const k of ['w', 'h', 'ticks', '__wormholes', '__scratch', 'lastEvents']) {
  console.log(`  clone.${k} =`, clone[k]);
}
console.log('  clone.bytes === clone :', clone.bytes === clone);
console.log('  clone.bytes === sub   :', clone.bytes === sub);
try { K.tick(clone); } catch (e) { console.log('  tick(cloned) throws:', e.message); }

// V2 — JSON.stringify circularity
try { JSON.stringify(sub); } catch (e) { console.log('V2 JSON.stringify throws:', e.message); }

// V3 — mulberry32 seed aliasing (the G1-2 finding, re-run)
const a = K.mulberry32(2 ** 32 + 5), b = K.mulberry32(5);
console.log('V3 mulberry32(2**32+5)() === mulberry32(5)() :', a() === b(), '→', a());

// V3b — negative + non-integer seeds also alias silently (no throw anywhere)
const c = K.mulberry32(-1), d = K.mulberry32(2 ** 32 - 1);
console.log('V3b mulberry32(-1)() === mulberry32(2**32-1)() :', c() === d());
const e2 = K.mulberry32(5.7);
console.log('V3c mulberry32(5.7) accepts non-integer, first draw:', e2());

// V5 — one-tick sigma leak into the lazy table (F1)
const s2 = K.makeSubstrate(2, 2, () => K.pack(3, 30)); // lone Abstain, d=30
K.tick(s2, { sigma: 5 });
const sigmaAfter = s2.__wormholes ? s2.__wormholes.sigma : 'no-table';
K.tick(s2, {}); // option-less tick
console.log('V5 table.sigma after tick({sigma:5}) then tick({}):', sigmaAfter,
  '| table exists:', s2.__wormholes instanceof K.WormholeTable);

// F4 — seedFn argument order (doc comment says (i,x,y); code calls (x,y,i))
const seen = [];
K.makeSubstrate(3, 1, (p, q, r) => { seen.push([p, q, r]); return 0; });
console.log('V8 seedFn observed arg tuples (first 3):', JSON.stringify(seen.slice(0, 3)));
