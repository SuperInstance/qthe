# AMBIGUITY.md — qthe G1-1, kernel-forge seat

**Method.** The kernel in `qthe_l1.c` was re-derived from the spec text alone.
No implementation file (qthe.mjs, qthe-core/, crossimpl/, fixedpoint/, …) was
fetched or consulted. One permitted network fetch of SPEC.md itself was made;
it matches the task paste exactly, adding only item 7 (A2UI telemetry — out of
scope) and the LAYER 2 claims table (out of scope, but claim C3 supplied the
only evidence anywhere in the spec about σ; used in A4 below).

Each entry: **(a)** spec quote → **(b)** what is ambiguous → **(c)** decision
and why → **(d)** confidence. Entry IDs A1…A17 are cross-referenced in code
comments. Every decision is isolated in one place so an author's ruling can
flip it without archaeology.

---

## A1. Wormhole read/write ordering within a tick
- (a) "it reads slot d: … it writes its own (x, y) and resonance = |real_acc| + 1 to slot d **for the next tick**"
- (b) Does a cell's read see writes made earlier in the same tick (live table, scan-order dependent), or the table as it stood at tick start?
- (c) **Snapshot reads.** All reads hit the pre-tick table; all writes stage into a next-tick table committed after the scan. "For the next tick" marks writes as next-tick-visible; item 5's grid update is explicitly synchronous from a pre-tick snapshot, and I extended that same discipline to the table so results are scan-order-independent *by construction* (item 6).
- (d) **med-high**

## A2. Resonating with one's own entry — the "different (x, y)" guard
- (a) "if occupied by a *different* (x, y) with nonzero resonance"
- (b) Is "different" strict coordinate inequality, and what does the guard actually protect against?
- (c) **Strict inequality against the reading cell's own coordinates.** Under A1's snapshot reads a cell cannot meet its own same-tick write, so the guard's real job is blocking resonance with one's own *stale* entry from an earlier tick (a cell re-reading a slot it previously wrote must not twin with itself). Verified in smoke: a 1×1 all-Abstain substrate can never twin.
- (d) **high** (intent), **med** (interplay with A1)

## A3. Collision policy — two Abstain cells, same d, same tick
- (a) Item 4 gives no rule; any number of Abstain cells may share data value d.
- (b) Which write survives in slot d for the next tick?
- (c) **Last-writer-wins in row-major scan order** (the later cell overwrites). Simplest total, deterministic rule; any priority scheme would be invention. Alternatives (first-writer-wins, reject-second-writer) change multi-tick traces.
- (d) **low** — spec silent; a top question for the author.

## A4. σ — undefined symbol; integer or float; sign; rounding
- (a) "twin resonance: imaginary channel receives `resonance · σ`" — σ is never defined in items 1–6.
- (b) σ's definition, type, and range are entirely open. A float σ (e.g. log₂ 3) cannot be byte-exact across languages, threatening item 6. My first reading was σ = signum(real_acc); that is refuted by the fetched spec's LAYER 2 claim C3, which sweeps σ over {log₂ 3, 0.5, 1, 2, 4} and reports completion scaling ~1/σ — σ is a positive **bridge-scale parameter**, not a sign.
- (c) **σ is a substrate-level exact rational σ = σ_num/σ_den (int32, den > 0), default 1/1** (settable via `qthe_set_sigma`; log₂ 3 ≈ 126797/80000). Twin term = (resonance·σ_num)/σ_den in int64, **quotient truncated toward zero** (C99 semantics). All-integer arithmetic keeps item 6's byte-exactness. In the swept (positive) regime the twin term is never negative; a negative σ_num is mechanically permitted but untested territory. |term| ≤ 505·2³¹ — no overflow.
- (d) **med** — C3 pins σ's *role*, but the arithmetic and rounding remain my choice.

## A5. Do Abstain cells receive neighborhood pressure? ("bypasses local weights")
- (a) τ=3 row: "**the Looking Glass** — bypasses local weights, bridges via the wormhole table" vs. item 5: "Attract neighbors add d, Repel neighbors subtract d into the cell's real accumulator."
- (b) Does "bypasses local weights" exempt Abstain cells from *receiving* neighborhood pressure? If exempt, real_acc ≡ 0, so resonance ≡ 1 and every twin term collapses to σ — the |real_acc|+1 formula becomes dead letters.
- (c) **All cells, Abstain included, accumulate per item 5.** "Bypasses local weights" describes τ=3's *contribution* — Ψ(3) = i routes it to the imaginary channel (exactly LAYER 0 item 3's split and item 4's bridge), not an exemption from receiving pressure. This is the only reading in which every spec formula does real work.
- (d) **med**

