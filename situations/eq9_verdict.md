# E-Q9 VERDICT — AS RUN (task 40-c, wave 40, lane qthe-smith)

Sealed 2026-09-27. Registration `8e8578e` (PRE-RUN, zero ticks — git history is the witness);
predictions `situations/eq9_predictions.json` (sealed pre-run, 10 Brier events E1–E10, two-reading
falsifier committed unedited). **The sweep has now RUN — every registered floor held, no floor
edited post-run.**

## 1. What executed (the receipt)

Runner `experiments/e_q9_sweep.mjs`, pure deterministic compute, zero network, zero keys:

- **Census recompute BEFORE the first tick**: 306,773 fractions rebuilt from the registered bounds
  in-run, sha256 `552d171c…dbc20f6` asserted == the sealed census receipt. LOUD abort on drift.
- **Sweep set**: 38,911 runnable-stable k=1 exact-zero families (n ≤ 252, dd ≤ 253, gcd=1) ×
  3 sigma arms (rat = n/dd, irrFar = √2, irrNear = n/dd + √2·2⁻⁵²) × 2 kernels
  (float `qthe.mjs` / fixed `fixedpoint/qthe_fixed.mjs`, both at R8) × **2 fresh constructions
  (EQ9-D1)** = **466,932 kernel runs**, T=16 ticks each, 116,733 row lines.
- **Board**: the E-Q8 same-slot S3 live-read probe geometry SCALED TO THE REPEL MASS (the
  registered phrase): A=(1,2), B=(6,2) on a 9×5 torus, both Abstain d=20 — SAME slot 20, row-major
  A-before-B (live-read preserved); each writer tuned by up to 4 pairwise non-adjacent Moore-8 ring
  Repels (the registered independence cap 4 × 63 = 252); t=0 acc assertions LOUD per run
  (acc(A) = −(dd−1), acc(B) = −n, every Repel acc = 0).
- **Fixed-kernel door**: σQ = round(σ·2³²) asserted against the kernel's own `sigmaToFixed` on
  every arm sigma — 116,761 checks, zero mismatches.
- **Cross-experiment assert**: the runner rebuilds the EXACT E-Q8 6×3 board for 2/3 and 8/5 and
  reproduces the RECEIPTED E-Q8 plane hashes **byte-for-byte (17/17 ticks, float and fixed)**
  from `e_q8_results.json` on disk — the kernels at R8 are provably the kernels that sealed E-Q8.
- **Wall time**: 34.3 s. **Run-to-run identity**: two independent full executions produced
  **byte-identical** `eq9_sweep_rows.jsonl` (the whole experiment is its own D1).

## 2. Predictions vs outcomes — E1–E10 (pre-registered p, scored AS RUN)

| event | claim | p | outcome | Brier |
|---|---|---|---|---|
| E1 | rat observed class counts == census arithmetic exactly | 0.90 | **TRUE** (A 34,144 / D 1,134 / B 1,729 / C 1,904 — exact on every class) | 0.0100 |
| E2 | every rat class-A family: t=1, 1 cell (B), \|dd\|=1, twin-heard, tau preserved, float held & fixed moved | 0.93 | **TRUE** | 0.0049 |
| E3 | every rat class-B family: plane hashes byte-identical across kernels, ticks 0..16 | 0.95 | **TRUE** | 0.0025 |
| E4 | every rat class-C family: t=1, 1 cell, \|dd\|=2, opposite directions | 0.90 | **TRUE** | 0.0100 |
| E5 | every rat class-D family: byte-identical 16 ticks, both planes hold B | 0.93 | **TRUE** | 0.0049 |
| E6 | irrFar arm: zero divergent families out of 38,911 | 0.98 | **TRUE** (38,911/38,911 byte-identical) | 0.0004 |
| E7 | irrNear arm: observed counts == census (incl. 379 F-INV, 4,836 degenerate) | 0.85 | **TRUE** (A 4,365 / B 16,649 / C 16,763 / D 755 / F-INV 379) | 0.0225 |
| E8 | zero UNEXPLAINED cells under the extended taxonomy, all arms | 0.90 | **TRUE** (0 holes) | 0.0100 |
| E9 | EQ9-D1: every rerun byte-identical, all families/arms/kernels | 0.99 | **TRUE** (0 failures) | 0.0001 |
| E10 | every first divergence at the B cell; A never participates | 0.97 | **TRUE** | 0.0009 |

