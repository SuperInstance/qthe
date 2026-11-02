# qthe

An 8-bit deterministic cellular substrate — one byte per cell, one tick rule, one non-local channel.

Each cell is a single byte: a 2-bit **timbre** (Ground, Attract, Repel,
Abstain) plus a 6-bit **amplitude** (0–63). Each tick is a synchronous
Moore-8 update on a torus. The only channel that skips the neighborhood is
a 64-slot **wormhole table**, through which equal-amplitude Abstain cells
couple at any distance. Same seed, same bytes — on every machine, in
JavaScript, C, Python, and Rust.

**Who it's for**

- **Creative coders** — same seed, same art, forever: a canvas that
  replays pixel-for-pixel across machines and years.
- **Game / simulation engineers** — lockstep-ready state: hash the world,
  ship the hash, replay by re-ticking from the seed.
- **Embedded engineers** — one byte per cell, no floats required
  (fixed-point plane), no heap, no libm: a 64×64 world in 4,096 bytes.

**Install** (this is the real method today)

```bash
git clone https://github.com/SuperInstance/qthe.git
cd qthe
node --version   # >= 18
```

The kernel is one zero-dependency ES module, `qthe.mjs`. An npm package is
**in progress**; until it exists, the clone is the install, and nothing in
these docs assumes otherwise.

**First success** — save as `hello.mjs` next to `qthe.mjs`, run `node hello.mjs`:

```js
import { pack, unpack, makeSubstrate, tick, traceView, mulberry32 } from './qthe.mjs';

// The byte round-trips: 2-bit timbre + 6-bit amplitude.
let ok = 0;
for (let c = 0; c < 256; c++) {
  const { tau, d } = unpack(c);
  if (pack(tau, d) === c) ok++;
}

// A seeded world. Same seed -> same bytes, every machine, forever.
const rand = mulberry32(42);
const sub = makeSubstrate(64, 64, (x, y) =>
  pack((rand() * 4) | 0, (rand() * 64) | 0));

// Ten ticks, then serialize state the supported way.
for (let t = 0; t < 10; t++) tick(sub, {});
const view = traceView(sub);

console.log(`bijection ${ok}/256, ticks ${view.ticks}, twinEvents ${sub.lastEvents.length}`);
```

```
bijection 256/256, ticks 10, twinEvents 979
```

Run it twice; the output is identical. That property is the product.

---

## What it looks like in service

Three engineering patterns, each with its boundary stated where you'd meet
it — these are operating specs, not caveats discovered later.

### 1. Deterministic world-state hashing

Seed once, and the substrate's future is fixed. Hash the byte plane and
ship the hash as your state witness — for replays, checkpoints, or
proving two machines hold the same world.

```js
import { createHash } from 'node:crypto';
import { makeSubstrate, tick, pack, mulberry32 } from './qthe.mjs';

const rand = mulberry32(42);
const sub = makeSubstrate(64, 64, (x, y) =>
  pack((rand() * 4) | 0, (rand() * 64) | 0));
for (let t = 0; t < 100; t++) tick(sub, {});

console.log(createHash('sha256').update(Buffer.from(sub)).digest('hex'));
// b49b9a1373d2e1280bb9d489d4ea12bd9eeae30b11cf950b6fb5a27c30af6042
```

That hash is not an example value — it is the value for seed 42, 100
ticks, on any machine running the JS kernel *(sealed record)*. Receipts,
itemized: the JS reference and an independent spec-only rebuild replay a
12-case corpus 12/12 byte-identical; the Rust and C99 ports are byte-exact
on their own sealed batteries (13/13 and 19 cases respectively, plus a
24-case Guild corpus for C99); the Python port covers the LAYER-0 algebra
exactly. A single four-language corpus replay is the next exit criterion
(see the state table). **Spec:** determinism covers seeded construction and the tick
operator. Journal-and-replay of arbitrary mid-run mutations (op-log
determinism) is not yet measured — see the state table. Serialize with
`traceView()`, never `JSON.stringify` (the substrate carries live state
on its array). Keep seeds under 2³² (`mulberry32` wraps silently above
it).

### 2. Non-local pairing within writer budgets

Two Abstain cells at the same amplitude couple through the wormhole table
at any distance — no message bus, no routing, no per-pair state. Plant
them on an inert plane and count the resonances:

