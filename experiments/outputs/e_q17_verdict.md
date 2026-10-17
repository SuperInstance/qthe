# E-Q17 verdict — provenance-correct wormhole at scale (ORCH-R12, lane T3-b)

> hy4's r10 proposal, priced. E-Q16 sealed locality + contention at scale;
> E-Q17's new ground was PROVENANCE at scale — WHO delivered, not how much.
> Registration: `experiments/pre_registration_e_q17.json` (v1 sha
> `7f6a0934…`, amended pre-run: EQ17-AM1/AM2 after the Seed-2.0-mini design
> attack, EQ17-AM3 after the LOUD planting throw). Chain:
> `receipts/e_q17_chain.jsonl`, tip `0d9feae2…` (13 links). Gate: PG1–PG6
> PASS with 23/23 verdict-recompute claims, 17/17 chain coverage.

## The measurement

Task: the E-Q14 family-B twin-delivery task, E-Q14-verbatim geometry (K=8
pairs, d 8..15, minPairSep 24, minCrossSep 8, weather 2×Attract + 1×Repel,
θ=8, T=200, seeds 77001..77010, 2× fresh determinism reruns per config),
lifted across the E-Q16 grid ladder 64×64 / 128×128 / 256×256 with the fixed
flat 64-slot table. Arms per scale: clean (0 polluters), density
(E-Q14-matched 256/4096 area density → 256/1024/4096 polluters), fixed256
(256 polluters at every scale; coincident with density at 64×64 — receipted,
run once under both labels). pf = E-Q14's pollutionFraction
(pollutedEvents / pairEvents, occupant-matched the E-Q14 way); provFrac =
partnerEvents / pairEvents is its per-run complement, sealed beside it.

### pf (pollutionFraction) medians, 10 seeds per cell

| scale | clean | density | fixed256 |
|---|---|---|---|
| 64×64 | **0.9431** | 1.0000 | 1.0000 |
| 128×128 | **0.9078** | 1.0000 | 1.0000 |
| 256×256 | **0.8973** | 1.0000 | 1.0000 |

provFrac medians (the provenance-CORRECT fraction): clean
0.0725 / 0.1043 / 0.1263 at 64/128/256; 0 everywhere under pollution.

**Calibration:** the 64×64 column reproduces E-Q14 family B **bit-exactly** —
per-seed pf strings, pairEvents (3,144/run), and delivery are identical to
the sealed `e_q14_results.json` rows for both the zero-pollution and
256-polluter arms. The ladder's base is not "calibration-ish"; it is the
sealed record rerun.

### Table telemetry (medians)

| scale | clean writes/slot | density writes/slot | fixed256 writes/slot | occupancy |
|---|---|---|---|---|
| 64×64 | 57.14 (3,200 writes) | 971.43 (54,400) | 971.43 (54,400) | 56/64 |
| 128×128 | 57.14 (3,200) | 3,714.29 (208,000) | 971.43 (54,400) | 56/64 |
| 256×256 | 57.14 (3,200) | 14,685.71 (822,400) | 971.43 (54,400) | 56/64 |

Clean totalWrites = 16 members × 200 ticks at EVERY scale; fixed256 = 272
writers × 200 at every scale. The load variable is the writer POPULATION,
not the grid — the fixed-256 arm's perfectly flat 971.43 writes/slot against
the density arm's 971 → 3,714 → 14,686 (~4× per linear doubling) is the
density-vs-count separation the registration froze that arm to make.

## The primary null, the bands, the verdict (applied verbatim)

- **H0 (scale-inert):** |pf(256×256, clean) − pf(64×64, clean)| = **0.0458**
  > 0.02 → **FALSIFIED** — but in the *improvement* direction: pollution
  falls (provenance-correct fraction rises 0.0725 → 0.1263) as the grid
  grows at constant population.
