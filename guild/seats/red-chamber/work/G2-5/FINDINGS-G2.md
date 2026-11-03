# G2-5 · red-chamber · FINDINGS-G2 — second attack: the amended plan, the docs orientation, the Guild itself

Targets: **A** the amended plan (ADJUDICATIONS-G1.md), **B** the new docs
orientation ("everywhere but forgotten"), **C** the Guild program (self-review).
Method as chartered: every finding names its defeating evidence; severity =
expected cost if the target ships as written. Sources read in full: GUILD.md,
ADJUDICATIONS-G1.md, registry.json, all eight charters, all five journals,
G1-4 FINDINGS, corpus g2-corpus-v1.{json,flat}. Fetched live from
github.com/SuperInstance/qthe@main (2026-11-02): README.md, SPEC.md,
docs/CLAIM-VERDICTS.md, crossimpl/AMBIGUITY.md, crossimpl/conformance.mjs,
qthe-core/package.json, experiments/outputs/e_q14_results.json; plus
SuperInstance/qthe-verify README. In-flight G2 artifacts (G2-4
DOC-ARCHITECTURE.md / README-V0.md / LOOK-AND-FEEL.md; G2-1/G2-2/G2-6/G2-7
work dirs) are cited as evidence of program state — per Law 6 they are
unadjudicated and count as nothing yet; that is itself finding RC2-12's
terrain.

## What survived attack (credit before attack)

- The determinism **claim-split itself** (amendment 2) — the split is right;
  only its parenthetical is defective (RC2-01).
- Amendment 6 closed the σ fork **without re-opening it** and cites the actual
  ruling receipt — the anti-RC-11 discipline held.
- Amendment 7 (wasm demotion) is consistent with amendment 3's
  one-package-first; no contradiction found.
- G2-4's docs architecture (honesty box at the front door, one-click
  provenance, CI-run snippets, "machines write numbers") is the best artifact
  the program has produced. My B-target findings attack the *orientation as a
  rule* and residual defects — not this design.
- Dead claims stay dead everywhere in G2 work (LOOK-AND-FEEL §1.5); no
  resurrection found.
- The corpus's L0 cases are genuinely SPEC-derivable — I re-derived
  l0-vectorpass-2 by hand from the SPEC formula (all-Abstain row:
  y = i·(1·−4 + 2·−5 + 3·−6) = −32i → re 0, im −32, matches the committed
  expectation).

---

## RC2-01 · HIGH · A · [NOUN AUDIT] The trust play's headline sentence is a conjunction no receipt supports — and it has already propagated into three artifacts

**Attack.** Amendment 2 fixes the determinism currency as: "tick determinism:
priced (12/12, four languages, external rebuilder)." Unpacked against the
receipts: the 12-case corpus replay is **qthe-verify** (an independent JS
reimplementation) and **Rust** (README r20: "float plane 12/12"); C99 is priced
on a **19-case battery** whose relation to the 12-case corpus is unstated;
Python is **L0-only** (package.json: "Python(L0)"; crossimpl/conformance.mjs
drives `qthe_layer0.py` — bijection/psi/vectorPass, no substrate traces) and
structurally cannot replay a trace corpus. "12/12, four languages" reads as a
four-language 12/12 corpus replay that has never been run. The noun is
propagating in real time: G2-4's manifest `X-LANG` verified entry —
"byte-identical JS/C99/Python/Rust + independent spec-only rebuilder 12/12";
README-V0's second sentence — "Same seed, same bytes — on every machine, in
JavaScript, C, Python, and Rust"; README-V0's state-table row pairing
"JS · C99 · Python · Rust" with "12/12 traces byte-identical." Three
artifacts, one inflated conjunction — and LOOK-AND-FEEL §1.6 deliberately
optimizes claim sentences for verbatim agent quoting, making the inflated
sentence a high-fidelity error vector. Second prong: **"external rebuilder."**
qthe-verify lives in the same principal's org, is described by the repo itself
as "a sibling lane's artifact," and its reader was built from *qthe-verify's
own README* "algorithm, in full" section — a post-hoc clarified description
that already embeds the reference kernel's A1 resolution (live row-major table
reads). Method-independent: genuinely yes (`verify.mjs` never imports vendor
code; only the corpus's expected hashes were kernel-minted — the correct
structure for a reproducibility claim). External: no. The repo says "sibling
lane"; the plan upgraded the noun in transcription — the exact RC-01/02 sin
class (nouns smuggling claims), now committed by the amendment that fixed it.

