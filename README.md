# qthe — Quilt-Ternary Hyper-Embeddings

The 8-bit primitive where data is geometry and control is physics:
6 bits of spatial amplitude, 2 bits of timbre —
**Ground (0), Attract (+1), Repel (−1), Abstain (i, the Looking Glass)**.

Built by the erised fleet from the founder's research corpus. The spec is
priced, not LARPed: algebra facts are exhaustively tested, mechanisms are
determinism-checked, performance claims run as pre-registered paired arms
where an honest null is a crown jewel.

- [`SPEC.md`](./SPEC.md) — the vision, split into Layer 0/1/2 by honesty law
- `qthe.mjs` — the zero-dependency reference kernel (Lanes: core)
- `experiments/` — E-Q1..E-Q17 priced claims (all six LAYER 2 claims CLOSED: C1 LIVES · C2 LIVES · C3/C4/C5 DIED honestly · C5′ STANDS — `docs/CLAIM-VERDICTS.md`)
- `qthe-core/` — the standalone zero-dependency distribution (JS float+fixed, C99 byte-exact, Python L0)
- `index.html` — the A2UI live mirror: pixel = cell, direct buffer-to-canvas

House: stone-v1 receipt chains; determinism or it didn't happen; the tavern
hosts a 10-seat DeepInfra arena with a typed-question judge. 已落地 — live
as we work.

