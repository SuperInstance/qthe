# E-Q12 VERDICT — the k-family closed-form extension DISCHARGED (cascade half re-parked with receipt)

Run: task 47-a, wave 47 · evaluator `experiments/e_q12_eval.mjs` (registered runner) · predicate `experiments/e_q12_kfamily_predicate.mjs` (imports E-Q11's sealed machinery, does not fork it) · 12 pins ALL HARD (incl. the predictions file `dea66269…`, the module `f9be255c…`, the pre-seal QA `68ef1f11…`, and every consumed committed artifact). Registration sealed PRE-RUN at `59dc015`. Zero kernel runs. Full reachable k-space enumerated: **254,520 triples** (k 1..504, gcd(n,dd)=1, kn≤504, kdd≤505).

## Headline

**10/10 arithmetic claims PASS — the k-half of the guest's second parked lever DISCHARGES.** The float-collapse set is **NOT k-invariant under odd scaling**: **3,546 flips** sealed in `e_q12_flip_registry.json`, in BOTH directions — **LOST 2,462** (A → B/C: scaling kills the float-only artifact) and **GAINED 1,084** (B/C → A: scaling creates it) — while the fixed plane is exactly k-invariant (T-K2: `fxPressure_k == k·fxPressure_1`, 0 violations over all 254,520 triples; fxHold ⟺ dyadic; fxSign invariant), powers of two are INVISIBLE (T-K3: class and E at k == at oddPart(k), 0 violations), F-INV is empty at every k (T-K4), the k=1 module IS the sealed E-Q11 predicate (0 equivalence mismatches over 306,773 pairs; counts + regions EXACT), the three guest-named families behave exactly as registered (**7/10 dies at the 9-scaled coupled tuning — flips A→B exactly at k ∈ {9,17,18,33,34,35,36}**; 2/3 and 8/5 never flip), every committed payload lies on a k=1 line (P8: row artifacts carry no cell payloads; e_q7 cells at (−2,3)/sigma 2/3; e_q8 families 2/3{accA=−2}, 8/5{accA=−4}; slot20Occupant resonance 9 = |acc|+1 twin direction; zero k≥2 tunings anywhere), and the per-k closed form **D_k = ⌊504/k⌋ + J_k·⌈⌊504/k⌋/2⌉ (J_k = #{j ≥ 1 : 2^j ≤ ⌊505/k⌋}) matches direct enumeration for ALL k 1..504**, with the k=1 census-box corollary D_full = 2,772 EXACT.

The cascade half stays **RE-PARKED** with its committed-byte receipt (P10): all four E-Q7 CASCADE pairs show radius@256 = 64, inversion@256 = 0/4064, deltaCount 1631 → 97 → 97 (64/128/256) with deltaCount@64 > 10× deltaCount@128 — a STABLE RECEDING REMNANT, awaiting the next lever's well-posed formulation.

## Predictions vs results

| # | claim (p) | result | verdict |
|---|---|---|---|
| P1 | k=1 reproduction (0.95) | 0 mismatches; counts/regions EXACT | **PASS** |
| P2 | T-K2 fixed k-invariance (0.99) | 0 violations / 254,520 triples | **PASS** |
| P3 | T-K3 2-adic reduction (0.98) | 0 violations | **PASS** |
| P4 | T-K4 F-INV empty ∀k (0.99) | 0 occurrences | **PASS** |
| P5 | flip registry nonempty (0.99) | 3,546 flips | **PASS** |
| P6 | both directions (0.97) | LOST 2,462 / GAINED 1,084 | **PASS** |
| P7 | guest-family scalings (0.97) | 7/10 flips exactly at {9,17,18,33,34,35,36} | **PASS** |
| P8 | committed record k=1 line scan (0.92) | all four artifacts k=1-only | **PASS** |
| P9 | per-k closed form (0.93) | 504/504 EXACT; D_full 2,772 | **PASS** |
| P10 | cascade re-park receipt (0.98) | 4/4 remnant arithmetic OK | **PASS** |
| P11 | deepseek odd-k cross-check, AS SAID (0.60) | delivered; engages odd-k via single-vs-double rounding | **TRUE** (registered event) |

Brier: P1–P10 mean **0.00167**; all eleven events **0.01606**. Falsifier (any of P1–P10 FAIL) did not fire.

## P11 — the independent reasoner, AS SAID (informational)

One sanctioned call (gateway `deepseek-flash`, finish=length at the 2000-token cap — content sealed AS SAID up to truncation, raw receipted at `experiments/outputs/e_q12_p11_raw.json`, 2,198 tokens). The seat independently identified the load-bearing mechanism: **A_k = fl(k·dd·r) is a SINGLE rounding of the exact product (k·dd)·r, whereas fl(k·A) would round twice — so scaled behavior is not "multiply the unscaled error by k"**. That is precisely why the fixed plane (which consumes pressure through k-linear algebra) is k-invariant while the float plane flips. Substantive agreement on mechanism; the enumeration's 3,546 flips (both directions) and the per-k closed forms are the sealed contribution the derivation could not reach.

## Honest limits

- The k-space is the registered reachable box (kn ≤ 504, kdd ≤ 505); "reachable" is the kernel-ceiling law from the committed registrations, not a claim about all (n, dd, k).
- P11 is one prompt at temperature 0, truncated at the cap — a calibration probe, not a benchmark.
- The eval's first draft had two field-shape bugs (kReach returns bounds; 8/5's registered accA is −4 with the |n| payload 8 carried by pB) — caught by the pins and claim texts refusing to match, fixed pre-verdict; the committed artifacts never moved.
- `e_q12_flip_registry.json` is generated at run time from committed arithmetic (the registration's P5 text calls it "committed" meaning sealed-by-this-eval; the registry tip rides the results file).

## Aftermath

- The k-extension converts the E-Q11 predicate from a k=1 theorem into a family of them: the fleet can now predict, per tuning scale, whether a float-only artifact survives — with 7/10's death at k=9 as the registered worked example.
- E-Q13 seeds: the cascade remnant's well-posed formulation (the guest's pricing), and the flip registry's structure (2,462/1,084 asymmetry vs the binade map).
- Receipts: `e_q12_results.json` (+ tip), `e_q12_flip_registry.json`, `e_q12_perk_counts.json`, `e_q12_p11_raw.json` (+ content), all committed with this verdict.
