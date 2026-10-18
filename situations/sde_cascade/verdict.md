# ORCH-R13 Lane T4-b — SDE cascade for tavern adjudication: VERDICT

> Claim under test (cookbook §4.1, registration §8.3): a cheap briefing-side
> per-field bad-true Noul battery (max-gate at FIRE_T) routes findings so the
> expensive tier only sees escalations — "the cascade frontier sits up-and-
> left of every single model." Every number below is re-derivable from
> `rows_battery.jsonl` + `ground_truth_table.json` + `cascade_computation.json`.

## The run (sealed)

- Corpus: **90 sealed outcome-labelled findings** — r10 40 (7 seats) + r11 18
  (4 endorsed seats, turn-1) + grounding 32 claims. Ground truth: **BAD 14 /
  CLEAN 43 / JUDGMENT 33**, every label receipted in
  `ground_truth_table.json` (r10 labels from ROUND-TIME verification, not the
  drift-contaminated T3-c re-read; r11 from the verdict scoreboard + the R11
  mispricing list; grounding from the sha-pinned T3-a ground truth).
- Battery: 7 per-field bad-true nouls per finding + 1 UNGATED `__overall__`
  per group; state = round briefing verbatim (r10 8,882 chars / r11 7,259
  chars, shas sealed in the run log) + findings verbatim. **15 groups × 3
  repeats = 45 calls, 45/45 answered, zero HTTP errors, $0.012118**
  (288,516 in / 51,081 out tokens), mean ~250 ms/call, all jev-1.13.0.
- Arm 1 (all-expensive) = the sealed earned-loop record: recall 81.8% on its
  loop-priced BAD subsets (r10 3/4 + grounding 6/7), price ~$0.00034/finding.

## FALSIFIER EVALUATION (frozen, applied as registered)

| FIRE_T | fabrication recall | fires on CLEAN | escalated | cascade cost | arm-1 cost |
|---|---|---|---|---|---|
| 0.3 | 1.000 (14/14) | **100.0%** (43/43) | 90 | $0.0427 | $0.0306 |
| 0.5 | 0.857 (12/14) | **53.5%** (23/43) | 50 | $0.0291 | $0.0306 |
| **0.7** | **0.714 (10/14)** | **30.2%** (13/43) | 28 | $0.0216 | $0.0306 |
| 0.9 | 0.071 (1/14) | 2.3% (1/43) | 3 | $0.0122 | $0.0306 |

- **Clause 2 (no separation, >50% of CLEAN):** at the registered FIRE_T 0.7
  the battery fires on 30.2% of CLEAN — the clause does NOT fire. Separation
  exists (BAD mean max-field 0.715 vs CLEAN 0.588) but the distributions
  overlap heavily.
- **Clause 1 (quality below all-expensive beyond what the cost saving
  justifies):** at 0.7 the cascade recalls 71.4% vs arm-1's 81.8% — **10.4
  points of fabrication recall for a 29.4% cost saving**. At the tavern's
  actual prices the adjudication layer is ~$0.03/round and ONE leaked
  fabrication is the round's dominant priced failure (the r10 Qwen 4/4
  incident is the priced precedent). $0.009/round does not buy 4 leaked
  fabrications per 14. At 0.5 quality reaches parity (85.7% ≥ 81.8%) but the
  no-separation clause FIRES (53.5% > 50%) and the saving collapses to 5%.
  **The falsifier's quality clause FIRES at every threshold that passes the
  separation clause.**

## VERDICT: NOT-YET — the pareto claim does not transfer to our traffic

The structural reason (the lane's headline finding): **cascade economics are
expensive-tier-price-relative.** The cookbook's frontier was drawn against
gpt-5.5 at ~$0.10/extraction; our earned loop runs at ~$0.00034/finding —
**294× cheaper** — so the battery ($0.0121 for 90 items, ~40% of the
all-expensive arm's entire budget) is itself the dominant cost. A cascade
pays when the expensive tier is expensive; against a cheap verifier the
battery IS the expense. The pattern is not wrong — it is priced for a
different price regime.

## What the lane earns anyway (banked findings)

1. **The battery is a stable, cheap triage signal.** Repeat stability over
   630 (item, field) triples: mean std **0.0112**, max 0.070, zero triples
   above 0.1 — no threshold-crossing spans anywhere. As routing HINTS (not
   gates) the numbers are trustworthy, and the §6.2 review band would be
   nearly empty on this traffic.
2. **The loaded field is `incomplete`, not `hallucinated`.** The firing field
   for BAD items: incomplete 8/14, hallucinated 3/14, unreasonable 1/14
   (claim-f06 0.93). The r10 penalty class (invented CLI flags, invented
   mechanism) presents to this battery as missing-qualifier risk, not as
   invented-artifact risk — the cookbook's NYU example fired
   `description::hallucinated 0.95`; ours does not. Field-redesign pointer
   for artifact-invention traffic: `hallucinated` under-fires; the artifact
   check belongs to the code-side candidate-set pattern (§4.3), which is
   exactly where the earned loop already puts it.
3. **The claim-density confound.** All 13 CLEAN items that fire at 0.7 are
   dense factual claims (grounding t-claims, 0.72–0.91); ZERO r10/r11 audit
   findings fire. A bad-true battery reads specificity as risk: true claims
   dense with numbers and artifact names look like misstatement surface.
   Calibrate per text-shape before reusing the battery on claim traffic.
4. **The misses are the misstatement class, by construction.** r11-hy4p/F1
   (0.40) and F5 (0.34) are true-mechanism-wrong-conclusion findings — a
   briefing-side battery cannot catch these (the §0 law, third appearance
   this round): their refutation lives in code-side checks (existsSync
   presence), which is the mechanical layer's job at $0.

## Standing decision

The middle rung STAYS with the earned loop (mechanical-first, $0 for the
invented-flag class, grounded Choice for the rest). The battery is banked as
a pre-loop triage/priority signal, not a gate. **Re-registration pointer:**
if the tavern ever runs expensive adjudicator seats (Hy4 at $0.016/audit) as
the verify tier, re-run this sweep with arm-1 priced at seat prices — the
economics flip when the expensive tier is actually expensive.

## Budget

- Battery: **$0.012118** of the $0.05 lane ceiling (45 calls).
- Arm-1 and sweep costs: arithmetic over sealed rows (receipted in
  `cascade_computation.json`).
- Round running total: T4-a $0.0221 + T4-c $0.0023 + T4-b $0.0121 =
  **$0.0365** of the $0.15 round ceiling.
