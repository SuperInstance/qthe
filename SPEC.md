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
| C1 | "25% gain of function" from intra-cell timbre vs inter-cell porting | paired arms: same task, 2-byte porting encoding vs 1-byte QTHE encoding; measure bytes-touched + ticks-to-task | **LIVES — 47.40% bytes-gain (founder's 25% understated), ticks identical, footprint halved** (E-Q13, tip `d852e6ac…`) |
| C2 | wormhole (Abstain) beats graph-traversal for non-local alignment | planted twin-resonance tasks; arms = wormhole table ON vs OFF; pre-registered floor on ticks-to-connect | **LIVES — 8/8 ON vs 0/20 OFF** (E-Q1, tip `addc22f9…`) |
| C3 | σ = log₂(3) is the critical bridge scale | σ sweep {log2(3), 0.5, 1, 2, 4} on bridge-formation stability | **DIES (honest null, formation-scoped) — full tie; σ monotone-inert on bridge formation** (E-Q2, tip `67e849a5…`); the gifted "proof" was decorative as registered. **Scope (ORCH-R10, three seats independently flagged it):** σ is not a global no-op — completion scales ~1/σ (E-Q16-B: 38→3 ticks over σ 0.25→4) |
| C4 | phase threshold θ > π/4 triggers useful non-local transfer | threshold sweep on the same planted tasks | **DIES — falsified under the guest's own sealed rule; cascade real, no terminal inversion** (E-Q7, tip `befa0c33…`) |
| C5 | the substrate self-repairs (the armor-ring scenario) | damage the ring adversarially; measure repair ticks vs pre-registered band | **DIES (honest null) — ring self-dissolves; no repair term exists in the kernel** (E-Q5, tip `4425545f…`) |
| C5′ | repair via injector (one-pager spec) | restore-then-re-erode determinism | **STANDS — definitional, receipted as such** (E-Q10, tip `50ddf5f9…`) |
| C9 | hierarchical wormholes (8×8+8 folded addressing) restore provenance under population load *(the roadmap's own P42, priced after E-Q17's redirect — not a gifted claim)* | population ladder {16..272 writers} at fixed 64×64; flat kernel (F-CAL vs E-Q17) vs two-level transcription (F0-T byte-identity) | **DIES (with prejudice, opposite direction) — 11× WORSE than flat clean; the d&7 fold trades cross-region anonymity for 8× denser cross-cargo aliasing; H2 escalation-free LIVES** (E-Q18, tip `fe059a2e…`) |

Every LAYER 2 claim is now priced. Mechanism-level explanations for each
verdict (re-derivable from the kernel alone): **docs/CLAIM-VERDICTS.md** —
which also carries the deployment-layer receipts (C6 Vectorize sidecar + its
r17 pricing death, C7 R2 content-addressed chains, C8 Pages mirror, KV +
cron beat), each measured live against the running service by
`cloudflare/live_checks.sh`.

House law: a claim that dies, dies cheap and honest, with the receipt kept
beside the body. A claim that lives gets a mechanism-level explanation.

## The fleet's additions to the gift

- **Stone-v1 receipts**: every experiment run seals its parameters + trace
  hashes into a stone-v1 chain — the substrate's own discipline, applied to
  its own study.
- **Determinism or it didn't happen**: any experiment whose re-run changes a
  byte is void.
- **The tavern, round 10+**: eight competing guests on DeepInfra
  (Nemotron-3.5-Super-VL, MiMo-V2.6-Flash, DeepSeek-V4.1-Flash,
  Qwen3.6-35B-A3B, Seed-2.0-mini, Ling-3.1-flash, Muse-Glimmer-30B,
  Hy4-preview) — one immutable briefing prefix (cache-gamed; per-seat
  discounts receipted), identical tasks, outputs sealed verbatim with
  provenance and native cache telemetry. Nothing a guest says counts until
  the orchestrator verifies it against the repository — round 10 was the
  eight-seat audit of the completed corpus (`situations/arena_r10_verdict.md`:
  40 findings, 19 verified new, 2 hallucination classes priced, 1 gate
  extension adopted). A TypeSafe/Jev judge seat is delivered key-pending
  (`situations/jev_judge.py`).
