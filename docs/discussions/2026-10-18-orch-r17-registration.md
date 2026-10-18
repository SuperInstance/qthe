# ORCH-R17 Registration — the C6 pricing round

Filed 2026-10-18, orchestrator (Z.ai), erised fleet line.

## Dispatch context

The operator's standing orders carry: push often, thorough docs, learn the
Cloudflare primitives, build/test/write. r16 left the old C6 pricing claim
OPEN with its substrate LIVE — this round prices it. Also completes the
Cloudflare primitive set (KV + cron triggers, the two untouched).

## Lanes

- **T8-a THE C6 EXPERIMENT (pre-registered)** — the OPEN claim:
  *"cross-substrate slot-histogram similarity predicts useful twin
  overlap."* Design: K=30 substrates (32×32, seeds 7000..7029, 40 ticks
  each, wormholes ON). Per substrate, the slot histogram h[i] = resonance
  of slot i (0 if empty), L2-normalized. Ground truth overlap between
  substrates (A,B): Jaccard of occupied-slot sets. Upsert all histograms
  to a DEDICATED Vectorize index (`qthe-c6`); query each; measure:
  - M1 precision@5 (fraction of a query's top-5 that are in the query's
    true top-5 by ground truth)
  - M2 Spearman rank correlation (Vectorize similarity ranking vs ground
    truth overlap), over all pairs
  - M3 the trivial-identity control: a substrate's top-1 must be itself
    (sanity; similarity 1.0)
  Predictions:
  - P-A (the claim lives): M1 ≥ 0.5 AND M2 ≥ 0.5 — histogram similarity
    is a usable retrieval signal for twin overlap.
  - P-B (the claim dies): M1 < 0.3 or M2 < 0.2 — histogram shape carries
    little overlap information (likely cause: 40-tick tables saturate to
    all-64-slots-occupied, making Jaccard near-degenerate at these
    parameters).
  - Either verdict is a priced result; a death is receipted with the
    mechanism (the falsifier law).
- **T8-b KV HUD + CRON (the two untouched primitives)** — KV namespace
  `qthe-hud`: the cron-scheduled worker (every 5 minutes) advances a
  designated public field (`cron-field`) one tick and writes the HUD line
  (ticks + state hash) to KV; GET /hud serves it. This is the r15 design's
  KV HUD with its second consumer finally existing (the cron), plus the
  tminus-dispatcher convergence (their 500 ms beats ≙ our 5 min ticks).
  Predictions: P-C the cron fires within ~2 min of deploy (check
  /hud timestamps); P-D after a manual re-init of cron-field, the next
  cron tick advances it exactly once (ticks increment by exactly 1).
- **T8-c WATCH** — PRs + seedbox at close.
- **T8-d CLOSE-OUT** — docs (C6 verdict into CLAIM-VERDICTS; KV/cron into
  the deployment doc), README r17, round report, worklog, verification
  battery, push.

## Budget

$0 target (no LLM seats needed; all lanes are code + free-tier API).
Creative lane: none this round (r16's trio shipped; the operator's ask was
"a few more" — done, and the main work calls).

## Standing

Battery loaded. jev-garden wiring + edge hardware unchanged. The r16
service is live; live_checks.sh must still PASS at r17 close (regression
gate).

---

## AMENDMENT 1 (filed BEFORE the re-run, after the first run was rejected)

The first run is INVALID on two independent grounds, both receipted:

1. **Instrument failure**: the freshly created qthe-c6 index did not serve
   the first upserts within the 20 s settle — all 30 rankings came back
   EMPTY (M3 sanity 0/30; artifact rank_sample.matches = []). Minutes
   later a probe query returns matches (same-seed cosine 0.999999). Fix:
   settle 45 s + the M3 sanity gate is now BLOCKING — no verdict unless
   self-top-1 is 30/30.
2. **Ground-truth degeneracy (a real kernel finding, kept)**: binary
   occupied-slot Jaccard is degenerate on randomly seeded substrates —
   measured: the 64-slot table saturates after ONE tick (seeds
   7000/7001/7002, 32×32, ~256 Abstain writers cover all 64 slots;
   occupancy stays 64/64 through tick 6 and 40). All pairwise Jaccards
   are 1.0; the metric cannot discriminate at ANY tick count.

**Amended ground truth (frozen before the re-run):** behavioral
cross-resonance overlap — for pair (A,B), take A's Abstain cells at the
final state, look each cell's d-value up in B's table, and average the
resonances hit: cross(A,B) = Σ_hits resonance_B[d] / n_abstain_A.
Behavioral overlap(A,B) = (cross(A,B) + cross(B,A)) / 2. This is the
claim's actual meaning — "would A's abstainers resonate against B's
table" — and is independent of the histogram cosine the service ranks by
(no circularity). Histograms (L2-normalized slot resonance) and the
Vectorize query are unchanged. Verdict thresholds unchanged (P-A
M1 ≥ 0.5 AND M2 ≥ 0.5; P-B M1 < 0.3 OR M2 < 0.2; else AMBIGUOUS).
