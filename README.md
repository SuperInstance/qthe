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
- `experiments/` — E-Q1..E-Q20 priced claims (all nine LAYER 2 claims CLOSED: C1 LIVES · C2 LIVES · C3/C4/C5 DIED honestly · C5′ STANDS · C9 hierarchical-folded-table DIED with prejudice · C10 docket-arbitration DIED on H1 with the flood-cap surviving · C11 construction-provenance DIED on H2 with the interference autopsy — `docs/CLAIM-VERDICTS.md`)
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
gate-pinned LAYER 0 suite, the 38/38 chain auditor, the 29-claim probe gate,
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

## The live round (r16 — deployed)

The Cloudflare token arrived and the r15 design is now a **running service**
(worker: `https://qthe-cell.casey-digennaro.workers.dev`, pages:
`https://qthe-demo.pages.dev`; re-run the battery with
`bash cloudflare/live_checks.sh` — fail-closed):

- **The determinism law is now true over HTTP.** A Durable Object per field
  (single-threaded per id → ticks exactly-once, in order): two independently
  created DOs at seed 33001/50 ticks produce the identical state hash; the
  in-DO replay from the stored seed agrees; the hash is stable across
  save/load. Kernel vendored byte-identical (`cloudflare/PROVENANCE.txt`).
- **C6/C7/C8, honestly split**: the old C7 (DO-serial determinism at the
  edge) **EARNED by measurement**; the R2 receipt chains **EARNED**
  (13/13 sealed chains, fetched bytes sha256-identical); the Vectorize twin
  sidecar **LIVE as infrastructure** (exact lookups, similarity 1.0, 64/64
  census — convergence is eventual, ~10–20 s, DO authoritative) with its
  original pricing claim still OPEN; the Pages mirror **LIVE** (static
  form) with the fan-out claim still OPEN — [docs/CLAIM-VERDICTS.md](docs/CLAIM-VERDICTS.md).
