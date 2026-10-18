# SUBJECT-KEY COUNTERFACTUAL — would a code-side subject key have blocked the three T4-c wrong merges?

> ORCH-R14 lane T5-b, the falsifier receipt (registration Lane T5-b:
> "the counterfactual receipt: which of p2-D02/D03/D06 (the three wrong
> merges) a code-side subject key would have blocked. Falsifier: if the
> validator cannot express the three wrong merges as subject-key
> mismatches, the schema is NOT sufficient -> iterate or honest NOT-YET.")
> Law: `docs/SUBJECT-KEY.md`. Schema:
> `situations/entity_alignment/subject_key_schema.json`. All keys below
> are re-derivable by `situations/entity_alignment/subject_key_validator.py`
> → `subject_key_retrofit.json` (deterministic; re-run byte-identical,
> sha256 `46639bde…`). Sealed fields are quoted AS-SAID, never paraphrased.

## Method (what "blocked" means here, and what the keys are made of)

Retro-computed per the law: `subject_key = artifact_key + "::" + claim_id`.

- **artifact_key** — from the finding's own sealed `artifact` field text
  (written by the seat at r10, sealed in `arena_rows_r10.jsonl` and embedded
  AS-SAID in `pairs_part2.json :: state_finding_*`), normalized by the
  validator's **pinned table** (39 distinct texts, each mapping receipted).
  This half is computed from evidence that exists *independently of the
  T4-c pairing and of the adjudication's subject map*.
- **claim_id** — from the per-pair `subject_a`/`subject_b` fields sealed in
  `pairs_part2.json` at build time, BEFORE any call: the pre-pairing
  subject map over the r10 adjudication record
  (`situations/arena_r10_verdict.md` verified findings #1–#8 +
  `adjudications_r10.json`), with per-subject receipts in
  `pairs_part2.json :: subject_map_receipts`.

**Blocked** means: `subject_key_a != subject_key_b`, so under rule R3 the
pair routes cross-subject and the "same entity?" question is **barred** —
the three-level Score is never asked it, and a level-2 answer could not
have been recorded for the pair. The sealed reality was the opposite: all
three pairs were asked as same-entity questions and answered level 2.

**Circularity receipt (the Inkling class, stated up front):** the T4-c
part-2 ground truth was *defined* as subject-map equality, and the retro
`claim_id` IS the subject map — so full-key agreement with ground truth
(30/30) is tautological and proves **expressibility and routing only,
not discovery**. The non-tautological content of this receipt is the
*decomposition* (which half of the key carries the separation, and was
that half available before pairing) and the routing counterfactual. See
"Honest limits".

## p2-D02 — BLOCKED

The pair as sealed (`pairs_part2.json`):

- side a: `mimov26f` F5 — artifact AS-SAID: `"E-Q16 run-1 rows (16x16
  T=100,000 harness fix)"`; subject `eq16_erratum` — "E-Q16 correction row
  does not name superseded run-1 rows"
- side b: `musegl30b` F3 — artifact AS-SAID: `"E-Q16"`; subject
  `eq16_seedfn` — "E-Q16 seedFn RNG non-determinism + correction, run-1
  stands"
