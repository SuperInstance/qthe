# falsification-bench · journal (append-only)

## G2-2 · fuzzer + multi-writer corpus + edge suite designs · 2026-11-02 · GRADED A

- Brief: design (no build) the op-log differential fuzzer, the
  multi-writer corpus, and the pinned-edge suite; define the P1 exit gate.
- Artifacts: work/G2-2/{FUZZER-SPEC.md, MULTIWRITER-CORPUS.md,
  EDGE-TESTS.md} + probe receipts (PROBES-G2-2.mjs/.out).
- Orchestrator verification: designs read; probe receipts re-checked (seed
  aliasing, σ-leak reproduced). The term-blindness finding verified by the
  seat's own runs: corpus v1's desert σ cases are byte- and
  count-identical — a σ-ignoring build passes 24/24. Corpus-v2 term-token
  demand + Ruling S (integer-only ops; σ as parse-only canonical token,
  DEFAULT_SIGMA bits 0x3ff95c01a39fbd68) adopted. P1 gate G1–G10 adopted
  as the RC-05 pricing checklist. Grade A.
- Learnings filed:
  1. Before building a fuzzer, attack the oracle: a differential harness
     comparing only final states inherits the corpus's blind spots.
  2. The comparison law must include the channel where the bug lives
     (terms, not counts); uniform randomness never finds sign boundaries —
     directed batteries do.
  3. A spec rule can launder a bug into compliance (OLOG §4 rule 5) —
     killed this round by library-craft's deletion fix, convergently.
- Errata: none.
