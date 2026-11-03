# CRITIQUE — the current qthe.mjs API, examined

**Seat:** library-craft (G1-2) · **Object of study:** `qthe.mjs` @ main (265
lines; ONBOARDING says "266-line" — trivial drift, noted for honesty)
**Method:** full read of the kernel + `docs/ONBOARDING.md`, then **eight
live probes against the real file** (node v24.22.2). Every claim below
carries its probe output. A receipt without a chain is a rumor.

The three critiques are ranked by (severity × likelihood). All three share a
root cause worth naming once: **the kernel's determinism contract is
enforced in its tests, not in its artifacts** — the library trusts the
caller to hold, in their head, everything the trace forgot.

---

## C1 · Substrate state rides as expandos on a Uint8Array — a serialization cliff

**Severity: CRITICAL** (silent data loss on the standard JS boundary; blocks
the Worker/PostMessage architecture the production plan implies)

**The failure, with receipts.** `makeSubstrate` hangs `w`, `h`, `ticks`,
`__wormholes`, `bytes` (a self-pointer), `__scratch`, `lastEvents` as named
properties on the `Uint8Array` (kernel lines 157–158, R5). Consequences,
verified live:

- `structuredClone(sub)` — the exact semantics of `postMessage`, MessageChannel,
  and every Worker boundary — **succeeds and silently drops all expandos**:

  ```
  V1  structuredClone: w = undefined | ticks = undefined
      | __wormholes = undefined | bytes? true
  V1  tick(cloned) throws: "not a substrate — use makeSubstrate()"
  ```

  Note the failure mode's cruelty: the clone *is* the bytes, so the data
  survived and the metadata didn't; then the error **blames the user for
  doing the right thing** ("use makeSubstrate()" — they did).

