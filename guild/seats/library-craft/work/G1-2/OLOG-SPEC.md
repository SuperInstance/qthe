# OLOG-SPEC — The qthe Op-Log Format

**Status:** normative for `@qthe/core` v0 · **Author:** library-craft seat, G1-2
**Companion documents:** `api-surface.d.ts` (typing surface), `CRITIQUE.md` (why this exists)
**Kernel of record:** `qthe.mjs` @ SuperInstance/qthe (265 lines, zero-dep ESM)

> House law, adapted: *replay = determinism, period.* If a trace cannot be
> re-derived from its recorded inputs on the stamped kernel, it is not a
> trace — it is a rumor. This document defines the artifact that makes the
> claim checkable by a stranger.

---

## 1. Scope and invariants

The op-log replaces three unserializable things in the reference kernel:
arbitrary `seedFn` closures, the expando-resident substrate state, and the
per-call `tick()` options that lived only in the caller's head. Four
invariants govern everything below:

- **INV-1 (Plain data).** Every op, snapshot, and trace is a JSON object
  graph: booleans, integers, strings, arrays, objects. No floats except the
  documented σ fields (§7.1), no functions, no typed arrays inside *traces*
  (snapshots may carry `Uint8Array` — structuredClone-safe, not JSON-canonical),
  no host paths, no timestamps. Deterministic artifacts only.
- **INV-2 (Append-only history).** A journal never edits or reorders past
  entries. `Substrate.inject()` may only append at the current boundary.
- **INV-3 (Single normative source).** The op-log IS the record. Views
  (`cellsHex`, `table`, `events` in a trace) are informational and must be
  re-derivable; if a view and the replay disagree, the replay wins and the
  kernel is buggy.
- **INV-4 (Fail closed).** Unknown op names, unknown version stamps, and
  hash mismatches are hard errors. A skipped op or a silently forgiven
  version gap converts "replay = determinism" into "replay = sometimes".

The P1 plan states "traces record **seed + tick count + op-log**." This
spec deliberately collapses *seed* into the op-log: the seed is the ops
journalized at `at === 0` (§5). Two records of the same fact drift apart;
one record cannot.

---

## 2. Envelopes and version fields

Three artifacts carry version stamps. Stamps are **digest stamps**, not npm
semver — see §8 before disagreeing.

| Field | Lives in | Meaning |
|---|---|---|
| `formatVersion` | TraceRecord | Trace envelope shape. `"1"`. |
| `kernelVersion` | TraceRecord, SubstrateSnapshot | Kernel behavior stamp — changes only on trace-breaking releases (§8). |
| `specVersion` | TraceRecord, SubstrateSnapshot | SPEC.md revision implemented. |
| `ologVersion` | TraceRecord, standalone op-log envelope | Op schema major. `"1"`. |
| `v` | SubstrateSnapshot | Snapshot shape. `"1"`. |

Standalone op-log envelope (when ops are shipped without a full trace):

```json
{ "ologVersion": "1", "ops": [ ... ] }
```

Versioning policy for the op schema:

- **Additive** changes (a new op name; a new *optional* field on an existing
  op) bump `ologVersion` minor (`"1"` → `"1.1"`), and replay of old logs on
  the new kernel must keep hashing identically (unknown-to-old optional
  fields cannot have been digest-relevant, or the change was not additive).
- **Semantic** changes (altering what an existing op does, removing an op,
  making an optional field required) bump the major (`"2"`), after which
  replay refuses cross-major logs with `E_REPLAY_VERSION` — never guesses.

---

## 3. Op catalog

Common shape: every op is `{ "op": <name>, "at": <tick boundary>, ...fields }`.
Validation is uniform and hostile to ambiguity: **out-of-domain values throw
(`OpError`, codes `E_OP_SHAPE` / `E_OP_BOUNDS`); nothing is masked, clipped,
or coerced.** All coordinates are integers; all rects are axis-aligned.

