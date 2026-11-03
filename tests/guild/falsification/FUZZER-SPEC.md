# FUZZER-SPEC — the qthe cross-implementation differential fuzzer

**Seat:** falsification-bench (G2-2) · **Status:** design — no build this round
**Claim under test (RC-05, binding):** *op-log determinism is NOT YET PRICED.* The
existing 24-case corpus (g2-corpus-v1, 12/12 tick traces, four languages) prices
tick traces only. This document specifies the machine that prices the rest.
**Inputs consumed:** OLOG-SPEC.md (G1-2), api-surface.d.ts, CRITIQUE.md
(C1–C3, F1–F7, V1–V8), ADJUDICATIONS-G1 (RC-05, A2/A3/A4/A14), g2-corpus-v1,
qthe.mjs @ main (265 lines, re-fetched and probed this round — see
`PROBES-G2-2.mjs` / `PROBES-G2-2.out` in this directory).

> House law, restated as engineering: **a test that cannot fail is a defect; a
> harness without a sabotage run is unproven.** Every property in this spec
> carries a named sabotage. A fuzzer that has never been seen to go red on a
> known bug has zero evidentiary value, no matter how many green runs it has.

---

## 0 · Motivation: the corpus is term-blind (design-round finding F-0)

Probing the kernel against corpus v1 this round surfaced a structural gap that
the fuzzer must exist to close:

- Corpus cases pin `cellsN` and `evtCounts` — **bytes and event counts, never
  event `term` values.** In the kernel, σ enters physics only through the sign
  of `pressure = acc + resonance·σ` (R3); `nextD` moves d by ±1 on sign alone.
- Consequence, verified against the corpus itself: **`sub-twins-desert-sigma-half`
  (σ=0.5) and `sub-twins-desert-default` (σ=log2(3)) pin byte-identical
  `cellsN` (…e6…/…e7…) and identical `evtCounts` ([1,1,2]×13+…).** A kernel
  build that *ignores σ in the physics entirely* and only echoes the input σ
  into the digest's `sigma` field passes all 24 corpus pins.
- The σ-leak bug (CRITIQUE F1/V5) is likewise invisible to corpus v1: in
  minimal twin constructions the leak changes only `term` values, never bytes
  or counts (probe P2: terms `[5] [5] [5,5]` where `[5] [1.584…] [1.584…×2]`
  is correct — same event counts either way).

Therefore the comparison law below compares **event terms (bit-exactly)** and
the generator carries a **directed σ battery**, not just uniform random draws.
Uniform randomness does not find sign boundaries; directed values do.

---

## 1 · Architecture

```
                ┌───────────── fuzz-driver (TS, repo's own mulberry32) ─────────────┐
                │  generate → write oplog.json → fan out → collect verdicts →      │
                │  compare (law §4) → on divergence: shrink (ddmin) → repro bundle  │
                └───────────────────────────────────────────────────────────────────┘
   harness-js (anchor, @qthe/core)   harness-c99 (qthe_l1.c + replay) 
   harness-rust (olog crate)         harness-py  (cross-impl port)
```

- Each harness is a **CLI with one job**: read an op-log + tick count + dims
  from a file or stdin, emit a **verdict JSON** (§2). No shared code between
  harnesses beyond the spec — a shared library would let one bug hide in all
  four arms (the fuzzer would be comparing x with x).
- The JS harness is the anchor (it is the artifact @qthe/core ships), but the
  anchor has no special authority: comparison is **all pairs** (C(4,2)=6) —
  pairwise disagreement is reported even when JS agrees with a majority.
- Budget guard: dims·ticks capped (e.g. 64×64×64) so CI time is a function of
  iteration count, not of an unlucky 4096-cell draw.

## 2 · Verdict protocol (olog-fuzz verdict v1)

