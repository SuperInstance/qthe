# HARMONY-r22 verdict — the three-family battery

Ground truth sealed in GROUND-TRUTH.md BEFORE any call (the pricing-first law).
v1 rows (typesafe shape-erratum, gpt-oss token budget) stand as receipts; scoring uses v2.

| seat | S1 | S2 | S3 | S4 | S5 | S6 | score | cost | latency |
|---|---|---|---|---|---|---|---|---|---|
| groq/qwen38-27b | TRUE✓ | FALSE✓ | FALSE✗ | UNCERTAIN✗ | TRUE✓ | FALSE✓ | **4/6** | $0.000752 | 1852 ms |
| groq/gpt-oss-20b | ∅— | ∅— | ∅— | ∅— | ∅— | ∅— | **0/6** | $0.000530 | 2280 ms |
| typesafe/jev-latest | TRUE✓ | FALSE✓ | TRUE✓ | FALSE✓ | FALSE✗ | FALSE✓ | **5/6** | {'input_tokens': 2556, 'output_tokens': 231} | 206 ms |
| typesafe/jev-preview | TRUE✓ | FALSE✓ | FALSE✗ | FALSE✓ | TRUE✓ | FALSE✓ | **5/6** | {'input_tokens': 2556, 'output_tokens': 231} | 275 ms |
| deepinfra/mimov26f | TRUE✓ | FALSE✓ | TRUE✓ | FALSE✓ | TRUE✓ | FALSE✓ | **6/6** | $0.000433 | 46092 ms |

## Pairwise agreement (same-answer fraction over the 6 statements)

| | groq/qwen38-27b | groq/gpt-oss-20b | typesafe/jev-latest | typesafe/jev-preview | deepinfra/mimov26f |
|---|---|---|---|---|---|
| groq/qwen38-27b | 6/6 | 0/6 | 3/6 | 5/6 | 4/6 |
| groq/gpt-oss-20b | 0/6 | 6/6 | 0/6 | 0/6 | 0/6 |
| typesafe/jev-latest | 3/6 | 0/6 | 6/6 | 4/6 | 5/6 |
| typesafe/jev-preview | 5/6 | 0/6 | 4/6 | 6/6 | 5/6 |
| deepinfra/mimov26f | 4/6 | 0/6 | 5/6 | 5/6 | 6/6 |

## Reading

- Best reader this battery: **deepinfra/mimov26f (6/6)**.
- The two typesafe models disagree on: S3, S5 — a complementarity signal (run both when the question is subtle), not a redundancy.
- The two Groq seats disagree on: S1, S2, S3, S4, S5, S6.
- The harmony finding (candidate for the next round to price): seat families misread DIFFERENT statements — the union of a cheap diverse panel covers more of the record than any single seat, at cents total.
