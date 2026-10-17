# RESEARCH — decision models & JEPA: what the outside world is doing, and where it touches qthe

> Second-pass orchestration (ORCH-R10). The founder's mandate: study what
> trending projects and papers are doing with decision models (Jev/System One
> class) and JEPA-family world models; study the TypeSafe cookbooks for
> patterns we can harness **in our applications** and **in our building of
> them**. This note maps that landscape onto qthe's *priced* frontier. It
> claims nothing for qthe that is not already receipted; analogies are named
> as analogies, and every "we could" carries its cheapest killer experiment.

## Part I — the JEPA family, 2023 → 2026

JEPA's core move: **predict representations, not pixels**. An encoder maps
observations to embeddings; a predictor predicts the *embedding* of a
masked/future part; anti-collapse mechanisms keep the latent space honest.
The family timeline (sources: Meta AI I-JEPA/V-JEPA-2 releases, turingpost
JEPA survey, awesome-jepa registry, arXiv 2501.14622):

| member | year | one line | why it matters to us |
|---|---|---|---|
| I-JEPA | 2023 | masked-image embedding prediction; SOTA low-shot with 12 labels/class | the original "abstract, don't reconstruct" proof |
| MC-JEPA | 2023 | motion + content disentangled in one encoder | two channels, one carrier — see A3 |
| V-JEPA / V-JEPA-2 | 2024/2025 | video world model; **zero-shot robot control** after 62 h of Droid fine-tuning; ~80% pick-and-place | planning without task-specific training — the marine/edge direction's external twin |
| H-JEPA | design | **hierarchy of predictors at different abstraction levels / time scales**; high level finds abstract subgoals, low levels concretize | external validation of `docs/HIERARCHICAL-WORMHOLES.md`'s two-level table and the FRONTIER-DECISION's hierarchy-first pricing |
| ACT-JEPA | 2025-26 | action-conditioned world model; up to **+40% world-model understanding, +10% task success** | action-conditioning is what `demos/agent-coordination.mjs` does manually |
| C-JEPA | 2026 | object-level latent interventions; planning with **1% of latent features** | tiny-latent control = the one-byte-per-cell bet, at model scale |
| LeJEPA | 2026 | simplified anti-collapse objective, theoretically grounded | collapse is a *priced* failure mode here too (see below) |

**The live debate.** LeCun: predicting pixels wastes capacity on
unpredictable detail — abstract or corrupt your representations. Xing (GLP /
PAN, arXiv 2507.05169): latent prediction without a generative validator is
"meditation in a closed room" — elegant, internally consistent, losing
contact with reality. The 2026 consensus direction is hybrid: learn *when to
trust abstraction* and when to demand re-grounding.

## Part II — Jev / System One (typesafe.ai), receipted from live use

A typed decision model served as an API. Primitives: **Choice** (closed-set,
full probability vector), **Score** (calibrated continuous, levels),
**Noul** (P(yes) ∈ [0,1] — uncertainty as a first-class value; "noul" ≈ the
abstention of a probability). Confidence ships with every answer; the
served model version is attributed *from the response* (fleet receipts:
`typesafe@jev-1.13.0`).

Live receipts from the sibling thread (question-library lane, 2026-10):

- 20-question canary: **acc 0.950, coverage 1.00, 19 CALIBRATED / 1
  UNRELIABLE**, critical family 7/7 — vs MiniMax-M3 at answered-acc 0.920,
  coverage 0.90 (after the honest-null policy fix that stopped punishing
  "cannot determine").
- The one deterministic miss: a mixed-evidence posterior question answered
  CALIBRATED at p=0.64 against a 0.90 threshold — it read the posterior and
  missed the comparison. A genuine discriminator question, kept.
- Ideation rounds: Jev *scoring* another model's proposals works well
  (novelty p ≥ 0.93); Jev *generating* from thin scaffolds hallucinated
  0/9 until grounded on the real API surface (harness defect, receipted).

**The cookbook patterns worth harnessing** (docs.typesafe.ai/cookbooks, 18
recipes; the four that matter to this fleet):

1. **Parallel questions** — batch N questions into one call: **12.2×
   cheaper, 10.0× faster, zero answer drift** (GDPR 13-question briefing).
   Directly applicable to arena judging: score all 8 auditors' findings in
   one batched Jev call instead of 40+ serial ones.
2. **SDE cascade** (mini → verify → reasoning) — draft cheap, verify typed,
   escalate only on disagreement. Maps to the tavern: MiMo/Seed seats draft,
   Jev verifies, Hy4/Nemotron adjudicate only what disagrees.
3. **Self-consistency (choices/nouls)** — repeat uncertain decisions, route
   by noul to review. Maps to audit verification: findings that Jev scores
   with high noul go to the human founder, not auto-triaged.