**Defeating evidence.** A CI receipt where all four language implementations
replay the identical 12-case float corpus 12/12 (requires extending Python
beyond L0 or deleting Python from the sentence); or a rebuild by any party
outside the SuperInstance org; or adoption of the itemized rewrite below
everywhere the sentence appears.

**Amendment.** Rewrite the parenthetical itemized: "tick determinism: priced —
12-case float corpus 12/12 (reference JS; Rust; independent spec-only rebuild,
sibling lane, same principal); C99 byte-exact on a 19-case battery; Python
L0-exhaustive (algebra layer only). Four-language corpus replay: NOT YET RUN."
Ban "external" for same-org artifacts ("independent, method-only" is the
honest adjective). Make the true four-language 12/12 replay a P1 exit
criterion — the ports exist; it is the cheapest trust upgrade available.

## RC2-02 · HIGH · A · [AMENDMENT AUDIT] "≤K writers/tick": the amendment adopted RC-03's caveat language and dropped RC-03's experiment — and the caveat has the wrong shape

**Attack.** Amendment 1 pins the pillar as "non-local delivery for ≤K
writers/tick with LWW semantics printed." Two defects. (1) **K is unpriced
and unscheduled.** The priced delivery configs are K=8 (C2/E-Q1: 8 planted
pairs, 8/8 ON vs 0/20 OFF) and the E-Q18 polluter ladder {0,16,32,64,128,256}
(8/8 delivery at every level). No G2 dispatch prices K: falsification-bench's
multi-writer corpus is op-log (inject() ordering), not the wormhole writer
sweep that was RC-03's defeating evidence. A caveat with a placeholder where
its number should be is honesty costume. (2) **The shape is wrong.** The
receipts locate the boundary *not* at total writer count — delivery survives
256+ polluters (E-Q18-H2: "8/8 delivery everywhere"); the real boundaries are
per-slot same-tick collisions resolving **silent LWW** (E-Q6: survival 0.984
under total collision, last-writer-dominated) and **sender-attribution
collapse** (the WHO-loss; pollution fraction → 1.0). The Guild's own
subordinate artifact states it better than the binding plan: G2-4's manifest
boundary field — "delivery holds (80/80), sender attribution does not." The
binding plan's pillar language is *less accurate than the unadjudicated seat
artifact beneath it* — a hierarchy inversion caused by adopting
finding-language without re-deriving it from receipts.

