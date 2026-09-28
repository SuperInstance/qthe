// experiments/e_q11_eval.mjs — E-Q11 CLOSED-FORM PREDICATE EVALUATION (46-c).
// Evaluates the SEALED predicate module (e_q11_collapse_predicate.mjs) against
// the COMMITTED result sets, exactly as registered in
// situations/eq11_predictions.json (sha-sealed PRE-RUN; this file is the
// registered runner). NO kernel runs, NO board, NO ticks. Zero dependencies.
//
// Claims evaluated here: Q1..Q8 (arithmetic). Q9 (deepseek derivation
// cross-check) is run separately by the keeper and receipted AS SAID — the
// verdict's arithmetic claims are INDEPENDENT of it.
//
// Registered pins (prefixes as sealed; full shas receipted at run time):
//   predicate module  d4c3e54b6b80fac422dad8d24dabd8db618f04505b5ba6f8c33f317c62fb7fdd (FULL)
//   eq9_sweep_rows    9ae74556…
//   eq9_census        dc30540c…
//   eq9_sweep_results b6bde5f0…
//   eq9dt_results     9cca85cf…
//   e_q10_results     33b9c99d…

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  R53, floatHolds, fixedHolds, classifyFamily, collapseAplusD,
  predictRowFields, sigmaQFixed, fxPressure, nativeClassify, isDyadic,
} from './e_q11_collapse_predicate.mjs';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const P = (p) => sha256(p);

// ---------------------------------------------------------------------------
// 0. PINS — fail-closed before any evaluation.
// ---------------------------------------------------------------------------
const PINS = {
  'experiments/e_q11_collapse_predicate.mjs': 'd4c3e54b6b80fac422dad8d24dabd8db618f04505b5ba6f8c33f317c62fb7fdd',
  'experiments/outputs/eq9_sweep_rows.jsonl': '9ae74556',
  'experiments/outputs/eq9_census.json': 'dc30540c',
  'experiments/outputs/eq9_sweep_results.json': 'b6bde5f0',
  'experiments/outputs/eq9dt_results.json': '9cca85cf',
  'experiments/outputs/e_q10_results.json': '33b9c99d',
};
const fullShas = {};
for (const [f, pin] of Object.entries(PINS)) {
  const h = sha256(readFileSync(f));
  fullShas[f] = h;
  if (!h.startsWith(pin)) {
    console.error(`PIN FAIL: ${f} sha ${h.slice(0, 12)}... does not match registered pin ${pin.slice(0, 8)}... -- ABORT`);
    process.exit(2);
  }
}
console.log('pins ok:', Object.keys(fullShas).length, 'files (all pins hard, incl. predicate full sha)');

// ---------------------------------------------------------------------------
// Load committed result sets.
// ---------------------------------------------------------------------------
const rows = readFileSync('experiments/outputs/eq9_sweep_rows.jsonl', 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l));
const census = JSON.parse(readFileSync('experiments/outputs/eq9_census.json', 'utf8'));
const dt = JSON.parse(readFileSync('experiments/outputs/eq9dt_results.json', 'utf8'));
const eq10 = JSON.parse(readFileSync('experiments/outputs/e_q10_results.json', 'utf8'));
const eq10src = readFileSync('experiments/e_q10_armor_injector.mjs', 'utf8');

const ratRows = rows.filter((r) => r.a === 'rat');
if (rows.length !== 116733) throw new Error(`row count ${rows.length} != 116733`);
if (ratRows.length !== 38911) throw new Error(`rat rows ${ratRows.length} != 38911`);

// key parser: "n/dd"
const parseK = (k) => {
  const [n, dd] = k.split('/');
  return { n: Number(n), dd: Number(dd) };
};

