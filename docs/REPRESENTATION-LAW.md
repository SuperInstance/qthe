# qthe — The Representation Law: what it costs to stay exact

> The R8 law made operational. R8 is the no-floats plane, registered in
> `fixedpoint/pre_registration.json` (c4f7e76, repo at registration `0b98db8`,
> kernel commit `b7e6b23`) and amended once before any run
> (`fixedpoint/pre_registration_amendment_1.json`, sha256
> `8fe1f54d474c24848cc5032feed21125ec18b867c2ddaa1335a9074b04ef3a19` — the
> A6 scanner law only; kernel unchanged). This document states the law, the
> measured conformance record behind it, the falsification the run produced,
> the priced cost of obeying it, and the decision rules for downstream
> consumers and porters. Docs-layer artifact, Task ORCH-A (roadmap phases 26
> and 31). Chain of record: `fixedpoint/receipts/fixedpoint_chain.jsonl` —
> 24 rows, verified from disk, tip
> `a7f7a55291575476ca5241cacf2233bbf7180d934797e62038970426d4a4f05b`
> (`fixedpoint/findings.md`; `docs/KNOWLEDGE-MAP.md` "Receipts of record").
> Note: `fixedpoint/receipts/chain_tip.txt` carries
> `61e723d41268e8ce0f7f8d0c859705832fc3cd05c0a1a8526853254c420247fb` — the
> tip of the chain at row 19, i.e. the final-run (run C) state written by
> `conformance.mjs`; the append-only provenance/correction rows (20/22/24)
> moved the verified tip forward without refreshing that file (prefix
> re-verified with the stone during this doc task).

## What this document is

The house was asked a hard question by its own guest: DeepSeek review R5
(CRITICAL, `situations/guest_rows.jsonl` call 5-R5-resonance-sigma-sweep) —
*"resonance·log2(3) is irrational and breaks the no-floats plane."* The
observation was correct: the float kernel's twin term is
`resonance * Math.log2(3)`, a double times an irrational, inside a substrate
whose SPEC promises "exact integer arithmetic … no floats in LAYER 0". The
answer could not be a quiet patch, because E-Q2 had already shown σ is a
monotone-inert engineering knob on every class the data swept (C3 honest
null, chain tip `67e849a5…`, 14 links) — so quantizing σ costs nothing any
measured dynamics ever visited, and the whole question becomes: **what,
exactly, does it cost?** The fixedpoint lane registered the floors before
the run, ran the battery, falsified one of its own predictions, and routed
the verdict through the pre-frozen honest-alternative rule. The result is a
law with a measured price tag, to the S-unit. This document is that price
tag, made operational for people who just want to know which kernel to
import and what they are signing up for.

## The two planes

There are exactly two sealed kernels, and they differ in one declared way.

| | float plane | fixed plane |
|---|---|---|
| file | `qthe.mjs` | `fixedpoint/qthe_fixed.mjs` |
| σ representation | `DEFAULT_SIGMA = Math.log2(3)`, an IEEE-754 double evaluated at runtime | `DEFAULT_SIGMA_Q = 6807362106`, a baked integer literal; the log2 builtin appears nowhere in the file |
| scale | real units | S = 2^32; kernel-state σ is the integer σ_q = σ·S |
| twin term | `resonance * sigma` (a float) | `resonance * sigma_q` (an integer in S-units) — **the one declared representation difference** |
| float doors | σ itself | exactly ONE inbound door (`sigmaToFixed`, caller-side, boundary-only) + one outbound diagnostic door (`sigmaFromFixed`, receipts/inspection only); the default path touches no float at all |
| rounding | IEEE-754 doubles | round-half-toward-+Infinity via `Math.round` (fully specified by ECMAScript); `real·2^32` is an exact exponent shift, so the quantizer is a pure function of the caller's double |
| overflow | silent double behavior | refuse loudly: σ ∈ [0,1024) → σ_q ∈ [0,2^42) else RangeError; `\|resonance\| > 2^20` refused (kernel-reachable max 505) |
| exactness argument | LAYER 0 is integer-exact by construction; the σ path is not | every tick intermediate a mathematical integer with proven bounds: acc ∈ [−504,504] so acc·S < 2^41; term = r·σ_q < 2^51; pressure < 2^52 — all < 2^53, where the Number carrier is exact by IEEE-754 integer-exactness |

