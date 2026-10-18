# ORCH-R17 Round Report — the C6 pricing round

Filed 2026-10-18, orchestrator (Z.ai), erised fleet line.
Registration + AMENDMENT 1: `2026-10-18-orch-r17-registration.md`.

## T8-a — the C6 experiment: the claim DIES below chance

Run against the live Worker's `/c6/experiment` lane and a dedicated
`qthe-c6` Vectorize index, 30 substrates (seeds 7000–7029, 32×32, 40
ticks), L2-normalized resonance histograms.

- **Run 1 INVALID, both grounds receipted in AMENDMENT 1 (filed before
  the re-run)**: (a) instrument — the brand-new index did not serve its
  first upserts within the 20 s settle (all rankings empty; a probe
  minutes later returned same-seed cosine 0.999999); (b) ground truth —
  binary occupied-slot Jaccard is degenerate: **the 64-slot table
  saturates after ONE tick** (seeds 7000–7002 measured: ~256 Abstain
  writers cover all 64 slots; 64/64 through tick 40; all pairwise
  Jaccards 1.0). The degeneracy is itself a kept kernel finding.
- **Run 2 VALID** (settle 45 s; M3 blocking sanity 30/30; amended ground
  truth = behavioral cross-resonance overlap — A's abstainers against
  B's table, both directions averaged; spread 22.5–122.9):
  **M1 precision@5 = 0.053** (chance ≈ 5/29 ≈ 0.17 — below chance),
  **M2 mean Spearman = −0.16** (slightly anti-correlated).
- **VERDICT: P-B — the claim DIES.** Mechanism: L2-normalization
  discards the resonance mass that drives behavioral overlap and keeps
  the slot-distribution shape that behavior ignores. Cost: $0. The
  sidecar infrastructure (exact slot lookup) remains live and useful;
  what died is the histogram-similarity pricing claim. Receipt:
  `cloudflare/outputs/e_c6_histogram_overlap.json`.

## T8-b — KV HUD + cron beat: EARNED

- KV namespace `QTHE_HUD` created and bound; `[triggers]` cron
  `*/5 * * * *` attached; the `scheduled` handler advances `cron-field`
  exactly one tick per beat and writes the HUD line to KV.
- **P-C PASS**: the beat fires at the boundary (05:20:17.286Z for the
  05:20 boundary — seconds after).
- **P-D PASS (after ERRATUM 3)**: the beat's `stub.fetch` calls
  defaulted to GET while init/tick require POST — the first beat wrote a
  hollow HUD (no ticks/hash), found immediately by the P-D check
  (ticks: None), fixed (`{ method: "POST" }`), redeployed, re-verified:
  manual re-init to ticks 0 → next beat → **exactly ticks 1**, HUD
  sha256 `e6fdcd1b…` ≡ the DO's `/hash` route.
- The Cloudflare primitive set is now complete and measured: Workers,
  Durable Objects (SQLite class), Vectorize (sidecar + experiment
  index), R2, Pages, KV, Cron Triggers — all free tier.

## T8-c — watch

Both gift PRs still open with zero comments; fleet-seeds HEAD still our
r14 push. Quiet fleet watch, no action.

## T8-d — close-out (this document)

CLAIM-VERDICTS addendum (C6 priced/dead with mechanism; KV+cron EARNED;
ERRATUM 3); CLOUDFLARE-DEPLOYMENT Addendum 2; README r17 section; this
report; regression gate re-run (ALL LIVE CHECKS PASS — the C6 check
converged on attempt 4, the retry law doing its work under
cron-beat-induced sidecar churn); verification battery; push.

## Ops notes (for MODEL-LEARNINGS next round)

- The new-index propagation law: a freshly created Vectorize index may
  need >20 s (observed) before its first upserts are queryable; settle
  45 s + a BLOCKING sanity gate, or the run measures the instrument.
- The display-corruption law (banked during the toml scare): tool-output
  rendering can visually eat `[[m` sequences — verify suspected file
  corruption at BYTE level (grep match + byte list + sha) before
  "fixing" a phantom. The wrangler.toml was never corrupted.
- The GET-default law: `stub.fetch(url)` is a GET; every DO mutation
  call from a scheduled handler must pass `{ method: "POST" }`
  explicitly. Found live, cost one hollow beat.

## Standing gaps (unchanged)

Battery loaded. jev-garden live wiring + edge hardware remain open. The
Cloudflare surface is now fully built out — the next pricing targets
come from the fleet's asks, not from the infrastructure.