```jsonc
{
  "harness": "js|c99|rust|py", "ologVersion": "1",
  "inputHash": "sha256 of the op-log bytes",      // binds verdict to input
  "ok": true,                                       // false ⇒ "errors" non-empty
  "stateHash": "qth1:…",                            // OLOG §7.2, whole law in one string
  "cellsHex": "…", "ticks": T, "sigmaToken": "1.584962500721156",
  "table": [[slot,x,y,resonance],…],                // the hull, decomposed
  "opsHash": "…",                                   // journal seal
  "eventCounts": [n₀,…,n_{T-1}],
  "eventsHash": "sha256(canonical events, term as u64 bits)",  // cheap mode
  "eventsByTick": [[…]],                            // full mode only (shrunk repros)
  "termBits": ["0x3ff…", …],                        // u64 hex, full mode
  "digestInput": "<exact canonical JSON of D>",     // §7.2 — the T3 check
  "errors": [{ "opIndex": 7, "code": "E_OP_BOUNDS" }]  // fail-closed mode
}
```

Numbers that must never be formatted natively cross-language (see §5) cross as
integers, hex bit patterns, or strings. `digestInput` is the only place a
float token appears, deliberately — it *is* the canary probe embedded in every
verdict.

## 3 · Generator grammar

Seeded PRNG: the repo's own `mulberry32` chain (determinism about
determinism); the seed and every choice are logged, so any run is re-playable
by seed alone. Reproduction = `{seed, iterationIndex}`.

### 3.1 Dimensions (G-DIM)

Weighted battery, not uniform: {8×8, 16×16, 32×32 heavy; 13×7, 7×13
non-square; 64×64 rare; **degenerate battery 1×1, 2×2, 1×4, 4×1, 1×64, 2×1,
3×3, 5×7 mandatory share ≥ 15%**}. Rationale: A14/corpus
`sub-degenerate-2x2`, `sub-degenerate-1x4` — degenerate tori are where
neighbor multiplicity, self-neighbors, and the self-twin guard interact; a
uniform dim draw almost never lands there.

### 3.2 Tick count (G-TICK)

{0, 1, 2, 3 heavy; 8, 16 moderate; 40, 64 rare}. `tickCount=0` exercises pure
op application + post-run ops (OLOG §4 rule 3).

### 3.3 Op stream (G-OPS)

A valid stream is grown boundary by boundary: maintain current `at` (starts 0,
monotone per §4 rule 2), advance by a random gap ≤ 3, cap at `tickCount`
(post-run ops generated with fixed probability). Op mix (weights tuned after
first 10⁴ iterations by coverage feedback — each op family must appear in ≥5%
of iterations):

| Op | Weight | Directed fillips |
|---|---|---|
| `setTau` / `setD` / `setCell` / `setByte` | 10–12% each | collisions on the SAME cell within a boundary (order significance, §4 rule 1) |
| `setBytes` | 6% | exact-fit blocks; w-stride on 1×N tori |
| `fillRect` | 10% | full-grid, 1-wide rows/cols, the XOR-violation shapes go to the invalid stream |
| `seedMulberry32` | 8% | both flags, either flag; seeds from {0, 1, 2³²−1, random}; out-of-domain seeds → invalid stream |
| `whWrite` | 14% | **same-slot duels** (two writes, one slot, same boundary); resonance 0 (present-but-inert, §3.8); self-pointing slots on degenerate tori |
| `whClear` | 6% | with and without `slot` (§3.9: whole-table clear resets totalWrites) |
| `setOptions` | 10% | σ from the battery §3.4; `wormholes:false` toggles mid-run |

Two **scaffolds** injected with fixed probability (they construct mechanisms
that random bytes rarely sustain):
- **Desert scaffold** (p=0.3): empty grid + surgical ops placing a twin pair
  (two Abstain cells, equal d) — the resonance=1, acc=0 regime of edge (a).
- **Witness scaffold** (p=0.2): twin pair + one Repel d=1 neighbor (acc=−1) —
  makes σ *magnitude* cells-visible (probe P8: σ=0.5 ends `…c6…`, σ=2 ends
  `…c8…`, same seeds).

