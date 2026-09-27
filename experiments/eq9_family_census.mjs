// experiments/eq9_family_census.mjs — E-Q9 PRE-RUN ARITHMETIC CENSUS (task 40-c,
// wave 40, lane qthe-smith). Runs BEFORE the predictions file is sealed and
// BEFORE any kernel run (pricing-first law; 39c-family-arithmetic precedent).
//
// ZERO kernel runs, ZERO LLM calls, ZERO key material. Pure number theory +
// IEEE-754 bit arithmetic on the same operations the two kernels perform:
//   float  plane: term = resonance * double(sigma)          (qthe.mjs tick, R3)
//   fixed  plane: term = resonance * sigmaQ, sigmaQ = Math.round(sigma*2^32)
//                  pressure = acc*S + term                  (qthe_fixed.mjs, R8)
//
// THE FAMILY PREDICATE (registered here, cited to code):
//   A k=1 uncoupled exact-zero family of sigma = n/dd (LOWEST TERMS, n>=1) is
//   the tuning (acc_reader = -n, writer resonance r = dd, writer acc = -(dd-1)):
//   the TRUE twin pressure acc_reader + r*sigma = -n + dd*(n/dd) === 0 in real
//   arithmetic. Naming matches the round-8 guest lever: "3acc+2r=0" is
//   dd*acc + n*r = 0 at (n,dd)=(2,3); "5acc+8r=0" -> (8,5); "10acc+7r=0" -> (7,10).
//   Kernel reachability: resonance = |acc|+1 (qthe.mjs tick table.write), acc
//   from Moore-8 Repel neighbors each d<=63; STABLE engineering (every Repel
//   cell acc==0 at every tick, E-Q8 law) caps one cell's Repel mass at the
//   independence number of the Moore-8 neighbor ring = 4 cells x 63 = 252.
//   => runnable-stable space: n <= 252 (reader acc) AND dd <= 253 (writer
//   resonance via acc_A = -(dd-1)). Census still sweeps dd <= 1000 (the bound
//   this registration closes; the round-8 registration left it open) and
//   n <= 504 (the kernel's absolute |acc| ceiling), classifying the rest.
//
// SWEEP SIGMA ARMS priced here (the sweep runner must reproduce identically):
//   rat     : sigma = double(n/dd)                    (the family point)
//   irrFar  : sigma = Math.SQRT2                      (irrational, family-distant)
//   irrNear : sigma = double(n/dd + SQRT2*2**-52)     (irrational step ~1-3 ulp)
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const LANE_LOCAL = '/home/z/my-project/scripts';
mkdirSync(OUT, { recursive: true });

const S = 2 ** 32;
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };

// ── registered bounds ───────────────────────────────────────────────────────
const CENSUS_DD_MAX = 1000;   // the E-Q9 bound CLOSED here (round-8 left it open)
const CENSUS_N_MAX = 504;     // kernel absolute |acc| ceiling (8 neighbors x 63)
const STABLE_N_MAX = 252;     // stable-board Repel mass cap (4 non-adjacent x 63)
const STABLE_DD_MAX = 253;    // writer resonance cap via acc_A = -(dd-1)
const IRR_STEP = Math.SQRT2 * 2 ** -52; // the irrational step (real, ~3.14e-16)

// ── per-family class arithmetic (the exact ops the kernels run) ─────────────
// returns one row per family; classTaxonomy: A/D/B/C (+F-INV impossible by T2)
function classify(n, dd, sigmaDouble, truePressureInBand) {
  const termF = dd * sigmaDouble;                 // float kernel: resonance*sigma
  const fColl = termF === n;                      // float collapse (class-ii predicate)
  const fPressure = -n + termF;                   // exact in double (Sterbenz: |termF-n| tiny)
  const sigmaQ = Math.round(sigmaDouble * S);     // the ONE fixed-kernel float door
  const fxPressure = dd * sigmaQ - n * S;         // exact integer (< 2^53)
  const fxHold = fxPressure === 0;
  const fSign = sign(fPressure), fxSign = sign(fxPressure);
  let cls;
  if (fColl && fxHold) cls = 'D';                 // both hold (dyadic; no representation gap)
  else if (fColl && !fxHold) cls = 'A';           // E-Q8 artifact: float holds, fixed moves
  else if (!fColl && fxHold) cls = 'F-INV';       // theorem T2 says impossible
  else if (fSign === fxSign) cls = 'B';           // both move same way: planes byte-identical
  else cls = 'C';                                 // opposite signs: diverge, |dd|=2, in-band
  return { fColl, fPressure, sigmaQ, fxPressure, fxHold, fSign, fxSign, cls,
    inBand: truePressureInBand };
}

