// fixedpoint/probe_divergence.mjs — P-B1 AUTOPSY v2 (harness instrumentation,
// not a floor edit). Exact at-read reconstruction: the table state a reader
// sees at cell (x,y) in tick t = pre-tick table + writes of all Abstain cells
// row-major BEFORE (x,y) in tick t (each writes slot = its d_start, resonance
// = |acc|+1 from the pre-tick plane). Pre-tick plane and table are identical
// on both kernels before the FIRST divergence, so this reconstruction is
// exact. Sanity: asserts planes identical at t=1 for empty-table arms.
import { writeFileSync } from 'node:fs';
import * as K from './qthe_fixed.mjs';
import * as F from '../qthe.mjs';

function seedFnOf(seed) {
  const rng = F.mulberry32(seed);
  return () => { const tau = Math.floor(rng() * 4), d = Math.floor(rng() * 64); return (tau << 6) | d; };
}
const unpack = (c) => ({ tau: (c >> 6) & 3, d: c & 63 });

function mooreAcc(cells, w, h, x, y) {
  let acc = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (dx === 0 && dy === 0) continue;
    const nb = cells[((y + dy + h) % h) * w + ((x + dx + w) % w)];
    if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
  }
  return acc;
}

function probe(armReal, armQ, name, seed, T = 400) {
  const w = 24, h = 16;
  const subF = F.makeSubstrate(w, h, seedFnOf(seed));
  const subQ = K.makeSubstrate(w, h, seedFnOf(seed));
  let prevCells = Uint8Array.from(subF);      // pre-tick plane (t=1: the substrate)
  let prevTable = new Array(64).fill(null);   // pre-tick table (t=1: empty)
  for (let t = 1; t <= T; t++) {
    if (armReal === null) { F.tick(subF); K.tick(subQ); }
    else { F.tick(subF, { sigma: armReal }); K.tick(subQ, { sigmaQ: armQ }); }
    const tvF = F.traceView(subF), tvQ = K.traceView(subQ);
    let divIndex = -1;
    for (let i = 0; i < tvF.cells.length; i++) if (tvF.cells[i] !== tvQ.cells[i]) { divIndex = i; break; }
    if (divIndex >= 0) {
      const x = divIndex % w, y = (divIndex / w) | 0;
      const dStart = prevCells[divIndex] & 63;
      const acc = mooreAcc(prevCells, w, h, x, y);
      // rebuild the AT-READ table: pre-tick table + writes of earlier Abstain cells
      const atRead = prevTable.slice();
      for (let j = 0; j < divIndex; j++) {
        if ((prevCells[j] >> 6) === 3) {
          const jx = j % w, jy = (j / w) | 0;
          const a = mooreAcc(prevCells, w, h, jx, jy);
          atRead[prevCells[j] & 63] = { x: jx, y: jy, resonance: Math.abs(a) + 1 };
        }
      }
      const hit = atRead[dStart];
      let floatP = null, fixedP = null, twin = false;
      if (hit && hit.resonance !== 0 && (hit.x !== x || hit.y !== y)) {
        twin = true;
        floatP = acc + hit.resonance * armReal;   // the kernel's exact float order
        fixedP = acc * 4294967296 + hit.resonance * armQ;  // exact integers (< 2^53)
      } else {
        floatP = acc; fixedP = acc;               // real pressure only
      }
      const cls = !twin ? 'no-twin-at-read (reconstruction mismatch — investigate)'
        : floatP === 0 ? 'float-collapses-to-exact-zero (double rounding); fixed keeps honest remainder'
        : Math.sign(floatP) !== Math.sign(fixedP) ? 'SIGN FLIP between kernels'
        : 'same sign both kernels (divergence must originate EARLIER in row-major order — first-differing-cell is downstream)';
      return {
        arm: name, seed, tick: t, cellIndex: divIndex, x, y,
        floatCell: unpack(tvF.cells[divIndex]), fixedCell: unpack(tvQ.cells[divIndex]),
        dStart, acc, hit, twin,
        floatPressure: String(floatP), floatPressureIsExactZero: floatP === 0,
        fixedPressureSUnits: String(fixedP),
        classification: cls,
      };
    }
    prevCells = Uint8Array.from(subF);
    prevTable = (tvF.wormholes || []).map((s) => (s ? { x: s.x, y: s.y, resonance: s.resonance } : null));
  }
  return { arm: name, seed, divergence: null };
}

// t=1 sanity: empty tables => planes must be identical for every arm/seed
function sanityT1() {
  const bad = [];
  for (const [real, q, name] of [[1.6, 6871947674, '1.6'], [0.7, 3006477107, '0.7'], [2 / 3, 2863311531, '2/3']]) {
    for (let seed = 34001; seed <= 34008; seed++) {
      const a = F.makeSubstrate(24, 16, seedFnOf(seed)), b = K.makeSubstrate(24, 16, seedFnOf(seed));
      F.tick(a, { sigma: real }); K.tick(b, { sigmaQ: q });
      if (JSON.stringify([...a]) !== JSON.stringify([...b])) bad.push({ arm: name, seed });
    }
  }
  return bad;
}
const badT1 = sanityT1();
console.log('t=1 sanity (empty-table planes identical):', badT1.length === 0 ? 'OK 24/24' : JSON.stringify(badT1));

const out = [];
for (const [real, q, name] of [[1.6, 6871947674, '1.6'], [0.7, 3006477107, '0.7'], [2 / 3, 2863311531, '2/3']]) {
  for (let seed = 34001; seed <= 34008; seed++) out.push(probe(real, q, name, seed));
}
const summary = {
  law: 'P-B1 autopsy only — floors untouched (explains what f_b_results.json already recorded)',
  t1SanityBad: badT1,
  perCase: out,
};
writeFileSync(new URL('./outputs/f_b_autopsy.json', import.meta.url).pathname, JSON.stringify(summary, null, 1));
for (const r of out.filter((x) => x.tick)) console.log(r.arm, 'seed', r.seed, 't=' + r.tick, 'cell(' + r.x + ',' + r.y + ')', 'dStart=' + r.dStart, 'acc=' + r.acc, 'hit=' + JSON.stringify(r.hit), 'floatP=' + r.floatPressure, 'fixedP=' + r.fixedPressureSUnits, '->', r.classification.slice(0, 60));
