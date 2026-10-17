# qthe: an 8-bit ternary substrate with a content-addressed non-local channel

> External technical note. Task ORCH-D (roadmap phases 44, 45, 49). Everything
> below is sealed in the SuperInstance/qthe corpus: every number cites its
> source file, every claim verdict cites its stone-v1 receipt chain tip. This
> note requires no project-internal context; companions:
> `docs/BOUNDARY-MAP.md` (where the primitive wins and loses),
> `docs/ADOPTION-KIT.md` (the adopting engineer's entry).

## Abstract

qthe is a deterministic cellular substrate whose entire state is one byte per
cell: two bits of timbre τ and six bits of amplitude d (SPEC.md). Local
dynamics are a toroidal Moore-8 update on the packed byte; non-local
interaction is a 64-slot wormhole table, written and read only by Abstain
cells, addressed by the cell's own data value. Two things are structurally
novel. First, the operator (τ) and the operand (d) travel in one memory
transaction: the Moore-8 gather costs 9 reads + 1 write per cell per tick
where a two-plane port of the same rule table costs 18 reads + 1 write — a
measured 47.40% bytes-to-task gain with byte-identical dynamics (E-Q13, tip
`d852e6ac…`). Second, the compile-time slot table is the only causal channel
across Ground: Ground cells contribute to neither accumulation channel, so
with the table off two distant Abstain cells are causally disconnected — 8/8
planted twin pairs deliver with the table on, 0/20 with it off (E-Q1, tip
`addc22f9…`). Three hoped-for properties are honestly dead and priced: no
critical σ scale (E-Q2), no threshold-triggered non-local transfer (E-Q7), no
self-repair (E-Q5). The record reproduces byte-for-byte: same substrate +
same tick count → byte-identical trace, always (SPEC item 6; gates G3
1000/1000; fixed-plane F_C 20/20).

## 1. The primitive

One byte, two planes — data is geometry, control is physics (SPEC.md):

```
bit:   7  6  5 4 3 2 1 0
       [τ:2][  d:6        ]
```

`d = c & 0x3F` is the spatial-amplitude coordinate `[0, 63]`; `τ = c >> 6` is
the timbre. The pack/unpack map is a bijection onto `{0..3} × {0..63}`,
round-trip exact for all 256 values, and every update rule maps `[0,63] →
[0,63]` — both proven exhaustively (SPEC LAYER 0 items 1–2).

The four timbres realize the operator table Ψ (SPEC.md; `qthe.mjs`): Ground
(τ=0, Ψ=0) is the static anchor, contributing to neither channel even when
d > 0; Attract (τ=1, +1) is the forward cascade; Repel (τ=2, −1) the
inversion layer; Abstain (τ=3, i) — the Looking Glass — the only timbre that
touches the wormhole table. The three active operators {+1, −1, i} are the
ternary structure. A vector pass over packed weight bytes computes, in exact
integers with no floats (`qthe.mjs` `vectorPass`):

```
y_j = Σ_k Ψ(τ(w_jk)) · d(w_jk) · x_k  =  y_j^R + i·y_j^I
y_j^R = Σ_{τ=1} d·x_k  −  Σ_{τ=2} d·x_k        (real channel)
y_j^I = Σ_{τ=3} d·x_k                           (imaginary channel)
```

LAYER 1 advances the plane synchronously: Attract neighbors add d, Repel
neighbors subtract d into the cell's real accumulator; the cell's own d moves
toward saturation `min(d+1, 63)` under net-positive pressure and toward 0
under net-negative, by an exact rule table (SPEC item 5). Neighbors come from
a pre-tick snapshot; edges are toroidal, so every cell has exactly eight
neighbors and the update is one uniform table (receipts R1/R2, `qthe.mjs`
header). τ is frozen inside `tick` — timbre is written only by external
injectors between ticks (R3/R4) — which is what keeps every paired arm in
the corpus clean. The kernel is 266 lines, zero dependencies, ESM.

## 2. The wormhole table

Sixty-four slots, compile-time static allocation, zero runtime discovery,
O(1) per Abstain cell (SPEC item 4). An Abstain cell carrying data value d
**reads** slot d — if occupied by a *different* (x, y) with nonzero
resonance, its imaginary channel receives `resonance · σ` (a twin hit) — and
**writes** its own (x, y) and `resonance = |real_acc| + 1` to slot d.

The semantics are **live-read, row-major, last-writer-wins** (S3; E-Q6,
`receipts/e_q6_chain.jsonl`, tip `ab4ea196…`, 15 links). The neighborhood is
read from the pre-tick snapshot, but the table is read live in row-major cell
order: a cell that writes slot s before a same-tick reader reaches it is
heard the same tick (R2) — what makes equal-d twins mutually resonant from
their second co-tick, on the exact schedule gate G5 pins. Under total
collision — all 64 cells on one slot — the table still fires: survival rate
0.984375, 64/64 distinct firers (`experiments/outputs/e_q6_results.json`).
The table is **content-addressed, not identity-addressed**: any occupant
with resonance ≠ 0 fires the reader (E-Q14 B autopsy,
`receipts/e_q14_chain.jsonl` row 70). Delivery survives extreme congestion;
provenance does not (§4). σ — default log₂(3) — is the twin term's scale: an
engineering knob that sets delivery latency, not a critical scale (E-Q2).

## 3. Determinism and the receipt discipline

The determinism contract: no `Math.random` in the kernel; same initial
substrate + same tick count → byte-identical trace, always (SPEC item 6;
`qthe.mjs` header). Sealed by exhaustion of runs — G3: 1000/1000 per-tick
hash equality (`tests/receipt.json`, chain tip `7e66ea21…`); F_C: 20/20
fresh-build reruns of the fixed plane at identical full-trace hash
`e4f1d36a…`, with a non-degeneracy control (`fixedpoint/findings.md`).

The discipline around every measurement: floors are pre-registered before any
run (honest FAILs stay standing, append-only), performance claims run as
paired arms on the same substrate, and every run seals its parameters and
trace hashes into a stone-v1 chain verified from disk. The falsification
budget (`docs/FALSIFICATION-BUDGET.md`): **13 chains, 295 rows; 6 of 6 LAYER 2
claims priced; 3 surviving; 7 honest nulls banked; 5 defects caught by the
discipline itself; zero silent failures.**

## 4. Results

**C1 — LIVES (E-Q13, tip `d852e6ac…`, 25 links).** 1-byte QTHE vs an
independent 2-byte ported encoding (τ-plane + d-plane) on the twin-delivery
class, 20/20 trials: bytes-to-task **331,776 vs 630,784** at completion tick
8 — a **47.40% gain**, inside the sealed band (47.37%, 47.62%]; ticks-to-task
identical 20/20; standing footprint **4,096 vs 8,192 bytes** on 64×64. The
port tracked the kernel byte-identically at checkpoints [0, 50, 100, 150,
200] in 20/20 trials: the gain is pure information density, not a dynamics
difference. Boundary: a cached port (τ-plane held resident, valid only
because τ is frozen inside `tick`) reaches per-tick parity (10 vs 10) at the
price of 4,096 standing bytes and a frozen-τ assumption (`docs/CLAIM-VERDICTS.md`
§C1).

**C2 — LIVES (E-Q1, tip `addc22f9…`, 25 links).** K = 8 planted Abstain twin
pairs (per-pair distinct d ∈ 8..15, members ≥ 24 apart toroidal-Chebyshev),
T = 200, 20 trials, paired ON/OFF arms: ON delivered **8/8 pairs in all 20
trials; OFF 0/20**. Bridging occurs at tick 1; delivery completes by ticks
8–9. Without the table the pairs are causally disconnected; with it,
non-local alignment needs no message bus, no routing table, no per-pair
state.

**C3 — DIES, honest null (E-Q2, tip `67e849a5…`, 14 links).** Full tie across
σ ∈ {0.5, 1, log₂(3), 2, 4}; σ monotone-inert on this class. One-line
mechanism: on Ground-separated pairs the real accumulator is identically
zero, so pressure = resonance·σ is positive for **every** σ > 0 — a pure
gain singles out no scale; only delivery latency scales as ~1/σ.

**C4 — DIES, falsified under the guest's own sealed rule (E-Q7, tip
`befa0c33…`, 36 links).** The checkerboard cascade is real — regime CASCADE
in all four α pairs including wormhole-OFF, deviation field spreading at the
toroidal light-cone from firstSpreadTick 1 — but at T = 256 there is zero
flip-attributable substrate-wide inversion anywhere. One-line mechanism: a
cascade without terminal inversion is not a phase transition — the wave
sweeps the board and inverts nothing.