The **float plane** is the reference kernel: zero dependencies, ESM,
interpretation receipts R1–R7 in the header, sealed by gates G0–G6
(`tests/receipt.json`, chain tip `7e66ea21…`, kernel sha `ef9a3bba…`). Its
LAYER 0 (`vectorPass`) contains no floats at all — the crossimpl lane proved
a from-SPEC Python re-derivation byte-exact against it, 10,272/10,272 at
the serialization level, with byte-identical result files (sha256
`d242f96d…`) from two independent serializers on two sides of a process
boundary. What the float plane cannot promise is the σ path: one
transcendental evaluation and one float multiply per twin hit.

The **fixed plane** carries R1–R7 over verbatim ("parity by construction" —
its LAYER 0, `nextD`, `makeSubstrate` and `mulberry32` are byte-identical
code to `qthe.mjs`, because the float kernel was already exact-integer
there; that is exactly why the guest's R5 singled out the σ path as THE
breach). What it adds is the R8 law proper: S = 2^32, one declared rounding
rule at one declared door, baked `DEFAULT_SIGMA_Q = 6807362106` (derivation
1: the 60-digit real log2(3)·2^32 = 6807362105.9837… → 6807362106;
derivation 2: the double-path cross-check
`Math.round(Math.log2(3)*2**32) === 6807362106`), and the carrier proof
above — checked empirically per run by a BigInt shadow (F_D).

## The measured conformance record

Everything below was priced BEFORE the run (registration + amendment) and
measured by the battery sealed in `fixedpoint/receipts/`. Raw numbers:
`fixedpoint/outputs/f_a_results.json`, `f_b_results.json`,
`f_c_results.json`, `f_d_results.json`, `f_e_verdict.json`.

**F_A — LAYER 0 exhaustive byte-identity** (`f_a_results.json`):

- A1 pack/unpack/tauOf/dOf/psi: **256/256** byte values identical, both
  directions, PSI identity, zero mismatches.
- A2 vectorPass: **34,816** single-perturbation envelope points (256 weight
  bytes × 8 row positions × 17 integer xs) + **64** deterministic random
  rows (mulberry32(34055), row length 16) — every `{re, im}` exactly equal
  (`===`) and `Number.isInteger`, zero non-integers.
- A3 nextD: **448** points (d ∈ [0,63] × 7 pressures) identical.
- A4 mulberry32/makeSubstrate: 4 seeds {0, 1, 34055, 4294967295} ×
  **10,000 draws** + a 24×16 substrate — identical, zero mismatches.
- A5 SIGN GRID (the R5 theorem as data): **9,081 points** (acc ∈ [−504,504]
  × 9 σ arms) — **exactly ONE** sign-class disagreement in the entire grid,
  precisely the frozen one: (σ = 2/3, acc = −2), float class 0 (because
  −2 + 3·double(2/3) === 0 exactly — 3·double(2/3) rounds to 2.0), fixed
  class +1 (−2·S + 3·2863311531 = +1). It was predicted exactly, point for
  point, in the registration; any OTHER disagreement would have falsified
  the sign law. None did.
- A6 static hygiene: zero `Math.random`, zero `Math.log2` tokens in the full
  file (comments included — the derivation rides as decimal digits), only
  `Math.abs` survives among Math builtins in the scanned region, zero float
  literals, exactly one division operator (inside the outbound door
  `sigmaFromFixed`), tick body contains no `/` character (the amended law).

**F_B — LAYER 1 traces** (24×16 substrates, mulberry32 seedFn, τ uniform
over {0,1,2,3} ≈ 25% Abstain for heavy twin traffic, d uniform [0,64); seeds
34001–34008, N=8, T=400, wormholes ON; comparison per (arm, seed, tick) of
cell plane bytes + table snapshot + event core, term under the TERM BAND
LAW — exact equality on dyadic arms, |term_q − floatTerm·S| ≤ r elsewhere):

- **P-B1, zero divergence on the swept and default arms: PASS.** 0.5, 1,
  log2(3), 2, 4, and default: **8 seeds × 400 ticks per arm, zero
  divergence, trace-identical** (6 arms → 19,200 tick comparisons with not
  one differing byte).
- **P-B1, adversarial arms: FALSIFIED.** σ = 1.6: **7/8 seeds diverge**
  (first ticks 3–82). σ = 0.7: **7/8 seeds diverge** (first ticks 1–54).
  Autopsy below — this is the finding, not a failure of the battery.
