# G1-4 · red-chamber · FINDINGS — Attack on the Orchestrator's Production Plan

Target: the PLAN. Scoreboard facts accepted as given; where the public repo sharpens an
attack, the receipt is cited (fetched 2026-11-02 from `github.com/SuperInstance/qthe@main`:
`crossimpl/AMBIGUITY.md`, `fixedpoint/COST-OF-EXACTNESS.md`, `docs/CLAIM-VERDICTS.md`,
`docs/ADOPTION-KIT.md`, `crossimpl/c/esp32_demo.c`, `qthe-core/package.json`,
`tests/determinism_attacks.mjs`, commit trail Oct 17–20). House law: every finding names
the evidence that would defeat it. Severity = expected cost if the plan ships as written.

---

## RC-01 · HIGH · [OVERREACH AUDIT] "Geometry memory" is a product pillar standing on a dead claim's surviving fragment

**Attack.** Positioning names "geometry memory" as one of four product legs. What C11
actually left standing: initial spatial autocorrelation is a *slow mode* of the tick
operator (T\* > 512, metastable plateau ~20% above floor — CLAIM-VERDICTS §C11, E-Q20b
annotation). That is an observation about decay, not a capability. The claim that geometry
did something useful already died twice in this house: provenance-blindfold (C11 H2) and
retrieval (C6, below chance). No receipt anywhere prices the persisted structure against
a trivial baseline on a downstream task. Selling it as a pillar is the dead-claim
marketing drift the plan's own risk list forbids.

**Defeating evidence.** One task benchmark where qthe's persisted spatial structure beats
a byte-matched trivial baseline (downsampled grid, hash-of-grid) on any named downstream
task at equal footprint. Time-boxed search; if none exists, the pillar dies cheap.

**Amendment.** Demote to "documented empirical behavior" in the spec receipts; remove
"geometry memory" from the four-pillar pitch; re-promote only on the benchmark receipt.

## RC-02 · HIGH · [OVERREACH AUDIT] "Backpressure arbitration" keeps the noun and buries the corpse

**Attack.** C10's scoreboard: the docket-arbitration claim **DIED** on H1 — "the debounce
changes timing, not throughput share (A-static stableStarve == the heap's exactly,
0.4435)"; the flood-cap survives *structurally* (0.339 vs 0.75 maxShare@500); the physics
bundle cuts starvation 0.44→0.32 **buying it with stable p99 +33% (845 vs 633)**. The
plan's pillar name is the part that died. Worse, +33% p99 is precisely the tax the
beachhead audience (interactive creative coders) feels first.

**Defeating evidence.** One named workload with a stated latency budget where 0.44→0.32
starvation is net-positive against +33% p99. Absent a use case, the trade is unpriced.

**Amendment.** Rename the leg to what survived: "flood-capping and starvation dials, with
a measured p99 cost." Print the 845-vs-633 number in the pitch, not the fine print.

## RC-03 · HIGH · [OVERREACH AUDIT] "Non-local delivery channel": existence-priced at n=28, capacity-priced at nothing, and it silently drops

**Attack.** C2 is priced on engineered twins — "per-pair distinct d, members ≥24 apart,
no slot contention" (§C2 boundary, verbatim: "dense-Abstain regimes are the E-Q14
frontier" — i.e., unpriced). The known constraint (64 slots saturate after ONE tick under
~256 Abstain writers) plus E-Q6's sealed slot semantics (S3 live-read row-major
**last-writer-wins**) means under load the "channel" resolves collisions by silent
last-writer-wins — a channel that drops messages without reporting. A product called a
delivery channel needs a capacity curve and an overflow story; the plan has neither. And
0/20 in the OFF arm suggests a near-deterministic signature — the test may be easy, not
the effect strong. n=28 total, no power analysis, no confidence interval.

**Defeating evidence.** (i) A writer-count sweep (64/128/256/512 Abstain writers) plotting
delivery rate with the saturation knee; (ii) an overflow policy in the SPEC (evict/drop/
error — with the drop *observable*); (iii) C2 replicated at 5–10× n, pre-registered.

