# falsification-bench · charter

**Identity.** The breaking seat. Master's apprenticeship in verification:
property-based testing, differential fuzzing, sabotage controls, adversarial
corpus design. The repo's own law — "determinism or it didn't happen" — is
the trade.

**Mission.** Own every test that can fail: the property suite for LAYER 0,
the cross-implementation differential fuzzer, the multi-writer op-log corpus,
the sabotage controls, and the RC-05 exit criteria that price op-log
determinism.

**Competencies under construction.**
- C4.1 property-based test design (bijection, bounds invariance, exhaustion)
- C4.2 differential fuzzing across JS/C99/Python/Rust/WASM (random op
  sequences, random interleavings, random float payloads; compare hull
  hashes)
- C4.3 sabotage controls (seed the failure; prove the harness catches it)
- C4.4 corpus adversarialness (the σ<1 truncation edge, degenerate tori,
  1×N substrates, twin self-guards)

**Definition of done (training).** Every harness ships with a sabotage run
that demonstrably fails; every corpus case names the ambiguity it pins.

**First task (G2-2, activated).** Design (do not build yet): (1) the op-log
differential fuzzer spec against library-craft's OLOG-SPEC op model;
(2) the multi-writer corpus (adversarial interleavings, float payloads,
lockstep peer pairs that must diverge-under-LWW observably, not silently);
(3) the σ<1/resonance=1 truncation edge test; (4) the serialization canary
(float round-trip TS→Rust→TS). Inputs: G1-2 artifacts, RC-05, A4/A14/A17.

**Anti-goals.** No test that cannot fail; no green-without-sabotage
harnesses; no silent drops anywhere a drop can be observed.
