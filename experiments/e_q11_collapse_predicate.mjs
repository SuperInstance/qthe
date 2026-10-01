// experiments/e_q11_collapse_predicate.mjs — E-Q11: THE CLOSED-FORM A+D
// COLLAPSE-SET PREDICATE (task 46-c, wave 46, lane eq11-discharger).
//
// THE GUEST'S PARKED LEVER (verbatim from the sealed receipt, r9-q1
// next_lever — the row was max_tokens-truncated mid-sentence, that IS the
// registered text): "Closed-form sigma predicate for the A+D float-collapse
// set" — why: "E-Q9 established the artifact is family-specific (A+D =
// 90.67%, fails on B∪C) but characterized it by family membership on a swept
// grid. A closed-form predicate — e.g. a rational-arithmetic condition on
// sigma_q and the reader/writer acc-resonance pair that decides membership
// without enumeration — would convert the 90.67% from a measured fraction
// into a proven set, and would let the fleet predict collapse-set membership
// for sigma values" [receipt ends — situations/guest_rows_r9_keyed.jsonl].
//
// THE FORMULATION (this file, the deliverable):
//
//   Family point: sigma = n/dd lowest terms, reader acc = −n, writer
//   resonance r = dd, writer acc = −(dd−1) (the registered k=1 uncoupled
//   exact-zero family law, eq9_family_census.mjs). True t=1 twin pressure on
//   the reader: −n + dd·(n/dd) = 0 exactly. The kernels disagree only through
//   REPRESENTATION:
//
//     float kernel (qthe.mjs tick): term = fl(dd · fl(n/dd))  — one double
//       division, one double multiplication; pressure = −n + term, consumed
//       through its sign only (nextD). Float HOLDS at t=1 ⟺ term === n.
//
//     fixed kernel (qthe_fixed.mjs R8): pressure = −n·S + dd·sigmaQ,
//       sigmaQ = round(sigma·2^32) — the kernel's ONE declared float door.
//       Fixed HOLDS ⟺ dd·sigmaQ == n·S ⟺ dd | n·S ⟺ dd dyadic (gcd=1).
//
//   THE PREDICATE (closed form, O(1) in (n, dd), no kernel run, no board,
//   no ticks, no enumeration, and — below n,dd ≤ 2^20 — NO NATIVE FLOAT in
//   the decision path; everything below is exact BigInt IEEE-754 semantics):
//
//     R53(p/q)        := the IEEE-754 double64 nearest to the rational p/q,
//                        ties-to-even (implemented on BigInt, bit-exact).
//     E(n, dd)        := R53( dd · R53(n/dd) ) == n          [FLOAT-HOLD]
//     X(n, dd)        := dd · round(R53(n/dd)·2^32) == n·2^32 [FIXED-HOLD]
//                        (≡ dd ∈ {2^a} — dyadic — given gcd(n,dd)=1)
//     collapse A+D    := E(n, dd)                            [THE SET]
//     class(n, dd)    := E∧X → D | E∧¬X → A | ¬E∧X → F-INV |
//                        ¬E∧sign(−n+R53(dd·R53(n/dd))) ==
//                        sign(dd·sigmaQ−n·S) → B | else C
//
//   E is a condition on sigma_q and the (acc_reader, resonance) pair exactly
//   as the guest asked: acc_reader = −n and resonance = dd are the two
//   integers the condition consumes; sigma_q enters through X. Membership is
//   decidable per family without enumerating the grid or running either
//   kernel — the same status as the repo's own sigmaToFixed door
//   (round(sigma·2^32)), which the census already treats as closed
//   arithmetic.
//
// PROVENANCE LAW: the FORM was derived from committed artifacts only
// (qthe.mjs tick(), qthe_fixed.mjs R8 pressure law, eq9_family_census.mjs
// classify(), the sealed guest-named families 2/3, 8/5, 7/10, and the
// committed census/DT receipts). Implementation QA before the seal ran on
// the registered DERIVATION SUBSET dd ≤ 32 only (native bit-level
// cross-check); the full-space cross-check is sealed prediction Q5. Zero
// kernel runs, zero LLM calls, zero network in this module.
//
// Zero dependencies. Node >= 18.

const B0 = 0n, B1 = 1n, B2 = 2n;
const M52 = 1n << 52n, M53 = 1n << 53n;

// sign of (x) for BigInt
const bsign = (x) => (x > B0 ? 1 : x < B0 ? -1 : 0);