**Amendment.** Publish the ceiling and the LWW-loss semantics in the pitch itself
("non-local delivery for ≤K writers/tick, collisions resolved LWW"); spec the overflow
rule before the word "channel" reaches a README.

## RC-04 · MED · [OVERREACH AUDIT] "Byte-dense" is quoted against the weakest baseline, and the repo's own law says the caveat is mandatory

**Attack.** The pitch's "One byte holds the value and the operator" leans on C1's 47.40%.
Two unpriced edges. First, the repo's own ORCH-R10 byte-budget note: "a footprint claim
that mixes traffic with standing storage, or **omits the cached-port caveat**, is not
quoting this receipt" — a cached port (τ-plane held resident) reaches per-tick parity
(10 vs 10). Second, no compression-aware baseline exists anywhere in the repo: the
comparison is 8-bit vs a naive 16-bit port only; varint-delta or zstd-on-the-2-byte-stream
were never run. If a codec closes the gap, "byte-dense" stops being a selling point and
becomes an encoding curiosity.

**Defeating evidence.** A baseline table — {raw 2-byte, cached 2-byte port, nibble-packed,
varint-delta, zstd(2-byte), zstd(qthe-8-bit)} × bytes-to-task and decode cost. The pitch
survives only if qthe-8-bit stays ahead at equal decode cost with the cached-port caveat
printed.

**Amendment.** Quote 47.40% only with the cached-port caveat attached (the repo already
requires this); add the codec baseline table to the claims dashboard before P4 recipes
cite it.

## RC-05 · HIGH · [IRONY CHECK] "Deterministic, reproducible, period" — the plan spends as currency the exact claim it has priced least

**Attack.** The house exists to kill unpriced claims; the plan's op-log pitch makes one.
The 12/12 corpus prices **tick traces** — fixed initial state, fixed tick count, byte-
identical outputs. `inject()` op-logs are a NEW API surface with zero corpus coverage and
four unpriced non-determinism sources: **(1) multi-writer ordering** — lockstep networking
implies multiple inject sources; LWW table semantics (E-Q6) mean peer A and peer B can
each be perfectly deterministic and still diverge from each other; **(2) payload
serialization** — a float in an inject payload re-opens σ semantics at the API boundary
(JSON number in TS vs f64 in Rust; round-trip parity unproven); **(3) snapshot
completeness** — the repo's own determinism attack A2 proves the wormhole table is live
state and a plane-only round-trip *diverges*; the plan's `snapshot()` bullet doesn't say
it captures the hull; **(4) spec-carried vs fixture-carried determinism** — AMBIGUITY.md
A-R1: "a fourth-language porter cannot learn the byte-exact conformance contract from
SPEC.md alone — the fixtures (or the kernels) are load-bearing," and A-R3: byte-exact
event-term bits require an IEEE-754 round-to-nearest multiply the SPEC never states (a
fast-math port keeps plane hashes while corrupting term bits). The determinism brand is
currently carried by fixtures, and the plan schedules "conformance" (P2) without
scheduling the spec hardening that would make the contract portable.

**Defeating evidence (the experiments that price it).** (i) 10+ multi-writer corpus cases
with adversarial interleavings and float payloads, byte-compared across JS/C/Python/Rust +
qthe-verify; (ii) a standing cross-implementation differential fuzzer in CI (random op
sequences, random interleavings, random float payloads; compare final hull hashes) —
30 clean days = priced; (iii) a serialization canary (one float round-tripped TS→Rust→TS);
(iv) degenerate-dimension cases (A-R2: 1×N tori are SPEC-silent and untested); (v) the
missing SPEC sentence from A-R3 ("term is one correctly-rounded multiply") folded and
sealed. Each is days of work — none appears in any phase.

**Amendment.** Split the claim honestly — "tick determinism: priced (12/12, four
languages, external rebuilder); op-log determinism: NOT YET PRICED" — and make the
multi-writer corpus + fuzzer a P1 exit criterion before the networking pitch is spoken.

