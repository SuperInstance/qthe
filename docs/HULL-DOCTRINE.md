# qthe — The Hull Doctrine: what survives a model swap or shell change

> The question: a qthe substrate never lives alone. It lives inside a
> kernel file, a runtime (Node, a browser tab, a Python port), a repo, a
> machine, sometimes a model driving the whole thing. When any of that
> surrounding skeleton is swapped — new runtime, new language, new host
> model, repo moved across machines or through a package manager — what
> must be carried for the substrate to still be THE SAME substrate? The
> hull is the state that must survive the swap: the soft tissue. Everything
> else — runtimes, doubles, mtimes, caches, model identities — is skeleton,
> and skeleton is replaceable only if the hull is carried exactly. This
> document defines the hull from the kernel itself (`qthe.mjs`
> makeSubstrate/tick/traceView), states what transfers for free and what
> never transfers, and gives the numbered swap protocol. Docs-layer
> artifact, Task ORCH-A (roadmap phases 26 and 31). Companion to
> `docs/REPRESENTATION-LAW.md` (which plane your σ lives on) and
> `docs/ENGINEERING-NOTES.md` (architecture and failure modes).

## What the state IS

Derived from the kernel, not from intuition. `makeSubstrate` (qthe.mjs)
allocates a `Uint8Array(w*h)` of packed cells, row-major, each byte
`τ<<6 | d`, then hangs exactly these expandos on it (R5): `w`, `h`,
`ticks = 0`, `__wormholes = undefined`, and `bytes = cells` (the frozen
field-lane `bytePlane()` readback contract, R6). `tick` mutates the plane in
place, increments `ticks` once, and persists `__wormholes` (the lazy
`WormholeTable`) plus `lastEvents`. The durable state is therefore exactly
four things:

1. **The byte plane** — w·h packed cells, row-major; the only carrier of
   cell substance.
2. **The grid dims** — `w`, `h`, positive integers; they define the
   toroidal Moore-8 geometry (R1) and the row-major order that makes
   wormhole reads deterministic.
3. **The tick counter** — `ticks`; it positions the substrate on its
   trajectory.
4. **The wormhole table** — 64 slots, each empty or `{x, y, resonance}`
   (Int32Array sx/sy/sr + occupied flags; `WormholeTable`, qthe.mjs). This
   is the only state that lives OUTSIDE the byte plane, which is exactly
   why it is the easiest thing to lose in a swap.

Nothing else is state, and the non-state things are traps:

- `__scratch` (the pre-tick snapshot buffer) is overwritten at the top of
  every tick — it carries nothing across ticks and must never be
  serialized.
- `lastEvents` is per-tick telemetry, re-derived by the next tick; it rides
  in `traceView` for the HUD and receipts, not for reconstruction.
- `totalWrites` on the table is a cumulative diagnostic (G5 seals
  totalWrites = 12); it never enters `traceView` and is re-derivable by
  replay.
- `seedFn` is one way to MAKE a plane; determinism keys on the plane
  itself — SPEC item 6: "same initial substrate + same tick count →
  byte-identical trace, always." Carry the bytes, not the seed.
- σ (or σ_q) and the wormholes flag are run PARAMETERS, not derived state:
  `traceView` deliberately records wormhole STATE, not the flag (R7 — an
  empty table is trace-equivalent to wormholes disabled; found by gate G6
  run 1 when the flag leaked into traces). A swap must carry them as
  declared provenance or the far side cannot continue the dynamics.

**Serialization law (R5):** never `JSON.stringify` the substrate — it
serializes the expandos, breaks trace equality, and produces a view no
other kernel can rebuild. This bit the G6 run 1 and is receipted
(`docs/ENGINEERING-NOTES.md` failure modes). The canonical view is
`traceView(cells)`: `{ w, h, ticks, cells: Array.from(cells), wormholes:
table.snapshot() | null, events }` — cells copied by value, expandos
excluded by construction. Both kernels export the same shape
(`fixedpoint/qthe_fixed.mjs` carries R1–R7 verbatim; its `traceView` is the
same view over its own table class — σ_q never enters it).

## What transfers for free

**Byte planes are shell-independent.** A packed byte means the same thing
in every runtime, and the update law consumes only integer arithmetic on
it. The proof is the crossimpl lane: an independent Python re-derivation
of LAYER 0 from `SPEC.md` ALONE — every SPEC-silent choice frozen in
`AMBIGUITY.md` (A1–A10) before the kernel was opened — reached
**10,272/10,272 byte-exact** agreement with the JS reference kernel,
enforced at the SERIALIZATION level: the Python worker's stone-v1 canonical
JSON and the JS side's `canonicalJSON` produced **byte-identical files**
(sha256 `d242f96d…` for both `py_results.json` and `js_results.json`),
built by two independent serializers on two sides of a process boundary
(`crossimpl/findings.md`). A full harness re-run reproduced every artifact
byte-identical (4/4 sha256 equal). Negative controls NC1/NC2 prove the
comparison catches a lying implementation, not merely a corrupted
transport.

