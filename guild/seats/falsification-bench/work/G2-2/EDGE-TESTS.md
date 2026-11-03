# EDGE-TESTS — the pinned-edge suite (RC-05 / P1 exit criteria)

**Seat:** falsification-bench (G2-2) · **Status:** design — no build this round
**Suite id:** `edge-pins-v1` (runs per push; every test must fail under its
sabotage twin at least once per release, receipt recorded).
**Inputs:** OLOG-SPEC.md, CRITIQUE.md (C1–C3, F1, V1–V8), ADJUDICATIONS-G1
(A2/A3/A4/A14, RC-05, PLAN AMENDMENT 6), g2-corpus-v1, qthe.mjs @ main.
**Design-time receipts:** `PROBES-G2-2.mjs` / `.out` in this directory —
kernel probes re-run this round (node v24.22.2, zero deps). Pin values marked
*[build-time]* are to be machine-generated when the suite is built; values
cited from probes are already receipts.

> Law: every test below can fail, names the receipt it pins, names the exact
> failure mode it catches, and carries a sabotage twin that has been *seen* to
> turn it red. A pin without a sabotage is decoration.

---

## (a) σ < 1 × resonance = 1 — truncation-vs-float

**Name:** `edge-sigma-sub-unity-lone-twin`

**Pins:**
- Corpus `sub-twins-desert-sigma-half` (32×32, σ=0.5, 40 ticks, EVTCNT
  [1,1,2]×13+…, CELLSN e6/e7 — the d=12 pair climbing to 38/39, 53 fires at
  term 0.5): the kernel-side float-plane receipt.
- ADJUDICATION A4: the spec-only C seat chose truncation; at σ<1 with
  resonance=1, truncation zeroes the twin term and the C2 mechanism does not
  fire at all — the float plane survives it.
- PLAN AMENDMENT 6 (RC-11): dual σ planes, both version-stamped.
- Probe P3 this round (4×4 minimal twin pair, Abstain d=8 ×2, desert, σ=0.5,
  8 ticks): float plane ends `…cd…cd…` (d 8→13), EVTCNT [1,1,2,1,1,2,1,1],
  first event term `0.5`; an emulated truncation plane ends
  `0000000000c800000000c80000000000` (d frozen), EVTCNT [1,2,2,2,2,2,2,2], term `0`. **Three independent
  discriminators: cells, counts, term.**
- Probe P8 (biased witness — twin pair + one Repel d=1 neighbor, acc=−1):
  σ=0.5 ends `…c6…`, σ=2 and σ=log2(3) end `…c8…` — a **cells-visible**
  σ-magnitude discriminator (sign of −1+2σ flips at σ=0.5), with terms
  [1] vs [4] vs [3.169925001442312].

**Construction (op-log side, [build-time] pins):** `Substrate.create(4,4)` →
`inject([setCell(1,1,τ=3,d=8), setCell(2,2,τ=3,d=8)])` at `at:0` →
`inject(setOptions{σ:0.5})` at `at:0` → tick×8 → `trace()`. The float payload
0.5 must cross the API/JSON boundary exactly (canary value, FUZZER-SPEC §5.2).
Assert: `stateHash` = *[build-time]*; `cellsHex` = `0000000000cd00000000cd0000000000`;
`eventCounts` = [1,1,2,1,1,2,1,1]; every `term` token = `0.5`; replay ×2
identical; cross-stack equality (T0–T3).

