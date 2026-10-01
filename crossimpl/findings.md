# crossimpl/findings.md — LAYER 0 cross-implementation conformance report
Lane 34-e (porter-smith) · kernel `qthe/qthe.mjs` @ b99265e lineage
(sha256 ef9a3bba0511c78026f30706214e407d362e8972a86f5684d9b16a9e16e3f091) ·
Python `crossimpl/py/qthe_layer0.py`
(sha256 bd5c67786b33613562695a1ab29175eed740cfebd444d07a36013f512648c6de)

## What this was

An **independent re-derivation** of QTHE LAYER 0 from `SPEC.md` ALONE, in
Python, then cross-verified byte-exact against the JS reference kernel. The
discipline was the point: the SPEC was read first; every SPEC-silent point was
written into `AMBIGUITY.md` (A1–A10) with a chosen reading **before** the
kernel was opened; the Python passed its own 36-assertion self-test (bijection
exhaustive over the 2^8 domain, hand-computed vectorPass cases frozen pre-run)
before the kernel was peeked; the battery spec (seed, shapes, distributions,
edge vectors, negative controls) was frozen before any run. One registration
error was caught and receipted pre-run: the decimal expansion of the battery
seed was wrong in the first AMBIGUITY.md (hex `0x5EED34E` = 99537742 is
normative; corrected before a single vector was generated).

## Conformance numbers (all byte-exact, zero tolerance)

| section | domain | N | matched | divergences | verdict |
|---|---|---|---|---|---|
| A. pack/unpack bijection | EXHAUSTIVE, full 2^8 byte domain (256 inputs; state space 2^8 — exhaustive is cheap) | 256 | 256 | 0 | **PASS** |
| A'. bijection coverage | 256 distinct (τ,d) pairs = the full {0..3}×{0..63} product, no holes, no duplicates | 256 | 256 | 0 | **PASS** |
| B. Ψ map | EXHAUSTIVE, domain {0,1,2,3} | 4 | 4 | 0 | **PASS** |
| C. vectorPass | randomized battery: mulberry32 seed `0x5EED34E` (99537742), J∈[1..6], K∈[1..8], mixed input distributions | 10,000 | 10,000 | 0 | **PASS** |
| C'. vectorPass edges | 12 fixed vectors (all-ground, all-zero-x, τ-cycling, J=1/K=1, max-d, ±2^40 inputs, all-abstain, K=0 probe) | 12 | 12 | 0 | **PASS** |
| **total** | | **10,272** | **10,272** | **0** | **PASS** |

- Byte-exactness was enforced at the SERIALIZATION level: the Python worker
  emits stone-v1 canonical JSON with its own serializer; the JS side
  canonicalizes through THE STONE's `canonicalJSON`; the two TEXTS must be
  identical. They were — `py_results.json` and `js_results.json` are
  byte-identical files (sha256 `d242f96d3eb384033cb4a557148b512a87f73ab72dae7c98756d6dad39b1f850`
  for both), built by two independent serializers on two sides of a
  process boundary.
- Determinism: a full harness re-run reproduced every artifact byte-identical
  (vectors / py_results / js_results / verdict — 4/4 sha256 equal).
- The K=0 edge vector resolved AMBIGUITY A9 the same way on both sides
  (defined, not an error: y=0), and τ-cycling/max-d vectors confirmed the
  ground channel silence (SPEC: "Ground contributes to neither") and the
  attract/repel cancellation symmetry.

## Negative controls (the comparison is live, not vacuous)

| control | tamper | detected | localized |
|---|---|---|---|
| NC1a | one VALUE flipped in the Python-emitted results (id 5000, yR[0] −8036 → −8035) | YES | YES (id 5000) |
| NC1b | one raw CHARACTER flipped in the Python-emitted canonical text | YES | (byte level) |
| NC2 | SOURCE tamper: the Python worker itself corrupted id 5000 before emitting (`QTHE_TAMPER_VECTOR=5000`) | YES | YES (id 5000) |

NC2 is the strong one: it proves the harness catches a **lying
implementation**, not merely a corrupted transport.

## Divergences found and classified (none on the specified surface; none patched)

