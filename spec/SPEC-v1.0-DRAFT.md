# QTHE SPEC v1.0 — DRAFT (G2-1 standards-warden fold)

**Stamps.** Spec version: `SPEC-v1.0` (this document). Supersedes `SPEC.md@main`
as of 2026-11-02, preserving its structure and honesty split. Reference kernel:
`qthe.mjs @ b6953269d15df0fd1942d68d71fd755c16b7bd26` (float plane). Oracle:
corpus `g2-corpus-v1` (24 cases, float plane, self-determinism PASS — every
case run twice, byte-identical). Conformance law: **replay the corpus
byte-identical or divergent — no third option.**

Lineage: v1.0 folds the reference kernel's interpretation receipts R1–R7
(`qthe.mjs` header), the repo's ambiguity ledgers (`crossimpl/AMBIGUITY.md`:
py-lane A1–A10 + findings F1–F3, Rust-lane A-R1–R3), the Guild's independent
re-derivation ledger (kernel-forge G1-1: A1–A17), and the Orchestrator's G1
adjudications (`ADJUDICATIONS-G1.md`) into normative text. Every ambiguity is
closed inline and in the N-appendices (§6); the ledger status is §8.

---

## 0. STRANGER PREFACE

This specification governs the QTHE substrate — the one-byte primitive and the tick
semantics that evolve it — as a **byte-exact conformance contract**: you are conformant
when you replay `corpus/g2-corpus-v1.json` (24 cases; JSON and `.flat` formats) with
identical final planes, per-tick twin-event counts, and event totals. Read the layers by
their honesty split: LAYER 0 = algebra facts you can exhaust; LAYER 1 = mechanism you can
implement exactly — **every fork is closed by a normative sentence, referenced (N#)**;
LAYER 2 = priced empirical claims — history, not contract. Receipts live where they were
minted: R1–R7 in the `qthe.mjs` header; ambiguity ledgers in `crossimpl/AMBIGUITY.md`
and `seats/kernel-forge/work/G1-1/AMBIGUITY.md`; adjudications in `ADJUDICATIONS-G1.md`;
the plane law in `fixedpoint/COST-OF-EXACTNESS.md`. The two rulings that killed the last
spec-only re-derivation (G1-1 diverged on 2 of 17 forks) are **N1** and **N2** — read
them first. The normative tick algorithm (§3.4) is the contract in executable form: a
direct transcription reproduced all 24 corpus cases byte-exact at drafting time (G2-1
verification model, python; counterfactual witnesses for every closed fork in §6).

---

## 1. THE PRIMITIVE

One byte, two planes — data is geometry, control is physics:

```
bit:   7  6  5 4 3 2 1 0
       [τ:2][  d:6        ]
```

- `d = c & 0x3F` — the spatial-amplitude coordinate, `[0, 63]`
- `τ = c >> 6` — the timbre / operator state, `{0, 1, 2, 3}`
- **Normative (N16):** `pack(τ, d) = ((τ & 3) << 6) | (d & 63)` — on the
  in-contract domain `τ ∈ {0..3}, d ∈ {0..63}` this is `(τ << 6) | d`, the exact
  inverse of unpack for all 256 byte values (corpus `l0-codec-all256`).

| τ | name | operator Ψ(τ) | substrate action |
|---|------|--------------|------------------|
| 0 | Ground | `0` | static anchor; data is baseline coordinate |
| 1 | Attract | `+1` | forward cascade; amplifies the path |
| 2 | Repel | `−1` | inversion layer; reverses phase in aggregation |
| 3 | **Abstain** | `i` | **the Looking Glass** — bypasses local weights, bridges via the wormhole table |

**Normative (py-A2):** `Ψ(3) = i` is the operator *character* — notation. In every
computed channel the arithmetic coefficient of a τ=3 term is exactly **+1 into the
imaginary channel** (never −1, never conjugated). "Bypasses local weights" describes
the Abstain cell's *contribution* to other cells' real accumulators (zero) and its
routing via the wormhole bridge — it is **not** an exemption from receiving
neighborhood pressure (N4).

---

## 2. LAYER 0 — ALGEBRA FACTS (exhaustively testable)

1. **Pack/unpack bijection**: `c ↦ (τ(c), d(c))` is a bijection onto
   `{0..3} × {0..63}`. Round-trip exact for all 256 values.
   *Testable:* corpus `l0-codec-all256` (256/256).

2. **Bounds invariance** (the gifted Coq theorem, restated as a testable claim):
   every update rule maps `[0,63] → [0,63]`. The house proves this by
   *exhaustion*: all 4 × 64 states, all rules, no exceptions. **Normative (N6):**
   this claim is true *because* the tick's only inputs are the cell byte and the
   pre-tick snapshot — there is no persistent accumulator or hidden channel state
   outside the byte (any such state would falsify the exhaustion claim as stated).

3. **Split channels**: a QTHE vector pass over inputs `x_k` computes

   ```
   y_j = Σ_k Ψ(τ(w_jk)) · d(w_jk) · x_k
       = y_j^R + i·y_j^I

   y_j^R = Σ_{τ=1} d·x_k  −  Σ_{τ=2} d·x_k      (real channel)
   y_j^I = Σ_{τ=3} d·x_k                          (imaginary channel)
   ```

   Ground (τ=0) contributes to neither channel even when d > 0 (py-A10,
   already-clear). This is exact integer arithmetic — **no floats in LAYER 0**.
   **Normative surface (N16):** `vectorPass(weights, xs)` takes a J×K rectangular
   byte matrix (every row length = `len(xs)`) and length-K integer inputs, and
   returns one integer pair `(yR, yI)` per row — no bias, no activation, no
   clamping (py-A6); K=0 yields `(0, 0)` per row, J=0 yields empty (py-A9); the
   mutual-conformance bound is `max |y_j| < 2^53` (within it every exact
   implementation agrees byte-for-byte; wider carriers — i64, bignum — remain
   conformant and exact beyond, but values past the bound are outside the
   cross-language surface — finding F1). Out-of-contract inputs — ragged rows,
   weights outside [0,255], non-integer `x_k` — are **outside the conformance
   surface**: the reference masks, a porter may raise; no corpus case
   distinguishes (findings F2/F3, scoped out here).
   *Testable:* corpus `l0-vectorpass-1` (all four timbres, signed xs),
   `l0-vectorpass-2` (all-Abstain row, negative imaginary result),
   `l0-vectorpass-3` (wide row, magnitudes to ±1000).

---

## 3. LAYER 1 — MECHANISM (implementable exactly, determinism testable)

### 3.0 The bridge scale σ (N3, N15)

σ is the bridge-scale parameter: a positive real, **default log₂(3) =
1.584962500721156**. The σ in force for a tick is the explicit per-tick σ if
supplied, else the persistent table's σ, else the default. (Hazard, receipted
G1-2: the reference's lazy default table persists with its construction σ, so a
one-tick σ override can leak into later ticks — documented reference behavior;
replay runs must supply σ explicitly, as every corpus case does.) Arithmetic
discipline and the two-plane law: **N3** and **N15**.