```js
import { makeSubstrate, tick, pack, TAU } from './qthe.mjs';

const W = 64;
const sub = makeSubstrate(64, 64, (x, y) => pack(TAU.GROUND, 0)); // inert plane
sub[10 * W + 10] = pack(TAU.ABSTAIN, 20);   // two Abstain cells,
sub[50 * W + 50] = pack(TAU.ABSTAIN, 20);   // same amplitude, far apart

let twinEvents = 0;
for (let t = 0; t < 10; t++) {
  tick(sub, {});
  twinEvents += sub.lastEvents.length; // {kind:'twin', x, y, slot, resonance, term}
}
console.log('twin events over 10 ticks:', twinEvents);   // -> 13
```

**Spec:** the table holds 64 slots keyed by amplitude; same-slot writes
within one tick resolve last-writer-wins; under ~256 same-tick Abstain
writers the table saturates. Delivery survives saturation *(sealed
record: 80/80 pairs delivered at 256 writers)*; sender attribution does
not. Design for a few writers per slot per tick, and read delivery off
the resonance events, not off who wrote.

### 3. Byte-dense planes

```text
bit:   7  6  5  4  3  2  1  0
     [ τ ][        d (0–63)    ]
```

Operator and operand travel in one byte, so one memory read per neighbor
yields both. A 64×64 world is 4,096 bytes standing; the measured gain
over a 2-byte split encoding (timbre plane + amplitude plane) is 47.40%
less byte traffic at identical dynamics *(sealed record: 331,776 vs
630,784 bytes-to-task; dynamics tracked byte-identically, 20/20 trials)*.
**Spec:** that gain is against a *portable* (uncached) split encoding; a
port that caches the timbre plane resident reaches per-tick parity at
4,096 standing bytes. The C99 port is one file, builds with one line,
and is byte-exact against this kernel *(sealed record)*:

```bash
cc -O2 -std=c99 -c qthe_core.c   # no libm, no heap; verified -Wall -Wextra clean
```

For microcontroller work use the fixed-point plane (no floats; runtime
0.975× of the float plane on the same task class).

---

## State of the substrate

*"Priced" = measured by a pre-registered experiment with a sealed,
re-runnable record.* This table is a summary; the authoritative version is
regenerated by CI and lives with the evidence:

| Status | Property | The number |
|---|---|---|
| Priced & live | Tick determinism | JS + spec-only rebuilder 12/12 corpus traces; Rust 13/13; C99 19-case battery + 24-case Guild corpus; Python LAYER-0 exact |
| Priced & live | Byte-dense encoding vs uncached 2-byte split | 47.40% less traffic |
| Priced & live | Non-local delivery, wormhole table on vs off | 8/8 vs 0/20 pairs |
| Priced & live | Fixed-point plane runtime | 0.975× of float |
| Priced & partial | Flood-capped arbitration | starvation 0.44→0.32, p99 +33% (845 vs 633 ms) |
| Priced & partial | Delivery under saturation | 80/80 at 256 writers; attribution saturates |
| Priced & partial | Spatial memory (documented behavior) | persists 512+ ticks |
| Not priced | Op-log determinism | not yet measured |
| Not priced | npm package / MCU benchmarks | in progress / not yet run |

**Why trust this? → [README-RESEARCH.md](README-RESEARCH.md)** — the
scoreboard with every claim, every chain tip, and the honest nulls.

Some early claims — emergent intelligence, self-repair, phase transitions
— were tested and falsified. The records are kept; nothing on this page
rests on them.

---

## Where to go

- **Docs** — [INSTALL](docs/INSTALL.md) · per-persona quickstarts and
  recipes *(proposed)*: `docs/quickstart/`, `docs/guides/` · API reference,
  generated from types *(proposed)*: `docs/api/`
- **Examples gallery** — `examples/` *(proposed)*; today, see the live
  mirror: `python3 -m http.server` and open `index.html` (pixel = cell)
- **Research record, scoreboard, verification** —
  [README-RESEARCH.md](README-RESEARCH.md)
- **License** — [LICENSE](LICENSE)

Agents: `llms.txt` and `qthe.manifest.json` *(proposed)* at the repo root
carry the machine-readable version of this page, boundaries included.
