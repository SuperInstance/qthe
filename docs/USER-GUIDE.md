# qthe — User Guide

## What you get

A tiny, honest "physics-flavored" computing substrate and its receipts:

- **One byte, two planes.** Bits 7–6 are timbre τ (Ground 0 / Attract +1 /
  Repel −1 / Abstain i), bits 5–0 are the spatial amplitude d in [0, 63].
  Data is geometry; control is physics.
- **An exact core.** A pack/unpack bijection over all 256 bytes, an
  integer-exact split-channel vector pass (real channel = Attract − Repel;
  imaginary channel = Abstain; Ground contributes to neither), and a
  toroidal Moore-8 cellular tick with a pure, exhaustively-tested data rule.
- **A wormhole table.** 64 slots. Abstain cells read slot `d`: a different
  occupant with nonzero resonance adds `resonance · σ` to their pressure
  (twin resonance, the Looking Glass bridging non-locally), then writes
  their own position for the next tick.
- **Determinism as a contract.** No `Math.random` anywhere in the kernel;
  the same substrate and tick count produce byte-identical traces, sealed
  as sha256 into stone-v1 receipt chains.
- **An A2UI live mirror.** `index.html` renders the substrate pixel = cell
  (green Attract, red Repel, gray Ground, purple blinking Abstain on
  wormhole activity) straight from the buffer, with a live HUD tick + trace
  hash.
- **Receipts everywhere.** Pre-registered gates G0–G6, a Python
  cross-implementation re-derived from the SPEC alone, a no-floats
  fixed-point plane, and an experiment series E-Q1…E-Q12 — every claim
  priced, every honest failure kept.

## Install

Node.js >= 18 (for the kernel and gates) and/or Python 3 (for the
cross-implementation). Nothing else:

```bash
git clone https://github.com/SuperInstance/qthe.git
cd qthe
node -e "import('./qthe.mjs').then(q => console.log(q.PSI, q.DEFAULT_SIGMA))"
# -> [ 0, 1, -1, 'i' ] 1.584962500721156   (log2(3), the bridge scale)
```

The full gate suite additionally needs the sibling repo `quilt-stone`
cloned two directories up (`../../quilt-stone/stone.mjs` relative to
`tests/`); without it the suite refuses with a named error — that is the
seal discipline, not a defect.

## First success in 5 minutes

Pack a byte, build a substrate, watch twins resonate:

```bash
node - <<'EOF'
import('./qthe.mjs').then(q => {
  // 1. The primitive: tau=3 (Abstain), d=40  ->  byte 0xC8
  const c = q.pack(3, 40);
  console.log('byte', c.toString(16), q.unpack(c));      // { tau: 3, d: 40 }

  // 2. Two Abstain twins at (1,1) and (6,6), all else Ground:
  const sub = q.makeSubstrate(8, 8, (x, y) =>
    ((x === 1 && y === 1) || (x === 6 && y === 6)) ? q.pack(3, 40) : q.pack(0, 0));

  // 3. Tick with wormholes ON; twin events are emitted:
  q.tick(sub, {});
  console.log('events', sub.lastEvents);
  // -> [{ kind:'twin', x:6, y:6, slot:40, resonance:1, term:1.584962500721156 }]
  //    B heard A's write through slot 40; sigma = log2(3).

  // 4. The exact integer vector pass (LAYER 0 item 3):
  const out = q.vectorPass(
    [[q.pack(1,10), q.pack(2,4), q.pack(3,6), q.pack(0,63)]],  // A10 R4 I6 G63
    [2, 3, 5, 7]);
  console.log(out);  // [{ re: 10*2 - 4*3 = 8, im: 6*5 = 30 }] — Ground silent
});
EOF
```

Expected output:

```
byte c8 { tau: 3, d: 40 }
events [ { kind: 'twin', x: 6, y: 6, slot: 40, resonance: 1, term: 1.584962500721156 } ]
[ { re: 8, im: 30 } ]
```

## Everyday usage

### Run a substrate and seal its trace

```js
import q from './qthe.mjs';   // or the named imports above
const rng = q.mulberry32(20260927);              // caller-side, seeded
const sub = q.makeSubstrate(24, 16, (x, y) =>
  q.pack(Math.floor(rng() * 4), Math.floor(rng() * 64)));
for (let t = 0; t < 1000; t++) q.tick(sub, {});
// hash it: sha256 over canonicalJSON(q.traceView(sub)) — the G3 contract
```

Same seed, same ticks → byte-identical trace. Re-run it and prove it; the
kernel has no randomness to hide.

### Toggle the wormholes (paired arms)

```js
const on  = q.tick(makeSub(), {});                    // table used
const off = q.tick(makeSub(), { wormholes: false });  // table never touched
// With zero Abstain cells the two arms are BYTE-IDENTICAL (G6-S2);
// with Abstain cells they diverge (G6-S1) — that difference is the C2
// mechanism the experiments price.
```

### The live mirror

```bash
python3 -m http.server 8123        # from the repo root
# open http://localhost:8123  — pixel = cell; HUD shows tick, trace sha256,
# twins last tick, wormhole slots; buttons toggle wormholes ON/OFF and seeds.
```

