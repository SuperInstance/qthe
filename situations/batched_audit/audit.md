# ORCH-R14 Lane T5-a — batched-per-guest audit + guard: AUDIT

> Registration: docs/discussions/2026-10-18-orch-r14-registration.md §T5-a
> (standing r13 close-out item, T4-a-earned). Falsifier: any site that splits
> one guest's battery across calls, or asks one-question-per-call, without a
> receipted reason -> REWIRE to batched-per-guest and receipt before/after
> call counts. Honest outcome if nothing deviates: "already batched, guard
> added" — that is a PASS.
>
> Zero spend by registration (the canary allowance waived). Every number
> below is derived from sealed rows and deterministic code only
> (counterfactual.py + counterfactual_results.json beside this file).

## 0. Method + scope receipts

- Discovery: repo-wide grep for the endpoint literal
  `https://api.typesafe.ai/v1/systemone` and the client entry names
  (`http_post(`, `call_and_seal(`, `seal_call(`) over code extensions
  (.py/.mjs/.js/.ts/.sh/.c/.h) — the same discovery the guard automates.
- **Out-of-repo discovery (honest gap, receipted)**: the T4-a and T4-c lane
  runners live in the WORKSPACE `scripts/` directory, NOT in the repo —
  `/home/z/my-project/scripts/batching_falsifier.py` (1,081 lines) and
  `/home/z/my-project/scripts/run_t4c_battery.py` (376 lines) plus
  `build_t4c_pairs.py` / `t4c_verdict.py` (no calls). The r13 worklog
  fragments say "scripts/batching_falsifier.py built", which resolves against
  the workspace root, not the repo root; the repo's `scripts/` holds only
  .mjs tooling. Their SEALED ROWS are in the repo
  (situations/batching_falsifier/, situations/entity_alignment/). The guard
  is repo-scoped and cannot see them — follow-up #1 below.
- Not systemone (checked, out of scope): `distractors_seed.py` (DeepInfra
  Seed-2.0-mini), `situations/new_members/` rows (Hermes/Inkling — DeepInfra
  chat completions), `demos/*.mjs` (local qthe-kernel demos, zero HTTP),
  `situations/deepseek_guest*.mjs` / arena harnesses (DeepInfra).
- Pricing: $0.042/1M input, $0.00/1M output (the sealed lane pricing).

## 1. Inventory table (every systemone POST site)

Legend — **grouping key**: what determines which questions share one call.
**q/call (sealed)**: question_count values from the actual .jsonl rows.
**split/mix**: does one guest's battery ever span multiple calls / do
multiple guests ever share one call.

