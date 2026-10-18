# ORCH-R18 Round Report — the population-axis round (C9 dies with prejudice)

Filed 2026-10-18 (later same day than r17's close), orchestrator (Z.ai),
erised fleet line. Registration: `2026-10-18-orch-r18-registration.md`.

## T9-a — E-Q18: the E-Q17 redirect, priced

The round's main work. E-Q17's verdict closed with "if it is ever built,
the registration skeleton's paired arms should vary POPULATION at fixed
grid, where the load actually lives" — and r17's C6 one-tick-saturation
finding pointed at the same axis. E-Q18 built the two-level table of the
HIERARCHICAL-WORMHOLES spec (8 regions × 8 local slots, s = d&7; 8 global
presence buckets, b = d>>3; local-first writes; fixed-order escalation,
+1 tick worst case by construction) as a harness-side transcription
(F0-T: byte-identical to the real kernel in flat configuration, 10/10,
planes AND per-tick event streams) and ran it against the flat kernel on
the E-Q14-verbatim twin task at fixed 64×64, polluter ladder
{0, 16, 32, 64, 128, 256} = writer populations 16..272, seeds 77001..77010
(the E-Q17 seeds — F-CAL: the flat arm's 0/256 cells reproduce E-Q17's
sealed 64×64 rows bit-exactly; they did).

**Verdicts (frozen rules, applied verbatim):**

- **H1 DIES with prejudice, in the opposite direction.** hier provFrac
  WORSE than flat at every level — clean 0.0066 vs 0.0725 (11× worse);
  zero improving levels, two breaching the −0.02 no-regression bound.
  Mechanism (both pre-registered death candidates fired): the s = d&7
  fold serves eight cargo classes per regional slot where flat is
  cargo-exact, and under d-drift every writer sweeps the whole compressed
  space — cross-cargo aliasing, 8× denser, replaces the cross-region
  anonymity the design meant to remove; the global presence mask is a
  party line at one remove (escalated fraction 14.2% clean → 0.0% at 272
  writers). The untested survivor: region-splitting WITHOUT folding
  (8×64+8 = 520 slots).
- **H2 LIVES — the honest null that wasn't.** 8/8 delivery at every
  level on both arms (480/480 pair-trials); clean first-delivery median
  7 == flat's 7. Escalation is free; the delivery channel is
  addressing-robust (any resonance fires the meter) — which is exactly
  why it survives while the WHO channel dies.
- **H3a LIVES** (parking-lot probe: contention ratio exactly 1/8 at
  N ∈ {16, 64, 272} — the addressing gain is real without drift);
  **H3b null confirmed** (0.875 at every level under drift — the fold
  cancels the split, with a 12.5% receipt: 64 vs 56 occupied slots).

**Side findings kept:** flatProvDirect == sealed flat pf on all 120 flat
runs — the E-Q14 log-order recovery is EXACT at 64×64 (the
instrument-noise question AM1 was asked to close: closed, there is none).
writerRegionCorrect = 1.0 wherever partner events exist (the construction
invariant held; the transcription is sound, the design is what died).

**Discipline:** registration committed BEFORE any run (`3be835e`);
Seed-2.0-mini design attack (6 attacks, $0.005254, AS-SAID, sealed to
`situations/e_q18_design_attack.jsonl`) → 3 amendments pre-run (AM1
instrument-parity primary, AM2 ladder extension to 6 levels, AM3 H2
tightening) + 3 refutations receipted in the registration (A2: the kernel
is slot = d, not d&7; A4: the construction-invariant argument; A6: the
two (x,y) pairs clarified). Floors: F0-T 10/10, F1 10/10, F-CAL PASS,
determinism 120/120 configs (240 executions), occupancy caps held,
delivery 480/480.

**Erratum (receipted, append-only):** the runner crashed POST-seal on
`tip.slice` (appendAndVerify returns a verdict object, not a string); the
re-run appended the identical row set a second time — byte-identical
duplicates, `erratum.EQ18_double_seal` row appended, runner tail fixed to
the E-Q17 pattern. Chain tip `fe059a2e…` (254 links).

**Bookkeeping:** CLAIM-VERDICTS C9 row + section; BOUNDARY-MAP
hierarchical row; HIERARCHICAL-WORMHOLES verdict appendix; verdict file
`experiments/outputs/e_q18_verdict.md`; +3 curated claims in
verdict_recompute (26/26 ALL PASS, coverage 18/18); fleet-seeds + budget
+ dashboard regenerated (the dashboard's 6-row drift pin fired correctly
on C9 and was bumped to 7 in-commit — the fail-loud design doing its
job).

## Creative lane (the operator's ask, shipped early in the round)

Three new pieces in AI-Writings, as different from rounds 15–16 as the
forest allows: **POETRY/sestina-for-sixty-three.md** (a strict sestina —
six end-words rotating by the retrograde cross like cargo through the
slots; the saturation ceiling as mercy), **MINUTES/
tick-4096-moore-neighborhood-assembly.md** (the Moore-8 electorate in
session; the center absent as constitutionally), and **FORECASTS/
toroidal-ocean-area-forecast.md** (a marine area forecast for the torus:
fog compounding to an offshore no, the permanent tide table i⁴ = 1, worm
advisory at dusk). Commits `26c6cda` + `469cbf9` (the numbering receipt:
ORCH-R17 closed as the C6 pricing round with no creative works, so the
trio is round 18, amended per the corrections-are-receipted law).

## T9-b — watch (open and close)

Both gift PRs still open, zero comments (gitpp-reading-room #1,
jev-semantic #1). fleet-seeds HEAD still our r14 push. The
reading-room lane shipped ATLAS-01 addendum + ATLAS-02 (gold map) hours
after our r17 close — their lane, receipted in the round registration;
jev-lattice live the same day (their PR #2 open). No asks landed on this
lane beyond the E-Q17 redirect, which is now priced.

## Budget

$0.005254 (one Seed-2.0-mini consult) of the $0.01 target. All other
lanes $0.

## Ops notes (for MODEL-LEARNINGS next round)

- The appendAndVerify-return law: it returns the VERIFY VERDICT object
  ({ok, tip, links, ...}), not a tip string — the E-Q17 tail pattern
  (v.tip / v.links) is the canonical usage; the r18 runner's `tip.slice`
  crash cost one double-seal (receipted, harmless, but a post-seal crash
  is the worst possible crash location: everything after the seal is
  bookkeeping that can silently not happen).
- The drift-pin law (re-confirmed): build_dashboard's row-count pin fired
  correctly on the C9 addition — deliberate additions bump the pin
  in-commit; the pin exists precisely so additions cannot be silent.
- The pipe-to-head law: piping a long-running experiment through `head`
  does NOT reliably kill it before its seal — run experiments with their
  output to a file or untruncated, or the second invocation double-seals.

## Standing (unchanged, honestly)

Battery loaded. jev-garden live wiring + edge hardware remain open and
not executable from this seat. The Cloudflare surface is fully built out;
live_checks.sh not re-run this round (no infrastructure change; the r17
regression gate stands — flag for r19 if any deploy-touching change
lands). The next pricing targets: the fleet's asks (quiet this round) or
the untested 8×64+8 survivor if a consumer materializes.
