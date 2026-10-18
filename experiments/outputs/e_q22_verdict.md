# E-Q22 verdict — the axis-calibration x ternary-quantization factorial

E-Q22 VERDICT (the axis-calibration x ternary-quantization factorial — C16/C17, AM1 strict scoring): H1 LIVES — C17 LIVES: the NOUL-calibrated arm retrieves at 0.8 top-1 versus the ordinal score arm's 0.7 (both arms re-upserted and re-queried LIVE this lane — the S arm's 0.70 replicates E-Q21 through a fresh changeset, itself a stability receipt;

the same 8 axis CONCEPTS, only the question TYPE changed). The jev-lattice calibration confound is real and fixable: typing the axes as calibrated mass gains a record, widens the separation margin (same-minus-cross 0.2565 vs 0.2153), and stabilizes the vectors ~10x (F5: 24/24 axes within 0.10, max delta 0.03). H2 DIES: the ternary survival clause fails on the noul side — TS 0.6 retains 0.8571 of S (within the 0.85 clause), but TN 0.55 retains only 0.6875 of N (0.25 absolute drop vs the 0.15 registered tolerance;

lenient cross-check 0.6471 vs required 0.65 — fails by 0.003 there, by 0.10 strict: the verdict is identical under both scorings). H3 LIVES: both ternary arms clear the baselines decisively (TS 0.6 and TN 0.55 vs majority 0.25 and permutation null 0.2122) — the 16-bit ternary code carries the family signal at 2.4-2.2x the majority baseline. H4 DIES: ternarization INVERTS the calibration effect ((TN - TS) = -0.05 vs (N - S) = 0.1): calibration and quantization are SUBSTITUTES, not complements — the ordinal arm's mid-range spread survives median-centering better than the noul arm's saturated near-0/1 mass (noul saturation concentrates records at the code corners where intra-family resolution is lost). C16 (ternary at 16x compression) DIES with the honest narrowing: the code retains signal far above baselines with ZERO collisions (20 distinct codes, 1.5383/1.5198 bits/axis entropy — P4 HIT), but the strict retention clause fails on the noul side;

C17 (calibrated mass beats ordinal levels) LIVES at 0.8 vs 0.7. The consumer law: for RETRIEVAL use the noul arm continuous (0.80, the new best single-jev configuration);

for COMPRESSION use the score arm ternary (0.60 at 16 bits, 86% retention);

never buy both — the noul-ternary combination is the worst of the four arms' retention ratios.

## The arm table (top-1 non-self family accuracy, LIVE Vectorize cosine, AM1 dual scoring)

| arm | strict | lenient | strict misses (misfiled + no-neighbor) |
|---|---|---|---|
| S | **0.7** | 0.7 | N4->P4, P2->A4, P3->Q4, P4->N4, Q4->P3, A4->P2 |
| N | **0.8** | 0.8 | N5->P4, P2->N2, P4->N5, Q4->N1 |
| TS | **0.6** | 0.6667 | N1->Q2, N3->A1, N4->P1, P1->N4, P2:no-neighbor, P3->Q4, P4:no-neighbor, Q4->P3 |
| TN | **0.55** | 0.6471 | N1->Q2, N3->P2, N4:no-neighbor, P2->Q3, P3->Q4, P4:no-neighbor, Q1:no-neighbor, Q3->P2, Q4->P3 |

## The ternary code census

- TS: 20 distinct codes / 20 records, 1.5383 bits/axis, 0 collisions
- TN: 20 distinct codes / 20 records, 1.5198 bits/axis, 0 collisions
- storage: 8 ternary axes = 16 bits vs 8 float32 = 256 bits = 16x representational compression (Vectorize stores float32 internally — the claim is about the embedder's output representation)

## The consumer law (r24)

Buy calibration OR compression, not both. The noul arm continuous is the new
best single-jev retrieval configuration (0.80 — jev's axes now BEAT the sealed
BOW baseline 0.80 at parity, at ~1/300 the dimensionality, with ~10x tighter
re-embed stability). The score arm ternary is the compression configuration
(0.60 at 16 bits, 86% retention, zero code collisions). The noul-ternary
combination inverts the calibration advantage (H4): saturated mass concentrates
records at code corners and loses intra-family resolution. For gate-style
consumers (jev-lattice's use): the noul arm's tightness is the drift-monitor
substrate — a 0.03 max re-embed delta makes ANY larger movement a signal, not
noise.
