# TYPESAFE-PLAYGROUND — the living register of novel TypeSafe/Jev API findings

> Standing register opened at ORCH-R12 registration. The founder's
> mandate: playground work and experimentation geared toward NOVEL
> findings about what the typesafe.ai API can do. Every entry is
> LAYER-tagged the house way and cites its receipt. The orchestrator
> verifies before an entry counts; unverified observations live in the
> lane worklog fragments until promoted. Companion docs:
> `docs/research/JEV-COOKBOOK-PATTERNS.md` (the 20-cookbook deep-dive),
> `situations/MODEL-LEARNINGS.md` §5 (the grounding-gap law, r10-priced),
> `situations/jev_judge.py` (the integration of record).

## Entry format

```
- [LAYER] date · finding (one line) · receipt: file:line or call_id · verified-by
```

L0 = documented-and-reproduced (docs say it, we ran it).
L1 = mechanism-reproducible (we observed it, byte-replayable rows).
L2 = practical/economics claim (priced from receipts).

## Entries

- [L0] 2026-10-18 · API shape confirmed live this session:
  `POST https://api.typesafe.ai/v1/systemone`, Bearer auth, typed
  question map {noul|choice|score}, answers carry
  probabilities/confidence/noul · receipt: situations/jev_judge.py
  header + canary pattern; served model attributed from response
  (jev-1.13.0 at r10) · verified-by: orchestrator re-verification
  this session (docs fetch + key presence; canary re-run pending in
  T3-a).
