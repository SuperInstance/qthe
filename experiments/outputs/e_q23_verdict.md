# E-Q23 verdict — occlusion gradients: the question map as readout function

E-Q23 VERDICT (occlusion gradients — the question map as readout function): H1 DIES — THE DISTRIBUTED-READING LAW: mean normalized span entropy 0.9079 (per-record 0.7915-0.9898), ABOVE the 0.85 concentration bar: the question map reads a record DISTRIBUTED, not concentrated — no single sentence carries the family signal (mean absolute saliency per occluded span-axis 0.0703, max 0.7 on the /4-normalized scale). The embedder is redundancy-robust: occluding ANY one span moves the axes only slightly and roughly evenly. For gate-style consumers (jev-lattice): the typed-map readout does NOT localize evidence — file-level attribution needs their hash-targeted channels, not occlusion. H2 LIVES: axis-specificity 0.7009 — 70.0893% of axis pairs peak on different spans;

the 8 axes DO read different places even while each reads broadly. H3 LIVES — THE PROFILE LAW: within-family saliency-profile correlation 0.1667 vs cross-family -0.3328 (difference 0.4996, predicted >= 0.10, exceeded 5x): the saliency SHAPE is family-structured even where the saliency MASS is flat — same-family records agree on where the axes read, cross-family records anti-correlate. C18 DIES with the honest narrowing: the question map yields MEANINGFUL saliency (H2's specificity + H3's family structure prove the readout resolves span-axis structure) but NOT concentrated saliency — the concentration clause dies. C19 LIVES with the honest narrowing: H3 lives decisively but H5 is an honest NULL — the stability bridge is unmeasurable at this scale (spearman 0.0476, but the re-embed wobble itself is <= 0.045 across all 8 records — the question map's sampling noise sits BELOW the saliency-entropy effect scale;

the lattice fragility bridge needs a near-bar population to test, and our records are all far from any bar). H4 DIES — INVERTED at n=1: the one misfiled record in the subset (P3) has entropy 0.7915 vs the filed mean 0.9245 — the misfiled record is MORE concentrated, not flatter (a single-source reading may be fragile in a different way;

n=1 directional receipt, not a law). H6 (structure) LIVES: the jev-preview drift is axis-structured — max/min axis mean ratio 4.3, top axis P2_localrule (0.0403) vs P4_alloc least (0.0094);

the top-axis call DIED (P6 MISS — P2_localrule, not the C15-predicted P8_exact/P3_quantum): the 1.13.0->1.14.0 upgrade wobbles the LOCAL-RULE axis most while the cross-embedder divergence wobbled P8_exact most — version drift and embedder divergence are DIFFERENT axes' problems. Mean vector L1 drift 0.2119 over 8 axes — small in absolute terms (the drift-monitor consumer law: the noul arm's 0.03 re-embed band is the right alarm threshold;

a version upgrade moves P2 by ~0.04 mean, within an order of magnitude of sampling noise, so UPGRADE drift is visible only in AGGREGATE, not per-record).

## The saliency census

- mean absolute saliency per (span, axis): **0.0703** (max 0.7, /4-normalized scale)
- M1 mean normalized span entropy: **0.9079** — the reading is DISTRIBUTED
- M2 axis-specificity: **0.7009** of axis pairs peak on different spans
- M3 within-family profile correlation **0.1667** vs cross **-0.3328**
- M5 re-embed wobble (all 8 records): max **0.045** — the stability bridge's noise floor

## The drift lane (jev-preview 1.14.0 vs jev-latest 1.13.0, 8 records)

| axis | mean |delta| | max |
|---|---|---|
| P1_nonlocal | 0.0225 | 0.08 |
| P2_localrule | 0.0403 | 0.0825 |
| P3_quantum | 0.0213 | 0.0775 |
| P4_alloc | 0.0094 | 0.025 |
| P5_repair | 0.0241 | 0.12 |
| P6_null | 0.0291 | 0.07 |
| P7_econ | 0.0259 | 0.0625 |
| P8_exact | 0.0394 | 0.0575 |

## The consumer laws (r24)

The typed question map is a REDUNDANCY-ROBUST reader: it does not depend on any
single span, so span-level corruption moves it little — good for stability,
bad for evidence attribution (use hash-targeted channels for that, the
jev-lattice way). The saliency PROFILE (which spans matter for which axes,
relatively) is family-structured and axis-specific — it is a fingerprint of
HOW a family is read, not WHERE its signal lives. Version drift (1.13.0 to
1.14.0) is axis-structured but small (mean L1 0.2119);
it is an aggregate-level signal, not a per-record alarm.
