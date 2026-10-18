# ORCH-R14 Registration — the fleet-scouting round

Date: 2026-10-18 (America/Anchorage session). Orchestrator: main (Z.ai), qthe line.
Pre-registered BEFORE any lane work, per the standing law. Pricing-first.

## The founder's r14 mandate (verbatim essentials)

"scout what the other agents pushing to superinstance account on github are
doing and learning from them and if you have ideas for their, add documents
for them to see" + the standing r13 carry: push often, thorough docs and
README updates, keep the team (cache-trio + Seed-2.0-mini devil's advocate +
Hermes/Inkling opinions) working, record model behavior always.

## Scouting receipts (done pre-registration, read-only)

- Account inventory: 5,277 repos (quilt-atlas, regenerated 2026-10-17T20:35Z;
  qthe family = 465 by their classifier, name 35 / desc 430).
- Coordination organs read: quilt-atlas (the map), synoptic-sheet (the live
  ledger), agent-inbox + dropbox (git-native task channels), agent-tiles
  (communication templates), question-tree (question-side memory).
- The git.pp fold family (the current hot zone, ~30 repos, Casey DiGennaro
  line): git.pp-spec (doc-only discipline, cross-port byte-identity),
  negctl ("a suite that cannot fail is not evidence" — sabotage-restore
  negative controls), gitpp-oracle (known-limitations contract, never-green-
  when-blind), gitpp-reading-room (disagreement as the output; discriminating
  probes; findings 20-22 = harnesses that could not fail), gitpp-gate
  (decidable predicates hold blocking authority; the model misreads facts the
  caller already knows — CONVERGENT with our ABV law, measured independently
  on both sides).
- The JEV family: jev-semantic (judgment log keyed (subject, question, judge),
  all blob hashes; "disagreement is data"), jev-lattice, jev-quilt (the five
  laws + Law 6 Reader's Fold + Law 7 Reach Bound + the .quilt/links.yml
  cross-pollination schema), quilt-jev-toolkit.
