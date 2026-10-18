# E-Q18 verdict — hierarchical wormholes on the population axis (ORCH-R18, lane T9-a)

> The E-Q17-redirect experiment, priced. Registration:
> `experiments/pre_registration_e_q18.json` (v1 `3be835e`, amended pre-run:
> EQ18-AM1/AM2/AM3 after the Seed-2.0-mini design attack — 6 attacks, 3
> accepted-in-part, 3 refuted with receipts). Consult:
> `situations/e_q18_design_attack.jsonl` ($0.005254, AS-SAID). Chain:
> `receipts/e_q18_chain.jsonl`, tip `fe059a2e…` (254 links, incl. the
> receipted EQ18 double-seal erratum).

## The measurement

Task: E-Q14-verbatim twin-delivery (K=8 pairs, d 8..15, minPairSep 24,
weather 2×Attract + 1×Repel), θ=8, T=200, 64×64 FIXED grid, seeds
77001..77010 — E-Q17's seeds, so the flat arm's 0/256 cells reproduce
E-Q17's sealed rows bit-exactly (they did: F-CAL PASS). Ladder (EQ18-AM2):
nPoll {0, 16, 32, 64, 128, 256} = writer populations {16, 32, 48, 80, 144,
272} — the POPULATION axis E-Q17's verdict redirected to, at the grid
E-Q14's task class lives on.

Arms: **flat** = the real kernel + the sealed E-Q14 instrumented table (the
baseline of record). **hier** = tickH, a harness-side transcription of the
rule table (F0-T: byte-identical to the kernel in flat configuration, 10/10,
planes AND per-tick event streams — the E-Q13 F1 precedent applied to the
wormhole branch) carrying the two-level table of the HIERARCHICAL-WORMHOLES
spec: 8 regions × 8 local slots (s = d&7) + 8 global presence buckets
(b = d>>3), local-first writes, fixed-order escalation, +1 tick worst case.

## The scoreboard (medians over 10 seeds)

| pop | flat provFrac | flat provDirect | hier provFrac | hier delivered | hier esc% | flat w/slot | hier w/slot |
|----:|----:|----:|----:|----:|----:|----:|----:|
|  16 | 0.0725 | 0.0725 | **0.0066** | 8/8 | 14.2% | 57.14 | 50 |
|  32 | 0.0416 | 0.0416 | **0.0028** | 8/8 | 1.0% | 114.29 | 100 |
|  48 | 0.0189 | 0.0189 | **0.0016** | 8/8 | 0.5% | 171.43 | 150 |
|  80 | 0.0056 | 0.0056 | **0.0003** | 8/8 | 0.2% | 285.71 | 250 |
| 144 | 0.0097 | 0.0097 | **0.0000** | 8/8 | 0.1% | 514.29 | 450 |
| 272 | 0.0000 | 0.0000 | **0.0000** | 8/8 | 0.0% | 971.43 | 850 |

Both arms deliver 8/8 at every level (480/480 pair-trials); flat clean
provFrac 0.0725 reproduces E-Q17's sealed 64×64 value exactly.

## The verdicts (frozen rules, applied verbatim)

- **H1 (region tags restore WHO): DIES — with prejudice, in the opposite
  direction.** The hierarchical arm's provFrac is WORSE than flat at every
  level: clean 0.0066 vs 0.0725 (11× worse), and 2 of 6 levels breach the
  −0.02 no-regression bound (clean −0.066, nPoll=16 −0.039). The rule
  required ≥ +0.10 improvement at ≥ 2 levels; measured ZERO improving
  levels. The secondary (sealed-instrument) comparison agrees.writerRegion
  Correct = 1.0 wherever partner events exist — the construction invariant
  held; the transcription is sound; the DESIGN is what died.
- **H2 (bounded escalation latency): LIVES — the honest null that wasn't.**
  hier delivered median 8/8 at every level; clean-arm first-delivery median
  7 ticks = flat's 7; per-seed pair deliveries span 7–10 ticks in both arms.
  Escalation costs nothing measurable on the delivery channel.
- **H3a (parking-lot contention, no dynamics): LIVES.** Probe ratio exactly
  0.125 = 1/8 at N ∈ {16, 64, 272} — the linear-in-region-count addressing
  gain is real when cargo is frozen.
- **H3b (under drift): NULL confirmed, with a receipt.** writes/slot ratio
  0.875 at every level — a consistent 12.5% gain (64 vs 56 occupied slots),
  nowhere near the 8× of the probe: the d&7 fold cancels the region split
  exactly as pre-registered.

**C9 (the two-level table as specified — 8×8+8, folded addressing) is
PRONOUNCED DEAD on the provenance axis.** Honest null kept beside the body
with its hash, per house law.