4. **Simple memory system** — Jev decides what is worth remembering. Maps
   to the knowledge-map / fleet-seeds triage problem: which experiment
   outcomes deserve a doc pointer.

## Part III — where the outside world touches qthe's priced frontier

1. **H-JEPA ↔ hierarchical wormholes.** H-JEPA's pitch — predictors at
   multiple abstraction levels, high levels emit subgoals — is the same
   shape as the registered two-level table design (level-0 slots carry
   cells, level-1 slots carry *blocks*; the second live consumer is the
   build trigger). External trend raises the prior that hierarchy is where
   non-local mechanisms pay; it does **not** transfer qthe's burden of
   proof. H1–H3 stay registered, unrun, priced as the next claim.
2. **The GLP critique ↔ the E-Q14 B3 autopsy.** The sharpest connection in
   this note. Xing's objection to pure latent prediction — it drifts from
   its generators — is *exactly* what the B3 autopsy pinned mechanically:
   a content-addressed (not identity-addressed) wormhole table compresses
   provenance under load; adjacent-d convoys and the slot-63 saturation
   rail let delivery survive while provenance dies. qthe measured the
   closed-room failure mode before the debate made it fashionable. The
   boundary map already prices it: DELIVERY congestion-robust, PROVENANCE
   congestion-fragile.
3. **Anti-collapse ↔ the saturation rail.** JEPA needs variance
   regularization or embeddings degenerate to constants; qthe's twin table
   has the receipted analogue — E-Q1's finals pinned at slot 63
   (finalsMin = finalsMax = 63), the "party line" where every Abstain
   converges on one slot and resonance information dies. LeJEPA's
   anti-collapse objective is the trained-world's version of what an
   injector-repair rule (C5′) or a per-slot occupancy cap would be here.
   Cheap killer if we ever claim "the table resists collapse": it doesn't;
   occupancy caps do (E-Q14 family A: cap 64 HELD at every density).
4. **V-JEPA-2 robotics ↔ marine/edge.** Zero-shot planning after tiny
   fine-tune is the external twin of the ESP32 multi-node rendezvous demo
   (agreement tick 61, OFF arm never). Both bet that non-local structure
   beats broadcast for coordination; only one of them runs on 8.9 KB.
   The honest gap stands: our hardware numbers are pending.
5. **Noul ↔ the imaginary channel.** Jev's noul (P(yes) as a first-class
   uncertain value) and qthe's im-mass (uncertainty gating, per
   FRONTIER-DECISION: a **sign gate, not a softmax substitute**) are the
   same instinct at two layers: uncertainty must be representable, not
   rounded away. This is the bridge for Part IV's application pattern.

## Part IV — harnessing both, in applications and in building

**In applications (qthe-side):**
- *Jev-gated injector* (candidate demo, not yet built): the confidence
  cascade currently thresholds im-mass in code. A Jev layer would turn
  "inject / abstain / route-to-review" into a typed Choice over the
  cascade's own telemetry, with noul deciding the review band. Killer
  experiment: paired arms, code-threshold vs Jev-threshold, same seeded
  damage scenarios, floor on agreement + a cost column. If Jev agrees with
  the code threshold ≥ 95% it adds cost without judgment — that null is
  the point of running it.
- *Arena judging* (this round's follow-up): batched Jev scoring of audit
  findings (parallel-questions pattern), self-consistency on high-noul
  findings before the orchestrator commits to a fix.

**In building (process-side):**
- *SDE cascade for the tavern*: cheap seats draft situations/levers, Jev
  verifies schema + novelty, expensive seats only see survivors. Priced
  against the r10 economics table (MiMo 50× cache discount makes it the
  drafting seat; Hy4 at 2.501/1M output is the adjudicator, not the
  draftsman).
- *Memory system for the corpus*: 16 stone chains, 387 rows — which verdicts
  deserve KNOWLEDGE-MAP pointers is currently a human call; a Jev filter
  with noul-routed review would make it a priced call.

**Blocker, priced not hidden:** the TypeSafe API key left the workspace in
the reset (round-9 receipts show the same fail-closed law for the DeepSeek
key). The adapter below is delivered key-pending, exactly like the ESP32
demo: code here, honest gap named, one env var from live.

## Part V — what this note does NOT claim

qthe is not a JEPA: it is not trained, it does not encode-then-predict, it
is deterministic algebra with a compile-time non-local table. The mapping
above is architectural analogy priced where a killer experiment exists and
labeled as analogy where it does not. The house law travels unchanged:
trends raise priors; only sealed paired arms move verdicts.

## Status

- DeepInfra arena: **live** (8 seats, this round).
- TypeSafe/Jev: adapter `situations/jev_judge.py` delivered fail-closed,
  awaiting `TYPESAFE_API_KEY` in the environment (never committed).
- This note: fleet-facing; the external-facing artifact remains
  `docs/TECHNICAL-NOTE.md`.
