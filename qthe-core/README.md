# qthe-core — the standalone substrate primitive

The 8-bit qthe primitive, extracted from
[SuperInstance/qthe](https://github.com/SuperInstance/qthe) with **zero
dependencies beyond the language stdlib**. One byte per cell:

```
bit:   7  6  5 4 3 2 1 0
[τ:2][  d:6        ]
```

- `τ` (timbre): 0 **Ground** · 1 **Attract** (+1) · 2 **Repel** (−1) ·
  3 **Abstain** (i — the Looking Glass)
- `d` (amplitude): 0…63

`tick()` advances the whole plane synchronously (toroidal Moore-8
neighborhood); Abstain cells read/write a shared 64-slot **wormhole table**
(live-read, row-major, last-writer-wins) that is the only non-local causal
channel — Ground cells forward nothing. Same input, same tick count →
byte-identical state, always. No `Math.random` in the kernel; seeded
`mulberry32` is for callers.

## What's in the box

| path | plane | what |
|------|-------|------|
| `kernel/qthe.mjs` | float (σ = log₂(3) double) | the reference kernel: LAYER 0 algebra (pack/unpack, split-channel `vectorPass`) + LAYER 1 mechanism (wormhole table, `tick`, `traceView`) |
| `kernel/qthe_fixed.mjs` | fixed (σ_q = int64, S = 2³²) | the no-floats plane (R8): byte-identical to the float kernel on swept σ, more faithful on adversarial rationals |
| `c/qthe_core.{h,c}` | both | the C99 port — **byte-exact** vs both JS kernels on a 19-case battery (hashes, event tuples, IEEE754 term bits); one `cc` line, no libm |
| `py/qthe_layer0.py` | LAYER 0 | the strict Python re-derivation |

Every file is a byte-exact copy of the canonical source; `PROVENANCE.txt`
pins the sha256s. Rebuild with
`node scripts/build_qthe_core.mjs` from the repo.

## 30 seconds

```bash
node -e '
import("./kernel/qthe.mjs").then(({ makeSubstrate, tick, pack }) => {
  const sub = makeSubstrate(8, 8, (x, y) =>
    (x === 1 && y === 1) || (x === 6 && y === 6) ? pack(3, 20) : 0);  // two Abstain twins
  for (let t = 0; t < 10; t++) tick(sub, {});
  console.log("tick", sub.ticks, "twin events last tick:", sub.lastEvents.length);
});'
```

C:

```bash
cc -O2 -std=c99 -o qthe c/qthe_core.c   # no -lm needed
```

## The measured record (why you can depend on this)

- **Determinism**: same substrate + ticks → identical bytes, proven by
  exhaustion (gates G1–G6, 1000-tick traces, 10,272/10,272 cross-language).
- **C1 LIVES**: the 1-byte encoding touches ~47% fewer bytes to task than a
  2-byte ported encoding (E-Q13, 20/20 trials, port-dynamics-identity held).
- **C2 LIVES**: the wormhole table delivers non-local alignment the OFF arm
  cannot achieve at all (8/8 vs 0/20, E-Q1).
- **C3/C4/C5 DIED honestly** — no critical σ scale, no threshold cascade, no
  self-repair; the mechanisms are priced and written down
  (`docs/CLAIM-VERDICTS.md` in the source repo).
- **Cost of exactness**: fixed vs float plane = 0.975× runtime (parity);
  byte-identical on swept σ.
- Boundary discipline: delivery is congestion-robust; **provenance is not**
  (the table is content-addressed — E-Q14). If you need WHO, keep d
  assignments separated; if you need only signal, congestion is harmless.

## Receipts

The full experiment corpus, pre-registrations, and stone-v1 receipt chains
live in the source repo (Start at `docs/KNOWLEDGE-MAP.md`). Chain sealing
uses the fleet's canonical `quilt-stone` module — linked there, never
forked; the standalone core therefore ships hashing (via your stdlib) but
not chain sealing.
