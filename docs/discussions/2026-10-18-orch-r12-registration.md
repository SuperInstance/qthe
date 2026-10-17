# ORCH R12 — registration (pre-run, pricing-first)

> The round record BEFORE the round: what runs, what it costs, what would
> falsify it. Git history is the witness. This executes the three moves
> registered at R11 close-out
> (`docs/discussions/2026-10-18-orch-r10-r11-report.md`): the
> citation-check grounding loop, E-Q17 provenance-correct wormhole at
> scale, and Jev standing triage for r12+ — under the founder's r12
> mandate: subagent-executed lanes, DeepInfra models chosen by the lanes
> for creative JEV playground work, a standing novel-findings register,
> and model behavior (wait times, budget sizes) documented always.

## The state we start from (verified this session)

- `main` @ 2d8bc59, public and clean: 16 chains + 2 content tips ALL
  CLEAN (`verify_all_chains`), gate PG1–PG6 PASS at 20-claim/16-chain
  coverage, falsification budget 7 nulls / 9 caught defects / zero
  silent failures.
- Credentials re-verified live this session: GitHub PAT (ls-remote ok),
  DeepInfra (models list: 181 live; chat completion 200 in 2.2 s with
  `usage.prompt_tokens_details.cached_tokens` +
  `cache_write_tokens` exposed — the cache telemetry the economics
  files price), TypeSafe docs fetched; `jev_judge.py` canary pattern
  unchanged and ready.
- Key rotation receipted: the founder supplied a NEW DeepInfra key this
  session, superseding the R10/R11 key. Stored outside the repo
  (orchestra secrets, mode 600), exactly as `.env.local` was before the
  reset: never committed, never printed, never logged. The minimax key
  stays retired (founder direction, pre-R10; zero minimax calls since,
  none planned).

## Lane T3-a — the citation-check killer experiment (grounds the judge)

The research round's #1 adopt-next
(`docs/research/JEV-COOKBOOK-PATTERNS.md` §8.1), run as pre-registered.
This is also the round's main typesafe.ai playground vehicle: the lane
is instructed to spend part of its Jev budget probing API edges it
meets (batching limits, confidence/noul semantics, repeat stability)
and logging novel findings to the register below.

- **Stimuli:** ~30 claims about this repository — ~20 TRUE (sampled
  across the sealed record: numbers, chain tips, verdicts, each with its
  source file named), the exact planted 4/4 artifact (Qwen's r10
  invented cache-eviction mechanism — the claim Jev rated 4/4
  verified_new against repo-truth 0/4), and ~6 deliberate fabrications,
  one per class: sha-not-in-repo, row-id-out-of-range,
  number-not-in-output-JSON, invented-file, inverted-verdict,
  wrong-metric-unit. Distractors allowed: plausible-unverifiable.
- **Ground truth:** written and sha-pinned BEFORE any judgment call;
  every sealed arm row carries `claims_sha` + `ground_truth_sha`. The
  orchestrator re-verifies ground truth against the repo before any
  verdict counts (the load-bearing wall; the R10 law).
- **Arm A (status quo):** briefing-only Jev triage — the `jev_judge.py`
  pattern (batched parallel questions, one call per repeat, state = the
  r10-style corpus briefing the judge already saw).
- **Arm B (candidate):** code-grounded citation loop — mechanical pass
  first (string/sha/number match against repo files, in code), then one
  Choice question over the located section only; confidence < 0.8
  routes to human-flag instead of a verdict.
- **Repeats:** 3 per arm. Piggybacked telemetry (one spend, two
  learnings): per-question mean/std/flip-count — the §8.4
  self-consistency learning rides the same calls.
- **Metric:** fabrication-detection rate on the 7 false claims, per arm;
  true-claim false-flag rate; per-question stability.
- **Falsifier (pre-registered):** arm B ≤ arm A on planted fabrications,
  OR arm B beats A only by re-labeling true claims as suspicious
  (true-flag rate < 0.80) → the loop's cost is not earned; the
  grounding law stays a human-review rule instead of a pipeline.
- **Deliverables:** `situations/grounding_loop/` (claims + ground truth
  + arm scripts + sealed rows + verdict.md). No new stone chain (the
  tavern's situation ledgers carry it, AS-SAID).

## Lane T3-b — E-Q17: provenance-correct wormhole at scale

hy4's r10 proposal (read its exact wording from the sealed
`arena_rows_r10.jsonl` hy4p row and cite it in the pre-registration),
priced against HIERARCHICAL-WORMHOLES' second-consumer trigger
(`docs/HIERARCHICAL-WORMHOLES.md`: the build trigger is a second live
consumer needing provenance under load). E-Q16 already sealed
locality + contention at scale; E-Q17's new ground is PROVENANCE at
scale — who delivered, not how much.