**Verified externally** — [SuperInstance/qthe-verify](https://github.com/SuperInstance/qthe-verify)
(a sibling lane's artifact, also vendored in `fleet-seeds/qthe-verify/`) is an
independent rebuilder of this kernel written from `SPEC.md` alone: its reader
never imports vendor code, replays a 12-case committed corpus (including this
repo's own armor-ring demo geometry), and reproduces the sealed traces
**12/12 byte-identical**. That is our LAYER 1 determinism contract receipted by
a stranger — the doc-only-discipline existence proof for this repo. CI
([`ci.yml`](./.github/workflows/ci.yml)) runs the sabotage controls, the
gate-pinned LAYER 0 suite, the 33/33 chain auditor, the 23-claim probe gate,
and the batched-call guard on every push.

## The audit tavern (r10–r14, priced)

The corpus is audited by a tavern of LLM seats whose every claim is
verified against the repository before it counts — the house law is
**judges draft, the repo decides**:

- **The standing triage layer** (`situations/jev_triage.py`, r12+): seat
  findings → Jev batched triage (severity/actionability) → the EARNED
  grounded citation loop (mechanical anchor checks first — invented files,
  shas, row-ids, CLI flags die at $0 — then one grounded Choice over the
  located section, confidence < 0.8 → human) → an adjudication artifact
  beside every judgment file. The killer experiment that earned the loop:
  fabrication detection 6/7 vs 4/7 briefing-only, true-flag 81.8%, zero
  auto-fabrications (`situations/grounding_loop/verdict.md`).
- **Ten seats, priced** (`situations/MODEL-LEARNINGS.md`): the cache-discount
  workhorses (MiMo-V2.6-Flash, DeepSeek-V4.1-Flash, Hy4-preview), the
  devil's advocate (Seed-2.0-mini, attack-briefed), the adjudicator (Hy4),
  and two r13 members — Hermes-3-405B (outside-the-box design attacks) and
  Inkling-Small (a thinking model whose day-one circularity attack
  corrected a sealed verdict's reasoning; budget thinking models at 4×).
- **The economics rung (r13, three killer experiments, all falsifier-first):**
  parallel-question batching **WINS** (0/30 batch-hostile, 12.36× cost ratio
  at document-dominated states — `situations/batching_falsifier/`); the SDE
  cascade **NOT adopted** (cascade economics are expensive-tier-price-relative;
  against a $0.00034/finding loop the battery is 40% of the budget —
  `situations/sde_cascade/`); entity alignment **priced not-yet** (wrong
  merges on 3/10 known-different pairs; the ABV clause corrected as
  tautological on an alias-free corpus — `situations/entity_alignment/`).
- **The novel-findings register** (`docs/research/TYPESAFE-PLAYGROUND.md`):
  every priced typesafe.ai API discovery, LAYER-tagged with receipts —
  confidence-as-grounding-signal, 96-question batching, the claim-density
  confound, thinking-model budget law, and more.
- **The fleet round (r14):** the account scouted (5,277 repos via quilt-atlas;
  the git.pp fold family; fleet-seeds as the wave-line hub — our lineage's
  predecessor), and qthe paid both ways: **adopted** the fleet's negctl
  doctrine (`scripts/negctl_qthe.mjs` — 28 sabotages found 5 real holes in
  our own verifiers, all closed, closure proven 28/28), the Reader's Fold
  links manifest, and CI-on-birth; **gave** tavern round-13 to the fleet
  ledger, three devil's-advocate-passed seeds, an embassy entry, and two
  gift PRs (gitpp-reading-room #1, jev-semantic #1) —
  `situations/fleet_gifts/GIFTS-LEDGER.md`.
- **The re-price round (r15):** the r13 cascade pointer discharged **with
  prejudice** by measurement — Hy4-preview run as the verify tier on the
  sealed 90-item corpus loses on BOTH axes at 50× the price ($0.61/audit-run,
  57.1% BAD recall, 55.6% false-BAD, vs the battery's 71.4%/30.2% at $0.012
  and the earned loop's 81.8%); the cascade compounds failure modes (42.9%)
  because the battery and the tier miss different items; 2,400 reasoning
  tokens per call never cached (`situations/sde_cascade/reprice_analysis.json`).
  The subject-key cross-exam battery **sealed and ready** — 73 pairs, 146/146
  keys re-derived by concatenation, zero refusals
  (`situations/entity_alignment/cross_exam_battery_v1.json`). The
  Cloudflare deployment design written from the fleet's live patterns,
  token-plug-and-play with a LAYER 2 menu (C6–C8) —
  [docs/CLOUDFLARE-DEPLOYMENT.md](docs/CLOUDFLARE-DEPLOYMENT.md). And the
  line's first creative works committed to the fleet's totem forest:
  [the fourth state](https://github.com/SuperInstance/AI-Writings/blob/main/POETRY/the-fourth-state.md)
  + [the worms turn on](https://github.com/SuperInstance/AI-Writings/blob/main/short-stories/the-worms-turn-on.md).

## Documentation

Wave-69 docs layer (added; nothing above was changed). Route by audience:

- Zero-shot agent entry point: [docs/ONBOARDING.md](docs/ONBOARDING.md)
- End users of the kernel / mirror / experiments: [docs/USER-GUIDE.md](docs/USER-GUIDE.md)
- Developers extending the code: [docs/DEVELOPER-GUIDE.md](docs/DEVELOPER-GUIDE.md)
- Engineers operating / reviewing the system: [docs/ENGINEERING-NOTES.md](docs/ENGINEERING-NOTES.md)
- Executives deciding investment: [docs/CTO-BRIEF.md](docs/CTO-BRIEF.md)
- Index of all deeper knowledge: [docs/KNOWLEDGE-MAP.md](docs/KNOWLEDGE-MAP.md)
- The 10-minute outsider path: [docs/DAY-1.md](docs/DAY-1.md) · all 50 roadmap phases: [docs/PHASES-REPORT.md](docs/PHASES-REPORT.md) · the live scoreboard: [docs/dashboard.html](docs/dashboard.html)
- Round reports (decisions, arguments, prices): [docs/discussions/](docs/discussions/) · the tavern's seat manual: [situations/MODEL-LEARNINGS.md](situations/MODEL-LEARNINGS.md)

<!-- QUILT:LINKS:START — generated from .quilt/links.yml by quilt-links.mjs. Do not edit by hand. -->
## Cross-pollination — the Reader's Fold

*Part of the **qthe** family. Under [Law 6](https://github.com/SuperInstance/jev-quilt), this repo carries no verdicts about its neighbors — only content-addressed pointers you fold under your own weights.*

**Provides** (fold these from here)
- `qthe-kernel` — the 8-bit ternary substrate kernel — [tau:2][d:6] packing, Psi(tau) in {0,+1,-1,i}, Moore-8 tick, zero-dependency ESM (qthe.mjs, 249 lines)
- `wormhole-table` — the compiled 64-slot wormhole table — Abstain cells resonate with non-local twins; the repo's novel mechanism (SPEC.md)
- `three-layer-honesty` — LAYER 0 algebra (exhaustive) / LAYER 1 mechanism (byte-level traces) / LAYER 2 pricing claims C1-C5 (open until bought by experiment)
- `tavern-patterns` — the multi-seat audit tavern — batched-per-guest systemone batteries (12.36x measured), earned mechanical-first verification loops, per-seat hallucination catches (situations/)
- `negctl-harness` — sabotage-restore negative controls for receipt-chain verifiers — 28/28 detected (scripts/negctl_qthe.mjs)

**Consumes** (folded from elsewhere)
- [quilt-stone](https://github.com/SuperInstance/quilt-stone) — stone-v1 receipt chains — the canonical sealChain/verifyChainFile module, read-only via experiments/_stone_link.mjs (never forked)
- [fleet-seeds](https://github.com/SuperInstance/fleet-seeds) — the negctl doctrine (a suite that cannot fail is not evidence) adopted ORCH-R14; the seedbox intake lane; the Tap Tavern ledger that dramatizes this repo's rounds
- [jev-quilt](https://github.com/SuperInstance/jev-quilt) — Law 6 (Reader's Fold) + Law 7 (Reach Bound) — the doctrinal basis of this manifest's shape

**Related** (1-hop siblings — Law 7)
- [qthe-verify](https://github.com/SuperInstance/qthe-verify) — the independent spec-only rebuilder of this kernel — 12/12 cases byte-identical; our LAYER 1 determinism contract receipted by a stranger
- [jev-garden](https://github.com/SuperInstance/jev-garden) — the JEV living-model arc — the tavern's standing live-wiring gap points here
- [MicroMoth-quilt](https://github.com/SuperInstance/MicroMoth-quilt) — the quantum substrate sibling; the marine/edge workload family (docs/MARINE-EDGE-WORKLOAD.md)

<sub>Regenerate: `node quilt-links.mjs` · Fleet map: [FLEET.md](https://github.com/SuperInstance/fleet-seeds/blob/main/FLEET.md)</sub>
<!-- QUILT:LINKS:END -->
