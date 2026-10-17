# Where the primitive wins, loses, and is neutral — with receipts

> The boundary map. Task ORCH-D (roadmap phase 49). Every row is a sealed
> stone-v1 chain row or a sealed results file — not an opinion. Companions:
> `docs/TECHNICAL-NOTE.md` (the primitive), `docs/ADOPTION-KIT.md` (the
> adoption decision), `docs/CLAIM-VERDICTS.md` (the LAYER 2 reasoning),
> `docs/FALSIFICATION-BUDGET.md` (what was paid to know this).

## The map

| regime | outcome | mechanism | receipt |
|---|---|---|---|
| Non-local alignment across Ground | **WINS** | Ground contributes to neither channel, so distant Abstain cells are causally disconnected without the table; the 64-slot table is the only causal path, and live-read row-major LWW makes equal-d twins mutually resonant from their second co-tick | E-Q1: 8/8 pairs delivered ON vs **0/20 OFF**, bridging at tick 1, delivery ticks 8–9; `receipts/e_q1_chain.jsonl` tip `addc22f9…` (25 links); `docs/CLAIM-VERDICTS.md` §C2 |
| Memory density vs 2-byte encodings | **WINS (~47%)** | one packed-byte read yields operator AND operand: the Moore-8 gather costs 9 reads + 1 write per cell per tick vs 18 + 1 for the two-plane port | E-Q13: 331,776 vs 630,784 bytes-to-task at tick 8 = **47.40%**, ticks identical 20/20, footprint 4,096 vs 8,192 B, port-dynamics identity held 20/20; `receipts/e_q13_chain.jsonl` tip `d852e6ac…` (25 links); boundary: a cached port reaches per-tick parity (10 vs 10) at 4,096 standing bytes |
| Load tolerance / high Abstain density | **NEUTRAL-to-WINS** | S3 live-read keeps most readers hearing someone under load; the 64-slot occupancy cap is structural | E-Q14 A: median distinct-firers ratio **1.0** at φ ∈ {0.25, 0.5, 0.75, 1.0} (floor: ≥ 0.60), occupancy ≤ 64 at every tick of every arm; `receipts/e_q14_chain.jsonl` tip `15776ca2…` (70 rows); `e_q14_results.json` aggregates |
| Total slot collision (all 64 cells, one slot) | **WINS (survival)** | live-read LWW: every writer is heard; last writer dominates the resonance | E-Q6: survival rate 0.984375, 64/64 distinct firers; `receipts/e_q6_chain.jsonl` tip `ab4ea196…` (15 links) |
| Slot congestion under population pressure | **LOSES provenance, KEEPS delivery** | the table is CONTENT-addressed, not identity-addressed — any occupant with resonance ≠ 0 fires the reader; the 16 planted members form a climbing convoy on adjacent d-tracks (d 8..15, ~1/tick) that compresses into shared slots (partner events 6/tick → 1/tick) until all saturate at d = 63 and slot 63 becomes a permanent party line | E-Q14 B: pollution-fraction medians 0.943 → 0.962 → 0.998 → 1.0 at 0/16/64/256 polluters (monotone), delivery **80/80** pair-trials full-8 at 256 polluters; B3 zero-pollution cleanliness FALSIFIED — one of the 7 banked nulls of `docs/FALSIFICATION-BUDGET.md`; autopsy row 70 of `e_q14_chain.jsonl`. **ORCH-R10 baseline note (mimov26f F1, verified):** the 80/80-at-256-polluters reading is *baseline-relative* — delivery was already at ceiling in the zero-pollution arm (80/80 delivered, pollution fraction 0.94), so on this class pollution never threatened delivery; what it costs is provenance, already compressed at zero |
| Noise perturbation of cascades | **NEUTRAL** | ±1 d-perturbations (τ preserved, injector semantics) perturb trajectories, not the cascade character; Moore-8 pressure propagates one step per tick | E-Q14 C: regime CASCADE **5/5 seeds in both arms**, planes diverge (first-divergence ticks 8,8,8,8,8 — the first injection round), radius 7–8 at t=64; `e_q14_results.json` familyC |
| Critical σ scales | **NEUTRAL-DEAD** | on Ground-separated pairs the real accumulator is identically zero, so pressure = resonance·σ > 0 for every σ > 0 — a pure gain has no critical scale; only delivery latency scales ~1/σ | E-Q2: full tie across σ ∈ {0.5, 1, log₂(3), 2, 4} on bridge formation and ticks-to-first-bridge (σ monotone-inert); `receipts/e_q2_chain.jsonl` tip `67e849a5…` (14 links) |
| Threshold-triggered non-local transfer | **DEAD** | the cascade is real (regime CASCADE in all four α pairs, spread at the toroidal light-cone from tick 1) but shows zero flip-attributable substrate-wide inversion at T=256 — a wave that sweeps the board and inverts nothing | E-Q7: parityLive 5/64 ticks, terminal parity-dependence false in both phases, ON-ν 991 firings vs OFF-ν 0 yet no threshold-dependent terminal structure; `receipts/e_q7_chain.jsonl` tip `befa0c33…` (36 links); falsified under the guest's own sealed rule |
| Self-repair | **DEAD** | no repair term exists in the kernel: like-timbre Repel neighbors make pressure < 0 every tick and the rule table walks d to 0 one unit per tick; hooks/injectors are the repair mechanism, and re-erosion after injected repair is deterministic (C5′) | E-Q5: repairTick null 20/20, pristine ring self-erodes (half-erosion tick 28), injected repair re-erodes (half-erosion 25); `receipts/e_q5_chain.jsonl` tip `4425545f…` (25 links); C5′ E-Q10: `receipts/e_q10_chain.jsonl` tip `50ddf5f9…` (24 links) |
| Adversarial rational σ on the float plane | **LOSES fidelity** | the uncoupled (acc, resonance) space contains exact-zero real-pressure families for rational σ (3·acc+2·r=0 at 2/3; 5·acc+8·r=0 at 8/5): the float kernel's double rounding collapses its own σ's true nonzero pressure to `=== 0` (cell holds) while the fixed kernel keeps the honest remainder and moves — the fixed plane is faithful to its own scale, the float plane deviates from its own | E-Q8: float-only artifact ESTABLISHED — float held / fixed moved at tick 1 at 2/3 (contested slot 20) and 8/5; `receipts/e_q8_chain.jsonl` tip `78646460…` (17 links); fixedpoint P-B1 autopsy: all 23 diverged cases are family hits, 22/23 with floatP === 0 exactly (`fixedpoint/findings.md`) |
| Runtime cost of exactness | **NEUTRAL** | the fixed plane replaces one double-multiply with an integer multiply; the tick loop is dominated by the Moore-8 gather, so the planes are indistinguishable at the workload level | `fixedpoint/COST-OF-EXACTNESS.md`: **0.975×** (median 19.12 vs 19.61 ms per run; 64×64 twin-delivery class, 400 ticks, 5 fresh reruns per arm; Node 24, x86_64); chain rows `cost_benchmark.ORCH6`, tip `ff70bdea…` (26 links) |
| Grid scaling with fixed 64 slots | **HOLDS in the firing-rate sense — capacity-bounded, POPULATION-indexed** | per-cell firing is grid-size-independent at 10% Abstain (firings/tick/cell ratio 1.000/0.983/1.041 across 64/128/256) and occupancy stays 56/64 — but the 64-slot table is a hard capacity bound, not a scaling law: contention rises monotonically 353.6 → 1387.5 → 5874.1 writes/slot (~100× oversubscription at 256²/10% Abstain). "Locality holds" means the FIRING-RATE metric is grid-invariant, NOT that a 256² plane's would-be endpoints find slots — the table serves content, not identities. E-Q17's fixed-256 arm (constant 272 writers at every scale) seals the variable: writes/slot 971.43 CONSTANT at 64/128/256 while the density arm scales 971 → 3714 → 14686 — contention is indexed to the writer POPULATION, not to the grid | E-Q16 family C (sealed): occupancy 56/64 constant, contention monotone, firings ratio 1.000/0.983/1.041; `receipts/e_q16_chain.jsonl` (19 links incl. the run-1 erratum). E-Q17 fixed-256 arm: totalWrites 54,400 and writes/slot 971.43 identical at all three scales; `receipts/e_q17_chain.jsonl` tip `0d9feae2…` (13 links). ORCH-R10: this row was first written PENDING and the E-Q16-C seal never landed in it (the ORCH-final commit message overstated); row now drawn from the sealed record, wording sharpened after hy4p F2 verified the capacity-vs-locality misreading risk |
| Provenance (WHO) under grid scaling | **LOSES at saturation, POPULATION-indexed — grid-inert; hierarchical trigger NOT fired** | the flat table loses WHO exactly as E-Q14 sealed at 64×64 (convoy + slot-63 party line) and NO MORE at scale: at constant writer population the pollution fraction and writes/slot are scale-constant, and under density-matched pollution pf saturates to 1.0 at every scale — the aliasing hy4's r10 F1 predicted is already complete at 64×64, so grid growth adds nothing to it. Grid growth per se slightly IMPROVES partner attribution on the clean arm (pf 0.9431 → 0.9078 → 0.8973, Δ = −0.046 — the live-read schedule spreads writers across more row-major positions, it is not a mechanism gain) | E-Q17 (ORCH-R12/T3-b): pf medians (E-Q14 pollutionFraction, 10 seeds/scale) clean **0.9431 / 0.9078 / 0.8973** at 64/128/256, density & fixed-256 **1.0** at all scales; delivery **640/640** pair-trials; \|pf(256,clean) − pf(64,clean)\| = **0.0458** → primary null falsified INSIDE the pre-registered judgment band (0.02 < \|Δ\| ≤ 0.05, improvement direction); FIRE band (Δ < −0.05) and MIRROR band (Δ > +0.05) both quiet → **the HIERARCHICAL-WORMHOLES build trigger does not fire**; occupancy 56/64 constant; `receipts/e_q17_chain.jsonl` tip `0d9feae2…` (13 links); the 64×64 column reproduces E-Q14 family B bit-exactly (per-seed pf strings identical, pfMed 0.9431) |

