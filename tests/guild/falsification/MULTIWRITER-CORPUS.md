# MULTIWRITER-CORPUS — the corpus that prices lockstep

**Seat:** falsification-bench (G2-2) · **Status:** design — no build this round
**Artifact id:** `g2-corpus-v2-mw` (extends g2-corpus-v1; same laws: the corpus
is the oracle — byte-identical or divergent, no third option; every case names
the ambiguity it pins; self-determinism recorded by running every case twice).
**Inputs:** OLOG-SPEC.md §3–§7, ADJUDICATIONS-G1 (RC-05; kernel-forge A3 LWW
adjudicated correct), CRITIQUE.md, corpus `sub-adjacent-lww-32x32`,
FUZZER-SPEC.md §9 (the P1 exit gate this corpus feeds).

> The premise, stated honestly: **LWW slot semantics (kernel R4, adjudicated
> A3) mean two individually-deterministic lockstep peers can diverge from each
> other.** A determinism library that hides this behind a merge smiley is
> lying. This corpus makes the divergence *observable, attributed, and priced*
> — and pins exactly what the library does and does not promise.

---

## 1 · Scope and threat model

- A **writer** is an independent source of `inject()` ops (a researcher, a
  worker thread, a second experiment arm). The substrate and its journal are
  single-sequenced; multi-writer enters as *two journals applied to one
  substrate*, interleaved at tick boundaries (§4 of OLOG-SPEC).
- The danger is not nondeterminism — each peer's journal replays perfectly.
  The danger is **silent divergence**: peers A and B each hold a deterministic
  artifact, run the "same" experiment, and end with different physics, with
  nothing in the artifacts saying so. That is the failure this corpus prices.

## 2 · Envelope: writer tags and the canonical merge

Minimal additive extension (per OLOG §2 policy — additive ⇒ minor bump):

- Each op MAY carry `w` — writer id, integer ≥ 0. Omitted = writer 0
  (single-writer logs are unchanged and still olog `1`-compatible).
- `ologVersion: "1.1"`.
- **Canonical merge rule:** the union of journals sorts by the total key
  `(at, w, seq)` where `seq` is each writer's own array index. Intra-writer
  order is preserved (INV-2); inter-writer ties at a boundary resolve by
  writer id — an *arbitrary but deterministic* tiebreak, documented as such.
  It is an ordering rule, not an authority rule (§5).
- `mergeLogs([jA, jB]) → canonical op-log` is a pure function shipped by the
  library; `canonicalHash(view) := stateHash(replay(mergeLogs(view)))`.
  **Canonical hash is the convergence verdict**: same multiset of ops ⇒ same
  canonical hash, on every conforming stack.

Two equalities, deliberately distinct (this distinction is the corpus's spine):

| Equality | Definition | Answers |
|---|---|---|
| **Provenance equality** | `stateHash` of a journal (includes `opsHash`, §7.2) | "did the same *history* happen?" |
| **Semantic (hull) equality** | `cellsHex` + table hull + event streams equal | "did the substrate end in the same *state*?" |

Two interleavings of the same op multiset are **always** provenance-unequal
(different array order ⇒ different `opsHash`, by design) and *sometimes* hull-
equal. Both facts get pinned — a build that collapses either direction is red.

## 3 · The observability contract (what "not silent" means, testably)

When two views diverge, the library MUST emit a divergence report naming:
(1) the first differing tick boundary; (2) the first differing channel —
plane bytes, table hull, or event stream; (3) for table duels, the slot, both
competing ops, and which writer won under the ordering actually applied;
(4) both state hashes. Events (`eventsByTick`) are part of the record, not a
view afterthought — a duel whose winner is later erased still left a **term
witness** in the event stream (case mw-twin-witness; also EDGE-TESTS (f)).

## 4 · Cases

Every case: **name / pins / catches / sabotage**. Interleavings enumerated
exhaustively per case (2 writers ⇒ AB, BA, plus canonical); every run is
executed twice for self-determinism, per corpus law. Pins recorded at
suite-build time by machine, from the constructions below (validated against
the reference kernel this round where the physics is already expressible —
see PROBES-G2-2.out).

### mw-1 · `mw-commute-disjoint`
- **Pins:** INV-2; §4 rule 1 (array order = tiebreak); hull-vs-provenance
  distinction (§2 above). Construction: A writes `setTau`/`setD` on cells of
  the left half, B on the right half, same boundaries.
- **Catches:** builds that report arrival-order journals as *identical
  artifacts* (provenance collapse), or that reorder even commutative writes
  inside one boundary and change hulls (ordering bug).
- **Expected pin:** AB and BA are hull-EQUAL, provenance-DIFFERENT; canonical
  merges of both are provenance-EQUAL to each other.
- **Sabotage:** SAB-6 (opsHash out of digest) ⇒ AB vs BA silently identical ⇒
  the provenance-difference assertion goes red.

### mw-2 · `mw-lww-slot-duel`
- **Pins:** kernel R4 + A3 (LWW per slot); OLOG §3.8. Construction: A and B
  both `whWrite` slot 7 at boundary 1 with different `(x,y,resonance)`; an
  Abstain reader cell (d=7) ticks at boundary 2 and twin-fires — the event
  names the winner's coordinates.
- **Catches:** first-writer-wins builds; slot-union builds (two occupants);
  builds where the reader's event omits which write it heard.
- **Expected pin:** AB vs BA hulls differ in slot 7's tuple; `eventsByTick[1]`
  differs in the twin's source coords; canonical merge = writer-id order.
- **Sabotage:** first-writer-wins build ⇒ hull mismatch against pinned
  LWW winner ⇒ red.

### mw-3 · `mw-lww-cell-duel`
- **Pins:** §3.1/§3.4 (τ and byte paths); plane-overlap subtlety. Two duels:
  (i) `setByte` 0xFF vs 0x3F on one cell; (ii) A `setTau(τ=3)` vs B
  `setByte(0x3F)` — order-decisive *only because the byte's τ bits overlap
  A's write* (a same-cell duel on disjoint planes is a commutative case; the
  corpus pins both so nobody "fixes" commutativity by accident).
