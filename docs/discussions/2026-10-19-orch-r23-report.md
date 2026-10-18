# ORCH-R23 Round Report — the embedding round

Filed 2026-10-19, orchestrator (Z.ai), erised fleet line. Registration:
`2026-10-19-orch-r23-registration.md` (committed 2fd3bb1 BEFORE any
spend; budget $0.08 LLM + 0 moth + free-tier CF).

## The dispatch

The operator: experiment with the tools "in synergy and harmony with
typesafe.ai; you have vectorization and embedding and rapid calls etc,
try things you haven't tried and you don't think anyone really has";
challenge the agents every round to think in novel ways about
typesafe.ai; take creative breaks and teach the subagents to do the
same; document well.

## T14-a — E-Q21 SEALED: the question map is an embedding (C14/C15)

The novel composition: a FIXED battery of 8 score probes (the
interpretable axes: non-local coupling, local-rule physics, quantum
provenance, allocation, repair, null-outcome, economics, exactness)
over 20 sealed records (4 families × 5, corpus frozen before any
call), one batched systemone call per record, vectors into a THIRD
Cloudflare Vectorize index (`qthe-jev-embed`, 32-dim cosine — AM1
zero-pad from 8, ranking equivalence proven), retrieval via LIVE REST
queries (60 vectors upserted; every query round-tripped).

- **C14 LIVES**: jev 0.70 top-1 family accuracy vs majority 0.25,
  permutation null 0.2122. **H2 DIES with the honest narrowing** (P2
  HIT, predicted): BOW 0.80 > jev 0.70 — but the SAME axes through
  qwen3.8-27b score **0.85, above BOW**. The axes are sufficient;
  jev's calibration cost two records. Value claim: interpretable,
  ~1/300 BOW's dimensionality, portable.
- **C15 LIVES**: both Groq seats within one family-error (0.85 / 0.70
  vs jev 0.70); divergence STRUCTURED (P8-exact max 0.24/0.28,
  P5-repair min 0.057; top-3 overlap 2/3). The harmony finding,
  extended from answers to embedding spaces.
- F5 stability 24/24 within 0.25. Family cohesion: N tightest (0.770,
  P6 HIT); Q loosest (0.743) — Q4, the E-Q20c ablation record, is the
  crossover object every embedder misfiles (quantum content ABOUT the
  wormhole channel).
- Predictions: P1/P2/P3/P5/P6 HIT; P4 partial (structured: yes; the
  top axes P8/P2, not the predicted P3/P6 — receipted).
- Chain `e_q21` (4 links, tip `f13a483b…`); curated claim added;
  misses table: N4↔P4 (both exactness records), Q4↔P3 (the crossover).

## T14-b — E-Q20c SEALED: the wormhole channel is a correlation DISSIPATOR

The plateau-mechanism ablation at zero credits (the same arms/ladder,
`tick(sub, {wormholes:false})`; F0'' ON-gate byte-exact 30/30 + 60/60 +
120/120; F-m1 twinRate ≡ 0 under OFF; F-m2 determinism 30/30).

- **Both registered hypotheses DIED in an unregistered third
  direction**: with wormholes OFF the plateau ratio ROSE 1.1843 →
  1.5771 (drop −33.17%) and the t=8 dip was 8.6× shallower (0.0030 →
  0.0259). The twin channel doesn't store the correlation memory — it
  ERODES it. The slow mode is the LOCAL Moore-8 rule's own memory.
- **The consumer law, split by intent**: preserve constructor-dependent
  geometry → wormholes OFF (deeper memory, higher plateau); equilibrate
  → ON (faster wash-out) — and T > 512 either way.
- A3S's excursion is local-rule-built and GROWS OFF (0.0817 vs 0.0687).
- Predictions: P3 HIT (excursion survives); P1/P2/P4 MISS (P2 a unit
  error, receipted); P5's honest-null branch did not fire — the third
  direction did (amendment 1, append-only). Chain `e_q20c` (4 links,
  tip `6c339a17…`).

## T14-c — the ideas battery (the standing challenge, made concrete)