- **FIRE band (the registration's verbatim trigger):** pf(256) < pf(64) −
  0.05 on clean or density → clean: −0.0458 (not < −0.05); density: 0.0 →
  **does NOT fire.**
- **MIRROR band (pre-registered complement reading — pf′ = provFrac, the
  "flat tables lose WHO at scale" direction):** pf(256) > pf(64) + 0.05 →
  **quiet on both arms.**
- **Judgment band:** |Δ| ∈ (0.02, 0.05] on clean → **measured, documented,
  no build** — this is where the result lands. The judgment call, written
  down: the clean-arm drift is real in the medians (monotone 0.9431 →
  0.9078 → 0.8973) but small and seed-noisy — per-seed clean pf spans
  0.79–0.96, only 6/10 seeds show pf(256) < pf(64) (sign test p ≈ 0.38,
  not significant), and several 128/256 seeds share identical pf values
  (the live-read schedule, not geometry, sets attribution). The mechanism
  candidate: at larger arenas the 16 members' row-major interleaving
  changes, occasionally leaving a partner's write in the slot at read time.
  It is a schedule effect, not a mechanism gain — nothing here supports a
  design response.
- **Floors:** delivery **640/640** pair-trials (100%, every run of every
  arm — E-Q14's ceiling reproduced and extended); pf calibration floor held
  (0.9431 ≥ 0.90, exactly E-Q14's sealed value); occupancy cap ≤ 64 held at
  every checkpoint; determinism F0 held — 80/80 runs byte-identical across
  2× fresh constructions, checkpoints [0,50,100,150,200].

**Primary-null verdict: H0 falsified inside the pre-registered judgment
band, in the provenance-IMPROVES direction. The hierarchical trigger does
NOT fire under either reading.**

## What it means for HIERARCHICAL-WORMHOLES (H1's trigger, priced)

The build trigger was "a second live consumer needing provenance under
load." E-Q17 prices its scale component: **grid growth does not degrade
provenance** — the flat table's WHO-loss is a function of the writer
population per slot, and it is already complete at 64×64 (pf 0.9431 clean;
1.0 under E-Q14-matched pollution at every scale). hy4's r10 F1 prediction
("at 256×256 … last-writer-wins guarantees massive aliasing") is confirmed
in substance and corrected in attribution: the massive aliasing is real at
256×256 — and equally real at 64×64; what scales is the writer population
(E-Q16's density regime: contention 353 → 5,874; E-Q17's density arm:
971 → 14,686 writes/slot), not the grid. A second live consumer that holds
its Abstain population steady inherits E-Q14's boundary unchanged at any
board size; one whose population grows with area hits the wall E-Q16
already priced. **H1 (region tags restore WHO under congestion) remains
unbuilt and untriggered by scale; if it is ever built, the registration
skeleton's paired arms should vary POPULATION at fixed grid, where the
load actually lives.**

## The design-attack consult (founder's creative mandate)

Seat: **ByteDance/Seed-2.0-mini**, ATTACK-briefed (the r11 law: an
audit-briefed Seed converges to the mean), max_tokens 10,000 (r11 learning:
it drew 6.7k at an 8k cap), temperature 0.3, one call, sealed AS-SAID to
`situations/e_q17_design_attack.jsonl` (sha `c0876d35…`): 6 attacks, direct
JSON parse, finish stop, 4,663 prompt / 9,472 completion tokens, **$0.004255**,
70.8 s, zero cache hit (single-call round, structurally cold — receipted).

Dispositions (every attack receipted in the pre-registration, none ignored):

- **A1 (critical)** "10% density scales writes/slot with G², H0 trivially
  falsified" — REFUTED: misread the task; the twin-delivery class holds the
  population constant (A1's own prescribed fix), and H0 lives on the clean
  arm. The density arm scales with area *by design*, matched to E-Q14's
  heaviest arm.
- **A2 (critical)** "fixed256 uninterpretable" — REFUTED: that arm's
  variation IS the discriminator; its scale-constant contention (971.43 at
  all three scales) is the experiment's cleanest separation result.
- **A3 (major)** "d-window violates minPairSep" — REFUTED: minPairSep is a
  spatial constraint, not a d-separation; E-Q14's own pairs sat on adjacent
  d values (the sealed convoy mechanism). Moot after AM3 anyway (d 8..15).
- **A4 (major)** "100% delivery unachievable at 256×256" — REFUTED by the
  sealed record and then by the run: delivery is content-addressed — more
  contention means more firing (E-Q14 A: firers ratio 1.0 at φ=1.0);
  measured 640/640. Relaxing a frozen floor post-hoc is the forbidden move.
- **A5 (major)** "bucketed matching may diverge from the linear scan" —
  ACCEPTED IN PART → **EQ17-AM1**: the verbatim E-Q14 linear recovery is the
  recovery of record at 64/128; at 256×256 the bucketed matcher runs behind
  live per-seed 25-tick prefix assertions plus a full 200-tick cross-check
  on seed 77001 — every run, LOUD on divergence. All assertions passed
  (250 prefix checks + 2 full cross-checks at 256×256).
- **A6 (minor)** "coincident 64×64 arms double-count" — ACCEPTED as schema
  clarification → **EQ17-AM2**: canonical (grid, nPoll) configs with
  arm_labels; per-cell medians over 10 distinct seeds; nothing pooled.

The consult's best attack was A1 — wrong about this design, but it names the
exact confound (population vs density) that turned out to be the experiment's
headline variable; the attack and the refutation both sharpened the readout.

A third amendment (**EQ17-AM3**, not from the consult): the runner's
pre-run probe hit the registered LOUD failure — the 20-pair default and the
pre-registered K=16 fallback are weather-infeasible at 64×64 (K=12 fails
10/10 seeds; the awayFromPairs=10 zones saturate the torus). K=8,
E-Q14-verbatim, was sealed instead — which is what made the bit-exact
reproduction of E-Q14's arms possible.

## Honest caveats

- The judgment-band drift (−0.046) is within seed noise (6/10 sign test);
  the pre-registered bands handle it exactly as designed — documented, no
  build, no over-read in either direction.
- pf saturates at 1.0 under pollution at every scale: the density and
  fixed256 arms cannot detect further degradation (ceiling). The scale
  question for polluted regimes is answerable only below saturation (e.g.
  16–64 polluters, E-Q14's 0.96/0.998 regime) — not measured here; the
  registration's arms were chosen to bracket, not interpolate.
- 10 seeds × 3,100–3,200 pair-events per run give tight per-run pf (SE ≈
  0.004) but the between-seed spread (±0.06) dominates the medians; the
  64×64 column's exact reproduction of E-Q14 is the strongest evidence the
  spread is placement variance, not run noise.
- The weather-feasibility wall at 64×64 caps this task class at K ≤ 11
  pairs — a real geometric boundary of the E-Q14 planting machinery,
  receipted in AM3, worth knowing before anyone scales the task itself.
- Single task class (twin delivery), single sigma (kernel default), single
  table (flat 64-slot): the verdict is about THIS class; the map's row says
  so.

## Files

`experiments/pre_registration_e_q17.json` (amended) ·
`experiments/e_q17_provenance_scale.mjs` ·
`experiments/outputs/e_q17_results.json` ·
`experiments/outputs/e_q17_tip.txt` · `receipts/e_q17_chain.jsonl`
(13 links, tip `0d9feae2df50889b233a7f75cc292cdd6f04645799b9321809b4ba5ddad0a2eb`) ·
`situations/e_q17_design_attack.jsonl` (AS-SAID consult) ·
`scripts/chain_registry.mjs` (e_q17 registered, seal-time law) ·
`scripts/verdict_recompute.mjs` (+3 curated claims: pf-scale-table,
floors-bands, contention-population) · `docs/BOUNDARY-MAP.md` (provenance
row closed) · regenerated budget/fleet-seeds/dashboard.
