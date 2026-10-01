// experiments/e_q12_kfamily_predicate.mjs — E-Q12: THE A-CLASS CLOSED FORM
// UNDER k ≠ 1 SCALED (COUPLED) FAMILY LINES (task 47-a, wave 47, lane
// eq12-discharger).
//
// THE PARKED LEVER (verbatim from the committed aftermath,
// situations/eq11_verdict.md): "E-Q12 seeds (parked): cascade terminal
// semantics (the guest's second lever), and the A-class closed form's
// behavior under k ≠ 1 coupled families." THIS LANE REGISTERED THE k-HALF.
//
// THE k DEFINITION IS THE REPO'S OWN (situations/eq9_predictions.json,
// open_variables_closed_here.family_bound, verbatim): "151,686 are beyond
// kernel reach at k=1 (dd > 505 makes the writer resonance |acc|+1
// unhostable). k >= 2 family lines (scaled tunings of the same sigma) are
// OUT OF SCOPE by registration: the round-8 lever names k=1 lines and E-Q8
// ran k=1." — E-Q12 discharges exactly that parked out-of-scope space.
//
// THE k-FAMILY LAW (scaling the committed k=1 family law,
// eq9_family_census.mjs, by the integer k ≥ 1):
//
//   sigma = n/dd (LOWEST TERMS, unchanged — the SAME sigma, scaled tuning)
//   reader acc   = −k·n      (kernel |acc| ceiling 504  → k·n ≤ 504)
//   writer res   = k·dd      (resonance = |acc|+1 ≤ 505 → k·dd ≤ 505)
//   writer acc   = −(k·dd−1)
//   true twin pressure: −k·n + k·dd·(n/dd) = 0 exactly (k-invariant truth)
//
//   float kernel (qthe.mjs tick): term = fl(k·dd · fl(n/dd)) — still ONE
//     double multiplication; pressure = −k·n + term, consumed via sign.
//     Float HOLDS at t=1 ⟺ term === k·n.
//
//   fixed kernel (qthe_fixed.mjs R8): pressure = (−k·n)·S + (k·dd)·sigmaQ
//     = k·(dd·sigmaQ − n·S) — EXACT integer identity (sigmaQ is the ONE
//     float door and is unchanged by k): fxHold_k ⟺ dd dyadic, fxSign_k =
//     fxSign_1 — THE FIXED PLANE IS EXACTLY k-INVARIANT.
//
// THE PREDICATES (closed form, O(1) per (n,dd,k); BigInt-only decision
// path — the E-Q11 sealed machinery is IMPORTED, not forked):
//
//   E_k(n, dd)   := R53( k·dd · R53(n/dd) ) == k·n       [FLOAT-HOLD at k]
//   X_k          := k·(dd·sigmaQ − n·S) == 0 ⟺ X_1       [FIXED-HOLD at k]
//   class_k      := E_k∧X→D | E_k∧¬X→A | ¬E_k∧X→F-INV |
//                   ¬E_k∧fSign_k==fxSign_k→B | else C
//
// REGISTERED THEOREM OBJECTS (verified by enumeration in the eval, not
// assumed):
//   T-K2 (fixed k-invariance):   fxHold_k ⟺ dyadic(dd); fxSign_k = fxSign_1;
//                                fxPressure_k == k·fxPressure_1 (exact).
//   T-K3 (2-adic reduction):     E_{2^j·m}(n,dd) ⟺ E_m(n,dd) for odd m —
//                                scaling by a power of two is INVISIBLE
//                                (R53 commutes with exact ×2^j scaling).
//   T-K4 (F-INV empty ∀k):       dyadic dd ⟹ fl(n/dd) exact ⟹ E_k true.
//   The open question P5: does E_k ≡ E_1 hold for ODD k ≥ 3? (The A-class
//   is a half-ulp tie law; odd scaling moves the target k·n across binades
//   while the representation error k·Δ scales linearly — flips are possible
//   in BOTH directions a priori. The eval enumerates the ENTIRE reachable
//   k-space and seals the flip registry either way.)
//
// REACHABILITY LAW at k (from the kernel ceilings, cited above):
//   reachable: k·n ≤ 504 ∧ k·dd ≤ 505   stable: k·n ≤ 252 ∧ k·dd ≤ 253
//   (the k=1 stable caps — reader Repel mass ≤ 252, writer |acc| ≤ 252 —
//   scale to the k-tuning; n ≥ 1, dd ≥ 1, gcd(n,dd)=1, sigma < 1024.)
//
// PROVENANCE LAW: derived from committed artifacts only (the k definition
// verbatim eq9_predictions.json; the family law eq9_family_census.mjs; the
// kernel laws as cited+committed in e_q11_collapse_predicate.mjs, whose
// R53/cmpValueToInt/sigmaQFixed/fxPressure are imported here). Zero kernel
// runs, zero LLM calls, zero network in this module. Zero dependencies.
// Node >= 18.

import {
  R53, cmpValueToInt, sigmaQFixed, isDyadic,
} from './e_q11_collapse_predicate.mjs';

export const S32 = 1n << 32n;
const B0 = 0n, B1 = 1n;

// ---------------------------------------------------------------------------
// REACHABILITY at scaling k (registered law, integers)
// ---------------------------------------------------------------------------
export function kReach(k) {
  return { nMax: Math.floor(504 / k), ddMax: Math.floor(505 / k) };
}
export function kStable(k) {
  return { nMax: Math.floor(252 / k), ddMax: Math.floor(253 / k) };
}
export function oddPart(k) {
  let m = k;
  while (m % 2 === 0) m /= 2;
  return m;
}
export function isPow2(k) { return (k & (k - 1)) === 0; }