**Mean Brier = 0.00662.** Ten for ten; every modal prediction landed. The one genuine pre-run
uncertainty — whether tick ≥ 2 twin events (writer A hearing B's resonance n+1) could split the
planes in class-B/D families — resolved NO: for n ≠ dd−1 the A-twin true pressure
|(n+dd)(n−dd+1)|/dd ≥ 1 sits orders above the r·2⁻³³ sign-law band, and at n = dd−1 the A-twin
computation is *numerically identical* to B's family-point computation on each kernel, so the
signs co-vary exactly. The sweep measured what the arithmetic promised.

## 3. The guest's falsifier — BOTH readings, AS RUN, unedited (the pre-run commitment)

Guest lever verbatim: *"If any swept sigma produces a float-vs-fixed divergence OUTSIDE an
exact-zero family, or the fixed kernel itself holds at an exact-zero family point, the artifact
is not family-specific and the fixed plane's faithfulness claim dies."*

- **Reading 1 (literal): FIRES — exactly as priced pre-run.** The fixed kernel HOLDS at the 1,134
  dyadic family points (T2: fixed hold ⟺ dd dyadic, 0 violations in the census, confirmed on the
  wire: near-arm D=755 + F-INV=379 = rat-D=1,134 — every rat-D family is either near-degenerate or
  near-F-INV). The pre-run pricing already declared this reading too strong: dyadic both-hold is
  the two planes AGREEING in exactness (no representation gap, no artifact) — it is the opposite
  of an artifact, and the literal words "not family-specific" do not follow from it.
- **Reading 2 (intended): does NOT fire.** (a) Fixed-holds-while-float-moves at a family point
  (artifact inversion): **0 occurrences at rat across all 38,911 families** — T2 confirmed on the
  wire. (b) UNEXPLAINED cells: **0** under the extended taxonomy across all 116,733 arm-runs.

**Resolution (honest, both readings standing): the float-only artifact IS family-specific under
the intended reading.** It lives exactly on the float-collapse set — class A, 34,144/38,911 =
87.75% of the stable space — and it is bounded by two named, pre-priced counterexample classes:
class D (1,134 dyadic points where the fixed plane is also exact and the planes agree) and
classes B∪C (3,633 points where the float plane ALSO moves — 'float holds at exact-zero families'
generalizes exactly to the collapse predicate A+D = 90.67% and FAILS on B∪C). The guest's
round-8 lever closes with its structure intact: no off-family divergence exists (far arm zero,
near-arm structure quantization- not rationality-bound), and no inversion exists at any family
point.

## 4. Primary rows — 2/3, 8/5, 7/10 (guest-named, full traces in eq9_sweep_results.json)

All three: first divergence tick 1, single cell B (6,2), twin-heard r = dd, tau preserved, float
held & fixed moved — class A, the E-Q8 artifact, now at k=1 across three different dd:

| family | float term (t1) | fixed term (t1) | float B | fixed B | reading |
|---|---|---|---|---|---|
| 2/3 | `3·double(2/3) = "2"` | `"8589934593"` (2S+1) | 20 (HOLDS) | 21 (+1) | E-Q8 receipt, reproduced |
| 8/5 | `5·double(8/5) = "8"` | `"34359738370"` (8S+2) | 20 (HOLDS) | 21 (+1) | E-Q8 receipt, reproduced |
| 7/10 | `10·double(7/10) = "7"` | `"30064771070"` (7S−2) | 20 (HOLDS) | **19 (−1, DOWN)** | the guest's declared residual risk: resolved IN-family at tick 1, \|dd\|=1 |

- Float B staircase `20,19,19,18,18,…` and fixed trajectories reproduce the E-Q8 receipted shapes;
  the E-Q8-board rebuilds match the receipted twin tuples `[[1,2,1,20,3]]` / `[[1,2,1,20,5]]` /
  first-hit `[1,2,1,20,10]` for 7/10.
- No-twin controls (A → Ground): **sigmaInert TRUE** on both geometries, both kernels (the
  no-twin baseline is byte-identical across kernels — sigma never enters without a twin).
- 7/10's fixed DOWN-move (−1) is the census's pseudo-uniform direction law in action (class-A
  fixed moves: +1 in 17,102 families, −1 in 17,042) — the artifact is not an upward-only bias.

## 5. The irrational arms — what "irrationality is inert" measured to

- **irrFar (√2, family-distant): 38,911/38,911 byte-identical across kernels for all 16 ticks.**
  Zero collapses, zero sign disagreements (Liouville margin ≥ 1.24e-5 ≫ the r·2⁻³³ band ≈ 3e-8).
  Irrationality PER SE never produces the artifact, never flips a sign, never moves a divergence
  tick. The artifact is family-PROXIMITY-bound, not rationality-bound.
- **irrNear (+√2·2⁻⁵², ~1–3 ulp above the family point): the census classes reproduced exactly**
  (A 4,365 / B 16,649 / C 16,763 / D 755 / F-INV 379). The novel measured structure is the
  **379 FIXED-BLIND-INVERSION cells** (all dyadic, σ < 4): the Q32.32 door is blind to the
  √2·2⁻²⁰ S-unit step (≈1.35 S-units, below the 0.5-ulp-of-σQ rounding grain) while the float
  plane SEES the ulp-scale step and moves — off-family, the blindness flips sides. Plus 4,836
  degenerate cells (σ ≥ 4: the irrational step is below half-ulp, the float plane literally cannot
  see it; near run ≡ rat run byte-for-byte, verified per-family). F-INV never occurs at a family
  point — the registered "possible OFF family points only" held exactly.

## 6. Holes, defects, honest notes (all receipted, none editorialized)

- **Zero UNEXPLAINED cells. Zero D1 failures. Zero assertion failures. Zero out-of-space escapes**
  (116,176 reachable-not-stable + 151,686 out-of-engineering-space fractions remain receipted as
  out of scope per the registration; k ≥ 2 lines out of scope by registration).
- **Harness comparison-shape defect, caught and receipted**: the primaries' D1 flag initially
  compared reruns across different perTick SHAPES (trace mode carries the slot-20 occupant) —
  a false `det:false`. Fixed to compare shape-independent receipts (event-seq hash, snapshot
  hash, all 17 plane hashes); the like-for-like compact D1 lives in the sweep rows (E9). The
  defect was in the comparison, never in the kernels; the full sweep was re-run and produced
  byte-identical rows.
- **Board scaling**: the registered "geometry scaled to the Repel mass" was operationalized as a
  fixed 9×5 canonical board (4+4 non-adjacent ring Repels) — adjacent writers cannot host 4+4
  pairwise-non-adjacent Repels in the shared 4×3 window (max independent set 4), so B sits at
  x=6 with the live-read row-major order preserved. The E-Q8-board rebuild rows keep byte-level
  comparability with the E-Q8 receipt.
- **Stone chain**: the E-Q9 registration did not bind a chain row (unlike E-Q8's); the receipts
  are the census (sha-asserted in-run), 116,733 rows, the results JSON, this verdict, and git
  history — noted here so the absence is a decision on the record, not an omission.

## 7. Scoreboard move

E-Q9 **RESOLVED: family-bound float-only artifact, established at census scale.** The E-Q8
artifact class generalizes exactly to the float-collapse set (34,144 stable families, 87.75%) and
nowhere else; the fixed plane is exact (holds) precisely on the dyadic family points; float moves
wherever the collapse predicate fails (B∪C); off-family the planes agree everywhere except the
379 quantization-blindness inversions, where the FIXED plane is the blinder. Both kernels are
now fully characterized at k=1: float = collapse-bound artifact plane, fixed = dyadic-exact,
band-honest plane. The guest's lever closes with the falsifier resolved in the artifact's favor
under the intended reading, and the literal reading's overstrength documented — as priced, before
the run.