- **P-B2, the cooker (σ = 2/3, engineered 8×8 fixture, T=6): PASS, exact.**
  Tick 1: both kernels emit exactly one twin event — (5,5), slot 7,
  resonance 3. Float term === 2 (the double 2.0); fixed term === 8589934593
  (= 3 × 2863311531 = 2S + 1 — ONE S-unit above the float plane). Float B.d
  holds 7 (pressure === 0 → nextD holds); fixed B.d = 8 (pressure +1 →
  ascend). A.d = 6 in both (A never twin-hits). Slot 7 = {x:5, y:5,
  resonance:3} in both after tick 1 (B's LWW write). The divergence then
  ABSORBS through T=6: fixed B reads/writes slot 8 forever, float stays on
  slot 7; table snapshots differ from tick 2 on; no re-convergence.
- **P-B3, the 2/3 rule on random substrates: CONFIRMED.** 8/8 seeds diverge
  early (ticks 3–17).
- **P-B4, term band: PASS.** **2,085,522 paired twin events checked, 0
  violations.**
- **P-B5, absorbing: CONFIRMED where it matters.** The cooker's divergence
  persists to T (asserted). On the randoms, 19 of the 22 diverged
  (arm, seed) cases persist to T (divergedTicks = T − first + 1, e.g. 0.7 /
  seed 34004: first tick 1, 400/400 diverged; 1.6 / seed 34007: first tick
  3, 398/400). Three cases re-match on some ticks (1.6/34002: 30 of 384
  post-first ticks diverged; 1.6/34008: 29 of 398; 0.7/34003: 9 of 347) —
  re-convergence was predicted against but explicitly "not excluded by
  logic" in the registration's own P-B5; the counts stand as recorded in
  `f_b_results.json`.

**F_C — determinism** (`f_c_results.json`): **20/20** independent
fresh-build reruns (kernel + substrate + table rebuilt from scratch each
time; seed 34100, 24×16, T=400, default σ) produce the identical full-trace
hash `e4f1d36a95ac50a3a29f1db8a53b1aad963632142f87a8dbe9ce65653120c38a`;
non-degeneracy control: seed 34101 differs
(`11a8054f786d5050ce0323323d0c087dba12471aa61b8dab68e3e2673778c036`).
The float kernel's pinned G5 twin-resonance schedule reproduces exactly —
same event x/y/slot/resonance sequence and d-ladder, fixed terms all
1·6807362106, totalWrites 12 in both kernels.

**F_D — BigInt shadow** (`f_d_results.json`): **1,600 tick comparisons**
(seeds 34001–34004 × arms {default, 0.5, log2(3), 2/3} × T=100), Number
carrier == BigInt carrier **byte-for-byte, terms included, zero
mismatches** — the < 2^53 exactness proof holds on the actual run, not just
on paper.

**F_E — verdict rule** (`f_e_verdict.json`): as registered
(`breachClosed: false` — P-B1 was a conjunct), the R5 answer routes to the
pre-frozen honest_alternative #1: **"closed with measured cost."** The raw
verdict string of record: "NOT closed as registered — see
honest_alternatives in pre_registration.json F_E; the divergence/defect
profile is the real fidelity cost and stands as recorded."

## The P-B1 falsification story

The registration predicted zero divergence on 1.6 and 0.7 via a sign-margin
argument. The argument was correct arithmetic on the wrong object: it
priced the **coupled** grid, where the resonance a cell reads is its own
r = |acc|+1, which pins the sign boundary at acc = ±2 with margins ≥ 0.1 —
dwarfing the ≤ r·2^-33 ≈ 5.9e-8 quantization band. But the kernel's twin
pressure is **uncoupled**: the reader's acc and the writer's resonance are
independent quantities, and the uncoupled (acc, r) space contains
**exact-zero real-pressure families** for rational σ:

- σ = 8/5 (1.6): 5·acc + 8·r = 0 → (−8,5), (−16,10), (−32,20), (−56,35),
  (−64,40)…
- σ = 7/10 (0.7): 10·acc + 7·r = 0 → (−7,10), (−14,20), (−21,30),
  (−42,60), (−70,100)…
- σ = 2/3: 3·acc + 2·r = 0 → (−38,57), (−96,144), (−30,45), (−34,51)…

At those points the two planes are asked to sign a sum that is exactly zero
in true arithmetic, and they answer differently: the float kernel's double
rounding collapses its own σ's true nonzero pressure to `=== 0` (the cell
holds), while the fixed kernel keeps the honest remainder (±2…48 S-units)
and moves. The autopsy (`outputs/f_b_autopsy.json`, via `probe_divergence.mjs`
v2, exact at-read reconstruction) found that **all 23 diverged (arm, seed)
first-divergence cases are exact-zero family hits — 22/23 with `floatP === 0`
EXACTLY** (the 23rd is 0.7/seed 34004 at t=1, through a same-tick
write→read chain — also a family hit).