// ---------------------------------------------------------------------------
// R53 — the IEEE-754 double64 round-to-nearest-even map on positive
// rationals, exact, BigInt-only. Returns { m, e } with m ∈ [2^52, 2^53) and
// value === m · 2^(e−52). Asserts the normalized range (our domain never
// leaves it; subnormal inputs would be a LOUD error, not a silent one).
// ---------------------------------------------------------------------------
export function R53(p, q) {
  if (typeof p !== 'bigint' || typeof q !== 'bigint' || p <= B0 || q <= B0) {
    throw new RangeError('R53 expects positive BigInt p/q');
  }
  // 1) exponent: unique integer e with 2^e·q ≤ p < 2^(e+1)·q — EXACT
  //    comparisons (BigInt `<<` truncates on negative counts, so negative
  //    powers are handled by scaling p up instead; no float, no truncation).
  let e = BigInt(p.toString(2).length) - BigInt(q.toString(2).length);
  const geCond = () => (e >= B0) ? ((q << e) <= p) : ((p << (-e)) >= q);
  const ltCond = () => (e + B1 >= B0) ? (p < (q << (e + B1))) : ((p << (-(e + B1))) < q);
  while (!geCond()) e -= B1;
  while (!ltCond()) e += B1;
  // 2) mantissa: m = round-half-even( p·2^(52−e) / q )
  let num, den;
  if (e <= 52n) { num = p << (52n - e); den = q; }
  else { num = p; den = q << (e - 52n); }
  let m = num / den;
  const rem2 = (num - m * den) * B2;               // 2·rem vs den decides
  if (rem2 > den) m += B1;
  else if (rem2 === den) m += (m & B1);            // ties-to-even
  if (m === M53) { m = M52; e += B1; }             // mantissa overflow carry
  if (m < M52 || m >= M53) throw new Error(`R53 mantissa out of range: m=${m}`);
  if (e < -1073n || e > 971n) throw new Error(`R53 exponent out of normal range: e=${e}`);
  return { m, e };
}

// exact value comparison: m·2^(e−52)  vs  integer k > 0 → −1 | 0 | +1
export function cmpValueToInt(me, k) {
  const { m, e } = me;
  if (e >= 52n) {
    const v = m << (e - 52n);
    return bsign(v - k);
  }
  const kk = k << (52n - e);
  return bsign(m - kk);
}

// ---------------------------------------------------------------------------
// THE FLOAT SIDE — term = fl(dd · fl(n/dd)) as an exact rational {m,e}, the
// hold predicate E, and the sign of the float twin pressure (−n + term).
// Sterbenz makes the subtraction exact in the kernel, so sign(term − n) IS
// the sign the float kernel consumes.
// ---------------------------------------------------------------------------
export function floatTermME(n, dd) {
  const q = R53(BigInt(n), BigInt(dd));            // fl(n/dd)
  // term = dd · q̂ = (dd·m) / 2^(52−e)   (e ≤ 52 in this module's domain)
  if (q.e > 52n) {
    // general branch (unused in-domain, kept for honesty): term integer·2^(e−52)
    return R53(BigInt(dd) * q.m << (q.e - 52n), B1);
  }
  return R53(BigInt(dd) * q.m, B1 << (52n - q.e));
}
export function floatHolds(n, dd) {
  return cmpValueToInt(floatTermME(n, dd), BigInt(n)) === 0;
}
export function floatPressureSign(n, dd) {
  return cmpValueToInt(floatTermME(n, dd), BigInt(n));
}

// ---------------------------------------------------------------------------
// THE FIXED SIDE — sigmaQ = round( fl(n/dd) · 2^32 ) with Math.round's
// half-up law, exact on BigInt. fl(n/dd)·2^32 = m·2^(e−20); for e < 20 the
// rounding is round_half_up(m / 2^(20−e)) = floor((2m + 2^(20−e)) / 2^(21−e))
// (a tie lands exactly on the +1 branch, matching Math.round). For e ≥ 20
// the value is already an integer. Then pressure = dd·sigmaQ − n·S (S=2^32),
// the R8 law the fixed kernel consumes through its sign.
// ---------------------------------------------------------------------------
export const S32 = 1n << 32n;
export function sigmaQFixed(n, dd) {
  const { m, e } = R53(BigInt(n), BigInt(dd));
  if (e >= 20n) return m << (e - 20n);
  const den = B1 << (20n - e);                     // 2^(20−e)
  return ((m * B2) + den) >> (21n - e);            // floor((2m+den)/2·den…)
}
export function fxPressure(n, dd) {
  return BigInt(dd) * sigmaQFixed(n, dd) - BigInt(n) * S32;
}
export function fixedHolds(n, dd) {
  return fxPressure(n, dd) === B0;
}

// dyadic dd ⟺ fixed hold (T2): dd | n·S with gcd(n,dd)=1 ⟺ dd | 2^32
export function isDyadic(dd) {
  const d = BigInt(dd);
  return (d & (d - B1)) === B0;
}