## How to read the map

Each entry is a sealed chain row, not an opinion. "WINS," "LOSES," "DEAD,"
and "PENDING" are verdict strings backed by a pre-registered floor, a run
whose re-run is byte-identical, and a stone-v1 chain tip you can verify from
disk (`node scripts/verify_all_chains.mjs`). Where a floor was falsified, the
falsification is itself banked — the E-Q14 B3 row is in the falsification
budget's crown jewels (`docs/FALSIFICATION-BUDGET.md`) precisely because the
assumption it killed (pair slots are private under zero pollution) was one a
downstream designer would have made for free. Read the receipt column as the
price of certainty: 7 banked nulls and 7 caught defects against zero silent
failures is what it cost to draw these borders.

## The two structural wins

Both surviving performance claims live for structural reasons a stranger can
verify by reading the kernel (`docs/CLAIM-VERDICTS.md`):

1. **The byte packs operator and operand into one memory transaction** (C1).
   τ and d travel together, so the Moore-8 gather touches half the memory the
   two-plane port touches — 47.40% fewer bytes to task, forever, at zero
   dynamics cost (the port tracked the kernel byte-identically in 20/20
   trials). The one honest edge: a cached port buys back per-tick parity by
   holding the τ-plane resident — 4,096 standing bytes and a frozen-τ
   assumption any injector breaks.