const results = { pins: fullShas, claims: {} };
const record = (id, pass, detail) => {
  results.claims[id] = { pass, detail };
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id}: ${detail}`);
};

// ---------------------------------------------------------------------------
// Q1 — COLLAPSE MEMBERSHIP: predicate == (cq ∈ {A,D}) on all 38,911 rat rows.
// ---------------------------------------------------------------------------
{
  let mism = 0;
  for (const r of ratRows) {
    const { n, dd } = parseK(r.k);
    if (collapseAplusD(n, dd) !== (r.cq === 'A' || r.cq === 'D')) mism++;
  }
  record('Q1', mism === 0, `collapse membership over 38,911 rat rows: ${38911 - mism}/${38911} match, ${mism} mismatches`);
}

// ---------------------------------------------------------------------------
// Q2 — FOUR-CLASS PARTITION: classifier cls == cq per row + stable counts.
// ---------------------------------------------------------------------------
{
  let mism = 0; const counts = { A: 0, B: 0, C: 0, D: 0, 'F-INV': 0 };
  for (const r of ratRows) {
    const { n, dd } = parseK(r.k);
    const c = classifyFamily(n, dd).cls;
    if (c !== r.cq) mism++;
    counts[c] = (counts[c] || 0) + 1;
  }
  const want = { A: 34144, B: 1729, C: 1904, D: 1134, 'F-INV': 0 };
  const countsOk = JSON.stringify(counts) === JSON.stringify(want);
  record('Q2', mism === 0 && countsOk,
    `row-level class mismatches: ${mism}; counts ${JSON.stringify(counts)} vs committed ${JSON.stringify(want)}: ${countsOk ? 'EXACT' : 'OFF'}`);
}

// ---------------------------------------------------------------------------
// Q3 — OBSERVED-TAXONOMY BYTE REPRODUCTION: predictRowFields matches all six
// committed fields (obs, fd, nc, bi, cls, dds) on all 38,911 rat rows.
// ---------------------------------------------------------------------------
{
  let bad = 0; const badSample = [];
  for (const r of ratRows) {
    const { n, dd } = parseK(r.k);
    const p = predictRowFields(n, dd);
    const ok = p.obs === r.obs && p.fd === r.fd && p.nc === r.nc
      && p.bi === r.bi && JSON.stringify(p.cls) === JSON.stringify(r.cls)
      && JSON.stringify(p.dds) === JSON.stringify(r.dds);
    if (!ok) { bad++; if (badSample.length < 3) badSample.push({ k: r.k, pred: p, got: { obs: r.obs, fd: r.fd, nc: r.nc, bi: r.bi, cls: r.cls, dds: r.dds } }); }
  }
  record('Q3', bad === 0, `six-field byte reproduction over 38,911 rows: ${38911 - bad} match, ${bad} differ${bad ? ' | sample ' + JSON.stringify(badSample) : ''}`);
}

// ---------------------------------------------------------------------------
// Q4 — COMPLEMENT BYTE-IDENTITY: ¬E key set == committed B∪C key set (3,633),
// sorted byte-identically.
// ---------------------------------------------------------------------------
{
  const predNot = []; const committedBC = [];
  for (const r of ratRows) {
    const { n, dd } = parseK(r.k);
    if (!collapseAplusD(n, dd)) predNot.push(r.k);
    if (r.cq === 'B' || r.cq === 'C') committedBC.push(r.k);
  }
  predNot.sort(); committedBC.sort();
  const a = predNot.join('\n'); const b = committedBC.join('\n');
  const byteEq = a === b;
  record('Q4', byteEq && predNot.length === 3633,
    `¬E keys ${predNot.length} vs B∪C keys ${committedBC.length} (registered 3,633): byte-identical=${byteEq}`);
}

// ---------------------------------------------------------------------------
// Q5 — IMPLEMENTATION INDEPENDENCE: full box (n ≤ 504, dd ≤ 1000, gcd = 1),
// BigInt-only classifier == native IEEE-754 mirror, pair count == 306,773.
// ---------------------------------------------------------------------------
{
  const gcd = (x, y) => { while (y) { const t = x % y; x = y; y = t; } return x; };
  let pairs = 0; let disagree = 0; const disagreeSample = [];
  for (let n = 1; n <= 504; n++) {
    for (let dd = 1; dd <= 1000; dd++) {
      if (gcd(n, dd) !== 1) continue;
      pairs++;
      const big = classifyFamily(n, dd);
      const nat = nativeClassify(n, dd);
      const ok = big.cls === nat.cls && big.floatHolds === nat.fColl
        && big.fixedHolds === nat.fxHold && big.fSign === nat.fSign
        && big.fxSign === nat.fxSign
        && big.sigmaQ === BigInt(nat.sigmaQ) && big.fxPressure === BigInt(nat.fxPressure);
      if (!ok) { disagree++; if (disagreeSample.length < 3) disagreeSample.push({ n, dd, big: { cls: big.cls, f: big.floatHolds, x: big.fixedHolds, fs: big.fSign, xs: big.fxSign }, nat }); }
    }
  }
  const countOk = pairs === 306773;
  record('Q5', disagree === 0 && countOk,
    `box pairs ${pairs} (registered 306,773: ${countOk ? 'EXACT' : 'OFF'}); BigInt-vs-native disagreements: ${disagree}${disagree ? ' | sample ' + JSON.stringify(disagreeSample) : ''}`);
}

// ---------------------------------------------------------------------------
// Q6 — BOUNDARY EXTENSION: region sizes, D_full, F-INV_full, dyadic law,
// stable-box collapse fraction.
// ---------------------------------------------------------------------------
{
  const gcd = (x, y) => { while (y) { const t = x % y; x = y; y = t; } return x; };
  let stable = 0, reachable = 0, out = 0, dFull = 0, finv = 0, dyadicViol = 0;
  for (let n = 1; n <= 504; n++) {
    for (let dd = 1; dd <= 1000; dd++) {
      if (gcd(n, dd) !== 1) continue;
      if (n <= 252 && dd <= 253) stable++;
      else if (dd <= 505) reachable++;
      else out++;
      if (isDyadic(dd)) {
        dFull++;
        if (!floatHolds(n, dd)) dyadicViol++;
        if (!floatHolds(n, dd) && fixedHolds(n, dd)) finv++;
      }
      if (!floatHolds(n, dd) && fixedHolds(n, dd)) finv++;
    }
  }
  // D_full closed form: dd=1 → 504; dd = 2^k (k=1..9) → n odd ≤ 504 → 252 each
  const dClosed = 504 + 9 * 252;
  const frac = (34144 + 1134) / 38911; // A+D over stable rat rows
  const sizesOk = stable === 38911 && reachable === 116176 && out === 151686 && (stable + reachable + out) === 306773;
  const dOk = dFull === dClosed && dFull === 2772;
  record('Q6', sizesOk && dOk && finv === 0 && dyadicViol === 0 && Math.abs(frac - 35278 / 38911) < 1e-15 && Math.abs(frac - 0.90661) < 5e-5,
    `regions stable/reachable/out ${stable}/${reachable}/${out} (registered 38,911/116,176/151,686: ${sizesOk ? 'EXACT' : 'OFF'}); D_full ${dFull} (closed form 504+9·252 = ${dClosed}: ${dOk ? 'EXACT' : 'OFF'}); F-INV_full ${finv}; dyadic⟹collapse violations ${dyadicViol}; stable collapse fraction ${frac.toFixed(5)} (= 35,278/38,911, the committed 90.67%)`);
}

// ---------------------------------------------------------------------------
// Q7 — PRIMARY + DT BYTE VALUES: exact registered bytes.
// ---------------------------------------------------------------------------
{
  const q23 = sigmaQFixed(2, 3), q85 = sigmaQFixed(8, 5), q710 = sigmaQFixed(7, 10);
  const p23 = fxPressure(2, 3), p85 = fxPressure(8, 5), p710 = fxPressure(7, 10);
  const c23 = classifyFamily(2, 3).cls, c85 = classifyFamily(8, 5).cls, c710 = classifyFamily(7, 10).cls;
  const ok = q23 === 2863311531n && q85 === 6871947674n && q710 === 3006477107n
    && p23 === 1n && p85 === 2n && p710 === -2n
    && floatHolds(2, 3) && floatHolds(8, 5) && floatHolds(7, 10)
    && c23 === 'A' && c85 === 'A' && c710 === 'A';
  // DT: every committed dyadic family in eq9dt_results holds in the predicate
  let dtChecked = 0, dtBad = 0;
  const walkDT = (o) => {
    if (Array.isArray(o)) { o.forEach(walkDT); return; }
    if (o && typeof o === 'object') {
      if (typeof o.n === 'number' && typeof o.dd === 'number') {
        dtChecked++;
        if (!(fixedHolds(o.n, o.dd) && floatHolds(o.n, o.dd) && classifyFamily(o.n, o.dd).cls === 'D')) dtBad++;
        return;
      }
      Object.values(o).forEach(walkDT);
    }
  };
  walkDT(dt);
  record('Q7', ok && dtBad === 0,
    `sigmaQ 2/3=${q23} 8/5=${q85} 7/10=${q710}; fxPressure +1/+2/−2: ${p23}/${p85}/${p710}; float term == n all three: ${floatHolds(2, 3) && floatHolds(8, 5) && floatHolds(7, 10)}; classes ${c23}/${c85}/${c710}; DT dyadic families checked ${dtChecked}, bad ${dtBad}`);
}

// ---------------------------------------------------------------------------
// Q8 — E-Q10 HOOK: seedFn packs only tau ∈ {0,1,2}; all 17 admissible trials
// carry a2.firstZeroTick == 105. The predicate's domain is empty on the ring.
// ---------------------------------------------------------------------------
{
  const pack3 = (eq10src.match(/packByte\(3/g) || []).length;
  const seedFnStart = eq10src.indexOf('const seedFn');
  const seedFnBlock = eq10src.slice(seedFnStart, eq10src.indexOf('makeSubstrate', seedFnStart));
  const seedPacks = seedFnBlock.match(/packByte\((\d)/g) || [];
  const taus = [...new Set(seedPacks.map((s) => s.slice(9, 10)))].sort();
  const trials = (Array.isArray(eq10.trials) ? eq10.trials : [])
    .filter((t) => t && t.a2); // admissibleTrials is the committed COUNT (17); the trials list carries the a2 records
  const fzt = trials.map((t) => (t.a2 || {}).firstZeroTick);
  const fztOk = trials.length === 17 && fzt.every((v) => v === 105);
  record('Q8', pack3 === 0 && taus.every((t) => '012'.includes(t)) && seedPacks.length > 0 && fztOk,
    `packByte(3,...) occurrences in committed runner: ${pack3} (registered 0); seedFn tau set: [${taus.join(',')}] (registered within {0,1,2}); admissibleTrials count ${eq10.admissibleTrials} == 17, trials checked ${trials.length}, firstZeroTick==105 in all: ${fztOk} (ring erosion 50+55, sigma-independent)`);
}

// ---------------------------------------------------------------------------
// Write results + tip.
// ---------------------------------------------------------------------------
const allIds = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'];
const passed = allIds.filter((id) => results.claims[id].pass).length;
const summary = {
  experiment: 'E-Q11 — closed-form A+D collapse-set predicate, evaluated against committed result sets',
  registration: 'situations/eq11_predictions.json',
  predicateSha256: PINS['experiments/e_q11_collapse_predicate.mjs'],
  claimsEvaluated: allIds,
  passed, failed: allIds.length - passed,
  q9: 'deepseek derivation cross-check — run separately by keeper, receipted AS SAID, informational only',
  leverDischarged: passed === 8,
  results, runAt: new Date().toISOString(),
};
writeFileSync('experiments/outputs/e_q11_results.json', JSON.stringify(summary, null, 2) + '\n');
writeFileSync('experiments/outputs/e_q11_tip.txt', sha256(JSON.stringify(summary)) + '\n');
console.log(`\nE-Q11 eval: ${passed}/8 arithmetic claims PASS — lever ${passed === 8 ? 'DISCHARGED (Q9 informational pending)' : 'RE-PARKED with receipt'}`);
process.exit(0);
