# SUBJECT-KEY — the pre-registration law for cross-examination pairing

> Origin: ORCH-R13 lane T4-c verdict, "What would re-register this pattern":
> "A cross-examination battery needs a *subject key* the way the registry
> reconciliation had a path key: findings tagged with the artifact + claim
> they contest BEFORE pairing (code-side), the Score then only judging
> same-subject vs same-issue — i.e., move one more field from the model to
> code, per the §0 law."
> Frozen as ORCH-R14 lane T5-b (registration
> `docs/discussions/2026-10-18-orch-r14-registration.md` :: Lane T5-b).
> Machine schema: `situations/entity_alignment/subject_key_schema.json`.
> Validator + retrofit: `situations/entity_alignment/subject_key_validator.py`
> → `subject_key_retrofit.json`. Counterfactual receipt (the falsifier):
> `situations/entity_alignment/subject_key_counterfactual.md`. Fill-in
> template for future batteries:
> `situations/entity_alignment/cross_exam_preregistration_template.md`.

## §1 The law

**The SUBJECT of a cross-examination pair — which artifact, which contested
claim — is computed IN CODE from `(artifact_path, claim_id)` BEFORE any
pairing, and is carried as a first-class field on every pair. The model
judges same-issue-ness ONLY within a subject or across two explicitly-tagged
subjects. It NEVER infers subject identity from text similarity.**

Decomposed into the four rules that make it operable:

1. **R1 — Tag before pair.** Every finding (or list entry, or catalogue row)
   that can enter a cross-examination battery carries two code-side fields
   *before any pair exists*: `artifact_path` (or a normalized
   `artifact_key` from a pinned, receipted normalization table) and
   `claim_id` (an id in a pre-registered claim registry). In the T4-c
   corpus these tags existed only implicitly, inside curator receipts; the
   law promotes them to fields.
2. **R2 — Key in code.** `subject_key = artifact_key + "::" + claim_id`,
   computed by a deterministic function. Same subject ⟺ equal keys — a
   string comparison, not a judgment. No threshold, no model call, no
   similarity score participates in subject identity.
