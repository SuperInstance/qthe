# CROSS-EXAMINATION BATTERY PRE-REGISTRATION — fill-in template

> Law: `docs/SUBJECT-KEY.md`. Machine schema (this template's JSON shape):
> `situations/entity_alignment/subject_key_schema.json` (draft-07).
> **A cross-examination battery is not run until this file is complete and
> sealed.** Every `___` below must be filled, every judgment call receipted,
> before the first LLM call. The model never sees a pair whose subject keys
> are absent; the model never answers a same-entity question for a pair
> whose keys differ (R3); the model never guesses a subject (R4 — refusal
> to the curator queue). Fill by hand or generate with code; the JSON form
> is what gets validated.

---

## 0. Identity

- battery_id: `___` (e.g. `t6c-cross-exam-v1`)
- registered_under: `___` (round registration / lane spec pointer)
- corpus source: `___` (sealed file path or git-ref + path)
- corpus sha256: `___` (64 hex; the exact bytes the tags were made against)
- corpus note: `___` (anything the next reader must know about this corpus)

## 1. Claim registry (the load-bearing pre-registration)

One row per CONTESTED CLAIM — not per experiment, not per finding. The
T4-c counterfactual (`subject_key_counterfactual.md`) measured that an
artifact-only key scores 26/30 and blocks none of the three wrong merges:
the claim half is where the separation lives. Name the grain explicitly
and receipt every judgment call.

| claim_id | artifact_key | artifact_path | claim_statement (one sentence) | provenance_receipt | amends (append-only) |
|---|---|---|---|---|---|
| `___` | `___` | `___` | `___` | `___` (verdict numbered finding / adjudication row / JUDGMENT CALL + why + safe-direction argument) | `___` or — |

Claim-grain decisions receipted before pairing (required if any two
claims could plausibly be one — e.g. an erratum-linkage gap vs the event
itself; a capability-scoring reading vs a byte-budget caveat):

- `___` — e.g. "c1_claim kept SEPARATE from c1_budget because verdict #6
  does not name dsv F1; erring toward not-merging is the safe direction
  under the merge-is-expensive asymmetry"

## 2. Artifact normalization table (pinned, receipted)

Maps the artifact text AS-SAID in the sealed corpus to the canonical
`artifact_key`. A corpus text not in this table makes its pairs
uncomputable → refusal (R4), never a guess. Co-named artifacts are
receipted but not keyed.

| artifact_text_as_said (VERBATIM) | artifact_key | co_named_artifacts | receipt (why this key) |
|---|---|---|---|
| `___` | `___` | `___` | `___` |

## 3. Pair list (all fields sealed BEFORE any call)

One row per pair. `subject_key_a`/`subject_key_b` are computed in code as
`artifact_key + "::" + claim_id`. `same_subject` and `routing` are
computed, never judged. `expected_relation` is the curator's pre-registered
prediction from the claim registry — the battery's falsifiable expectation.

| pair_id | side_a source_ref | side_b source_ref | subject_key_a | subject_key_b | subject_claim_ids | same_subject | pairing_reason | expected_relation | routing |
|---|---|---|---|---|---|---|---|---|---|
| `___` | `___` | `___` | `___` | `___` | `[___, ___]` | `___` (code) | `___` | same_entity / related_needs_curator / different_entity | `___` (code) |

Routing vocabulary (computed, not chosen):

- `intra_subject_no_identity_question` — keys equal: the identity question
  is decided in code; the model may be asked only within-subject questions
  (corroboration? added information? severity comparison?) whose answers
  cannot merge or split subjects.
- `cross_subject_same_issue_question` — keys differ: the same-entity
  question is BARRED; the model may be asked "are these two tagged-distinct
  claims nevertheless the same issue?", and a yes is claim-registry
  amendment EVIDENCE for the curator, never an automatic merge.
- `refused_curator_queue` — see §4.

## 4. Refusal queue (R4 — pairs NOT paired)

Any pair whose subject keys could not be computed in code. Not asked, not
guessed, receipted:

| pair_id | side | what was missing (unparsable path / text not in pinned table / missing claim tag) | as_said (verbatim) |
|---|---|---|---|
| `___` | a / b / both | `___` | `___` |

Expected refusals for this battery and why: `___` (zero is a legitimate
answer when the pinned tables cover the sealed corpus — state it, don't
leave it silent).

## 5. What the model IS and IS NOT asked (declare per battery)

- The model is asked: `___` (e.g. within-subject corroboration ranking;
  cross-subject same-issue reads as curator evidence)
- The model is NOT asked: same-entity questions for cross-subject pairs;
  subject identity for any pair; anything about artifacts' existence
  (grounding law, cookbook §0)
- Model outputs that would amend the claim registry: `___` (channel:
  append-only amendment request to the curator queue — superseded claim
  ids stay visible)

## 6. Sealing

- append_only: `true`
- no_model_output_in_keys: `true` (declaration: every subject_key_*,
  subject_claim_ids, same_subject and routing value was computed without
  any LLM output)
- preregistration_sha256: `___` (sha256 of the canonical JSON
  serialization of §0–§5; sealed before the first call)
- sealed_before_first_call_at: `___`

## 7. Post-run discipline (fill AFTER the run, append-only)

- did any model answer conflict with a pre-registered expected_relation?
  `___` (each conflict is a receipted falsification data point, not an
  edit to this file)
- claim-registry amendment requests filed: `___`
- refusals resolved by curator (with receipts): `___`
- verdict vs the battery's registered falsifier: `___`

---

**The one-line test before the first call:** if you cannot fill every
`subject_key_a`/`subject_key_b` cell from §1 + §2 by string
concatenation, the battery is not ready — the missing cells are curator
work, not model questions.
