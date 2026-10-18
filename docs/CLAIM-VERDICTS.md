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
| C9 | hierarchical wormholes (8×8+8, folded addressing) restore provenance under population load | **DIES** (with prejudice, opposite direction) — hier provFrac WORSE than flat at every population level (clean 0.0066 vs 0.0725, 11× worse); the d&7 fold trades cross-region anonymity for 8× denser cross-cargo aliasing and the drift convoy floods it. H2 (escalation latency) LIVES: 8/8 delivery, first-delivery 7 == 7 — the delivery channel is addressing-robust; the WHO channel is what dies | E-Q18 (ORCH-R18) | `fe059a2e…` (254 links) |
| C10 | a qthe-docket (tiled task arbitration) reduces starvation and source-monopolization under flapping and source-local flooding vs a FIFO+static-priority inbox, at spatial-baseline parity | **DIES** (on H1) — the debounce changes timing, not throughput share (A-static stableStarve == the heap's exactly, 0.4435); the physics bundle cuts starvation 0.44→0.32 (the re-boost-as-FIFO-penalty law, AM6(i) confirmed) but buys it with stable p99 +33% (845 vs 633). H2 flood-cap LIVES structurally — tiles aligned with source homes cap the flooder at maxShare@500 0.339 vs the heap's 0.75; T_end erosion 0.436 = the backlog-bounded boundary. H3/H4 vacuous in the drained regime (p50=0 both; receipted as unmeasured, not passed) | E-Q19 (ORCH-R20) | `568bfef3…` (19 links) |
| C11 | the tick operator is a construction-provenance blindfold: PRNG / quantum-ROOTED hash-expanded comet-certified (SP 800-90B root) / quantum-blur-conditioned planes become statistically indistinguishable within the PRNG noise floor by tick 64, each individually byte-deterministic | **DIES** (on H2) — H1 LIVES cleanly: the certified quantum root, SHA-256-expanded, is indistinguishable from mulberry32 at EVERY checkpoint x metric (byte provenance is invisible — the NIST 90B-to-90A pattern is behaviorally transparent). H3 LIVES: the blur's t=0 fingerprint is huge (dW1 12.06 vs floor 0.51) and the exact circuit is INTERFERENCE-SHAPED — Moore-8 Moran's I NEGATIVE (−0.068; a classical smoothing blur would be strongly positive) — a measured quantum-native geometry. H2 DIES: spatial autocorrelation has not equilibrated by t=64 (A3 0.038 / A3S 0.034 vs floor 0.021, converging monotonically) while dW1/tauTV/twinRate DID wash out — initial spatial correlation is a SLOW MODE of the tick operator; the A3S excursion proves the persistence is dynamical, not quantum-specific. T* > 64 | E-Q20 (ORCH-R21) | `a310f37e…` (22 links) |

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

## C9 — DIES (with prejudice): the two-level folded table is worse than flat on the axis it was built for (E-Q18)

**Priced:** the E-Q17-redirect axis — POPULATION at fixed grid. E-Q14-verbatim
 twin task, 64×64, seeds 77001..77010, polluter ladder {0,16,32,64,128,256}
(= writer populations 16..272). Flat arm = the real kernel (F-CAL: reproduces
E-Q17's sealed 64×64 rows bit-exactly). Hier arm = tickH transcription
(F0-T: byte-identical to the kernel in flat configuration, planes AND event
streams) carrying the HIERARCHICAL-WORMHOLES spec's own design: 8 regions ×
8 local slots (s = d&7) + 8 global presence buckets, fixed-order escalation.

**Measured:** hier provFrac below flat at ALL six levels — clean 0.0066 vs
0.0725 (11× worse), 2 levels breaching the −0.02 no-regression bound, ZERO
improving levels against the ≥ +0.10-at-2-levels rule. H2 LIVES (8/8
delivery everywhere, first-delivery median 7 == 7 — escalation is free).
H3a probe: contention ratio exactly 1/8 without drift; H3b: 0.875 under
drift (the fold cancels the split, pre-registered null).

**Mechanism (re-derivable from the telemetry):** a regional slot s = d&7 is
shared by eight cargo classes where a flat slot is cargo-exact; under d-drift
(the E-Q14 convoy — pressure moves d ±1 per tick and d&7 cycles with period
8) every writer sweeps the entire compressed regional space. 86% of
clean-arm twin events are LOCAL hits on folded slots occupied by drifted
cross-pair writers; escalated events collapse 14.2% → 0.0% as the presence
mask becomes a party line at one remove. Region-splitting without folding
(8×64+8 = 520 slots) is the untested survivor of this verdict.

**Receipts:** registration `pre_registration_e_q18.json` (v1 `3be835e`,
amended pre-run AM1–AM3 after the Seed-2.0-mini design attack — 3
accepted-in-part, 3 refuted); consult `situations/e_q18_design_attack.jsonl`
($0.005254, AS-SAID); results `outputs/e_q18_results.json`; chain
`receipts/e_q18_chain.jsonl` tip `fe059a2e…` (254 links, incl. the receipted
EQ18 double-seal erratum — post-seal crash, byte-identical duplicates,
append-only law honored). Side finding kept: flatProvDirect == sealed flat
pf on all 120 flat runs — the E-Q14 log-order recovery is EXACT at 64×64.

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

## C10 — DIES on H1 (the debounce is timing, not share); the flood cap LIVES (E-Q19, ORCH-R20)

**Priced:** the first consumer-driven claim. The docket — task arbitration
on a ticking 64×64 substrate, jurisdiction tiles, best-ATTRACT claims (max
current d, ties age/id), Abstain deferral with wormhole escalation, the REAL
kernel every epoch — against the standard inbox (FIFO + static priority)
and the naive spatial baseline (nearest-first), under L1 uniform / L2
flapping (source 0 re-boosts to [48..62] every 8 epochs) / L3 source-local
flood at 50% volume under overload. 5 arms × 3 loads × 10 seeds × 2
determinism runs, 150/150 byte-identical.

**The autopsy:** (1) *the debounce changes timing, not throughput share* —
A-static's stableStarve equals the heap's EXACTLY (0.443539…): with
flappers spread across every tile and capacity binding, the epochs a
flapper spends deferred are epochs a stable task eats that it would have
eaten anyway in expectation; capping a gamer under overload needs admission
control, not arbitration physics. (2) *the physics cuts starvation anyway*
— full-A 0.3194 vs A-static 0.4435: under 0.90 saturation, d-ties at 63
break by age and the re-boost re-stamps the flapper's cell at [48..62],
resetting its own aging — the gamer's boost is a self-inflicted FIFO
penalty (the AM6(i) prediction, confirmed). (3) *but it buys starvation
with tail latency* — stable p99 845 vs the heap's 633; age-tie serving
queues young stable work behind old. (4) *the flood cap is structural and
backlog-bounded* — tiles aligned with homes cap the flooder at 0.339 of
served at the pre-overflow checkpoint vs the heap's 0.75; once the flood
backlog overflows its region (7,113 overflows per run receipted) the cap
erodes to 0.436. Plane capacity is flood insurance. (5) *AM2 confirmed* —
the wormhole escalation carried 1 claim in 12,000 tasks: the table is
written at the deferred task's drifted d and read at the claimer's cargo
slot — E-Q14's WHO-loss, consumer-side; a consumer needing deferred-task
recovery must pin the defer band to the claimer band or accept eventual
re-visibility by τ-flip as the only guarantee.

**What survives:** the docket ships as the second live consumer (T11-b)
with an honest label — flood-capping and gaming-penalty yes, flapping
starvation no, tail latency the price. The 8×64+8 hierarchical survivor's
trigger now carries E-Q19's warning: its provenance channel is the exact
channel AM2 prices as addressing-mismatched under drift.

---

## LAYER 2 deployment receipts (ORCH-R16, 2026-10-18)

The Cloudflare deployment is live and each claim below is measured by
`bash cloudflare/live_checks.sh` (fail-closed). Worker:
`https://qthe-cell.casey-digennaro.workers.dev` — kernel vendored
byte-identical, provenance `cloudflare/PROVENANCE.txt`.

| id | claim | verdict |
|---|---|---|
| C7 | DO-serial ticks preserve the determinism law at the edge | **EARNED (measured live)** — two independent DOs, seed 33001, 50 ticks → identical state hash; in-DO replay agrees; hash stable across save/load. Re-run at seed 777/40 → agrees. ERRATUM 1 (event-in-hash) found by the check itself, fixed, receipted in `cloudflare/src/worker.js`. |
| C6 | Vectorize twin sidecar serves the wormhole table's pairing | **INFRASTRUCTURE LIVE** — exact lookup (similarity 1.0), 64/64 census; convergence is eventual (~10–20 s observed), DO authoritative. The original *pricing* claim (slot-histogram similarity predicts twin overlap) remains **OPEN** — the sidecar is its substrate, not its proof. |
| C8 | the A2UI mirror over Pages | **LIVE (static form)** — landing + demo byte-identical over HTTPS (`https://qthe-demo.pages.dev`). The original fan-out pixel-faithfulness claim remains **OPEN**. |
| — | R2 receipt chains, content-addressed | **EARNED (measured live)** — all 13 sealed chains in `qthe-receipts`; fetched bytes sha256-identical to local (`0ee28675…7455e` for e_q1). |
| — | the falsifier law at the deploy layer | **EARNED** — two live-check errata (event-in-hash, single-segment keys) found by the checks before any claim was written, fixed, receipted in-code. |

Ops laws banked (see the deployment addendum): the propagation-window law
(build markers before trust), the local-first wrangler law (`--remote` or
it didn't happen), the eventual-consistency law (the sidecar converges;
retry with backoff, never assert immediacy).

## LAYER 2 deployment receipts, addendum (ORCH-R17, 2026-10-18)

**C6 is now PRICED — it DIES.** The r15 claim ("cross-substrate
slot-histogram similarity predicts useful twin overlap") was run live
against the dedicated `qthe-c6` Vectorize index through the Worker's
experiment lane, under a pre-registered design + one receipted amendment
(`cloudflare/e_c6_histogram_overlap.mjs`,
`cloudflare/outputs/e_c6_histogram_overlap.json`):

- Run 1 INVALID (receipted): the brand-new index did not serve its first
  upserts within the 20 s settle (empty rankings; instrument), and the
  original ground truth (binary occupied-slot Jaccard) is degenerate —
  **a kernel finding kept from the run: the 64-slot table saturates after
  ONE tick** (seeds 7000–7002, 32×32: ~256 Abstain writers cover all 64
  slots; occupancy stays 64/64 through tick 40).
- Run 2 VALID (M3 sanity gate 30/30; amended ground truth = behavioral
  cross-resonance overlap, spread 22.5–122.9): **M1 precision@5 = 0.053**
  (below the ~0.17 chance floor), **M2 Spearman = −0.16** (slightly
  anti-correlated). The claim dies below chance.
- **The mechanism**: L2-normalized histograms discard exactly the
  resonance *mass* that drives behavioral overlap (a high-mass table
  resonates everyone's abstainers) and keep only the slot-distribution
  *shape* that behavior ignores. The retrieval signal and the behavioral
  signal are near-orthogonal — mildly anti-correlated here.
- The twin sidecar infrastructure (r16) remains live and useful for
  exact slot lookup; what died is the histogram-similarity *pricing*
  claim. A claim that dies, dies cheap and honest: total cost $0
  (code + free tier), receipt kept beside the body.

**KV HUD + cron beat: EARNED.** The 5-minute beat (the
tminus-dispatcher convergence) fires at the boundary and advances
`cron-field` exactly once per beat (P-D measured: 0 → 1, HUD sha256
`e6fdcd1b…` ≡ the DO's `/hash`). The HUD line is served from KV at
`GET /hud`. After ERRATUM 3 (the beat's `stub.fetch` calls defaulted to
GET; init/tick require POST — the first beat wrote a hollow HUD; found
by the P-D check, fixed, re-verified).