3. **R3 — Route by key, ask within or across.** The pairing code routes
   each pair BEFORE any call:
   - **equal keys** → the pair is same-subject *by code*. The "same
     entity?" question is DECIDED; the model is never asked it. It may be
     asked *within-subject* questions (does finding B corroborate or add
     to finding A? severity comparison? independence?) — questions whose
     answers cannot merge or split subjects.
   - **different keys** → the pair is cross-subject *by code*. The
     "same entity?" question is BARRED — this is the expensive-mistake
     direction. The model may be asked the *cross-subject* question ("are
     these two tagged-distinct claims nevertheless the same issue?") but
     its yes is **claim-registry amendment evidence for the curator**,
     never an automatic merge. Merges require code-side key equality,
     full stop.
   - **uncomputable key** (either side) → see R4.
4. **R4 — Refusal rule (fail-closed).** A pair whose subject keys cannot
   be computed in code — missing artifact tag, missing claim id, artifact
   text that no pinned table normalizes — is **NOT pairable**. It goes to
   the curator queue with a receipt. It is never "asked anyway" and the
   model never guesses the subject. The battery size shrinks; the
   unpaired material is receipted, not silently dropped.

## §2 Why: the three wrong merges were same-TEXT, different-SUBJECT

The T4-c part-2 falsifier fired on exactly three pairs, all
known-different, all merged by the three-level Score (`verdict.md` "The
three wrong merges"):

| pair | sides (ground truth) | score | conf |
|---|---|---|---|
| p2-D02 | mimov F5 `eq16_erratum` vs muse F3 `eq16_seedfn` | 1.96 | 0.94 |
| p2-D03 | dsv F3 `seedfn_closure` vs nemotron F1 `eq16_seedfn` | 1.81 | 0.73 |
| p2-D06 | dsv F1 `c1_claim` vs hy4 F3 `c1_budget` | 1.62 | 0.41 |

All three sit on **same-experiment cluster boundaries**: two E-Q16 pairs
and one C1 pair, where the two sides describe the *same experiment's*
artifacts in near-identical vocabulary (both E-Q16 sides say "seedFn",
"correction row", "run-1 rows stand beside it") while contesting
**different claims** — the erratum-linkage gap vs the seedFn event vs the
contamination sweep; the capability-scoring reading vs the byte-budget
caveat. Text similarity was the confound: it was high exactly where
subject identity differed. The per-field nouls agreed with the Score
146/146 times — the failure was not noise, it was the model doing
similarity where the record demanded identity.

The retrofit decomposition (validator output, `subject_key_retrofit.json`)
makes the structure precise: on all three pairs the **artifact half of the
key is EQUAL** (both sides normalize to the same experiment artifact:
`e_q16`, `e_q16`, `c1_e_q13`) and the **claim half differs**. An
artifact-only key would have routed all three as same-subject and the
merges would have gone through. The blocking power lives in the `claim_id`
half — which is exactly the half the T4-c battery left to the model.

## §3 The convergent law (gitpp-gate / ABV family)

The fleet scouting receipts (ORCH-R14 registration) record the independent
convergence: **gitpp-gate** — "decidable predicates hold blocking authority;
the model misreads facts the caller already knows — CONVERGENT with our ABV
law, measured independently on both sides." In the gate's own formulation: a
decidable predicate held the only blocking authority while the genuinely
underdetermined question was barred.

The subject-key law is that principle applied to entity identity:

- **Subject identity is decidable once the tags exist.** The curator
  (adjudicator) already knows which artifact and which claim each finding
  contests — that knowledge is what R1 tags. Asking the model to re-derive
  it from prose is asking it to misread facts the caller already knows:
  priced at 3/10 wrong merges, one at confidence 0.94.
- **The underdetermined question is barred, not answered.** Whether two
  tagged-distinct claims are "really" one issue (the c1_claim/c1_budget
  boundary is the live example) is genuinely underdetermined at the
  tagging grain. Under R3 that question cannot produce a merge; it can
  only file amendment evidence to the curator. The merge-is-expensive
  asymmetry (cookbook §5.3: "merging two entities inappropriately is the
  more expensive mistake"; our append-only law: a bad merge is a
  corrupted chain) decides which direction may act automatically.
- This is the cookbook §0 law's meta-pattern 1 ("assessment and decision
  are separated... a `route()`/`decide()` function in code owns every
  threshold") at the entity layer: **identity is separated from
  assessment.** The T4-c battery's three-level Score *was* the decision;
  under this law the Score returns to being an assessment whose routing
  is owned by code.

## §4 The schema (machine-usable)

Full JSON Schema: `situations/entity_alignment/subject_key_schema.json`
(draft-07). Shape summary:

```json
{
  "battery_id": "...",
  "corpus": { "source": "...", "sha256": "..." },
  "claim_registry": [
    { "claim_id": "eq16_erratum", "artifact_key": "e_q16",
      "artifact_path": "receipts/e_q16_chain.jsonl",
      "claim_statement": "the correction row does not name the run-1 rows it supersedes",
      "provenance_receipt": "arena_r10_verdict.md verified finding #4" }
  ],
  "artifact_normalization_table": [
    { "artifact_text_as_said": "E-Q16 run-1 rows (16x16 T=100,000 harness fix)",
      "artifact_key": "e_q16", "receipt": "..." }
  ],
  "pairs": [
    { "pair_id": "...",
      "side_a": { "source_ref": "mimov26f/F5" },
      "side_b": { "source_ref": "musegl30b/F3" },
      "subject_key_a": "e_q16::eq16_erratum",
      "subject_key_b": "e_q16::eq16_seedfn",
      "subject_claim_ids": ["eq16_erratum", "eq16_seedfn"],
      "same_subject": false,
      "pairing_reason": "confusable boundary: both describe the E-Q16 correction",
      "expected_relation": "different_entity",
      "routing": "cross_subject_same_issue_question" }
  ],
  "refusals": [
    { "pair_id": "...", "reason": "artifact_text not in pinned table",
      "queue": "curator" }
  ]
}
```

Every pair carries `subject_key_a`, `subject_key_b`,
`subject_claim_ids`, `pairing_reason`, `expected_relation` — all sealed
BEFORE any call. `same_subject` and `routing` are computed by the pairing
code, never by the model.

## §5 The pre-registration template

Future cross-examination batteries MUST complete
`situations/entity_alignment/cross_exam_preregistration_template.md`
BEFORE any LLM call: claim registry with per-claim provenance receipts,
artifact normalization table with per-text receipts, the pair list with
the five pre-registration fields, the refusal queue, and the sealing
block (input sha256s, append-only declaration, "no model output feeds
`same_subject`/`routing`" declaration). A battery whose pre-registration
is incomplete is not run — that is the refusal rule at battery scale.

## §6 Honest limits (what this law does NOT claim)

1. **The judgment is relocated, not eliminated.** `claim_id` tags are
   curator judgments made at adjudication time. The law moves them from
   pairing-time model inference (invisible when wrong — a 0.94-confidence
   merge) to tagging-time pre-registration (receipted, append-only,
   auditable, amendable). A tagger that lumps `eq16_erratum` into
   `eq16_seedfn` produces equal keys and the merge proceeds — but the
   lumping is then a visible, named decision in the claim registry, not a
   silent model error. The r10 adjudication record had already made the
   fine-grained distinctions (verified findings #4/#5/#6 + the seedFn
   event group); the counterfactual receipt
   (`subject_key_counterfactual.md`) tests exactly this.
2. **Retro-validation is expressibility proof, not discovery proof.** The
   T4-c ground truth was *defined* as subject-map equality, so a retro
   key built from the same map agrees with it by construction — the
   Inkling circularity class, receipted in the retrofit output. What the
   retrofit legitimately measures: coverage (are the keys computable
   from sealed fields at all?), the artifact/claim decomposition (which
   half carries the separation), and the routing counterfactual (would
   the three wrong-merge questions have been barred?). It does not
   measure the tagger's accuracy.
3. **Part 1 was already path-keyed.** For registry/list reconciliation
   the subject key IS the artifact path — the Inkling correction's
   tautology point. The law's value there is the alias channel: two
   different paths that are one artifact is the one question
   path-equality cannot decide, and under R3 it is curator evidence, not
   a model merge. (The T4-c corpus contained zero alias cases.)
4. **Amendments are append-only.** A cross-subject same-issue model
   verdict or a within-subject dissent files a claim-registry amendment
   request; the registry's history is never rewritten. Superseded claim
   ids stay visible with their receipts.

## §7 One-line summary

> If the code cannot say what the subject is, the model is not asked —
> and if the code CAN say, the model is not asked either: it is asked
> only what remains, which is whether two known subjects share an issue,
> and its answer routes to a curator, never to a merge.