| # | Op | Fields (beyond `op`, `at`) | Semantics |
|---|---|---|---|
| 3.1 | `setTau` | `x, y, tau` | Write one cell's timbre. τ ∈ {0,1,2,3}. The injector path — tick never moves τ. |
| 3.2 | `setD` | `x, y, d` | Write one cell's amplitude. d ∈ 0..63. |
| 3.3 | `setCell` | `x, y, tau?, d?` | Combined write; at least one of `tau`/`d` required (else `E_OP_SHAPE`). |
| 3.4 | `setByte` | `x, y, c` | Raw byte write, c ∈ 0..255. The byte-literal path. |
| 3.5 | `setBytes` | `x, y, w, bytes[]` | Bulk literal block: `bytes` is row-major with row stride `w`, origin `(x,y)`. Must fit the grid entirely — out-of-bounds throws, never clips. |
| 3.6 | `fillRect` | `x, y, w, h, byte?` XOR `tau?+d?` | Constant fill of a rect (exactly one of `byte` / (`tau` **and** `d`) required). Out-of-bounds rect throws. |
| 3.7 | `seedMulberry32` | `seed, tauFromRng, dFromRng, tau?, d?` | Re-derivable random seed — see recipe below. Overwrites **every** cell. |
| 3.8 | `whWrite` | `slot, x, y, resonance` | Occupy wormhole slot `slot` ∈ 0..63 pointing at in-grid cell `(x,y)` with integer `resonance` ≥ 0. Resonance 0 = present-but-inert (read guard rejects it, mirroring kernel R4). |
| 3.9 | `whClear` | `slot?` | Vacate one slot; omitted `slot` = clear the whole table **and** reset `totalWrites` (mirrors kernel `clear()`). Single-slot clear leaves `totalWrites` monotone. |
| 3.10 | `setOptions` | `sigma?, wormholes?` | Sticky tick options, effective for ticks **after** this boundary (§4). The only persistence path for σ and the wormhole flag. |

**3.7 recipe (normative, pin every draw).** One `mulberry32(seed)` stream,
`seed` an integer in [0, 2^32). Visit cells row-major (y outer, x inner).
Per cell: if `tauFromRng`, draw `r ← rng()` and set `tau = floor(r·4)`; if
`dFromRng`, draw `r ← rng()` and set `d = floor(r·64)`; undrawn fields take
the op's constants (`tau` default 0, `d` default 0). Draw order is τ-then-d,
always. Two implementations that agree on this paragraph produce identical
bytes; that is the point.

**Why these ten and no others.** 3.1–3.4 are the surgical injector surface
(τ-frozen-in-tick means τ writes are a first-class research act, not a
special case). 3.5–3.7 cover seeding with an exactness ladder: literal
bytes (any legacy `seedFn`, captured once), constant fill, and a re-derivable
PRNG seed that keeps traces compact. 3.8–3.9 make G5-style twin schedules
constructible from the log instead of from imperative side effects. 3.10
exists because the kernel had *no* serializable representation of run
parameters at all — σ lived in call sites and (via the lazy-table bug,
CRITIQUE F1) leaked into hidden state. Ops that were considered and
rejected: `tickN` (ticks are the trace's `tickCount`, not ops — ops model
*injector* intent); `setDims` (dims are creation parameters, immutable);
arbitrary `seedFn` serialization (closures are not data — the bytes-capture
ladder is the honest answer).

---

## 4. Ordering and tick-interleave semantics

**Definition (`at`).** `op.at = k` means: *apply this op when the substrate
has completed exactly `k` ticks* — i.e., after tick `k`, before tick `k+1`.
Ops at `at = 0` run between creation and the first tick (the seed boundary).

Rules, exactly:

1. **Boundary grouping.** All ops with `at = k` apply, in array order,
   before tick `k+1` begins. Array order within a boundary is the tiebreak
   and is significant (a `setTau` then `setD` on one cell is two journal
   entries; order preserved).
2. **Monotonicity.** `at` values must be non-decreasing along the array
   (`E_OP_AT` otherwise). This is checkable in one pass and makes the log
   append-only by construction.
3. **Range.** `0 ≤ at ≤ tickCount`. `at = tickCount` is legal: post-run
   injections are journaled, affect the hashed end state, and are never
   ticked after (the trace's `tickCount` says how many ticks ran, period).
4. **Live injection.** `substrate.inject(op)` accepts `at` only when equal
   to the substrate's current tick count, or omitted (filled with the
   current count). Retro-injection (`at < ticks`) and pre-queueing
   (`at > ticks`) throw `E_OP_AT` — build a full op-log and replay it
   instead. The journal therefore equals *what actually happened*, entry
   for entry.
