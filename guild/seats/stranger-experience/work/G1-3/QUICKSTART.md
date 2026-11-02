# QUICKSTART — qthe for creative coders (10 minutes)

> Written for **Pixel**: you use p5.js / Processing / exhibitionist
> JavaScript, and you want two things — a canvas that looks alive, and *same
> seed, same art, forever*. Both are contract-level properties here, not
> aspirations: the kernel contains no `Math.random` at all, and this guide
> ends with you proving reproducibility to yourself with a hash.
>
> **Every command below was executed against the real repo while writing
> this document; quoted outputs are real.** Where tooling does not exist yet
> it is tagged **(proposed)** with a working alternative. No credentials, no
> API keys, no package installs required.

---

## Minute 0 — Get the repo (no npm package yet)

```bash
git clone https://github.com/SuperInstance/qthe.git
cd qthe
```

That's the whole install: the reference kernel `qthe.mjs` is 266 lines of
zero-dependency ES-module JavaScript. Nothing else is needed for this guide.

> **Note:** `npm install @qthe/core` **(proposed — does not exist yet)**.
> Until it does, the git clone above *is* the install, and the import in
> every example below is the relative `./qthe.mjs` (or
> `./qthe-core/kernel/qthe.mjs` for the extracted standalone copy).

Prereqs: `git`, Node ≥ 18, `python3` (only to serve the canvas in Minute 5).

---

## Minute 1 — Smoke test (the real one, from the project's ONBOARDING)

```bash
node -e "
import('./qthe.mjs').then(q => {
  let ok=0; for (let c=0;c<256;c++){const {tau,d}=q.unpack(c); if(q.pack(tau,d)===c) ok++;}
  const sub = q.makeSubstrate(8,8,(x,y)=>q.pack((x+y)&3,(x*5+y*3)&63));
  for(let t=0;t<10;t++) q.tick(sub,{});
  console.log('bijection', ok+'/256', 'ticks', sub.ticks, 'twinEvents', sub.lastEvents.length);
});"
```

Real output (verified live on Node 24):

```
bijection 256/256 ticks 10 twinEvents 15
```

What that means for you: every one of the 256 possible bytes decodes to a
2-bit timbre + 6-bit amplitude and re-encodes exactly (`bijection 256/256`),
and after 10 ticks of an 8×8 world, 15 *twin resonance events* fired through
the wormhole table. You now have a working kernel.

---

## Minute 2 — Understand the byte (30 seconds of theory, then never again)

One cell = one byte:

```
bit:    7  6  5 4 3 2 1 0
      [τ: 2][    d: 6    ]
```

- **τ (timbre)** — the cell's *character*: 0 Ground (inert), 1 Attract
  (pulls neighbors up), 2 Repel (pushes neighbors down), 3 Abstain (the
  weird one — see below).
- **d (amplitude)** — the cell's *energy*, 0…63.

Each tick, every cell looks at its 8 neighbors (the board wraps around at
the edges) and `d` moves toward 63 or toward 0 depending on the net pull of
its neighbors. τ never changes by itself — only your code can change it.

The weird one: **Abstain (τ=3) cells don't do local physics.** They write
their position into a shared **64-slot wormhole table**, keyed by their own
`d` value — and they *read* it too. Two far-apart Abstain cells with the
same `d` "resonate": each feels the other's strength, at any distance. That
is the only non-local channel in the whole system, and it is what makes
distant parts of your canvas coordinate without any message passing.

---

## Minutes 3–5 — Your first deterministic pattern, on a canvas

Save this as `sketch.html` **in the repo root** (next to `qthe.mjs`),
then serve it:

```bash
python3 -m http.server 8000
# open http://localhost:8000/sketch.html
```