**C5 — DIES, honest null (E-Q5, tip `4425545f…`, 25 links).** The armor ring
self-dissolves: pristine-ring half-erosion at tick 28, repairTick null in
20/20, injected repair re-erodes on the same curve (half-erosion 25).
One-line mechanism: like-timbre Repel neighbors make pressure negative every
tick and the rule table walks d to 0 one unit per tick — there is no repair
term in the kernel. C5′ **STANDS** definitional (E-Q10, tip `50ddf5f9…`):
an external injector can restore d and the substrate re-erodes it
deterministically — restore-then-re-erode is specified, receipted behavior.

**The float-only artifact (E-Q8, tip `78646460…`; fixedpoint P-B1 autopsy).**
For rational σ the uncoupled (reader-acc, writer-resonance) space contains
exact-zero real-pressure families (e.g. 3·acc + 2·r = 0 at σ = 2/3; 5·acc +
8·r = 0 at 8/5). There the float kernel's double rounding collapses its own
σ's true nonzero pressure to `=== 0` and the cell holds, while the integer
fixed kernel keeps the honest remainder and moves — float held / fixed moved
at tick 1 at both probed families (2/3, contested slot 20; 8/5). All 23
diverged first-divergence cases in the fixed-point battery are family hits,
22/23 with `floatP === 0` exactly; in every case the fixed plane is faithful
to its own bridge scale and the float plane deviates from its own
(`fixedpoint/findings.md`).