const rows = [];
let dyadicViolations = 0, fInvCount = 0;
for (let dd = 1; dd <= CENSUS_DD_MAX; dd++) {
  for (let n = 1; n <= CENSUS_N_MAX; n++) {
    if (gcd(n, dd) !== 1) continue;
    const sigma = n / dd;
    if (!(sigma < 1024)) continue;                // fixed-kernel domain guard
    const stable = n <= STABLE_N_MAX && dd <= STABLE_DD_MAX;
    const kernelReachable = n <= CENSUS_N_MAX && dd <= 505; // res=|acc|+1<=505
    // rat arm: true pressure is exactly 0 by family construction -> always in R8 band
    const rat = classify(n, dd, sigma, true);
    // irrNear arm: real sigma2 = n/dd + IRR_STEP (irrational); kernel sees the double
    const sigma2 = sigma + IRR_STEP;
    const true2 = -n + dd * (sigma + Math.SQRT2 * 2 ** -52); // = dd*SQRT2*2^-52 real
    const near = classify(n, dd, sigma2, Math.abs(true2) <= dd * 2 ** -33);
    const degenerate = sigma2 === sigma;          // step below half-ulp: kernel-blind
    // irrFar arm: sigma = SQRT2
    const far = classify(n, dd, Math.SQRT2, false);
    const trueF = -n + dd * Math.SQRT2;           // |trueF| >= 1/(dd^2*(sqrt2+n/dd)) Liouville
    const farLiouvilleMargin = Math.abs(n * n - 2 * dd * dd) / (dd * dd * (Math.SQRT2 + sigma));
    // T2 theorem: fxHold => dd | n*S => (gcd=1) dd | S => dd dyadic
    const dyadic = (dd & (dd - 1)) === 0;         // dd = 2^j
    if (rat.fxHold !== dyadic) dyadicViolations++;
    if (rat.cls === 'F-INV') fInvCount++;
    if (dyadic && !rat.fColl) dyadicViolations++; // dyadic sigma is exact => collapse
    rows.push({ n, dd, sigmaKey: `${n}/${dd}`, stable, kernelReachable, dyadic,
      rat: { cls: rat.cls, fColl: rat.fColl, fxPressure: rat.fxPressure, fSign: rat.fSign, fxSign: rat.fxSign },
      near: { cls: near.cls, fColl: near.fColl, fxPressure: near.fxPressure, degenerate, inBand: near.inBand },
      far: { cls: far.cls, fColl: far.fColl, fxPressure: far.fxPressure, fSign: far.fSign, fxSign: far.fSign,
        liouvilleMargin: farLiouvilleMargin } });
  }
}
if (dyadicViolations || fInvCount) {
  throw new Error(`eq9-census: THEOREM BROKEN dyadicViolations=${dyadicViolations} fInv=${fInvCount} — LOUD failure`);
}