- **Catches:** builds that apply same-boundary ops out of journal order.
- **Sabotage:** boundary-order-shuffling build ⇒ duel (ii) flips ⇒ red.

### mw-4 · `mw-setoptions-duel`
- **Pins:** §3.10 + §4 rule 5 (sticky options, boundary timing); edges into
  EDGE-TESTS (d) (σ-leak family). Construction: at boundary 2, A journals
  `setOptions{σ:0.5}`, B journals `setOptions{σ:2}`; ticks 3+ run under the
  last-applied σ. Witness scaffold (twin pair + Repel d=1, probe P8) makes
  the σ regime **cells-visible** (…c6… vs …c8… end states) and **term-visible**
  (0.5·res vs 2·res tokens).
- **Catches:** sticky-σ mishandling; per-tick-override laundering (a build
  where the *engine's* option handling and the *journal's* disagree — P3's
  dual-path runs inside this case too).
- **Sabotage:** SAB-1 (σ-leak build) ⇒ σ regime extends past its boundary ⇒
  hull diverges from pinned ⇒ red.

### mw-5 · `mw-twin-witness` (the transient-divergence case)
- **Pins:** INV-3 + §8's "identical per-tick event stream" requirement;
  CRITIQUE F3 (kernel `lastEvents` single-slot — the reason events must be
  first-class in traces). Construction: duel slot 12 at boundary 1 (different
  targets); at boundary 2 **both** writers `whClear` slot 12 and both write
  the same byte over the reader cell — final hulls and hashes-of-hull
  coincide; but the tick-2 twin event recorded the boundary-1 winner's
  coordinates, so `eventsByTick` **differs forever**.
- **Catches:** builds whose TraceRecord omits or under-specifies
  `eventsByTick` — with events missing, this divergence is *invisible*: the
  corpus asserts the two event streams differ, and a view-less build cannot
  even represent the claim.
- **Sabotage:** build with kernel-style last-tick-only events ⇒ replay cannot
  reproduce tick-2 events ⇒ eventsHash mismatch ⇒ red.

### mw-6 · `mw-post-run-duel`
- **Pins:** §4 rule 3 (post-run ops at `at = tickCount` are journaled, hashed,
  never ticked). Construction: slot duel + cell duel at `at = tickCount`.
- **Catches:** builds that apply post-run ops but hash the pre-op state (or
  vice versa); event-stream-optional divergence detection (here events are
  empty after the last tick — **only hull + opsHash can witness**, pinning
  that the comparison law must not lean on events alone).
- **Sabotage:** hash-pre-op build ⇒ stateHash mismatch vs pin ⇒ red.

### mw-7 · `mw-seed-duel`
- **Pins:** §5 (seed = ops at `at:0`, single normative source). Three arms:
  (i) A `seedMulberry32(42)` vs B `setBytes(literal)` — order decides the
  entire plane; (ii) both `seedMulberry32(42)` — identical streams,
  order-insensitive, canonical == both arrivals (the benign twin, pinned so
  the corpus proves it *knows* when order does not matter); (iii) A seed
  42 vs B seed 43 at the same boundary — full divergence.
- **Catches:** builds that treat `at:0` ops as creation-only and ignore a
  second seed op; seed-domain regressions leak in from EDGE-TESTS (c).
- **Sabotage:** ignore-second-at-0 build ⇒ arm (i)/(iii) collapse to
  single-seed pins ⇒ red.

### mw-8 · `mw-lockstep-divergence` (the RC-05 anchor case; EDGE-TESTS (f))
- **Pins:** R4/A3; INV-3; §7.2 opsHash-inside-digest; corpus
  `sub-adjacent-lww-32x32` (kernel-side LWW trace). Construction: peers A and
  B, same dims, same `at:0` seed, lockstep ticks; mid-run each applies its own
  journal containing one slot duel; both then tick in lockstep to the end.
