# PLAYBOOK — Cache Economics for the qthe Guild Fleet
**Seat:** fleet-wrangler · **Coursework:** G1-5 · **Status:** design doctrine, no live calls made (No-Key Law honored)

## 0. Honesty labels (used throughout)

| Label | Meaning |
|---|---|
| **MEASURED** | Priced from a sealed receipt in the qthe repo; pointer cited. |
| **DERIVED** | Arithmetic performed on MEASURED receipts; shown explicitly. |
| **EST** | Estimate to verify at first live call. No dollar figure is asserted — formulas only. |
| **LAW** | Procedural rule the fleet adopts; testable by audit. |

Doctrine sources (MEASURED, all in github.com/SuperInstance/qthe): `situations/MODEL-LEARNINGS.md`, `situations/arena_r10_verdict.md`, `situations/cache_economics_r10.json`, `situations/cache_economics_r11.json`, `situations/batching_falsifier/`, `situations/sde_cascade/reprice_analysis.json`, `situations/grounding_loop/verdict.md`, `docs/research/TYPESAFE-PLAYGROUND.md`.

**The measured anchors this playbook is built on:**
- r10 (MEASURED): 9 calls, 21,997 prompt / 47,852 completion tokens, **$0.0509 total**; 40 findings → 19 verified new → 2 hallucination classes priced → 1 gate extension adopted. Immutable briefing prefix 8,882 chars, sha `5d44a0d1…`.
- Per-seat $/audit and cache-discount multiplier D (MEASURED, r10 receipt): MiMo-V2.6-Flash $0.0012 / D=50; DeepSeek-V4.1-Flash $0.0018 / D=33; Hy4-preview $0.0160 / D=20; Nemotron-3.5-Super-VL $0.0024 / D=1.2; Qwen3.6-35B-A3B $0.0045 / D=1.0; Seed-2.0-mini $0.0023; Muse-Glimmer-30B $0.0056; Ling-3.1-flash $0.0171 (runaway reasoning, 2× budget-exhaustion).
- r11 (MEASURED): 8 calls, $0.043969 actual vs $0.045657 no-cache counterfactual; overall hit ratio only **0.1378**. Turn-2 self-critique cashed cache on MiMo (1,952 cached, hit 0.4201, $0.000715) and Hy4 (1,792 cached, 0.3422) — but Seed-2.0-mini and DeepSeek-V4.1-Flash turn-2 drew **zero hits, provider-side, receipted as honest telemetry**.
- r13 (MEASURED): parallel-question batching **WINS** — 0/30 batch-hostile, 12.36× cost ratio at document-dominated states. SDE cascade NOT adopted; the earned grounding loop priced at $0.00034/finding.
- r15 (MEASURED): Hy4-preview as verify tier loses on BOTH axes at 50× the price ($0.61/audit-run, 57.1% BAD recall, 55.6% false-BAD vs the battery's 71.4%/30.2% at $0.012); **2,400 reasoning tokens per call never cached**.
- TypeSafe/Jev (MEASURED): systemone endpoint, typed question map {noul|choice|score}; 96 typed questions in ONE call, 312–326 ms, 3/3 repeats; answer-layer wobble real (only 7–10/96 answers byte-identical across repeats while input_tokens identical).

---

## 1. (a) The immutable-prefix architecture

### 1.1 What freezes, what flows

The prompt is two planes, mirroring the qthe primitive — the prefix is geometry (frozen, shared), the suffix is physics (variable, per-turn):

```
[PREFIX — byte-frozen, sha-sealed, cache-payload]   [SUFFIX — variable]
┌──────────────────────────────────────────────┐   ┌─────────────────────┐
│ 1. SEAT CHARTER                              │   │ 1. THE TASK         │
│    role, honesty law, AS-SAID sealing rule,  │   │   artifact under    │
│    output contract, amendment law            │   │   audit / question  │
│ 2. CANON DIGEST                              │   │ 2. TURN INSTRUCTION │
│    claim-table digest, conceded-gaps list,   │   │   attack-brief vs   │
│    verification rules, scoring vocabulary    │   │   audit-brief       │
│ 3. TASK GRAMMAR                              │   │ 3. RUN PARAMETERS   │
│    the exact JSON output schema, severity    │   │   (budget, turn id) │
│    vocab, finding-field definitions          │   │                     │
└──────────────────────────────────────────────┘   └─────────────────────┘
```

**LAW — freeze the stable, flow the volatile.** A byte belongs in the prefix only if it will be identical across every seat, every round, every turn of a prefix version. Anything that changes per round (round numbers, dates, task lists, the artifact itself, per-seat briefings like Seed's ATTACK framing) lives in the suffix. The r10 briefing followed this: one immutable 8,882-char prefix, eight seats, identical task (MEASURED).

**LAW — the charter before the canon before the grammar.** Order matters for future edits: put the least-likely-to-change material earliest (deep cache systems match longest common prefixes; and our own edit discipline benefits from a stable spine).

### 1.2 Rules for structuring briefs to maximize hits

1. **Byte-identity is the cache currency.** One changed character voids the match. Seal `prefix.sha256` and `prefix.chars` into every round's economics receipt, exactly as `cache_economics_r11.json` does (sha `11258be6…`, 7,259 chars — MEASURED pattern).
2. **Never template-substitute the prefix.** r11 in-run lesson, receipted: `.format()` on a prompt containing literal JSON braces corrupts it — `.replace()` only, and better, keep the prefix a static file read verbatim (LAW).
3. **No clocks, no counters, no nonce in the prefix.** Timestamps and round counters are the classic self-inflicted cache kill. Round identity goes in the receipt, not the prompt.
4. **The suffix must not leak into the prefix** — not even whitespace. Build prompts by concatenation of a frozen file + a separately-constructed suffix.
5. **One seat, many turns.** A model's first call is cold by construction (MEASURED, r10: the round's only hit was Ling's amendment call reusing its own prefix). Discounts are only payable from turn 2 — so the unit of planning is the multi-turn loop on ONE seat, never the single call.
6. **Read the hit, never assume it.** r11's honest telemetry: two of four seats drew zero turn-2 hits provider-side. LAW: every receipt row reads `usage.prompt_tokens_details.cached_tokens` (+ `cache_write_tokens`, `estimated_cost`) from native DeepInfra telemetry; a miss is recorded as-is, never smoothed over. The counterfactual `usd_if_no_cache` is recorded every round so the value of the game is measured, not asserted (MEASURED schema, r11).
7. **Thinking models are cache-blind by behavior.** r15: 2,400 reasoning tokens per call never cached. LAW: never build an iteration loop whose turns are dominated by reasoning-token emission; thinking seats (Ling-class, Inkling-class at 4× budget) are scalpel calls, not loop bodies.

### 1.3 Version bumps: when and what they cost

Prefix versioning is semantic, and **every bump — even a typo fix — breaks byte-identity and re-bills the full prefix at full rate once per seat before re-warming:**

- **MAJOR** — charter/honesty-law/grammar change (new output schema, new scoring vocabulary). Requires a fleet memo; all in-flight loops complete or restart on the new version, never mixed.
- **MINOR** — canon-digest content change (new claims closed, new conceded gaps). Ship between rounds, never mid-round.
- **PATCH** — wording fix. Still costs a re-warm; therefore **LAW — bundle, don't drip**: accumulate pending prefix edits in a quarantine file; ship them as ONE bump at a round boundary.

**Bump cost (parameterized):**

```
bump_cost(seats) = Σ_s  P · r_in(s) · (1 − 1/D_s)      [EST — the forfeited discount]
  + Σ_s  (re-warm turns until provider honors hits) × uncertainty
```

where `P` = prefix tokens, `r_in(s)` = seat s's full input-token rate, `D_s` = seat s's cache-discount multiplier. The first term is the discount you forfeit on each seat's next call; the second is the r11 lesson — provider-side hit behavior is not contractual, so a bump also re-exposes you to hit variance. With `D=50` (MiMo, MEASURED) the forfeited discount on a re-bill is large relative to seat cost; with `D≈1` (Qwen, MEASURED) a bump costs almost nothing extra because caching never paid there anyway. **Decision rule (LAW): bump only when the content change alters seat behavior (charter/grammar) or correctness (canon); bundle all cosmetic edits.**

---

## 2. (b) Batching patterns

### 2.1 Parallel-question batches (the "Jev batched triage" pattern)

r13 falsifier-first verdict (MEASURED): batching **WINS** — 0/30 batch-hostile findings, 12.36× cost ratio when the state is document-dominated (shared material ≫ per-question material). The economics, parameterized:

```
unbatched:  cost = N · (P + Q̄) · r_in  + Σ o_i · r_out          (each call re-sends P)
batched:    cost = (P + Σ Q_i) · r_in + O · r_out
saving:     Δ = (N − 1) · P · r_in   [further multiplied by the discount if P is already warm:
             batched-warm ≈ P/D + Σ Q_i, since the batch call itself re-hits the cached prefix]
```

Batching and prefix-caching compound: the batch call's prompt begins with the same frozen prefix, so it can ride an existing warm cache while collapsing N suffix-sends into one.

### 2.2 Attribution without loss

The failure mode of batching is lost per-answer attribution. **LAW — the numbered-question protocol:**

1. Every question in the batch carries a stable id: `Q01, Q02, …` (never renumber mid-experiment; ids are cited by receipts and verdicts).
2. The task grammar (prefix) mandates: every answer MUST open by echoing its question id verbatim.
3. The harness enforces the contract mechanically: `count(distinct echoed ids) == count(question ids)` or the row fails parse — one declared amendment allowed at higher budget, two failures prices the seat out of the round (MEASURED amendment law, r10).
4. The batch is a single call → single receipt row → per-answer attribution preserved by the id-echo, and per-batch economics preserved by the row.

**When NOT to batch (LAW):** when answers depend on each other (a critique of Q3 that must see the answer to Q1 — batch only independent questions); and when the decision is verdict-grade — TypeSafe answer-layer wobble is real (7–10/96 byte-identical across repeats, MEASURED), so batches are for **triage**, verdicts go through the verification battery.

### 2.3 The Jev/systemone side

MEASURED: 96 typed questions in one systemone call; ~230 ms/seat batched in the judge pattern; zero HTTP errors across 58 calls at ~1 call/s. LAW: batched typed questions are the default triage instrument; labels are stable enough for severity/actionability routing, not for final verdicts (the grounding-gap law: a briefing-only judge rated a hallucinated mechanism 4/4 verified_new — judges draft, the repo decides).

---

## 3. (c) Tier doctrine

| Tier | Seats (MEASURED anchors) | Use | Never use for |
|---|---|---|---|
| **cheap-iterate** | MiMo-V2.6-Flash (D=50), DeepSeek-V4.1-Flash (D=33) | draft → critique → revise loops; every-round audits | — |
| **attack** | Seed-2.0-mini, ATTACK-briefed | plan attacks, adversarial consultations | plain audits — un-briefed it restates admitted gaps (r10: 0 verified_new) |
| **adjudicate** | Hy4-preview (D=20) | arbitration, falsifier-class review | drafting (13× MiMo's cost, same quality tier) |
| **reasoning** | Ling-class (≥24k budget), thinking models at 4× budget | mining deep meta-findings, one-off | any loop body (runaway risk; reasoning tokens never cached) |
| **decision** | TypeSafe/Jev systemone | routing, triage, arbitration, confidence-gating | final verification (grounding-gap law) |
| **mechanical** | Orchestrator-self: anchor checks, kernel runs, schema validators | everything settleable without a model — dies at $0 | — |

**The r10 headline, priced:** the two cheapest seats delivered the two strongest audits (MiMo 6/6 verified at $0.0012). The r15 headline, priced: the expensive seat as a *verifier* lost on both axes at 50× price. **LAW — cheap drafts, mechanical verifies, expensive adjudicates.** Verification is never "ask a bigger model"; it is the battery + earned grounding loop (fabrication detection 6/7 vs 4/7 briefing-only, true-flag 81.8%, zero auto-fabrications — MEASURED).

**Escalation triggers (drafted cheap → adjudicated strong):**
1. Two cheap seats disagree on a finding that would touch a sealed verdict → escalate to adjudication tier (E-F2 measures this).
2. A finding is falsifier-class (predicts a failure class, e.g. Hy4's registry-drift falsifier, MEASURED) → adjudication tier reviews before adoption.
3. The grounding loop's confidence gate fires (`< 0.8` → human; the 0.8 gate sits inside the measured 0.894/0.403 confidence gap — MEASURED) → human, not a bigger model.
4. Cheap-tier contract failure ×2 → the seat is priced out; re-route, don't re-try (amendment law).
5. Reasoning-class question (a "why does this behave so" with no mechanical check) → reasoning tier once, ≥24k budget, mined from sealed reasoning.

**Anti-trigger (LAW):** never escalate to avoid verification. Escalation buys judgment, not truth.

---

## 4. (d) The iteration loop for development

The r11 structure, generalized (MEASURED core: two-turn draft→self-critique cashed the cache where the provider honored it):

```
LOOP(k iterations, ONE seat, warm prefix):
  turn 1  DRAFT      suffix = task brief;        cold (h≈0) — pay P at full rate once
  --      VERIFY     mechanical, $0: anchor checks, schema validation, kernel runs
  turn 2  CRITIQUE   suffix = "attack your own draft, cite ids";  warm (h>0 if provider honors)
  --      VERIFY     mechanical, $0
  turn 3  REVISE     suffix = "repair F-ids that survived critique"; warm
  ...
  stop when: marginal verified findings over a full turn = 0, OR k_max reached, OR
             loop spend ≥ task budget cap
```

Laws of the loop:
- **Same seat across turns** — the discount belongs to the seat, not the fleet. Cross-seat critique only when the author is suspected self-confirming (then the critic pays its own cold call — a budgeted decision, not a habit).
- **Verification between every turn, at $0** — the repo decides; a loop turn whose output fails mechanical checks doesn't get critiqued, it gets amended once or killed.
- **Marginal-yield stop rule** — the loop exists to convert cached prefix into verified findings; when a full turn adds zero, the cached tokens stop paying and the loop is done (track `verified_new_per_turn` in the receipt).
- **Foreground batches** (MEASURED sandbox lesson): background `nohup` processes get reaped; the resume-by-call_id law makes re-running safe and duplicate-free.
- **Budgets:** 6k max_tokens adequate for 3–7-finding audits; 8k for Hy4/Nemotron on harder tasks; attack-briefed Seed got 6.7k on 8k — give attack rounds 10k+; Ling ≥24k or skip (all MEASURED).

---

## 5. (e) Parameterized cost model — EST until first live call

**No dollar figure below is asserted.** Every rate is a symbol; the first live round of any seat replaces symbols with MEASURED values from `estimated_cost` in native telemetry, and the replacement is itself receipted.

### 5.1 Symbols

| Symbol | Meaning | Anchor (MEASURED where noted) |
|---|---|---|
| `P` | frozen prefix tokens | r10: 8,882 chars ≈ P_r10; r11: 7,259 chars |
| `S_t` | suffix tokens at turn t | — |
| `o_t` | completion tokens at turn t | r10 avg ≈ 47,852/9 per call |
| `r_in(s)` | seat s full input rate | **EST — verify** |
| `D_s` | seat s cache-discount multiplier | MiMo 50, dsv 33, Hy4 20, Nemotron 1.2, Qwen 1.0 (r10) |
| `h_t` | observed hit fraction at turn t = `cached_tokens / prompt_tokens` | read from telemetry, never assumed |
| `r_out(s)` | seat s output rate | **EST — verify** |
| `k` | loop iterations | capped by marginal-yield rule |
| `N` | questions in a batch | 96 probed OK on Jev (MEASURED) |

### 5.2 Formulas

```
per-call cost:
  cost(s, t) = P·[(1−h_t)·r_in(s) + h_t·r_in(s)/D_s] + S_t·r_in(s) + o_t·r_out(s)

loop cost (one seat, k turns):
  cost_loop = cost(s,1) + Σ_{t=2..k} cost(s,t)
            = P·r_in·[1 + (k−1)·( (1−h̄) + h̄/D )]  + Σ S_t·r_in + Σ o_t·r_out
  where h̄ = mean observed hit fraction over warm turns (r11 measured h̄ as low as 0.0
  on two seats and 0.34–0.42 on two others — plan for the miss; price the hit only
  after the row says so)

batched triage cost (N questions, warm prefix, Jev):
  cost_batch = (P + Σ Q_i)·r_in(jev)/D_jev_effective + O·r_out(jev)     [EST]
  vs unbatched:  Δ = (N−1)·(P + overhead_per_call)·r_in(jev)

version bump cost:
  cost_bump = Σ_s P·r_in(s)·(1 − 1/D_s)  +  re-warm variance exposure   (see §1.3)

round cost (M tasks, seats ß, verification V):
  cost_round = Σ_tasks Σ_seats cost_loop + Σ triage batches + V
  V ≈ $0 for mechanical anchor checks; the grounding loop priced $0.00034/finding (r13);
  the battery $0.012/audit-run (r15) — both MEASURED anchors for the verification tier.

derived anchor (arithmetic on r10 receipts, shown):
  $0.0509 round spend ÷ 19 verified new findings = ≈ $0.0027 of generation spend per
  verified finding. This is the E-F3 baseline, not a promise.
```

### 5.3 Metrics recorded per call (the receipt row — schema mirrors `cache_economics_r11.json`)

```json
{
  "call_id": "rR-seat-turn", "seat": "…", "model": "served-model-id",
  "turn": 1, "task_id": "…", "prefix_version": "vX.Y", "prefix_sha256": "…",
  "prompt_tokens": 0, "cached_tokens": 0, "cache_write_tokens": 0, "hit_ratio": 0.0,
  "completion_tokens": 0, "usd": 0.0, "usd_if_no_cache": 0.0,
  "elapsed_ms": 0, "parse_method": "direct", "error": null,
  "verification_verdict": "verified_new | already_admitted | plausible | misstated | n/a"
}
```

LAW: a call without a receipt row did not happen. A row without `verification_verdict` is a draft, not a finding. A receipt never carries auth material (see KEY-LAW.md §7).

### 5.4 First-live-call verification ritual (EST → MEASURED)

For each seat, once per session: one canary call (tiny prompt, known answer), read `estimated_cost`, `cached_tokens`, `cache_write_tokens` from native telemetry; divide canary dollars by canary tokens to fix `r_in`, `r_out` for the session; store in the round's `price_table.json` with `source: "canary call_id …"`. Until that ritual runs, every cost projection in Guild planning stays labeled EST.
