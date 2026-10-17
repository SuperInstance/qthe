# T3-a verdict — the citation-check killer experiment (ORCH-R12, lane A)

**Stimulus:** 32 claims (22 TRUE / 7 FALSE / 3 unverifiable distractors),
ground truth sha-pinned BEFORE any judgment call:
claims.json `1c11c66edeb0ba65bf6b13913f3726241b94bbae8decd5622c7724f9e5ab8b14`,
ground_truth.json `01502ab4a38e8a0e5c944801aa5bac4542df43f6070a7e9f21c76c57662f45ee`.
The 7 false claims: the planted r10 4/4 artifact (Qwen's invented
cache-eviction mechanism, verbatim) + one fabrication per class
(sha-not-in-repo, row-id-out-of-range, number-not-in-output-JSON,
invented-file, inverted-verdict, wrong-metric-unit).

## The falsifier (pre-registered), applied

> arm B ≤ arm A on planted fabrications, OR arm B true-flag rate
> < 0.80 → the loop's cost is not earned.

- **Fabrication detection (strict, final verdict = fabricated_or_misstated):**
  - Arm A (briefing-only): **4/7 (57.1%)** — detected: f01, f05, f07, f06; missed/cannot-settle: f02, f04, f03
  - Arm B (code-grounded loop): **6/7 (85.7%)** — mechanical: f05, f02, f04, f03; jev: f07, f06; human_flag (fabricated-choice below the 0.8 gate): f01
  - **Arm B > Arm A: 6/7 (85.7%) vs 4/7 (57.1%)**.
- **True-flag rate (final verdict = yes_true on the 22 TRUE claims):**
  - Arm A: **7/22 (31.8%)** (false-flagged fabricated: t06, t18; cannot-settle: t12, t07, t19, t05, t16, t14, t22, t21, t20, t08, t04, t17, t13)
  - Arm B: **18/22 (81.8%)** — auto-fabricated on TRUE claims: NONE (zero); human_flag (confidence gate, a human decides): t14, t22, t08, t04
  - **Arm B ≥ 0.80: YES (81.8%)**.

### **VERDICT: the loop is EARNED** — arm B strictly beats arm A on planted fabrications (6/7 (85.7%) vs 4/7 (57.1%)) without re-labeling true claims as fabricated (zero auto-fabrications on TRUE claims; true-flag 81.8% ≥ 80%).

Honest caveats, stated plainly:
1. The planted 4/4 artifact (f01) is caught by arm B's Jev pass as
   `fabricated_or_misstated` in 3/3 repeats but at confidence 0.69-0.72 —
   below the pre-registered 0.8 auto-verdict gate — so its final routing is
   **human_flag, not an automatic fabrication verdict**. The strict metric
   therefore counts 6/7; the suspicion metric counts 7/7. The behavior
   change vs r10 is still categorical: the artifact goes from a confident
   sealed 4/4 verified_new to a sub-threshold escalation.
2. Arm A here is GENEROUS to the status quo: the r10 judge state was the
   build_call fallback (findings only); arm A pasted in the full r10 corpus
   briefing incl. the honesty framing. Arm A caught f01 (conf 0.80) only
   because the briefing itself receipts the cached-port caveat; the r10
   state did not contain it.
3. Arm B's 4 human_flagged TRUE claims (t04, t08, t14, t22) are claim-
   design artifacts as much as judge failures: each bundles a second fact
   whose evidence is NOT in the single cited file window (t04's LWW
   semantics live in the chain/verdict, not the tip line; t22's 'C99 port'
   attribution is not in the tip file). The confidence gate routed all
   four to a human instead of sealing a wrong verdict — the gate is what
   holds the 0.80 true-flag rate, and the strict metric charges them to
   arm B anyway.

## Metrics detail

- Unverifiable distractors (expected: cannot_settle): arm A — {"d01": "fabricated_or_misstated", "d02": "fabricated_or_misstated", "d03": "cannot_settle_from_briefing"}; arm B — {"d01": "cannot_settle", "d02": "cannot_settle", "d03": "cannot_settle"}. Arm B is exactly right (3/3 cannot_settle at conf ≥ 0.97); arm A
  called d01/d02 fabricated (over-suspicion without ground).
- Arm B decision passes on the 7 false claims: mechanical 4 (f02 sha_not_in_repo, f03 row_id_out_of_range, f04 number_not_in_output, f05 invented_file), jev 2 (f06 inverted_verdict at conf 1.0, f07 wrong_metric_unit at conf 0.98), human_flag 1 (f01 planted_4of4_artifact, conf 0.69-0.72).
- Mechanical pass false positives on TRUE claims: 0 (no true claim failed
  an anchor check).

## Self-consistency piggyback (3 repeats, same state + questions)