**`traceView` JSON is the portable format.** It is what G3/G6 hash, what
receipts seal, and what the A2UI live mirror displays (`index.html` +
`demo/a2ui.mjs`: HUD tick + trace sha256, pixel = cell — a second shell,
the browser, consuming the same state without altering it; demo smoke ran
30 s live with zero console errors per `docs/ENGINEERING-NOTES.md`).

**Plane hashes are the integrity check.** The canonical digest is
`experiments/_harness.mjs`'s `planeHash(sub, t, bytePlaneFn)`:

```
planeHash = sha256( "<w>x<h>@t=<t>:<hex>" )
```

where `<hex>` is the lowercase zero-padded hex of every byte of the byte
plane (dims + tick + bytes folded into one digest — a hash that cannot be
confused across shapes or times). The imaginary plane is NEVER hashed —
floats ride in outputs as strings; only exact integers stay numbers
(`_harness.mjs` `q(v)`). The byte readback goes through
`_adapter.bytePlane` (real kernel: the substrate itself, per R6's
`sub.bytes`; ports: `sub.bytes` / `sub.buffer` / a cells array — the
adapter IS the swap point, and it throws ADAPT rather than guess).

## What does NOT transfer

- **Wall-clock anything.** No timestamp enters the substrate. None may
  enter a seal that claims to bind substrate identity — a receipt that
  needs "when" to mean anything physical has already left the hull.
- **mtime-based seals.** The wave-52 lesson, on the record in three
  places: `npm install` normalizes extracted mtimes to the
  1985-10-26T08:15:00.000Z epoch (**499162500000 ms**), so distribution
  consumers cannot carry the sealed local mtime
  (`two_reader/reader.mjs` lines 79–96; `two_reader/registration.json`
  `seal.mtime_witness_flag`, "receipted wave 52 codespace attempts 5-7";
  `scripts/reseal-registration.mjs`, the wave-52 registered seal
  evolution). The fleet's answer (fleet law A4): strict mtime binding
  stays the DEFAULT, but under an explicit `--mtime-witness` flag the
  mtime is demoted to a local WITNESS — a mismatch is receipted and the
  walk continues — because **bytes always bind** (masked-self-sha +
  per-row pins). Related, wave 50-b: a cross-language mtime ns-precision
  pitfall was receipted in the journal — seals bind sha+size+mtime-to-
  second (`docs/KNOWLEDGE-MAP.md`, journal line ~677). The hull doctrine
  generalizes both: identity rides on content digests, never on filesystem
  metadata.
- **Cache state.** The tavern's cache economics (long stable system
  prefix, short varying suffixes) is an optimization of the surrounding
  model call, not substrate state. Sealed as data + provenance, never a
  live dependency (`docs/ENGINEERING-NOTES.md`, receipts/credentials
  model).
- **Guest/tavern context.** Model names, token counts, cache hit/miss
  telemetry are provenance for claims ABOUT runs, not physics. Tavern
  lanes are operator-key-gated and not re-runnable zero-shot; their
  absence has blast radius: none on the kernel claims — the sealed guest
  receipts remain the provenance trail. When the surrounding model is
  swapped, the substrate does not notice; only the receipts' provenance
  does.

## The swap protocol

1. **FREEZE.** At tick T, compute and record `planeHash(sub, T)` — sha256
   over `"WxH@t=T:hex"` — together with the declared run parameters:
   plane (float/fixed), σ arm (or σ_q), wormholes flag (R7 means the flag
   is not in the view; carry it or the far side cannot continue the
   dynamics — `wormholes:false` arms never touch the table, G6), and the
   kernel lineage (file sha; downstream pins reference it, and a moved
   kernel is detected by comparing shas, not by silent passage —
   `docs/ENGINEERING-NOTES.md`).
2. **SERIALIZE.** `canonicalJSON(traceView(sub))`. Never `JSON.stringify`
   the substrate (R5; the G6 run 1 receipt). Canonical form is not a
   style preference: byte-exactness is enforced at the serialization
   level, and two encoders that disagree on canonical form will fail step
   5 while both being "correct" — the crossimpl discipline exists to
   prevent exactly that.
3. **CARRY.** The serialized view + the frozen hash + the parameter
   declaration + the kernel sha. Nothing else is load-bearing; everything
   else is skeleton.