**Congestion (E-Q14, `receipts/e_q14_chain.jsonl`, 70 rows): delivery robust,
provenance fragile.** Under Abstain density φ from 0.25 to 1.0 the live-read
table held median distinct-firers ratio at 1.0 (floor: ≥ 0.60) with the
64-slot occupancy cap holding every tick (family A). Under slot population
pressure, pollution fraction rose monotonically (medians 0.943 → 0.962 →
0.998 → 1.0 at 0/16/64/256 polluters) yet delivery survived: 80/80 pair-trials
delivered 8/8 at 256 polluters (family B). The zero-pollution cleanliness
floor was falsified — the autopsy found the 16 planted members form a
climbing convoy on adjacent d-tracks that compresses into shared slots until
all saturate at d = 63 and slot 63 becomes a permanent party line. Noise
(family C): ±1 d-perturbations on 8 seeded cells every 8 ticks (τ preserved,
injector semantics) diverge the planes (first divergence 8, 8, 8, 8, 8) but
never flip the regime: CASCADE 5/5 in both arms.

## 5. Cross-language byte-exactness

**Python (crossimpl/findings.md).** An independent re-derivation of LAYER 0
from SPEC.md alone — every SPEC-silent choice frozen in `AMBIGUITY.md`
(A1–A10) before the kernel was opened — reached **10,272/10,272 byte-exact**
agreement (256 bijection + 4 Ψ + 10,012 vectorPass vectors), enforced at the
serialization level: two independent serializers on two sides of a process
boundary produced byte-identical result files (sha256 `d242f96d…`), with
negative controls proving the comparison catches a lying implementation. The
three seams that surfaced — the ±2^53 input horizon, ragged rows (NaN vs
raise), out-of-domain validation (mask vs raise) — all live outside the
specified surface.

**C99 (crossimpl/c/, cimpl chain, tip `4a252e42…`).** A 19-case battery — 4
vectorPass + 12 float-plane substrate cases + 3 fixed-plane cases, fixtures
generated by executing the reference kernels — passed **19/19 cases, 0
FAIL**: final plane hash, event count, every event tuple, and every term
equal (IEEE754 term bits for the float plane, integers for the fixed plane).
σ never comes from libm: it travels as bit patterns (log₂(3) =
`0x3FF95C01A39FBD68`) — division/multiply/add are correctly rounded on every
IEEE754 platform and `log2()` is not — and the port compiles and passes
without `-lm` (floor C3). Run 1's fixed-plane pressure missed the S-scaling;
the battery caught it, it was repaired and rerun clean, and the defect is
receipted in the chain beside the clean run. One honest note, receipted here:
the chain's verdict row string reads "NOT BYTE-EXACT — honest FAIL standing"
because the sealing script counts ` FAIL` substrings in the runner's stdout
and the summary line itself ends "0 FAIL" (`crossimpl/c/seal_cimpl.mjs`);
the same chain's result row records the battery's own summary —
"conformance: 19/19 cases PASS, 0 FAIL" — and a fresh execution of the
sealed binary against the sealed fixtures exits 0 with exactly that line.
The scoreboard of record carries BYTE-EXACT 19/19 both planes
(`experiments/outputs/fleet_seeds_entry.json`; `qthe-core/README.md`).