- `JSON.stringify(sub)` doesn't corrupt — it **throws**, because `bytes`
  points at the substrate itself:

  ```
  V2  JSON.stringify throws: Converting circular structure to JSON
      --> starting at object with constructor 'Uint8Array'
      --- property 'bytes' closes the circle
  ```

  The gotcha is documented (ONBOARDING: "use traceView(), never
  JSON.stringify") rather than prevented — see F5.

**User story.** The A2UI HUD (ONBOARDING's live mirror) moves its tick loop
into a Worker to keep the main thread free for rendering. The dev posts the
substrate across, ticks it there, posts it back. Every frame, the wormhole
table — the entire mechanism being visualized — evaporates in transit, and
the worker dies on tick #1 with an error that tells them to call a function
they already called. The natural "fix" — posting `traceView()` — loses the
live table write path, and they hand-roll a parallel envelope of `w/h/ticks/
table`, which is exactly the API the kernel should have shipped.

**Migration path.** (1) Ship the `Substrate` handle class (`api-surface.d.ts`):
state in real fields; `snapshot()`/`restore()` are structuredClone-safe and
versioned, with the round-trip law `restore(s.snapshot()).hash() === s.hash()`
as a test. (2) `toJSON()` on the handle makes the *safe* serialization the
*default* path — a documented footgun is a footgun you shipped. (3) Keep the
expando surface alive in `@qthe/core/compat` because `bytes` is a frozen
cross-lane contract (R5/R6: the field lane's `bytePlane()` reads `sub.bytes`)
— the compat layer must synthesize expandos on a real `Uint8Array` view, not
delegate to the handle. (4) Fix the error message: "substrate metadata lost
in transfer/clone — use snapshot()/restore()" instead of blaming `makeSubstrate()`.

---

## C2 · The codec and PRNG alias inputs silently — unreproducible-by-illusion

**Severity: HIGH** (wrong scientific conclusions, no error anywhere; the
determinism library's inputs are not injective)

**The failure, with receipts.** Every input boundary masks or truncates
instead of validating:

- `pack(tau, d)` masks: `pack(7,100) === pack(3,36)` → **228** (V4, live).
  `makeSubstrate` masks the seedFn output `& 0xff` the same way. A `d=64`
  typo is indistinguishable from `d=0` in every subsequent byte of every
  trace — the artifact cannot testify about the intent that produced it.
- `mulberry32(seed)` truncates via `>>> 0`: `mulberry32(2**32+5)()` and
  `mulberry32(5)()` both return `0.6897749109193683` — **V3, live**.
  Distinct seeds, identical streams, zero diagnostics.
- `WormholeTable.write` validates nothing and the `Int32Array` backing coerces
  silently (V6c, live): `write(10, 2.9, 7.4, 3.99)` → `{x:2, y:7,
  resonance:3}`; `write(11, NaN, NaN, 5)` → **retargets the wormhole to
  (0,0)**; `write(12, -5, -5, 2)` → an out-of-grid twin target, accepted.
  A NaN resonance coerces to 0, which the read guard (`resonance !== 0`)
  then rejects — a twin that should fire **silently never exists** (V6b:
  lone Abstain cell, d frozen at 30, `events: []`, no error).
- Downstream, `nextD(30, NaN) === 30` silently (V7) — NaN pressure is a
  no-op, so poisoned inputs don't even crash; they *still* the dynamics.

**User story.** A researcher runs a seed-sweep for a pre-registered arm:
seeds `2^32−1, 2^32, 2^32+1, 2^32+2`. Four "different" runs, one actual run
— the first silently aliases to seed `2^32−1`, the rest to `0, 1, 2`. The
paper reports a "stability plateau near the 32-bit boundary" that is
`>>> 0` modulo arithmetic wearing a lab coat. The stone-v1 chain seals the
runs faithfully — the receipts are honest; the *inputs* were a lie, and
nothing in the kernel could have said so.

**Migration path.** (1) `@qthe/core/codec` is checked: `pack` throws
`E_CODEC_TAU`/`E_CODEC_D` on non-integer/out-of-range; `mulberry32` throws
`E_CODEC_PRNG_SEED` outside `[0, 2^32)`; `vectorPass` rejects ragged rows
(alignment with the Python cross-impl seam F2) and integers beyond ±2^53
(seam F1 made loud — see F7); `WormholeTable.write` throws `E_OP_BOUNDS`
on out-of-grid or non-integer input. (2) The masking/truncating behaviors
survive **byte-identical** in `@qthe/core/compat` — existing scripts keep
running; only new code gets the strict surface. (3) Error `code`s are
append-only strings so research tooling can branch on them.

---

## C3 · Traces are neither replayable, self-describing, nor attributable

**Severity: HIGH** (the determinism guarantee cannot be *checked from the
artifacts*; this is an epistemic gap, not a crash)

**The failure.** `traceView` emits `{w, h, ticks, cells, wormholes,
events}` — and omits everything that would let a stranger re-derive it:

- **No kernel version anywhere.** The kernel exports no version constant at
  all. A trace produced last month cannot be attributed to a build; "same
  seed → byte-identical traces" is unverifiable across time by construction.
- **σ is invisible.** `term = resonance * sigma` — σ is a first-class
  dynamics input (the whole C3 sweep), yet it appears in no trace. Worse,
  the one-tick σ override *leaks into permanence* through the lazy table
  constructor (V5, live: `tick(sub,{sigma:5})` then `tick(sub,{})` runs the
  second tick at `table.sigma = 5`, not `DEFAULT_SIGMA = 1.584962500721156`,
  while the doc comment promises "for this tick"). An input that changes
  the trace but appears nowhere in it is the precise opposite of a
  determinism receipt. (Promoted to finding F1.)
- **Events are last-tick-only**, stored on the substrate and clobbered every
  tick (`cells.lastEvents`). The G5 twin schedule — a *pinned mechanism
  claim* — cannot be recovered from artifacts unless the caller called
  `traceView()` after every single tick. Nobody does.
- **No op record.** Whatever the caller injected between ticks (τ flips,
  manual `whWrite`s) exists only in their closure; the trace starts each
  tick from a state the record can't reconstruct.

**User story.** Six months from now, a reviewer asks whether the sealed
C3-sweep receipts still hold on the current kernel. The traces contain the
end states — but not σ schedules, not injections, not the kernel version.
The only "verification" is re-running the original scripts, which have
since evolved. The receipts are unfalsifiable, which in this house's
vocabulary means they are decoration.

**Migration path.** This critique *is* `OLOG-SPEC.md`: the op-log (ten ops,
tick-boundary interleave), the version-stamped digest (`qth1:…`, stamps
inside the input), first-class per-tick events (`eventsByTick` from
`replayTrace`), the canary corpus, and the two-class upgrade-honesty rule
(trace-compatible, or bump a stamp and re-hash the world loudly — never
silent divergence). `Substrate.trace()` supersedes `traceView()`; the
latter survives in compat.

---

## Further findings (real, verified, below the top three)

- **F1 · σ leak-through (bug).** `tick(sub, {sigma:X})` on a substrate whose
  table doesn't exist yet creates it with constructor σ = X and persists it;
  all later option-less ticks run at σ = X. Doc comment says "for this
  tick". Receipt: V5. Fix in core: σ is substrate state, changed only by a
  journaled `setOptions` op; per-tick `TickOptions.sigma` never persists.
- **F2 · tick mutates AND returns (R6, frozen).** `const b = tick(a)` gives
  `b === a`: two names, one object — the return shape advertises a
  functional API the function doesn't provide. Keep in compat (it's a
  cross-lane frozen contract); core's `tick()` returns the tick's *events*.
- **F3 · `lastEvents` is a single overwritten slot** — folded into C3;
  listed here because it also makes any "events over time" statistic
  silently wrong rather than absent.
- **F4 · seedFn doc drift.** Kernel line 146 comments `seedFn(i, x, y)`;
  the code calls `seedFn(x, y, i)` (V8: observed `[1,1,3]`); R6 says
  `(x, y, i)`. A stranger implementing against the comment writes a
  silently transposed seed. One-line fix upstream; core pins the order in
  types.
- **F5 · The JSON.stringify footgun is documented, not prevented.** A
  `toJSON()` expando would have made the safe path the default. Core's
  handle ships one; this is C1's migration in miniature.
- **F6 · Misleading error text.** "not a substrate — use makeSubstrate()"
  fires *after legitimate transfers* (V1). Errors should name the actual
  failure mode (metadata lost in clone/transfer) and the actual remedy
  (snapshot/restore).
- **F7 · The ±2^53 horizon is silent on the JS side.** Inputs beyond 2^53
  round *before* LAYER 0 sees them (cross-impl seam F1/F3: Python raises,
  JS masks). For a byte-identical cross-language claim, the seam should be
  loud on both sides; `vectorPass` in core throws `E_CODEC_HORIZON`.

## Notes on the P1 production plan (flagged as instructed)

1. **"hash(): version-stamped (kernel version + spec version)"** — agreed,
   with one correction: the stamp must **not** be the npm package semver,
   or every patch release invalidates every published hash. OLOG-SPEC §8
   defines digest stamps as an independent behavior track with a two-class
   release rule.
2. **"traces record seed + tick count + op-log"** — implemented with a
   deliberate collapse: the seed *is* the ops at `at:0` (single normative
   source; two records of one fact drift). Flagged so the Orchestrator can
   veto if the seed field was load-bearing elsewhere.
3. **"Kill the expando pattern"** — correct, but not by deletion alone:
   `sub.bytes` is a frozen external contract (R5/R6, field lane). Compat
   must synthesize expandos on a real `Uint8Array`; pure delegation breaks
   frozen callers silently — the exact failure mode this plan exists to
   eliminate.
4. **"inject() takes SERIALIZABLE op data"** — agreed; the honest
   consequence is that arbitrary seedFns cannot be journaled. Core
   byte-captures them once (`setBytes` at `at:0`): replay stays exact,
   seed compactness is traded away, and the docs say so.

## Self-assessment (honest, per house law)

- **What I did:** read the kernel end-to-end; verified every critique claim
  against the running file (V1–V8 above, node v24); computed a fully
  reproducible hash canary from the real kernel (OLOG-SPEC §7.3, Appendix
  A) — the numbers are machine-generated, not hand-copied; and compiled
  `api-surface.d.ts` under `tsc 5.6.3 --strict --noEmit` against two usage
  files (one minimal, one exercising codec, lifecycle, ops, snapshot,
  trace/replay, errors, and the compat layer) — exit 0, no errors.
- **What I did not do:** run the
  G0–G6 gate suite (requires the quilt-stone sibling, absent here);
  benchmark journaling overhead on `inject()` (a `setBytes` op at scale is
  an O(w·h) array in the journal — acceptable for research scale, worth
  measuring before 1.0); the compat layer's exact aliasing of lazy-table
  semantics is specified but not yet implemented or tested.
- **Where I'm least sure:** the `opsHash`-inside-the-state-digest choice
  (binds provenance to state, but means two identical states from different
  logs hash differently — defensible, not obvious); and whether `setOptions`
  should also record per-tick overrides that were passed to `tick(opts)`
  (spec §4 rule 5 currently leans on engine auto-journaling, which deserves
  its own test).
