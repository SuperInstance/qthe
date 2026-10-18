# ORCH-R13 REGISTRATION — the economics rung, three killer experiments, two new members

> Pre-run, pricing-first, frozen before any lane spends a token. The three
> moves registered at R12 close-out become lanes. The founder's r13 mandate:
> push often, thorough README/documentation updates, new members to craft
> (Hermes-3-405B and Inkling-Small confirmed live on DeepInfra this session),
> keep the tavern's economics learning per model, always. Round ceiling
> **$0.15**. House laws carried verbatim: AS-SAID, append+flush,
> resume-by-call_id, fail-closed, no `.format()` on JSON-bearing prompts,
> foreground-only (no nohup — the reaper is priced), seal-time chain
> registration, coverage law, judges-draft-the-repo-decides.

## Standing state this round inherits (all verified live this session)

- main @ daa2ef7 pushed (the stranded R12 corpus — 4 commits — was found
  unpushed at round open and pushed FIRST; the worklog's "pushed" claim from
  R12 was wrong for the final two commits, receipted in the ORCH-R13 worklog
  entry).
- PROBE-GATE PASS re-run by the orchestrator at round open: PG1–PG6, 17/17
  chains, 23/23 claims, gate chain 16 links, tip 9631c7c1….
- Credentials: GitHub PAT live (ls-remote), DeepInfra key live (181 models,
  canary 12 tokens), typesafe key live (carried from R12 verification).
- Sealed outcome-labelled corpus for the cascade experiment: r10 = 40
  findings / 7 seats (ground truth `situations/adjudications_r10_grounded.json`),
  r11 = 18 findings / 8 rows (ground truth `situations/arena_r11_verdict.md`
  + orchestrator verification in the R11 close-out), grounding_loop = 32
  claims (ground truth `situations/grounding_loop/ground_truth.json`,
  sha-pinned). **Total 90.** The cookbook spec said "100 real audit
  findings"; the corpus holds 90 with sealed outcomes and fabricating 10 more
  would violate the real-findings law — the amendment is 90, receipted here.

## Lane T4-a — parallel-question batching falsifier (§8.2, effort: hours)

**The claim under test (cookbook §6.3, jev-1.12 numbers):** all-questions-in-
one-call vs one-per-call → 12.2× cheaper, 10.0× faster, "batching adds no
noise" (the two questions that moved, moved the same amount both ways).
Our receipts must carry the measured number, not the doc's (the docs
themselves drift: primitives.md quotes 11.5×/9.6× from an earlier run).

**Design (frozen).**
- Corpus: **10 sealed guest outputs** — all 7 r10 seats + 3 r11 rows
  (mimov2 6, deepseek 5, hy4p 6, nemotron 3, seed 4, musegl 5, qwen 4
  findings; r11: the 4 endorsed seats' turn-1 rows, pick 3 by seeded choice
  — seeded, not cherry-picked: sha of the r11 rows file, first 3 of the
  endorsed list). Findings per guest 2–6, total 35 findings → **105
  questions** (3 per finding: class Choice / actionable Noul / severity
  Score — the standing battery verbatim from `situations/jev_judge.py`).
- State: the guest's findings verbatim + a 1-paragraph judge instruction
  (the compact battery — same questions, same criteria maps, compact state).
  The document-dominated cost ratio is measured separately (below) so the
  drift measurement is not billed at briefing prices.
- **Arm B (batched):** all of one guest's questions in ONE call × 5 repeats
  → 50 calls.
- **Arm S (singles):** one question per call × 5 repeats, on a **stratified
  sample of 30 questions** (10 per question type, sampled across all 10
  guests by seeded draw) → 150 calls. Amendment to the cookbook's
  all-questions protocol, priced honestly: full singles on 105 questions ×
  5 = 525 calls ≈ $0.11 at compact-state prices — inside ceiling but
  wasteful; 30 × 5 gives the same per-question mean/std comparison with 4
  dof per arm. The 12×-style headline ratio is computed on the
  document-dominated probe where it is the honest claim.
- **Document-dominated probe:** 3 guests, full r10-briefing-sized state
  (~13k chars), both ways × 1 repeat each (3 batched + 9 singles = 12 calls)
  → measured cost/latency ratio at our actual traffic shape.
