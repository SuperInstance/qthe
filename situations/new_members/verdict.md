# ORCH-R13 new members — Hermes-3-Llama-3.1-405B and Inkling-Small

> The founder's r13 ask: craft new members; "hermes 405b can be smart but
> outside the box thinking when you ask. same with inkling." Both confirmed
> live on DeepInfra at round open (181-model list re-check). Probe protocol:
> canary (prices latency/contract) → one outside-the-box attack opinion on
> the three R13 killer experiments → orchestrator verification of every
> claim (the grounding law generalizes to new members on day one).

## Canary (rows_canary.jsonl)

| seat | latency | tokens | cost | contract | notes |
|---|---|---|---|---|---|
| NousResearch/Hermes-3-Llama-3.1-405B | 2,471 ms | 38 out | $0.000118 | clean direct JSON, finish=stop | fast for a 405B |
| thinkingmachines/Inkling-Small | 1,206 ms | 144 out (106 reasoning) | $0.000212 | clean JSON, finish=stop | **a thinking model** — reasoning_tokens in usage |

## The opinion probe (rows_opinion.jsonl)

Brief: attack the ONE experiment most likely to have produced a FALSE
conclusion, name the deadliest confound, 250 words. Both answered.

### Hermes-3-Llama-3.1-405B — attacked Experiment B (the SDE cascade)

- Delivery: 8,826 ms, 282 tokens, $0.000742, finish=stop, direct prose.
- The attack: the 7-question battery may bias toward SURFACE features
  prominent in fabricated findings, escalating benign findings that share
  them while missing subtler fabrications; the falsifier's top-line catch
  rate would miss this bias. Demanded evidence: systematic attribute
  differences between escalated and non-escalated findings beyond truth
  status.
- **Orchestrator verification: CONFIRMED — and already receipted.** The
  T4-b data shows exactly the predicted systematic split: escalated BAD
  items are the invented-interface class (muse flags 0.71–0.80, qwen
  mechanism 0.75, dense false claims 0.70–0.93) while the 4 misses are the
  misstatement class (true-mechanism-wrong-conclusion: hy4p F1 0.40, F5
  0.34, claim-f03 0.60, f04 0.70) — banked as T4-b verdict finding #4
  ("the misses are the misstatement class, by construction") plus the
  field-loading analysis (incomplete 8/14 vs hallucinated 3/14). Hermes
  independently derived the tavern's own sharpest cascade finding from the
  120-word brief alone. EARNED: the outside-the-box short-opinion seat.

### Inkling-Small — attacked Experiment C (entity alignment)

- Delivery: first call finish=LENGTH at 2,000 max_tokens — a thinking model
  that burned 2,006 reasoning tokens with ZERO visible content.
  **Amendment law applied** (one declared re-run at 8,000): 10,757 ms,
  2,816 reasoning + 337 visible tokens, $0.003858, finish=stop. Total
  opinion cost $0.006519 (both rows sealed).
- The attack: **registry-reconciliation key circularity** — the sealed
  registry reconciliation used path-equality as its matching key, so a
  mechanical rule that clones that key scores 100% tautologically on the
  replay; the battery is punished for detecting semantic identity across
  renamed entities; the 3 "wrong" merges may be true positives the
  registry's own matching failure mislabeled. Demanded evidence: the
  orphan/exclusion log, the 3 merged pairs' underlying entity markers, and
  whether the 43 replay pairs are path-identical by construction.
- **Orchestrator verification: UPHELD as to part 1's reasoning.**
  Re-derived from the sealed pairs: 29/29 same-entity pairs carry
  byte-identical paths, ZERO alias cases exist — the ABV clause's "100% vs
  97.7%" is tautological on this corpus and cannot test semantic identity.
  The T4-c verdict (NOT-YET) SURVIVES on the part-2 wrong-merge clause
  (adjudication-grounded, not path-keyed), but its reasoning is corrected
  — filed append-only in situations/entity_alignment/verdict.md. Inkling's
  stronger form ("the 3 merges are true positives") is not upheld (wrong
  registry for part 2), but its weak form was already receipted as the
  cluster-boundary caveat. **A day-one member materially corrected a
  sealed verdict's reasoning.** EARNED: the deep-attack seat — budget
  thinking models at 4× (8,000 tokens for a 250-word opinion).

## Seating decision (both earn candidacy rows in MODEL-LEARNINGS)

- **Hermes-3-405B**: outside-the-box short opinions, attack consults on
  experiment designs. $0.0007/opinion, ~9 s, reliable contract. The
  cache-discount trio keeps the drafting work; Hermes is the design-attack
  second opinion next to Seed-2.0-mini.
- **Inkling-Small**: deep attacks where reasoning depth pays; the
  circularity find priced its seat in one call. ALWAYS budget ≥ 4× the
  expected visible output (reasoning tokens are the hidden cost); treat
  finish=length with empty content as the thinking-budget failure signature.
- Neither displaces an earned seat; the tavern grows to 10 seats (8
  DeepInfra originals + 2 new members, Ling still unseatable at current
  budgets).

## Budget

- Canary: $0.000118 + $0.000212 = $0.000330
- Opinions: Hermes $0.000742 + Inkling $0.002609 (failed) + $0.003858
  (amendment) = $0.007209
- **Total: $0.007539** of the $0.05 new-members ceiling.