// ---------------------------------------------------------------------------
// THE CLASSIFIER — closed form, mirrors the committed census classify()
// arithmetic (e_q9_sweep.mjs) but with ZERO native floating point.
// Returns { cls, floatHolds, fixedHolds, fSign, fxSign, sigmaQ, fxPressure,
//           termME, dyadic }.
// ---------------------------------------------------------------------------
export function classifyFamily(n, dd) {
  const termME = floatTermME(n, dd);
  const fColl = cmpValueToInt(termME, BigInt(n)) === 0;
  const fSign = cmpValueToInt(termME, BigInt(n));
  const sigmaQ = sigmaQFixed(n, dd);
  const fxP = fxPressure(n, dd);
  const fxHold = fxP === B0;
  const fxSign = bsign(fxP);
  let cls;
  if (fColl && fxHold) cls = 'D';
  else if (fColl && !fxHold) cls = 'A';
  else if (!fColl && fxHold) cls = 'F-INV';
  else if (fSign === fxSign) cls = 'B';
  else cls = 'C';
  return {
    cls, floatHolds: fColl, fixedHolds: fxHold, fSign, fxSign,
    sigmaQ, fxPressure: fxP, termME, dyadic: isDyadic(dd),
  };
}

// THE COLLAPSE-SET PREDICATE — membership in A+D, the float-collapse set.
export function collapseAplusD(n, dd) {
  return floatHolds(n, dd);
}

// ---------------------------------------------------------------------------
// THE PREDICTED ROW SHAPE — from (n, dd) alone, the committed rat-arm row
// fields the t=1 twin event must produce (obs taxonomy of e_q9_sweep.mjs):
//   A → DIV1-A, fd 1, nc 1, bi false, cls [SIGMA-REPRESENTATION], dds [fxSign]
//   B → IDENTICAL-MOVE, fd −1, nc 0, bi true, cls [], dds []
//   C → DIV1-C, fd 1, nc 1, bi false, cls [QUANTIZATION-BLINDNESS],
//       dds [2·fxSign]   (fixed−float = fxSign − fSign = 2·fxSign)
//   D → IDENTICAL-HOLD, fd −1, nc 0, bi true, cls [], dds []
// (16-tick byte-identity for B/D is the kernel-receipted E3/E5 law, not
// re-derived here — the predicate is the t=1 twin-pressure sign law.)
// ---------------------------------------------------------------------------
export function predictRowFields(n, dd) {
  const c = classifyFamily(n, dd);
  switch (c.cls) {
    case 'A': return { obs: 'DIV1-A', fd: 1, nc: 1, bi: false,
      cls: ['SIGMA-REPRESENTATION'], dds: [c.fxSign] };
    case 'B': return { obs: 'IDENTICAL-MOVE', fd: -1, nc: 0, bi: true, cls: [], dds: [] };
    case 'C': return { obs: 'DIV1-C', fd: 1, nc: 1, bi: false,
      cls: ['QUANTIZATION-BLINDNESS'], dds: [2 * c.fxSign] };
    case 'D': return { obs: 'IDENTICAL-HOLD', fd: -1, nc: 0, bi: true, cls: [], dds: [] };
    default: return { obs: 'DIV1-FINV', fd: 1, nc: 1, bi: false,
      cls: ['FIXED-BLIND-INVERSION'], dds: [-c.fSign] };
  }
}

// ---------------------------------------------------------------------------
// NATIVE CROSS-CHECK HELPERS (used by the eval and the pre-seal subset QA —
// these DO use native doubles; they are the mirror, never the decision path).
// ---------------------------------------------------------------------------
const f64 = new Float64Array(1);
const u64 = new BigUint64Array(f64.buffer);
export function nativeBits(x) {
  f64[0] = x;
  return u64[0];
}
export function bitsToNumber(bits) {
  u64[0] = bits;
  return f64[0];
}
// rebuild the exact double of {m,e} as a bit pattern (normalized)
export function meToBits(me) {
  const { m, e } = me;
  const exp = Number(e) + 1023;
  if (exp <= 0 || exp >= 2047) throw new Error(`meToBits non-normal exponent ${exp}`);
  return (BigInt(exp) << 52n) | (m - M52);
}
// the committed census classify(), replicated natively (the mirror)
export function nativeClassify(n, dd) {
  const sigmaDouble = n / dd;
  const termF = dd * sigmaDouble;
  const fColl = termF === n;
  const fPressure = -n + termF;
  const sigmaQ = Math.round(sigmaDouble * 2 ** 32);
  const fxPressure = dd * sigmaQ - n * 2 ** 32;
  const fxHold = fxPressure === 0;
  const fSign = Math.sign(fPressure), fxSign = Math.sign(fxPressure);
  let cls;
  if (fColl && fxHold) cls = 'D';
  else if (fColl && !fxHold) cls = 'A';
  else if (!fColl && fxHold) cls = 'F-INV';
  else if (fSign === fxSign) cls = 'B';
  else cls = 'C';
  return { cls, fColl, fxHold, fSign, fxSign, sigmaQ, fxPressure };
}
