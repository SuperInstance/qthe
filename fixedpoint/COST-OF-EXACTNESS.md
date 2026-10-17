# The Cost of Staying Exact — measured (ORCH-6)

> Companion to `docs/REPRESENTATION-LAW.md` (the law and the sealed record)
> and `fixedpoint/findings.md` (the priced scoreboard). This file adds the
> one dimension the sealed corpus never measured: **runtime**. Measured on
> the orchestrator's machine (Node 24, x86_64), receipted as strings in
> `fixedpoint/receipts/fixedpoint_chain.jsonl` rows `cost_benchmark.ORCH6`
> (tip chain now at `ff70bdea…`, 26 links) — wall-clock never enters hashed
> content; the semantic checks below are plane-hash booleans.

## Runtime cost: effectively zero

Workload: the E-Q1 twin-delivery class (64×64, K=8 Abstain pairs + weather,
wormholes ON, default σ path), 400 ticks, 5 fresh reruns per arm, medians
over two seeds.

| plane | median per run | ms per tick per 1,000 cells |
|-------|----------------|------------------------------|
| float (`qthe.mjs`) | 19.61 ms | 0.753 |
| fixed (`qthe_fixed.mjs`) | 19.12 ms | 0.734 |
| **ratio (fixed/float)** | **0.975×** | — |

The integer plane is marginally *faster* than the float plane on this
machine — within run-to-run noise, the honest reading is **parity**. There
is no runtime tax for exactness. The fixed kernel replaces one
double-multiply (`resonance * sigma`) with an integer multiply
(`resonance * sigma_q`); both are single-digit nanoseconds inside a loop
dominated by the Moore-8 gather, so the planes are indistinguishable at the
workload level. The E-Q13 traffic analysis already showed the memory system,
not arithmetic, is where this substrate spends its bytes; the benchmark
confirms the same is true of its cycles.

## Semantic cost: the sealed record, re-verified here

- **Swept sigmas (0.5, 1, log₂(3), 2, 4): planes byte-identical** across
  both kernels — re-verified on this machine, 2 seeds × 200 ticks × 5 arms,
  checkpoint plane hashes equal at every checkpoint. The corpus's
  zero-divergence record (8 seeds × 400 ticks) reproduces.
- **Coupled σ = 2/3: divergence reproduced 8/8** on P-B3-style random
  substrates, first divergence ticks 2–19 (sealed record: 3–17). One
  honest workload-coverage note is receipted: the twin-delivery class
  *cannot* produce the coupled (reader acc = −2, writer r = 3)
  configuration — its weather cells sit ≥ 10 away, so pair members have
  acc = 0 — and its coupled-2/3 check is vacuously clean. Divergence at the
  coupled point requires local Repel pressure on the reader; random
  substrates provide it, planted twin tasks do not. Downstream consumers
  choosing a plane should test on **their own** substrate geometry, not
  assume the twin-delivery result transfers.

## The complete cost picture (law for consumers)

| dimension | cost of the fixed plane | receipt |
|-----------|------------------------|---------|
| runtime | ≈ 0 (0.975×, parity within noise) | `cost_benchmark.ORCH6` |
| state | σ travels as a 64-bit integer (sigma_q), no doubles in kernel state | R8, findings.md |
| fidelity on swept σ | zero — planes byte-identical | F_B, re-verified here |
| fidelity at coupled 2/3 | one S-unit (2⁻³² of scale) at exactly one pre-registered point | F_A A5 |
| fidelity on adversarial rationals (1.6, 0.7, …) | the exact-zero families — where the FIXED plane is the more faithful of the two | P-B1 autopsy |
| portability | integer-only path survives languages without IEEE-doubles guarantees; the crossimpl C port targets this plane | crossimpl/c/ |

**Decision rule (unchanged, now with numbers):** use the float plane when
you are reproducing the sealed corpus verbatim; use the fixed plane
everywhere else — it costs nothing at runtime, keeps σ an exact integer
knob, and is the only plane that behaves identically across languages and
compilers. The full law and its falsification history:
`docs/REPRESENTATION-LAW.md`.