The HUD sha is the honest heartbeat: two reloads at the same tick carry the
identical hash, and the ring seed demonstrably freezes at tick 102 — the
substrate genuinely reaches a fixed point (receipted in demo/smoke/smoke.md).

### Verify the algebra in Python (cross-implementation)

```bash
python3 crossimpl/py/selftest.py    # 36 assertions: bijection, psi table,
                                    # hand-computed vectorPass, rejection laws
```

### Read (or challenge) the experiment record

```bash
head -60 situations/eq12_verdict.md      # 10/10 arithmetic claims, Brier 0.00167
cat experiments/outputs/e_q2_tip.txt     # chain tips per experiment
grep -l "FALSIFIED\|FAIL" fixedpoint/*.md crossimpl/*.md   # honest negatives
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Error: stone.mjs not found (tried: ../../quilt-stone/stone.mjs, ...)` | The gate suite (and `crossimpl/conformance.mjs`) import the sibling `quilt-stone` for canonical JSON + chains | Clone `SuperInstance/quilt-stone` beside qthe, or trust the sealed `tests/receipt.json` + chain tip as the run of record |
| `not a substrate — use makeSubstrate()` | Called `tick()` on a plain Uint8Array | Build with `makeSubstrate(w, h, seedFn)`; the named expandos carry the dims/ticks/table |
| Twin events never fire | No Abstain (τ=3) cells, `wormholes:false`, or the table slot holds your own (x,y) | Plant `pack(3, d)` cells; keep defaults; a cell never resonates with its own write (R4 guard) |
| Traces differ between runs | You randomized the seed fn, or hashed the raw Uint8Array with JSON.stringify (expandos) | Use one seed via `mulberry32(seed)`; hash `canonicalJSON(q.traceView(sub))` |
| Values exceed 2^53 and answers differ from Python | JS Number input-side horizon (cross-impl finding F1) | Stay within the SPEC surface; use the Python path for big integers (it raises instead of rounding) |
| Python raises where JS "works" | F2/F3 documented divergences: Python rejects ragged rows and out-of-domain bytes; JS masks | Both behaviors are receipted; pick the strict one (Python) for validation contexts |
| `file://` demo is blank | ES modules refuse file:// | Serve: `python3 -m http.server 8123` |
| `G4` shows FAIL in the receipt | The registered prediction had a hand-arithmetic error; the corrected literal passes as G4-P2 | Working as intended — house law keeps falsified predictions beside their post-hoc correction |

## FAQ

**Q: Is this real physics?**
It is an 8-bit data format and a cellular automaton whose vocabulary
(timbre as operator character, an imaginary channel, a wormhole table) is
borrowed from physics notation. The house split is explicit: LAYER 0
algebra and LAYER 1 mechanism are exactly testable and tested; LAYER 2
performance claims (the metaphors) are priced empirically, and an honest
null is celebrated, not buried.

**Q: Why log2(3) as the default sigma?**
It came from the gifted corpus as "the critical bridge scale"; the house
immediately flagged the original proof as decorative (the Gaussian integral
yields σ√2π for ANY σ — SPEC C3) and made the default a swept parameter.
E-Q2's sweep found sigma is a monotone engineering knob; the fixed-point
lane later made it an exact integer (`DEFAULT_SIGMA_Q = 6807362106`, S =
2^32 units). The default is therefore tradition plus tested-ness, not
magic.

**Q: What are the twin "events" I see in the demo?**
Each is one Abstain cell hearing a different cell through wormhole slot
`d`: `{kind:'twin', x, y, slot, resonance, term}` with
`term = resonance · σ` added to that cell's pressure this tick. The G5
gate pins the exact six-tick schedule for the canonical two-twin fixture,
so you can verify the schedule by hand.

**Q: Can I use this as an embedding method (the name says embeddings)?**
The LAYER 0 vector pass is real and exact: weights are QTHE bytes, inputs
are integers, outputs are `{re, im}` integer pairs with Ground excluded
from both channels. Beyond that, the embedding *performance* claims (C1:
gain-of-function over inter-cell porting; C2: wormhole beats graph
traversal) are pre-registered but not yet discharged — use the algebra
freely, cite the claims as open.

**Q: What runs without the quilt-stone sibling?**
The kernel itself, `crossimpl/py/selftest.py` (36/36), and
`two_reader/selftest.mjs` (54/54) — all verified live in wave 69. The gate
suite `tests/run_tests.mjs` and `crossimpl/conformance.mjs` need stone for
canonical JSON and chain sealing; their sealed runs of record live in
`tests/receipt.json` (chain tip `7e66ea21…`, verified) and
`crossimpl/receipts/crossimpl_chain.jsonl`.

**Q: Where do the DeepSeek/tavern artifacts fit?**
`situations/` holds the cache-gamed guest lanes: stable long system prefix
(the whole SPEC), short varying suffixes, provider-native cache telemetry
sealed per turn (cache_economics_r6…r9, guest_rows_*.jsonl). The guest
generated adversarial situations and derived candidates that the
arithmetic lanes then priced (eq9…eq12 verdicts). Those lanes need
operator API keys and are documented by their receipts, not re-runnable
zero-shot.