## 6. Cost of exactness

The no-floats plane — S = 2^32, σ_q = 6807362106 as a baked integer, one
declared rounding door, every tick intermediate < 2^53 (R8,
`fixedpoint/qthe_fixed.mjs`) — costs **0.975×** the float plane's runtime:
median 19.12 ms vs 19.61 ms per run on the twin-delivery class (64×64, 400
ticks, 5 fresh reruns per arm; Node 24, x86_64; wall-clock receipted as
strings, never hashed). Within noise the honest reading is parity: the tick
loop is dominated by the Moore-8 gather, not the one multiply
(`fixedpoint/COST-OF-EXACTNESS.md`, chain rows `cost_benchmark.ORCH6`, tip
`ff70bdea…`). Semantic cost by regime: **zero** on every swept/default σ
(0.5, 1, log₂(3), 2, 4 — trace-identical planes, 8 seeds × 400 ticks per
arm); **exactly one S-unit** at the single pre-registered coupled boundary
(σ = 2/3, acc = −2: float term 2 vs fixed term 8589934593 = 2S+1); and at
the adversarial exact-zero families the fixed plane is the *more* faithful of
the two (§4).

## 7. Limitations, stated as boundaries

- σ has no critical scale; it is a delivery-latency knob (E-Q2).
- Cascades relax; they do not invert. Threshold semantics do not exist (E-Q7).
- Dynamics only deplete: there is no self-repair term; repair is an external
  injector's job, with re-erosion deterministic (E-Q5/E-Q10).
- The table is content-addressed: under slot congestion delivery survives but
  provenance does not — keep d assignments separated if WHO matters (E-Q14 B).
- The float plane is unfaithful at adversarial rational σ's exact-zero
  families; the fixed plane is the faithful one there (E-Q8, fixedpoint).
- The slot table is fixed at 64; grid scaling is sealed to 256×256 at 10%
  Abstain (E-Q16-C: per-cell firing grid-invariant — firings/tick/cell
  1.000/0.983/1.041 across 64/128/256 — while contention rises to ~5,874
  writes/slot: the table is a capacity-bounded content-addressing structure,
  not an identity-addressed one).
- Runtime numbers are measured on one machine class (Node 24, x86_64); the
  C99 port is code-delivered and byte-exact but no physical ESP32/Jetson
  measurement exists (`demos/agent-coordination.mjs` verdict line).
- License: MIT (root `LICENSE`; `qthe-core/LICENSE` ships with the
  standalone package).

## 8. Availability

- **qthe-core/** — the standalone primitive, zero dependencies beyond each
  language's stdlib: `kernel/qthe.mjs` (float reference kernel),
  `kernel/qthe_fixed.mjs` (R8 fixed plane), `c/qthe_core.{h,c}` (C99 port,
  both planes, no libm, one `cc` line), `py/qthe_layer0.py` (strict Python
  LAYER 0). Every file is a byte-exact copy; `PROVENANCE.txt` pins the
  sha256s (`qthe-core/README.md`).
- **public-demo.html** — the live mirror with the real kernel and sha256
  inlined into a single file: zero network, zero server, zero build; opens
  even from `file://` (`scripts/build_public_demo.mjs`).
- **The DAY-1 path** (`docs/DAY-1.md`) — ten minutes, every command verified
  on a clean clone: clone qthe plus the `quilt-stone` sibling, serve the A2UI
  mirror, drive the REPL, re-run E-Q13, then `node scripts/verify_all_chains.mjs`
  ("ALL CLEAN :: 13/13 receipts of record verified from disk") and
  `node scripts/probe_gate.mjs` (PG1–PG5). A stranger's rerun is the final
  arbiter; if anything here does not reproduce byte-for-byte, that is a bug
  in this corpus, not in the stranger's setup.