5. **Options timing.** A `setOptions` op at boundary `k` affects tick `k+1`
   onward, until the next `setOptions`. Ticks before the first `setOptions`
   use the defaults σ = log2(3), wormholes = true. Per-tick `TickOptions`
   passed to `sub.tick(opts)` override for **that call only** and are never
   journaled as state — a trace replaying the same ops and tick count
   reproduces them only if they were the same at every call; therefore
   **traces that used per-tick overrides must record those overrides as
   `setOptions` ops** (the engine's `run()`/`tick()` do this automatically
   when given explicit options — implementation note, not spec slack).

---

## 5. Seed capture

- `{kind:'bytes'}` and `{kind:'legacyFn'}` creation → journaled as one
  `setBytes` op at `at:0` (the legacy function is executed once; the bytes
  are the provenance — INV-1: functions are not data).
- `{kind:'uniform'}` → one `fillRect` op at `at:0`.
- `{kind:'mulberry32'}` → one `seedMulberry32` op at `at:0` (compact,
  re-derivable).
- No seed → no ops at `at:0`; the canonical empty substrate is all-Ground
  d=0. Two empty seeds on the same dims are the same trace input, on
  purpose.

---

## 6. Replay algorithm (normative pseudocode)

```
function replayTrace(trace, expectMatch = true):
    # 1. refuse loudly, early
    if trace.ologVersion major ≠ OLOG_VERSION major: throw ReplayError(E_REPLAY_VERSION)
    if trace.formatVersion ≠ "1":                    throw ReplayError(E_REPLAY_VERSION)
    validateOps(trace.ops, trace.w, trace.h, trace.tickCount)   # §3 + §4 rules 2–3

    # 2. rebuild from the record
    sub    = Substrate.create({w: trace.w, h: trace.h})   # empty seed (§5)
    opts   = { sigma: DEFAULT_SIGMA, wormholes: true }    # sticky defaults
    events = []
    i      = 0

    for t in 0 .. trace.tickCount - 1:
        while i < len(trace.ops) and trace.ops[i].at == t:
            if trace.ops[i] is setOptions: opts = merge(opts, trace.ops[i])
            else:                          applyOp(sub, trace.ops[i])
            i += 1
        events[t] = sub.tick(opts)          # kernel R1–R4, byte-identical

    while i < len(trace.ops):               # post-run ops (§4 rule 3)
        applyOp(sub, trace.ops[i]); i += 1

    # 3. seal
    h = sub.hash()                          # §7 recipe; includes opsHash
    if expectMatch and h ≠ trace.stateHash:
        throw ReplayError(E_REPLAY_HASH, {expected: trace.stateHash, got: h})
    return {substrate: sub, hash: h, matches: h == trace.stateHash, eventsByTick: events}
```

Properties (each is a test, not a hope): replay is a pure function of
`(trace, kernel build)`; identical inputs give identical `hash` and identical
`eventsByTick`; `replayTrace(t).substrate.trace()` re-serializes to a trace
with the same `stateHash`.

---

## 7. Trace-hash recipe

### 7.1 Canonical JSON

`canonicalJson` is the RFC 8785 (JCS) subset: objects with keys sorted by
UTF-16 code unit; no insignificant whitespace; arrays keep order; strings
per JSON escaping; numbers per **ECMAScript Number::toString** (this is what
makes σ = log2(3) serialize as `1.584962500721156` identically in every
conforming JS engine; cross-language implementors must follow RFC 8785 §3.2.2.3
— the qthe Python cross-impl already lives with this class of seam, see
ONBOARDING F1–F3). `undefined`, functions, symbols, and non-finite numbers
throw. Integers are exact within ±2^53. **Floats are permitted only where
this spec names them** (σ); everything else is an integer.

### 7.2 What feeds the digest

`Substrate.hash()` = `"qth1:" + sha256Hex(canonicalJson(D))` where `D` is:

```jsonc
{
  "v": {                       // ALL version stamps, inside the digest
    "kernel": KERNEL_VERSION,  //   kernel behavior stamp
    "spec":   SPEC_VERSION,    //   SPEC revision
    "olog":   OLOG_VERSION,    //   op schema major
    "hash":   HASH_VERSION     //   this recipe's id ("qth1")
  },
  "w": W, "h": H,              // dims
  "ticks": T,                  // completed ticks
  "sigma": S,                  // sticky σ at hash time (JCS float)
  "cellsHex": "…128 hex chars per 64 cells…",  // lowercase, row-major
  "table": [[slot, x, y, resonance], …],       // occupied slots, slot order
  "opsHash": sha256Hex(canonicalJson(ops))     // the journal, sealed in
}
```

Design notes, because each was a decision:

- **Versions live *inside* the digest**, so any stamp change re-hashes every
  trace in existence — loudly, by design (§8).
- **`opsHash` binds provenance to state**: you cannot swap a different
  op-log under a recorded hash. A state-only hash would let two different
  histories claim one artifact.
- **`table` entries are tuples** (compact, key-sort-proof). Empty table →
  `[]` — note this differs from kernel `traceView`, which emitted `null`;
  R7's equivalence claim (empty ≡ disabled) is preserved because the events
  view shows whether twin hits occurred.
- **`totalWrites` is excluded** (deterministic given the log; telemetry).
- **No timestamps, no hostnames, no sequence ids** — a trace hashed twice on
  the same kernel is the same string. If you want to know *when* a trace was
  made, put that in your receipt-chain layer (quilt-stone), not in the
  digest.

`hashTrace(trace)` recomputes the same value from a `TraceRecord` without a
live substrate (verification tool).

### 7.3 Worked canary vector (machine-checked, reproducible)

Kernel `qthe.mjs` (main, 265 lines), 8×8, seed `pack((x+y)&3, (x*5+y*3)&63)`
(captured as `setBytes` at `at:0`), 3 default ticks, stamps
`kernel 0.1.0 / spec 1.0.0 / olog 1 / hash qth1`:

```
opsHash        = d5e0fc61b417b9bf45d96c6ba9863a39aa9da2336df8f77eb8f40c5080230b16
cellsHex       = 004887d2115c9be04686d0155499e42983ce135297e22766cc115095e02564af
                 094e93de2362a7ec5291dc2160a5f0358fda1f5ea3ee3372d21d5ca7e63170bb
table (tuples) = [[9,0,3,9],[10,0,3,7],[11,0,3,5],[12,1,2,11],[13,1,2,13],
                  [14,2,1,11],[15,2,1,13],[16,3,0,7],[17,3,0,5],[19,0,7,17],
                  [20,0,7,17],[21,0,7,17],[23,1,6,9],[24,1,6,11],[25,1,6,13],
                  [26,2,5,9],[27,2,5,9],[28,3,4,9],[29,3,4,9],[30,4,3,9],
                  [31,4,3,9],[32,5,2,9],[33,5,2,9],[34,6,1,11],[35,6,1,13],
                  [39,4,7,17],[40,4,7,17],[41,4,7,17],[43,5,6,9],[44,5,6,9],
                  [45,5,6,9],[46,6,5,9],[47,6,5,9]]
sigma (JCS)    = 1.584962500721156
stateHash      = qth1:69d81dfc5d4b9f5b708e7524dfb0a632f1fd881d342bf85eec90bfdda95efb3a
```

The full digest input (exact canonical string) and the seed bytes are in
Appendix A. Any conforming implementation must reproduce `stateHash` from
the ops and `tickCount` alone.

---

## 8. Upgrade honesty (the compatibility rule)

**Definitions.** A kernel release is *trace-compatible* with its predecessor
iff, for **every** TraceRecord the predecessor can emit, replay on the new
build yields (a) an identical `stateHash` **and** (b) an identical
per-tick event stream (`eventsByTick`). Both — the G5 twin schedule is a
pinned mechanism claim; changing event *order or count* changes the science
even when the final bytes survive.

**The rule.** A release MUST do exactly one of:

1. **Be trace-compatible.** The digest stamps (`kernelVersion`,
   `specVersion`) MAY stay unchanged. Evidence: the **canary corpus** — a
   checked-in, frozen set of traces with recorded hashes (minimum coverage:
   empty grid; seeded patterns; a same-d twin pair over ≥ 2 co-ticks; a
   σ sweep with `setOptions`; `whWrite`/`whClear` schedules; post-run ops;
   the §7.3 vector). CI replays the corpus on every release. All green →
   class 1. Anything red → class 2. There is no third class, and "should be
   fine" is not a class.
2. **Bump at least one digest stamp.** Because stamps live inside the
   digest, every historical hash stops matching — *loud* divergence: replay
   throws `E_REPLAY_HASH`, nobody silently publishes mixed-kernel results.
   A stamp-bumping release must regenerate the canary corpus and ship a
   migration note.

**Forbidden:** changing observable trace or event behavior while keeping
the stamps. That is not compatibility, it is forgery — a hash that matches
across kernels that disagree is worse than a hash that fails.

**Stamps vs npm semver.** `KERNEL_VERSION` is a behavior stamp, not the
package version. If the package semver were used, every patch release would
invalidate every trace hash in the literature. The package may release
`0.4.2` while `KERNEL_VERSION` stays `0.1.0`; the two version tracks meet
only in release notes ("this release is trace-breaking: stamp bumped").
`OLOG_VERSION` and `HASH_VERSION` follow the same two-class rule
independently — an op-schema major bump is by definition not
trace-compatible for logs using retired ops.

---

## Appendix A — canary digest input (exact canonical JSON)

```
{"cellsHex":"004887d2115c9be04686d0155499e42983ce135297e22766cc115095e02564af094e93de2362a7ec5291dc2160a5f0358fda1f5ea3ee3372d21d5ca7e63170bb","h":8,"opsHash":"d5e0fc61b417b9bf45d96c6ba9863a39aa9da2336df8f77eb8f40c5080230b16","sigma":1.584962500721156,"table":[[9,0,3,9],[10,0,3,7],[11,0,3,5],[12,1,2,11],[13,1,2,13],[14,2,1,11],[15,2,1,13],[16,3,0,7],[17,3,0,5],[19,0,7,17],[20,0,7,17],[21,0,7,17],[23,1,6,9],[24,1,6,11],[25,1,6,13],[26,2,5,9],[27,2,5,9],[28,3,4,9],[29,3,4,9],[30,4,3,9],[31,4,3,9],[32,5,2,9],[33,5,2,9],[34,6,1,11],[35,6,1,13],[39,4,7,17],[40,4,7,17],[41,4,7,17],[43,5,6,9],[44,5,6,9],[45,5,6,9],[46,6,5,9],[47,6,5,9]],"ticks":3,"v":{"hash":"qth1","kernel":"0.1.0","olog":"1","spec":"1.0.0"},"w":8}
```

Seed op (journalized at `at:0`, `bytes` = the 64 seed bytes):

```
[{"at":0,"bytes":[0,69,138,207,20,89,158,227,67,136,205,18,87,156,225,38,134,203,16,85,154,223,36,105,201,14,83,152,221,34,103,172,12,81,150,219,32,101,170,239,79,148,217,30,99,168,237,50,146,215,28,97,166,235,48,117,213,26,95,164,233,46,115,184],"op":"setBytes","w":8,"x":0,"y":0}]
```

Last-tick events (informational; 13 twins — the event stream a
trace-compatibility release must reproduce tick-for-tick):

```
[{"kind":"twin","x":7,"y":0,"slot":33,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":2,"y":1,"slot":15,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":6,"y":1,"slot":35,"resonance":33,"term":52.30376252379815},
 {"kind":"twin","x":1,"y":2,"slot":13,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":5,"y":2,"slot":33,"resonance":33,"term":52.30376252379815},
 {"kind":"twin","x":0,"y":3,"slot":11,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":4,"y":3,"slot":31,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":3,"y":4,"slot":29,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":7,"y":4,"slot":45,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":2,"y":5,"slot":27,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":6,"y":5,"slot":47,"resonance":33,"term":52.30376252379815},
 {"kind":"twin","x":1,"y":6,"slot":25,"resonance":9,"term":14.264662506490405},
 {"kind":"twin","x":5,"y":6,"slot":45,"resonance":33,"term":52.30376252379815}]
```