## A6. Wormhole table persistence across ticks
- (a) "it writes … to slot d for the next tick" — nothing is said about slots *not* written this tick.
- (b) Is the next-tick table (i) carried over with only overwritten slots changed, or (ii) rebuilt empty each tick, so entries live at most one tick unless refreshed?
- (c) **Carry-over (i).** The table is persistent substrate state; unwritten slots keep their entries (a stale twin can still fire for a third cell). "For the next tick" describes *visibility timing*, not lifecycle; a rebuilt table would also make A2's guard nearly pointless and resonance memory impossible.
- (d) **low-med** — genuinely open; drives all long traces.

## A7. Can τ change during tick()?
- (a) Item 5 governs only "the cell's own data" (d); the primitive table calls τ "operator state" but no transition rule exists anywhere.
- (b) Whether tick() also mutates τ.
- (c) **τ is invariant; only d moves.** Inventing a τ-transition rule would violate spec-to-implementation discipline. (If τ transitions exist in the reference kernel, they are entirely unspecified.)
- (d) **high**

## A8. Clamp semantics at d = 0 and d = 63
- (a) "moves toward saturation `min(d+1, 63)` under net-positive pressure, toward 0 under net-negative (exact rule table in the kernel)."
- (b) "Toward 0" — a unit step max(d−1, 0) or a jump to 0? "The exact rule table" lives in the unreadable kernel; net-zero pressure is not mentioned at all.
- (c) **Symmetric unit step: net>0 → min(d+1,63); net<0 → max(d−1,0); net=0 → d.** The parallel construction with the saturation clause (an incremental move) supports the step reading; net-zero unchanged is the only sane synchronous default. Implemented branchlessly as `d+(d<63)` / `d−(d>0)` — provably maps [0,63]→[0,63] (item 2). A literal 3×64 rule table is equivalent; the closed form is transcription-error-proof.
- (d) **med-high**

## A9. Which d keys the wormhole — pre-tick or post-movement?
- (a) "When a cell in Abstain state carries data value `d`: it reads slot d … writes … to slot d"
- (b) Item 4 is written before item 5; within one tick, does the Abstain cell read/write the slot keyed by its pre-tick d or its post-movement d′?
- (c) **Pre-tick d, for both read and write.** The synchronous-tick discipline reads all cell state from the snapshot; "carries data value d" is the cell's state at tick start. (Post-tick d′ becomes visible to the *next* tick, mirroring the table write itself.)
- (d) **med**

## A10. Scope and lifecycle of "the imaginary channel"
- (a) "the imaginary channel receives resonance · σ" — singular, definite article; no reset or accumulation rule; no statement about neighborhood τ=3 contributions at tick level.
- (b) One global substrate channel or per-cell channels? Reset each tick or accumulated? Do Abstain *neighbors* also feed it during tick?
- (c) **Per-cell channel, reset to 0 at each tick start, receiving only twin terms during tick().** Each cell is the unit of computation (the analog of one output j in item 3), symmetric with the per-cell real accumulator; neighborhood τ=3 → imaginary flow belongs to vectorPass (LAYER 0), and items 4–5 mention only the real accumulator for neighborhood effects.
- (d) **med-low** — C3's clean ~1/σ completion scaling would also fit an accumulating channel; I chose per-tick reset for the A11 consistency argument.

## A11. Real accumulator: persistent or recomputed; what |real_acc|+1 reads
- (a) "Attract neighbors add d, Repel neighbors subtract d **into the cell's real accumulator**" and "resonance = |real_acc| + 1".
- (b) "Accumulator" could persist across ticks (neighbors keep pushing into it) or be recomputed each tick. Also: is |real_acc| taken before or after the twin contribution?
- (c) **Recomputed each tick from the snapshot** (net neighborhood pressure), and resonance reads that fresh value. Decisive evidence: item 2 claims exhaustion over "all 4 × 64 states, all rules, no exceptions" — a persistent accumulator is hidden state outside the 4×64 cell byte, which would make the exhaustion claim false as stated. The twin term lands in the imaginary channel and never feeds back into real_acc, so "before or after" is vacuous under split channels.
- (d) **med-high**

## A12. vectorPass input domain x_k
- (a) "a QTHE vector pass over inputs x_k computes …" — no type, no range, no matrix layout.
- (b) Signed? What width? When can overflow occur?
- (c) **x_k is int32_t; products/sums accumulate in int64_t** (the imaginary channel must be signed — Repel/Abstain terms with negative x_k make y_I negative). Exact while k·63·INT32_MAX ≤ INT64_MAX, i.e. k ≤ ~6.8×10⁷. Fixed-width types keep cross-language byte-exactness. w is a j×k row-major matrix; a single-row primitive is also exposed.
- (d) **med** (type choice), **high** (int64 accumulation is the only safe exact choice)