- Arm A choice flips (verdict question, 32 claims): 3/32 claims flipped choice across repeats; per-claim distinct-choice counts: {"d01": 1, "d02": 1, "d03": 1, "f01": 1, "f02": 1, "f03": 1, "f04": 1, "f05": 2, "f06": 1, "f07": 1, "t01": 1, "t02": 1, "t03": 1, "t04": 1, "t05": 1, "t06": 1, "t07": 1, "t08": 2, "t09": 1, "t10": 1, "t11": 1, "t12": 1, "t13": 1, "t14": 1, "t15": 1, "t16": 1, "t17": 1, "t18": 2, "t19": 1, "t20": 1, "t21": 1, "t22": 1}.
- Arm A noul (locatable) per-claim std across repeats: mean std 0.0140, max 0.0374 (claim f05).
- Arm A score (checkability) per-claim std: mean 0.0323, max 0.1438.
- Arm B choice flips (verdict, 28 jev-decided claims): 0/28 flipped; per-claim distinct-choice counts: {"d01": 1, "d02": 1, "d03": 1, "f01": 1, "f06": 1, "f07": 1, "t01": 1, "t02": 1, "t03": 1, "t04": 1, "t05": 1, "t06": 1, "t07": 1, "t08": 1, "t09": 1, "t10": 1, "t11": 1, "t12": 1, "t13": 1, "t14": 1, "t15": 1, "t16": 1, "t17": 1, "t18": 1, "t19": 1, "t20": 1, "t21": 1, "t22": 1}.
- Arm B per-claim max-prob std: mean 0.0067, max 0.0249.
- Both arms: NO claim changed its FINAL (majority) verdict across the
  repeat structure — the repeats cost tokens, not decisions, on this
  stimulus; the observed wobble lives in probabilities/confidence
  (e.g. arm B f01 conf 0.72/0.69/0.70), not in labels.

## Latency, usage, spend

- Arm A: 3 calls, 96 questions each, state 13,063 chars; latency 312-326 ms; usage 49791 in / 9593 out tokens; est $0.002091 (at the declared $0.042/M input, $0/M output).
- Arm B: 4 mechanical decisions (0 Jev calls) + 54 Jev calls (18 groups x 3 repeats, 28 claims, 1-5 questions per call); latency 195-344 ms; usage 111492 in / 4461 out tokens; est $0.004683.
- Canary: 1 call, 309 in / 20 out, est $0.000013.
- Distractor generation (DeepInfra Seed-2.0-mini, 1 call): $0.0008953 (provider-estimated_cost).
- **Total spend: ~$0.00768** (ceiling $0.05).
- Usage structure: input tokens are a linear function of state chars
  (~1.271 tokens/char on arm A), IDENTICAL
  across repeats of the same state+questions (deterministic tokenization);
  output tokens scale ~33.3/answer on arm A.

## Playground findings piggybacked on this run (L1 entries filed)

- **Batching ceiling:** the full question set — 96 questions (32 claims x 3
  typed questions) in ONE systemone call — succeeded first try (no error,
  no bisection needed). 3/3 repeats at 312-326 ms, 16,597 input tokens.
  No ceiling was hit at 96; the docs' prior high-water mark we knew of was
  54 questions (function-calling cookbook).
- **Determinism:** answers are NOT byte-identical across repeats of an
  identical request (arm A: only 7-10 of 96 answers byte-identical across
  repeats), but input-side usage IS identical — the non-determinism lives
  in the answer layer only.
- **Confidence discriminativeness (the surprise):** in arm A, choice
  confidence does NOT discriminate true from false claims (mean 0.598 vs
  0.571). In arm B — same model, same claim set, grounded state — it does:
  fabricated-choice answers on FALSE claims (correct direction) mean conf
  0.894; fabricated-choice answers on TRUE claims (wrong direction) mean
  0.403 (max 0.70). The pre-registered 0.8 gate sits inside that gap and
  converted every would-be false auto-verdict into a human_flag (zero wrong
  auto-verdicts on true claims). Confidence is not a general calibration
  signal — it is a grounding signal: it discriminates exactly where the
  state contains the evidence.
- **Noul precision:** the arm-A locatable noul on false claims read
  0.18-0.27 (correctly 'not checkable from the briefing'), on grounded
  true claims high; per-claim noul std across repeats 0.014 mean (max
  0.037) — nouls are stable to ~2 decimal places across repeats.

## Sealed artifacts

- claims.json / ground_truth.json (sha-pinned above, written before any
  judgment call; build_claims.py pre-seal self-verification PASS)
- rows_arm_a.jsonl (3 AS-SAID rows + verbatim response_raw)
- rows_arm_b.jsonl (4 mechanical rows + 54 AS-SAID rows)
- rows_canary.jsonl, rows_distractors.jsonl
- Playground findings appended to docs/research/TYPESAFE-PLAYGROUND.md

Ground truth re-verification note for the orchestrator: every true claim's
value was asserted present in its named file at build time; concurrent lane
T3-b is live (a 13th probe_gate row landed mid-build) — unstable-filesystem
facts (budget counts, gate row counts) were excluded from the claim set and
the exclusion is receipted in ground_truth.json meta.
