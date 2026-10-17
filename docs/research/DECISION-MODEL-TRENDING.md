# DECISION-MODEL-TRENDING — what the outside world is doing (2025–2026), surveyed for the qthe fleet

> Research artifact, Task 2-a, companion to `docs/research/JEV-COOKBOOK-PATTERNS.md`.
> This **complements** `docs/RESEARCH-DECISION-MODELS.md` (which already carries the
> JEPA family table, the LeCun–Xing debate, and summary-level cookbook patterns): here
> everything is re-anchored to primary sources actually fetched this pass — the
> typesafe.ai blog and docs, arXiv abstract pages, the awesome-jepa registry — with
> dates and, where relevant, what changed since the prior note. The house law travels
> unchanged: **a briefing-only judge is first-pass triage; verification against the
> repository is the load-bearing wall** (fleet receipt: an invented mechanism rated
> 4/4 verified-new).

## Part I — the Jev / System One ecosystem (typesafe.ai)

### 1.1 The launch claims, from the primary source

https://typesafe.ai/blog/introducing-system-one-models-and-jev (Sep 15, 2026, Diogo
Almeida). Fetched in full. The claims that matter to us:

- **New class, new training objective:** "System One Models … fast, structured
  decisions that software can use directly," trained with **RLCD — Reinforcement
  Learning for Calibrated Decisions** (vs RLHF/RLVR), i.e., optimized for "answers
  with epistemically honest probabilities."
- **Economics:** input **$0.042/MTok, output tokens free** ("too cheap to meter");
  end-to-end **70–500 ms**; "40x–200x faster for the same levels of frontier
  intelligence for System One shaped queries." The home-page workflow-eval numbers —
  **193.6× faster, 444.6× cheaper** — come from a new eval style: every model gets
  the *same compute graph in code*, and predictions are scored against "the average
  of the smartest models" (GPT-6 Astra and Fable 5.1 as reference). The blog's own
  nuance section concedes the workflows "were made by individuals on our model
  capabilities team, so some bias could exist."
- **The claim we must price carefully:** "While Jev gives up string generation, it's
  optimized for structured outputs and **can't hallucinate**."
  This is true and load-bearing **on the output side** — a closed typed answer space
  cannot contain a string not in the option set. It says **nothing** about the input
  side. A briefing that asserts a nonexistent mechanism produces a *type-correct,
  calibrated* judgment about a fiction. Our 4/4 incident is exactly that residual,
  and the vendor's own jaggedness page names the mechanism ("state is data, and
  `jev-1.13` does not treat it as hostile by default … text that argues for its own
  classification can move the answer" —
  https://docs.typesafe.ai/model-jaggedness/jev-1.13.md). **Outside world prices the
  output guarantee; the input gap is our receipt.**

### 1.2 Model lineage and platform (fetched from docs)

