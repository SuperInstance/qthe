# fixedpoint/findings.md — THE NO-FLOATS PLANE (R8), priced

Wave 34, lane 34-b (kernel-smith; conformance run completed by the keeper after
the lane's context deadline). Answers DeepSeek guest review **R5 (CRITICAL):
"resonance·log2(3) is irrational and breaks the no-floats plane"** — jointly
pointed at by E-Q2's finding that sigma is a monotone engineering knob.

**Everything below was priced BEFORE the run** in `pre_registration.json`
(c4f7e76) + `pre_registration_amendment_1.json` (amended A6 scanner law only).
The run may confirm or falsify; it may not edit. Honest FAILs stay standing.

## The representation law (R8)

S = 2^32; sigma_q integer S-units; round-half-toward-+Inf at the ONE inbound
boundary door (`sigmaToFixed`, caller-side); refuse-loudly overflow (sigma_q ∈
[0,2^42), |resonance| ≤ 2^20); all tick intermediates proven < 2^53; twin term
= resonance·sigma_q, an integer — **the one declared representation
difference**. `DEFAULT_SIGMA_Q = 6807362106` is a baked integer literal; the
log2 builtin appears nowhere in the kernel file (comments included).

## Final scoreboard (run C, chain rows 14–19)

| Floor | Verdict | Numbers |
|---|---|---|
| F_A A1 pack/unpack/psi | PASS | 256/256 byte-identical + PSI identity |
| F_A A2 vectorPass | PASS | 34,816 envelope + 64 random rows, all exact-integer identical |
| F_A A3 nextD | PASS | 448 points identical |
| F_A A4 mulberry32/makeSubstrate | PASS | 4 seeds × 10,000 draws + 24×16 substrate identical |
| F_A A5 SIGN GRID | **PASS** | 9,081 points (acc∈[−504,504] × 9 arms): **EXACTLY ONE** disagreement, precisely the frozen one — (2/3, acc=−2): float class 0 (−2+3·double(2/3)===0), fixed class +1 |
| F_A A6 static hygiene | PASS | zero Math.random/log2, only Math.abs, zero float literals, single division inside sigmaFromFixed, tick body slash-free (amended law) |
| F_B P-B1 zero divergence | **FALSIFIED on 1.6 and 0.7** | 1.6: 7/8 seeds diverge (first ticks 3–82); 0.7: 7/8 (first ticks 1–54); 0.5/1/log2(3)/2/4/default: **ZERO divergence, 8 seeds × 400 ticks, trace-identical** |
| F_B P-B2 cooker | **PASS (exact)** | tick-1: one twin event (5,5) slot 7 resonance 3 both kernels; float term === 2, fixed term === 8589934593 (2S+1, ONE S-unit); float B.d holds 7, fixed B.d = 8; A.d = 6 both; slot 7 LWW {5,5,3} both; divergence ABSORBS through T=6 |
| F_B P-B3 2/3 rule | CONFIRMED | 8/8 random substrates diverge early (ticks 3–17) |
| F_B P-B4 term band | PASS | 2,085,522 paired twin events, 0 violations |
| F_B P-B5 absorbing | CONFIRMED | every divergence persists to T ( cooker asserted; randoms: divergedTicks = T−first+1) |
| F_C determinism | PASS | 20/20 fresh-build rerun-hash identical (`e4f1d36a…`); seed 34101 differs; G5 schedule reproduced exactly, terms 1·6807362106, totalWrites 12 |
| F_D BigInt shadow | PASS | 1,600 tick comparisons (4 seeds × 4 arms × 100), Number == BigInt byte-for-byte including terms |
| **F_E breachClosed** | **FALSE** | R5 answer routes to frozen honest_alternative #1: **closed with measured cost** |

## The P-B1 falsification — what the run found (autopsy: `outputs/f_b_autopsy.json`)

The registration predicted zero divergence on 1.6/0.7 via a sign-margin
argument. The argument priced the **coupled** grid (r = |acc|+1, where the
sign boundary sits at acc = ±2 with margins ≥ 0.1). The kernel's twin pressure
is **uncoupled**: reader-acc × writer-resonance are independent. The uncoupled
space contains **exact-zero real-pressure families** for rational sigma:

- σ = 8/5 (1.6): 5·acc + 8·r = 0 → (−8,5), (−16,10), (−32,20), (−56,35), (−64,40)…
- σ = 7/10 (0.7): 10·acc + 7·r = 0 → (−7,10), (−14,20), (−21,30), (−42,60), (−70,100)…
- σ = 2/3: 3·acc + 2·r = 0 → (−38,57), (−96,144), (−30,45), (−34,51)…

**All 23 diverged (arm, seed) first-divergence cases are exact-zero family
hits — 22/23 with `floatP === 0` EXACTLY** (the 23rd is 0.7/seed 34004 at
t=1 through a same-tick write→read chain, also a family hit). At these
points the float kernel's double rounding collapses its own σ's true nonzero
pressure to === 0 (cell holds), while the fixed kernel keeps the honest
remainder (±2…48 S-units) and moves. **In every case the fixed kernel's
direction is faithful to its own bridge scale and the float kernel deviates
from its own** — e.g. 1.6: double(1.6) > 8/5 ⇒ true pressure > 0 at family
points, yet float holds; 0.7: double(0.7) < 7/10 ⇒ true < 0, yet float holds.
The "divergence cost" is real by the frozen comparison law, but it is the
FLOAT kernel's rounding artifact, not the fixed kernel's error.

The term band (P-B4) is untouched by all of this — it prices the term
(resonance·σ) alone, which stays in-band everywhere; the collapse bites in
the pressure SUM (acc·S + term), where exact cancellation meets two
approximations of the same irrational.

## R5's answer (per the frozen F_E rule)

**The no-floats breach is CLOSED WITH MEASURED COST.** An integer-only path
exists end-to-end for a full tick (F_A + F_C + F_D all pass; the only float
touch is the caller-side boundary door). The measured cost: **ZERO** on every
sigma the data has swept or defaulted to (0.5, 1, log2(3), 2, 4, default —
trace-identical planes over 8 seeds × 400 ticks); exactly **ONE S-unit** at
the single pre-registered coupled boundary (2/3, acc=−2); and the uncoupled
exact-zero families above for adversarial rational sigmas engineered between
the double and the quantized scale — where the fixed plane is the *more*
faithful of the two. Sigma was already an engineering knob (E-Q2); it is now
an exact integer one, with its cost priced to the S-unit.

## Provenance

- Kernel: `qthe_fixed.mjs` (b7e6b23 + comment-only erratum ecb5cad).
- Registration: `pre_registration.json` c4f7e76 + amendment (A6 scanner law).
- Harness: `conformance.mjs` (this lane), probe: `probe_divergence.mjs`
  (v2, exact at-read reconstruction), seal: `seal_chain.mjs`.
- Outputs: `outputs/f_a_results.json`, `f_b_results.json`, `f_c_results.json`,
  `f_d_results.json`, `f_e_verdict.json`, `f_b_autopsy.json`.
- Chain: `receipts/fixedpoint_chain.jsonl` — 24 rows, verified from disk,
  tip `a7f7a55291575476ca5241cacf2233bbf7180d934797e62038970426d4a4f05b`.
  Rows 1–19 = three battery runs (A: scanner coordinate defect visible in its
  A6 field — a harness bug, not a kernel violation; B: accidental duplicate
  execution during debugging; C: final). Rows 20/22 + correction rows document
  keeper slips (two stray empty rows, 21 and 23 — append-only, documented,
  never rewritten).
- Keeper defects found and fixed in-harness (not floors, not kernel):
  A6 scanner coordinate mismatch; PRESS syntax; two chain-append slips.
