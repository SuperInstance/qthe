# ORCH-R13 ROUND REPORT — the economics rung: three killer experiments, two new members

> The round report the house style demands: decisions, arguments, prices.
> Registration: `2026-10-18-orch-r13-registration.md` (frozen before any
> spend). Round ceiling $0.15; **actual spend $0.0440** (29.3%). Zero
> silent failures. Four pushes at milestones per the founder's mandate.

## Round open (receipted)

The stranded R12 corpus (4 commits, through daa2ef7) was found **unpushed**
— the R12 close-out's "pushed" claim was wrong for the final two commits
(session died mid-round). Pushed FIRST, before anything else. Gate re-run by
the orchestrator's own hand at round open: PROBE-GATE PASS, 17/17 chains,
23/23 claims. Credentials re-verified live (PAT ls-remote; DeepInfra 181
models; canary 12 tokens).

## Lane T4-a — parallel-question batching falsifier (§6.3/§8.2)

**VERDICT: BATCHING IS IN.** 0/30 sampled questions batch-hostile (the OUT
threshold was ≥6/30); the largest arm-to-arm move (0.030, seed20mini
F4__class) sat inside its own single-arm noise (0.043); zero label flips in
either arm. Measured economics at document-dominated state: **cost ratio
12.36×** (11.45–12.86 per guest), latency 17.7× — the cookbook's 12.2×
REPRODUCES at our shapes. The r10 arithmetic: the sealed $0.00123 batched
judge round would have cost $0.0096 as 120 singles.

The argument that matters: the question map is not free (~147 marginal
input tokens per question — class instructions embed each finding's text),
so the ratio tracks state-chars-per-question, not a constant
(doc-dominated lands at 0.63× of naive N, compact at 0.47×). Tokenizer
rates are content-shape-dependent (prose ~0.31 tok/char vs findings-JSON
~0.73) — projections from one rate misprice by >2×.

213 calls, $0.0221, zero HTTP errors. Supersessions receipted: the
registration's "105 questions" superseded by the sealed-rows truth (159;
all 7 seats, the operative rule); the r11 seeded pick read 9 mod 4; the
briefing measured 8,882 chars, not ~13k.

## Lane T4-b — SDE cascade for tavern adjudication (§4.1/§8.3)

**VERDICT: NOT-YET — the pareto claim does not transfer to our traffic.**
90 sealed outcome-labelled findings (BAD 14 / CLEAN 43 / JUDGMENT 33, every
label receipted; the corpus holds 90, not the spec's 100 — amendment at
registration). The battery: 7 per-field bad-true nouls × 3 repeats × 15
groups = 45 calls, $0.0121, mean 250 ms, all jev-1.13.0, zero errors.

The sweep (frozen falsifier, applied as registered): at FIRE_T 0.7 the
cascade recalls 71.4% of fabrications vs the all-expensive arm's 81.8% —
10.4 points for a 29.4% cost saving; at 0.5 quality reaches parity (85.7%)
but the no-separation clause FIRES (53.5% of clean) and the saving
collapses to 5%. **The quality clause fires at every threshold that passes
the separation clause.**

The structural headline (banked): **cascade economics are
expensive-tier-price-relative.** The cookbook's frontier was drawn at
gpt-5.5 prices ($0.10/extraction); our earned loop runs at $0.00034/finding
— 294× cheaper — so the battery itself is 40% of the all-expensive budget.
A cascade pays when the expensive tier is expensive; against a cheap
verifier, the battery IS the expense. Salvage banked: the battery is a
stable triage signal (mean repeat std 0.0112 over 630 triples); the loaded
field is `incomplete` (8/14), not `hallucinated` (3/14); the claim-density
confound (all 13 clean fires are dense factual claims, zero audit
findings); the misses are the misstatement class by construction. The
middle rung stays with the earned loop.

## Lane T4-c — entity alignment for registry reconciliation (§5.3/§8.5)

**VERDICT: NOT-YET — keep it code-only.** 74 calls, $0.0023. Part 1 (the
labelled replay of the ORCH-C inventory drift): 42/43 = 97.7% match, zero
wrong merges — but the ABV clause fired as registered. Part 2 (live
cross-seat finding pairs): 83.3% headline with **3/10 wrong merges on
known-different pairs** (one at confidence 0.94) — the expensive-mistake
direction; per-field nouls dissented 0/146 times (no cheap patch).
Numbers-are-evidence-never-identity got its live-sealed proof (e_q16 rows
18→19 across the fix commit: Score merged at 1.97 where any numbers-rule
splits).

**The append-only correction (the round's best story):** Inkling-Small's
day-one attack — registry-reconciliation key circularity — was UPHELD on
verification: 29/29 same-entity pairs carry byte-identical paths (zero
alias cases), so the ABV's 100% is tautological on this corpus and cannot
test semantic identity. The verdict survives on the part-2 wrong-merge
clause (adjudication-grounded, not path-keyed), but the reasoning is
corrected in the verdict file, append-only. A new member materially
sharpened a sealed verdict within hours of seating.

## New members (the founder's r13 ask)

- **NousResearch/Hermes-3-Llama-3.1-405B**: canary 2.5 s / $0.000118;
  opinion 8.8 s / $0.000742 / finish=stop. Its attack on the cascade
  (surface-feature bias) was CONFIRMED — and already receipted in the T4-b
  data: Hermes derived the tavern's own sharpest finding from a 120-word
  brief. EARNED: the outside-the-box short-opinion seat.
- **thinkingmachines/Inkling-Small**: a thinking model (reasoning_tokens in
  usage). First opinion call: finish=LENGTH, 2,006 reasoning tokens, zero
  visible content — **amendment law applied** at 8,000 tokens (total
  $0.0065). The circularity attack that followed was upheld and corrected a
  sealed verdict. EARNED: the deep-attack seat. **Thinking-model law:
  budget ≥ 4× the expected visible output.**

Tavern now 10 seats. Neither displaces an earned seat.

## The scoreboard

| lane | calls | spend | verdict |
|---|---|---|---|
| T4-a batching falsifier | 213 | $0.0221 | BATCHING IN (0/30 hostile, 12.36×) |
| T4-b SDE cascade | 45 | $0.0121 | NOT-YET (price-relative economics) |
| T4-c entity alignment | 74 | $0.0023 | NOT-YET (3 wrong merges; ABV tautology corrected) |
| new members | 5 | $0.0075 | both seated (Hermes opinions; Inkling deep-attacks) |
| **round** | **337** | **$0.0440** | of $0.15 ceiling |

Register: +8 promoted L1 entries in TYPESAFE-PLAYGROUND. MODEL-LEARNINGS:
r13 section (seats 13–15). README: the tavern section added.

## Next registered (for r14)

1. **The standing battery rewire**: the tavern's per-guest scoring battery
   becomes one batched call per guest (T4-a earned it) with the measured
   12.36× priced into the round budgets; the batch-hostile check runs
   whenever a NEW question type enters the battery.
2. **The subject-key pre-registration** (T4-c's pointer): before any future
   cross-examination pairing, findings get a code-side subject key
   (artifact + contested claim); the Score then judges same-subject vs
   same-issue only.
3. **The cascade re-price** (conditional): if a round ever runs Hy4 as the
   verify tier at $0.016/audit, re-run the T4-b sweep with arm-1 priced at
   seat prices — the economics flip when the expensive tier is expensive.
4. **Jev-garden live wiring** and the hardware gap remain the standing
   honest gaps (unchanged, named, not LARPed).