// ---------------------------------------------------------------------------
// THE FLOAT SIDE AT k — term = fl(k·dd · fl(n/dd)) as exact {m,e}; the hold
// predicate E_k; the sign of the float twin pressure (−k·n + term). The
// kernel consumes the pressure's sign through nextD; Sterbenz keeps the
// subtraction exact, so sign(term − k·n) IS the consumed sign.
// ---------------------------------------------------------------------------
export function floatTermMEK(n, dd, k) {
  const q = R53(BigInt(n), BigInt(dd));            // fl(n/dd) — k-invariant door
  if (q.e > 52n) {
    // general branch (out of our registered domain; kept for honesty)
    return R53(BigInt(k * dd) * q.m << (q.e - 52n), B1);
  }
  return R53(BigInt(k) * BigInt(dd) * q.m, B1 << (52n - q.e));
}
export function ekFloatHolds(n, dd, k) {
  return cmpValueToInt(floatTermMEK(n, dd, k), BigInt(k) * BigInt(n)) === 0;
}
export function ekFloatSign(n, dd, k) {
  return cmpValueToInt(floatTermMEK(n, dd, k), BigInt(k) * BigInt(n));
}

// ---------------------------------------------------------------------------
// THE FIXED SIDE AT k — pressure = (−k·n)·S + (k·dd)·sigmaQ computed
// DIRECTLY from the R8 law at the scaled tuning (scratch form, NOT via the
// k·factorization), so the eval's k-invariance identity check
// (fxPressureK == k·fxPressure_1) is a real two-sided test.
// ---------------------------------------------------------------------------
export function fxPressureK(n, dd, k) {
  return BigInt(k * dd) * sigmaQFixed(n, dd) - BigInt(k * n) * S32;
}
export function fxHoldK(n, dd, k) { return fxPressureK(n, dd, k) === B0; }
export function fxSignK(n, dd, k) {
  const p = fxPressureK(n, dd, k);
  return p > B0 ? 1 : p < B0 ? -1 : 0;
}

// ---------------------------------------------------------------------------
// THE CLASSIFIER AT k — mirrors the committed census taxonomy (A/D/B/C +
// F-INV) at the scaled tuning. BigInt-only decision path.
// ---------------------------------------------------------------------------
export function classifyFamilyK(n, dd, k) {
  const termME = floatTermMEK(n, dd, k);
  const fColl = ekFloatHolds(n, dd, k);
  const fSign = ekFloatSign(n, dd, k);
  const fxP = fxPressureK(n, dd, k);
  const fxHold = fxP === B0;
  const fxSign = fxP > B0 ? 1 : fxP < B0 ? -1 : 0;
  let cls;
  if (fColl && fxHold) cls = 'D';
  else if (fColl && !fxHold) cls = 'A';
  else if (!fColl && fxHold) cls = 'F-INV';
  else if (fSign === fxSign) cls = 'B';
  else cls = 'C';
  return { cls, floatHolds: fColl, fixedHolds: fxHold, fSign, fxSign,
    fxPressureK: fxP, termME, dyadic: isDyadic(dd), k };
}

// THE COLLAPSE-SET PREDICATE AT k — membership in A_k+D_k.
export function collapseAplusDK(n, dd, k) { return ekFloatHolds(n, dd, k); }

// ---------------------------------------------------------------------------
// NATIVE MIRROR (never the decision path) — the scaled census classify(),
// natively: term = (k·dd)·double(n/dd), fxPressure via sigmaQ (Math.round
// door), same taxonomy. Used for the BigInt-vs-native cross-checks.
// ---------------------------------------------------------------------------
export function nativeClassifyK(n, dd, k) {
  const sigmaDouble = n / dd;
  const termF = k * dd * sigmaDouble;
  const fColl = termF === k * n;
  const fPressure = -k * n + termF;
  const sigmaQ = Math.round(sigmaDouble * 2 ** 32);
  const fxP = k * dd * sigmaQ - k * n * 2 ** 32;
  const fxHold = fxP === 0;
  const fSign = Math.sign(fPressure), fxSign = Math.sign(fxP);
  let cls;
  if (fColl && fxHold) cls = 'D';
  else if (fColl && !fxHold) cls = 'A';
  else if (!fColl && fxHold) cls = 'F-INV';
  else if (fSign === fxSign) cls = 'B';
  else cls = 'C';
  return { cls, fColl, fxHold, fSign, fxSign, sigmaQ, fxPressure: fxP };
}

// ---------------------------------------------------------------------------
// ENUMERATORS over the registered k-space. gcd is the caller's (each
// fraction must be lowest terms; we enumerate and filter with our own
// integer gcd here to keep this module self-contained on that one helper).
// ---------------------------------------------------------------------------
export function gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }
// all (n,dd) reachable at scaling k, lowest terms, sigma < 1024
export function* reachablePairs(k) {
  const { nMax, ddMax } = kReach(k);
  for (let dd = 1; dd <= ddMax; dd++) {
    for (let n = 1; n <= nMax; n++) {
      if (gcd(n, dd) !== 1) continue;
      yield [n, dd];
    }
  }
}
export function countReachable(k) {
  let c = 0;
  for (const _ of reachablePairs(k)) c++; // eslint-disable-line no-unused-vars
  return c;
}
