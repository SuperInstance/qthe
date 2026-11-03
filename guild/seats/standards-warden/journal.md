# standards-warden · journal (append-only)

## G2-1 · SPEC v1.0 fold · 2026-11-02 · GRADED A

- Brief: fold every ambiguity receipt (A1–A17, repo A-R1–R3, kernel
  R1–R7) into a load-bearing SPEC v1.0 draft; N1 (live reads) and N2
  (twin-into-pressure) first.
- Artifacts: work/G2-1/SPEC-v1.0-DRAFT.md (688 lines; N1–N16; trace-compat
  classes; ledger status tables).
- Orchestrator verification: N1/N2 checked against the kernel's R2/R3
  receipts — normative text matches, self-read-visibility subtlety
  included. Seat independently built a Python model, reproduced all 24
  corpus cases byte-exact, and ran counterfactual witnesses per ruling
  (staged reads → 0,2,0 vs corpus 2,2,2; truncating σ → 79 vs 53 events).
  17/17 + 3/3 closed, zero forks open; honest open items recorded (term
  bits unpinned by corpus v1; fixed-plane encoding deferred). Grade A.
- Learnings filed:
  1. A normative sentence isn't finished until you have watched the wrong
     reading fail — counterfactual runs found two fixture notes claiming
     pins they cannot distinguish, and the evidence sentences were
     rewritten to name the fixtures that actually carry the fork.
  2. The spec's testability claims are constraints on normative text: item
     2's exhaustion claim is what forbids hidden accumulator state.
- Errata: none.