### 3.1 Item 4 — the 64-slot wormhole table

**The 64-slot wormhole table** (the compile-time blueprint — static declarative
allocation, zero runtime discovery). When a cell in Abstain state carries data
value `d` (its **pre-tick** d, N5):

- it **reads slot `d` LIVE** (N1): a write performed by an earlier cell this
  same tick is already visible. If the slot is occupied by a *different* (x, y)
  with nonzero resonance → **twin resonance**: the term
  `resonance · σ` (N3) is **added to the pressure whose sign moves d** (N2).
- it then **writes its own `(x, y)` and `resonance = |real_acc| + 1`** to slot
  `d` — immediately, taking effect the instant it is performed (N1); same-slot
  collisions resolve **last-writer-wins in row-major order** (N8); the written
  `real_acc` is the **pre-twin** accumulator (N12). The write happens on every
  Abstain visit, twin or no twin (N12).
- the table **persists across ticks**: unwritten slots keep their entries
  indefinitely (N7); only Abstain cells interact with the table — a non-Abstain
  cell neither reads nor writes it (N8); with wormholes disabled
  (`wormholes: false`, the paired-arm OFF switch) the table is never touched
  (corpus `sub-twins-noise-off`).
- the inherited phrase "for the next tick" is **withdrawn as a table-lifecycle
  rule**; it governs only the writing cell's own visibility (N1).

### 3.2 Item 5 — neighborhood update (Moore-8)

Attract neighbors add `d`, Repel neighbors subtract `d` into the cell's real
accumulator; Ground and Abstain neighbors contribute 0 to the real accumulator.
**Every cell computes this accumulator — Abstain cells included** (N4) —
**recomputed each tick from the pre-tick snapshot** (N6), over the **toroidal
Moore-8** neighborhood (R1) with **all 8 offsets evaluated independently under
pure modular wrap** — on degenerate tori (w or h ≤ 2) offsets revisit cells, a
cell can be its own neighbor, and every visit counts (N10). The cell's own data
moves under the sign of pressure (real accumulator, plus the twin term when one
fired — N2): net-positive → `min(d+1, 63)`; net-negative → `max(d−1, 0)`;
net-zero → unchanged (N9). **τ never changes during tick** — only d moves; τ is
written only by constructors and injectors outside tick (N9).

### 3.3 Item 6 — determinism

Same initial substrate + same tick count → byte-identical trace, always. The
kernel is seed-to-hash reproducible; every experiment seals its trace hash into
a stone-v1 receipt chain. **Normative (N14):** the trace view, its
canonicalization (stone-v1 canonical JSON: recursively key-sorted, no
whitespace), and its hash (sha256) are specified in N14; the trace records
wormhole *state*, never the wormholes enable flag (R7).

### 3.4 THE NORMATIVE TICK ALGORITHM

This algorithm is the conformance contract in executable form. A direct
transcription reproduced all 24 corpus cases byte-exact at drafting time (G2-1
verification model; counterfactual witnesses per fork in §6).