- [L1] 2026-10-18 · DeepInfra OpenAI-compatible chat completions expose
  cache telemetry in `usage.prompt_tokens_details.cached_tokens` +
  `cache_write_tokens` and `estimated_cost` per call — the fields the
  tavern's cache-economics files price · receipt: this session's
  verification call (deepseek-ai/DeepSeek-V4.1-Flash, 200 in 2.2 s,
  11 prompt tokens, 2 completion, $0.0000024, cached_tokens 0) ·
  verified-by: orchestrator, live call. (DeepInfra-side, logged here
  because the playground's cost discipline depends on it.)
- [L1] 2026-10-18 · 181 models live on DeepInfra; all eight tavern
  seats confirmed present in the list, including the three
  cache-discount seats and the devil's advocate · receipt: orchestra
  models-list snapshot (tavern seats cross-checked against
  situations/MODEL-LEARNINGS.md) · verified-by: orchestrator.
- [L1] 2026-10-17 · Canary re-run live (closes this register's seeded
  pending note): jev-1.13.0 served, 225 ms, usage {input_tokens 309,
  output_tokens 20} · receipt: call_id r12-cc-canary
  (situations/grounding_loop/rows_canary.jsonl) · verified-by: orchestrator
  (row re-read: jev-1.13.0, usage 309/20 — ORCH-R12).
- [L1] 2026-10-17 · Batching ceiling probed upward: 96 typed questions
  (32 claims x choice/noul/score) in ONE systemone call succeeded first
  try — 3/3 repeats, 312-326 ms, 16,597 input tokens, no error, no
  bisection needed; new high-water mark above the 54-question
  function-calling cookbook example; zero HTTP errors across all 58
  systemone calls this lane (no 429/5xx at ~1 call/s) · receipt: call_ids
  r12-cc-a-r{1,2,3} (situations/grounding_loop/rows_arm_a.jsonl) ·
  verified-by: orchestrator (re-derived from the sealed rows:
  question_counts [96,96,96], input_tokens [16597,16597,16597] — ORCH-R12).
- [L1] 2026-10-17 · Answer-layer non-determinism with token-identical
  inputs: the same state + question map across 3 repeats returned only
  7-10 of 96 answers byte-identical, while usage.input_tokens was
  identical every repeat (16,597) — the sampling wobble lives entirely
  in the answer layer; labels mostly hold (3/32 claims changed choice at
  least once across repeats) · receipt: r12-cc-a-r{1,2,3}
  (rows_arm_a.jsonl, byte-compare of response_raw.answers) · verified-by:
  orchestrator (re-derived, STRONGER: 2/96 answers identical even under
  key-normalized comparison — the lane's raw byte-compare counted 7–10;
  either way the wobble is real and label-level stability held — ORCH-R12).
- [L1] 2026-10-17 · Confidence is a grounding signal, not a general
  calibration signal: on the same 32-claim set, briefing-only
  choice-confidence did NOT discriminate true from false claims (mean
  0.598 vs 0.571); with grounded file-section states, fabricated-choice
  confidence on FALSE claims averaged 0.894 while wrong-direction
  fabricated-choice on TRUE claims averaged 0.403 (max 0.70) — a 0.8
  auto-verdict gate sits inside that gap and converted every would-be
  wrong auto-verdict into a human_flag (0 wrong auto-verdicts on true
  claims in 3x28 grounded judgments) · receipt: r12-cc-b-r{1,2,3}-*
  vs r12-cc-a-r{1,2,3} (rows_arm_b.jsonl / rows_arm_a.jsonl, T3-a
  verdict.md) · verified-by: orchestrator (aggregates cross-checked
  against the sealed row structure — 58 rows, grouped Jev calls, zero
  wrong auto-verdicts on true claims confirmed; f01 conf 0.69–0.72 →
  human_flag — ORCH-R12).
- [L1] 2026-10-17 · Grounded states stabilize labels: 0/28 claims
  changed choice across 3 repeats of the grounded citation-check calls
  (per-claim max-probability std <= 0.025), vs 3/32 flipping under the
  briefing-only state; noul answers repeated stable to ~2 decimals
  (per-claim std mean 0.014, max 0.037) · receipt: r12-cc-b-r{1,2,3}-*
  (rows_arm_b.jsonl) · verified-by: orchestrator (consistent with the
  2/96 identity measure on the ungrounded arm — ORCH-R12).
- [L1] 2026-10-17 · systemone usage/cost structure, measured: input
  tokens ~ 1.27 x state chars (13,063-char state -> 16,597 tokens), output
  ~ 33 tokens/answer; at the sde_cascade-quoted $0.042/1M input + $0/1M
  output a document-dominated 96-question call costs ~$0.0007 and the
  whole 58-call lane ~$0.0068 · receipt: usage fields of
  rows_canary.jsonl / rows_arm_a.jsonl / rows_arm_b.jsonl · verified-by:
  orchestrator (16,597 tokens / 13,063 chars = 1.2707 re-derived — ORCH-R12).

## Entries (ORCH-R12 T3-c, orchestrator-verified)

- [L1] 2026-10-18 · The invented_flag check — mechanical, code-only
  fabrication detection for proposed CLI interfaces: `--flag` claims are
  checked against the cited script's actual source; caught Muse's three
  invented flags (`--experiment`, `--metric`, `--list`, `--audit`) with
  ZERO Jev spend — the r10 penalty class, now free to enforce · receipt:
  situations/adjudications_r10_grounded.json (musegl30b F1/F2/F5,
  mechanical rows) · verified-by: orchestrator (re-derived: the flags
  appear nowhere in probe_gate.mjs / verify_all_chains.mjs source).
- [L1] 2026-10-18 · Grounded-locator fragility, supersession receipted:
  stage-2 v1 (single rarest anchor) located arena findings on irrelevant
  files; v2 (layered locator, header windows) AUTO-FABRICATED a true
  finding at conf 0.82 — above the gate, wrong direction; v3
  (coverage-scored anchor windows on evidence blocks + the results-file
  convention) is the standing pass. Superseded rows stand in the ledger
  as sealed receipts — the append-only law applied to tool versions ·
  receipt: situations/jev_triage_r10.jsonl (row families ...-gnd- v1,
  ...-g2- v2, ...-g3- v3) · verified-by: orchestrator (census: 7 stage-1
  + 3 mechanical + 21 v1 + 14 v2 superseded + 14 v3 final = 59 rows).
- [L1] 2026-10-18 · Grounded re-adjudication of an old round is DRIFT
  detection: running the r10 rows against the current tree routes all 23
  prior Jev verified_new ratings away (human_flag / fabricated /
  mechanical) because the tree moved — LICENSE and the fix batches
  landed between rounds. Artifact truth is tree-relative; the tool
  caveats it instead of charging hallucination · receipt:
  situations/adjudications_r10_grounded.json (re_adjudication_delta +
  caveats) · verified-by: orchestrator.

## Pending (lane fragments, not yet promoted)

(none yet — lanes append through the orchestrator)

## Entries (ORCH-R13, orchestrator-verified)

- [L1] 2026-10-18 · "Batching adds no noise" REPRODUCES at the tavern's
  shapes: 0/30 sampled questions batch-hostile (rule |mean_B − mean_S| >
  2·std_S, min-noise floor 0.02 never fired); zero label flips in either
  arm; measured cost ratio **12.36×** at document-dominated state
  (11.45–12.86× per guest), 7.41× compact; latency ratio 17.7× · receipt:
  situations/batching_falsifier/ (213 calls, $0.0221; rows_arm_b/s/docprobe)
  · verified-by: orchestrator (batch-hostile re-derived 0/30 from raw rows;
  top mover seed20mini F4__class 0.030 vs 0.043 floor; spend re-derived to
  the digit).
- [L1] 2026-10-18 · The question map is not free: ~147 marginal input
  tokens per batched question (class instructions embed each finding's
  text) cap the batching ratio below naive N× — document-dominated lands
  at 0.63× of N, compact at 0.47× of N. The ratio tracks
  state-chars-per-question, not a constant; budget projections from a
  single tokenizer rate misprice by >2× (prose ~0.31 tok/char vs findings
  JSON ~0.73) · receipt: batching_falsifier/metrics.json + verdict.md ·
  verified-by: orchestrator (token counts re-read from sealed rows).
- [L1] 2026-10-18 · Per-field bad-true noul batteries are highly repeatable
  briefing-side: 630 (item,field) triples × 3 repeats, mean std 0.0112,
  max 0.070, zero threshold-crossing spans — the §6.2 review band would be
  nearly empty on this traffic · receipt: situations/sde_cascade/
  rows_battery.jsonl (45 calls, $0.0121) · verified-by: orchestrator
  (re-derived in the per-field analysis).
- [L1] 2026-10-18 · Cascade economics are expensive-tier-price-relative:
  against a $0.00034/finding earned loop, a 7-field battery ($0.0121/90
  items) is itself 40% of the all-expensive budget; the cookbook's
  up-and-left frontier (drawn at $0.10/extraction prices) collapses to a
  weak trade (−10.4 fabrication-recall points for 29% saving at FIRE_T 0.7;
  quality parity at 0.5 fires the no-separation clause at 53.5%) ·
  receipt: sde_cascade/cascade_computation.json + verdict.md · verified-by:
  orchestrator (sweep re-computed from sealed rows).
- [L1] 2026-10-18 · The claim-density confound: all 13 CLEAN items that
  fire a bad-true battery at 0.7 are dense factual claims (0.72–0.91);
  ZERO prose audit findings fire — bad-true batteries read specificity as
  risk; calibrate per text-shape before reuse · receipt:
  sde_cascade/per_item_max_field · verified-by: orchestrator.
- [L1] 2026-10-18 · Field-loading on fabrication traffic: `incomplete`
  carries the signal (8/14 BAD items), `hallucinated` under-fires (3/14) —
  invented-interface fabrications present as missing-qualifier risk to a
  briefing-side battery; the artifact check belongs to code-side
  candidate-set matching (§4.3), where the earned loop already puts it ·
  receipt: sde_cascade per-field analysis (firing field per BAD item) ·
  verified-by: orchestrator.
- [L1] 2026-10-18 · DeepInfra thinking-model telemetry:
  thinkingmachines/Inkling-Small reports `reasoning_tokens` inside
  usage.completion_tokens_details-style fields and REASONING CONSUMES THE
  max_tokens budget — a 250-word opinion needs 8,000 max_tokens (2,816
  reasoning + 337 visible); finish=length with zero visible content is the
  failure signature · receipt: situations/new_members/rows_opinion.jsonl
  (both calls sealed, amendment law applied) · verified-by: orchestrator
  (usage fields re-read from both rows).
- [L1] 2026-10-18 · Entity-alignment Score vs mechanical keys on
  alias-free corpora: when the ground truth's own key is the path, a
  path-equality rule's 100% is tautological (29/29 same-entity pairs
  byte-identical paths, zero alias cases) — a battery cannot demonstrate
  semantic value on a corpus with no semantic-vs-path divergence; the
  honest basis for code-only is the wrong-merge clause on
  adjudication-grounded pairs (3/10, one at confidence 0.94) · receipt:
  situations/entity_alignment/ pairs + the append-only correction in its
  verdict.md (origin: Inkling-Small day-one attack, orchestrator-upheld)
  · verified-by: orchestrator (alias census re-derived).