## A13. Empty-slot encoding; what "nonzero resonance" guards
- (a) "each slot empty or {x, y, resonance}" … "with nonzero resonance"
- (b) How is "empty" represented, and what does the resonance≠0 test guard?
- (c) **resonance == 0 is the empty sentinel** (a separate occupied flag would be functionally identical). Writes always store |real_acc|+1 ≥ 1, so occupied ⇒ nonzero; the guard is the occupancy test. Since |real_acc|+1 can never be 0 under the current rules, the guard reads as future-proofing against a zero-resonance write rule.
- (d) **high**

## A14. Degenerate tori (w or h ≤ 2)
- (a) "Moore-8, toroidal" — no minimum dimensions.
- (b) With w ≤ 2 or h ≤ 2, the 8 offsets revisit the same physical cell; does it count once or per offset?
- (c) **Each of the 8 offsets counts independently** (naive modular wrap). Verified: on 2×2, a cell sees the diagonal neighbour 4× and each edge neighbour 2× (acc = 8·d). Simplest deterministic reading; w, h ≥ 3 avoids the regime entirely.
- (d) **med**

## A15. Trace-hash algorithm and serialization (item 6 testability)
- (a) "The kernel is seed-to-hash reproducible; every experiment seals its trace hash into a stone-v1 receipt chain."
- (b) No algorithm, serialization, or hash-scope is defined.
- (c) **FNV-1a-64 over a canonical, endianness-independent byte stream**: domain tag "qthe-trace-v1", w, h, σ_num, σ_den, all cell bytes row-major, then 64 slots × {x, y, resonance} as big-endian u32. Covers the feed-forward state (grid + table + config); per-tick accumulators are pure functions of the previous hashed state and are read from the struct directly. Platform-independent by construction.
- (d) **med** — the choice is arbitrary but fully specified; stone-v1 compatibility would require the reference algorithm.

## A16. seedFn contract
- (a) "makeSubstrate(w,h,seedFn)" — a name only: no signature, no NULL policy, no call order.
- (b) Signature, iteration order, NULL behaviour, initial table state.
- (c) **`uint8_t (*)(uint32_t x, uint32_t y, void *user)`, invoked row-major (y outer, x inner), NULL ⇒ all-zero cells (Ground, d=0).** Wormhole tables start empty; every allocation is zeroed (no uninitialized reads). Call order is fixed so even stateful seeders are deterministic.
- (d) **med-high** (invented by necessity)

## A17. Does the imaginary channel feed back into evolution? (the twin's causal role)
- (a) Items 4–5 define the twin term as an imaginary-channel receive and key all d movement on the real accumulator; yet LAYER 2 claim C2 measures "wormhole table ON vs OFF" arms that differ (8/8 vs 0/20 ticks-to-connect).
- (b) If the imaginary channel were pure telemetry with no feedback, could ON/OFF arms ever differ? (Yes — if the *task metric* reads the channel; but if their grids diverge, feedback must exist.)
- (c) **No feedback: the imaginary channel never influences d or τ.** Items 4–5 specify none, and item 2's exhaustion over 4×64 states forbids hidden channel state from affecting the update rule. Under this model, C2's ON/OFF difference is carried entirely by the metric observing the imaginary channel (a twin "connecting" is an observable event), not by grid dynamics. **This is the first thing I would cross-check against qthe-verify**: if the reference kernel's ON/OFF arms produce different *cell traces*, my model diverges at exactly this entry.
- (d) **med**

---

## Decision register (summary)

| ID | decision | confidence |
|----|----------|------------|
| A1 | snapshot table reads, staged next-tick writes | med-high |
| A2 | "different (x,y)" = strict ≠ own coords (blocks stale self-twin) | high |
| A3 | same-slot collision: row-major last-writer-wins | low |
| A4 | σ = exact rational num/den, default 1/1, truncate toward zero | med |
| A5 | Abstain cells DO accumulate neighborhood pressure | med |
| A6 | table carries over across ticks | low-med |
| A7 | τ invariant under tick | high |
| A8 | unit step both ways: min(d+1,63) / max(d−1,0) / unchanged | med-high |
| A9 | wormhole keyed by pre-tick d | med |
| A10 | per-cell imaginary channel, reset per tick, twins only | med-low |
| A11 | accumulator recomputed per tick (item-2 exhaustion argument) | med-high |
| A12 | x_k int32, int64 accumulation, exact for k ≤ ~6.8e7 | med |
| A13 | resonance==0 ⇔ empty slot | high |
| A14 | 8 offsets counted independently on degenerate tori | med |
| A15 | FNV-1a-64, canonical big-endian serialization | med |
| A16 | seedFn(x,y,user), row-major, NULL ⇒ zero substrate | med-high |
| A17 | imaginary channel never feeds back into d/τ | med |