```
tick(S):                                     # mutates S in place AND returns S (N11)
  snapshot ← copy of S.cells                 # ALL grid reads use snapshot (N6)
  events ← []                                # this tick's twin records (N13)
  for y in 0..h−1:                           # row-major scan (N1)
    for x in 0..w−1:
      (τ, d) ← unpack(snapshot[y·w + x])
      acc ← 0
      for each (dy, dx) in {(−1..1)²} \ {(0,0)}:          # 8 offsets, each visit counts (N10)
        (τn, dn) ← unpack(snapshot[((y+dy) mod h)·w + ((x+dx) mod w)])
        if τn = 1: acc ← acc + dn
        if τn = 2: acc ← acc − dn            # τn ∈ {0,3}: contributes 0 (N4)
      pressure ← acc
      if τ = 3 and wormholesEnabled:
        hit ← table[d]                       # LIVE read, keyed by pre-tick d (N1, N5)
        if hit ≠ empty and hit.resonance ≠ 0 and (hit.x, hit.y) ≠ (x, y):   # N8
          term ← hit.resonance × σ           # ONE correctly-rounded binary64 multiply (N3)
          pressure ← acc + term              # the twin term is REAL feedback (N2)
          events ← events ∪ {kind:"twin", x, y, slot:d, resonance:hit.resonance, term}  # N13
        table[d] ← (x, y, |acc| + 1)         # immediate write, pre-tick d, LWW (N1, N5, N8, N12)
      if pressure > 0: d′ ← (d + 1) if d < 63 else 63                        # N9
      elif pressure < 0: d′ ← (d − 1) if d > 0 else 0
      else: d′ ← d
      S.cells[y·w + x] ← pack(τ, d′)         # τ frozen (N9)
  S.ticks ← S.ticks + 1
  # the table persists untouched (N7); `events` becomes this tick's telemetry (N13)
```

Substrate construction and the replay contract: **N11** (`seedFn(x, y, i)`,
row-major; the replay contract carries initial planes as bytes — corpus
`cells0` — never as seed functions).

### 3.5 Item 7 — A2UI telemetry mapping (NON-NORMATIVE)

τ=1 green, τ=2 red, τ=0 ground gray, τ=3 purple blinking on wormhole activity —
pixel = cell, 6-bit value = intensity, no log files, direct buffer-to-canvas.
This is a display convention, not part of the conformance contract.

---

## 4. LAYER 2 — PRICED EMPIRICAL CLAIMS (history, NOT conformance)

Every claim below is priced with a receipt; mechanism-level explanations live in
`docs/CLAIM-VERDICTS.md`. None of this section is normative.

| # | claim | verdict (receipt) |
|---|-------|-------------------|
| C1 | 25% gain of function, intra-cell timbre vs inter-cell porting | **LIVES — 47.40% bytes-gain** (E-Q13, tip `d852e6ac…`; cached-port caveat mandatory, RC-09) |
| C2 | wormhole (Abstain) beats graph-traversal for non-local alignment | **LIVES — 8/8 ON vs 0/20 OFF** (E-Q1, tip `addc22f9…`); mechanism = N1+N2 |
| C3 | σ = log₂(3) is the critical bridge scale | **DIES (honest null, formation-scoped)**; scope: completion scales ~1/σ (E-Q16-B) (E-Q2, tip `67e849a5…`) |
| C4 | phase threshold θ > π/4 triggers useful non-local transfer | **DIES** (E-Q7, tip `befa0c33…`) |
| C5 | the substrate self-repairs (armor-ring) | **DIES — ring self-dissolves; no repair term exists** (E-Q5, tip `4425545f…`; corpus `sub-ring-erode-16x16` is the mechanism witness) |
| C5′ | repair via injector (one-pager spec) | **STANDS — definitional** (E-Q10, tip `50ddf5f9…`) |
| C9 | hierarchical wormholes (8×8+8 fold) restore provenance under load | **DIES with prejudice — 11× worse than flat clean** (E-Q18, tip `fe059a2e…`) |
| C10 | qthe-docket reduces starvation vs FIFO+static priority | **DIES on H1; H2 flood-cap LIVES structurally** (E-Q19, tip `568bfef3…`) |
| C11 | tick operator is a construction-provenance blindfold by tick 64 | **DIES on H2 (spatial correlation slow mode); H1 LIVES** (E-Q20, tip `a310f37e…`) |

House law: a claim that dies, dies cheap and honest, with the receipt kept beside
the body; a claim that lives gets a mechanism-level explanation.

---

## 5. FLEET DISCIPLINE

- **Stone-v1 receipts**: every experiment run seals its parameters + trace hashes
  into a stone-v1 chain. A receipt without a chain is a rumor.
- **Determinism or it didn't happen**: any experiment whose re-run changes a byte
  is void.
- The tavern, round 10+ (eight competing guests; nothing a guest says counts
  until verified against the repository): relegated to lore; see
  `situations/arena_r10_verdict.md`.

---

## 6. NORMATIVE APPENDICES

One numbered ruling per settled ambiguity. Each carries: the normative
sentence(s), the motivating receipt, and the corpus cases that pin it
executably. Counterfactual witnesses were run at drafting time (G2-1): flipping
the ruling diverges from the corpus on the named cases. **Never re-open a closed
fork without a T-BREAKING upgrade (§7).**

---

### N1 — Wormhole reads are LIVE, row-major (closes A1; receipts R2, ADJUDICATIONS-G1)

**Normative.** Within a tick, cells are processed in row-major order (y = 0…h−1
outer, x = 0…w−1 inner); wormhole reads are **LIVE** against that order — a slot
write performed by an earlier cell this tick IS audible to a later same-tick
reader, and writes take effect the instant they are performed — while the grid
is read only from the pre-tick snapshot (N6); the inherited phrase "for the next
tick" governs solely the writing cell's own visibility (its write is never
audible to its own same-tick read, because its read precedes its write, and the
N8 self-guard blocks its own entry on every later tick).

