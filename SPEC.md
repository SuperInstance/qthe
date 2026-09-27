# QTHE SPEC — the gifted vision, priced by the house

Source: the founder's research corpus (this conversation, 2026-09-27), distilled
verbatim in structure, then split by the house's honesty law into what is
**fact we can exhaustively test**, what is **mechanism we can implement
exactly**, and what is **claim we must price empirically** (honest null =
crown jewel, per fleet law).

## The primitive

One byte, two planes — data is geometry, control is physics:

```
bit:   7  6  5 4 3 2 1 0
       [τ:2][  d:6        ]
```

- `d = c & 0x3F` — the spatial-amplitude coordinate, `[0, 63]`
- `τ = c >> 6` — the timbre / operator state, `{0, 1, 2, 3}`

| τ | name | operator Ψ(τ) | substrate action |
|---|------|--------------|------------------|
| 0 | Ground | `0` | static anchor; data is baseline coordinate |
| 1 | Attract | `+1` | forward cascade; amplifies the path |
| 2 | Repel | `−1` | inversion layer; reverses phase in aggregation |
| 3 | **Abstain** | `i` | **the Looking Glass** — bypasses local weights, bridges via the wormhole table |

## LAYER 0 — algebra facts (exhaustively testable)

1. **Pack/unpack bijection**: `c ↦ (τ(c), d(c))` is a bijection onto
   `{0..3} × {0..63}`. Round-trip exact for all 256 values.
2. **Bounds invariance** (the gifted Coq theorem, restated as a testable claim):
   every update rule maps `[0,63] → [0,63]`. The house proves this by
   *exhaustion*: all 4 × 64 states, all rules, no exceptions.
3. **Split channels**: a QTHE vector pass over inputs `x_k` computes

   ```
   y_j = Σ_k Ψ(τ(w_jk)) · d(w_jk) · x_k
       = y_j^R + i·y_j^I

   y_j^R = Σ_{τ=1} d·x_k  −  Σ_{τ=2} d·x_k      (real channel)
   y_j^I = Σ_{τ=3} d·x_k                          (imaginary channel)
   ```

   Ground (τ=0) contributes to neither. This is exact integer arithmetic
   in the reference kernel — no floats in LAYER 0.

## LAYER 1 — mechanism (implementable exactly, determinism testable)

4. **The 64-slot wormhole table** (the compile-time blueprint — the founder's
   GraphQL insight applies here: static declarative allocation, zero runtime
   discovery). When a cell in Abstain state carries data value `d`:
   - it reads slot `d`: if occupied by a *different* (x, y) with nonzero
     resonance → **twin resonance**: imaginary channel receives
     `resonance · σ`
   - it writes its own `(x, y)` and `resonance = |real_acc| + 1` to slot `d`
     for the next tick.
5. **Neighborhood update** (Moore-8, branchless form): Attract neighbors add
   `d`, Repel neighbors subtract `d` into the cell's real accumulator; the
   cell's own data moves toward saturation `min(d+1, 63)` under net-positive
   pressure, toward 0 under net-negative (exact rule table in the kernel).
6. **Determinism**: same initial substrate + same tick count → byte-identical
   trace, always. The kernel is seed-to-hash reproducible; every experiment
   seals its trace hash into a stone-v1 receipt chain.
7. **A2UI telemetry mapping** (the live mirror): τ=1 green, τ=2 red,
   τ=0 ground gray, τ=3 purple blinking on wormhole activity — pixel = cell,
   6-bit value = intensity, no log files, direct buffer-to-canvas.

## LAYER 2 — empirical claims (PRICED, not assumed)

| # | claim from the gifted corpus | our test | status |
|---|------------------------------|----------|--------|
| C1 | "25% gain of function" from intra-cell timbre vs inter-cell porting | paired arms: same task, 2-byte porting encoding vs 1-byte QTHE encoding; measure bytes-touched + ticks-to-task | **open** |
| C2 | wormhole (Abstain) beats graph-traversal for non-local alignment | planted twin-resonance tasks; arms = wormhole table ON vs OFF; pre-registered floor on ticks-to-connect | **open** |
| C3 | σ = log₂(3) is the critical bridge scale | σ sweep {log2(3), 0.5, 1, 2, 4} on bridge-formation stability | **open** — note: the gifted "proof" is decorative (the Gaussian integral yields σ√2π for ANY σ); only the sweep decides |
| C4 | phase threshold θ > π/4 triggers useful non-local transfer | threshold sweep on the same planted tasks | **open** |
| C5 | the substrate self-repairs (the armor-ring scenario) | damage the ring adversarially; measure repair ticks vs pre-registered band | **open** |

House law: a claim that dies, dies cheap and honest, with the receipt kept
beside the body. A claim that lives gets a mechanism-level explanation.

## The fleet's additions to the gift

- **Stone-v1 receipts**: every experiment run seals its parameters + trace
  hashes into a stone-v1 chain — the substrate's own discipline, applied to
  its own study.
- **Determinism or it didn't happen**: any experiment whose re-run changes a
  byte is void.
- **The tavern**: DeepSeek joins as a live guest (cache-gamed: long stable
  system prefix = the whole spec; short varying suffixes = cheap turns),
  generating adversarial situations and reviewing the algebra. Outputs sealed
  with provenance (model, tokens, cache hit/miss — the provider returns the
  telemetry natively).