### 3.4 σ battery (G-SIGMA) — directed, 40% of σ draws

`{0, 0.25, 0.5, 0.75, 1, 1.584962500721156, 2, 3, 4, 5, −1, 0.1, 1e-7, 1e20,
1e21, 4.9e-324, −0.0, 0.3333333333333333, 9007199254740992}` + uniform
continuous otherwise. NaN/±Infinity go to the **invalid stream** (JCS throws
on non-finite, OLOG §7.1). Spec gap flagged: OLOG §3.10 names no σ domain; the
fuzzer treats the domain as "all finite binary64" and files a spec question if
implementations disagree. σ<1 draws are over-represented on purpose: the
truncation-vs-float edge (a) lives exactly at σ<1 × resonance=1.

### 3.5 Invalid stream (G-BAD) — the fail-closed arm

Each iteration optionally generates an *invalid* op (a second op-log):
out-of-domain seeds {−1, 2³², 2³²+5, 1.5, "5"}; decreasing `at`; `at` >
tickCount; `at` < 0; tau=4; d=64; c=256; ragged/short/overflowing `setBytes`;
`fillRect` with both `byte` and `tau+d`, with neither, or off-grid;
`whWrite` slot 64 / resonance −1 / resonance 1.5 / off-grid coords; `setCell`
with neither field; unknown op name; non-integer coords; `ologVersion:"2"`;
σ=NaN. Expected: **identical error codes in all four harnesses** (P6).

### 3.6 Dual-path construction (G-DUAL) — journal vs engine

With p=0.25 an iteration runs the same schedule two ways: (i)
`replayTrace(oplog)` and (ii) live `Substrate` + `inject()` at each boundary +
`tick()` between, then `trace()`. These must agree byte-for-byte (P4). This is
the property that would have caught the engine/replay drift class (§4 rule 5
ambiguity, edge (d)) without any cross-language effort at all.

## 4 · Comparison law (what "the same" means — tiered)

| Tier | Compares | Why it exists / what only it can catch |
|---|---|---|
| T0 | `stateHash` (string equality, all pairs) | The whole law in one comparison. Any tier-1–3 divergence must surface here or the digest is incomplete (sabotage SAB-6). |
| T1 | Decomposed: `cellsHex`, `table` hull tuples, `ticks`, `opsHash` | Diagnosis: names *which* channel diverged (plane vs table vs journal seal). |
| T2 | `eventCounts` + full event tuples; `term` compared as **raw u64 bits** (`termBits`) | The F-0 fix: event terms are the only witness for σ regimes that preserve pressure signs (P2, P8). `term = resonance·σ` is one IEEE multiply of an integer by a pinned double → bit-exact across stacks *if* σ is the same double (§5). |
| T3 | `digestInput` — the exact canonical JSON of D (§7.2) | Number-serialization conformance. A Rust `Display`, a Python `repr`, a C `%.17g` all deviate from JCS on the battery values (receipts §5.2). This tier is the canary embedded in every iteration. |

Order of authority per INV-3: T0 mismatch is the failure; T1–T3 explain it.
A T1–T3 divergence with T0 agreement is itself a **bug report against the
digest recipe** (something observable is not sealed in).

## 5 · The float-serialization canary (Ruling S)

### 5.1 The decision

Two options were on the table. **(A) Exchange native floats.** Rejected:
shortest-round-trip decimal formatters disagree across the four stacks — in
thresholds (`1e21` → JS `"1e+21"`, Rust serde_json `"1e21"`, Python
`repr(1e20)` = `"1e+20"` where JS prints `"100000000000000000000"`), in form
(Python `1e-07` vs JS `1e-7`; Rust `"-0.0"` vs JCS `"-0"`→`"0"`), and in
digits (C `%.17g` prints `0.10000000000000001`). Parse-side is *not* the
problem — `float()`, `f64::from_str`, `strtod`, `JSON.parse` are all correctly
rounded; the receipt run this round shows **identical bits, different tokens**
(JS vs Python, 16 battery values). **(B) Register σ as exact rational + plane
tag, integers everywhere else.** Half-impossible: the default σ = log2(3) is
**irrational** — no p/q registry can express it, and computing `log2(3)` at
runtime is libm-dependent (not correctly-rounded in general) so the default
double itself would be platform luck.