The direction analysis is the crown of the autopsy: **in every case the
fixed kernel's direction is faithful to its own bridge scale and the float
kernel deviates from its own.** At σ = 1.6, double(1.6) > 8/5, so the true
pressure at family points is > 0 — yet the float kernel holds the cell. At
σ = 0.7, double(0.7) < 7/10, so the true pressure is < 0 — yet the float
kernel holds. The "divergence cost" is real under the frozen comparison
law, but it is the FLOAT kernel's rounding artifact, not the fixed kernel's
error. E-Q8 independently established the float-only artifact at these same
exact-zero families (chain tip `78646460…`, 17 links). The term band
(P-B4, 2,085,522 events) is untouched by all of this: the band prices the
term (resonance·σ) alone, which stays in-band everywhere; the collapse
bites in the pressure SUM (acc·S + term), where exact cancellation meets
two approximations of the same irrational.

House law held throughout: the falsified floor stays standing in the chain
beside the autopsy; the one amendment was committed before any run and
touched only the scanner clause the registration itself had over-constrained;
the keeper's own slips (scanner coordinate mismatch, two stray chain rows)
are receipted as keeper defects, not kernel violations.

## The cost of staying exact

Measured, from the sealed outputs:

- **Zero** on every σ the data has swept or defaulted to — 0.5, 1, log2(3),
  2, 4, default: trace-identical planes over 8 seeds × 400 ticks per arm
  (19,200 tick comparisons across the six arms, zero divergence). On the
  dyadic arms (0.5, 1, 2, 4) this is identity by construction: σ_q is exact
  and the float kernel's own arithmetic on them is exact-integer, so the
  planes are the same computation.
- **Exactly one S-unit** at the single pre-registered coupled boundary
  (σ = 2/3, acc = −2): the cooker's tick-1 split — fixed term 8589934593
  (2S + 1) vs float term 2; fixed B.d ascends to 8 while float holds 7. One
  unit of the 6-bit amplitude, once, at a point engineered for it.
- **The adversarial families** — rational σ chosen between the double and
  the quantized scale: 1.6 diverges on 7/8 seeds (first ticks 3–82), 0.7 on
  7/8 (first ticks 1–54), 2/3 on 8/8 (ticks 3–17), every case absorbing or
  near-absorbing to T = 400. No measured dynamics has ever visited these
  families; they exist for adversaries, and at them the fixed plane is the
  *more* faithful of the two (autopsy direction analysis above).
- **Quantization of the default itself**: 0.01625823974609375 S-units
  (= 3.78e-12 in real units); for scale, the float kernel's default double
  sits 4.77e-7 S-units from σ_q (registration,
  `representation_law.quantization_error_default`).
- **Runtime cost: NOT MEASURED in the sealed corpus.** The outputs
  `f_a…f_e` contain no wall-clock or per-tick timing fields, and none of
  the findings record any. The only cost-envelope statement on record is
  `docs/ENGINEERING-NOTES.md`'s "CPU-minutes lanes" (the fixedpoint run
  priced 2,085,522 paired twin events; E-Q12 enumerated 254,520 triples).
  No float-vs-fixed per-tick timing comparison exists; anyone citing one is
  citing air. If a consumer needs that number, it is a new pre-registered
  experiment.
- **Structural cost**: a second sealed lineage to keep conformant. Every
  kernel edit re-prices both planes; cross-plane event comparison can never
  be byte-equality on the term — it goes through the TERM BAND LAW (exact
  on dyadic arms, |term_q − floatTerm·S| ≤ r elsewhere); and the
  representation must be declared wherever state crosses planes (see
  `docs/HULL-DOCTRINE.md`).

## When to use which plane

