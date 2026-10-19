# ORCH-R28 Round Report — the scale round

**Date:** 2026-10-19 · **Orchestrator:** Z.ai (main) · **Round budget:** $0.10
ceiling; **actual spend:** ~$0.05 (137 typesafe embed calls + 22 E-Q35 calls +
32 E-Q37 + 20 E-Q38 ≈ 211 calls total at ~$0.0002/call + 9 DeepInfra
generations) · **Zero moth.**

## The plate (registered at cd65f2a, before any spend)

Four lanes: E-Q35 depth-2 conditional axes (the last unrun r24 idea), E-Q36
the at-scale corpus (the honest-caveat fix), E-Q37 the phrasing-sensitivity
curve (the E-Q34 AM1 receipt at scale), E-Q38 the drift monitor's fourth
reading (the session-boundary spacing). Plus the research lane (T19-e,
subagent R28-RESEARCH) and the watch.

## The findings

1. **E-Q35 (chain e_q35, tip d09e1ba6…)** — C33 DIES on
   premise-contamination, with the program effect ALIVE: the subordination
   verdict tracks stage-1 dominance at Spearman 0.703 WITH the measured
   values embedded in the instructions versus 0.252 WITHOUT them — the
   values are the causal variable; the map is programmable. But telling the
   model its own measurements moved 14/48 paired verdicts beyond the 0.10
   band (R6 family-edge most moved at 0.186; R1 subordination least at
   0.045; 9 verdict flips) — the conditioning channel is real AND
   contaminating, a two-edged instrument. H3 dies: the A-family signature
   is a mass pattern (P7 0.720), not a relation (best relation 0.172).

2. **E-Q36 (chain e_q36, tip 88f97d62…)** — C34 DIES on the algebra, and
   the death is the round's headline: **THE FAMILY ALGEBRA IS A
   SMALL-CORPUS ARTIFACT.** 5/10 family hits versus permutation null
   5.475 ± 1.039 (p95 7) — at chance. The miss pattern is c-dominance
   (v(a)−v(b)+v(c) retrieves the c-record's family); the hits are
   a-survivals. The E-Q26 5/5 perfection at n=20 does not survive n=60 —
   exactly the scale-reversal the r28 research pass (CTC, Sep 2026) warned
   to re-derive against recalibrated nulls. Everything else replicates:
   the knee MOVES (best-k=6 at 0.817 — {P1,P2,P3,P4,P5,P7} — vs best-4
   0.717 and full-8 0.733; the 20-record k=4 was an under-sample, not a
   law), the retrieval-coupled gate finds the 4-station theoretical
   minimum AGAIN (N1→Q10→P10→A1, 9 attempts, the P-trap broken by the
   escape rule), and the decoy floor holds at 0.016 over 240 readings.

3. **E-Q37 (chain e_q37, tip 960ae831…)** — C35 DIES on the movement rate
   with the INVERTED decomposition: **THE PHRASING LAW IS LEXICAL, NOT
   STRUCTURAL.** Synonym swaps move calibrated mass (16% of pairs beyond
   the band, max 0.32) while syntactic reordering and auditor reframing
   barely move it (2-3%); the readout is word-sensitive, not
   frame-sensitive (P1 inverted). The profile SHAPE survives everything
   (median Spearman 0.961/0.970/0.994) and the decoy canaries stay dead
   under all treatments — injection-resistance and paraphrase-immunity are
   different properties and the canaries have both. P8_exact is the most
   phrasing-susceptible axis.

4. **E-Q38 (chain e_q38, tip 2a36eae6…)** — C36 LIVES: the band holds a
   FOURTH reading, the first across a session boundary — 20/20 within
   0.10 versus all three sealed baselines, the trend flat (0.0087 vs the
   r26 reading's 0.0093), model_served jev-1.13.0 unchanged. **THE OCT-21
   FLIP WARNING STANDS** (typesafe's blog: jev-latest flips to 1.14.0
   within a week of Oct 14) — the next reading is load-bearing.

## The research lane (T19-e, R28-RESEARCH)

Prior-art verdicts: depth-2 conditional batteries **NARROWLY NOVEL**
(nearest fences OPRO + QA-Emb; no published instance of stage-2 question
text embedding the embedder's own stage-1 measured outputs); phrasing
sensitivity **OCCUPIED** at magnitudes above ours (FormatSpread up to 76
points; Mizrahi 6.5M instances; WASSA 2026's Yes/No/Neither paraphrase
study the closest analogue) — our residue is the measurement frame
(phrasing÷drift-band ratio + the byte-identity replication law); corpus
scale methodology **OCCUPIED (consume it)** — the 50-topic convention, the
recall-decline curve (81.3→40.7 over 100×), and the CTC scale-reversal
warning that E-Q36 then confirmed LIVE. The watch: jev-lattice issue #7
still unanswered; no repo activity after Oct 18. File:
research/r28_prior_art.md (381 lines, 25 sources).

## The discipline receipts

- The at-scale corpus sealed sha-frozen BEFORE any embed call (a859f12,
  sha c0d77c32…); the question map sha asserted byte-identical to E-Q25
  in every lane.
- **The E-Q16-pattern aggregate bug caught by the claim check on its FIRST
  run**: `best_overall` compared (k, accuracy) tuples lexicographically —
  k first — sealing k=8 at 0.733 over the true k=6 at 0.817; my own C34
  recompute caught the mismatch, the analysis script fixed, the chain
  re-sealed before any commit (uncommitted seals are rebuildable; the
  append-only law governs the committed stream). Second defect of the
  class in the program's history — the first (E-Q16 string-compare) was
  also caught by verdict-recomputation.
- One implementation-time amendment receipted pre-analysis (E-Q35 AM1:
  the stability superset reading).

## The sweep

fleet seeds re-emitted (41 chains) · dashboard regenerated (32,266 bytes) ·
guard PASS (21 call-site files) · run_tests all_pass · verify_all_chains
ALL CLEAN 60/60 · probe gate PASS links=54 · verdict-recompute ALL PASS
52/52, coverage 41/41.

## Registered next

- **The version-flip reading**: the moment model_served reports 1.14.0,
  re-run the drift monitor (the band vs the flip is the instrument's
  once-in-a-version measurement).
- **The 8×64+8 hierarchical survivor** (E-Q18's untested design) as a
  kernel-side lane.
- **The conditioning channel as an instrument**: E-Q35's H1 (0.703 vs
  0.252) opens calibrated self-interrogation — questions that embed
  measured state and read back verdicts — but every use must carry the
  contamination receipt (29% beyond band).
- **The lexical-sensitivity map**: E-Q37's T1 decomposition suggests a
  per-word sensitivity census (which content words carry the mass?) — a
  new instrument the phrasing curve implies.
- Standing: the drift monitor (the flip watch), the jev-lattice issue #7
  watch, the standing decoy envelope.