**Ruling S (adopted):**
1. Ops carry **only integers**, with the single exception of `setOptions.sigma`
   (already OLOG §7.1 law). The fuzzer enforces this as property P5.
2. σ crosses language boundaries **as its JCS token, parse-only**: every
   implementation obtains the double by correctly-rounded parsing of the
   canonical decimal token; **no implementation may compute σ** (no
   `log2(3)`, no `p/q` division) — `DEFAULT_SIGMA` is a pinned compile-time
   constant whose value is the token `"1.584962500721156"` (bits
   `0x3ff95c01a39fbd68`, receipt this round). Rational inputs are a
   *generator-side* convenience that must be normalized to the token before
   journaling.
3. Each stack ships a **JCS-conformant number serializer** (not its native
   formatter) for everything that feeds a digest or a verdict. The canary is
   that serializer's conformance test.
4. **−0 is sanctioned to normalize to +0** across the exchange (JCS token
   `"0"`, reparse bits `0x0…0`). Kernel physics is ±0-identical (`nextD`
   compares sign only); property P7 pins that separately so no build ever
   *relies* on the difference.

### 5.2 Canary battery and path

Path: **TS → JSON file → Rust (parse + re-serialize) → JSON file → TS**,
then bit-compare round-trip against the original; plus the same loop through
C99 and Python (each pair in the ring). Checks per value: (i) parse → exact
bits (except the pinned −0 rule); (ii) serialize → exact JCS token; (iii) the
value re-parsed in the *next* stack → same bits.

| value | JCS token | bits (u64 hex) |
|---|---|---|
| 0.5 | `0.5` | 3fe0000000000000 |
| 1.584962500721156 | `1.584962500721156` | 3ff95c01a39fbd68 |
| 0.1 | `0.1` | 3fb999999999999a |
| 5e-324 | `5e-324` | 0000000000000001 |
| 1.7976931348623157e308 | `1.7976931348623157e+308` | 7fefffffffffffff |
| −0.0 | `0` (normalizes) | 0000000000000000 after exchange |
| 1e21 | `1e+21` | 444b1ae4d6e2ef50 |
| 1e20 | `100000000000000000000` | 4415af1d78b58c40 |
| 1e−7 | `1e-7` | 3e7ad7f29abcaf48 |
| 1e−6 | `0.000001` | 3eb0c6f7a0b5ed8d |
| 2⁵³ | `9007199254740992` | 4340000000000000 |
| 0.3333333333333333 | `0.3333333333333333` | 3fd5555555555555 |
| 123456789012345678901 | `123456789012345680000` | 441ac53a7e04bcda |
| 0.25, 2 | `0.25`, `2` | 3fd0000000000000, 4000000000000000 |

(Tokens and bits machine-verified this round, node v24.22.2 + CPython; the
Rust/C columns are what the canary *fills in* at build time — expected
deviants: serde_json `1e21`→`"1e21"`, Rust Display `"-0.0"`, C `%.17g`
`"0.10000000000000001"`. The canary exists to make those deviants **red**.)

| Canary test | Name | Pins | Catches | Sabotage |
|---|---|---|---|---|
| Ring round-trip | `canary-float-ring` | Ruling S; OLOG §7.1 | any stack whose serializer/parse pair is not bit-stable on the battery | SAB-5 |
| Token table | `canary-float-tokens` | table §5.2 | native-formatter bleed-through per stack (each deviant token named) | SAB-5 |
| σ-only-float invariant | `canary-ops-integer-only` | INV-1; §7.1 | a float sneaking into any non-σ field of any generated op (fuzzer-side structural scan, all iterations) | mutate generator to emit `d: 12.0` |
| ±0 physics | `canary-zero-sign` | Ruling S.4 | a build where σ=−0 vs +0 changes bytes or event terms | build comparing `Object.is(x,-0)` in pressure |