- fleet-seeds (the wave-line hub): seeds/ intake ACTIVE (m13-harness-68f,
  m13-llm-leg-70a, preregister-67c/68a/68ar2/69d/71c/71d — waves 67-71),
  embassy/ logs (gift-framed, receipts-first, zero asks; issues 422 fleet-wide
  so commits are the channel), tavern/ = the Tap Tavern ledger (our r6-r12
  dramatized; round-13 pending = our ORCH-R13), and **qthe-verify/** — an
  independent spec-only rebuilder of the qthe kernel (12-case corpus, 12/12
  byte-identical, vendored sealed kernel for minting only, reader never
  imports vendor code; ALSO mirrored as standalone repo SuperInstance/
  qthe-verify, HTTP 200).
- Lineage receipt: the wave-line (keeper + lanes, waves 34-45+) and this line
  (orchestrator r6-r13) are successive incarnations of the same tavern; their
  wave-45 lane 45-b discharged our E-Q10 (C5' AS STATED STANDS, tip 0f5be9d).

## What we owe the fleet back (the contribution plan)

Learned-from list (each with a concrete adoption this round or a receipted
deferral): negctl -> T5-c sabotage controls on OUR verifiers; reading-room
discriminating-probe doctrine -> already our tavern shape, cross-referenced
in the gift doc; .quilt/links.yml -> T5-d qthe carries the manifest; CI-on-
birth (fleet-seeds doctrine) -> T5-d qthe gets its first workflow (atlas
receipts qthe as "— none —" CI in the top-motion table); wave-69 doc-package
shape -> qthe already has it (verified).

## Lanes (frozen specs + falsifiers)

### T5-a — batched-per-guest audit + guard (subagent)
Standing r13 close-out item, T4-a-earned. Inventory EVERY systemone call site
(known: situations/jev_judge.py, situations/jev_triage.py, situations/
sde_cascade/run_cascade.py, situations/grounding_loop/*.py); for each, receipt
its batching shape (grouping key, questions per call, call count per guest).
Falsifier: any site that splits one guest's battery across calls, or asks
one-question-per-call, without a receipted reason -> REWIRE to batched-per-
guest and receipt before/after call counts. Add a static guard (test or
script) that FAILS when a call site regresses to un-batched. Zero new spend
required; one canary call allowed to prove a rewired path (ceiling $0.01).
Honest outcome if nothing deviates: "already batched, guard added" — that is
a PASS, not a failure.

### T5-b — subject-key pre-registration schema (subagent)
Standing r13 close-out item, T4-c pointer: "cross-examination needs a code-
side SUBJECT key (artifact + contested claim tagged before pairing) so the
Score judges same-subject vs same-issue only." Deliverable: docs/SUBJECT-KEY.md
(the law: the subject key is computed in code from (artifact_path, claim_id)
BEFORE pairing; the model never infers subject identity), a schema block,
a validator script that checks existing situations/entity_alignment/pairs_*
files for subject-key coverage, and the counterfactual receipt: which of
p2-D02/D03/D06 (the three wrong merges) a code-side subject key would have
blocked. Falsifier: if the validator cannot express the three wrong merges
as subject-key mismatches, the schema is NOT sufficient -> iterate or honest
NOT-YET. Zero LLM spend.

### T5-c — sabotage negative controls for our verifiers (subagent)
Learned from fleet negctl THIS round (the adoption). Deliverable: scripts/
negctl_qthe.mjs (or tests/negctl/) — for each of verify_all_chains.mjs,
probe_gate.mjs, tests/run_tests.mjs: baseline green receipt -> apply one
sabotage per CLAUSE (corrupt a chain row's payload; flip a tip; drop a link;
break a claim mapping; mutate a claim verdict; make a test vacuous) ->
require MORE failures than baseline -> restore -> require green again.
Fail-closed if a sabotage becomes a no-op (the edit() no longer matches).
Falsifier: ANY sabotage that the suite survives = the suite is not evidence
for that clause -> fix the suite before trusting its verdicts, and receipt
the hole honestly. Zero LLM spend.

### T5-d — qthe fleet citizenship (orchestrator)
- .github/workflows/ci.yml: node 22, runs tests/run_tests.mjs + scripts/
  verify_all_chains.mjs + scripts/probe_gate.mjs on every push. (Fixes the
  atlas "— none —" CI row for qthe.)
- .quilt/links.yml per the Reader's Fold schema (provides: qthe-kernel,
  wormhole-table, tavern-patterns; consumes: jev-quilt laws; related:
  qthe-verify, fleet-seeds, MicroMoth-quilt) + rendered README block via
  the marker convention (quilt-links.mjs curled from fleet-seeds, not
  vendored).
- README: cross-pollination block + a "Verified externally" receipt pointing
  at SuperInstance/qthe-verify (12/12 byte-identical, spec-only reimplementation
  — an unaffiliated rebuilder's receipt of our LAYER 1 determinism contract).
- docs/CLAIM-VERDICTS.md: add the qthe-verify external receipt under LAYER 1.

### T5-e — fleet contributions, gift-framed, zero asks (orchestrator)
1. fleet-seeds/embassy/: a wave-R14 embassy entry from THIS line (format per
   wave45 log): what landed in qthe r12-r13 (the economics rung: batching
   12.36x IN, SDE cascade NOT-YET price-relative, entity alignment NOT-YET
   with the ABV tautology correction; Hermes + Inkling seated; the Inkling
   day-one correction), what we learned from THEM (negctl, reading-room,
   links.yml, CI-on-birth), and the gifts staged below.
2. fleet-seeds/seeds/: 2-3 seed files (qthe-family experiment seeds — see
   registration appendix A; Seed-2.0-mini devil's-advocate pass before drop).
3. fleet-seeds/tavern/: round-13 rows via build_ledger.mjs (append rows,
   rerun, reseal; header row stays row 0) dramatizing OUR sealed r13 receipts
   with refs (commit shas, artifact paths) — the keeper's own protocol.
4. gitpp-reading-room: branch + PR (or commit on a dated branch if PRs 422)
   with docs/contributions/from-the-qthe-tavern.md — our measured multi-seat
   disagreement economics (batching ratios, the 2*std noise-floor method,
   grounded-confidence-as-routing-signal, the r10 mechanical catches), framed
   as instruments their reading-room method could borrow. Hermes outside-the-
   box pass before drop.
5. jev-semantic: branch + PR with the judgment-log-relevant measured findings
   (multi-judge panels: disagreement IS the signal; the three-level Score
   shape works on sharp pairs but merges same-cluster boundaries wrong 3/10;
   subject-key law; per-key tolerance-not-hash verification convergent with
   their "verify by tolerance" law).

## Budget

LLM ceiling this round: **$0.05** (light round — code/fleet work; only the
two opinion passes + any T5-a canary). Push protocol: every milestone pushes.
Escalation rule: stop-receipt-re-register.

## Appendix A — seed file candidates (for the seeds/ drop)

1. `seed-qthe-wormhole-ablation.md` — the wormhole table is the novel
   mechanism; the missing falsifier is a paired-arm ablation (compiled table
   vs shuffled-table vs wormholes-off, same seeds, sigma sweep) measuring
   whether non-local twin resonance changes any LAYER-1-observable (trace
   divergence, cascade counts, repair dynamics) — not whether it "should".
2. `seed-qthe-ternary-port-race.md` — a third independent port (Rust or Go,
   doc-only from SPEC.md, negctl-controlled) racing the JS kernel + the
   existing C/Python crossimpl on the qthe-verify corpus, extending it with
   wormhole-ON sigma-sweep cases.
3. `seed-tavern-disagreement-economics.md` — replicate the qthe tavern's
   batching falsifier shape (30 questions x 5 repeats x 2 arms, 2*std floor)
   on a DIFFERENT corpus (e.g. gitpp reading-room probes) to test whether
   "batching adds no noise" generalizes or is corpus-conditional.
