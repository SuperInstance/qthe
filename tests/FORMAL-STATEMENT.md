# LAYER 0 formal statement (ORCH-32)

For all c : uint8 — pack(tauOf c, dOf c) = c  (bijection onto {0..3}×{0..63})
For all (d, p) — 0 <= nextD d p <= 63  (bounds invariance; the gifted Coq
theorem's testable restatement)

Machine-checked by tests/layer0_verifier.mjs via exhaustive enumeration of
the finite domains (256 values; the full rule table plus adversarial
pressure magnitudes). The exhaustion script is the checker of record; this
file renders the statements for proof assistants. A Coq/Lean mechanization
of the SAME statements is welcome as a second checker but changes nothing
epistemically here — the domains are finite and fully enumerated.