- **Design (frozen here):** grid ladder 64×64 / 128×128 / 256×256,
  fixed flat 64-slot table, the E-Q14 twin-delivery task at matched
  geometry. Arms per scale: clean (0 polluters) + pollution at
  E-Q14-matched area density + a fixed-256-polluters arm (separates
  density from count).
- **Endpoints:** provenance fraction (E-Q14's metric, recomputed the
  E-Q14 way) per arm per scale; delivery counts; table telemetry
  (occupancy, writes/slot).
- **Floors (frozen before any run):** delivery floor 100% per arm
  (E-Q14 sealed delivery at ceiling; if delivery ever breaks, that is
  the finding, not a failure). Provenance floor 0.90 at 64×64 clean
  (E-Q14 sealed pfMed 0.9431 at zero polluters).
- **Primary null (pre-registered):** H0 — provenance is scale-inert:
  |pf(256×256) − pf(64×64)| ≤ 0.02 on the clean arm. If
  pf(256×256) < pf(64×64) − 0.05 on the clean or density-matched arm,
  the hierarchical trigger FIRES (H1 registered for build). Between
  the two bands: measured, documented, no build — the judgment call
  gets written down either way.
- **Model consult (the founder's creative mandate):** before sealing,
  the lane picks ONE DeepInfra seat to attack the pre-registration
  (design attack, not audit — the Seed briefing law from MODEL-LEARNINGS
  r11) and prices what it says; every attack either changes the design
  (receipted) or is refuted (receipted).
- **House ritual (all of it):**
  `experiments/pre_registration_e_q17.json` (sha printed) → run →
  `experiments/outputs/e_q17_results.json` + tip →
  `receipts/e_q17_chain.jsonl` via appendAndVerify →
  **chain registered in `scripts/chain_registry.mjs` in the SAME
  commit** (seal-time registration law) → curated claim added to
  `scripts/verdict_recompute.mjs` (coverage law) →
  falsification_budget + emit_fleet_seeds + build_dashboard
  regenerated → `probe_gate` re-sealed PG1–PG6. The lane does NOT
  push; the orchestrator verifies then pushes.

## Lane T3-c — Jev standing triage for r12+ (runs after a/b)

`situations/jev_triage.py`: one command that takes any round's sealed
rows, runs the batched Jev judgment (the jev_judge pattern, now
parameterized by round file), and emits the adjudication artifact
beside it (repo-verified outcomes, the `adjudications_r10.json`
pattern, automated). Whether arm B's grounding loop is wired in as the
verdict layer depends on T3-a's verdict — the standing tool inherits
whichever arm earned it. MODEL-LEARNINGS gets the operating law line.

## The playground register (new, standing)

`docs/research/TYPESAFE-PLAYGROUND.md` — the living register of novel
typesafe.ai API findings from playground work, LAYER-tagged the house
way: L0 = documented-and-reproduced, L1 = mechanism-reproducible
observation, L2 = practical/economics claim. Every lane appends; the
orchestrator verifies before entries count. Seeded at registration
with the session's re-verification facts.

## Prices and discipline

- Round ceiling **$0.15** (Jev: batched, ~230 ms/call, sub-cent;
  DeepInfra consults: $0.0012–$0.016/call per the r10/r11 tables).
- House laws carried by every lane: AS-SAID sealing (verbatim
  content_raw, declared parse_method), append+flush rows, resume by
  call_id, exponential backoff, fail-closed on missing key, foreground
  execution only (the reaper lesson), no `.format()` on
  JSON-bearing prompts (defect #9 — `.replace()` only), keys never
  printed/committed, worklog entries appended by the orchestrator from
  lane fragments (the ORCH-D concurrent-append class, closed).
- Verification: nothing a lane produces counts until the orchestrator
  re-derives it from the repo — the R10 law, unchanged.

## What would make this round a null

- T3-a: arm B fails its falsifier → the loop is not earned; the
  finding is the price of the caution (a receipted null, banked).
- T3-b: H0 holds everywhere → provenance is scale-inert; the
  hierarchical trigger does NOT fire; the boundary map's pending row
  closes with a measured answer instead of a blank.
- Both nulls are publishable learnings. The budget pays either way.
