// experiments/e_q14_b3_autopsy.mjs — autopsy probe for E-Q14 family B,
// floor B3 (FIRED, standing): at nPoll=0 the pollution fraction is ~94%.
// This probe dumps per-tick per-member dynamics for one zero-pollution
// trial (seed 77001) and pins the mechanism. Findings (see the autopsy row
// appended to receipts/e_q14_chain.jsonl):
//   1. t=1: all 8 pair events are PARTNER events (instrumentation verified
//      correct — sequential slot+resonance matching recovers provenance).
//   2. t>=2: the 16 members form a CLIMBING CONVOY on adjacent d-tracks
//      (planting assigns consecutive d 8..15; members climb ~1/tick with a
//      one-tick role phase offset), so cross-pair slot sharing begins
//      immediately (partner/tick decays 6 -> 1 as the convoy compresses).
//   3. t>=~55: ALL members saturate at d=63 — slot 63 becomes a permanent
//      shared party line; partner events = 0 for the rest of the run.
//   4. Delivery is congestion-ROBUST (any positive term delivers; B2 held
//      80/80); PROVENANCE is congestion-FRAGILE — the wormhole table is
//      content-addressed, not identity-addressed.
import { loadKernel, makeSubstrate, tick, mulberry32, WormholeTable } from './_adapter.mjs';
import { plantTwinPairs, plantWeather, seedFnFrom } from './_harness.mjs';

await loadKernel(); // adapter re-exports need the kernel loaded first

const W = 64, H = 64;
const SIGMA = Math.log2(3);
const packB = (tau, d) => ((tau & 3) << 6) | (d & 63);

const rng = mulberry32(77001);
const pairs = plantTwinPairs(rng, 8, W, H, {});
const weather = plantWeather(rng, pairs, W, H, {});
const seedFn = seedFnFrom(pairs, weather);

// instrumented table (same as E-Q14)
const table = new WormholeTable(SIGMA);
const readsLog = [];
const origRead = table.read.bind(table);
table.read = (slot) => { const r = origRead(slot); readsLog.push({ slot, hit: r ? { x: r.x, y: r.y, resonance: r.resonance } : null }); return r; };

const partnerOf = new Map();
for (const p of pairs) { partnerOf.set(p.a.y * W + p.a.x, `P${p.pairId}b`); partnerOf.set(p.b.y * W + p.b.x, `P${p.pairId}a`); }
const nameOf = new Map();
for (const p of pairs) { nameOf.set(p.a.y * W + p.a.x, `P${p.pairId}a`); nameOf.set(p.b.y * W + p.b.x, `P${p.pairId}b`); }

let sub = makeSubstrate(W, H, seedFn);
let partnerEvents = 0, strangerEvents = 0, noEvents = 0;
const perTickSummary = [];

for (let t = 1; t <= 200; t++) {
  readsLog.length = 0;
  const before = new Uint8Array(sub);
  sub = tick(sub, { wormholes: true, table });
  // match events to reads sequentially (same as E-Q14)
  const used = new Array(readsLog.length).fill(false);
  let tickPartner = 0, tickStranger = 0;
  for (const ev of sub.lastEvents) {
    const readerIdx = ev.y * W + ev.x;
    if (!nameOf.has(readerIdx)) continue;
    let occ = null;
    for (let i = 0; i < readsLog.length; i++) {
      if (used[i]) continue;
      const rl = readsLog[i];
      if (rl.slot === ev.slot && rl.hit && rl.hit.resonance === ev.resonance && (rl.hit.x !== ev.x || rl.hit.y !== ev.y)) { occ = rl.hit; used[i] = true; break; }
    }
    const occName = occ ? (nameOf.get(occ.y * W + occ.x) ?? `cell(${occ.x},${occ.y})`) : 'UNMATCHED';
    const isPartner = occ && partnerOf.get(readerIdx) === occName;
    if (isPartner) { tickPartner++; partnerEvents++; } else { tickStranger++; strangerEvents++; }
    if (t <= 12 || (t >= 46 && t <= 58)) {
      console.log(`t=${t} ${nameOf.get(readerIdx)} d:${before[readerIdx] & 63}->${sub[readerIdx] & 63} slot=${ev.slot} res=${ev.resonance} occ=${occName} ${isPartner ? 'PARTNER' : 'STRANGER'}`);
    }
  }
  if (t <= 12 || t % 10 === 0 || (t >= 46 && t <= 56)) {
    const members = [...nameOf.keys()].map((i) => sub[i] & 63);
    perTickSummary.push(`t=${t} partner=${tickPartner} stranger=${tickStranger} d[min..max]=${Math.min(...members)}..${Math.max(...members)}`);
  }
}
console.log('\n=== SUMMARY ===');
for (const s of perTickSummary) console.log(s);
console.log(`TOTAL partner=${partnerEvents} stranger=${strangerEvents}`);
