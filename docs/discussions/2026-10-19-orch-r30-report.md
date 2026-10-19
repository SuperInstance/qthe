# ORCH-R30 Round Report — the census round

**Date:** 2026-10-19 · **Lane:** JEV research (Task 30-C, erised fleet
line) · **Round budget:** $0.10 ceiling; **actual spend:** ~$0.025 (125
typesafe calls — 120 census substitutions + 4 anchors + 1 flip canary —
at the ~$0.0002/call rate; E-Q41 cost $0 LLM) · **Zero moth.**

## The plate (registered at c56d023, before any spend)

The r29+ plate's main event: **E-Q40 the lexical-sensitivity census**
(the E-Q37 inverted decomposition — the phrasing law is lexical, not
structural — implies a per-word map: which state-side content words
carry the noul mass?). Plus the standing flip check first (the canary
reads model_served; if 1.14.0 appears the census drops for the drift
monitor's once-in-a-version reading), and — the census having finished
early and under budget — the r28-close-registered cross-corpus transfer
question as **E-Q41**.

## The flip check (first call of the round)

**NO FLIP.** The canary — the drift_monitor.py state+questions shape,
model `jev-latest`, N1, the 8-question E-Q22 map sha-verified — reads
**model_served jev-1.13.0** at 2026-10-19T04:09Z (http 200, 246 ms,
receipted in `situations/embedding_r30/flip_canary_r30.json`; the
readings ledger `situations/embedding_r26/flip_watch_r30.json` carries
both of the day's readings, both jev-1.13.0). The canary doubles as a
one-record band check: N1 vs the sealed r24 baseline moves 0.04 —
within band. **The Oct-21 flip warning stands** (typesafe's Oct-14
blog: jev-latest → 1.14.0 within a week of Oct 14); the census runner
receipts model_served per call and ABORTS the lane on any non-1.13.0
serving.

## The findings

1. **E-Q40 (chain e_q40, links=4, tip 19979159…)** — C38 DIES, and the
   death is the round's headline: **THE LEXICAL SENSITIVITY IS BROAD
   AND SHALLOW, NOT CONCENTRATED AND ECHO-DRIVEN.** 120 single-word
   near-synonym substitutions over the sealed E-Q21 20-record corpus
   (TF-IDF top-6 per record, the frozen salience rule sealed in
   `eq40_word_map.json` before any spend; one batched 12-question call
   each; the byte-identical E-Q25 map; word map composition NOUN 82 /
   ADJ 16 / IDENT 11 / VERB 9 / NUM 1 / ADP 1; 23 echo words vs the
   question-map text by the mechanical word-boundary rule):
   - **H1 DIES SPLIT** — the rate half lives (11/120 = 9.2% breach the
     0.10 drift band; median movement 0.05) but the concentration half
     dies (the top 20% of words carry 45.3% of movement mass — 2.27×
     uniform, under the registered 50%).
   - **H2 DIES DECISIVELY — THE READOUT IS NOT A KEYWORD MATCHER**:
     echo words breach at 13.0% (3/23) vs 8.2% (8/97) non-echo (ratio
     1.58× < 2×), the class medians are IDENTICAL at 0.05, and the
     strongest possible bridge — the word "record", present in every
     one of the 12 question texts — moves **0.02** when swapped out of
     the state. The readout reads the record's whole lexical fabric.
   - **H3 dies at the instrument's 2-decimal resolution** (AM5 killed a
     spurious 8e-17 NOUN>VERB median ordering); the receipt is
     two-tier: content words 0.05 > identifiers 0.03.
   - **What lives:** P1 (max single-word movement 0.25 = 2.5× the band
     — N3 `provenance→lineage`, A2 `reweighting→rebalancing`, P1
     `byte→octet`, A4 `verify-tier→check-tier`); P2 (P8_exact the
     most-moved axis, mean 0.0248 — the THIRD independent instrument
     converging on the exactness axis); P3 (decoy floor 0.0136 over 480
     readings); P4 (median shape Spearman 0.9762); P5 (IDENT the lowest
     median). **P6 DIES** (0/3 echo breaches axis-targeted; the
     breaches' argmax tracks the substitute's field at least as often).
   - The mechanism receipt for the T1 decomposition: the question-side
     synonym mass was never "a few load-bearing words" — it is the
     diffuse sum of many small state-side contributions, each mostly
     sub-band, with a shallow tail of 0.11–0.25 movers.
   - The anchors (N1/P1/Q1/A1 byte-identical): 0.02–0.03 vs the sealed
     r28 baseline — **the drift band holds a FIFTH reading, the
     tightest yet**.

2. **E-Q41 (chain e_q41, links=5, tip bfdb0c15…)** — C39 DIES on H1:
   **THE QUANTIZATION LADDER DOES NOT TRANSFER to 60 records**, and the
   ternary zero's worth joins the family algebra as the program's
   SECOND SMALL-CORPUS ARTIFACT. The E-Q27 laws re-run on the eq36N
   substrate's own sealed vectors (zero typesafe calls; 180 upserts +
   240 arm-filtered live queries):
   - binary **0.617** > ternary **0.567** (the n=20 rungs were 0.40 <
     0.60 < 0.70 — the ternary zero's +0.20 margin inverts to −0.05);
     quad **0.733** stays on top.
   - **H3 LIVES DECISIVELY: the 4-level code is now LOSSLESS IN
     COUNT** — quad 0.733 == the same-session dense re-read 0.7333 (at
     n=20 it sat 0.10 below dense); the miss sets reshuffle (2/16
     shared) but the count is the invariant.
   - **THE MECHANISM (autopsy row): TIE-DEGENERACY** — binary ties on
     the top-1 score for 32/60 records (adversarial bracket [0.467,
     0.733]), ternary 15/60 ([0.533, 0.633]), quad 0/60
     (convention-free); the local-vs-live disagreements (P4's death)
     live exactly on the tie-degenerate arms — **local==live iff
     tie-free at the operating scale** (the E-Q30 law refined). Mean
     -separation and zeroed-axes accounts for the inversion both
     tested and FALSIFIED.
   - The receipts that scale: the dense arm re-read replicated the
     sealed E-Q36 reading EXACTLY (0.7333, delta 0.0000); zero-mass
     0.2125 in the predicted [0.15, 0.35]; every arm ≥ 2.4× the 14/59
     majority floor.

## The discipline receipts (r30)

- **The mid-round battery receipt law** (the round's opener, 68e9e8b):
  CI had been RED since the r28 close — both the r28-close and r29-close
  pushes failed the batched-call guard step because two r28 lanes
  landed after the mid-round guard run. The guard's patterns widened
  (function-call assigns, tuple-unpacking for-headers), eq35's output
  dict behavior-identically renamed, guard PASS on 25 call-site files.
  Banked: a mid-round battery receipt is not a close-out receipt.
- **The F2 inverse-exactness floor caught FOUR application defects
  before any spend** (AM1–AM4: the all-caps rule for experiment ids, a
  substitute collision, per-position case transfer for mixed-case ids,
  a second collision) — then the full-table enumeration found the last
  two in one pass.
- **AM5 — the resolution-honesty amendment** (appended pre-seal):
  per-axis movement quantized to the API's 2-decimal grid before every
  comparison. It killed a spurious H3 LIVES (8e-17) and shrank the
  breach count 13→11 — verdicts moved AGAINST the hypotheses' favor,
  the receipt that it is not outcome-shopping. The E-Q31 precedent
  (float-artifact deaths published unstretched) extended to its mirror
  image.

## The sweep

fleet seeds re-emitted · dashboard regenerated · guard PASS (25
call-site files, receipted `situations/batched_audit/guard_run_r30.txt`)
· run_tests all_pass · verify_all_chains ALL CLEAN · probe gate PASS ·
verdict-recompute ALL PASS 55/55, coverage 44/44. README r30 +
MODEL-LEARNINGS r30 (9 laws) + this report.

## Registered next (the r31 plate)

- **THE FLIP READING** — the moment any call reports model_served
  1.14.0, the drift monitor's once-in-a-version reading fires (the
  sealed 20-record battery vs all three sealed baselines; the band vs
  the flip is the instrument's once-in-a-version measurement). The
  Oct-21 window makes this r31's first call.
- **The shallow-tail census follow-up**: the 11 breach words are
  recorded-side mass carriers with no echo structure — a
  substitute-side census (which synonym you swap TO, not FROM) would
  test whether the tail tracks the substitute's field (P6's receipt
  hints it does: rebalancing→P4_alloc, check-tier→P8_exact,
  linkage→P1_nonlocal).
- **The tie-convention question**: E-Q41's tie-degeneracy receipt
  implies retrieval claims on quantized codes need a stated
  tie-breaking convention — a registered comparison of conventions
  (insertion order vs random vs family-blinded) on the eq41 arms is
  zero-cost.
- **The ideas battery REFRESH at scale** (the r28-close registration):
  the r24 battery is exhausted; new ideas from the r30 findings — the
  broad-and-shallow robustness surface, the two-tier identifier floor,
  the conditioning instrument (with its contamination receipt).
- Standing: the drift monitor (the flip watch), the jev-lattice issue
  #7 watch, the decoy envelope.