2. **The compile-time slot table is the only causal channel across Ground**
   (C2). Because Ground forwards nothing, the table is not one non-local
   mechanism among many — it is the only one, which is why the OFF arm
   delivers nothing, ever (0/20). Non-local alignment with no message bus, no
   routing table, no per-pair state, O(1) per Abstain cell.

## The three structural dead-ends

All three died cheap, honest, and with the mechanism explained:

1. **No critical σ scale** (C3/E-Q2): a pure gain cannot single out a scale.
   σ remains useful — it sets delivery latency (~1/σ) — but the numerology is
   dead.
2. **No threshold semantics** (C4/E-Q7): a cascade without terminal inversion
   is not a phase transition. The relaxation wave itself is real and may be
   useful as a propagation primitive; only the threshold claim is dead.
3. **No self-repair** (C5/E-Q5): the rule table's only moves are ±1 toward
   the pressure sign, and ring geometry guarantees the sign. Repair is an
   external injector's job (C5′/E-Q10): restore-then-re-erode, deterministic,
   receipted — a specified behavior, not an emergent one.

## The congestion rule of thumb

From the E-Q14 B autopsy, for designers: **if you need WHO, keep d
assignments separated** — 64 slots, and 16 members climbing at ±1/tick on
adjacent d-tracks WILL collide; assign d with separation margins and drift
control. **If you need only signal, congestion is harmless** — the table is
content-addressed, any positive term delivers, and delivery held 80/80 at
256 polluters. The failure mode is attribution, not delivery: pollution
fraction rises monotonically to 1.0 while every pair still delivers.

## The map's edge

The map is complete only where the receipts reach. The grid-scaling row is
now drawn from the sealed E-Q16-C numbers (it stood PENDING until ORCH-R10
found the seal had never landed in the row — the commit message had
overstated); every other row cites a chain tip. The provenance-at-scale
question that stayed open after E-Q16 (the ADOPTION-KIT's "sealed scaling
number for grids beyond the corpus's boards, pending the E-Q17 run") is
closed by E-Q17: provenance loss is population-indexed and already complete
at 64×64 — the hierarchical table's build trigger ("a second live consumer
needing provenance under load") does not fire on grid growth alone; it would
fire on writer-population growth, which E-Q16's density-scaling regime
already prices. Unmeasured regimes are marked pending, never extrapolated —
the moment a stranger's rerun contradicts a row, the row dies and the
autopsy begins; that is the whole law of this house.