## RC-06 · HIGH · [ESTIMATE CHECK] Every phase duration is a vibe in a schedule costume — and the only available anchor prices the wrong thing

**Attack.** "P0 (days), P1 (1–2 wks), P2 (1 wk), P3 (2–3 wks)." Priced against what? The
commit trail (last 100 commits: Oct 17–20, rounds R11→R30) proves extraordinary *burst
construction* velocity — ~30 orchestrator rounds in 3 days, zero support load, zero
registry publishing, zero external users. Extrapolating that trail to P3 — which contains
CLI + canvas component + playground + 3 sketches + a hardware bench table — prices
construction while spending operation. The hardware item is the smoking gun:
`crossimpl/c/esp32_demo.c` says "STATUS: code-delivered, **hardware-pending** (no physical
device in the orchestration environment)." "Measured on one real board" therefore implies
buying hardware, flashing, and on-device sealing — procurement lead time in a phase whose
duration is a guess. No subtask decomposition, no kill-dates, no slack for the support
load the beachhead itself creates (RC-07).

**Defeating evidence.** A duration receipt: subtask hour-estimates summing to the phase
claim, anchored on measured throughput for *that class of work* (the repo has receipts
for experiment rounds; it has zero receipts for registry releases, CI matrices, or
hardware bring-up), plus a kill-date per phase. If no such receipt can be produced, the
durations are refuted by their own absence.

**Amendment (honest form under house law).** A duration claim is an empirical throughput
claim. Either decompose-and-anchor, or convert to event-conditioned, time-boxed exits:
"P1 exit = @qthe/core + @qthe/wasm published, corpus 12/12 green in CI, fuzzer 7 days
clean — if not green by DATE, the mirror component is cut." Then ship @qthe/core alone
first as the velocity probe that prices P2–P4 with a receipt instead of a guess.

## RC-07 · HIGH · [BEACHHEAD CHECK] The beachhead breaks at the issue tracker and the version number, not the pitch

**Attack.** Creative coders arrive with wasm-on-Safari, bundler quirks, and node-version
chaos. What breaks first: the first GitHub issue that sits unanswered for three weeks
while the maintainer is heads-down in P3 — issue silence reads as "abandoned," which is
terminal for a 0-star npm package. Second: semver. The σ fork (RC-11) unresolved at ship
time means the first tick-semantics change torches exactly the early adopters the
beachhead courted. Third: playground bit-rot as four new build targets land on the
existing Pages config. The plan names bus factor and lore-to-docs ratio but prices
**support load at zero hours** — and its phases already consume the maintainer's whole
calendar (RC-06).

**Defeating evidence.** (i) Issue-tracker stats from comparable single-maintainer
creative-coding libraries (median first-response time vs. abandonment rate); (ii) a
written maintainer-hours budget whose sum fits inside the phase durations' slack. No
hours budget exists in the plan — that absence *is* the evidence this attack stands on.

**Amendment.** Minimum viable maintainer commitment, as numbers in P0: 2–4 h/wk triage,
first response < 7 days, critical patch < 2 wks, semver contract + CHANGELOG from v0.1.0 —
or the honest alternative: label every package "experimental, no support" and don't court
a beachhead yet. The one-package-first sequencing (RC-06) doubles as the SLA calibration:
if the support load of @qthe/core alone exceeds budget, the roadmap re-prices before the
other five packages exist.

## RC-08 · HIGH · [STANDARD PLAY] A conformance corpus is a trust artifact, not a standard — and the plan confuses the two

**Attack.** "Spec + golden tests + certified implementations, RFC process, tavern →
public PR process." A standard's value is proportional to independent implementers.
Current implementers: four languages + qthe-verify, all one operator (README calls
qthe-verify "a sibling lane's artifact") — method-independent (spec-only), not
person-independent. The commit trail contains zero external contributors; the "tavern"
is an internal LLM-seat adjudication economy, and "tavern → public PR process" assumes a
public that does not yet exist. Meanwhile A-R1 proves the SPEC alone is not load-bearing
today — so the standard play's *first* deliverable must be making SPEC self-sufficient
(folding A1–A10, F1–F3, A-R1–R3, R1–R7), and the plan **schedules conformance (P2)
without scheduling the spec fold at all**. An RFC process with no external RFC-ers is a
costume; nobody adopts a 0-star dependency because it has governance.

