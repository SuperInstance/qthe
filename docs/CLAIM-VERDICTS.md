# qthe — Claim Verdicts (LAYER 2, fully priced)

> The scoreboard of record, with the mechanism-level explanation a later agent
> can re-derive from `qthe.mjs` + the sealed chains alone. Every verdict cites
> its receipt chain tip; every mechanism names the kernel lines that produce
> it. Honest nulls are kept beside the bodies, per house law. The SPEC.md
> LAYER 2 table is the summary; this file is the reasoning.

## Scoreboard

| # | claim (gifted corpus) | verdict | priced by | chain tip (stone-v1) |
|---|----------------------|---------|-----------|----------------------|
| C1 | "25% gain of function" intra-cell timbre vs inter-cell porting | **LIVES** — measured 47.40% bytes-gain, founder's 25% understated | E-Q13 (ORCH-1) | `d852e6ac…` (25 links) |
| C2 | wormhole (Abstain) beats graph-traversal for non-local alignment | **LIVES** — 8/8 ON vs 0/20 OFF | E-Q1 | `addc22f9…` (25 links) |
| C3 | σ = log₂(3) is the critical bridge scale | **DIES** (honest null, formation-scoped) — full tie on bridge formation; σ is not a global no-op (completion ~1/σ, E-Q16-B) | E-Q2 | `67e849a5…` (14 links) |
| C4 | phase threshold θ > π/4 triggers useful non-local transfer | **DIES** — falsified under the guest's own sealed rule | E-Q7 | `befa0c33…` (36 links) |
| C5 | the substrate self-repairs (armor-ring) | **DIES** (honest null) — ring self-dissolves; no repair term exists | E-Q5 | `4425545f…` (25 links) |
| C5′ | repair via injector (one-pager) | **STANDS** — definitional, receipted as such | E-Q10 | `50ddf5f9…` (24 links) |

Supporting mechanism verdicts (not LAYER 2 claims, but they bound the claims):
E-Q6 slot semantics = S3 live-read row-major LWW (`ab4ea196…`, 15 links);
E-Q8 float-only artifact ESTABLISHED at the exact-zero families (`78646460…`,
17 links); E-Q9/E-Q11/E-Q12 artifact family-bound, closed-form predicates
discharged (content-hash receipts `e146ed74…` / `3306f390…`, E-Q9 chainless
by registered decision); fixed-point plane R8 conformance + P-B1 falsification
(`a7f7a552…`, 24 links).

---

## C1 — LIVES: the byte IS the coupling (E-Q13)

**Priced:** 1-byte QTHE vs a 2-byte ported encoding (τ-plane + d-plane) on
E-Q1's twin-delivery task class, fresh seeds 66001..66020, 20/20 trials
delivered 8/8 pairs, completion ticks 8–9.

**Measured:** bytes-to-task 331,776 vs 630,784 at completion tick 8 —
**47.40% gain**, inside the sealed arithmetic band (9/19, 11/21] =
(47.37%, 47.62%]. Ticks-to-task identical 20/20. Standing footprint halved
exactly: 4,096 vs 8,192 bytes on a 64×64 substrate.

**Mechanism (re-derivable from the kernel):** one packed-byte read yields
both the operator (τ = c>>6) and the operand (d = c&63) — the Moore-8 gather
in `tick()` costs 9 reads + 1 write per cell per tick. The port must fetch
the timbre and the amplitude from two different planes, so the same gather
costs 18 reads + 1 write. The gain is exactly the information density of the
byte: 10/19 ≈ 47.4% less semantic traffic, forever, at zero dynamics cost —
proven by F1: the ported two-plane re-implementation (an independent
transcription of the published rule table, live-read LWW wormhole included)
tracked the kernel plane **byte-identically** at checkpoints
[0,50,100,150,200] in 20/20 trials.

**Boundary (the honest edge of the claim):** a cached port — τ-plane held
SRAM-resident, possible only because τ is frozen inside `tick()` — reaches
per-tick parity (10 vs 10). The price is 4,096 standing bytes of residency
and the assumption that timbre never changes mid-run (any injector breaks
the cache). The 1-byte encoding removes the timbre coupling from the memory
system entirely; that removal, not any dynamics advantage, is the gain of
function. The founder's 25% was direction-right and magnitude-understated
for the portable (uncached) port, which is the port any stranger gets for
free.

**ORCH-R10 byte-budget note (mimov26f F3 / hy4p F3, verified):** any
comparison must name which bytes it counts. The sealed 47.40% is the
*traffic* gain (bytes-to-task, both arms fully resident); the
*standing-storage* comparison is 4,096 vs 8,192 B of seed planes, and the
port's parity path additionally requires the τ-plane residency priced
above. A footprint claim that mixes traffic with standing storage, or
omits the cached-port caveat, is not quoting this receipt.