**Defeating evidence.** The delivery-rate-vs-writer-count sweep with the
LWW-loss fraction per slot-contention level (RC-03's original ask), OR a plan
amendment printing the priced boundary: "delivery robust to 256+ total
writers (E-Q18); same-slot same-tick writes resolve silent LWW (E-Q6);
attribution collapses under load — design per-slot, not per-fleet."

**Amendment.** Replace "≤K writers/tick" with the receipt-shaped boundary
above; schedule the writer sweep (with RC-03's LWW-observability fix) as a P1
exit criterion or delete the placeholder.

## RC2-03 · MED · A · [SEQUENCING] Pillar #1's falsifier is scheduled three phases after its marketing work

**Attack.** Amendment 1 makes "byte-dense encoding" the lead pillar;
amendment 9 schedules the codec baseline table ({raw, cached-port, nibble,
varint-delta, zstd} × bytes-to-task) only "before C1 is quoted in any recipe"
— P4. Between now and P4 the pillar fronts the pitch, README-V0 (already
written), the landing page, and the beachhead. If the table kills the pillar
(RC-04's scenario: a codec closes the gap; "byte-dense" becomes an encoding
curiosity), the retraction costs a re-front-doored pitch and re-taught users.
The house law is falsify-cheap-*before*-shipping; the amendment inverts it
for the one pillar whose defeating test is cheap (≈ a day of codec
benchmarks). The cached-port caveat — adopted, printed in README-V0 ✓ —
mitigates overclaiming, not under-falsification.

**Defeating evidence.** The codec baseline table run at P0 with the pillar
surviving it; or the pillar demoted to "measured vs naive 2-byte split;
codec-aware baselines pending" until the table exists.

**Amendment.** Move the codec baseline table to P0. It gates the *pitch*, not
the recipes.

## RC2-04 · MED · A · [OVERCORRECTION] The honest-pillars pitch undersells: a receipted compression loss dropped the trust play's headline from the binding record — and the living pillar prints caveats without receipts

**Attack.** The amended plan commits the mirror image of G1's sin: where the
old pitch hid *deaths* in pillar nouns, the new pitch hides the strongest
*life*. Mechanism, receipted: RC-08's adopted amendment text says the
determinism trust claim "is a rare, checkable claim and **should be the
marketing headline**"; ADJUDICATIONS amendment 5's summary retained the
sequencing (SPEC fold first; RFC trigger on implementer #2) but **dropped the
headline directive**; amendment 1's pillar list (byte-dense / non-local /
flood-capping) then contains no determinism pillar at all. The project's most
differentiated verified result survives only as a claim-split footnote.
Meanwhile the C2 pillar prints its boundaries (≤K, LWW) without its receipts
(8/8 vs 0/20; 13 B per table-write vs 2,304 B/tick full-plane broadcast on
48×48) — a caveat-only pillar reads weaker than the verdict that LIVES. The
Guild's own G1-3 output demonstrates the honest form: the Locke pitch prints
receipt AND boundary in one line ("ON arm: 8/8 delivered; OFF arm: 0/20 —
printed honestly, live"). The amended plan's pillar language is less
informative than the graded-A seat pitch it governs. An unquoted receipt is a
wasted receipt.

**Defeating evidence.** A pillar list carrying the trust claim as pillar #1
with its receipt inline ("byte-identical traces across implementations —
reference JS, Rust, and an independent spec-only rebuild, 12/12 — proven in
CI on every push"), and C2 restated receipt-first; or an explicit adjudicated
decline of the headline directive with reasons.

**Amendment.** Fix the amendment pipeline: every adopted finding's amendment
text is quoted verbatim, or the drop is explicit ("adopted in part:
sequencing only; headline directive declined because X"). Restore the
headline directive; receipts inline in every pillar.

## RC2-05 · MED · A · [DECISION DEBT] Amendment 4 adopted an OR, and the dispatch graph lets the courtship artifact ship before the courtship decision

**Attack.** Amendment 4: maintainer commitment "…**or** the honest
'experimental, no support' label and no beachhead courtship." An OR is a
deferral, not a decision — legitimate only if downstream tasks are sequenced
behind it. They are not: house-manager's G2-3 holds the decision ticket while
stranger-experience's G2 (registry: "landing-page + docs restructure") ran in
the *same round* and produced README-V0 — a front door with "who it's for:
creative coders / game engineers / embedded engineers," i.e., a
beachhead-courtship artifact — with no dependency on the decision's outcome.
If the ticket lands on the no-support arm, the front door must be relabeled
and the courtship unwound; the amendment's own text says that arm *forbids*
courtship. RC-07's original sin (support load priced at zero while the
beachhead is courted) is still live — converted from an unpriced assumption
into an unresolved race.

**Defeating evidence.** The decision ticket resolved and recorded BEFORE any
courtship artifact merges to main; or README-V0 carrying the support posture
as a variable the decision flips.

**Amendment.** Sequence: decision ticket first, front-door merge second; bind
the landing page's support block to the ticket's outcome.

## RC2-06 · MED · A · [PLANE BLINDNESS] P1's corpus gate greens the wrong plane

**Attack.** Amendment 6 makes the **fixed** plane canonical for products
(COST-OF-EXACTNESS) and defers the plane-scoped corpus plan to P2. The P1
corpus exit ("corpus 12/12 green in CI," per the amended exits and the RC-06
amendment language) is the **float** corpus — the corpus-verbatim plane,
explicitly NOT the canonical one. The fixed plane's corpus today is **R8 3/3
— three cases** (receipt: README r20, "float plane 12/12 + fixed plane R8
3/3"; and the two planes provably diverge at coupled σ = 2/3, G1 RC-11).
P1 therefore ships @qthe/core with its canonical plane carrying 3 corpus
cases while CI displays a green 12/12 that tests the non-canonical plane. The
exit criterion is amended on paper and unpriced in fact: the number that
gates the ship does not test the plane that ships.

**Defeating evidence.** A plane-specific P1 exit — "fixed-plane corpus ≥8
cases green AND float 12/12 verbatim green AND the σ=2/3 divergence case
version-stamped as the documented exception" — or the plane-scoped corpus
plan pulled from P2 to P1 (RC-11 itself priced it in days).

**Amendment.** Rewrite P1's corpus gate per-plane; pull the plane-scoping
plan to P1; print both plane names in every CI badge that says "corpus 12/12."

---

## RC2-07 · HIGH · B · [ORIENTATION AUDIT] "Everywhere but forgotten" is a deployment receipt wearing a documentation style — and qthe's confirmed failure modes are silent, which makes forgettability unearned and dangerous

**Attack.** Three prongs, each priced. (1) **The maturity cosplay.** zlib's
docs can be quiet because decades of deployment do the proving; qthe has zero
external users (G1 RC-08 evidence stands: zero external contributors, no npm
publish), so the docs are the *only proof surface that exists*. "We aren't
trying to prove it works" deletes the project's only trust channel for the
two personas whose conversion mechanism IS receipts — G1-3's sealed pitches:
"Locke won't believe marketing — Locke believes a rerun"; "Rex converts on
the scoreboard, not the promise… trust is won by the nulls." Being forgotten
is a receipt you earn from thousands of dependents, not a pose you strike in
the README. (2) **The silent-trap collision.** The orientation prizes being
forgotten, but the project's three confirmed kernel findings are all SILENT
failure modes — mulberry32 seed aliasing (silent, unerrored), the one-tick σ
override leaking into permanence, LWW table drops under contention (all
Orchestrator-confirmed in ADJUDICATIONS G1-2). zlib earned forgettability
with loud failures (error codes) and a tiny frozen surface; a library whose
documented traps are invisible at runtime cannot honestly fade — users ship
bugs they cannot see and blame the substrate. Forgettability is a KERNEL
property (make the traps loud: throw on seed ≥ 2^32, warn on one-tick σ
override, observable LWW loss) or it is a costume. (3) **The unpriced
anecdote.** The orientation's evidentiary basis ("their agent said it would
help when the two of them read it") reports a user+agent validation event —
with zero external users to be the user. Either an internal/synthetic test
(unlabeled) or a hypothetical narrated as evidence; a program that
pre-registers everything is pivoting its entire docs strategy on one
unsealed anecdote. Note: G2-4's actual equilibrium (honesty-box state table
at the front door + one-click provenance + boundaries inline as specs) is
defensible — the attack is on the orientation *as a general rule* and its
unreconciled collision with the binding record (RC2-04's dropped headline),
not on the seat's disciplined reading.

**Defeating evidence.** (i) Kernel receipts making the three silent traps
observable, after which "forgotten" is honest; (ii) the user+agent reading
test filed as a receipt (who read what, what they said, artifact); (iii) a
pre-registered docs success metric (time-to-first-success per quickstart
exit; boundary-survival under paraphrase; zero silent-trap bug reports in the
first quarter) — "faded into the background" is currently unfalsifiable: the
RC-06 sin at the meta level.

**Amendment.** Adopt G2-4's equilibrium as the official reading of the
orientation — fade the chrome (jargon, ceremony, install friction), never
the receipts or the failure-mode callouts; file the reading test or drop the
anecdote; pre-register the docs' success criteria; route the silent traps to
kernel fixes (P0/P1) as the precondition for any "forgotten" language.

## RC2-08 · MED · B · [FICTIONAL CASE STUDY] "In service" with zero users: the trap was dodged once, by interpretation — bind the honest form before the next seat falls in

**Attack.** "Showing… what it looks like in service" invites illustrative
narratives that read as claimed outcomes. In this house the stakes are
categorical: a narrative with an invented user is not embellishment, it is a
**forged receipt** — a fabricated verification witness — the one sin the
program's law cannot survive. G2-4 dodged the trap by reading "in service"
as three engineering patterns with inline boundaries and sealed-record
parentheticals (README-V0: patterns, not case studies — the honest reading).
Two residuals stand. (1) The section *title* — "What it looks like in
service" — still claims a referent that does not exist: nothing is in
service; with zero deployments the phrase borrows deployment credibility the
project has not earned (the same noun-smuggling class as G1's RC-01/02).
(2) Nothing binds the *next* seat — P4 recipes, the examples gallery, any
blog post — to the pattern form. The orientation's phrase will be
re-interpreted per seat, and one narrative-minded interpretation ships a
fictional case study with the principal's apparent blessing.

**Defeating evidence.** A filed docs law: "usage sections contain only (a)
run-verified snippets with real outputs (the QUICKSTART law: 'every command
executed; quoted outputs are real'), (b) engineering patterns with inline
boundaries, (c) artifacts tagged (proposed); user-narratives require a named,
consenting, real user and a filed trace" — enforced by the mechanical check
G2-4 already designs (snippets executed in CI, §5.3).

**Amendment.** Rename the section ("How it's used" / "Operating patterns");
adopt the law above into the binding record; make the CI snippet battery an
exit criterion, not a proposal.

## RC2-09 · MED · B · [AGENT LIABILITY] The agent layer is designed as a total diet, and its first payload already contains the inflated claim — boundaries must survive summarization by construction

**Attack.** The orientation: "An agent scouts once, ingests the manifest, and
never needs the prose again" (G2-4 §0). The manifest is therefore the agent's
*complete* information state — and its verified block already carries the
X-LANG inflated conjunction (RC2-01). Concrete failure chain: an agent reads
"languages: JS, C99, Python, Rust" + "byte-identical… 12/12," drops the
"(L0)" qualifier in summary (the languages array carries it; the X-LANG line
does not), recommends Python for a lockstep server — a language that cannot
replay substrate traces *at all*. The failure surfaces months later as "your
docs said." LOOK-AND-FEEL §1.6 makes it worse by design: "write claim
sentences so an agent can lift them verbatim… and be right" — a liftable
sentence that overclaims propagates with *maximum* fidelity. And boundaries
carried as prose strings are exactly what summarizers compress away; the
human path keeps boundaries inline, but the agent path (llms.txt → manifest)
holds them as one flat string array with no structure separating load-bearing
limits from color. On liability: the project ships docs *intending* agent
consumption; when the agent's summary misleads its user, the blame lands on
the library regardless of fault — the only defense is docs whose boundaries
cannot be flattened.

**Defeating evidence.** A paraphrase-robustness receipt — the manifest fed
through an off-line summarizer, the summary checked for boundary survival
(the orientation's own user+agent scenario, made mechanical and
pre-registered); a manifest whose constraints are structured fields
(`max_writers_priced: 8`, `slot_count: 64`, `overflow_semantics:
"LWW-silent"`, `attribution_under_load: "collapses"`, `python_scope:
"L0-only"`), not prose.

**Amendment.** Structure the manifest's boundaries as typed fields; put the
qualifier INSIDE the claim sentence ("byte-identical in JS, C99, and Rust;
Python implements the L0 algebra layer only"); add one line to llms.txt and
the manifest — "Agent summaries are not the contract; this manifest and the
SPEC are"; pre-register the paraphrase test as a docs gate.

## RC2-10 · MED · B · [ZLIB TEST] Guessability docs before the API freeze teach users to guess wrong

**Attack.** The orientation's zlib test ("a stranger reads it once and never
needs it again") assumes the property zlib actually has: a frozen surface.
qthe's: no semver contract shipped (amendment 4 promises it "from v0.1.0" —
nothing published; the manifest honestly says "0.0.0-research" while
package.json says 0.1.0 — see RC2-11), SPEC v1.0 still being folded (G2-1 in
flight), the API surface a G1-2 draft, the σ fork closed one round ago. Docs
written for guessability pre-freeze are an amortization error: every "you can
guess the function name" investment is torched by the first breaking change —
and 0.x semver permits breaking changes in minors. The cost lands on exactly
the early adopters the beachhead courts: the RC-07 torch scenario, arriving
via the docs this time.

**Defeating evidence.** A docs-API drift gate: every code sample on every
page executed against the current package version on every push (G2-4's
§5.3 snippet battery extended to import paths and signatures); version stamps
on every snippet ("verified against qthe@<commit>"); zlib-style "read once,
never again" language deferred to v1.0.

**Amendment.** Adopt the snippet battery as the docs' P0 exit; stamp
versions; interim voice: "the API is not frozen — copy the examples verbatim;
the SPEC is the contract."

## RC2-11 · MED · B · [NUMBER CUSTODY] The manifest is the trust root for every number on every page — and it is hand-transcribed where it matters, with the first transcription defects already visible

**Attack.** G2-4's maintenance law (§6) is the right instinct — machines write
numbers, humans write prose — but inspect the custody chain: §6.2's
number-audit job diffs usage-page numbers against *the manifest*; the
manifest's `verified` block is CI-regenerated, but the `boundaries` strings —
which carry 8/8, 80/80, 47.40%, 845-vs-633 — are hand-written, and **nothing
diffs the manifest against the scoreboard** (CLAIM-VERDICTS / BOUNDARY-MAP),
the actual sources. The trust root has an unguarded hand-transcription link.
The first defects are already on disk: (i) manifest `"version":
"0.0.0-research"` vs qthe-core/package.json `"version": "0.1.0"` — two
version numbers for one project, in the artifact agents will quote (and a
direct violation of the manifest's own §6 law: version is a number);
(ii) the delivery-under-saturation citation "80/80, E-Q14" — the
80-pair-trials-at-256-polluters figure is priced by **E-Q18's H2 axis** (C9's
polluter ladder {0,16,32,64,128,256}, 10 seeds × 8 pairs, "8/8 delivery
everywhere"), while E-Q14's own receipt is the dense-Abstain /
attribution-loss frontier: two experiments merged into one citation. Not
fabrication — both numbers exist — but citation conflation in the artifact
designed to be ingested whole by agents, in a house whose tavern law kills
invented anchors at $0.

**Defeating evidence.** A CI job that parses every number *and citation* in
the manifest and diffs it against CLAIM-VERDICTS.md / BOUNDARY-MAP.md
(extending §6.2 one link up the chain); the manifest's version field
generated from package.json.

**Amendment.** Generate the manifest's numeric and citation fields from the
scoreboard; add manifest↔scoreboard to the number-audit job; hand-write only
true prose.

---

## RC2-12 · HIGH · C · [LAW 1 IRONY] The new orientation is, by the Guild's own law, a rumor — quoted only inside an unadjudicated artifact, and already fragmenting in transmission

**Attack.** The charter has a defined channel for seat outputs (Law 6: filed,
graded, receipted) and none for **principal directives** — and the newest,
largest strategic signal since the amendments is flowing through that
undefined channel as oral text. The docs orientation appears in NO binding
file: not GUILD.md, not ADJUDICATIONS-G1.md, not registry.json, not any
charter. Its only filed trace is a quote inside G2-4's DOC-ARCHITECTURE.md —
itself unadjudicated (the registry lists no G2-4 task; per Law 6 nothing in
it counts yet). The entire docs pivot currently rests on **doubly-unsealed
text**. And the transmission is already drifting: this seat's brief quotes
the orientation as "We aren't trying to prove it works; we are showing how
it's used… the grab-and-go user [and] their agent said it would help when
the two of them read it…"; G2-4 quotes "When they put it in production with
their projects, it was so awesome…" — overlapping tails, divergent middles,
no canonical text anywhere. Two seats are building against two different
fragments of an unfiled directive, one of which (G2-4) contradicts a binding
amendment (RC2-04/07) with no adjudicated reconciliation. This is precisely
the lore-drift the program exists to prevent: the house's own jargon audit
(G1-3) bans insider oral tradition at the front door while the program runs
its strategy on one. The defect is structural — the charter's silence on
principal-directive channels — not personal.

**Defeating evidence.** ORIENTATION-DOCS-1.md filed verbatim (dated,
principal-attributed, canonical), with an adjudication paragraph reconciling
it against amendment 5's headline directive (the collision priced in
RC2-04/07) and a re-brief to every affected seat; a charter amendment
defining the principal-directive channel.

**Amendment.** File the orientation; amend the charter so principal
directives enter the same receipt pipeline as seat outputs — the exemption
for the one issuer who currently bypasses Law 1 should be written down or
not exist.

## RC2-13 · HIGH · C · [VERIFICATION MONOPOLY] One verifier wrote the plan, minted the oracle, grades the seats, adjudicated the attack on itself — and the scale it grades on has no anchors, no second rater, and no recorded failure

**Attack.** The concentration, enumerated from the program's own records: the
Orchestrator authored the production plan (attacked in G1), generated the
conformance corpus from its own reference kernel (g2-corpus-v1:
"kernel_source: qthe.mjs @ b6953269…"), grades every seat, adjudicated the
12/12 attack on its own plan (the verifier graded the critique of the
verifier's work), and hand-maintains the registry. Checks against this
concentration: none exist. No inter-rater mechanism (one grader, one scale);
no published rubric — **G3, the gate to practice rounds, is promised and
undefined: no rubric artifact exists anywhere in the tree**; and the G1 grade
distribution — A, A, A, A+, A across five radically diverse artifacts (C99
re-derivation, API design, persona pitches, adversarial attack, economics
playbook), zero failures, zero B's — is uncalibratable: a scale with no
recorded failures and no anchors cannot distinguish "all work excellent"
from "leniency," and the program's own law (priced, not asserted), applied to
its own grading, finds the grades unpriced. The bus-factor risk the plan
flags for the repo (single maintainer) is the program's own structure: a
single verifier, with a single principal above it, and no defined failover
(Law 6 makes the Orchestrator a hard central dependency — nothing counts
without it).

**Defeating evidence.** A published G3 rubric with grade anchors and an
explicit failure definition, filed BEFORE G2 completes; a blind inter-rater
check (a second instance re-grades a sample of G1 artifacts; the delta
recorded as a receipt); a written delegation rule for verifier unavailability.

**Amendment.** Publish the rubric; run the inter-rater sample; separate the
powers where separable — corpus generation to standards-warden with a
SPEC-derived generator (RC2-14), registry generation made mechanical
(RC2-16), grading anchored by published criteria rather than one reader's
judgment.

## RC2-14 · HIGH · C · [ORACLE LINEAGE] The conformance oracle shares a lineage with the implementation under test — priced honestly, with the qthe-verify contrast

**Attack.** g2-corpus-v1's own header: generated by the Orchestrator from the
reference kernel; "self_determinism: PASS (every case run twice,
byte-identical)" — the generator re-running itself, which prices the
kernel's *consistency* and nothing else. Case inventory: 24 cases, of which
4 are L0 (algebra, hand-derivable from SPEC — verified by hand, see preamble)
and **20 are substrate cases whose expected values are kernel-minted**. As a
conformance oracle this verifies "agrees with the reference kernel," not
"satisfies the SPEC" — and the reference kernel is the same operator's
artifact. Two live dangers: (1) **the corpus PINS the ambiguity resolutions**
— sub-adjacent-lww-32x32 pins A3/R4 LWW + A1 live-reads;
sub-twins-desert-sigma-half pins A4+A1+A17; sub-degenerate-1x4 pins A14;
sub-flood-abstain-16x16 pins 256-writer saturation. So when standards-warden's
SPEC v1.0 fold writes a normative sentence, CI enforces the *kernel's*
resolution regardless: if the fold ever diverges from the kernel, the corpus
stays green and the spec dies **silently** — corpus-over-spec with no alarm.
(2) **G2-2's op-log corpus will be minted the same way** (the seat's work dir
already holds qthe.mjs.ref) — sealing whatever interleaving semantics the
first implementation happens to have as "the oracle," one round before RC-05's
determinism claims depend on exactly those semantics. The honest contrast,
priced: qthe-verify's structure is *better* — its reader is spec-only, never
imports vendor code, and only the expected hashes are kernel-minted, which is
the correct structure for a reproducibility claim — but its README's
"algorithm, in full" was written with the kernel in view and already embeds
A1's resolution, so even that independence is method-only, not
principal-independent. Net price: the Guild corpus is a first-class
**regression** oracle and a second-class **conformance** oracle, currently
labeled as the latter ("the corpus is the oracle: replay byte-identical or
divergent, no third option").

**Defeating evidence.** (i) Corpus cases split by role and labeled —
"regression (reference-agreement)" vs "conformance (SPEC-derivable)";
(ii) a traceability binding: every pinned case cites the SPEC v1.0 sentence
it enforces, and a CI alarm fires when a normative sentence changes without
corpus regen + version stamp; (iii) for G2-2: expected outputs for at least
the first 10 op-log cases derived from the OLOG-SPEC by hand-audit, not by
running the implementation; (iv) one canary case where SPEC text and kernel
behavior would diverge if the fold drifted.

**Amendment.** Adopt (i)–(iv); rewrite the corpus law line: "the corpus is
the REGRESSION oracle; the SPEC is the conformance oracle; a divergence
between them is a bug in one of them, surfaced loudly."

## RC2-15 · MED · C · [IRONY CHECK] Append-only journals with no tamper evidence: the program enforces stone-v1 receipt chains on the kernel and runs its own governance on unhashed markdown

**Attack.** Law 5: "Journals grow; history is never rewritten."
Enforcement: none visible. The guild directory has no version control (no
.git in the workspace copy — if a canonical VCS exists upstream, no file
here references it); journals carry no hash chain, no signatures, no
cross-check. A seat — or the verifier — could edit history undetectably.
Worse, journals are self-written records of verification: each seat's journal
asserts "Orchestrator verification: …" in the seat's own hand, and nothing
mechanically cross-audits journal claims against ADJUDICATIONS (the actual
record). The repo being governed has a 38/38 chain auditor, seal receipts,
and negative controls that DETECT tampering; the program doing the governing
has a norm and good intentions. This is the irony check my seat exists to
run: the falsification house's own governance is the least falsified
artifact it owns.

**Defeating evidence.** Journals under VCS with signed commits, or each
entry closing with the sha256 of the prior entry (five lines of discipline,
cheaper than the repo's own chains); a mechanical cross-audit script diffing
every journal's grade/verification lines against the ADJUDICATIONS files.

**Amendment.** Hash-chain or VCS the guild tree; add the cross-audit to the
Orchestrator's own checklist; state in the charter what enforces Law 5 —
currently nothing does.

## RC2-16 · MED · C · [REGISTRY DRIFT] The drift risk has already materialized: the machine-readable state says nothing is in flight while G2 work exists on disk

**Attack.** Four independent drift receipts, all current: (1) registry.json
says `"round": "G1"`, `"round_status": "complete"` — while G2 tasks are
dispatched and in flight (this brief is G2-5); GUILD.md likewise says
"Current round: G1 — COMPLETE" with G2 "queued." (2) stranger-experience's
registry entry says `"next": "G2-x landing-page + docs restructure"` — an
*unnumbered* task — while its actual task G2-4 has three artifacts on disk.
(3) kernel-forge's registry `"next"` is labeled **"G1-2 golden-vector
conformance vs Orchestrator corpus"** — but G1-2 is library-craft's
already-graded task ID: one ID, two meanings, and kernel-forge's real G2 work
dir is G2-6, which the registry does not know exists (nor G2-7). (4) No G2
task appears as a task entry under any seat. The program's machine state
lies to exactly the consumer class the new orientation is built for — an
agent scouting the program — and the hand-maintained registry violates the
program's own adopted doctrine (amendment 10: dashboards CI-generated,
hand-edits forbidden; the registry is a dashboard with worse discipline).

**Defeating evidence.** registry.json generated from the journals +
ADJUDICATIONS (single source of truth) with a drift check; or at minimum a
round-opening update; a consumer able to read the true program state from the
registry alone.

**Amendment.** Make the registry generated, not maintained; fold round-state
transitions into the dispatch ritual; registry drift becomes a standing
red-chamber check at every round boundary.

## RC2-17 · LOW · C · [BOOTSTRAP] G3's review board is circularly qualified, and the attacker seat needs recusal rules before it sits

**Attack.** GUILD.md: "each seat faces a review board (Orchestrator +
red-chamber spot attacks). Pass = cleared for practice." No seat has passed a
qualifying review; the board that grants qualification is unqualified by the
very standard it administers — a clean bootstrapping gap, currently
unaddressed by any grandfather clause. Second: red-chamber sits on every
board while having cited other seats' outputs as positive evidence (this
brief cites G1-3's pitches and G2-4's artifacts as receipts) and while those
seats' charters cite red-chamber's findings back (RC-05/08/11). The seat that
grades its own evidence sources has a conflict neither the charter nor the
law names. Third: "spot attacks" is undefined — sampled or exhaustive? Is a
G3 attack finding appealable, and to whom (the verifier whose plan the
finding may attack)?

**Defeating evidence.** A G3 rules file: explicit grandfather clause (G1/G2
coursework grades are interim qualifications; the principal is ex-officio
qualified); recusal rules for red-chamber (no board seat on a seat whose
output it cited as evidence in the same round); "spot attack" defined with
scope and an appeal path to the principal.

**Amendment.** File the G3 rules before any board convenes. Recusal first,
attack second.

---

# HONESTY GRADE — the Guild program itself

**B+ — the most honest institution in the room, running on the one thing its
own law forbids: an unverified verifier.** The program is far above norm: it
invited, accepted, and *paid for* a 12/12 attack on its own plan; it amends
its binding record in public; its seats catch their own errors and file them;
the adjudications, journals, and corpus are structurally better than any
comparable internal program I have attacked. But measured against its own
law, the gaps are systematic, not cosmetic: verification is a monopoly with
no inter-rater check, no published rubric, an undefined G3, and a G1 grade
distribution with zero failures and no anchors (RC2-13); the conformance
oracle shares lineage with the implementation under test and will silently
override the SPEC it exists to serve (RC2-14); append-only is a norm with no
mechanism (RC2-15); the registry — the program's own machine-readable
receipt — is already false in four independent ways (RC2-16); and the
newest, largest strategic directive is an unfiled rumor fragmenting in
transmission between seats (RC2-12). Every defect dies cheap — hash-chain
the journals, generate the registry, publish the rubric, file the
orientation, label the corpus's two roles, itemize the determinism receipt —
and that cheapness is the tell: the program has not yet noticed that its law
applies to itself. B+ now; A− the day the verifier submits to verification.
