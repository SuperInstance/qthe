# E-Q11 VERDICT — the guest's parked lever (closed-form A+D collapse-set predicate) DISCHARGED

Run: task 46-c, wave 46 · evaluator `experiments/e_q11_eval.mjs` (registered runner) · predicate module `experiments/e_q11_collapse_predicate.mjs` · all pins hard (6 files, incl. the predicate's full sealed sha `d4c3e54b…` — byte-verified). Zero kernel runs, zero board ticks. Registration sealed PRE-RUN at `e212dbf`; this verdict consumes committed result sets only.

## Headline

**8/8 arithmetic claims PASS — the parked lever DISCHARGES.** `E(n,dd) := R53(dd·R53(n/dd)) == n` (BigInt-only IEEE-754 semantics, O(1) per family point) is the closed-form A+D collapse-set predicate the guest asked for: it reproduces the committed E-Q9 record **byte-exactly** — membership on all 38,911 rat-arm rows (0 mismatches), the four-class partition with stable counts A 34,144 / B 1,729 / C 1,904 / D 1,134 / F-INV 0 (EXACT), the six observed row fields from (n,dd) alone (0 differ), the ¬E complement == committed B∪C (3,633 keys, byte-identical), full-box implementation independence (0 BigInt-vs-native disagreements across all 306,773 gcd pairs), region sizes 38,911 / 116,176 / 151,686 (EXACT), **D_full = 2,772 = 504 + 9·252 dyadic families (closed form, EXACT)**, F-INV_full = 0, dyadic ⟹ collapse with 0 violations, and the stable-box collapse fraction 35,278/38,911 = 0.90662… — **the committed 90.67% prose is now a proven set, not a measured fraction.** The E-Q10 hook holds: the committed runner packs only tau ∈ {1,2} (zero `packByte(3,…)`, wormhole path never fires, sigma never enters), all 17 admissible trials firstZeroTick == 105 == 50 + 55 — the predicate is correctly SILENT on the armor ring.

## Predictions vs results

| # | claim (p) | result | verdict |
|---|---|---|---|
| Q1 | collapse membership, 0 mismatches (0.93) | 38,911/38,911 | **PASS** |
| Q2 | four-class partition + exact counts (0.90) | 0 mismatches; counts EXACT | **PASS** |
| Q3 | six-field byte reproduction (0.85) | 38,911/38,911 rows, 0 differ | **PASS** |
| Q4 | ¬E == B∪C byte-identity (0.93) | 3,633 keys, byte-identical | **PASS** |
| Q5 | full-box BigInt == native (0.82) | 306,773 pairs (EXACT), 0 disagreements | **PASS** |
| Q6 | region sizes + D_full + F-INV + fraction (0.95) | all EXACT | **PASS** |
| Q7 | primary + DT byte values (0.97) | sigmaQ 2863311531 / 6871947674 / 3006477107; fxPressure +1/+2/−2; classes A/A/A | **PASS** |
| Q8 | E-Q10 sigma-inertness hook (0.99) | tau ⊆ {1,2}, 0 packByte(3,…), 17/17 firstZeroTick 105 | **PASS** |
| Q9 | independent derivation cross-check, AS SAID (0.60) | parseable explicit condition delivered; **substantive DISAGREEMENT receipted** (below) | **TRUE** (registered event) |

Brier: Q1–Q8 mean **0.009775**; all nine registered events (Q9 included) mean **0.02647**. Falsifier (any Q1–Q8 FAIL) did not fire.

## Q9 — the independent reasoner's derivation, scored AS SAID (informational)

The deepseek seat (gateway `deepseek-flash`, finish=stop, 379 tokens, raw receipted at `experiments/outputs/e_q11_q9_raw.json`, sha `24c02d6b…`) derived: **"d is a power of 2 and ν₂(d) ≤ 53 + ν₂(n)"** — the dyadic-only set. That is a STRICT SUBSET of the verified predicate: it captures every D-class case but EXCLUDES the A-class (sigma-representation collapse on non-dyadic dd). Counterexamples to its necessity claim, checked natively: `3*(2/3)===2`, `7*(5/7)===5`, `5*(3/5)===3` — all true; dd = 3, 7, 5 are not powers of two. The model's mechanism ("if d has any odd factor > 1, the roundoff cannot be canceled by multiplication by d") is the plausible-but-wrong half-truth: the product's final rounding CAN round back to n within half an ulp — which is precisely the A-class the committed census observed as DIV1-A / [SIGMA-REPRESENTATION].

**Reading:** the guest's lever is discharged by arithmetic that is strictly stronger than an independent reasoner's first-principles derivation — the closed form's A-class is genuinely non-obvious. The reasoner independently rediscovered the dyadic (T2/fixed-kernel) core and missed the float-representation class our predicate proves.

## Honest limits

- The census box is n ≤ 504, dd ≤ 1000 (registered bounds); outside it, R53's exponent/mantissa asserts would fire LOUD (subnormal/overflow), not silently — the predicate's domain is the registered box by construction.
- Q9 is n=1, one prompt, temperature 0 — a calibration probe, not a model benchmark; its disagreement is receipted AS SAID and does not touch Q1–Q8.
- The eval's own first draft hashed PATH STRINGS instead of file contents (caught by the pins refusing to match the committed bytes' real hashes; two field-name/slice bugs in Q5/Q8 also caught and fixed pre-verdict). The pins then verified HARD, including the predicate's sealed full sha. Runner bugs were ours; the committed artifacts never moved.

## Aftermath

- The 90.67% is a proven set. E-Q12 seeds (parked): cascade terminal semantics (the guest's second lever), and the A-class closed form's behavior under k ≠ 1 coupled families.
- Receipts: `experiments/outputs/e_q11_results.json` (+ `.sha256` tip), `e_q11_q9_raw.json` (+ `.sha256`, + content), committed with this verdict.