**Receipt.** R2 (`qthe.mjs` header); ADJUDICATIONS-G1 — the #1 divergence of the
G1-1 spec-only re-derivation (seat chose staged snapshot reads; both readings
were defensible from the inherited text — this sentence kills the fork).

**Corpus.** `sub-adjacent-lww-32x32` (three same-d Abstain writers at (5,5),
(6,5), (25,12); tick 1 emits **2** events — a staged table emits **0**
[counterfactual: staged reads give evtCounts 0,2,0,… vs corpus 2,2,2,3,…]);
`sub-twins-desert-default` (tick 1 emits 1 event — impossible under staged
reads); scan order itself is pinned by the noise family — `sub-twins-noise-default`,
`sub-noise-13x7-t40`, `sub-noise-32x32-t40`, `sub-flood-abstain-16x16` (column-major
scan diverges on 10 of 20 substrate cases; the desert/adjacent fixtures alone do
not distinguish order, the noise family does).

---

### N2 — The twin term enters pressure (closes A10/A17; receipts R3, ADJUDICATIONS-G1)

**Normative.** On a twin hit, the twin term `resonance · σ` is **added** to the
cell's real accumulator to form `pressure = acc + resonance · σ`, and the sign
of that pressure is what moves d (N9) — the imaginary channel's feedback is
**real, not telemetry**: with the term removed, wormhole-ON and wormhole-OFF
arms could never produce different plane bytes, and the corpus shows they do.
The tick-level imaginary channel is exactly this term: **no persistent per-cell
imaginary accumulator exists** (the LAYER 0 vectorPass imaginary channel is a
separate, exact-integer surface, N16).

**Receipt.** R3; ADJUDICATIONS-G1 — the #2 divergence of G1-1 (seat chose
no-feedback; the seat self-flagged A17 as "the first thing I would cross-check"
— this ruling is that cross-check, settled).

**Corpus.** `sub-twins-desert-default` (both isolated twins climb from d=12 to
d=30/31 over 40 ticks; with the term as telemetry the plane freezes at d=12 and
twinTotal becomes 79 vs the corpus 53 [counterfactual verified]);
`sub-twins-desert-sigma-half` (same climb at σ=0.5 — see N3);
`sub-twins-noise-default` vs `sub-twins-noise-off` (same initial plane, ON/OFF
arms: final planes **differ**, twinTotal 9604 vs 0 — the executable proof that
twin resonance feeds dynamics).

---

### N3 — σ arithmetic: one correctly-rounded multiply, sign-only consumption (closes A4, A-R3)

