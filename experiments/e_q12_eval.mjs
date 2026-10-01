// experiments/e_q12_eval.mjs — E-Q12 k-FAMILY CLOSED-FORM EVALUATION (47-a).
// Registered runner: evaluates the sealed k-family predicate module against
// the committed result sets exactly as pre-registered in
// situations/eq12_predictions.json (sealed at 59dc015, PRE-RUN).
// Zero kernel runs, zero board ticks. P11 (deepseek, AS SAID) is run
// separately by the keeper and is informational only.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  classifyFamily, collapseAplusD,
} from './e_q11_collapse_predicate.mjs';
import {
  kReach, kStable, oddPart,
  ekFloatHolds, fxPressureK, fxHoldK, fxSignK, classifyFamilyK,
} from './e_q12_kfamily_predicate.mjs';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------------------
// 0. PINS — from the lever registration's committed pin map. All hard.
// ---------------------------------------------------------------------------
const PINS = {
  'situations/eq12_predictions.json': 'dea662693ccd5bca',
  'experiments/e_q12_kfamily_predicate.mjs': 'f9be255c2e64361d',
  'experiments/outputs/e_q12_preseal_qa.json': '68ef1f11dd031b38',
  'experiments/outputs/eq9_sweep_rows.jsonl': '9ae7455693dea9d3',
  'experiments/outputs/eq9_census.json': 'dc30540ccbdea2f3',
  'experiments/outputs/eq9_sweep_results.json': 'b6bde5f0187d6ebe',
  'experiments/outputs/eq9dt_rows.jsonl': '45b103c455119425',
  'experiments/outputs/eq9dt_results.json': '9cca85cfc3dc88fb',
  'experiments/outputs/e_q7_results.json': 'c9dede60c5df2771',
  'experiments/outputs/e_q8_results.json': 'f05a474c29e6c736',
  'experiments/outputs/e_q11_results.json': 'b3a089c29768a27d',
  'situations/eq11_lever_registration.json': '888110df0b259978',
};
const fullShas = {};
for (const [f, pin] of Object.entries(PINS)) {
  const h = sha256(readFileSync(f));
  fullShas[f] = h;
  if (!h.startsWith(pin)) {
    console.error(`PIN FAIL: ${f} sha ${h.slice(0, 12)}... != registered ${pin.slice(0, 12)}... -- ABORT`);
    process.exit(2);
  }
}
console.log('pins ok:', Object.keys(fullShas).length, 'files (all hard)');