// ── aggregates ──────────────────────────────────────────────────────────────
const tally = (arr, key) => arr.reduce((m, r) => { const k = key(r); m[k] = (m[k] || 0) + 1; return m; }, {});
const stableRows = rows.filter((r) => r.stable);
const census = {
  receipt: 'eq9_family_census (E-Q9 PRE-RUN, task 40-c, wave 40, lane qthe-smith)',
  generated_before: 'situations/eq9_predictions.json seal + any kernel run — pricing-first law; ZERO kernel runs, ZERO LLM calls',
  family_predicate: 'k=1 uncoupled exact-zero family of sigma=n/dd (lowest terms): acc_reader=-n, writer resonance=dd, writer acc=-(dd-1); true pressure -n+dd*(n/dd)=0. Code cited: qthe.mjs tick() (term=hit.resonance*sigma, table.write resonance=|acc|+1), fixedpoint/qthe_fixed.mjs R8 (pressure=acc*S+resonance*sigmaQ, sigmaToFixed=Math.round(sigma*2^32))',
  bounds_registered: { census_dd_max: CENSUS_DD_MAX, census_n_max: CENSUS_N_MAX,
    stable_n_max: STABLE_N_MAX, stable_dd_max: STABLE_DD_MAX,
    stable_justification: 'stable Repel engineering caps one cell mass at 4 non-adjacent Moore-8 ring cells x d<=63 = 252 (independence number of the neighbor ring); E-Q8 every-tick tuning-stability law requires acc(P)==0 at every tick',
    out_of_space_note: 'dd>505: writer resonance unhostable even unstably (|acc|<=504 kernel ceiling); 253<dd<=505: kernel-reachable only via drifting adjacent Repel cells (breaks the every-tick tuning assertion) — receipted OUT-OF-ENGINEERING-SPACE, not silently dropped; n in (252,504]: same for the reader',
    sigma_arms: { rat: 'double(n/dd) — the family point', irrFar: 'Math.SQRT2 — family-distant irrational', irrNear: 'double(n/dd + SQRT2*2^-52) — irrational step ~1-3 ulp above the family point' } },
  census_totals: { fractions_total: rows.length,
    stable_runnable: stableRows.length,
    kernel_reachable_not_stable: rows.filter((r) => r.kernelReachable && !r.stable).length,
    out_of_engineering_space: rows.filter((r) => !r.kernelReachable).length },
  stable_class_counts: {
    rat: tally(stableRows, (r) => r.rat.cls),
    near: tally(stableRows, (r) => r.near.cls),
    far: tally(stableRows, (r) => r.far.cls) },
  near_arm_degeneracy: {
    degenerate_to_rat_count: stableRows.filter((r) => r.near.degenerate).length,
    min_sigma_degenerate: stableRows.filter((r) => r.near.degenerate).reduce((m, r) => Math.min(m, r.n / r.dd), Infinity),
    note: 'the irrational step sqrt(2)*2^-52 is below half-ulp for sigma >= 4 => the double sum rounds BACK to the family point: the float kernel CANNOT see the irrational perturbation there (measured, not assumed)' },
  far_arm_theorems_measured: {
    collapse_count: stableRows.filter((r) => r.far.fColl).length,
    sign_disagreement_count: stableRows.filter((r) => r.far.fSign !== r.far.fxSign).length,
    min_liouville_margin: stableRows.reduce((m, r) => Math.min(m, r.far.liouvilleMargin), Infinity),
    max_band_r33: 253 * 2 ** -33,
    note: '|dd*sqrt2 - n| >= 1/(dd^2*(sqrt2+n/dd)) (2dd^2-n^2 is a nonzero integer) — orders above the r*2^-33 band and above any double rounding error => no collapse, full sign agreement expected' },
  guest_named_families: Object.fromEntries(['2/3', '8/5', '7/10'].map((k) => {
    const [n, dd] = k.split('/').map(Number);
    const r = rows.find((x) => x.n === n && x.dd === dd);
    return [k, { stable: r.stable, rat: r.rat, near: r.near, far: r.far }];
  })),
  theorems_asserted: {
    T2_fixed_hold_implies_dyadic: 'fxHold <=> dd in {1,2,4,8,16,32,64,128} within dd<=253 (measured 0 violations across the full census)',
    F_INV_empty: 'fixed-holds-while-float-moves is empty (0 occurrences) — fixed hold forces dyadic sigma, which the float plane represents EXACTLY',
    dyadic_implies_collapse: 'dyadic dd => fl(n/dd)=n/dd exactly => float collapse (0 violations)' },
  kernel_contact: 'NONE — sigmaToFixed/SCALE re-derived here from the R8 law (Math.round(sigma*2^32), S=2^32); the sweep runner asserts its own re-derivation against fixedpoint/qthe_fixed.mjs at run time',
};

// primary family full rows into the repo census; full table lane-local with sha
const fullTable = JSON.stringify({ generatedBy: 'eq9_family_census.mjs', bounds: census.bounds_registered, rows });
const tableSha = sha(fullTable);
writeFileSync(join(LANE_LOCAL, '40c-eq9-census-table.json'), fullTable, 'utf8');
census.full_table = { path_outside_repo: join(LANE_LOCAL, '40c-eq9-census-table.json'), rows: rows.length, sha256: tableSha,
  note: 'the sweep runner recomputes this table from the same registered bounds and asserts sha equality before its first tick' };

const json = JSON.stringify(census, null, 1);
writeFileSync(join(OUT, 'eq9_census.json'), json, 'utf8');
console.log('[eq9-census] families total(census dd<=1000,n<=504):', census.census_totals.fractions_total);
console.log('[eq9-census] stable runnable:', census.census_totals.stable_runnable,
  '| reachable-not-stable:', census.census_totals.kernel_reachable_not_stable,
  '| out-of-space:', census.census_totals.out_of_engineering_space);
console.log('[eq9-census] stable rat classes:', JSON.stringify(census.stable_class_counts.rat));
console.log('[eq9-census] stable near classes:', JSON.stringify(census.stable_class_counts.near));
console.log('[eq9-census] stable far classes:', JSON.stringify(census.stable_class_counts.far));
console.log('[eq9-census] near degeneracy:', JSON.stringify(census.near_arm_degeneracy));
console.log('[eq9-census] far arm: collapse=', census.far_arm_theorems_measured.collapse_count,
  ' signDisagreement=', census.far_arm_theorems_measured.sign_disagreement_count,
  ' minLiouvilleMargin=', census.far_arm_theorems_measured.min_liouville_margin.toExponential(3));
console.log('[eq9-census] guest families:', JSON.stringify(census.guest_named_families, null, 1));
console.log('[eq9-census] full table sha256:', tableSha);