(Browsers refuse to load ES modules from `file://`, so the little local
server is required — that's a browser rule, not a qthe one.)

```html
<!doctype html>
<html>
<head><meta charset="utf-8"><title>qthe sketch — same seed, same art</title>
<style>body{margin:0;background:#111;display:grid;place-items:center;height:100vh}</style>
</head>
<body>
<canvas id="c" width="960" height="960"></canvas>
<script type="module">
import * as q from './qthe.mjs';

const W = 96, H = 96, SCALE = 10;          // 96x96 cells, drawn 10x
const rand = q.mulberry32(20260206);       // THE seed. Change it -> new art.

// Deterministic seeding: one PRNG, and makeSubstrate visits cells in a
// fixed row-major order, so the same seed always builds the same world.
const sub = q.makeSubstrate(W, H, (x, y) =>
  q.pack((rand() * 4) | 0, (rand() * 64) | 0));   // random timbre + energy

// One color per timbre; brightness = energy.
const HUES = { 0: [30, 30, 40], 1: [255, 120, 40], 2: [40, 170, 255], 3: [190, 60, 255] };
const cv = document.getElementById('c'), ctx = cv.getContext('2d');

function draw() {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { tau, d } = q.unpack(sub[y * W + x]);
      const [r, g, b] = HUES[tau];
      const m = d / 63;
      ctx.fillStyle = `rgb(${(r * m) | 0},${(g * m) | 0},${(b * m) | 0})`;
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    }
  }
}

setInterval(() => { q.tick(sub, {}); draw(); }, 1000 / 30);
</script>
</body>
</html>
```

You should see a living mosaic: orange Attract regions and blue Repel
regions grinding against each other, dark Ground as negative space, and
purple Abstain cells flaring as wormhole twins find each other (after ~60
frames on this seed there are thousands of twin events per tick — the purple
really is the wormhole table working).

Try these, one at a time:

- **Change the seed** (`20260206` → anything): a different world, equally
  reproducible.
- **Reload the page**: same seed, identical art, pixel for pixel.
- **Plant twins by hand** for a cleaner wormhole story (optional):

```js
// after makeSubstrate, before the loop — two distant Abstain cells, same d:
sub[10 * W + 10] = q.pack(q.TAU.ABSTAIN, 20);
sub[80 * W + 80] = q.pack(q.TAU.ABSTAIN, 20);
```

> **(proposed)** `qthe/p5.js` wrapper — a `loadPixels()` bridge so this
> sketch becomes a p5 `draw()` loop. Not needed today; the raw-canvas
> version above is the whole API surface you need.

---

## Minute 6 — Look at the reference mirror (optional but pretty)

```bash
# from the repo root, with the server already running:
# open http://localhost:8000/          (index.html — the live mirror)
# open http://localhost:8000/public-demo.html   (one-file portable version)
```

The HUD shows the **live sha256 of the byte plane** — the same hash you'll
compute yourself in the next minute. Try the *Seed: twin worms* preset,
then toggle *wormholes OFF* and watch the two purple cells stop resonating:
that's the wormhole table being the only non-local channel, demonstrated
rather than claimed.

---

## Minutes 7–9 — Prove it: run twice, compare the hash

Save this as `determinism.mjs` in the repo root:

```js
// determinism.mjs — run the SAME seeded world twice, in two separate
// processes, and prove byte-identity with a hash.
import { createHash } from 'node:crypto';
import { pack, unpack, makeSubstrate, tick, mulberry32 } from './qthe.mjs';

// 1. The LAYER 0 bijection (from ONBOARDING.md): every byte round-trips.
let ok = 0;
for (let c = 0; c < 256; c++) {
  const { tau, d } = unpack(c);
  if (pack(tau, d) === c) ok++;
}

// 2. A seeded world: one PRNG instance, fixed row-major iteration order
//    (makeSubstrate calls seedFn(x, y, i) in a fixed order) => same bytes.
const rand = mulberry32(42);
const sub = makeSubstrate(64, 64, (x, y, i) => pack((rand() * 4) | 0, (rand() * 64) | 0));

// 3. Advance it.
for (let t = 0; t < 100; t++) tick(sub, {});

// 4. Hash the byte plane. Buffer.from(sub) copies ONLY the w*h cell bytes —
//    never JSON.stringify the substrate (it carries live state on the array).
const sha = createHash('sha256').update(Buffer.from(sub)).digest('hex');
console.log(`bijection ${ok}/256  ticks ${sub.ticks}  twinEvents ${sub.lastEvents.length}  sha256 ${sha}`);
```

Run it **twice, in two separate processes**, and compare:

```bash
node determinism.mjs > run1.txt
node determinism.mjs > run2.txt
cat run1.txt run2.txt
cmp run1.txt run2.txt && echo "=> IDENTICAL ACROSS PROCESSES"
```

Real output (verified live — your hashes will match *these exact values*):

```
bijection 256/256  ticks 100  twinEvents 978  sha256 b49b9a1373d2e1280bb9d489d4ea12bd9eeae30b11cf950b6fb5a27c30af6042
bijection 256/256  ticks 100  twinEvents 978  sha256 b49b9a1373d2e1280bb9d489d4ea12bd9eeae30b11cf950b6fb5a27c30af6042
=> IDENTICAL ACROSS PROCESSES
```

One hundred ticks, 4,096 cells, 978 wormhole events — and the final byte
plane hashes to the exact same 64 hex characters in every process, on every
machine, forever. **Same seed, same art, forever: verified, not promised.**
If a stranger's rerun ever differs, the project's own law says that is a
bug in qthe, not in your setup.

---

## Minute 10 — Where to go next

- `docs/CREATIVE-PRACTICE.md` — how this repo grounds creative work in real
  measured material (short, and it explains the culture).
- `qthe.mjs` — read the whole kernel. It's 266 lines, heavily commented, and
  the comments are the real spec.
- `scripts/repl.mjs` — drive a substrate by hand:
  `echo -e "new 64 64 twins\nstep 10\nstats\nhash\nquit" | node scripts/repl.mjs`
- `demos/agent-coordination.mjs` — two agents signaling *through* the
  wormhole table with no message bus, with the honest OFF arm.
- `crossimpl/c/` — the byte-exact C99 port, when you want your sketch to
  run on a microcontroller.

### What to expect (honest edges)

- No npm package yet — clone is the install (see Minute 0). **(proposed)**
- No p5.js wrapper yet. **(proposed)**
- The gate suite (`node tests/run_tests.mjs`) needs a sibling repo,
  `quilt-stone`, cloned *beside* qthe — it refuses loudly without it (by
  design). This quickstart never requires it.
- τ never changes inside `tick()` — only your code changes timbre. If you
  want evolving characters, write an injector between ticks; that's what the
  "injector" pattern means here.
- Don't `JSON.stringify` a substrate; use `traceView()` when you need a
  serializable snapshot.