## 6 · Properties (each is a test, not a hope)

| # | Property | Statement | Pins | Catches | Sabotage |
|---|---|---|---|---|---|
| P1 | replay purity | `replayTrace(t)` twice, same build ⇒ identical hash + eventsByTick | OLOG §6 | nondeterministic replay (map order, uninitialized memory in C, HashMap iteration in Rust) | build using HashMap iteration for table hull |
| P2 | cross-impl equality | all-pairs T0–T3 equality on every valid iteration | RC-05; §6 | any semantic divergence between the four stacks | SAB-1…SAB-6 |
| P3 | dual-path equivalence | journal replay ≡ live engine run (G-DUAL) | INV-3; §4 rule 4–5 | engine/replay drift; per-tick-override laundering (edge d) | SAB-1 |
| P4 | trace re-serialization | `replayTrace(t).substrate.trace()` re-hashes to `t.stateHash` | §6 properties | view/record drift | build whose `trace()` drops post-run ops |
| P5 | integer-only ops | no non-integer number in any op except `setOptions.sigma` | INV-1 | float creep into coordinates/bytes (the C2 coercion family) | generator emitting `x: 2.0` |
| P6 | fail-closed parity | every G-BAD op throws; **same error code in all four harnesses** | INV-4; api-surface codes | permissive validation in one stack (wrap/mask/clip — CRITIQUE C2) | SAB-2 |
| P7 | ±0 equivalence | σ=+0 and σ=−0 produce identical bytes, counts, and term tokens | Ruling S.4 | sign-of-zero dependence | `Object.is` pressure build |
| P8 | snapshot round-trip | `restore(s.snapshot()).hash() === s.hash()` at every checkpoint (checkpoints forced after table-heavy segments so the hull is non-empty) | api-surface law; C1 | plane-only or stale-table snapshots (repo attack A2) | SAB-3 |
| P9 | unjournaled-nothing | mutate one op in a green log (drop / flip / reorder-same-boundary); T0 must change OR the mutation is provably effect-masked and `opsHash` must still change | §7.2 opsHash design note | a digest that cannot distinguish histories (library-craft's open doubt, CRITIQUE self-assessment) | SAB-6 |

## 7 · Sabotage matrix (the harness's own proof of life)

Each sabotage is a build flag (`--sab=N`) on a harness, seeded with a real,
adjudicated bug. CI runs the suite and requires **every sabotage to produce
its predicted red**. A sabotage that stays green is a CI failure of the
*harness*, and blocks merge. Sabotage artifacts are never merged; they live
behind the flag, one per known bug, deleted only when the bug class is
impossible by construction.

| # | Seeded bug (receipt) | Generator mode that aims it | Predicted red |
|---|---|---|---|
| SAB-1 | σ-leak: per-tick override persists via lazy table (CRITIQUE F1/V5; probe P2 this round) | G-DUAL + witness scaffold + mid-run σ overrides | P3 red (live ≠ replay) on termBits and/or cells; also edge (d) live probe |
| SAB-2 | seed aliasing: `seed >>> 0` wrap accepts out-of-domain seeds (CRITIQUE C2/V3; probe P1: `mulberry32(2**32+5)() === mulberry32(5)() === 0.6897749109193683`) | G-BAD seeds {−1, 2³², 2³²+5} | P6 red: sabotaged harness returns `ok` / wrong code instead of `E_CODEC_PRNG_SEED` |
| SAB-3 | plane-only snapshot: table omitted (repo determinism attack A2; C1) | P8 checkpoints after whWrite duels | P8 red: restored hash ≠ original; subsequent tick drops twin events (eventsHash) |
| SAB-4 | mulberry32 draw order d-then-τ (OLOG §3.7 recipe violation) | any `seedMulberry32` with both flags | T1/T2 red on all pairs (bytes + events), first divergence at the seed op |
| SAB-5 | native float formatter (Rust `Display`/serde_json default) instead of JCS serializer | σ battery §3.4 | T3 red at `1e21`/`1e20`/`−0.0`/`5e-324` (token mismatch, bits equal); canary `canary-float-tokens` names the stack |
| SAB-6 | digest excludes `opsHash` | P9 mutation mode with effect-masked ops (setTau then setByte same cell) | P9 red: mutation undetected; multi-writer case `mw-lockstep-divergence` red (histories claim one hash) |

**Sabotage run law:** the per-push job runs SAB-1…6 and asserts red-with-
signature; nightly re-runs them after any harness change. New known bugs get
a SAB row before they get a fix — the fix's PR must show the sabotage going
green *and* staying greppable in history.

## 8 · Shrinker and corpus promotion

On divergence: ddmin over the op array (preserving `at` monotonicity), then
tickCount, then dims; re-run the failing pair per step; stop at irreducible
(1 op, or a 2-op duel). Output: `repro/NNN/{oplog.json, verdicts/*, seed,
shrink-log}` → falsification-bench review → pinned as a corpus case
(g2-corpus-v2) with the ambiguity it pins named per charter law. **A divergence
that cannot be reproduced from the bundle is treated as a harness bug, not a
kernel bug** — no phantom findings.

## 9 · CI gate shape and the P1 exit gate

**Per push (blocking, ≤ 10 min):** corpus replay v1+v2 (all stacks) · fuzz
smoke 2,000 iterations (star + all-pairs, seeded by push id) · canary battery ·
sabotage suite SAB-1…6 (must be red) · edge suite (EDGE-TESTS.md).

**Nightly (≤ 60 min):** 200,000 iterations, full matrix, shrinker on call,
repro bundles retained 90 days, budget-capped. Seed = date, so every nightly
is re-playable.

**Pricing rule (RC-05):** op-log determinism is PRICED when **all** of the
following hold, and is demoted back to NOT PRICED by any unexplained
divergence (counter resets to zero):

- [ ] **G1 · Corpus:** canary corpus (24 v1 cases + §7.3 vector + edge pins + multi-writer cases) replays green on JS, C99, Rust, Python — per push, zero flakes.
- [ ] **G2 · Multi-writer:** g2-corpus-v2-mw ships ≥ 9 cases (MULTIWRITER-CORPUS.md), each green ×4 stacks; every "expected divergence" case pins the hash *pair*.
- [ ] **G3 · Edges:** all six pinned edges (a)–(f) + the term-witness edge green, **each with a recorded sabotage-red receipt** (suite-build round).
- [ ] **G4 · Volume:** ≥ 10⁶ cumulative nightly fuzz iterations with zero unresolved cross-stack divergence.
- [ ] **G5 · Streak:** 14 consecutive clean nightly runs (no unexplained red, no skipped stack).
- [ ] **G6 · Sabotage:** SAB-1…6 all demonstrably red against the current build (harness proven alive).
- [ ] **G7 · Canary:** float ring bit-stable on the full battery, all stacks, including the −0 normalization pin.
- [ ] **G8 · Fail-closed:** G-BAD matrix throws identical error codes in all four harnesses.
- [ ] **G9 · Stranger check:** corpus replayed end-to-end on a non-Guild machine by a second person; receipt filed (the "checkable by a stranger" bar, OLOG §1).
- [ ] **G10 · Claim flip:** README's RC-05 line changes to "op-log determinism: PRICED (receipt link)" only after G1–G9, with the receipt chain linked.

## 10 · Non-goals (honest)

No performance fuzzing, no coverage-guided mutation of the *kernel source*
(the op-log grammar is the mutation surface, by design), no concurrency
fuzzing (the op-log is single-threaded by construction; multi-writer is
interleaving generation, not thread scheduling), no formal proof claims —
this is a falsification machine, and it says so.