- **Default to the float plane (`qthe.mjs`).** It is the reference kernel
  the SPEC's receipts R1–R7 and the G0–G6 gates seal (`tests/receipt.json`
  chain tip `7e66ea21…`, kernel sha `ef9a3bba…`); the priced LAYER 2
  scoreboard (`docs/CLAIM-VERDICTS.md`, C1 LIVES 47.40% / C2 LIVES 8/8 vs
  0/20 / C3 and C5 honest nulls / C4 falsified under the guest's own sealed
  rule) is float-plane arithmetic; the A2UI mirror runs on it.
- **Use the fixed plane (`fixedpoint/qthe_fixed.mjs`) when any of these
  hold:**
  1. **Adversarial σ regimes.** If a caller can engineer rational σ (or a
     sweep can land on one) near an exact-zero family, the float kernel
     will hold cells its own bridge scale says should move. The fixed plane
     is the faithful one there — that is the measured direction result.
  2. **Cross-language portability where the double path cannot be pinned.**
     The fixed plane's only inbound door is a pure function of the caller's
     double (`Math.round` is exactly specified; ×2^32 is an exact exponent
     shift), and its default path evaluates no transcendental at all — the
     σ is a baked integer, identical in every runtime that can multiply
     integers below 2^53. The float plane's default, by contrast, is
     `Math.log2(3)` evaluated by the host runtime.
  3. **Audit trails.** Fixed terms are integers in S-units: they compare
     under `===` and ride in receipts as numbers. Float-plane imaginary
     values are never hashed — they ride in outputs as strings
     (`experiments/_harness.mjs`: "The imaginary plane is NEVER hashed
     (floats)"), and chain-safe encoders stringify non-integers
     (`experiments/_harness.mjs` `q(v)`).
  4. **A house law of your own that forbids floats outright.** R8 exists;
     you can now inherit it instead of re-deriving it.
- **Never mix mid-flight.** A substrate is born on one plane. Swapping σ
  representation mid-run is a new experiment: at the families above the
  planes genuinely differ, so it must be re-priced through the F_B
  comparison law, not assumed free (protocol in `docs/HULL-DOCTRINE.md`).

## The law for porters

Any new implementation of qthe — new language, new runtime, a re-derivation
from SPEC.md — must, before it may call itself a qthe kernel:

1. **Declare its plane.** Float (σ as double, term = resonance·σ) or fixed
   (S = 2^32, σ_q integer, term = resonance·σ_q in S-units, one declared
   rounding door). Undeclared is not an implementation; it is a rumor.
2. **Pass LAYER 0 exhaustively.** The precedent standard is the crossimpl
   lane: bijection 256/256 over the full 2^8 domain, Ψ 4/4, vectorPass
   randomized battery + edge vectors, byte-exact at the SERIALIZATION level
   (10,272/10,272; two independent serializers producing byte-identical
   files, sha256 `d242f96d…`). The SPEC's Layer-0 algebra is "specified
   tightly enough to re-derive, not just to re-read"
   (`crossimpl/findings.md`); the seams you will hit (the ±2^53 input
   horizon, ragged-input NaN vs raise, mask vs raise out-of-domain — F1/F2/F3)
   are receipted there and live outside the specified surface.
3. **If fixed: pass the same conformance families**, not a friendly subset —
   F_A including the 9,081-point sign grid with exactly the one frozen
   disagreement at (2/3, acc = −2) and the static hygiene scan; F_B trace
   comparison under the term band law, including the cooker's exact
   tick-1 one-S-unit split; F_C 20/20 fresh-build determinism with a
   non-degeneracy control; F_D carrier shadow (BigInt or equivalent);
   F_E verdict by the frozen rule, with the honest alternatives pre-registered.
4. **Register before running.** Floors frozen before any run; the runs may
   confirm or falsify; they may not edit; honest FAILs stay standing. The
   precedent: `crossimpl/AMBIGUITY.md` A1–A10 chosen before the kernel was
   opened; `fixedpoint/pre_registration.json` frozen at repo `0b98db8` with
   kernel `b7e6b23` pre-committed, amendment committed before the run.
5. **Seal into a stone-v1 chain.** A receipt without a chain is a rumor;
   the tip is the citation.

The one-sentence form of the law: **σ is an engineering knob (E-Q2), so it
may be quantized — but only behind a declared door, with a declared
rounding rule, at a declared scale, and with the price measured to the
S-unit before anyone ships it.**