**Defeating evidence.** One documented case of a pre-adoption 0-star repo gaining its
first external adopter via RFC/conformance process rather than a useful artifact; or a
non-operator commit/PR on qthe or qthe-verify within the plan's first quarter. Absent
either, the "standard play" is a hope in process clothes.

**Amendment.** Reframe as the **trust play** — it is genuinely strong: "byte-identical
across 4 languages + an external spec-only rebuilder, proven by CI on every push" is a
rare, checkable claim and should be the marketing headline. Sequence: (1) fold the
ambiguity ledger into SPEC (the actual blocker, per A-R1); (2) add the real adoption
mechanisms the plan omits — a demo GIF of something p5 can't do cheaper, npm keywords
(already present in `qthe-core/package.json`), one post where creative coders live;
(3) trigger RFC/certification language on implementer #2's first PR.

## RC-09 · MED · [HIDDEN COSTS] Cross-language CI, corpus regeneration, hardware staleness, and a four-registry supply chain — all priced at zero

**Attack.** (i) **CI**: current `ci.yml` runs the JS-centric batteries (negctl, LAYER 0,
chain auditor, probe gate, call guard); the crossimpl lanes (Python workers, C builds,
Rust) were run in-session by the orchestrator, not in CI. The plan adds node + python +
rust + C toolchain matrix + emscripten + a conformance runner — that is money, flaky-bot
maintenance, and a compiler-matrix decision (gcc/clang/msvc?) nobody has made. (ii)
**Corpus maintenance**: the corpus is already plane-scoped (float 12/12 + fixed R8 3/3 +
VectorPass 4/4); every spec change regenerates golden traces × planes × 4 languages —
cost grows multiplicatively with the σ fork (RC-11). (iii) **Hardware bench**: on-device
sealing is manual forever (esp32_demo.c status); bench-once means drift-forever unless
the table carries a date + toolchain pin. (iv) **Supply chain**: npm + crates + PyPI +
the wasm artifact all sit behind one maintainer account — a single point of compromise
for the entire ecosystem on day one; the plan mentions no provenance, 2FA, trusted
publishing, or signed tags.

**Defeating evidence.** A P0 cost sheet: CI matrix definition with expected minutes/commit;
a corpus-regen procedure costed per spec version; a bench staleness policy; a security
checklist (npm provenance ON, 2FA, PyPI trusted publishing, pinned toolchains). The
plan's silence on all four is the attack's standing evidence.

**Amendment.** Make all four P0 exit criteria. Cheapest high-value move: enable provenance
+ 2FA + trusted publishing *before* the first release, not after the first incident.

## RC-10 · MED · [HIDDEN COSTS] @qthe/wasm crowned "THE cross-language reference artifact" — is the crown artifact itself reproducible?

**Attack.** The plan makes a compiled blob the canonical cross-language reference. wasm
artifacts are notoriously non-reproducible across emsdk versions and flags — and this
repo's own discipline pins sha256s in PROVENANCE.txt. If the blob isn't bit-reproducible,
the "reference" is weaker than the C source it's built from, and every downstream
"certified implementation" claim inherits an unpinned toolchain. There is also a
reference-hierarchy muddle the plan doesn't resolve: today the JS kernel is the
reference, the C port is "byte-exact vs both JS kernels on a 19-case battery," and wasm
would be a build-of-a-port — three artifacts, one of which the plan silently promotes.

**Defeating evidence.** A reproducible-builds receipt: two clean-checkout CI builds on
different runners producing bit-identical wasm, with emsdk version + flags pinned in-repo.

**Amendment.** Pin the toolchain; add the bit-reproducibility check to CI; state in the
SPEC which artifact is normative (almost certainly source, with wasm a blessed build) —
before the marketing names a binary "THE reference."

## RC-11 · HIGH · [DECISION DEBT] The plan re-opens the σ/canonical-plane fork that the repo already closed — and ignores why closing it twice is expensive