- Models (https://docs.typesafe.ai/models.md): `jev-latest` → **jev-1.13.0**;
  `jev-preview` → **jev-1.14.0**. Aliases move ("if you have tuned confidence
  thresholds against one version, send that version's ID"); every response's `model`
  field reports the versioned ID that answered — the same
  attribute-the-model-from-the-response move our receipts already practice
  (`typesafe@jev-1.13.0`). Long context = 262k tokens behind a
  `TypeSafe-Danger-Zone-Long-Context` header, "slower and less accurate."
- The **jaggedness page** is the most under-cited document in the ecosystem: nine
  documented failure modes (literal reading; unreliable counting; weak numeric
  calibration of Score levels; date/time comparisons; indirection; context rot from
  irrelevant state; adversarial content; contradictory criteria; first-option order
  bias). Any fleet design doc that quotes Jev numbers without quoting this page is
  quoting half the model.
- **Agent skill** (https://docs.typesafe.ai/agent-skill.md): a drop-in skill for
  Claude Code / Codex / skills.sh, published at
  https://github.com/typesafe-ai/skills (SKILL.md at
  https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md). The
  docs' stated motivation: "Coding agents fall into the one question per call habit
  more than people do" — the skill exists mostly to make agents *batch*.
- **Cookbook repo:** the cookbooks ship `json_cache.json` files (e.g.,
  https://github.com/typesafe-ai/typesafe-public-examples/blob/main/cookbooks/basic_memory/json_cache.json)
  so "re-running replays the published numbers instead of calling the API." This is a
  receipt discipline — cache-as-provenance — at demo scale.

### 1.3 What the community is saying (secondary, searched)

- LangChain, "What Is Jev? A Guide … building a harness with Jev" (Sep 17, 2026,
  https://www.langchain.com/blog/building-a-harness-with-jev): reports "up to 200x
  faster inference and 400x lower cost than comparable LLMs," and treats Jev as a
  harness component — classification, routing, gating — not a chat model.
- TrueFoundry (Sep 18, 2026, https://www.truefoundry.com/blog/typesafe-ai-jev):
  "what's verifiable, and what's still a" [claim] — a skeptic-adjacent read.
- Glossary/explainer entries: Sanity (Oct 6, 2026,
  https://www.sanity.io/glossary/jev-typesafe-ai-model — "answers typed questions
  with structured values only, never text"), you.com (Sep 20, 2026). Reddit
  (r/PiCodingAgent): practitioner thread describing "~150ms" decisions. No
  independent benchmark replication found this pass — the 193.6×/444.6× numbers
  remain vendor-self-reported against a vendor-defined workflow eval. That is a gap
  worth naming: **the ecosystem's headline numbers are one lab's receipts.**

### 1.4 Why it matters to us

We are already a customer of the shape (batched typed questions over audit findings).
The trending reading changes three priors: (a) Jev's cost profile makes
**per-field verifier batteries** (SDE-style) affordable at tavern scale — the docs'
entire cascade economics rest on $0.042/MTok with free outputs; (b) version aliasing
is a real maintenance liability for threshold-tuned batteries — pin versioned IDs in
receipts; (c) the platform is converging on the same laws we priced independently
(cache-replay provenance, model attribution, confidence as a routing axis) — which is
external validation of our discipline, and also a warning that their jaggedness list
is the honest frontier of what typed judges can't do.

## Part II — decision-model patterns trending in agent stacks (2025–2026)

1. **Calibrated abstention as a first-class capability.** The strongest signal:
   "Causal evidence that language models use confidence to decide when to abstain"
   (arXiv 2603.22161; Nature Machine Intelligence,
   https://www.nature.com/articles/s42256-026-01293-x, 2026): LLMs apply an implicit
   internal-confidence threshold when abstaining, and steering that confidence moves
   abstention — i.e., abstention is causal, not decorative. Practitioner-side:
   StackOverflow Blog's "confidence layer" series (Oct 7, 2026,
   https://stackoverflow.blog/2026/10/07/part-3-knowing-when-your-agent-doesn-t-know-the-confidence-layer)
   argues for systems that "act on their own only when calibrated confidence is
   high." TypeSafe's noul is the productized version of the same bet. For us: our
   honest-null policy ("cannot determine" not punished — the canary receipt where
   coverage rose 0.90→1.00 after the fix) is the same capability implemented as
   policy; the outside world now has causal evidence it's real.
2. **LLM-as-judge failure taxonomies have consolidated.** Named biases — position,
   verbosity, self-preference, format, calibration drift — with measurement recipes
   (e.g., FutureAGI, May 20, 2026,
   https://futureagi.com/blog/evaluating-llm-judge-bias-mitigation-2026); "judicial
   hallucination" as a term for judge-side fact fabrication and cognitive bias (Nov
   2025, https://doi.org/10.54254/2755-2721/2026.TJ29492). Notably **absent** from
   these taxonomies: the failure we priced — *the judge inherits the briefing's
   ontology and cannot flag an artifact that isn't in its state*. Closest external
   recognition is TypeSafe's own jaggedness note on adversarial state. Gap is ours
   to publish, not just to guard against.
3. **Cascade / verifier-in-the-loop architectures.** The SDE cascade (Part II of the
   cookbook note) is the vendor version; the pattern generalizes as "cheap generator,
   typed verifier, escalate on max-gate" (production writeups: zylos.ai, Apr 10,
   2026, https://zylos.ai/research/2026-04-10-llm-as-judge-production-agent-verification-2026).
   The design canon is converging on: per-field bad-true nouls, max aggregation,
   narrow grounded questions, verifier independent of the generator.
4. **Confidence-gated routing as the standard agent shape.** TypeSafe's
   intent-routing pattern (classify → deterministic code / specialist LLM / human;
   https://docs.typesafe.ai/patterns/intent-routing.md) is appearing across stacks
   as "the judge-router": one cheap typed call decides which resource spends. The
   three-band thresholding (act / confirm / human) with risk-scaled thresholds is the
   de-facto pattern (https://docs.typesafe.ai/confidence.md,
   https://docs.typesafe.ai/patterns/confidence-routing.md — their worked example:
   balance-check at 0.6, transfer-approval > 0.85).
5. **Self-consistency as a measured quantity, not a vote.** The 2025-era "sample k
   times and majority-vote" is turning into "measure the flip rate and route the
   unstable questions to humans" — TypeSafe's two consistency cookbooks publish
   per-question std dev (0.0102 mean) *and* the honest counterexample (an answer
   spanning 0.43–0.53 across repeats, crossing its own threshold). Multi-agent
   deliberation for calibration is the research twin (OpenReview, Yang et al.,
   cited 44×). For us: flip-rate-per-question is exactly the receipt a fleet should
   keep on its judge library.

## Part III — the JEPA family, 2025 → 2026, from primary sources

The prior note's table said H-JEPA was a "design." **It is now a paper with
numbers.** Fetched abstracts (arxiv.org/abs pages) this pass:

| member | primary source | one-paragraph what-it-does | why it matters / doesn't for us |
|---|---|---|---|
| I-JEPA (2023) | arXiv 2301.08243, CVPR 2023; code github.com/facebookresearch/ijepa | The original: predict representations of masked target image blocks from a context block, no hand-crafted augmentations. | Historical anchor; nothing new for us since the prior note. |
| V-JEPA (2024) | arXiv 2404.08471, ICLR 2025; github.com/facebookresearch/jepa | Video representations by predicting masked spatiotemporal features in latent space. | Same. |
| **V-JEPA 2** (2025) | arXiv 2506.09985 (cited ~1010×); blog https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks (Jun 11, 2025); code github.com/facebookresearch/vjepa2 | Action-free JEPA pretrained on **1M+ hours of internet video**; 77.3 top-1 on Something-Something v2, 39.7 recall@5 Epic-Kitchens-100; action-conditioned variant **V-JEPA 2-AC** post-trained on ~62 h of robot trajectories → zero-shot planning, 65–80% pick-and-place in unseen environments. | The marine/edge direction's external twin (per the prior note). What's new from the abstract: the explicit claim that internet-scale *observation* plus a *small* interaction budget yields planning — the exact ratio our ESP32 rendezvous demo bets on, at 8.9 KB. Still no hardware numbers on our side; the gap stands. |
| **V-JEPA 2.1** (2026) | arXiv 2603.14482 (Mur-Labadia et al.); checkpoints in the vjepa2 repo | Dense predictive loss + deep self-supervision + multimodal tokenizers; releases pretrained dense video/image feature checkpoints. | Checkpoints we could *consume* if we ever wanted a learned feature front-end over substrate telemetry. Not on any priced path. |
| **H-JEPA** (Oct 2026) | arXiv 2610.06805 (Zhang, Terver, Rabbat, LeCun, Balestriero) | End-to-end recipe for a **hierarchy of action-conditioned JEPAs**: each level predicts farther ahead *in its own learned latent space*; planning is top-down, each level's predictions become subgoals for the level below; higher levels discard fast unpredictable detail when factors evolve at separated timescales. **Three-level hierarchy: 18% → 73% success on Visual AntMaze.** | The single most relevant external result for `docs/HIERARCHICAL-WORMHOLES.md`: the registered two-level table (level-0 cells / level-1 blocks, second live consumer = build trigger) is the same shape — non-local hierarchy paying for long-horizon behavior. 18→73 is the external prior that hierarchy is where non-local mechanisms pay; it does **not** transfer our burden of proof (H1–H3 stay registered, unrun, priced). |
| **LeJEPA** (2025) | arXiv 2511.08544 (Balestriero & LeCun); code github.com/galilai-group/lejepa; explainer https://www.turingpost.com/p/lejepa | Theory of JEPAs identifying the **isotropic Gaussian** as the optimal embedding distribution; **SIGReg** (Sketched Isotropic Gaussian Regularization) as a heuristics-free anti-collapse objective — no stop-gradients, no teacher-student network, one trade-off hyperparameter, linear time/memory. | Anti-collapse made principled. Our receipted analogue is unchanged (E-Q1 finals pinned at slot 63 — the party line; occupancy cap 64 HELD at every density, E-Q14 family A). What LeJEPA adds for us is the *question*: is there an optimal occupancy distribution for a 64-slot table the way isotropic-Gaussian is optimal for embeddings? We have no theory; we have one held cap. |
| **λ-JEPA** (Sep 2026) | arXiv 2609.35288 | Spectral anti-collapse regularization; central finding worth quoting: "**protecting the projected representation does not necessarily protect the representation people actually use**" — and it swaps the LeJEPA-style loss into the LeVJEPA video pipeline unchanged. | This is the B3 autopsy's shape in one sentence: delivery (the projected thing) survives while provenance (the thing you actually use) dies under load. The JEPA theory world is discovering the projection-vs-use gap mathematically; we measured it mechanically (adjacent-d convoys, slot-63 saturation rail, pollution medians 0.943→1.0 monotone). |
| Causal-JEPA (2026) | arXiv 2602.11389 (Nam et al.) | Object-centric world models via **object-level latent masking** — interventions on object latents. | The "C-JEPA / planning with 1% of latent features" row of the prior note, now with a primary source: tiny-latent control, the model-scale twin of one-byte-per-cell. |
| ACT-JEPA (2025) | arXiv 2501.14622 (Vujinović & Kovačević; IEEE, cited 6×) | Unifies imitation learning and SSL: jointly predict action sequences and latent observation sequences; up to **+40% world-model understanding, +10% task success**. | Action-conditioning is what `demos/agent-coordination.mjs` does manually (per the prior note); no change in our pricing. |
| LeWorldModel (2026) | arXiv 2603.19312 (Maes et al.); code github.com/lucas-maes/le-wm | Stable end-to-end action-conditioned JEPA **from pixels** with a two-term objective using SIGReg. | Evidence the LeJEPA objective composes; nothing for us to run. |
| Stable-worldmodel (2026) | arXiv 2605.21800; github.com/galilai-group/stable-worldmodel | A reproducibility platform for world-model research: data conversion, baselines, planning solvers, controlled eval environments. | Culturally the closest outside project to our falsification-budget discipline — standardized baselines + controlled evaluation. Worth reading before writing any external benchmark claims. |
| HWM (2026) | arXiv 2604.03208 (Zhang et al.) | Hierarchical planning across temporal scales in latent world models; long-horizon zero-shot control with less planning compute. | Second independent datapoint (with H-JEPA) that hierarchy is the 2026 direction. |
| EB-JEPA (2026) | arXiv 2602.03604; github.com/facebookresearch/eb_jepa | A **single-GPU** library/tutorial spanning image representation, video prediction, and action-conditioned JEPA planning. | Lowers the cost of the cheapest killer experiment if we ever want a *learned* comparator against the substrate's algebra — one GPU, tutorial-shaped. |
| Registries | https://github.com/AbdelStark/awesome-jepa (links verified June 2026 per its README); also lockwo/awesome-jepa, AI-in-Transportation-Lab/awesome-jepa, knightnemo/Awesome-World-Models | Curated papers/models/code/datasets/benchmarks for the whole family. | The ecosystem map; use it as the index for any future survey pass. |

**The debate, updated.** arXiv 2507.05169, "Critique of World Model" (Eric Xing,
Mingkai Deng, Jinyu Hou; ~53 citations; v4 current) — fetched abstract: argues from
"hypothetical thinking" in psychology that a world model's primary goal is
*simulating all actionable possibilities for purposeful reasoning*, surveys the design
dimensions (data, representation, architecture, objective, usage), and proposes **GLP
(Generative Latent Prediction)** — multi-layer latent prediction with generative
validation — as the fix for latent prediction's closed-room drift. The 2026
conversation (public LeCun/Xing exchanges around PAN) has hardened into the hybrid
consensus the prior note recorded: learn *when to trust abstraction* and when to
demand re-grounding. **Our contribution to that conversation is mechanical, not
philosophical:** the B3 autopsy is a measured instance of an abstraction (the
content-addressed table) losing contact with its generators (provenance) under load
while the projection (delivery) stayed alive — and the λ-JEPA finding above suggests
the representation-learning world is starting to prove the same theorem in its own
language.

## Part IV — what the outside world knows that we don't (honest gaps, max 5)

1. **Training at scale, and the eval machinery that comes with it.** V-JEPA 2: 1M+
   hours of video, ~1010 citations, released checkpoints. We have zero
   training story and no GPU receipts. Any claim that qthe speaks to world-model
   *research* (as opposed to world-model *engineering*) currently rests on analogy,
   not measurement — the prior note says this and it remains true.
2. **Workflow-eval methodology.** TypeSafe's move — fix the compute graph in code,
   score every model against the average of the strongest models on the same graph —
   is a judge-agnostic benchmark pattern our question library lacks. Our canary
   (20 questions, acc 0.950/coverage 1.00 vs MiniMax-M3 0.920/0.90) is a start, but
   we have no *shared-harness, reference-ensemble* protocol for comparing judges
   across models and versions.
3. **Measured calibration curves for judges.** The outside world runs repeat
   protocols (5×/15×, per-question std dev, flip counts) and causal abstention
   studies. We have one honest-null policy receipt and one 4/4 incident; we have not
   measured *which of our questions are stable* and which cross their own thresholds
   under resampling. Until we run the consistency killer experiment, our judge layer
   is calibrated by policy, not by measurement.
4. **Distribution and developer-experience packaging.** SDKs with typed questions,
   retries, rate-limit handling, cache-replay, playground share links, an agent-skill
   marketplace entry. Our adapter (`situations/jev_judge.py`) is delivered
   key-pending with none of that scaffolding; the JsonCache replay pattern is, bluntly,
   our receipt discipline executed better by someone else — we should copy the
   *cache-as-replayable-receipt* mechanics (hash of state+questions as the cache key)
   into our tooling regardless of vendor.
5. **A theory of collapse.** LeJEPA's isotropic-Gaussian optimality and λ-JEPA's
   spectral analysis give the *why* behind anti-collapse. We have a *what* (occupancy
   caps held; the saturation rail measured) with no theory of the optimal occupancy
   distribution or when a cap will stop being sufficient at other table sizes /
   geometries. This is the most tractable of the five gaps — it is math over a
   64-slot combinatorial object, our home turf.

## Part V — what we know that the outside world hasn't priced

Stated precisely, not as self-congratulation — each item is either receipted in the
fleet's chains or priced in its docs:

1. **Sealed-receipt determinism discipline as infrastructure.** Every experiment is a
   hash-chained append-only stone-v1 row; 13–14 chains verified from disk on demand;
   `replay.mjs` enforces byte-identical re-derivation as the *definition* of sealed
   evidence; the falsification budget carries 7 nulls and 5–6 caught defects
   (including our own seal-script defects — the cimpl verdict-row substring-count
   bug is itself receipted in TECHNICAL-NOTE §5). The trending stack's provenance
   ceiling is: model version in the response, plus a JSON cache that replays a
   vendor's demo numbers. Nobody in the Jev/JEPA/agent stack we surveyed seals the
   *causal history* of a judgment or an experiment the way we seal ours. (Precise
   claim: we seal determinism of *substrate experiments*; our judge layer is not yet
   inside that discipline — that's the §IV.3 gap, and the two statements together are
   the honest position.)
2. **Honest-null culture with a budget line for it.** Nulls are registered outcomes
   with receipts (E-Q15's "win-rate 0.00, median delta −6"), dead claims stay dead in
   CLAIM-VERDICTS (C3/C4/C5 DIES, priced), and pending is never extrapolated (E-Q17).
   The outside world's public artifacts are win-curated by construction — every
   cookbook number ships with a cache that replays the *good* run. We publish the
   failure ledger as a first-class artifact; that asymmetry is real and unpriced
   outside.
3. **The grounding-gap law for typed judges.** The ecosystem markets "can't
   hallucinate" (output-side, true) and documents "state is not hostile by default"
   (input-side, buried in a jaggedness page); the LLM-judge bias taxonomies name five
   biases and miss this one. We hold the priced version: a briefing-only judge rated
   an invented mechanism 4/4 verified-new; therefore triage-then-verify, with
   verification against the repository as the load-bearing wall. This is publishable
   knowledge — the moment anyone runs typed judges over natural-language briefings
   about codebases, they hit our receipt.
4. **Cache-gamed multi-seat verification economics.** The tavern runs 8 seats on
   DeepInfra with cache-discount-aware role assignment (the r10 economics table: the
   50×-cache-discount seat is the drafting seat; the 2.501/1M-output seat is the
   adjudicator) and sealed verbatim provenance per guest output. No trending doc we
   fetched prices *verification topology as a function of cache pricing* — it is
   either single-model or fixed-ensemble in everything we read.
5. **Determinism of the judged artifact as a categorical advantage.** Outside judges
   evaluate generated text that cannot be re-derived; every artifact our judges
   audit is byte-replayable by construction (that is what the chains guarantee). A
   wrong judgment about a qthe experiment is *mechanically falsifiable* — re-run the
   arm, diff the plane hashes — which converts judge errors from an epistemics
   problem into a receipts problem. The citation-check and pre-parsed-extraction
   cookbook patterns (Part 6 of the companion note) are the industry *approaching*
   this from the text side; we start from the side where the source of truth is
   already exact.

## Status

- Primary sources fetched this pass: typesafe.ai launch blog (full text),
  docs.typesafe.ai (llms.txt index, cookbooks landing + all 20 cookbook pages,
  primitives + 5 subpages, api.md, confidence.md, models.md, agent-skill.md,
  jaggedness/jev-1.13.md, 4 patterns pages); arXiv abstract pages for 2506.09985,
  2507.05169, 2501.14622, 2511.08544, 2610.06805; the AbdelStark/awesome-jepa README
  (raw). Secondary sources (LangChain, TrueFoundry, Sanity, you.com, VentureBeat,
  StackOverflow Blog, FutureAGI, zylos, Nature MI listing) located via web search and
  cited as secondary.
- No API keys used; no repo files modified. Deliverables from this task:
  `docs/research/JEV-COOKBOOK-PATTERNS.md` and this file.
