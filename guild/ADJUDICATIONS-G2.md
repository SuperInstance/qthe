# ADJUDICATIONS — Round G2

The Orchestrator's verification of G2 seat outputs. Per Law 6, nothing counts
until verified here. Date: 2026-11-02.

## kernel-forge G2-6 — GRADED A+ (the round's centerpiece receipt)

Verified by ORCHESTRATOR RE-RUN (not seat-reported): `run.sh` re-executed;
v1.1 conformance **24/24 PASS**, ASan/UBSan clean both modes, byte-identical
reruns. Act-1 blind result 10/24 with all 14 twin-active cases failing
events-first at tick 1 — the A1 fingerprint, with a closed-form prediction
(#Abstain − #distinct pre-tick d) satisfied by all 20 cases. The three
rulings (R-live, R-feedback, R-sigma) were implemented with zero iteration
after hand-solving desert (period-3 chase), adjacent-lww (period-4 baton),
and the tick-1 closed form. Receipt meaning: an independent spec-only
derivation matched the reference on 13/17 decisions blind, and the complete
delta to 24/24 is exactly the three rulings — evidence that SPEC v1.0's
N1/N2/N3 close the entire known gap.

## standards-warden G2-1 — GRADED A

Verified: N1 (live row-major reads) and N2 (twin-into-pressure) checked by
the Orchestrator against the reference kernel's R2/R3 receipts — normative
text matches, including the self-read-visibility subtlety. The seat built a
Python model of the normative semantics, reproduced all 24 corpus cases
byte-exact, and ran COUNTERFACTUAL WITNESSES for every ruling (staged reads
→ evtCounts 0,2,0 vs corpus 2,2,2; truncating σ → twinTotal 79 vs 53). Two
fixture notes corrected honestly (1×4 cannot distinguish dedup; checkers
cannot distinguish accumulator persistence). 17/17 Guild ambiguities closed
(A1→N1 … A16→N11), 3/3 repo A-R receipts closed, zero forks left open.
Honest open items recorded: term-bits unpinned by corpus v1, fixed-plane
encoding deferred to REPRESENTATION-LAW.md.

## falsification-bench G2-2 — GRADED A

Verified: designs read; probe receipts re-checked (seed aliasing, σ-leak).
THE ROUND'S SHARPEST FINDING (accepted, dispatched): corpus v1 is
TERM-BLIND — the desert σ cases are byte- and count-identical because only
pressure signs survive, so a σ-ignoring build passes 24/24. Corpus v2 must
pin twin-term tokens, not counts. Ruling S adopted (integer-only ops; σ as
parse-only canonical token; DEFAULT_SIGMA pinned to bits 0x3ff95c01a39fbd68
≈ "1.584962500721156"). P1 exit gate G1–G10 adopted as the RC-05 pricing
checklist. The auto-journaling-as-sticky-setOptions laundering path it
found in OLOG §4 rule 5 was simultaneously killed by library-craft's v0.1
(see below) — convergent elimination from two seats.

## stranger-experience G2-4 — GRADED A (after amendment)

Verified: README read in full by the Orchestrator; all snippets were
executed live by the seat; the seed-42/100-tick hash (b49b9a13…f6042)
cross-checks against the G1-3 quickstart receipt. Boundaries are in-line
as operating specs; trust layer exactly one click deep; zero house
vocabulary. AMENDED BEFORE SHIP per RC2-01: the determinism receipts are
now itemized in five places (README body, state table, llms.txt block,
guides boundary, manifest JSON) — no more "four languages 12/12"
conjunction anywhere.

## red-chamber G2-5 — GRADED A+ (second consecutive top-of-round attack)

17 findings (RC2-01…17) across three targets. Adjudication:
- **RC2-01 (determinism conjunction inflated): VERIFIED by the Orchestrator
  against primary sources** (repo's own distribution is JS float+fixed,
  C99 battery, Python L0-only; the 12/12 replay is the JS spec-only
  rebuilder). APPLIED before push — five amendments above.
- **RC2-07 (zipp's loud failures vs qthe's silent traps): ACCEPTED.** The
  loud-failure law: every known silent trap gets a loud guard in the
  product. Status: seed aliasing → PrngSeedError (library-craft v0.1, done);
  σ-leak → TickOptions deleted, σ changes only via journaled ops (done);
  LWW silent drops → observable-divergence multi-writer corpus (designed,
  falsification-bench G2-2); saturation → documented in front-door spec
  (done).
- **RC2-14 (corpus lineage circularity): ACCEPTED.** The corpus is
  operator-minted from the kernel it judges; it pins ambiguity rulings (not
  implementation correctness the way qthe-verify does). Amendments: corpus
  header carries mint lineage (already records kernel commit + generator);
  corpus v2 term-pinning is a P1 exit; qthe-verify remains the
  method-independent check; the README itemization names the Guild corpus
  as Guild-minted.
- **Program-target findings (no rubric, no inter-rater, journal
  tamper-evidence, hand-maintained registry, single verifier): ACCEPTED as
  the G3 agenda** — see amendments below. The Guild honesty grade **B+**
  ("running on the one thing its own law forbids, an unverified verifier")
  is accepted.
- Remaining findings: accepted in principle, dispatched to G3 review board
  with named defeating evidence to check.

## library-craft G2-7 — GRADED A

Verified: tsc 5.6.3 --strict --noEmit exit 0 against two usage files (log
kept in work dir). The σ-leak fix is stronger than ordered: TickOptions
DELETED — σ and the wormhole gate change only via journaled setOptions ops,
making the leak inexpressible at the type level; OLOG §4 rule 5 retracted
with a dated thinking-marker. Fresh probes (not remembered receipts) drove
the compat typing (all expandos optional — structuredClone drops `bytes`
too). CODE-COMMENT-STYLE.md adopted as project law; the next-agent test is
its keystone.

## AMENDMENTS ADOPTED (binding)

1. **AM-G2-1 · Receipt itemization.** "Four languages, 12/12" is banned as
   a phrase until a single four-language corpus replay exists (P1 exit).
   Every determinism claim itemizes: JS+rebuilder 12/12; Rust 13/13; C99
   19-case battery + 24-case Guild corpus; Python L0.
2. **AM-G2-2 · Loud-failure law.** Silent traps get loud guards: shipped
   (PrngSeedError, σ-leak inexpressible), designed (LWW observability),
   documented (saturation spec). No new silent failure modes ship.
3. **AM-G2-3 · Corpus honesty.** Corpus v2 pins twin-term tokens; header
   carries mint lineage; qthe-verify stays the method-independent check.
4. **AM-G2-4 · The verifier is verified at G3.** Review-board rubric
   written BEFORE G3; inter-rater check (two graders on one artifact
   sample, agreement receipted); journal entries become hash-chained
   (tamper-evident); registry regeneration scripted (no hand-maintained
   state).
5. **AM-G2-5 · Docs orientation guardrails.** Trust layer exactly one
   click deep, never zero; "in service" sections are patterns with
   boundaries, never narratives with claimed outcomes (no fictional
   users); the manifest carries boundaries verbatim so agent paraphrase
   inherits them; "zlib test" language stays gated on a shipped semver
   contract.

## Dispatch to G3

- ALL seats: qualifying reviews under the new rubric (house-manager drafts
  it first — its activation input is now FINDINGS-G2 + this file).
- falsification-bench: corpus v2 format spec (term tokens).
- stranger-experience: docs/production implementation on the branch
  (guides, llms.txt, manifest as real files).
- red-chamber: standing attack on G3 reviews; verify AM-G2-1..5 landed.
