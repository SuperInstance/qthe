# crossimpl/AMBIGUITY.md — pre-peek ambiguity ledger (Task 34-e)

Law of this lane: the Python reimplementation in `crossimpl/py/qthe_layer0.py`
is written from `SPEC.md` ALONE. Where the SPEC is ambiguous or silent, the
ambiguity is written HERE **before** opening `qthe.mjs`, together with the
chosen reading. Only after the Python passes its own self-tests is the kernel
opened; the post-peek resolution of each item is appended in §RESOLUTIONS.
Divergences caused by ambiguity are FINDINGS about the SPEC, not bugs in the
porter. Nothing in either implementation is silently patched to force
agreement.

Written BEFORE any read of `qthe.mjs` (or of `tests/`, `experiments/` bodies
that might leak kernel semantics; receipt-chain format only was consulted, in
`quilt-stone/stone.mjs`, which contains no QTHE algebra).

## Scope frozen: LAYER 0 only

Per SPEC §LAYER 0: (1) the pack/unpack bijection, (2) the Ψ map, (3) the
split-channel vectorPass. All specified as exact integer operations.
(Bounds invariance is listed as a LAYER 0 fact but its update rules live in
LAYER 1; this lane tests it as: unpack(tau,d) always lands in [0,3]×[0,63],
and every d consumed by vectorPass is in [0,63] — by exhaustion over all 256.)

## Ambiguities (SPEC-silent points) and chosen readings, frozen pre-peek

- **A1 pack direction.** SPEC gives unpack (`d = c & 0x3F`, `τ = c >> 6`) and
  asserts the bijection; the pack inverse is implied, not written.
  CHOSEN: `pack(τ, d) = (τ << 6) | d`, with validation `τ ∈ {0..3}`,
  `d ∈ {0..63}` (raise on out-of-range). Inverse of unpack by construction.

- **A2 the sign of the imaginary channel.** Ψ(3) = i; contribution is
  `Ψ(τ)·d·x_k = i·(d·x_k)`. The SPEC's own expansion `y_j^I = Σ_{τ=3} d·x_k`
  fixes the imaginary coefficient at **+1** (not −1, not conjugated).
  CHOSEN: imag channel accumulates `+d·x_k` for τ=3 cells. (Counted as
  SPEC-resolved, logged here for completeness.)

- **A3 vectorPass shape.** `w_jk` implies a J×K matrix of 8-bit primitives,
  `x_k` a length-K vector, output length-J. SPEC does not name the signature.
  CHOSEN: `vector_pass(weights: J rows × K cols bytes, xs: length K ints) ->
  (yR: length J, yI: length J)`; raise if any row length ≠ K (ragged input is
  invalid, not truncated).

- **A4 domain of `x_k`.** SPEC silent. "Exact integer arithmetic … no floats
  in LAYER 0" suggests unbounded integers.
  CHOSEN: `x_k` may be ANY integer (Python ints are exact at any magnitude);
  non-integer inputs (floats) are REJECTED (no-floats invariant enforced, not
  coerced). The conformance battery (pre-registered below) stays inside a
  bound where JS doubles are also exact, so byte-parity is decidable; a
  separate boundary probe documents where the kernel's "exact integers" end,
  if they end, as a FINDING rather than a battery failure.

- **A5 accumulation order.** Exact integers are associative/commutative; order
  cannot matter in a correct exact implementation. No chosen reading needed —
  any order mismatch observable between two exact impls would itself be a
  defect. Noted, closed.

- **A6 bias / activation.** SPEC's formula is a pure two-channel linear pass.
  CHOSEN: no bias, no activation, no clamping. yR and yI are raw sums.

- **A7 weight validity.** Weights are the 8-bit primitive.
  CHOSEN: weights outside [0,255] are REJECTED (raise), not masked. Masking
  would silently invent primitive states.

- **A8 return type.** `y = y^R + i·y^I` is notation; floats are banned, so a
  complex type is out. CHOSEN: return the channel pair (yR, yI) as exact
  integers; the complex view is a reader-side reconstruction.