- Total lane calls ≈ 212, est. **$0.030**.

**Metrics (per question, both arms):** noul = p(yes); choice = max
probability; score = score/(levels−1). Mean, std, flip count, and
threshold-crossing span per question per arm.

**FALSIFIER (frozen, verbatim from §8.2):** any question whose batched mean
shifts beyond its own single-call run-to-run noise (|mean_B − mean_S| >
2·std_S, both sides measured) is **batch-hostile** and must be split back
out of any standing battery; if ≥ 20% of sampled questions are
batch-hostile, batching is OUT for the tavern regardless of the savings.
Secondary null: if the measured cost ratio at document-dominated state is
< 5× (an order below the cookbook's 12.2×), the pattern's economics do not
transfer to our state shapes and the claim is downgraded to
state-shape-conditional.

## Lane T4-b — SDE cascade for tavern adjudication (§8.3, effort: days)

**The claim under test (cookbook §4.1):** cheap verifier battery (per-field
Noul, max-gate at FIRE_T 0.7) routes traffic so the expensive tier only sees
escalations; "the cascade frontier sits up-and-left of every single model."
The tavern's missing middle rung: cheap seats draft → **???** → earned loop
adjudicates. The ??? is the battery.

**Design (frozen).**
- Corpus: the **90 sealed outcome-labelled findings** above. Ground truth =
  the already-sealed verdicts (r10 grounded adjudication; r11 verdicts; T3-a
  ground_truth.json). No new ground-truth calls — the comparison layer is
  arithmetic over sealed rows.
- **Arm 1 (all-expensive):** the earned loop run on every finding. For r10
  this EXISTS (`adjudications_r10_grounded.json`, $0.0165 sealed); for r11 +
  grounding claims the outcomes are already sealed by their rounds. Cost =
  the sealed per-finding loop price, recomputed by arithmetic. No new calls.
- **Arm 2 (cascade @ FIRE_T 0.7):** the per-field bad-true battery —
  `unreasonable / hallucinated / off_target / incomplete / format_violation /
  name_desc_mismatch / type_mismatch` + `absence_wrong` for empty findings +
  one ungated `__overall__::judge` — state = the round briefing + the
  finding verbatim (briefing-side only: NO code-side section location —
  that is the expensive tier's job; this is exactly the §0 law applied to
  the routing layer). Batched per guest. **3 repeats** (the honest-null
  protocol: a gate that routes on a number must survive its own noise; T3-a
  priced noul repeat-std ~0.01–0.04 grounded, but this state is ungrounded —
  measure, don't assume). Escalate iff max per-field noul > 0.7 in ANY
  repeat (max gate, "one confident red flag is enough"). Escalations run
  the earned loop; non-escalations pass through with the battery's label.
- **Arm 3 (swept threshold):** recompute the escalation set at FIRE_T ∈
  {0.3, 0.5, 0.7, 0.9} from the SAME sealed battery rows — arithmetic, zero
  new calls.
- Calls: 10 guests × 3 repeats × ~9 nouls/finding-group… battery question
  count = 8 per finding (7 + absence variant where applicable) + 1 overall
  per guest ≈ 300 questions total, batched in 30 calls ≈ **$0.025**.
- **Quality scoring (frozen):** against ground truth — (a) fabrication
  recall (what fraction of ground-truth-fabricated/wrong findings
  escalate), (b) clean-finding pass-through (what fraction of
  ground-truth-true findings stay un-escalated — the no-separation clause),
  (c) wrong-label rate on pass-throughs, (d) total cascade cost vs arm-1
  cost. The pareto point: quality delta vs cost delta at each threshold.

**FALSIFIER (frozen, verbatim from §8.3):** if the cascade's quality at any
threshold sits below the all-expensive arm by more than the cost saving
justifies at our actual seat prices, or if the verifier battery fires on
> 50% of clean findings (no separation), the pattern's pareto claim does
not transfer to our traffic. Quality here = fabrication recall primarily
(the tavern's priced failure mode is the confident fabrication that reaches
a sealed verdict), clean pass-through secondarily.

## Lane T4-c — entity alignment for registry/chain reconciliation (§8.5, effort: a day)

**The claim under test (cookbook §5.3):** Score with three levels that ARE
the decision (different / related-needs-curator / same) + per-field nouls,
numbers compared in code (the ABV rule), "no threshold you had to fit."
**Honest amendment, receipted:** the live instance named in the cookbook
note (fleet-seeds 14/305 vs scanner 13/295 vs the gates chain) was CLOSED
by the ORCH-R10 registry fix — `scripts/chain_registry.mjs` is now the
single source of truth and the human reconciliation it encodes is the
sealed ground truth. The killer experiment therefore runs as a **labelled
replay** (the human reconciliation is known — which makes the comparison
integrity exact, not post-hoc) **plus a live instance** the tavern actually
holds: cross-seat finding alignment.

**Design (frozen).**
- **Part 1 (replay, ground truth = the registry):** reconstruct the three
  pre-fix inventories from the sealed record — (a) what emit_fleet_seeds
  pinned (14 chains / 305 rows — the ORCH-C worklog numbers), (b) what the
  scanner-style glob over `receipts/*_chain.jsonl` counted (13 / 295), (c)
  the registry's 16-chain truth at fix time (17 now; the replay pins the
  fix-time list, receipted). Build every cross-inventory pair involving an
  entity at least one list missed or misnamed + 10 agreeing pairs as
  controls ≈ 40 pairs. One call per pair: Score(differ / related-needs-
  curator / same) + per-field nouls (path, gate, label, rows) — rows
  compared IN CODE (ABV rule). Decision: rounded level; middle → curator
  queue.
- **Part 2 (live, ground truth = the r10/r11 orchestrator verification):**
  30 cross-seat finding pairs from r10's 40 findings — stratified: 10 pairs
  the adjudication knows are the same issue (e.g. the multi-seat LICENSE
  gap), 10 known-different, 10 seeded-random. Same battery. The middle
  level is the cross-examination queue — the tavern application verbatim.
- Calls ≈ 70 × 1 (Score+nouls, compact state) ≈ **$0.010**.

**FALSIFIER (frozen, verbatim from §8.5):** if the battery's decisions
match the human reconciliation on < 80% of pairs, or if the ABV-rule
(numbers in code) catches what the Score misses, then keep it code-only and
price the pattern as not-yet. Part-2 specific: if the battery merges
(=same) any known-different pair, that is the expensive-mistake direction
the cookbook warns about — one wrong merge fails the pattern for
cross-examination use even if the 80% headline holds.

## New members — Hermes-3-405B and Inkling-Small (the founder's r13 ask)

Confirmed live on DeepInfra this session:
`NousResearch/Hermes-3-Llama-3.1-405B`, `thinkingmachines/Inkling-Small`.
Probe protocol (orchestrator-run): canary (tiny, prices latency + contract)
→ ONE short outside-the-box opinion each — the brief: here are the three
R13 killer experiments, attack the one you believe most likely to produce a
FALSE conclusion, name the confound, 2k max_tokens, AS-SAID, repo-verified
before anything counts (the grounding law generalizes to new members on
day one). Budget **$0.05** for both. MODEL-LEARNINGS gets a candidacy row
each (priced: latency, contract, cost, what the opinion was worth after
verification). No seat is earned by canary alone — the r10 law.

## Push protocol (the founder's explicit r13 mandate)

Push at every milestone, not at close-out only: (1) round open — the
stranded R12 corpus [DONE, receipted]; (2) this registration; (3) each lane
as it lands + is verified; (4) close-out with README + MODEL-LEARNINGS +
register promotions. Every push carries its worklog entry.

## Budget summary

| lane | est. | ceiling |
|---|---|---|
| T4-a batching falsifier | $0.030 | $0.05 |
| T4-b SDE cascade | $0.025 | $0.05 |
| T4-c entity alignment | $0.010 | $0.03 |
| new members | $0.030 | $0.05 |
| **round** | **$0.095** | **$0.15** |

Escalation rule: any lane that would exceed its ceiling stops, receipts the
overrun, and re-registers before continuing. No silent spend.