- **The falsifier law, pointed at the deploy itself**: two live-check
  errata found before any claim was written (the state hash briefly
  included non-persisted telemetry; the receipt route briefly matched only
  single-segment keys) — both fixed, receipted in-code; two ops laws banked
  (the propagation-window law: never trust a post-deploy curl until a build
  marker confirms the new code; the local-first wrangler law: `--remote` or
  it didn't happen).
- **Three more creative works** in the fleet's totem forest, three genres
  maximally distant from the r15 pair, all bench-reviewed AS-SAID with an
  amendment log:
  [E22 — the smallest working animal](https://github.com/SuperInstance/AI-Writings/blob/main/SIT-COM_THE_WORKING_ANIMALS/E22_THE_SMALLEST_WORKING_ANIMAL.md)
  (the working animals hire a 249-line cell with four states),
  [four seats at the tavern](https://github.com/SuperInstance/AI-Writings/blob/main/MODEL_PORTRAITS/four-seats-at-the-tavern.md)
  (this bench, drawn only from receipts), and
  [the-ternary-crew shanty](https://github.com/SuperInstance/AI-Writings/tree/main/radio-theater/compass-head-radio-hour/the-ternary-crew)
  (*heave the claim, boys* — the round cycle as a hauling song).
  Round spend: ~$0.004 (3 opinion calls), all other lanes $0 (free tier).

## The pricing round (r17 — C6 dies, the beat lives)

- **The old C6 claim is now PRICED — it DIES below chance.**
  "Cross-substrate slot-histogram similarity predicts useful twin
  overlap," run live against a dedicated Vectorize index under a
  pre-registered design (+ one receipted amendment): M1 precision@5
  0.053 (chance ≈ 0.17), M2 Spearman −0.16, M3 sanity 30/30. Mechanism:
  L2-normalization discards the resonance *mass* that drives behavioral
  overlap and keeps the *shape* behavior ignores
  (`cloudflare/outputs/e_c6_histogram_overlap.json`). Two findings kept:
  a fresh Vectorize index can need >20 s before first queries (settle 45 s
  + blocking sanity gate now), and **the 64-slot table saturates after
  ONE tick** on random substrates — binary slot occupancy is degenerate
  as an overlap signal, a kernel fact worth having.
- **The KV HUD + 5-minute cron beat: EARNED.** The beat advances
  `cron-field` exactly once per fire (measured 0 → 1; HUD sha256 ≡ the
  DO's `/hash`; `GET /hud`), completing the Cloudflare primitive set —
  Workers, DOs, Vectorize, R2, Pages, KV, Cron — all measured, all free
  tier, battery re-runnable (`bash cloudflare/live_checks.sh`).
- **ERRATUM 3** (the beat's `stub.fetch` defaulted to GET; init/tick
  need POST — the first HUD was hollow) found by the P-D check, fixed,
  re-verified. Round spend $0.

## The population-axis round (r18 — C9 dies with prejudice, escalation is free)

- **E-Q18 priced the E-Q17 redirect** — "vary POPULATION at fixed grid,
  where the load actually lives" — and the HIERARCHICAL-WORMHOLES spec's
  own design (8×8+8, folded addressing) **DIES on the axis it was built
  for**: hier provFrac WORSE than flat at every population level (clean
  0.0066 vs 0.0725, 11× worse; zero improving levels). Mechanism: the
  s = d&7 fold serves eight cargo classes per regional slot where the flat
  table is cargo-exact, and under d-drift every writer sweeps the whole
  compressed space — cross-cargo aliasing replaces cross-region anonymity,
  8× denser. The untested survivor: region-splitting WITHOUT folding
  (8×64+8). Full autopsy: `experiments/outputs/e_q18_verdict.md`,
  `docs/CLAIM-VERDICTS.md` §C9, `docs/BOUNDARY-MAP.md` hierarchical row.
- **H2 LIVES (the honest null that wasn't): escalation is free** — 8/8
  delivery and first-delivery median 7 == flat's 7 at every population
  level; the delivery channel is addressing-robust (any resonance fires
  the meter), which is exactly WHY it survives while the WHO channel
  dies. H3a probe: contention ratio exactly 1/8 without drift; under
  drift 0.875 (the fold cancels the split, pre-registered null).
- **Discipline held end-to-end**: pre-registration committed BEFORE any
  run (`3be835e`); Seed-2.0-mini design attack (6 attacks, $0.005254,
  AS-SAID) → 3 amendments pre-run (AM1 instrument-parity, AM2 ladder
  extension, AM3 H2 tightening) + 3 refutations receipted; F0-T
  transcription control 10/10 (byte-identical planes AND event streams);
  F-CAL bit-exact reproduction of E-Q17's sealed rows; determinism
  120/120 configs; chain `receipts/e_q18_chain.jsonl` tip `fe059a2e…`
  (254 links, incl. the receipted double-seal erratum — post-seal crash,
  append-only law honored). Side finding: flatProvDirect == sealed flat pf
  on all 120 flat runs — the E-Q14 log-order recovery is EXACT at 64×64.
- **Creative lane**: the round-18 trio shipped to AI-Writings in three
  maximally-distant genres (a strict-form sestina, Moore-8 assembly
  minutes, a marine area forecast for the torus) — commits `26c6cda` +
  `469cbf9`. Round spend $0.005254 of the $0.01 target.

## The consumer round (r20 — the fourth language, the second live consumer, C10's honest death)

- **crossimpl/rs — the Rust port, byte-exact** (T11-a): the fourth language
  joins the matrix (JS reference · Python L0 · C99 · Rust). 13/13 unit
  tests, float plane 12/12 + fixed plane R8 3/3 + VectorPass 4/4 against
  the sealed fixtures (sha `dd866748…`, regeneration re-proven identical),
  σ **as bits, never libm**, `#![forbid(unsafe_code)]`, zero dependencies.
  Determinism double-run **and** debug-vs-release byte-identical; tampered-
  fixture negative controls all DETECTED. Chain `rs_chain.jsonl` (11 links,
  tip `f3abf8db…`); three new spec ambiguities receipted (A-R1/R2/R3); one
  runner defect found by the debug-vs-release cross-check, correction row
  appended (`crossimpl/rs/REGISTRATION.md`).
- **E-Q19 — the first consumer-driven pricing target, and C10 DIES with the
  richest autopsy in the corpus** (T11-b2): the docket (tiled task
  arbitration on a ticking 64×64 substrate, the REAL kernel every epoch)
  vs the FIFO+static-priority inbox and the nearest-first spatial baseline,
  5 arms × 3 loads × 10 seeds × 2 determinism runs — 150/150 byte-identical.
  **The debounce is timing, not share** (A-static's stable starvation equals
  the heap's EXACTLY: 0.4435); **saturation converts re-boost gaming into
  FIFO penalty** (0.44→0.32 at 0.908 saturation — the re-stamp resets the
  gamer's own aging) **at the price of tail latency** (stable p99 +33%);
  **the flood cap is structural and backlog-bounded** (tiles aligned with
  homes: maxShare@500 0.339 vs the heap's 0.75, eroding to 0.436 as the
  flood physically overflows its region — plane capacity is flood
  insurance); **deferred-task recovery by address is drift-blind** (1
  wormhole claim in 12,000 — the consumer-side WHO-loss, Seed-2.0-mini's
  AM2 prediction confirmed). Scoreboard: 8 claims priced, 3 LIVES / 5
  DIES / 1 STANDS. Chain `e_q19` (19 links, tip `568bfef3…`).
- **The docket is LIVE — the second live consumer** (T11-b): `QtheDocket`
  DO on the running worker (build `r20-docket1`, migration v2), the E-Q19
  tiled law verbatim over HTTP — submit/claim/epoch/log routes, the
  arbitration determinism handle (two independent DOs, seed 1234, 24 tasks
  incl. 4 flippers, 40 epochs → identical hash `77d865d0…`), and the honest
  label traveling with the service: *C10 is DEAD — flood-cap yes, flapping
  starvation no, tail latency the price* (`honest_label` in the init
  response, the landing page links it). P-D battery green; the full live
  battery re-ran green after deploy (ERRATUM 5, cosmetic, found by the
  sweep's own read).
- The frontier note: the 8×64+8 hierarchical survivor's trigger now
  carries E-Q19's warning — its provenance channel is exactly the channel
  AM2 prices as addressing-mismatched under drift.

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

## The quantum-construction round (r21 — C11 dies, the interference autopsy, the certified root is invisible)

The operator's fresh Moth key met a richer engine catalog than the r7 era
(fleet doc `AI-Writings/situations/arch/MOTH-ENGINES.md`, read this round),
and the F0 determinism law confines quantum entropy to **construction time**
— `makeSubstrate`'s seedFn is the entire attack surface. E-Q20 priced the
question the QCA-scrambling literature asks: does construction provenance
survive the tick dynamics?

- **H1 LIVES — certified-quantum BYTES are invisible.** comet-qrng-v1's
  SP 800-90B-certified root (142 conditioned bytes: min-entropy certificate,
  Toeplitz extractor at ε 2⁻⁶⁴, CHSH S = 2.835 with z = 37.9 above the
  classical bound, commit-before-collect pulse chain —
  `experiments/outputs/e_q20_comet_root.json`), SHA-256-counter-expanded
  (the NIST 90B→90A deployment pattern; the E-Q9-DT whitener recipe), is
  statistically indistinguishable from mulberry32 at EVERY checkpoint on
  EVERY metric (A1 leave-one-out 95th-pct floor, 20-plane population).
- **H3 LIVES — the exact quantum blur is INTERFERENCE-SHAPED.** blur-core-v1
  (exact mode, shots omitted — a deterministic quantum operator) on the
  d-field produced a t=0 fingerprint of dW1 12.06 vs floor 0.51, and its
  Moore-8 Moran's I is **NEGATIVE (−0.068)** — unitary interference walks
  alternating structure where a classical smoothing blur is strongly
  positive. A measured quantum-native geometry; the claim auditor
  recomputes it from the sealed root receipt + blur journal.
- **H2 DIES — spatial correlation is a SLOW MODE.** By t=64 the marginals,
  tau fractions and twin rates all washed out to within floor, but Moran's I
  had not equilibrated (A3 0.038 / A3S 0.034 vs floor 0.021, converging
  monotonically): initial spatial correlation outlives t=64, and the
  SHUFFLED control excurses too — the persistence is dynamical, not
  quantum-specific. **Consumer law: burn in T > 64 at 64×64 before trusting
  correlation-statistics, or treat early-tick spatial stats as
  constructor-dependent.** Chain `e_q20` (22 links, tip `a310f37e…`);
  scoreboard now 9 claims, 3 LIVES / 6 DIES / 1 STANDS.
- **The discipline ledger**: Seed-2.0-mini design attack pre-run (6 attacks,
  $0.005 — AM1 byte-splitting law, AM2 population/median sharpening, AM3
  Moore-8-primary instrument, AM4 per-cell rates accepted; A2/A6 refuted
  with receipts); two implementation-time failures BOTH caught fail-closed
  before any data row — the comet raw-budget law (output_bytes is the RAW
  Born-rule budget: 49152 raw bits → 1136 conditioned bits at ε 2⁻⁶⁴) and
  the loadKernel law — fixed as AM5/AM6, the 5 spent blur credits recovered
  by free GET into a replay journal, 10/10 credit cap held.
- **Tools enhanced** (`experiments/moth_client_v2.mjs`, the fleet's laws
  baked in: browser-UA, comet derive-sizing/retry with bell-witness
  passthrough, blurExact shape assertions, qpixl/coinToss/otocEcho
  wrappers; offline fixture selftest 13/13 at zero credits). **Groq seats
  code-delivered** (client + canary + seat-trial in the tavern's AS-SAID
  row schema) and **403-blocked at this seat** — pre-auth WAF, receipted in
  `situations/groq_seats/BLOCKED-SEAT-RECEIPT.md`; the moment a reachable
  seat exists, `qwen/qwen3.8-27b` and `openai/gpt-oss-20b` join the tavern
  with zero code changes.