**Receipts:** registration `pre_registration_e_q13.json` (commit `d19d933`,
pre-run), results `experiments/outputs/e_q13_results.json`, chain
`receipts/e_q13_chain.jsonl` tip `d852e6ac…` 25 links verified from disk.
Cosmetic defect on record: the sealed verdict string carries `%%`; correct
reading 47.4026%.

---

## C2 — LIVES: the wormhole is the only non-local channel (E-Q1)

**Priced:** K=8 planted Abstain twin pairs (per-pair distinct d ∈ 8..15,
members ≥ 24 apart toroidal-Chebyshev), T=200, θ_del=8, 20 trials, paired
arms ON/OFF on the same substrate.

**Measured:** ON median 8/8 pairs delivered (all 20 trials), OFF 0/20 — the
F2 mechanistic floor (OFF delivers nothing, ever) held without exception.
Bridging occurs at tick 1; delivery completes by tick 8–9.

**Mechanism (re-derivable from the kernel):** under SPEC L1 s5, local
influence cannot propagate through Ground cells — they contribute nothing to
their neighbors' accumulators — so two distant Abstain cells are causally
disconnected without the table. With wormholes ON, the row-major live-read
(R2) lets the later writer hear the earlier writer's same-tick write from
their **second co-tick** (G5 pins the schedule): the reader's imaginary
channel receives `resonance · σ`, R3 couples it into pressure, and d climbs
one unit per tick toward delivery. The table is a compile-time 64-slot
static allocation — zero runtime discovery, O(1) per Abstain cell — which is
the entire point: non-local alignment without a message bus, a routing
table, or any per-pair state.

**Boundary:** the win is priced on *this* task class (engineered twins at
controlled separation, no slot contention beyond per-pair distinct d).
E-Q6 priced what happens under total collision (all 64 cells, same slot):
the table still fires (survival 0.984, 64/64 distinct firers — S3 live-read
LWW), but resonance becomes last-writer-dominated; dense-Abstain regimes are
the E-Q14 frontier.

**Receipts:** `receipts/e_q1_chain.jsonl` tip `addc22f9…` 25 links;
`experiments/outputs/e_q1_results.json`.

---

## C3 — DIES (honest null): σ is monotone-inert on this class (E-Q2)

**Priced:** the same 20 planted trials at σ ∈ {0.5, 1, log₂(3), 2, 4},
no favorite σ registered (the gifted "proof" was flagged decorative in the
registration itself: the Gaussian integral yields σ√2π for ANY σ).

**Measured:** full tie across all five σ on bridge formation rate (median 1),
ticks-to-first-bridge (median 1, IQR 0). Verdict row, verbatim: "NO CRITICAL
SCALE: full tie across all swept sigma on this class — sigma monotone-inert
HERE (honest null for C3 on this class)."

**Mechanism (re-derivable from the kernel):** on the planted task class the
pair members' real accumulator is identically zero (weather cells ≥ 10 away,
Ground forwards nothing), so `pressure = 0 + resonance·σ` has positive sign
for **every** σ > 0. Bridge occurrence (the first twin event) depends only
on the live-read schedule, not on σ at all; only θ-delivery timing scales
as ~1/σ (median deliver tick 17 at σ=0.5, faster above) — exactly the
pre-registered "pure gain" prediction, confirmed. A pure gain cannot single
out a critical scale; log₂(3) is not at any band edge (`log2_3_at_band_edge:
false`).

**Boundary:** this kills C3 *as the gift stated it* (a privileged bridge
scale). It does not kill σ as a useful knob: σ sets delivery latency and,
per E-Q8/E-Q9, encodes the exact-zero family structure in float vs fixed.
What died is the numerology, cleanly and cheaply.

**ORCH-R10 scope note (three seats independently flagged the misreading
risk — mimov26f F2, dsv41f F4, nemotron35sv F2, all verified):** the null
is *bridge-formation-scoped*. E-Q16 family B later sealed the complementary
fact: completion ticks scale ~1/σ (38 → 3 over σ 0.25 → 4) on the dense
phase table. "σ monotone-inert" must never be quoted without its scope —
σ is a gain knob the formation metric cannot see, not a dead parameter.

**Receipts:** `receipts/e_q2_chain.jsonl` tip `67e849a5…` 14 links;
`experiments/outputs/e_q2_results.json`.

---

## C4 — DIES: the cascade is real, the threshold claim is not (E-Q7)

**Priced:** the guest's own round-six lever, frozen verbatim in amendment 3 +
erratum: situation-9 checkerboard (128×64, Attract/Repel parity tiling,
Ground seam, one seeded Attract→Repel flip) under S3 row-major LWW at
σ=2/3 (the θ=π/4 mapping), arms A/N/M/S/OFF plus σ arms 8/5 and 7/10,
T=256.

**Measured:** parityLive 5/64 ticks (the guest's confirm rule needed every
tick in [1..64]); terminal parity-dependence false in BOTH phases; the
falsifier fired: parity-independent collapse in all three σ arms → **C4
FALSIFIED under the guest's own sealed rule.**