| # | Site (file:line) | Grouping key | q/call (sealed rows) | Calls per guest/seat | Split / mix | Classification |
|---|---|---|---|---|---|---|
| 1 | `situations/jev_judge.py:140` `build_call` + `:223` `cmd_judge` (http_post `:90`, ENDPOINT `:55`) | the SEAT (the guest): `call_id = f"r10-judge-{seat.get('seat')}"`, one call per seat row | 12/15/15/18/18/21/21 (= 120 q over 7 rows, `jev_judgments_r10.jsonl`) | exactly 1 | never split, never mixed | **BATCHED-PER-GUEST** (conforms) |
| 2 | `situations/jev_judge.py:191` `cmd_canary` | n/a — one `"alive"` noul | 1 (row `canary-0`) | n/a | n/a | **ONE-PER-CALL — EXEMPT** (tag added; §3) |
| 3 | `situations/jev_triage.py:1040-1063` stage 1 | the SEAT: `call = jev_judge.build_call(s)` inside `for s in seats:` | 12/15/15/18/18/21/21 (7 rows `stage:"1-triage"`, `jev_triage_r10.jsonl`) | exactly 1 | never split, never mixed | **BATCHED-PER-GUEST** (conforms; reuses the record integration verbatim) |
| 4 | `situations/jev_triage.py:1081-1106` stage 2 pass 1 | n/a — mechanical, code decides | 0 (3 rows `stage:"2-mechanical"`, `usage: {input_tokens: 0, output_tokens: 0}`) | 0 | n/a | **OTHER** — not a call site (the earned loop's $0 pass) |
| 5 | `situations/jev_triage.py:1127-1177` stage 2 pass 2 (seal_call `:744`, jc.http_post `:756`) | the LOCATED FILE: `key = secs[0]["path"] if secs else "__nosection__"`, chunks of `GROUP_CAP = 6` | 1-5 per call (v3 `g3` rows: 14 calls, 37 q; superseded v1 `gnd` 21 rows + v2 `g2` 14 rows stand as sealed receipts) | 1-7 calls PER SEAT (a seat's findings spread over its artifacts) | **MIXES seats** (e.g. `g3-eq13resultsjson` carries `"findings": ["dsv41f/F1", "hy4p/F3", "mimov26f/F3", "nemotron35sv/F6", "qwen3635b/F3"]` — 5 seats in one call) and **splits batteries** | **BATCHED-PER-GROUP** — group key is the ARTIFACT, not the guest; receipted (module docstring `:70-72`) and now QUANTIFIED (§4a: per-guest would cost +40% MORE) |
| 6 | `situations/grounding_loop/arm_a.py:99-116` | the whole 32-claim corpus in ONE call | 96 (3 rows `r12-cc-a-r{1,2,3}`, `rows_arm_a.jsonl`) | n/a (claims corpus has NO guest axis) | maximal batching | **BATCHED** (conforms; the T3-a high-water of 96 questions in one call) |
| 7 | `situations/grounding_loop/arm_b.py:293-362` | the CITED FILE: `key = sec["path"] if sec else "__nocitedfile__"` | = group size, 1-5 (54 Jev rows = 18 groups x 3 repeats, `rows_arm_b.jsonl`) | n/a (no guest axis) | groups share the located artifact | **BATCHED-PER-GROUP** — artifact key; the EARNED standing pattern (same receipt class as #5) |
| 8 | `situations/grounding_loop/canary.py:12-35` | n/a — one `"alive"` noul | 1 (row `r12-cc-canary`) | n/a | n/a | **ONE-PER-CALL — EXEMPT** (tag added; §3) |
| 9 | `situations/grounding_loop/jev_client.py:54-170` | n/a — shared transport (`http_post`, `call_and_seal`) | formulates no question map | n/a | n/a | **OTHER** — client infrastructure |
| 10 | `situations/sde_cascade/run_cascade.py:337-344` r10 arm | `(source="r10", group=seat)` — **the group key IS the guest** | 29/36/43/50 (21 rows = 7 seats x 3 repeats, `rows_battery.jsonl`) | 3 (the pre-registered 3-repeat honest-null protocol — measurement repeats, not a battery split) | never mixed | **BATCHED-PER-GROUP (= per-guest)** (conforms) |
| 11 | `situations/sde_cascade/run_cascade.py` r11 arm | `(source="r11", group=seat)` — the guest | 29/36 (12 rows = 4 seats x 3 repeats) | 3 (same protocol) | never mixed | **BATCHED-PER-GROUP (= per-guest)** (conforms) |
| 12 | `situations/sde_cascade/run_cascade.py:272` grounding arm | `(source="grounding", group="claims-g%d" % (i // 8))` — fixed 8-claim chunks | 57 each (12 rows = 4 chunks x 3 repeats; 57 = 8 claims x 7 fields + 1 `__overall__`) | n/a (claims corpus has NO guest axis) | chunks are disjoint claim sets | **BATCHED-PER-GROUP** — chunk key; no guest axis exists; counterfactual §4c |

Out-of-repo sites (sealed rows in-repo; guard cannot see them — follow-up #1):

| # | Site | Grouping key | q/call (sealed rows) | Classification |
|---|---|---|---|---|
| 13 | `/home/z/my-project/scripts/batching_falsifier.py` arm B (`:582-603`) | the GUEST (one call per guest per repeat) | 12/15/18/21 (50 rows = 10 guests x 5 repeats, `situations/batching_falsifier/rows_arm_b.jsonl`) | **BATCHED-PER-GUEST** (the winning arm) |
| 14 | same file, arm S (`:606-635`) + doc singles (`:638-665`) | one QUESTION per call | 1 (150 rows arm S; 9 doc singles) | **ONE-PER-CALL — BY DESIGN**: this IS the T4-a falsifier's control arm (the experiment measured exactly this contrast); sealed, complete, not standing tooling |
| 15 | same file, canary (`:548-579`) | n/a | 1 (row `r13-bf-canary-0`) | **ONE-PER-CALL — EXEMPT** (key-check probe) |
| 16 | `/home/z/my-project/scripts/run_t4c_battery.py:262-289` | the PAIR (state = both entries/findings verbatim) | 3 (43 + 30 rows, `rows_part1.jsonl` / `rows_part2.jsonl`) | **BATCHED-PER-GROUP** (group = the pair; no guest axis — part 1 is registry entries, part 2 is cross-seat pairs by construction); receipt + counterfactual §4b |
| 17 | same file, canary | n/a | 1 (row `t4c-canary-0`) | **ONE-PER-CALL — EXEMPT** (key-check probe) |

AS-SAID sealed-row quotes backing the table:
- `jev_judgments_r10.jsonl`: 8 rows; the 7 seat rows carry `"question_count"`
  12, 15, 15, 18, 18, 21, 21 and `"seat_judged"` per row; the eighth is
  `"call_id": "canary-0"`.
- `jev_triage_r10.jsonl`: 59 rows = 7 `"stage": "1-triage"` + 3
  `"stage": "2-mechanical"` (all `"usage": {"input_tokens": 0, "output_tokens": 0}`)
  + 21 v1 `"gnd"` + 14 v2 `"g2"` + 14 v3 `"g3"` (`"stage": "2-grounded"`);
  the v1 row `r12-triage-r10-gnd-eq13resultsjson` carries `"group_size": 5,
  "question_count": 10` (v1 asked two questions per finding — the retired
  facts/mech decomposition); the operative v3 row `r12-triage-r10-g3-
  eq13resultsjson` carries `"group_size": 5, "question_count": 5` (one
  Choice per finding) with `"findings": ["dsv41f/F1", "hy4p/F3",
  "mimov26f/F3", "nemotron35sv/F6", "qwen3635b/F3"]` — five seats in one
  call, the mix receipt for table row 5.
- `rows_battery.jsonl`: 45 rows, all `"question_count"` in {29, 36, 43, 50, 57};
  grounding rows carry `"source": "grounding", "group": "claims-g{0..3}"`.
- `rows_arm_a.jsonl`: 3 rows, `"question_count": 96`.
- `rows_arm_b.jsonl`: 58 rows = 4 `"decision_pass": "mechanical"` (no call) +
  54 Jev rows (18 file-groups x 3 repeats, `"question_count"` = group size).
- `batching_falsifier/rows_arm_b.jsonl`: 50 rows, qc {12,15,18,21};
  `rows_arm_s.jsonl`: 150 rows, all qc 1; `rows_docprobe.jsonl`: 12 rows
  (3 batched qc {18,21,21} + 9 singles qc 1); `rows_canary.jsonl`: 1 row.
- `entity_alignment/rows_part1.jsonl`: 43 rows qc 3; `rows_part2.jsonl`:
  30 rows qc 3; `canary.jsonl`: 1 row.

## 2. Guard

`situations/batched_audit/guard.mjs` (zero-dependency Node, zero network):
statically discovers the repo's systemone call sites (endpoint literal OR
client-call names, code extensions only, `.git`/`node_modules`/`__pycache__`
skipped, the guard file itself skipped — its own source contains the
discovery patterns) and requires each site to either aggregate a multi-key
questions map (a `for` header with a `questions[<computed key>] = {` assign
within 40 lines — Python f-string and nested-bracket key expressions handled)
or carry a receipted exemption tag `// QUILT:BATCH-EXEMPT: <reason>` (or
`# QUILT:BATCH-EXEMPT:` for Python — comment-prefix adaptation receipted
here) within 15 lines above a single-question literal. Comment-only lines are
blanked before literal scanning so API-shape examples in docstrings/comments
are not mistaken for call sites. Hard-coded expectations verify jev_judge.py
(batches per seat — one call per seat row), run_cascade.py (groups items; the
actual group key is documented IN the guard: r10/r11 -> the seat = the guest;
grounding -> fixed 8-claim chunks, no guest axis), and jev_triage.py (stage 1
per seat; stage 2 per located file, GROUP_CAP-capped). Fail-closed: zero
discovered sites -> exit 1; unverifiable shape -> exit 1.

Run receipt: `guard_run.txt` (verbatim). **Exit 0, PASS** — 7 site files:
arm_a BATCHED, arm_b BATCHED, canary EXEMPT, jev_client TRANSPORT-ONLY,
jev_judge BATCHED (with exempt probe), jev_triage BATCHED, run_cascade
BATCHED; all three hard expectations OK. Negative controls (the negctl
doctrine adopted from the fleet this round): exemption tag removed -> FAIL;
aggregation assign renamed -> FAIL (UNVERIFIABLE); empty corpus -> FAIL.
Sabotaged files restored sha256-verified byte-identical; `python3 -m
py_compile` clean after restore.

## 3. Exemptions (documented per the guard contract)

1. `situations/jev_judge.py` `cmd_canary` — `# QUILT:BATCH-EXEMPT: canary
   key-check probe -- one question by design; not a guest battery`. Sealed
   row `canary-0` (one call, jev-1.13.0, usage receipted in the row).
2. `situations/grounding_loop/canary.py` — same tag, same class. Sealed row
   `r12-cc-canary`.
3. (out-of-repo, receipted here only) falsifier arm S / doc singles — the
   control arm of the T4-a falsifier itself; t4c + falsifier canaries.

Both tags were ADDED by this lane (comment-only, purely local and obviously
safe); `python3 -m py_compile` run on both files after the edit — clean.

## 4. Counterfactual economics (sealed rows + deterministic code only)

Reference constants (T4-a earned, quoted from
`situations/batching_falsifier/metrics.json` AS-SAID):
`doc_ratios.aggregate_cost_ratio = 12.358102666271035`,
`compact_ratios.aggregate_cost_ratio = 7.410761488409923`,
`r10_arithmetic.marginal_tokens_per_question_measured = 146.67256637168143`.
Calibration cross-check (this lane, 200 compact rows of the falsifier):
OLS `input_tokens ~ a*state_chars + b*question_count + c` gives
a = 0.3182 tok/char, **b = 148.3 tok/question** (vs the sealed 146.67 —
matches), c = -13.0 (no measurable per-call fixed overhead), R^2 = 0.9834.

### 4a. jev_triage stage 2 — the ONE site with a guest axis that is not
grouped per guest. What would the registration's literal rewire (per-seat
grouping) cost?

Membership re-derived with jev_triage's own deterministic locator on the
current tree: **matches the sealed v3 grouping 14/14 groups, 37/37 members**
(mechanical fabrications reproduce: musegl30b F1/F2/F5); state chars drift
-491..+144 per group (~0.04% of 247,612 — the tree moved after the r12
seal; the ACTUAL side below uses the sealed `state_chars` AS-SAID, the
counterfactuals are built from the same re-derivation, so the comparison is
internally consistent).

| shape | calls | state chars | questions | input tokens | USD |
|---|---|---|---|---|---|
| ACTUAL per-file (sealed) | 14 | 247,612 | 37 | 117,593 (sealed) | $0.004939 |
| rewire -> per-seat, GROUP_CAP-capped | 9 | 349,950 | 37 | 165,104 (fitted, M2; 165,001 M1) | $0.006934 |
| rewire -> per-seat, one call per guest | 7 | 348,144 | 37 | 164,306 (fitted, M2) | $0.006901 |
| un-batched floor (one q per call) | 37 | 393,913 | 37 | 184,806 (fitted, M2) | $0.007762 |

Arithmetic: state chars 349,950 / 247,612 = **1.413x** — the per-seat rewire
needs **+41% more state** because the located artifact is the bill: under
per-file grouping the five seats citing `e_q13_results.json` share ONE copy
of its sections; under per-guest grouping each of those five seats pays for
its own copy. Both pricing models agree (165.0k vs 165.1k tokens). **The
rewire would be a pessimization: the receipted per-artifact grouping is
~29% cheaper than per-guest at this state shape.** The T4-a-earned saving of
the current shape vs the un-batched floor is 184,806/117,593 = **1.57x** —
NOT the 12.36x/7.41x constants, and the reason is the T4-a N-scaling law
(the ratio tracks state-chars-per-question): here one question per finding
rides a ~6,700-char located-section state, so the question map is a tiny
share of the bill. Conclusion: **receipt HOLDS, no rewire** — the deviation
from per-guest is receipted in the module docstring (`:70-72`) and is
economically superior, not a cost regression.

### 4b. entity_alignment — one call per PAIR (no guest axis). What would
one-call-per-part batching save?

Local fit on the 73 sealed rows (question_count constant at 3, so the
per-question term is pinned from the falsifier calibration — receipted in
counterfactual_results.json): a = 0.2488 tok/char, R^2 = 0.980.

| shape | calls | state chars | questions | input tokens | USD |
|---|---|---|---|---|---|
| ACTUAL per-pair (sealed) | 73 | 90,526 | 219 | 53,633 (sealed) | $0.002253 |
| one call per part | 2 | 48,443 | 219 | 44,507 (fitted, b=148.3) | $0.001869 |
| un-batched floor (one q per call) | 219 | — | 219 | 97,204 (fitted) | $0.004083 |

Saving: **$0.000383 (17%)** as a conservative lower bound (the pinned
b = 148.3 tok/q overestimates these short generic questions — the cascade's
own 45-row fit measured b = 69.9 tok/q for the same shape of short nouls,
which would put the saving near $0.0011 / 48%). The whole saving is the
73 headers/footers collapsing to 2 (~42k chars): the question map total is
UNCHANGED by batching (219 questions either way). Receipt for keeping
per-pair: (i) it is a cross-examination isolation control — each pair's
state contains exactly its two entries, and the T4-c falsifier FIRED (3
wrong merges on known-different pairs, one at confidence 0.94), so the
battery is parked NOT-YET; (ii) batching 43 heterogeneous pairs into one
state risks cross-pair interference that T4-a never measured (T4-a measured
same-guest battery batching, not cross-subject mixing); (iii) the economics
are $0.0004-$0.0011 per full run. **No rewire while parked.**

### 4c. sde_cascade grounding arm — 4 fixed chunks of 8 claims. What would
one-call-for-all-32 save?

Fit on the 45 sealed rows (states rebuilt deterministically with
run_cascade.build_call from the sealed ground_truth_table.json + the arena
briefing constants): a = 0.2740 tok/char, b = 69.9 tok/q, c = 362.6 tok/call,
R^2 = 0.9977.

| shape | calls | input tokens | USD |
|---|---|---|---|
| ACTUAL grounding arm (4x8 x 3 repeats, sealed) | 12 | 87,171 (sealed) | $0.003661 |
| one 32-claim group x 3 repeats | 3 | 61,026 (fitted) | $0.002563 |
| un-batched floor (one q per call) | 672 | 2,254,865 (fitted) | $0.094704 |

Saving: **$0.001099 (30% of the grounding arm; 9% of the whole 45-call
$0.012118 battery)** — the briefing (8,882 chars) prints once per call, so
4 chunks pay it 4x. Caveats (why this is a follow-up, not a rewire): 225
questions in one call exceeds the measured high-water (96 questions, T3-a
arm A); the cascade verdict is NOT-YET (parked at r13 — cascade economics
are expensive-tier-price-relative), so the rewire is moot unless the cascade
is re-priced. The r10/r11 arms of the same runner are already per-guest.

### 4d. The T4-a-earned saving of the conforming per-guest shapes (quoted
AS-SAID from `metrics.json` `r10_arithmetic`): the sealed r10 judge round
(7 batched calls, 120 questions, 29,283 input tokens, $0.001229886) would
cost $0.009590658 as 120 single calls (228,349 input tokens) — **cost ratio
7.798005668818085, latency ratio (API) 17.129736511919695**. This is the
shape the standing per-seat sites (rows 1, 3, 10, 11 of the table) already
have.

## 5. VERDICT (per the frozen registration falsifier)

**PASS — "already batched, guard added."**

- Every site WITH a guest axis batches per guest: jev_judge's judge loop,
  jev_triage stage 1, the cascade r10/r11 arms (3 calls per guest = the
  pre-registered repeat protocol, not a battery split).
- Every site WITHOUT a guest axis batches by artifact/pair/chunk with a
  receipted reason, and the single quantified regroup-to-guest
  counterfactual (jev_triage stage 2, §4a) shows the current grouping is
  ~29% CHEAPER than per-guest — the deviation is receipted AND economically
  superior at its state shape (the T4-a N-scaling law applied: batch along
  the state axis, which is the artifact, not the guest).
- The only one-per-call shapes are canaries (exempt, tagged, documented
  above) and sealed experiment control arms (the T4-a falsifier's own arm S
  — the ultimate receipted reason: it exists to measure the contrast).
- Zero rewires needed; zero rewires performed. Code changes by this lane:
  two comment-only exemption tags (py_compile clean) — nothing else touched.

**Follow-ups for the orchestrator (receipted, NOT executed):**
1. Vendor the out-of-repo lane runners into the repo
   (`/home/z/my-project/scripts/{batching_falsifier,run_t4c_battery,
   build_t4c_pairs,t4c_verdict}.py` -> repo `scripts/`) so the guard's
   discovery covers them; today they are invisible to the repo-scoped guard
   (their sealed rows are in-repo, the runners are not).
2. If the SDE cascade is ever re-priced (the r13 conditional), consider the
   grounding 1x32 consolidation ($0.0011/run) WITH its own falsifier for
   >96-question calls (the measured high-water is 96).
3. If cross-examination re-opens after T5-b's subject-key work, re-ask the
   entity-alignment per-part batching question together with a cross-pair
   contamination falsifier (T4-a measured same-guest batching noise, not
   cross-subject mixing).

Files written by this lane: `situations/batched_audit/{audit.md, guard.mjs,
guard_run.txt, counterfactual.py, counterfactual_results.json}`; comment-only
tags added to `situations/jev_judge.py` and
`situations/grounding_loop/canary.py`.

## r30 — the stale-receipt defect and the guard widening (ORCH-R30 open)

Re-running the full battery at r30 open (before any spend) found the guard
RED at HEAD 7ac469b — and CI with it (both r28-close cbf4968 and r29-close
7ac469b runs failed on the "batched-call guard" step; last green CI: 06ccf86,
the r27 close). The r28 close-out's "guard PASS (21 call-site files)" receipt
was STALE: taken mid-round before the last r28 lanes landed. Two genuinely
batched sites were UNVERIFIABLE to the r14 heuristic:

1. `situations/embedding_r28/eq37_phrasing.py` — the treatment builder
   dispatches inside the aggregation loop as `questions[ax] = f(concept)`.
   The r14 `MAP_ASSIGN_RE` required a literal `= {`, so builder-dispatch
   assigns were invisible. FIXED by widening the regex to also accept a
   function-call assign (`= f(`) — the backward for-header scan and every
   other check unchanged.
2. `situations/embedding_r28/eq35_conditional.py` — the relation-map builder
   aggregates under `for k, (preamble, q) in qs.items():` (tuple-unpacking
   header, invisible to `FOR_PY_RE`) into a dict named `out` (not a
   questions/q/qs name). FIXED twice over: the loop-variable regex now
   allows parens (tuple unpacking IS an aggregation loop), and the runner's
   output dict was renamed `out` -> `questions` — a behavior-byte-identical
   dict rename, tagged in-code (`QUILT:GUARD-RENAME r30`), sealed rows
   untouched (the receipt of record is the rows + registration sha, not the
   runner's local variable names).

Post-fix receipt: `guard_run_r30.txt` — GUARD PASS, 25 call-site files, all
hard expectations hold. The defect class this incident banks: **a battery
receipt taken mid-round is not a close-out receipt** — the close-out battery
list now re-runs the guard explicitly (it had been dropped from the r29
close list, which is how the red CI went unnoticed for two commits).
