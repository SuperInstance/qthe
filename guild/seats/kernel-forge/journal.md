# kernel-forge · journal (append-only)

## G1-1 · spec-only C99 re-derivation · 2026-11-02 · GRADED A

- Brief: re-derive the kernel in C99 from SPEC.md alone (items 1–6); log
  every ambiguity; compile clean; honest self-assessment.
- Artifacts: work/G1-1/qthe_l1.c (482 lines), AMBIGUITY.md (17 entries),
  SELF-ASSESSMENT.md.
- Orchestrator verification: compile re-run clean (cc -std=c99 -Wall
  -Wextra); ambiguity log adjudicated against the reference kernel the seat
  never saw — 13/17 decisions match; 2 significant spec-gap divergences
  (A1 snapshot-vs-live reads; A10/A17 no-imaginary-feedback), 1 subtle
  (A4 rational truncation vs float sign-survival). Grade A.
- Learnings filed:
  1. The spec's own testability claims are load-bearing — item 2's
     exhaustion claim DERIVED the per-tick accumulator recompute (A11).
     Read the tests as constraints, not just the rules.
  2. Where a competent reader diverges from the reference is exactly
     where the spec is not load-bearing — divergence is a product
     (feeds standards-warden G2-1 directly).
  3. Missed edge: rational-truncation σ zeroes the twin term at σ<1,
     resonance=1 — float sign-survival is not cosmetic (flagged by
     Orchestrator; goes to falsification-bench G2-2).
- Errata: none.

## G2-6 · corpus battle test · 2026-11-02 · GRADED A+

- Brief: replay the 24-case golden corpus against G1-1 C (Act 1, blind),
  patch to the three adjudicated rulings (Act 2), map every divergence
  (Act 3). Corpus-only discipline: the reference kernel never read.
- Artifacts: work/G2-6/{corpus_replay.c, qthe_l1_v1_1.c, run.sh,
  DELTA-REPORT.md}.
- Orchestrator verification: run.sh RE-RUN by the Orchestrator — 10/24
  (blind, all 14 twin-active cases failing events-first at tick 1, the A1
  fingerprint, closed-form #Abstain − #distinct(d) satisfied by all 20)
  → 24/24 after patch, zero iteration; ASan/UBSan clean; byte-identical
  reruns. Grade A+.
- Learnings filed:
  1. A golden corpus beats a perfect argument: 30 minutes of oracle
     forensics on three hand-solved cases pinned all three rulings with
     closed-form predictions before a line of v1.1 was written.
  2. Live reads = read-then-write per cell in scan order on one shared
     table; the twin baton passes via pre-tick-d keying (post-d keying
     would collapse the chase period — hand-checked).
  3. Event counts heal toward corpus values after tick 1 while planes keep
     diverging — the corpus's dual check (plane AND events) is
     load-bearing; counts alone can mask divergence.
- Errata: none.