- **F1 — the kernel's exactness horizon is ±2^53 and it is silent on the
  INPUT side. Classification: SPEC-ambiguity finding (the SPEC says "exact
  integer arithmetic … no floats in LAYER 0" with no stated bound; the kernel
  is honest inside Number but cannot receive integers beyond 2^53).**
  Evidence (`probe_exactness.mjs` → `artifacts/probe_exactness.json`):
  P1 `x = 2^53` → both sides give exactly `63·2^53 = 567453553048682496`
  (agree — representable despite being outside `Number.isSafeInteger`);
  P2/P3 `x = ±(2^53+1)` → the JS literal is rounded to 2^53 **before** Layer 0
  sees it (`(2**53+1)===(2**53)` is true in JS), so the kernel computes
  `63·2^53` while Python, fed the true integer as raw text, computes
  `63·(2^53+1) = 567453553048682559`. A silent input-side rounding, by
  construction, on inputs the SPEC does not exclude. The pre-registered
  battery stayed ≤ 8·63·2^40 ≈ 5.57e14 < 2^53 precisely so this seam could not
  contaminate the battery verdict. **Probe honesty note:** the probe's first
  version produced a PHANTOM P1 disagreement by JSON.parsing the Python
  worker's exact big-integer output into a double — the probe was bitten by
  the very seam it hunts; it now compares raw text digits, and the fix is
  receipted in its header.
- **F2 — ragged input: NaN poison vs raise. Classification: SPEC-ambiguity
  (malformed shapes are outside the specified surface).** Kernel
  `vectorPass` with a row longer than `xs` silently yields `NaN`
  (`xs[k]` is `undefined`) — a float, inside a layer whose contract says "no
  floats", but only reachable off the specified surface. Python raises
  (A3 reading: ragged is invalid, not truncated). Receipted, not patched.
- **F3 — out-of-domain validation: masking vs raising. Classification:
  SPEC-ambiguity.** Kernel masks (`tau & 3`, `d & 63`, `w & 0xff`) where
  Python raises (A1/A4/A7 readings). Over the domains the SPEC actually
  specifies the two agree byte-exact (that is what sections A/B/C prove); the
  divergence exists only on inputs the SPEC never admits. Receipted as a
  validation-style choice for the next reader.

## AMBIGUITY.md resolutions (A1–A10, post-peek)

All ten chosen readings were **confirmed by the kernel** on the specified
surface; zero divergence required a reinterpretation. A1 pack = `(τ<<6)|d`
(kernel additionally masks out-of-range → F3); A2 imag coefficient +1 (kernel
`case 3: im += dv*x`); A3 shape J×K matrix × K-vector (kernel has no ragged
validation → F2); A4 unbounded-integer reading with the battery bounded to
2^53-safe territory (kernel's true bound → F1); A5 order-invariance — unobservable
in exact arithmetic, confirmed unobservable; A6 no bias/activation (kernel
none); A7 weights-as-bytes (kernel masks → F3); A8 channel pair, complex view
as notation (kernel returns `{re, im}`); A9 degenerate shapes defined (kernel
agrees: K=0 → zeros, J=0 → empty); A10 ground contributes to neither (kernel
`default: break`). The kernel's `PSI[3]` is the operator CHARACTER `'i'` —
notation, never multiplied in; the exact-integer reading (real 0 / imag +1)
is what its own `vectorPass` implements.

## What this receipt means for cross-impl doctrine

An independent reader re-derived QTHE LAYER 0 from the SPEC alone — with every
SPEC-silent choice frozen on the record before the kernel was opened — and
reached byte-parity with the reference kernel on the entire specified surface
(exhaustive bijection 256/256, exhaustive Ψ 4/4, 10,012 vectorPass vectors,
0 divergences), with tamper-detection controls proving the comparison live.
The SPEC's Layer-0 algebra is therefore **specified tightly enough to
re-derive, not just to re-read**: the seams that did surface (F1–F3) all live
outside the specified surface — the integer bound, malformed shapes, and
out-of-domain validation — and are exactly the three sentences the SPEC would
need to close them.

## Reproduce

```
python3 crossimpl/py/selftest.py          # 36 assertions, exit 0
node crossimpl/conformance.mjs            # battery + controls, exit 0 = PASS
node crossimpl/probe_exactness.mjs        # boundary probe (findings)
node crossimpl/seal_receipts.mjs          # reseal + verify chain from disk
```

Artifacts in `crossimpl/artifacts/` (vectors seed 0x5EED34E, results,
verdict, probe, logs); chain in `crossimpl/receipts/crossimpl_chain.jsonl`
(stone-v1, verified from disk at seal time).