- **Catches:** silent convergence — any build where `peerA.stateHash ===
  peerB.stateHash` despite different journals (provenance collapse), or where
  the divergence report cannot name boundary + slot + competing ops + winner.
  The case pins the report as an expected artifact, not best-effort output.
- **Expected pin:** each peer self-replays byte-identical (recorded);
  `hashA ≠ hashB`; hulls differ; report names the duel.
- **Sabotage:** SAB-6 + an effect-masked duel (winner later overwritten by
  both peers identically) ⇒ hashes equal, report says "converged" ⇒ red —
  the receipt that `opsHash`-in-digest is load-bearing (library-craft's
  declared "least sure" choice, CRITIQUE self-assessment).

### mw-9 · `mw-convergence-canonical`
- **Pins:** the merge rule (§2). Construction: mw-1's op multiset in 6
  arrival orders (AB…BA interleavings); each peer computes `mergeLogs` +
  `canonicalHash`; all must agree, on all four stacks, and equal
  `replay(canonical)` byte-for-byte.
- **Catches:** merge nondeterminism — concretely: a C99 harness using
  `qsort` (not stable) on `at` alone can interleave same-`at` ops
  differently; a JS harness relying on engine sort quirks; a Python harness
  sorting tuples that compare floats natively. Cross-stack canonical-hash
  equality is the pin.
- **Sabotage:** C harness with unstable sort on `(at)` only ⇒ canonical
  order (and hash) differs across stacks ⇒ red.

**Generator note (CI):** a property generator extends the fuzzer (FUZZER-SPEC
§3) with a writer-count draw {1,2,3} and per-writer op streams; the same
comparison law (T0–T3) runs on all arrival interleavings vs the canonical
merge, with the *expected* relation (hull-equal iff commutative class,
canonical-equal always) checked rather than merely "no crash". Interleaving
space is enumerated exhaustively for ≤ 6 same-boundary ops (≤ 720 orders) and
sampled beyond.

## 5 · Reconciliation, scoped honestly

**The library guarantees:**
1. Per-journal deterministic replay on any conforming kernel (the entire
   op-log law — this is not weakened by multi-writer).
2. `mergeLogs` is pure and deterministic: the same multiset of ops yields the
   same canonical log and canonical hash, on every conforming stack (mw-9).
3. **Detection, always:** any two views' divergence is observable by hash
   comparison (provenance) and decomposed diff (hull, events) — divergence
   without an artifact is impossible by construction (mw-8; opsHash in the
   digest is what makes the masked case impossible).
4. The divergence report names the first boundary, channel, and (for duels)
   the competing ops and the winner under the ordering actually applied.

**The library explicitly does NOT guarantee:**
1. **Commutativity of concurrent injects.** LWW is order-sensitive by design;
   mw-2/3/4 pin the non-commutativity so nobody reads CRDT properties into
   an append-only journal. If the science needs commutative writes, that is a
   SPEC change (new op class), not a library patch.
2. **Fairness or authority.** Writer-id tiebreak is arbitrary-but-deterministic
   ordering, not a conflict-resolution policy. No vector clocks, no
   happens-before, no quorum: writer ids are labels, not authorities.
3. **Arrival-order equivalence.** Two peers that apply ops in arrival order
   *will* diverge from the canonical merge; the library detects this (their
   canonical hashes disagree until they exchange journals) — it does not
   prevent it.
4. **Convergence of *histories*, only of merged views.** Hull-equal endpoints
   with different journals remain different artifacts (mw-1's provenance
   difference is a feature: provenance is part of the state, §7.2).

**Non-goals:** merge-conflict resolution beyond canonical order; Byzantine or
trust models; network/partition semantics. The library is a determinism
substrate, not a distributed database.

## 6 · Format delta (g2-corpus-v2-mw)

- JSON: extends g2-corpus-v1 case shape with `writers: [ {id, ops:[…]} ]`,
  `arrivalOrders: [[…]]` (indices into the union), `canonicalOps`, and per-run
  pins: `selfDeterminism: "PASS ×2"`, per-order `{stateHash, cellsHex,
  tableHull, eventsHash, eventCounts}`, and the *expected relation table*
  (hull-equal / provenance-equal booleans per order pair).
- FLAT: `CASE mw-… / WRITERS 2 / ORDERS AB BA CANON / HASH-AB qth1:… / HASH-BA
  qth1:… / HULL-EQ 1 / PROV-EQ 0 / …` — the flat file keeps the eyeball-diff
  property corpus v1 has.
- Cross-impl columns: JS/C99/Rust/Python per order, same as v1's matrix.
- **P1 gate hook:** FUZZER-SPEC §9 item G2 requires ≥ 9 mw cases green ×4
  stacks before the RC-05 claim may flip.