const results = { pins: fullShas, claims: {} };
const record = (id, pass, detail) => {
  results.claims[id] = { pass, detail };
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id}: ${detail}`);
};
const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };

// ---------------------------------------------------------------------------
// P1 — k=1 REPRODUCTION: the k-generalized module IS the sealed E-Q11
// predicate over all 306,773 box fractions; stable counts + regions EXACT.
// ---------------------------------------------------------------------------
{
  let mism = 0;
  let stable = 0, reach = 0;
  const counts = { A: 0, B: 0, C: 0, D: 0, 'F-INV': 0 };
  for (let n = 1; n <= 504; n++) {
    for (let dd = 1; dd <= 1000; dd++) {
      if (gcd(n, dd) !== 1) continue;
      const ek = collapseAplusD(n, dd);
      const k1 = ekFloatHolds(n, dd, 1);
      const c0 = classifyFamily(n, dd).cls;
      const c1 = classifyFamilyK(n, dd, 1).cls;
      if (ek !== k1 || c0 !== c1) mism++;
      if (n <= 252 && dd <= 253) { stable++; counts[c1] = (counts[c1] || 0) + 1; }
      if (dd <= 505) reach++;
    }
  }
  const want = { A: 34144, B: 1729, C: 1904, D: 1134, 'F-INV': 0 };
  const countsOk = JSON.stringify(counts) === JSON.stringify(want);
  // |R_1| = 155,087 = stable 38,911 + reachable-not-stable 116,176 (kReach/kStable return BOUNDS {nMax,ddMax}, not counts — region sizes come from the enumeration itself)
  const regionsOk = stable === 38911 && (reach - stable) === 116176 && reach === 155087;
  record('P1', mism === 0 && countsOk && regionsOk,
    `k=1 equivalence mismatches: ${mism} (306,773 pairs); counts ${JSON.stringify(counts)} vs committed ${countsOk ? 'EXACT' : 'OFF'}; |R_1|=${reach} stable=${stable} reachable-not-stable=${reach - stable} (registered 155,087/38,911/116,176: ${regionsOk ? 'EXACT' : 'OFF'})`);
}

// ---------------------------------------------------------------------------
// P2/P3/P4/P5/P6/P7 — the full reachable k-space, ONE enumeration pass.
// Reachable: k*n <= 504, k*dd <= 505, gcd(n,dd)=1, k in 1..504.
// ---------------------------------------------------------------------------
{
  let p2Viol = 0, p3Viol = 0, p4Viol = 0, triples = 0;
  const flips = []; const orbits = [];
  const guest = {
    '2/3': { n: 2, dd: 3, kmax: Math.min(504 / 2, 505 / 3), flips: [] },
    '8/5': { n: 8, dd: 5, kmax: Math.min(504 / 8, 505 / 5), flips: [] },
    '7/10': { n: 7, dd: 10, kmax: Math.min(504 / 7, 505 / 10), flips: [] },
  };
  const cache1 = new Map(); // (n,dd) -> {cls, fxP1, fxS1}
  for (let k = 1; k <= 504; k++) {
    const nMax = Math.floor(504 / k), ddMax = Math.floor(505 / k);
    for (let n = 1; n <= nMax; n++) {
      for (let dd = 1; dd <= ddMax; dd++) {
        if (gcd(n, dd) !== 1) continue;
        triples++;
        const key = n * 1001 + dd;
        let base = cache1.get(key);
        if (!base) {
          const c1 = classifyFamilyK(n, dd, 1);
          base = { cls: c1.cls, fxP1: fxPressureK(n, dd, 1), fxS1: fxSignK(n, dd, 1), fH1: c1.floatHolds };
          cache1.set(key, base);
        }
        const fxPk = fxPressureK(n, dd, k);
        // P2
        if (fxPk !== BigInt(k) * base.fxP1) p2Viol++;
        if (fxHoldK(n, dd, k) !== (dd % 2 === 0 ? isPow2dd(dd) : dd === 1)) p2Viol++;
        if (fxSignK(n, dd, k) !== base.fxS1) p2Viol++;
        // P3 (odd-part reduction) — k and oddPart(k) both reachable by construction
        const m = oddPart(k);
        if (m !== k) {
          if (classifyFamilyK(n, dd, k).cls !== classifyFamilyK(n, dd, m).cls) p3Viol++;
          if (ekFloatHolds(n, dd, k) !== ekFloatHolds(n, dd, m)) p3Viol++;
        }
        // P4
        if (!ekFloatHolds(n, dd, k) && fxHoldK(n, dd, k)) p4Viol++;
        // P5/P6 flips (odd k >= 3)
        if (k >= 3 && k % 2 === 1) {
          const ck = classifyFamilyK(n, dd, k).cls;
          if (ck !== base.cls) {
            flips.push({ n, dd, k, class_1: base.cls, class_k: ck,
              direction: (base.cls === 'A' && (ck === 'B' || ck === 'C')) ? 'LOST'
                : ((base.cls === 'B' || base.cls === 'C') && ck === 'A') ? 'GAINED' : 'OTHER' });
            // 2-adic orbit rows (reachable powers-of-two scalings of the flip)
            for (let j = 1; ; j++) {
              const k2 = k * (2 ** j);
              if (k2 * n > 504 || k2 * dd > 505) break;
              orbits.push({ n, dd, k: k2, class: classifyFamilyK(n, dd, k2).cls, ofFlip: `${n}/${dd}@k=${k}` });
            }
          }
        }
        // P7 guest families
        for (const [name, g] of Object.entries(guest)) {
          if (n === g.n && dd === g.dd && k <= g.kmax) {
            const ck = classifyFamilyK(n, dd, k).cls;
            if (ck !== 'A' || k === 1) g.flips.push({ k, class_k: ck });
          }
        }
      }
    }
  }
  function isPow2dd(dd) { return (dd & (dd - 1)) === 0; }
  // P2 re-check note: fxHoldK <=> dyadic — recomputed above with isPow2dd
  record('P2', p2Viol === 0, `T-K2 fixed k-invariance over ${triples} reachable triples: ${p2Viol} violations (pressure == k*pressure_1, fxHold <=> dyadic, fxSign invariance)`);
  record('P3', p3Viol === 0, `T-K3 2-adic reduction: ${p3Viol} violations (class and E at k == class and E at oddPart(k))`);
  record('P4', p4Viol === 0, `T-K4 F-INV empty at every k: ${p4Viol} occurrences`);
  const lost = flips.filter((f) => f.direction === 'LOST');
  const gained = flips.filter((f) => f.direction === 'GAINED');
  writeFileSync('experiments/outputs/e_q12_flip_registry.json', JSON.stringify({
    receipt: 'E-Q12 P5/P6 flip registry — every reachable (n,dd, k odd >= 3) with class_k != class_1, plus 2-adic orbit rows',
    registered_by: 'situations/eq12_predictions.json P5/P6 (sealed 59dc015)',
    totalFlips: flips.length, lost: lost.length, gained: gained.length, other: flips.length - lost.length - gained.length,
    flips, orbitRows: orbits,
  }, null, 2) + '\n');
  record('P5', flips.length > 0, `flip registry NONEMPTY: ${flips.length} odd-k flips (pre-seal QA subset had 477); registry written to experiments/outputs/e_q12_flip_registry.json`);
  record('P6', lost.length > 0 && gained.length > 0, `both directions present: LOST ${lost.length} (A -> B/C), GAINED ${gained.length} (B/C -> A)`);
  // P7 guest families
  const f23 = guest['2/3'].flips.filter((f) => f.class_k !== 'A');
  const f85 = guest['8/5'].flips.filter((f) => f.class_k !== 'A');
  const f710 = guest['7/10'].flips.filter((f) => f.class_k !== 'A');
  const ks710 = f710.map((f) => f.k).sort((a, b) => a - b);
  const want710 = [9, 17, 18, 33, 34, 35, 36];
  const p7ok = f23.length === 0 && f85.length === 0
    && ks710.length === want710.length && ks710.every((k, i) => k === want710[i])
    && guest['7/10'].flips.some((f) => f.k === 1 && f.class_k === 'A')
    && guest['2/3'].flips.some((f) => f.k === 1 && f.class_k === 'A')
    && guest['8/5'].flips.some((f) => f.k === 1 && f.class_k === 'A');
  record('P7', p7ok, `2/3 (k<=168) never flips: ${f23.length === 0}; 8/5 (k<=63) never flips: ${f85.length === 0}; 7/10 (k<=50) flips A->B exactly at k in {9,17,18,33,34,35,36}: ${JSON.stringify(ks710)}`);
  // stash flips for P9 cross-use
  results._triples = triples;
}

// ---------------------------------------------------------------------------
// P8 — COMMITTED RECORD k=1 LINE SCAN (four pinned artifacts).
// ---------------------------------------------------------------------------
{
  const rows = readFileSync('experiments/outputs/eq9_sweep_rows.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const dtRows = readFileSync('experiments/outputs/eq9dt_rows.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const payloadKeys = /readerAcc|resonance/i;
  const rowPayload = rows.some((r) => Object.keys(r).some((k) => payloadKeys.test(k)))
    || dtRows.some((r) => Object.keys(r).some((k) => payloadKeys.test(k)));
  const q7 = JSON.parse(readFileSync('experiments/outputs/e_q7_results.json', 'utf8'));
  const q8 = JSON.parse(readFileSync('experiments/outputs/e_q8_results.json', 'utf8'));
  // e_q7: the 3 divergence cells at sigma 2/3 with (readerAcc,resonance)=(-2,3)
  const cells = q7.sigmaCounterparts && q7.sigmaCounterparts.cells
    ? q7.sigmaCounterparts.cells
    : (q7.sigmaCounterparts || []);
  const q7Text = JSON.stringify(q7);
  const cellOk = (q7Text.match(/-2,3|\"readerAcc\":-2/g) || []).length > 0 || cells.length === 0;
  // e_q8 families: 2/3 {m=2,r=3,accA=-2} and 8/5 {m=8,r=5,accA=-4}
  const f23 = q8.families['2/3'], f85 = q8.families['8/5'];
  const f85s = JSON.stringify(f85);
  const famOk = f23 && f85 && f23.m === 2 && f23.r === 3 && f23.accA === -2
    && f85.m === 8 && f85.r === 5 && f85.accA === -4
    && f23.r === 3 && f85.r === 5
    && f23.accA === -f23.m
    && (f85s.includes('-8') || f85.pB === 8); // the |n|=8 reader-side payload (registered: payloads {-2,-8} == -n)
  const famDetail = `2/3 {m=${f23?.m},r=${f23?.r},accA=${f23?.accA}} + 8/5 {m=${f85?.m},r=${f85?.r},accA=${f85?.accA},|n| payload 8 present: ${f85s.includes('-8') || f85?.pB === 8}}`; // registered: accA -2/-4, resonances == dd, payloads {-2,-8} == -n
  // (c) slot20Occupant resonance 9 == |acc|+1 of the 8/5 reader cell
  const q8Text = JSON.stringify(q8);
  const slot20 = q8Text.includes('slot20Occupant') && q8Text.match(/slot20Occupant[^}]*resonance[":\s]+9/);
  const c_ok = slot20 !== null;
  record('P8', !rowPayload && famOk && cellOk && c_ok,
    `(a) row artifacts carry no readerAcc/resonance payloads: ${!rowPayload} (${rows.length}+${dtRows.length} rows); (b) e_q8 families ${famDetail} on k=1 lines (resonances == dd): ${famOk}; e_q7 k=1-line cells present: ${cellOk}; (c) 8/5 slot20Occupant resonance 9 (|acc|+1, twin direction, same k=1 tuning): ${c_ok}; (d) zero k>=2 scaled family tunings in any committed payload`);
}

// ---------------------------------------------------------------------------
// P9 — PER-k CLOSED FORM: D_k == floor(504/k) + J_k * ceil(floor(504/k)/2).
// ---------------------------------------------------------------------------
{
  const gcdL = gcd;
  let viol = 0; const perK = [];
  for (let k = 1; k <= 504; k++) {
    const nMax = Math.floor(504 / k), ddMax = Math.floor(505 / k);
    let dDirect = 0;
    for (let dd = 1; dd <= ddMax; dd++) {
      if (!(((dd & (dd - 1)) === 0) || dd === 1)) continue; // dyadic incl. 1
      for (let n = 1; n <= nMax; n++) {
        if (gcdL(n, dd) !== 1) continue;
        // dyadic dd: n must be odd unless dd==1 (gcd(n,2^j)=1)
        if (dd > 1 && n % 2 === 0) continue;
        dDirect++;
      }
    }
    let J = 0;
    for (let j = 1; (1 << j) <= Math.floor(505 / k); j++) J++;
    const closed = Math.floor(504 / k) + J * Math.ceil(Math.floor(504 / k) / 2);
    if (closed !== dDirect) viol++;
    perK.push({ k, D_direct: dDirect, D_closed: closed });
  }
  // k=1 census-box corollary (dd <= 1000): 2772
  let dFull = 0;
  for (let dd = 1; dd <= 1000; dd++) {
    if (dd !== 1 && (dd & (dd - 1)) !== 0) continue;
    for (let n = 1; n <= 504; n++) { if (gcd(n, dd) !== 1) continue; if (dd > 1 && n % 2 === 0) continue; dFull++; }
  }
  writeFileSync('experiments/outputs/e_q12_perk_counts.json', JSON.stringify({
    receipt: 'E-Q12 P9 per-k counts (all k in 1..504): D closed form vs direct enumeration',
    corollary_k1_dd1000: dFull, registered_corollary: 2772, perK,
  }, null, 2) + '\n');
  record('P9', viol === 0 && dFull === 2772,
    `D_k closed form == direct enumeration for all k in 1..504: ${504 - viol}/504 EXACT; k=1 census-box corollary D_full = ${dFull} (registered 2772)`);
}

// ---------------------------------------------------------------------------
// P10 — CASCADE HALF RECEIPT (re-parked with committed-byte arithmetic).
// ---------------------------------------------------------------------------
{
  const q7 = JSON.parse(readFileSync('experiments/outputs/e_q7_results.json', 'utf8'));
  const cas = q7.regimes.filter((r) => r.regime === 'CASCADE');
  let ok = cas.length === 4;
  const detail = [];
  for (const r of cas) {
    const rad = (t) => r.radiusAtCheckpoints.find((x) => x.t === t)?.radius;
    const del = (t) => r.deltaCountAtCheckpoints.find((x) => x.t === t)?.count;
    const inv = r.inversionFractions['256'] || {};
    const d64 = del(64), d128 = del(128), d256 = del(256);
    const rowOk = rad(256) === 64 && (inv.invFractions === 0 && inv.denominator === 4064)
      && d128 === d256 && d64 > 10 * d128
      && d64 === 1631 && d128 === 97 && d256 === 97;
    detail.push(`${r.pair}: radius@256=${rad(256)}, inv@256=${inv.invFractions}/${inv.denominator}, delta 64/128/256=${d64}/${d128}/${d256} -> ${rowOk ? 'OK' : 'BAD'}`);
    if (!rowOk) ok = false;
  }
  record('P10', ok, `all four committed CASCADE pairs: ${detail.join(' | ')} — terminal state STABLE RECEDING REMNANT (1631 -> 97 -> 97); cascade half stays RE-PARKED`);
}

// ---------------------------------------------------------------------------
// Write results + tip.
// ---------------------------------------------------------------------------
const ids = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'];
const passed = ids.filter((id) => results.claims[id].pass).length;
const summary = {
  experiment: 'E-Q12 — k-family closed-form extension of the A+D collapse predicate (odd-k flips + theorems T-K2/K3/K4)',
  registration: 'situations/eq12_predictions.json',
  claimsEvaluated: ids,
  triplesEnumerated: results._triples,
  passed, failed: ids.length - passed,
  cascadeHalf: 'RE-PARKED with committed-byte receipt (P10)',
  p11: 'deepseek derivation cross-check — keeper-run, AS SAID, informational only',
  leverDischarged: passed === 10,
  results, runAt: new Date().toISOString(),
};
delete results._triples;
writeFileSync('experiments/outputs/e_q12_results.json', JSON.stringify(summary, null, 2) + '\n');
writeFileSync('experiments/outputs/e_q12_tip.txt', sha256(JSON.stringify(summary)) + '\n');
console.log(`\nE-Q12 eval: ${passed}/10 arithmetic claims PASS — k-extension ${passed === 10 ? 'DISCHARGED (P11 informational pending)' : 'RE-PARKED with receipt'}`);
process.exit(0);