**Mechanism (re-derivable from the kernel):** the checkerboard's own Moore-8
physics dominates: every cell sits in a like-signed accumulator field, the
flip perturbs its 8 neighbors by −64 net, and the deviation field spreads at
the toroidal light-cone (radius 64 = full wrap by tick 64; firstSpreadTick
1) — a genuine cascade, regime CASCADE in all four α pairs including
wormhole-OFF. But the terminal state at T=256 shows **zero flip-attributable
substrate-wide inversion anywhere**: a wave that sweeps the whole board and
inverts nothing. The twin channel is not sign-impotent (OFF-ν: 0 firings vs
ON-ν: 991 — the lane's own "same regime" expectation was falsified by its
own run, receipted), yet it does not convert firings into terminal
threshold-dependent structure. The claimed θ > π/4 phase transition does not
exist on this substrate.

**Boundary:** the cascade itself (E-Q7's secondary finding) is a real,
deterministic, fast-spreading relaxation wave — potentially useful as a
propagation primitive (see the boundary map, phase 49). What died is only
the threshold semantics the gift attached to it.

**Receipts:** `receipts/e_q7_chain.jsonl` tip `befa0c33…` 36 links;
`experiments/outputs/e_q7_results.json`; registration `1c93029` + erratum
`7569060`, both pre-run.

---

## C5 — DIES (honest null): self-repair is structurally impossible (E-Q5)

**Priced:** the interpretation was sealed before the runs (τ is frozen in
`tick()`, so timbre damage cannot self-repair under any reading; "repair" is
priced on d-depletion). Armor ring: Repel d=55 on r∈[30,34], Attract core
d=63 on r≤8, 12 adversarial thin cuts, integrity gate 0.95, T=400, arms
A0 pristine / A1 damaged / A2 injector-at-t=50.

**Measured:** all three sealed predictions confirmed. P1: A1 integrity
non-increasing, repairTick null in 20/20, final integrity 0. P2: the
**pristine** ring also self-erodes — integrity crosses 0.95 within a handful
of ticks, half-erosion at tick 28. P3: injected repair does not hold — A2
re-erodes on the same curve (half-erosion 25). No arm reached sustained 0.95
after damage without injection → the C5 falsifier never fired → **C5 DIES.**

**Mechanism (re-derivable from the kernel):** a Repel ring cell is
surrounded by like-timbre Repel neighbors; each subtracts d into its real
accumulator (SPEC L1 s5), so pressure < 0 every tick and `nextD` walks d
toward 0 monotonically — one unit per tick, by the rule table. No
positive-pressure source exists anywhere near the ring (the Attract core is
at r≤8, unreachable from r≥30 through Ground). There is no repair term in
the kernel to find: the substrate's only moves are ±1 toward the pressure
sign, and the geometry guarantees the sign. The ring is not armor; it is a
slowly dissolving battery.

**Boundary:** C5′ (injector semantics) STANDS and is priced definitional
(E-Q10): an external injector CAN restore d=55 and the substrate WILL
re-erode it deterministically — the restore-then-re-erode curve is now a
specified, receipted behavior any downstream system can depend on. If
self-repair is wanted as a primitive, it requires a kernel change (a
positive-pressure source or a τ-mutation rule), which would be a new claim
under the same law, not a rescue of this one.

**Receipts:** `receipts/e_q5_chain.jsonl` tip `4425545f…` 25 links;
E-Q10 `receipts/e_q10_chain.jsonl` tip `50ddf5f9…` 24 links.

---

## What the scoreboard means

Two claims live, and both live for **structural** reasons a stranger can
verify by reading the kernel: C1 because the byte packs operator and operand
into one memory transaction, C2 because the 64-slot table is the only
causal path across Ground. Three claims died, and all three died *cheap,
honest, and with the mechanism explained*: C3 because a pure gain has no
critical scale, C4 because a cascade without terminal inversion is not a
phase transition, C5 because the rule table contains no repair term. The
house paid for every funeral with a receipt, and the receipts are the
boundary map's first three entries: non-local alignment and memory-density
are where the primitive wins; thresholds, numerology, and self-healing are
where it honestly does not.

## LAYER 1 external receipt (ORCH-R14)

The determinism contract now has an OUTSIDE receipt:
[SuperInstance/qthe-verify](https://github.com/SuperInstance/qthe-verify) —
an independent rebuilder built from `SPEC.md` alone (doc-only discipline; its
`verify.mjs` never imports vendor code; the vendored sealed kernel is used
only by the corpus-minting tool). Result: **12/12 corpus cases byte-identical**
to the sealed kernel's replay, including this repo's own armor-ring demo
geometry at two tick depths and a sigma sweep (the C3 parameter). This does
not touch LAYER 2 (the tool explicitly does not test pricing claims) — it is
the LAYER 1 "same input, same bytes, independent of who computes it" claim,
receipted by a stranger. Cross-referenced from the README per the fleet
Reader's Fold: we carry the pointer, not a verdict about the tool.