- **A9 degenerate shapes.** SPEC silent on K=0 / J=0.
  CHOSEN: defined — K=0 yields y_j = 0 in both channels; J=0 yields empty
  outputs; neither raises. (If the kernel raises, that is an A9 finding.)

- **A10 Ψ for τ=0.** Ground contributes to neither channel ("Ground (τ=0)
  contributes to neither") — coefficient 0 in both. Counted as
  SPEC-resolved; logged because a naive `Ψ(0)=0 ⇒ skip` and an
  explicit-zero accumulation are the same thing here.

## Pre-registered conformance battery (frozen BEFORE any run)

- **Bijection (exhaustive):** full domain = all 256 byte values (state space
  2^8 — exhaustive is cheap; stated per doctrine). Assert: round-trip exact
  256/256; the 256 (τ,d) pairs are DISTINCT and cover {0..3}×{0..63}
  exactly (256 = 4×64, no holes, no duplicates); d ∈ [0,63], τ ∈ [0,3] for
  every byte. Both implementations, full 256-entry tables compared
  byte-exact.
- **Ψ map (exhaustive):** domain = {0,1,2,3} (stated: 4 inputs). Compared as
  the channel-coefficient table (real coeff, imag coeff) per τ, byte-exact.
- **vectorPass (randomized):** N = 10,000 vectors; PRNG = mulberry32;
  SEED = `0x5EED34E` = 99537742 (the hex is normative; the first registration
  of this line carried a wrong decimal expansion, 1586879822 — caught and
  corrected HERE before any vector was generated or any run happened). Per vector:
  J = 1 + ⌊r·6⌋ ∈ [1..6], K = 1 + ⌊r·8⌋ ∈ [1..8]; weights uniform [0,255];
  x_k mixture by next draw: r<0.5 → signed byte [-128,127]; r<0.8 →
  unsigned byte [0,255]; else ± value in [2^36, 2^40]. Exactness bound:
  max|y_j| ≤ K·63·2^40 ≤ 8·63·2^40 ≈ 5.57e14 < 2^53 — BOTH languages exact;
  byte-parity is therefore decidable without either side compromising.
- **vectorPass (edge vectors, fixed, 12):** all-ground weights; all-zero x;
  τ-cycling weights at fixed d; single cell (J=1,K=1); J=1 row; K=1 column;
  maximal d=63 everywhere; x at ±2^40; alternating attract/repel same d;
  all-abstain; ground+abstain mix; one K=0 probe (A9: record
  value-vs-raise honestly whichever way each side lands).
- **Comparison discipline:** canonical JSON (recursively key-sorted, no
  whitespace — the stone-v1 canonicalization) of each side's results compared
  as TEXT, plus sha256 of that text; per-vector mismatch indices reported on
  failure with first-divergence detail. Byte-exact = zero tolerance.
- **Negative controls (pre-registered, both must DETECT):**
  - NC1 transit tamper: flip one digit inside the Python-emitted results
    (vector index recorded) → harness must flag mismatch and go FAIL.
  - NC2 source tamper: env `QTHE_TAMPER_VECTOR=<i>` makes the Python worker
    itself corrupt one emitted yR (proves the comparison is live against a
    lying implementation, not merely a transport check) → harness must flag.
  - After both detections are proven, the REAL battery must run clean.
- **Verdict vocabulary:** PASS (byte-parity, zero divergences), FAIL (any
  divergence — honest FAILs stay standing), with exact counts N / matches /
  divergences in findings.md and in the receipt chain.

## RESOLUTIONS (appended ONLY after the Python self-tests pass and qthe.mjs is opened)

- (pending — to be filled post-peek, each ambiguity A1..A10: kernel's actual
  reading, agreement/divergence with the chosen reading, classification
  [SPEC-ambiguity finding | kernel defect | porter error], and what changed,
  which must be: nothing silent.)