**Catches:** (i) a truncation/exact-rational plane silently substituted for
the float plane (cells frozen at `…c8…` — P3); (ii) σ=0.5 corrupted in
serialization (term token ≠ `0.5`, digest σ token ≠ `0.5`); (iii) a plane
mismatch that is *state-silent*: for σ ≥ 1 the two planes agree on bytes and
counts for most inputs — a build that only sweeps σ ≥ 1 cannot tell them
apart (this test + the fuzzer's σ battery are the directed fix); (iv) event
terms dropped from the trace (then only the cells discriminator survives —
the test asserts all three, so a term-less trace is red).

**Sabotage twin:** build with the truncation plane and **no plane tag in the
digest stamps** → replay of this float-plane pin throws `E_REPLAY_HASH` on
cells (loud, but only because this construction is sign-sensitive; the weaker
twin — plane tag present but excluded from the digest — passes on every
σ≥1 corpus case and must be caught *here*, at σ=0.5). Expected red:
`stateHash` mismatch with decomposed diff naming cells [5] and [10].
**Spec demand filed:** the plane tag must live in the digest's `v` block
(OLOG §7.2) and cross-plane replay must fail `E_REPLAY_VERSION` *before*
computing anything — the sabotage proves the tag is load-bearing.

## (b) Degenerate tori 2×2 and 1×4 — self-neighbors, multiplicity

**Name:** `edge-degenerate-tori` (two mandatory constructions in one test)

**Pins:** corpus `sub-degenerate-2x2` ("PINS A14: 2×2 torus, neighbors counted
per-offset with wrap") and `sub-degenerate-1x4` ("PINS A14 hard: h=1
self-neighbor double-count + wormhole path"); ADJUDICATION A14 (degenerate
tori adjudicated correct); kernel R1 (uniform Moore-8, no special case).
Probes this round:
- P9 (2×2 multiplicity): (0,0) Ground d=30, diagonal (1,1) Repel d=5 (sampled
  4×), orthogonal (1,0) Attract d=7 (sampled 2×) ⇒ acc = −20+14 = −6 ⇒ d→29.
  A **dedup/set-semantics build** (a classic Python `set(neighbor_coords)`
  mistake) computes −5+7=+2 ⇒ d→31. Cells-visible discriminator.
- P5: 1×4 lone Repel d=10 → self-sampled 2×, acc=−20, d→9 (a no-self build
  leaves d=10); 1×1 lone Repel d=10 → self ×8, d→9; 2×2 lone Repel d=1 with
  Ground others → **no** self-sample, acc=0, d unchanged.
- P6: 1×1 Abstain d=5 under σ=0.5: `events: []` while the slot IS occupied —
  the strict self-guard (kernel-forge A2, adjudicated) blocks self-twinning
  on a torus where the cell is geometrically its own neighbor.

**Construction:** all three probes rebuilt as op-logs (`setBytes` seeds +
ticks, no per-tick options), plus `whWrite` ops pointing a slot at the cell's
own coordinates on 1×4 (guard must reject; event count pinned 0) and at the
*other* cell (must fire). [Build-time] pins for hashes; probe values above
are the expected physics.

**Catches:** (i) neighbor-set dedup (multiplicity collapse — P9's 29-vs-31);
(ii) self-exclusion bugs (1×4 P5: 9-vs-10); (iii) wrap-direction bugs — the
C/Python `(x+w−1)%w` idiom vs a naive `x−1` that goes negative (C `%` keeps
the sign; Python `%` does not — the cross-stack differential catches what a
single-language test cannot); (iv) self-twin guard regressions on degenerate
geometry (P6).

**Sabotage twin:** dedup build (neighborhood as a coordinate set) → P9 arm
red (d=31 ≠ 29); second twin: C harness with naive `x-1` wrap → 1×4 arm red
(OOB read or divergence). Both must be demonstrated red at suite build.

## (c) mulberry32 seed aliasing — silent wrap at 2³²

**Name:** `edge-seed-domain-aliasing`

**Pins:** CRITIQUE C2/V3, confirmed by the Orchestrator (ADJUDICATIONS-G1);
probe P1 this round: `mulberry32(2**32+5)() === mulberry32(5)() ===
0.6897749109193683`. api-surface `E_CODEC_PRNG_SEED`; OLOG §3.7 (seed an
integer in [0, 2³²)).

**Construction:** `inject({op:'seedMulberry32', seed: S, tauFromRng:true,
dFromRng:true})` for S ∈ {0, 1, 5, 2³²−1} — must replay, hash, and
cross-stack-equal; for S ∈ {−1, 2³², 2³²+5, 1.5, "5"} — must throw
`E_CODEC_PRNG_SEED` with **no state mutation** (a rejected op must not leave
a half-seeded substrate; assert hash unchanged). Boundary injectivity pin:
seeds 0 and 2³²−1 produce different `cellsHex` (guards an off-by-one that
maps the domain edges to one stream). Draw-order pin: τ-then-d per §3.7
(shared with fuzzer SAB-4).

**Catches:** the kernel's `>>> 0` wrap (two recorded seeds, one actual
stream — a provenance lie the artifact cannot testify about); silent
coercion of fractional/string seeds; off-by-one domain edges; partial
application on rejection.

**Sabotage twin:** kernel-compat wrap build (accepts `2³²+5`, wraps to 5) →
the throw-assertion red (op accepted) and the provenance assertion red
(seeds `5` and `2³²+5` accepted with identical bytes). Also fuzzer SAB-2.

## (d) σ-leak into permanence — and its spec-laundering variant

**Name:** `edge-sigma-transient-vs-sticky`

**Pins:** CRITIQUE F1/V5 (confirmed by the Orchestrator); probe P2 this
round: `tick(sub,{sigma:5})` then `tick(sub,{})` then `tick(sub,{})` yields
twin terms `[5] [5] [5,5]` — the one-tick override persists through the lazy
table constructor. OLOG §4 rule 5, **and its own ambiguity**: the rule says
per-tick options "override for that call only and are never journaled as
state," yet leans on engine auto-journaling as `setOptions` — which is
*sticky*. Library-craft self-flagged exactly this ("deserves its own test",
CRITIQUE self-assessment). This test exists to force the fork closed.

**Construction (both prongs):**
- *Live prong:* engine sequence `tick({σ:5}); tick(); tick()` on the P3 twin
  pair. Correct behavior: terms `[5]`, `[1.584962500721156]`,
  `[1.584962500721156 ×2]`. Note the cruelty: **bytes and event counts are
  identical** to the leaky build in this construction (only the sign of
  pressure survives) — the *term stream is the only witness*, which is why
  F-0 (corpus term-blindness) and this test are the same fight.
- *Journal prong:* the same run, auto-journaled, must encode the transient
  override as **two ops** — `setOptions{σ:5}` at boundary k *and* an explicit
  reversion `setOptions{σ:<previous sticky>}` at the same boundary k — or an
  equivalent encoding that replays to the same term stream. A journal that
  encodes only `setOptions{σ:5}` replays identically to the live run (both
  sticky from k+1 on) while the live API promised transience: **the leak,
  laundered into spec compliance.** The test pins the required journal shape
  and the reverted term stream.

**Catches:** (i) the kernel bug verbatim (live prong, terms [5],[5],[5,5]);
(ii) the laundering build (journal prong — replay matches live, both wrong;
caught only by pinning the journal encoding); (iii) any engine/replay drift
in σ handling (shared with fuzzer P3 dual-path).

**Sabotage twin:** lazy-table build (kernel behavior) → live prong red;
auto-sticky-journal build → journal prong red. Both saboteurs are one-line
flags; both must be seen red before this test counts (G3).
**Spec demand filed:** §4 rule 5 must be amended to name the two-op encoding
(or a `transient` marker) as normative before @qthe/core freezes its
`tick(opts)` semantics.

## (e) Wormhole table is live state — snapshot/restore divergence

**Name:** `edge-snapshot-table-hull`

**Pins:** repo determinism attack A2 (plane-only snapshot/restore diverges);
CRITIQUE C1/V1 (structuredClone silently drops expandos; the clone *is* the
bytes so the data "survives" while the mechanism evaporates); api-surface
round-trip law `Substrate.restore(s.snapshot()).hash() === s.hash()`; OLOG
§7.2 (`table` inside the digest; `totalWrites` excluded but snapshotted).

**Construction:** substrate with a live twin schedule (P3 pair, several
ticks, ≥ 2 occupied slots, known `totalWrites`) → `snapshot()` →
`structuredClone(snapshot)` (the postMessage path, C1's user story) →
`restore()` → assert: hash equal; hull tuples equal; `totalWrites` equal
(telemetry, non-hash — its loss is a *report* bug, pinned separately);
then tick both original and restored → identical `cellsHex` AND identical
`eventsByTick` (the table survived *behaviorally*, not just structurally).
Second arm: `whClear` (whole table) between snapshot and restore — restore
must resurrect the pre-clear table (snapshot is a point-in-time artifact,
INV-2 does not apply to snapshots, only to journals).

**Catches:** plane-only snapshots (attack A2 — restore diverges on the very
next tick: twins silently never fire, events empty, no error anywhere);
stale-table snapshots (structure copied, occupied flags lost); expando-clone
paths (C1: the handle crossing structuredClone raw must either throw loudly
or round-trip — the test asserts snapshots, never raw substrates, cross).

**Sabotage twin:** plane-only snapshot build → hash mismatch on restore AND
event stream vanishes on the next tick (both assertions red). This is fuzzer
SAB-3 at fixed construction.

## (f) LWW peer divergence — observable, never silent

**Name:** `edge-lww-peer-divergence-observability` (anchors corpus case
`mw-lockstep-divergence`; full construction there)

**Pins:** kernel R4 (LWW per slot; live reads keep same-slot twins mutually
audible); kernel-forge A3 (LWW adjudicated correct); corpus
`sub-adjacent-lww-32x32`; OLOG INV-3 + §7.2 (`opsHash` binds provenance to
state); the RC-05 premise that individually-deterministic peers may diverge
from each other.

**Construction:** two peers, same dims, same `at:0` seed, lockstep ticks;
mid-run slot duel (A and B `whWrite` the same slot, same boundary, different
targets); lockstep to the end. Assert: (1) each peer self-replays ×2
byte-identical (determinism per peer is NOT the question); (2) `hashA ≠
hashB`; (3) hulls differ where the duel was load-bearing; (4) the divergence
report names boundary, slot, both ops, and the winner under the applied
order; (5) **the effect-masked variant** — duel outcome later overwritten
identically by both peers so hulls coincide — still yields `hashA ≠ hashB`
through `opsHash` alone.

**Catches:** silent convergence — any build where different journals claim
one artifact. Assertion (5) is the one that matters: it fails *only* on
builds that exclude provenance from the digest, i.e. it is the direct
sabotage-proof that `opsHash`-inside-`stateHash` (library-craft's declared
"least sure" design choice) is load-bearing and must stay.

**Sabotage twin:** SAB-6 (opsHash out of digest) → assertion (5) red: the
masked peers compare equal and the library reports convergence of two
non-equivalent histories. Expected red signature recorded at suite build.

---

## (g) Discovered this round — the term-witness edge (corpus v1 is term-blind)

**Name:** `edge-event-terms-are-load-bearing`

**Pins:** design-round finding F-0 (FUZZER-SPEC §0): corpus v1 pins `cellsN`
+ `evtCounts` only; `sub-twins-desert-sigma-half` and `sub-twins-desert-
default` are **byte- and count-identical** despite different σ — a physics
build that ignores σ passes 24/24; probes P2/P8 (the σ-leak and σ-magnitude
effects are term-only or term-first observable in minimal constructions).

**Construction:** the P8 biased-witness pair run at σ ∈ {0.5, 2, default}:
assert the three term streams ([1], [4], [3.169925001442312]) *and* the two
end-state cell bytes (…c6… vs …c8… vs …c8…) — then assert that corpus v2
format pins **term tokens per event**, not just counts.

**Catches:** trace formats (and corpus formats) that record event counts
without term values; physics builds that de-grade σ to a digest echo.

**Sabotage twin:** a physics build with σ hardcoded to default while the
digest echoes the journaled σ → passes every corpus-v1 pin, goes red here on
term tokens (and on cells, in the biased witness). This is the single most
dangerous untested surface found this round; it gets a named edge before the
suite is built.

---

## P1 exit gate

Canonical checklist: **FUZZER-SPEC.md §9, items G1–G10** (corpus ×4 stacks ·
multi-writer ≥9 cases · edges (a)–(g) green with recorded sabotage-red
receipts · ≥10⁶ clean fuzz iterations · 14-night streak · SAB-1…6 all red ·
float canary ring bit-stable · fail-closed code parity · stranger check ·
README claim flip last). This suite owns G3; it is blocked, not complete,
until every test above has demonstrated its sabotage red.