**Attack.** The plan: "pin the σ float semantics … **or** bless the fixed-point plane as
canonical" — presented as open. The repo already ruled: `fixedpoint/COST-OF-EXACTNESS.md`
— "use the float plane when you are reproducing the sealed corpus verbatim; use the fixed
plane **everywhere else** … the only plane that behaves identically across languages and
compilers" (runtime parity 0.975×, i.e., free). Two unpriced consequences: (1) re-opening
a closed fork is the plan committing the very lore-drift it warns against — the decision
receipt exists and isn't cited; (2) **corpus bifurcation**: the 12-case corpus is
float-sealed, and the fixed plane *provably diverges* at coupled σ = 2/3 (8/8 random
substrates, one S-unit, first divergence ticks 2–19). "Fixed plane canonical + corpus as
the standard" therefore requires a plane-scoped corpus or a documented exception case —
a conformance-design decision the plan doesn't know it owes.

**Defeating evidence.** A decision receipt citing REPRESENTATION-LAW.md, plus a
plane-scoped corpus plan showing exactly which cases hold on which plane. If the corpus
can't be cleanly scoped in days, that is itself proof the decision must precede any
package publish.

**Amendment.** Adopt the existing rule as the P0 decision (fixed canonical for products,
float for corpus-verbatim reproduction), version-stamp both planes in the SPEC, and
scope corpus cases per plane. Blocking P1 on this costs a day; deferring it costs a
semver break on the first adopters (RC-07).

## RC-12 · LOW · [RESEARCHER TRACK] DOI + claims dashboard: mostly already priced — the residual is upkeep and audience

**Attack.** Sharper than my prior: the dashboard **already exists and is generated**
(`docs/dashboard.html` + `scripts/build_dashboard.mjs`), so the plan is not building it
from scratch and staleness-by-hand-edit is already mitigated. What remains unpriced: (i)
upkeep as claims grow (the dashboard already carries 32k+ rows per the README — regen
cost must be in the release checklist with an owner); (ii) the DOI targets researchers,
an audience with zero adoption signal, while the beachhead audience gets three sketches —
prestige theater before first external use.

**Defeating evidence.** A dashboard-regen step in the release checklist (owner + time);
any first-quarter citation, issue, or download traceable to researcher-facing artifacts.

**Amendment.** Keep the dashboard CI-generated forever (forbid hand edits by lint, if
possible); defer the DOI to the first external use that makes it mean something.

---

# HONESTY GRADE

**B, dying cheap — but only if the receipts are demanded before shipping, not after.**
The plan is well above the norm: it names five real risks, keeps the dead claims dead in
positioning ("NOT emergent/ML"), and its version-stamp-everything instinct is native to
the house. But it commits three distinct sins against "priced, not assumed." First, two
of its four product-pillar nouns — "geometry memory" and "backpressure arbitration" — are
dead or half-dead scoreboard entries wearing product clothing (RC-01, RC-02); each costs
exactly one task benchmark to price or kill. Second, it spends determinism as settled
currency ("reproducible, period") while the repo's own receipts show the contract is
fixture-carried rather than spec-carried (A-R1), missing an IEEE-754 sentence (A-R3), and
entirely unpriced for the new op-log surface — the irony of a falsification house
shipping an unpriced claim in its own pitch (RC-05); the price is a multi-writer corpus
plus a differential fuzzer, roughly one week. Third, it converts hopes into schedule:
phase durations with no throughput anchor (RC-06), an RFC process with no external
implementers (RC-08), and researcher artifacts with no researcher signal (RC-12) — the
honest price is one measured velocity spike (ship @qthe/core alone) plus event-conditioned
exits. It also re-opens the σ fork the repo already closed and owes a plane-scoped corpus
it hasn't noticed it owes (RC-11). Every one of these dies cheap — one benchmark, one
fuzzer, one baseline table, one spike, one decision receipt — which is precisely why the
house should demand them at P0/P1 exits: a plan that can be priced this cheaply has no
excuse for shipping unpriced.
