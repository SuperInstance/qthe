# E-Q10 VERDICT — AS RUN (task 45-b, wave 45, lane eq10-executor)

**What E-Q10 turned out to be:** the guest's round-9 registered lever — **C5' injector one-pager** — sealed AS SAID through the first keyed tavern session (the repo's deepseek-gated step), then executed on the E-Q5 armor-ring harness exactly as the guest's `cheapest_decisive_run` specified.

**Headline: MIXED — LLM phase 6/8 claims (2 honest FAILs, both parse-layer, both explained); kernel phase 9/9 claims TRUE, falsifier did NOT fire, C5' AS STATED STANDS.** Mean Brier: LLM phase **0.22595** (8 events), kernel phase **0.00703** (9 events). Zero key material, zero budget breaches (6/8 wire requests), zero moth jobs (registered: no sampling needed).

---

## 0. The registration chain (pricing-first, git history is the witness)

| step | commit | what |
|---|---|---|
| registration + predictions (LLM phase) | **bd0dc3a** | `situations/eq10_predictions.json` sha256 `4d7f00514e21ec05…150`, written to disk 23:07:13.393Z — BEFORE the first API response existed (first raw response file 23:07:18.495Z) |
| round-9 session rows + lever registration (kernel phase) + runner | **3d8a1b7** | `situations/guest_rows_r9_keyed.jsonl`, `situations/raw_r9_keyed/` (6 raw API bodies), `situations/cache_economics_r9_keyed.json`, `situations/eq10_lever_registration.json` sha256 `774aff3f571d28cf…ae8`, `experiments/e_q10_armor_injector.mjs` — all sealed BEFORE the first E-Q10 kernel tick |
| run + verdict | (this commit) | outputs, chain, verdict |

**Disclosed defect (wire race, no silent edits):** the lane's generator command imported the runner module, whose top-level `main()` dispatched wire request 1 ~5 ms before the registration file write completed. No response existed when the predictions landed on disk; no prediction, p, prompt, or budget number was touched after any response. Committed post-run with this receipt — the commit ordering is the honest witness, not a clean-room claim.

**Disclosed provenance:** the repo names no experiment "E-Q10" — `situations/eq9_deep_trace_registration.json` name_law assigns E-Q* numbering to the tavern guest and kills the wave-41 "E-Q10-seed-ordering" nickname (it stays dead). The repo's deepseek-gated next step was the round-9 keyed session (wave-39-e fail-closed rows, `$0.00` spend; `cache_economics_r9.json` budget 9/planned 7; both sealed prefix assets in-repo). E-Q10 is therefore registered as the lever the guest returns in that session — no fleet-invented question. The original round-9 runner (`scripts/39e-round9-run.mjs`) is absent from this environment; the r9-q1..q3 user turns were registered verbatim in `eq10_predictions.json` (generated from the lane runner so the two cannot drift).

---

## 1. Round-9 keyed session (the deepseek-gated seat, executed)

- **Budget:** hard 8 wire requests (task law); **used 6, retried 0** (zero failed calls). `max_tokens` ≤ 2000 on every call. Price basis declared **off_peak** (run at 23:0x UTC, inside 16:30–00:30). **Spend $0.0056999** vs $0.0064526 no-cache (savings 11.66%; the curve's 5,120 hit tokens price at 1/50 miss).
- **Guest arm** (r6 sealed asset `777938e2…`, 5025 chars, byte-verified at runtime from `deepseek_guest_r6.mjs` — never edited): 3 rows, served `deepseek-flash`, cache hit **1280** each (prefix warm from the shared provider cache), completions 1000/1200/800.
- **Reasoner arm** (r9 asset `3ccb796a…`, 2808 bytes, byte-identical across slots — the registered 3-call curve): served `deepseek-flash` (r7/r8 precedent repeated — the wire serves flash for reasoner-requested calls; receipted, not assumed), **curve = 0 / 640 / 640 cache hits** — the reasoner warms its own prefix in-session exactly like the r8 flash curve (0/640/640/640 of 867). Reasoning tokens 1739/1431/1278 receipted.
- The cold-sanity arm is **NOT RUN** — a budget decision (the two registered arms consume 6 of 8; receipted, not an omission).

### Predictions vs outcomes — Q1..Q8 (p sealed pre-run, scored AS RUN)

| event | claim | p | outcome | Brier |
|---|---|---|---|---|
| Q1 | all 6 calls parse under the declared extractor | 0.90 | **FAIL — 1/6** (only slot-3 `direct`); 5/6 responses hit the `max_tokens` cap mid-JSON (completions exactly 1000/1200/800/2000/2000); the extractor has no string-truncation repair — `content_raw` sealed verbatim regardless | 0.81 |
| Q2 | guest q2 returns `next_lever` non-null with title/why/cheapest_decisive_run | 0.80 | **TRUE** — sealed in `content_raw` (scored against the raw text because the JSON layer died in Q1; scoring decision disclosed) | 0.04 |
| Q3 | every row's question_id == the asked call_id | 0.90 | **FAIL — 3/6**: guest 3/3 yes; reasoner slots self-named (`E-Q9`, `E-Q9-R9-STANCE`, `R9-DEEP-TRACE-LETTER-FIRE-INTENT-HELD`) — the r9 contract leaves question_id a free string, so this prediction over-reached the contract's reachable set (the 44-c floor was stated and still over-priced here: registration defect, receipted) | 0.81 |
| Q4 | reasoner slot-1 cache hit == 0 | 0.85 | **TRUE** (0/1142) | 0.0225 |
| Q5 | reasoner slots 2–3 cache hits > 0 | 0.80 | **TRUE** (640/1005, 640/996) | 0.04 |
| Q6 | slot-1 prompt_tokens ∈ [600, 1600] | 0.85 | **TRUE** (1142) | 0.0225 |
| Q7 | the sealed lever is executable on the qthe kernels | 0.75 | **TRUE** — names the E-Q5 harness measurables; executed below | 0.0625 |
| Q8 | zero key material in any committed byte | 0.99 | **TRUE** (in-runner no_leak_scan + independent scan over 127 files: hits=0) | 0.0001 |

**Mean Brier 0.22595.** Both FAILs are parse/registration-layer, receipted with causes; nothing was edited post-run.

### What the guest and the reasoner sealed (AS SAID)

- **Guest q2 (the E-Q10 registration):** *"I register E-Q10 as the C5' injector one-pager, not the cascade terminal semantics… it is a spec I wrote at round 6 and the fleet never ran… it reuses the E-Q5 armor-ring harness verbatim (17/20 admissible, sealed VOID clause)… one binary falsifier on an existing rig."* Falsifier verbatim: *"any admissible trial where integrity increases WITHOUT an injector application (substrate self-repair), or where repairTick is non-null, or where post-injection re-erosion is non-monotone — any one of these kills C5' as stated."*
- **Guest q1: stance MOVED** (`"moved": true`) — retires its round-8 7/10 residual risk as *"resolved, bounded, receipted"*; parks a second lever (closed-form sigma predicate for the A+D collapse set) — **PARKED**, not executed (the E-Q10 seat was q2 by sealed prompt).
- **Guest q3:** three UNPRICED residuals receipted (uncoupled-family space floor; family-bound vs kernel-wide boundary; JEV instrument self-contradiction).
- **Reasoner slot-2 concedes plainly** (its own contract's instruction): the round-8 generalization *"fixed moves positively at uncoupled zeros"* is falsified by the 7/10 fixed DOWN −1 resolved in-family — sign is sigma-dependent.
- **Reasoner slot-3 on the letter-fires:** *"A house must not edit the letter, p, or whitener post-run to relabel intent as success; it should retire the literal, preserve the receipt, and re-register the surviving mechanism."*

---

## 2. The kernel phase — E-Q10 = C5' injector one-pager, executed

Runner `experiments/e_q10_armor_injector.mjs`; harness VERBATIM from `e_q5_armor_ring.mjs` (geometry 64×64, ring 698 cells 900≤r²≤1156 Repel d=55, core r²≤64 Attract d=63, 12 cuts half-arc 0.75 cells, T=400, seeds 55001..55020, integrity/repairTick definitions unchanged). **The one-page injector spec** (sealed in `eq10_lever_registration.json`): injector = harness-side byte-write pass between t=50 and t=51 (NOT a kernel primitive — tick() cannot repair: tau immutable, d pressure-only), budget = exactly **1 application × 698 cell-writes**, receipted per trial. Registered addition-only instrumentation: A0 monotone tracking, A2 re-erosion monotonicity + firstZeroTick (the guest's falsifier branch 3 was unmeasurable in E-Q5), budget accounting, fixed-kernel mirror arm.

**20 trials, 17 admissible** — the VOID set is byte-identical to E-Q5's (seeds 55003/57, 55012/58, 55016/59 carved — clause-determined arithmetic, C9 floor met exactly at 17). 180 harness runs × 400 ticks, 2.6 s wall. **Run-1 vs run-2 results files byte-identical (sha256 `33b9c99d0d786e00…a211c`)** — the experiment is its own D1.

### Predictions vs outcomes — C1..C9 (p sealed pre-tick, scored AS RUN)

| event | claim | p | outcome | Brier |
|---|---|---|---|---|
| C1 | A2 post-inject integrity == 1.000 exactly, all admissible | 0.95 | **TRUE 17/17** (one application, 698 writes) | 0.0025 |
| C2 | A2 re-erosion (t≥51) non-increasing every tick | 0.95 | **TRUE 17/17** | 0.0025 |
| C3 | A2 reaches 0.000 by T=400 | 0.93 | **TRUE 17/17 — firstZeroTick = 105 in every trial** (= 50 + 55 one-per-tick erosion steps; zero-pressure islands: none) | 0.0049 |
| C4 | zero integrity increases without an injector (A0+A1+A2 pre-inject) | 0.97 | **TRUE** (falsifier branch 1 never fired) | 0.0009 |
| C5 | repairTick === null in A1 and A2 | 0.93 | **TRUE 17/17 both arms** (branch 2 never fired) | 0.0049 |
| C6 | pristine ring self-erodes (final < 0.95) | 0.95 | **TRUE 17/17 (final 0.000)** | 0.0025 |
| C7 | EQ10-D1: every (trial × arm) doubled, byte-identical | 0.99 | **TRUE** (plane-hash sequences + full integrity timelines) | 0.0001 |
| C8 | fixed kernel byte-identical to float (A1+A2) | 0.85 | **TRUE 17/17** — no sigma in this harness, so the Q32.32 door does not exist here; a divergence would have been a new artifact class | 0.0225 |
| C9 | admissible ≥ 17/20 | 0.85 | **TRUE (= 17, exactly at the floor)** | 0.0225 |

**Mean Brier 0.00703. The guest's falsifier did NOT fire — C5' AS STATED STANDS.**

## 3. What the answer IS (honest reading)

**"Repair" is injector semantics, now reproduced from a one-page spec:** a single 698-byte harness-side application restores integrity to exactly 1.000 in one tick, the ring then re-erodes monotonically at exactly −1 d/tick per cell (firstZeroTick 105 = 50 + 55, arithmetic-pinned), and NOTHING in the substrate ever increases integrity on its own — the kernel has no repair term to find. The guest pre-priced this outcome as a risk ("C5' could resolve as 'definitional, not empirical', which would be an honest null rather than a live/dead verdict") — **receipted as exactly that**: the spec reproduces, the claim closes as an injector-semantics definition with measured dynamics, and the C5' one-pager becomes the registered spec artifact. The one genuinely open empirical cell the run could have killed — a zero-pressure erosion island (a ring cell with all 8 neighbors carved would hold d=55 forever) — did not occur: no island in 17/17 trials.

**Scoreboard move:** C5' **RESOLVED AS STATED** (spec reproduces; falsifier armed and unfired). Open: C1, C5'-parked levers (closed-form A+D collapse-set predicate; uncoupled-family space floor; family-bound vs kernel-wide boundary; JEV instrument), cascade terminal semantics (the guest's named next lever if E-Q10 resolved quickly — it did).

## 4. Defects, holes, honest notes (all receipted, none editorialized)

- **Q1/Q3 FAILs** — parse-layer (max_tokens truncation; 5/6 rows) and a registration over-reach (Q3 priced the reasoner rows against the asked call_id when the r9 contract leaves question_id free). Both scored AS RUN, both explained here; no prediction edited.
- **Wire race** — request 1 dispatched ~5 ms before the registration write completed (import side-effect); disclosed above with mtime receipts.
- **THE STONE absent from this sandbox** — all four `_stone_link` candidates exhausted on run-1 (results were already written; no chain was faked). Run-2 resolved the CANONICAL module pinned lane-side at `scripts/45b-stone/stone.mjs`, fetched read-only from `quilt-stone` blob `4ef3e1b8937c9571f1439d5bd73a87a9292d716f` (sha256 `73c28357a3c245e4…50fa`) — a pinned copy, not a fork; zero network inside the run. Chain sealed and **verified from disk: 24 links, tip `50ddf5f9226d8c84…e6938`**.
- **Served model** — every call (incl. reasoner-requested) served `deepseek-flash`; receipted per row (r7/r8 precedent), priced on the round-6 declared basis.
- **`deepseek-reasoner` caveat** — the seat was requested as registered; the wire's flash served reasoning tokens (4448 total). The curve result (own-prefix warming) is therefore a flash-reasoning-model result, honest-labeled.

## 5. Receipts

- LLM session: `situations/guest_rows_r9_keyed.jsonl` sha256 `1a7d8fdfde4fe29c…319b` (6 rows AS SAID + per-call usage); raw API bodies `situations/raw_r9_keyed/*.json` (6 files, response-side only); `situations/cache_economics_r9_keyed.json` sha256 `df53ac38fdc8c9c4…4376` (6/8 wire, $0.0057 off-peak, curve 0/640/640).
- Registrations: `situations/eq10_predictions.json` (bd0dc3a, sha `4d7f00514e21ec05…150`); `situations/eq10_lever_registration.json` (3d8a1b7, sha `774aff3f571d28cf…ae8`) — nothing edited post-run.
- Kernel run: `experiments/outputs/e_q10_results.json` sha256 `33b9c99d0d786e00…a211c` (byte-identical across two full runs) + `e_q10_tip.txt`; chain `receipts/e_q10_chain.jsonl` sha256 `6637ce7dfb2d6871…1fc59` (24 links, verified from disk).
- Spend: LLM $0.0056999 (off-peak basis); kernel/stone/moth $0. **MOTH_KEY / DEEPSEEK_API_KEY / GH_TOKEN never printed or committed** (double scan clean).

## 6. Holes

None in the kernel phase (zero UNEXPLAINED, zero D1 failures, zero assertion failures; C8's cross-kernel identity closes the plane question for this harness). The LLM phase carries two scored FAILs (above) and one honest absence: the reasoner's slot-1/slot-2 verdicts are sealed but truncated mid-JSON — their complete JSON was never produced by the wire, and the lane did not spend the remaining 2-request budget re-asking (the lever was already sealed and slot-3 parsed complete). Re-running the two slots with a higher cap is a cheap, registered follow-up, out of this lane's budget law.