## The mechanism autopsy (re-derivable from the telemetry)

The design had two pre-registered death candidates; BOTH fired, and the
first is the headline:

1. **The fold is the killer (pre-registered candidate (a), confirmed).**
   A regional slot s = d&7 is shared by EIGHT cargo classes (d, d+8, …,
   d+56); a flat slot is cargo-EXACT. Under d-drift (the E-Q14 convoy:
   pressure moves d ±1 per tick, and d&7 cycles with period 8), every
   writer sweeps the ENTIRE compressed regional space — 8 addresses per
   region instead of 64. The regional table becomes a party line with 8
   addresses: 86% of clean-arm twin events are LOCAL hits (same-region
   writers on the folded slot), and the reader's own regional slot is
   almost always occupied by a drifted cross-pair writer. The hierarchy
   traded the flat table's cross-region anonymity for cross-cargo aliasing
   — and cross-cargo aliasing is 8× denser.
2. **The global mask is a party line at one remove (candidate (b),
   confirmed).** Escalated events collapse from 14.2% (clean) to 0.0% at
   272 writers: the presence mask points at every region that ever wrote
   the class, and the fixed-order scan (first foreign region, 0..7) takes
   whichever drifted writer sits in the lowest region — attribution by
   region-number lottery.

The one boundary H1's death does NOT cross: delivery. Both channels are
content-addressed enough that ANY resonance on the read address fires the
meter (E-Q14's "contention means firing," standing confirmed) — which is
why H2 lives while H1 dies: **the delivery channel (C2) is robust to the
addressing scheme; the WHO channel is what the fold destroys.**

## The design consequence (for HIERARCHICAL-WORMHOLES, P42)

The spec's own sketch — "8 regional tables of 8 slots each" — is the exact
design that died: 8 slots per region REQUIRES folding d into 3 bits, and
the fold is lethal under drift. The untested alternative that survives this
verdict: **cargo-exact regional addressing** (8 regions × 64 slots + 8
buckets = 520-slot blueprint, 8.1× the flat table) — region-splitting
WITHOUT folding. Its cost is the compile-time blueprint growth the spec
named; its benefit is unproven and now has a priced reason to doubt the
cheap version. If a second live consumer ever needs WHO under load, the
registration skeleton should start from 8×64+8, not 8×8+8 — and should
expect the drift convoy to still erode it (the flat table's own clean
provFrac is 0.07; the ceiling is low for everyone).

## Side findings (kept, priced)

- **The sealed E-Q14 recovery is EXACT at 64×64**: flatProvDirect == the
  sealed log-order pf on ALL 120 flat runs (every seed, every level). The
  instrument-noise question that motivated AM1's secondary metric is
  closed: there is none at this scale. The two instruments can disagree
  only where the log is ambiguous; at 64×64 it never is.
- **Label correction (receipted)**: the results file's controls string says
  F0 "80/80" — the pre-AM2 count. The in-loop assertion covered all 120
  (arm, level, seed) configurations × 2 fresh constructions (240
  executions, all byte-identical); the label lags the AM2 ladder extension.
- **The double-seal erratum** (chain row `erratum.EQ18_double_seal`): the
  runner crashed post-seal on `tip.slice` (appendAndVerify returns a verdict
  object); the re-run appended the identical row set a second time.
  Byte-identical duplicates, zero information conflict, erratum row appended
  (append-only law), runner tail fixed to the E-Q17 pattern.

## Floors

F0-T 10/10 (planes + event streams) · F1 10/10 (no-Abstain cleanliness) ·
F-CAL PASS (bit-exact vs E-Q17's sealed 64×64 clean+density rows: per-seed
pf strings, event counts, delivery) · F0 determinism 120/120 configs
(240 executions, byte-identical checkpoints) · occupancy caps held (flat
≤ 64; hier local ≤ 64, global ≤ 8, every checkpoint) · delivery 480/480
pair-trials, both arms, every level.

## Files

`experiments/pre_registration_e_q18.json` (amended) ·
`experiments/e_q18_hier_population.mjs` (runner) ·
`experiments/outputs/e_q18_results.json` ·
`experiments/outputs/e_q18_tip.txt` · `receipts/e_q18_chain.jsonl` (254
links, tip `fe059a2e59ef1781e5891de8b0b6ae6652bb5d8048f82464818c2be3edfa4ff3`) ·
`situations/e_q18_design_attack.jsonl` (AS-SAID consult) ·
`scripts/verdict_recompute.mjs` (+3 curated claims) ·
`scripts/_eq18_erratum.mjs` (the double-seal receipt) ·
`docs/CLAIM-VERDICTS.md` (C9 row) · `docs/BOUNDARY-MAP.md` (hierarchical
row) · regenerated README section.