4. **REBUILD.** On the far side, reconstruct the substrate from the
   carried view: `Uint8Array` from the cells array, expandos restored per
   R6 (or the port's equivalent `_adapter.bytePlane` readback path), ticks
   restored, and the wormhole table rebuilt from the snapshot — 64 slots,
   each `{slot, x, y, resonance}` or empty.
5. **VERIFY BY RE-TICKING.** Run N further ticks on the far side and
   compare `planeHash` at T+N against the near side's T+N hash.
   **Byte-identical = hull preserved.** Determinism makes this an equality
   test, not a statistical one: same substrate + same tick count →
   byte-identical trace, always (SPEC item 6; G3 1000/1000 per-tick hash
   equality; F_C 20/20 fresh-build reruns of the fixed plane at hash
   `e4f1d36a…`, each rebuilt from scratch; the crossimpl harness re-run,
   4/4 artifacts byte-identical).
6. **ANY DIFFERENCE = the swap changed physics. Autopsy required.**
   Localize the first divergent tick (the P-B1 pattern: per (arm, seed,
   tick) first-divergence), classify the cause — kernel edit, σ
   representation change, serialization seam, carrier bound — and receipt
   it beside the body. Keep the comparison live with negative controls
   (crossimpl NC1/NC2: a tampered value, a tampered character, a lying
   worker — all detected and localized). A swap that cannot pass step 5
   was never a swap; it was an unregistered experiment.

## Relationship to the determinism law

The doctrine is determinism extended across shells. The determinism law
(SPEC item 6, "determinism or it didn't happen") is an intra-shell
contract: within one kernel and runtime, same state + same tick count →
same bytes, sealed per-tick (G3) and per-rerun (F_C 20/20). The hull
doctrine takes the same contract and moves the word "same" across a
boundary: "same state" is established by carried bytes and a frozen plane
hash rather than by shared memory, and the re-tick verification of the
swap protocol is F_C's fresh-build rerun with a process (or language, or
machine) boundary in the middle. Every element of the protocol is a
determinism artifact wearing interchange clothes: `planeHash` is the G3
per-tick hash generalized to a portable format; canonical serialization is
the crossimpl two-serializer result; the freeze-then-verify shape is the
stone-v1 discipline (content binds, chain verifies) applied to substrate
state. Conversely, determinism without a hull doctrine is trapped: a
kernel whose state cannot cross shells can only ever be verified where it
was born.

## What breaks it

1. **Kernel edits — above all, τ mutation.** Timbre is frozen inside
   `tick` (R3/R4: "tau NEVER changes here — timbre is written only by
   injectors"), which is what keeps every paired arm and the whole LAYER 2
   scoreboard clean. A repair term or τ-mutation rule would be a new claim
   under the same law, not a rescue of an old one (`docs/CLAIM-VERDICTS.md`,
   C5 boundary). Any kernel edit also re-prices every downstream sha pin —
   old receipts point at a lineage that is no longer HEAD, detected by
   comparing shas, never by silent passage.
2. **A different σ representation without re-pricing.** The float-vs-fixed
   divergence families are measured, not hypothetical: σ = 1.6 diverges on
   7/8 seeds (first ticks 3–82), σ = 0.7 on 7/8 (first ticks 1–54), σ = 2/3
   on 8/8 (ticks 3–17), plus the cooker's tick-1 one-S-unit split (float
   term 2, fixed term 8589934593; B.d 7 vs 8) — while 0.5, 1, log2(3), 2,
   4 and default stay trace-identical over 8 seeds × 400 ticks
   (`fixedpoint/findings.md`, `fixedpoint/outputs/f_b_results.json`). A
   state serialized on one plane and continued on the other MUST re-run
   the F_B comparison families before claiming hull preservation; see
   `docs/REPRESENTATION-LAW.md`. Cross-language swaps compound the seam:
   JS's ±2^53 input horizon rounds the literal before LAYER 0 sees it
   (crossimpl F1: Python computes 63·(2^53+1) = 567453553048682559 where
   JS computes 63·2^53 = 567453553048682496), ragged rows are NaN poison
   in JS and a raise in Python (F2), and out-of-domain inputs are masked
   in JS, raised in Python (F3) — all outside the specified surface, all
   receipted, all reasons the verification step is a re-tick and not a
   re-read.
3. **Non-canonical serialization.** `JSON.stringify` on the substrate
   (expandos leak; the G6 run 1 / R7 receipt). Hashing floats (the
   imaginary plane rides as strings and is never hashed; exact integers
   stay numbers). Two encoders disagreeing on canonical form (the
   crossimpl byte-exactness-at-serialization discipline exists because
   this failure is real). And the quiet one: dropping the wormhole table
   from the carry — Abstain cells then find empty slots and re-seed them,
   any would-be twin hit is lost, and the plane can diverge at the first
   post-swap tick. It is easy to miss precisely because the loss is
   invisible while no Abstain cell fires (G6-S2: with zero Abstain cells,
   wormhole ON and OFF arms are byte-identical over 200 ticks; R7: an
   empty table is trace-equivalent to disabled). The table is state; carry
   it or lose the non-local channel.

The one-sentence form of the doctrine: **the hull is four things — bytes,
dims, tick count, wormhole table — carried as canonical `traceView` JSON
with a frozen plane hash and declared parameters, and proven on the far
side by re-ticking to a byte-identical hash; everything else you might be
tempted to carry is skeleton, and everything you forgot to carry will be
named by the autopsy.**
