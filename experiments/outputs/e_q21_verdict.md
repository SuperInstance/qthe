# E-Q21 verdict — the question map is an embedding function

E-Q21 VERDICT (the question map is an embedding function — C14/C15): H1 LIVES — C14 LIVES: the jev 8-probe embedding retrieves same-family records at 0.7 top-1 accuracy via LIVE Vectorize cosine, vs the majority baseline 0.25 and the permutation null 0.2122 (the instrument panel IS a metric space). H2 DIES — BOW-cosine on the same texts scores 0.8 vs jev's 0.7 (P2 HIT, predicted): the honest narrowing — the 8 interpretable axes buy ~88% of full-vocab BOW accuracy at ~1/300th the dimensionality, and the SAME axes through qwen3.8-27b score 0.85, ABOVE BOW: the axes are sufficient;

jev's per-axis calibration is what cost the two records. The value claim: interpretable, dimensionality-economical, portable. H3 (C15) LIVES: both Groq seats' embeddings land within one family-error of jev's (0.85 and 0.7 vs jev 0.7), and the per-axis divergence is STRUCTURED — P8_exact diverges most (means 0.2394/0.2791), P5_repair least (0.0574/0.0581), top-3 axis overlap 2/3 across seats (the harmony finding extended from answers to embedding spaces;

embedder choice is a calibration choice, not a paradigm choice). F5 stability: 24/24 re-embedded axes within 0.25 (P5 HIT — scores are calmer than choices). Separation (jev space): same-family cosine 0.7585 vs cross 0.5432;

family cohesion N 0.77 > P 0.763 > A 0.758 > Q 0.743 (P6 HIT — the non-local family is tightest;

Q is loosest because Q4 the ablation record is the crossover object: quantum content ABOUT the wormhole channel, misfiled by every embedder).

## The retrieval table (top-1 non-self family accuracy, LIVE Vectorize cosine)

| embedder | accuracy | misses |
|---|---|---|
| jev | **0.7** | N4->P4, P2->A4, P3->Q4, P4->N4, Q4->P3, A4->P2 |
| qwen38-27b | **0.85** | N3->P3, P4->A3, Q4->P3 |
| gpt-oss-20b | **0.7** | P1->Q4, P2->A2, P3->Q4, Q1->N2, Q4->P3, A2->N5 |

## The baselines

- bag-of-words cosine (same texts, full vocab): **0.8**
- permutation null (1000 draws): 0.2122; majority-class: 0.25

## The per-axis divergence (jev vs each Groq seat, mean |delta| over 20 records)

| axis | qwen3.8-27b | gpt-oss-20b |
|---|---|---|
| P1_nonlocal | 0.1538 | 0.1453 |
| P2_localrule | 0.1395 | 0.1955 |
| P3_quantum | 0.0754 | 0.0996 |
| P4_alloc | 0.08 | 0.0665 |
| P5_repair | 0.0574 | 0.0581 |
| P6_null | 0.1046 | 0.1714 |
| P7_econ | 0.0699 | 0.1599 |
| P8_exact | 0.2394 | 0.2791 |

## The consumer law (r23)

A fixed 8-probe score battery is a viable embedding function for retrieval
over a sealed corpus — interpretable axes, ~250 bytes per record, one batched
call per record, live vector search. When the corpus is family-lexical (the
words carry the families), plain BOW matches or beats a single LLM embedder —
use the probe embedding when you need the AXES (drift detection, cross-seat
calibration, interpretable nearest-neighbors), not merely the ranking. The
best single configuration this round: the 8 axes through qwen3.8-27b (0.85).