The honest pivot receipted: the typed map cannot return free text →
generation on chat seats, RATING through the typed map. Candidates
(r24-registered):

1. **Occlusion gradients** (novelty 2.78/2.53 — the highest): fixed
   noul probes as a continuous readout function of the STATE text;
   occlude parts of the state, measure the gradient — saliency for
   the question map. Feasibility doubted (1.72/1.90) — the raters
   want a cheaper design.
2. **Coherence deficit** (feasibility 2.89/2.86 — the highest): one
   batched call as a single joint distribution; the same question
   reworded several ways in one map; the internal-disagreement score
   as a calibrated uncertainty signal.

Both typesafe models agree on the profile (the first
typesafe-rates-Groq/MiMo-ideas round; ~$0.003).

## T14-d — the small deploys

- **The C7 mirror extended**: e_q20b, e_q20c, e_q21 all sha-identical
  through the live worker; live checks now cover 4 chains; ALL LIVE
  CHECKS PASS.
- **THE R2 LOCAL-SIMULATOR LAW** (banked, receipted): `wrangler r2
  object put` with a Worker config in cwd defaults to the LOCAL
  simulator — the first uploads landed in .wrangler/state while the
  deployed worker saw nothing (split-brain: marker invisible to the
  worker; the worker's e_q1 invisible to my wrangler get). `--remote`
  is mandatory. Also banked: wrangler `vectorize query --vector` parse
  bug → REST queries.
- The relay re-probed: still HKG-blocked (Smart Placement has not
  relocated; the Actions seat remains the house route — receipted).

## T14-e — creative + doctrine

- **The r23 piece**: `GLOSSARY/a-glossary-of-honest-nulls.md` — the
  collection's FIFTH form (poem, story, field guide, play, glossary).
  Bench AS-SAID 2 seats $0.000947: the drink line cut, the certified
  entry tightened; **the noise-floor cut DECLINED ON FACTS — both
  seats quoted an entry that does not exist in the piece** (a
  fabricated citation, caught by verify-before-act, receipted in the
  commit and MODEL-LEARNINGS).
- **`docs/CREATIVE-PRACTICE.md`** — the between-rounds discipline
  taught forward per the dispatch: ground in the sealed record, bench
  two seats AS-SAID, accept/decline with reasons, rotate forms, ship
  with receipts. The standing forms table is append-only.

## The sweep + batteries

verdict-recompute ALL PASS 35/35, coverage 24/24; probe gate links=35
(tip `38322930…`); fleet seeds re-emitted (24 chains); dashboard
regenerated; verify_all_chains ALL CLEAN 43/43 (17 tips); guard PASS
(after the doc-string false positive — the guard caught an
API-documentation literal in the ideas battery; reworded); negctl
28/28 DETECTED at clean HEAD 2732b12; ALL LIVE CHECKS PASS; CI: the
three reds during the round were the coverage law firing on the
uncovered new chains (fixed by the sweep, the designed behavior); the
embed run green (39145167164, 40/40 clean).

## Spend (of the $0.08 LLM cap)

typesafe: 23 embed calls + 2 rating calls ≈ $0.006-equivalent;
Groq: 40 embed calls ≈ $0.020 (via Actions); MiMo: 4 generation calls
(2 receipted-empty at the wrong budget + 2 good) + 1 harmony-class
control none this round ≈ $0.002; bench $0.000947. Total ≈ **$0.03** —
under half the cap. Moth: 0 credits. CF: free tier (one new Vectorize
index; three R2 objects; no Worker redeploy).

## Next registered (r24 candidates)

1. **Occlusion gradients** (the ideas battery's top-novelty pick) —
   design attack, pre-registration, then run: noul probes as state
   saliency.
2. **Coherence deficit** — the same question reworded in one batched
   map; internal disagreement as calibrated uncertainty.
3. The panel-diversity claim (r22's harmony finding, now with an
   embedding-space instrument available).
4. The relay relocation check (standing); e_q21 drift monitoring (the
   axes are now a calibration instrument — re-embed the corpus each
   round and watch the per-axis drift).
5. Standing watch: PRs, seedbox, CI.