**Normative.** σ is a positive real bridge-scale parameter (default log₂(3) =
1.584962500721156). In the **float plane**: σ is an IEEE-754 binary64; the twin
term is **one correctly-rounded binary64 multiply** `term = resonance × σ` (no
reassociation, no fast-math, no libm — A-R3's missing sentence, now written);
`pressure = acc + term` is one binary64 add; **only the sign of pressure enters
the d rule** — the magnitude is otherwise unobservable in the plane bytes. At
σ < 1 with resonance = 1: `0 < term < 1`, so `pressure > 0` and d climbs; a
truncating integer reading yields term = 0 and stalls. In the **fixed plane**
(N15): σ travels as the 64-bit integer `sigma_q`; the term is
`resonance × sigma_q` in S-units (S = 2⁻³²), one exact integer multiply — same
sign law.

**Receipt.** ADJUDICATIONS-G1 (A4 divergence: seat chose exact-rational σ with
truncation; reference is float where only the sign survives); A-R3 (byte-exact
term bits require round-to-nearest IEEE-754 — the Rust port's single-multiply
receipt, NC-rs2 the live check); R3.

**Corpus.** `sub-twins-desert-sigma-half` (σ=0.5, resonance=1: term=0.5>0 →
climb; truncation stalls at twinTotal 79 vs corpus 53 [counterfactual verified]
— this case PINS A4+A1+A17 per its own note); `sub-twins-noise-sigma-025`,
`sub-twins-noise-sigma-2`, `sub-twins-noise-sigma-4` (σ is a real dynamics
knob: twinTotals 9650/9645/9656 differ — when acc < 0 the σ magnitude flips the
sign of `acc + r·σ`; the C3 scope note, E-Q16-B, is the empirical receipt).

---

### N4 — Abstain cells receive neighborhood pressure (closes A5; receipt R3)

**Normative.** Every cell, Abstain included, computes its real accumulator from
its Moore-8 neighborhood each tick; an exemption reading would zero
`|real_acc| + 1` to dead letters and is non-conformant.

**Receipt.** R3 (first sentence); ADJUDICATIONS-G1 (G1-1 A5 near-match,
now normative).

**Corpus.** `sub-twins-noise-default` (mixed field; exempt-Abstain diverges from
tick 2 [counterfactual: evtCounts 181,240,243,… vs corpus 181,241,242,…]);
`sub-quarter-abstain-32x32`, `sub-mixed-64x64-t50` (dense-Abstain regimes where
resonance values > 1 occur — the sigma-025 case note: "resonance>1 subtleties").

---

### N5 — The slot key is the pre-tick d (closes A9; receipt R2)

**Normative.** Both the read and the write of a cell's wormhole interaction are
keyed by the cell's d at tick start; the post-movement d′ becomes visible to
the table only through the next tick's keying.

**Receipt.** R2 (pre-tick discipline); ADJUDICATIONS-G1 (G1-1 A9 match, now
normative).

**Corpus.** `sub-twins-desert-default`: the per-tick event cycle **(1, 1, 2)
repeating 13× plus 1** over 40 ticks (twinTotal 53) is the exact schedule
pre-tick keying produces; post-tick keying collapses it to 1,0,0,… [counterfactual verified].

---

### N6 — The accumulator is recomputed; the grid is synchronous (closes A11; receipts R2, SPEC L0 item 2)

**Normative.** The real accumulator is recomputed each tick from the pre-tick
grid snapshot; there is no persistent accumulator across ticks, and all
neighborhood reads for all cells come from the snapshot taken at tick start;
`resonance = |real_acc| + 1` reads the fresh, pre-twin value.

**Receipt.** SPEC LAYER 0 item 2 (exhaustion over 4×64 states is false under
hidden state); R2; ADJUDICATIONS-G1 (A11 match, now normative).

**Corpus.** `sub-noise-8x8-t8`, `sub-noise-13x7-t40`, `sub-noise-32x32-t40`
(persistent-accumulator counterfactual diverges on all three plane bytes).
Honest note: `sub-checkers-16x16` and `sub-ring-erode-16x16` do **not**
distinguish this fork (checkers' symmetric acc ≡ 0 either way) — the noise
family is the witness.

---

### N7 — The table persists across ticks (closes A6; receipts R2, R4)

**Normative.** The wormhole table persists across ticks; unwritten slots keep
their entries indefinitely; entries are never aged out; a fresh substrate
starts with an empty table.

**Receipt.** R2/R4; ADJUDICATIONS-G1 (A6 match, now normative).

**Corpus.** `sub-twins-desert-default` (a table rebuilt each tick yields
twinTotal 1 and a frozen plane — corpus says 53 and climbing [counterfactual:
rebuilt-table gives evtCounts 1,0,0,… vs corpus 1,1,2,…]).

---

### N8 — Same-slot collisions: last-writer-wins; the self-guard (closes A3/A2; receipt R4)

**Normative.** When multiple Abstain cells write the same slot in one tick, the
**last writer in row-major order wins** (one entry per slot); a read fires a
twin only if the slot is occupied AND `resonance ≠ 0` AND the stored (x, y)
**strictly differs** from the reader's (x, y) — a cell never resonates with its
own entry, including its own stale entry from earlier ticks; only Abstain cells
interact with the table.

**Receipt.** R4; ADJUDICATIONS-G1 (A3 "low confidence — a top question for the
author": answered).

**Corpus.** `sub-adjacent-lww-32x32` (first-writer-wins diverges: evtCounts
2,1,0,… vs corpus 2,2,2,… [counterfactual verified]); `sub-flood-abstain-16x16`
(256 same-tick Abstain writers, 10 ticks, twinTotal 2492 — saturation + LWW
under flood); `sub-degenerate-1x4` (a lone Abstain cell re-reading its own slot
every tick for 8 ticks: twinTotal 0 — the self-guard holds across ticks).

---

### N9 — The d rule table; τ is frozen (closes A7/A8; receipts kernel `nextD`, R3/R4)

**Normative.** τ never changes during tick — only d moves; τ is written only by
constructors and injectors outside tick. The d rule: `pressure > 0 → d′ =
min(d+1, 63)`; `pressure < 0 → d′ = max(d−1, 0)`; `pressure = 0 → d′ = d`
(branchless forms `d + (d < 63)` / `d − (d > 0)` are conformant; the "exact
rule table" of the inherited spec IS this closed form). This maps [0,63] →
[0,63] for every input — LAYER 0 item 2 holds by exhaustion.

**Receipt.** Reference kernel `nextD` + header note ("tau is frozen inside
tick"); ADJUDICATIONS-G1 (A7/A8 match, now normative).

**Corpus.** `sub-checkers-16x16` (pure Moore-8 dynamics, no Abstain);
`sub-ring-erode-16x16` (monotone self-erosion — the C5 mechanism);
`sub-all-ground-8x8` (the all-Ground plane is a fixed point — no-op invariant);
`sub-flood-abstain-16x16` (saturation at 63 under flood).

---

### N10 — Degenerate tori: per-visit modular wrap (closes A14, A-R2; receipts R1, A-R2)

**Normative.** All 8 Moore offsets are evaluated independently with pure
modular wrap `((x+dx) mod w, (y+dy) mod h)` — no minimum-dimension special
case: when w ≤ 2 or h ≤ 2 the offsets revisit cells (a cell can be its own
neighbor) and **every visit counts separately**; dimensions must be positive
integers (w, h ≥ 1).

**Receipt.** R1; A-R2 (Rust-lane finding: "every cell has exactly 8 neighbors"
is impossible on a degenerate torus — the kernel resolves it silently, this
ruling resolves it in text).

**Corpus.** The two degenerate fixtures are complementary:
`sub-degenerate-2x2` **pins per-visit multiplicity** (dedup-to-distinct-cells
diverges: plane 7789a74f vs corpus 7782a74f [counterfactual verified]);
`sub-degenerate-1x4` **pins self-visit inclusion** (excluding self-visits
diverges: plane d1609c00 vs corpus d1709c00 [counterfactual verified]; note
honestly: 1×4 does *not* by itself distinguish dedup — its Abstain self-visits
contribute 0 to the real accumulator — 2×2 carries that fork).

---

### N11 — seedFn and the replay contract (closes A16; receipts R6, G1-2 flag #4)

**Normative.** `makeSubstrate(w, h, seedFn)` invokes `seedFn(x, y, i)` in
row-major order (y outer, x inner, i the row-major index) and stores the return
value masked to a byte; `tick(sub, opts)` mutates the substrate in place AND
returns it; neighbors always come from the pre-tick snapshot, so in-place update
stays synchronous-exact. **seedFn is a constructor convenience, not part of the
replay contract**: the replay contract carries initial planes directly as bytes
(bytes-capture; corpus `cells0`) — arbitrary seed functions cannot be journaled.

**Receipt.** R6 (frozen cross-lane contract, fixed before the kernel landed);
ADJUDICATIONS-G1 (G1-2 flag #4 accepted: bytes-capture is the honest ladder).

**Corpus.** Every substrate case carries `cells0`/`cellsN` as hex planes — no
seedFn anywhere in the oracle.

---

### N12 — The write value; empty-slot semantics (closes A13; receipt R4 + kernel)

**Normative.** An Abstain cell writes its slot on **every** tick it is processed
(whether or not its read fired a twin): `slot[pre-tick d] ← (x, y, |acc| + 1)`
with `acc` the **pre-twin** real accumulator; since `|acc| + 1 ≥ 1`, an occupied
slot always has resonance ≥ 1; a slot is either empty or `{x, y, resonance}`,
and the `resonance ≠ 0` guard of N8 is the occupancy guard (an explicit occupied
flag and a resonance-0 empty sentinel are trace-equivalent encodings).

**Receipt.** R4; reference kernel write line (`Math.abs(acc) + 1` — pre-twin by
construction); ADJUDICATIONS-G1 (A13 match, now normative).

**Corpus.** `sub-twins-noise-default` and family (resonance values ≥ 1 span the
field); `sub-flood-abstain-16x16` (every writer stores a fresh `|acc|+1` each
tick under LWW).

---

### N13 — The twin event record (closes A-R1; receipts A-R1, R2)

**Normative.** Each tick emits twin events in reader row-major order, one per
fired twin: `{kind: "twin", x, y, slot, resonance, term}` — x, y are the
**reader's** coordinates; `slot` is the reader's pre-tick d; `resonance` is the
stored entry's resonance; `term = resonance · σ` in the plane's units: float
plane — the binary64 double from the N3 multiply (byte-exact bits required);
fixed plane — the integer `resonance · sigma_q` in S-units. The event shape and
order are normative **from this spec** (formerly kernel-defined only — A-R1's
"a fourth-language porter cannot learn the byte-exact conformance contract from
SPEC.md alone" is hereby withdrawn). Honest coverage note: g2-corpus-v1 pins
per-tick counts and totals (`evtCounts`, `twinTotal`); byte-exact term-bit
comparison requires the Rust-lane negative-control fixtures (NC-rs2), not this
corpus — a corpus v2 addition candidate.

**Receipt.** A-R1 (Rust-lane SPEC-silence finding); R2.

**Corpus.** `evtCounts`/`twinTotal` on all 20 substrate cases (e.g.
`sub-twins-desert-default`: counts (1,1,2)×13+1, total 53).

---

### N14 — Trace surface, canonicalization, hash (closes A15; receipts R5, R7, crossimpl)

**Normative.** A trace view is `{w, h, ticks, cells, wormholes, events}`:
`cells` = the w×h byte values in row-major order (carrier expandos excluded);
`wormholes` = the occupied slots as `{slot, x, y, resonance}` in slot order, or
`null` when no table exists or none is occupied; `events` = the current tick's
twin events (N13). The view records wormhole **state**, never the wormholes
enable flag (R7: an empty table is trace-equal to wormholes disabled — without
Abstain cells the paired arms are byte-equal). Canonical form: stone-v1
canonical JSON (recursively key-sorted, no whitespace); the trace hash is
**sha256** of that canonical form. (FNV-1a and other schemes — the G1-1 A15
choice — are non-conformant for sealed receipts.) The corpus replay comparison
basis is planes + event counts + totals; the hash is the sealing discipline.

**Receipt.** R5, R7 (`qthe.mjs`); `crossimpl/AMBIGUITY.md` (stone-v1
canonicalization discipline); ADJUDICATIONS-G1 (A15 was arbitrary in G1-1 —
closed here by adopting the reference discipline).

**Corpus.** The oracle law itself: "replay byte-identical or divergent, no
third option" — all 24 cases.

---

### N15 — The plane law (closes the σ representation fork; receipts COST-OF-EXACTNESS, RC-11/ADJUDICATIONS amendment 6)

**Normative.** Two arithmetic planes are normative and **version-stamped**
(§7): **(a) the float plane** — binary64 σ, the term as one correctly-rounded
multiply (N3) — canonical **for reproducing the sealed corpus verbatim**
(g2-corpus-v1 is float-plane, `qthe.mjs @ b6953269…`); **(b) the fixed plane** —
integer-only, σ as the 64-bit `sigma_q`, term = `resonance · sigma_q` in
S-units (S = 2⁻³²) — canonical **for every other product**. On swept σ ∈
{0.5, 1, log₂3, 2, 4} the planes are byte-identical (2 seeds × 200 ticks × 5
arms re-verified, checkpoint hashes equal); at the coupled σ = 2/3 they diverge
by one S-unit at exactly one pre-registered configuration (reader acc = −2,
writer r = 3 — reachable on random substrates, not on the twin-delivery
geometry); on adversarial rationals (1.6, 0.7, …) the fixed plane is the more
faithful of the two. Runtime cost of the fixed plane: 0.975× float (parity
within noise). The full fixed-plane S-unit encoding is normative in
`docs/REPRESENTATION-LAW.md` (version-stamped); this spec does not restate it.

**Receipt.** `fixedpoint/COST-OF-EXACTNESS.md` (ORCH-6, tip chain `ff70bdea…`);
ADJUDICATIONS-G1 amendment 6 (RC-11: σ fork closed by existing receipt — adopt
at P0).

**Corpus.** Swept-σ family: `sub-twins-desert-sigma-half`,
`sub-twins-desert-default`, `sub-twins-noise-sigma-025`, `sub-twins-noise-sigma-2`,
`sub-twins-noise-sigma-4` (float-plane oracle; the plane-agreement receipts live
in `fixedpoint/`).

---

### N16 — LAYER 0 conformance surface (closes py-lane A1, A3, A4, A7, A8, A9; receipts crossimpl F1–F3)

**Normative.** `pack(τ, d) = ((τ & 3) << 6) | (d & 63)`, exact inverse of
unpack on the in-contract domain (τ ∈ {0..3}, d ∈ {0..63}). `vectorPass`:
J×K rectangular byte matrix × length-K integer vector → one integer pair
`(yR, yI)` per row; τ=1 adds `+d·x` to yR, τ=2 adds `−d·x` to yR, τ=3 adds
`+d·x` to yI (coefficient exactly +1), τ=0 contributes to neither; no bias, no
activation, no clamping; raw exact-integer sums. K=0 → (0,0) per row; J=0 →
empty. Mutual-conformance bound: `max |y_j| < 2^53`. Out-of-contract inputs
(ragged rows, weights outside [0,255], non-integer xs) are outside the
conformance surface — the reference masks, a porter may raise; no corpus case
distinguishes.

**Receipt.** `crossimpl/AMBIGUITY.md` py lane (10/10 readings stood; F1
exactness horizon, F2 ragged-NaN, F3 masking-vs-raising — all outside the
specified surface, now scoped out normatively).

**Corpus.** `l0-codec-all256`; `l0-vectorpass-1/2/3`.

---

## 7. TRACE-COMPAT CLASSES

**Version stamping (normative).** Every sealed trace hash and stone-v1 receipt
line carries four fields, and they **feed the hash envelope**: (1) **spec
version** (this document's, `SPEC-v1.0`); (2) **kernel version** (source
commit, e.g. `qthe.mjs @ b6953269…`); (3) **plane** (`float` | `fixed`);
(4) **corpus id** when replaying (e.g. `g2-corpus-v1`). No trace is ever
ambiguous about the law that produced it. Digest stamps are decoupled from
package semver (G1-2 flag #1, adopted).

**Upgrade-honesty classes.** Classify every change before shipping it:

| class | definition | examples | required action |
|-------|------------|----------|-----------------|
| **T-COMPAT** | leaves every plane byte and event stream identical for all in-contract inputs | internal performance, docs, API ergonomics, off-by-default options, out-of-surface validation hardening (raising where the reference masks) | patch/minor bump; no corpus action |
| **T-EXTENDING** | existing observables unchanged; a NEW, separately-stamped observable surface added (outside the canonical trace view of N14) | a stats view, a new telemetry channel excluded from the canonical form | spec **minor** bump; new fixtures for the new surface; existing corpus untouched |
| **T-BREAKING** | any change that alters plane bytes or event streams for any in-contract input — equivalently, any edit to N1–N16 or the §3.4 algorithm | staged reads, term out of pressure, σ arithmetic change, rule-table change, re-keying, first-writer-wins, table reset, τ transitions, event-shape change, canonicalization change | spec **MAJOR** + kernel MAJOR; mint corpus v(N+1) under the new stamp; the old corpus is **never edited** — both live, stamped; every receipt names which corpus it replays |

**Plane switching** is not a spec change (both planes are normative since v1.0,
N15) but MUST be recorded in the stamp. **Laws:** a re-run that changes a byte
is void (determinism or it didn't happen); the corpus is the oracle —
byte-identical or divergent, no third option; never re-open a closed fork
without a T-BREAKING upgrade.

---

## 8. AMBIGUITY LEDGER STATUS

### 8.1 Guild re-derivation ledger (kernel-forge G1-1) — A1–A17

| ID | fork (one line) | status | closed by | executable witness |
|----|-----------------|--------|-----------|--------------------|
| A1 | live vs staged wormhole reads | **CLOSED** | N1 | sub-adjacent-lww-32x32 (t1: 2 events vs 0 staged) |
| A2 | self-resonance guard | **CLOSED** | N8 | sub-degenerate-1x4 (twinTotal 0 across 8 ticks) |
| A3 | same-slot collision policy | **CLOSED** | N8 | sub-adjacent-lww-32x32 (FWW diverges 2,1,0 vs 2,2,2); sub-flood-abstain-16x16 |
| A4 | σ type/rounding | **CLOSED** | N3 | sub-twins-desert-sigma-half (truncation: 79 vs 53) |
| A5 | Abstain exemption from pressure | **CLOSED** | N4 | sub-twins-noise-default (diverges from tick 2) |
| A6 | table persistence | **CLOSED** | N7 | sub-twins-desert-default (reset: 1,0,0 vs 1,1,2) |
| A7 | τ transitions in tick | **CLOSED** | N9 | sub-all-ground-8x8; sub-checkers-16x16 |
| A8 | clamp semantics / net-zero | **CLOSED** | N9 | sub-checkers-16x16; sub-flood-abstain-16x16 (saturation) |
| A9 | pre- vs post-tick slot key | **CLOSED** | N5 | sub-twins-desert-default ((1,1,2) cycle) |
| A10 | imaginary channel scope/lifecycle | **CLOSED** | N2 | sub-twins-desert-default; sub-twins-noise-off |
| A11 | accumulator persistence | **CLOSED** | N6 | sub-noise-8x8-t8 / 13x7 / 32x32 (planes diverge) |
| A12 | vectorPass x domain | **CLOSED** | N16 | l0-vectorpass-1/2/3 (bound 2^53) |
| A13 | empty-slot encoding / guard | **CLOSED** | N12 | sub-twins-noise-default; sub-flood-abstain-16x16 |
| A14 | degenerate tori counting | **CLOSED** | N10 | sub-degenerate-2x2 (multiplicity) + sub-degenerate-1x4 (self-visits) |
| A15 | trace-hash algorithm | **CLOSED** | N14 | corpus law (bytes+counts are the comparison basis); sha256/stone-v1 adopted |
| A16 | seedFn contract | **CLOSED** | N11 | all cases (cells0 bytes-capture, no seedFn) |
| A17 | imaginary feedback into evolution | **CLOSED** | N2 | sub-twins-desert-default (freeze: 79 vs 53); ON/OFF planes differ |

### 8.2 Repo Rust-lane ledger — A-R1–R3

| ID | fork | status | closed by | executable witness |
|----|------|--------|-----------|--------------------|
| A-R1 | twin-event surface unspecified | **CLOSED** | N13 | evtCounts/twinTotal, all 20 substrate cases |
| A-R2 | degenerate-torus neighbor set | **CLOSED** | N10 | sub-degenerate-2x2 / sub-degenerate-1x4 |
| A-R3 | term rounding discipline | **CLOSED** | N3 | sub-twins-desert-sigma-half; NC-rs2 (Rust lane) |

### 8.3 Repo py-lane ledger — A1–A10 (LAYER 0)

| ID | fork | status | closed by / note |
|----|------|--------|------------------|
| py-A1 | pack direction | **CLOSED** | N16 |
| py-A2 | imaginary coefficient sign | **already-clear** | the expansion fixes +1; written once in §1 |
| py-A3 | vectorPass shape | **CLOSED** | N16 (ragged = out-of-surface, F2) |
| py-A4 | x_k domain | **CLOSED** | N16 (bound 2^53, F1) |
| py-A5 | accumulation order | **already-clear** | exact integers — order unobservable |
| py-A6 | bias/activation | **already-clear** | pure linear pass; restated in N16 |
| py-A7 | weight validity | **CLOSED** | N16 (out-of-domain = out-of-surface, F3) |
| py-A8 | return type | **CLOSED** | N16 (integer channel pair) |
| py-A9 | degenerate shapes | **CLOSED** | N16 (K=0/J=0 defined) |
| py-A10 | Ground silence | **already-clear** | pinned by l0-vectorpass fixtures |

### 8.4 What remains open

**No ambiguity fork remains open** — A1–A17, A-R1–R3, and py-A1–A10 are all
closed or already-clear above. Three honest notes, none of which is an open
fork:

1. **σ-permanence hazard** (G1-2 receipt): the lazy default table persists its
   construction σ, so a one-tick σ override can leak into later ticks. This is
   documented *reference behavior* (§3.0 states the resolution order
   normatively), defect-flagged, and outside replay reach — every corpus case
   supplies σ explicitly. A future kernel fix is T-COMPAT for in-contract
   replay runs.
2. **Fixed-plane S-unit encoding** is normative by version-stamped reference
   (`docs/REPRESENTATION-LAW.md`), not restated inline here; a v1.1 fold may
   inline it.
3. **Corpus coverage gaps** (witness-level, not fork-level): g2-corpus-v1 pins
   event *counts*, not event *term bits* (N13 note); the desert/adjacent
   fixtures do not distinguish scan order by themselves — the noise family
   carries that (N1); `sub-checkers-16x16`/`sub-ring-erode-16x16` do not
   distinguish accumulator persistence — the noise family carries that (N6).
   A corpus v2 candidate list: order-reversed same-d writer pairs, an
   event-payload-bytes case, a coupled σ=2/3 fixed-plane case.

— END OF SPEC v1.0 DRAFT —