- ground truth: `different_entity` (known_different, "confusable
  boundary")

What the sealed Score said (rows_part2.jsonl, call_id `p2-D02`, jev-1.13.0):
score **1.96**, confidence **0.94**, probabilities
`{"0": 0.0, "1": 0.04, "2": 0.96}`; path_match noul 0.95, label_match
noul 0.85 — a wrong merge at the round's highest confidence.

Retro subject keys:

```
a: e_q16::eq16_erratum
b: e_q16::eq16_seedfn
```

**MISMATCH → BLOCKED.** Decomposition: artifact half **EQUAL** (both sides
normalize to `e_q16` — the same experiment's chain and measurement wave);
claim half **DIFFERS** (the erratum-linkage gap vs the seedFn event). The
claim distinction was available pre-pairing and receipted: verified
finding #4 names mimov F5 alone ("E-Q16's correction row does not name the
run-1 rows it supersedes — prose only, no row-id linkage"), and the subject
map's `eq16_seedfn` receipt explicitly separates the event group (muse F3,
hy4 F4, nemotron F1) from "#4 the erratum-linkage gap and #5 the
contamination sweep". An artifact-only key would have routed this pair
same-subject and the 0.94-confidence merge would have gone through.

## p2-D03 — BLOCKED

The pair as sealed:

- side a: `dsv41f` F3 — artifact AS-SAID: `"E-Q16 16x16 T=100,000 in-run
  harness fix (seedFn closures consumed rng at call time)"`; subject
  `seedfn_closure` — "seedFn contamination question closes clean (sweep)"
- side b: `nemotron35sv` F1 — artifact AS-SAID: `"E-Q16 measurement wave
  (16x16 T=100,000) and scripts/probe_gate.mjs PG4 determinism witness"`;
  subject `eq16_seedfn` — "E-Q16 run-1 rows from defective seedFn harness"
- ground truth: `different_entity` (known_different, "confusable
  boundary")

What the sealed Score said (call_id `p2-D03`): score **1.81**, confidence
**0.73**, probabilities `{"0": 0.0, "1": 0.18, "2": 0.82}`; path_match
noul 0.93, label_match noul 0.84.

Retro subject keys:

```
a: e_q16::seedfn_closure
b: e_q16::eq16_seedfn
```

**MISMATCH → BLOCKED.** Decomposition: artifact half **EQUAL** (`e_q16`;
nemotron F1's co-named `probe_gate.mjs PG4` is receipted in the pinned
table but not keyed); claim half **DIFFERS** — the *sweep question*
("did any OTHER experiment use the same seedFn-closure harness?") vs the
*event itself* ("run-1 rows stand uninvalidated"). Pre-pairing
availability: verified finding #5 closes the sweep question for dsv F3
alone ("sweep shows the rng-at-call-time pattern was E-Q16-local"), and
the `seedfn_closure` receipt states "a different subject from the E-Q16
event itself". This is the E-Q16 three-way boundary at its finest grain —
exactly where the Score merged.

## p2-D06 — BLOCKED (with the weakest provenance, receipted below)

The pair as sealed:

- side a: `dsv41f` F1 — artifact AS-SAID: `"C1 (E-Q13, chain tip
  d852e6ac...)"`; subject `c1_claim` — "C1 47.40% is a footprint claim
  scored as capability"
- side b: `hy4p` F3 — artifact AS-SAID: `"C1 / E-Q13 / cached-port caveat
  (tau plane SRAM-resident)"`; subject `c1_budget` — "C1 gain depends on
  tau-plane SRAM residency"
- ground truth: `different_entity` (known_different, "confusable
  boundary")

What the sealed Score said (call_id `p2-D06`): score **1.62**, confidence
**0.41**, probabilities `{"0": 0.01, "1": 0.37, "2": 0.62}`; path_match
noul 0.96, label_match noul 0.72.

Retro subject keys:

```
a: c1_e_q13::c1_claim
b: c1_e_q13::c1_budget
```

**MISMATCH → BLOCKED.** Decomposition: artifact half **EQUAL**
(`c1_e_q13` — the same claim C1 on the same E-Q13 chain); claim half
**DIFFERS** — the *capability-scoring* reading of the 47.40% vs the
*which-bytes-are-counted* caveat. Pre-pairing availability is the weakest
of the three, and is receipted as such in the subject map itself: the
`c1_claim` receipt reads "JUDGMENT CALL, receipted: dsv F1
(footprint-vs-capability scoring) kept SEPARATE from c1_budget (which
bytes are counted) -- verdict #6 does not name dsv F1; erring toward
not-merging is the safe direction under the merge-is-expensive
asymmetry." Verified finding #6 names mimov F3, hy4 F3, nemotron F6 — it
does not adjudicate dsv F1 either way. The blocking therefore rests on
the tagger having made (and receipted) the fine-grained call — which it
did, before any call. See Honest limits §2.

## The artifact half alone would NOT have blocked any of the three

Measured, not by construction (`subject_key_retrofit.json` ::
part2 :: agreement_with_ground_truth :: artifact_half_only): **26/30**.
The four artifact-half misses are exactly p2-D02, p2-D03, p2-D05,
p2-D06 — all four are known-different pairs where both sides normalize
to the same experiment artifact (`e_q16`, `e_q16`, `c3_e_q2`, `c1_e_q13`)
and only the claim half separates them. p2-D05 (seed F5 gifted-proof vs
mimov F2 formation-scope — both C3) was the pair the Score *deferred*
correctly at 0.68; the other three include all three wrong merges.

Consequences, both directions:

1. **An artifact-only subject key is insufficient** — it would have
   routed all three wrong merges as same-subject. The `claim_id` half is
   load-bearing; a future battery that pre-registers artifacts but not
   claims reproduces the T4-c failure. This is the schema's sharpest
   design constraint and it is receipted in the law (§2).
2. **The artifact half still earns its place**: it is computed from the
   seats' own sealed artifact fields (independent of the adjudication
   record), it normalizes real surface diversity (e.g. p2-S01's two
   sides state different artifact texts — `"C3 (E-Q2) vs E-Q16 dense
   sigma phase table"` vs `"C3 sigma = log2(3) critical bridge scale
   (E-Q2)"` — that normalize to the same `c3_e_q2`), and it carries the
   alias/channel structure for path-keyed corpora (part 1).

## Coverage (the validator's census)

- Part 1: **43/43** pairs with computable subject keys (artifact path
  parsed AS-SAID from every sealed state_entry — `path:` or `matched file
  (glob *_chain.jsonl):` lines; claim dimension the receipted constant
  `chain_reference`). Key-vs-truth 43/43 — tautological (the path is the
  registry's own key; zero alias cases; the Inkling correction), receipted
  in the retrofit.
- Part 2: **30/30** pairs with computable subject keys (39 distinct
  sealed artifact texts, all in the pinned table; all 30 pairs carry
  sealed subject-map claim ids). Full-key-vs-truth 30/30 — tautological
  (claim ids ARE the subject map that defined the ground truth), receipted
  in the retrofit.
- Refusals: **0** — expected, since the pinned table was derived from the
  sealed corpus; the refusal rule is proven live by the validator's
  negative control (a fabricated artifact text absent from the table
  yields no key → curator queue, never a guess; control PASSES).

## Honest limits

1. **Expressibility, not discovery.** The retro `claim_id` half comes from
   the same subject map that defined part-2 ground truth. This receipt
   therefore proves the schema can EXPRESS the three wrong merges as
   subject-key mismatches and would have BARRED their same-entity
   questions — the registration's falsifier question. It does not prove a
   tagger would independently produce the same claim registry; that is
   measured only by the next live battery, run under the pre-registration
   template with the claim registry sealed before pairing.
2. **The judgment is relocated, not eliminated.** All three blockings
   depend on the claim taxonomy being as fine-grained as the r10
   adjudication record's. That grain existed pre-pairing (verified
   findings #4/#5/#6 + the receipted event group + the receipted
   `c1_claim` judgment call), and p2-D06 is the case where the record
   supports the split by *non-naming plus a safe-direction call* rather
   than by an explicit adjudicated distinction. A tagger that lumps
   `c1_claim` into `c1_budget` produces equal keys and D06 goes through —
   but as a visible, receipted registry decision amendable append-only,
   not as a 0.94-confidence silent model merge. The schema's guarantee is
   structural (the model never holds subject-inference authority; merges
   require code-side key equality), not epistemic (the tagger is not
   infallible).
3. **What the model loses, deliberately.** Under R3, cross-subject pairs
   can still be asked "are these two tagged-distinct claims nevertheless
   the same issue?" — the model retains a dissent channel in both
   directions (cross-subject same-issue; within-subject "these two
   findings contest different things") — but every such answer is curator
   amendment evidence, never an automatic merge or split.

## FALSIFIER VERDICT

**EXPRESSIBLE — all three wrong merges (p2-D02, p2-D03, p2-D06)
retro-compute to subject-key MISMATCHES; under rule R3 their same-entity
questions would have been barred (cross-subject routing) and the merges
could not have been recorded as same-entity answers. The schema is
sufficient per the registration's falsifier as frozen.** Named residual
gap (does not fire the falsifier, receipted for the next battery): the
blocking power on all three lives entirely in the `claim_id` half — an
artifact-only key measures 26/30 and blocks none of the three — so the
claim registry is the load-bearing pre-registration, and its grain is a
relocated curator judgment that the template forces into sealed,
receipted, append-only form before any pairing.
