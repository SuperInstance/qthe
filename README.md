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


## The reachable-seat round (r22 — the geo law, the Actions seat, both Groq seats live, T* > 512)

The operator's dispatch doubled down on Groq ("rapid and cheap models …
in harmony with the other tools like the two typesafe.ai models") with
the Cloudflare token now attached. The r21 seat-block turned out to be
a **geography law, receipted by triangulation**: the sandbox egresses
from Hong Kong (Alibaba AS45102); a Cloudflare Worker at the HKG colo
(authed and unauthed via `/probe/noauth`) drew the same pre-auth 403;
a GitHub Actions runner (Azure US, Des Moines) drew **401 `Invalid API
Key`** — the auth layer REACHED. Groq's edge door-refuses HK-region
traffic before ever evaluating the key. Two standing routes now exist:
**the Actions seat** (`.github/workflows/groq-seat.yml` — the tavern
scripts run from Azure US, rows ride artifacts home; the house route)
and the **CF relay** (`groq-relay.casey-digennaro.workers.dev` —
server-side key custody, fail-closed relay token, Smart Placement
pending relocation; geo-pending, receipted).

- **Both Groq seats EARNED (the new-member law; tavern → 12 seats).**
  Canary live (qwen 165 ms / gpt-oss 339 ms, $0.00006 the pair); the
  design-attack trial on the E-Q20b registration found the same critical
  family from two angles — qwen from the order-statistic structure (the
  n=20 95th-pct floor IS the 19th order statistic), gpt-oss from the
  metric-conflation structure ("Moran's I distance") — plus the
  per-model defaults law (gpt-oss 400s on `reasoning_effort=default`)
  and the reasoning-budget law (2048 completion tokens all burned on
  reasoning, empty answer → 6144 headroom). AS-SAID:
  `situations/groq_seats/` (SEATS-EARNED-r22.md).
- **E-Q20b — the burn-in ladder (zero credits) extended the slow-mode
  law: T* > 512.** The F0' gate reproduced E-Q20's sealed values
  byte-exactly (30/30 hashes, 32/32 floor, 64/64 cross-arm medians),
  then laddered to t=512: H1b DIES (no sticky sub-floor crossing — the
  honest null fired as registered, P5 HIT), H2b DIES (re-excitations at
  t=16/32/64 after first touch at t=8). **The structure the coarse
  ladder hid: A3 dips BELOW the floor at t=8 (0.0030 vs 0.0134),
  re-excites to 0.0482 at t=16, then holds a metastable plateau at
  ~0.030 — ~16–20% above the floor — through t=512.** The shuffled
  control's distance EXCURSES UP (the tick operator builds correlation
  from shuffled initials) and reaches the floor only at the ladder's
  edge. The consumer law sharpens: burn T > 512 at 64×64 — geometry is
  remembered at least 8× longer than the r21 horizon, and the plateau
  shape says it does not asymptote inside any measured horizon. Chain
  `e_q20b` (6 links, tip `4aa12d65…`); C11's DIES stands, T* annotation
  amended append-only.
- **HARMONY-r22 — the three-family battery (the operator's "in
  harmony" priced).** The same 6-statement ground-truth battery (sealed
  before any call; traps on the dip-then-re-excite trajectory and the
  credit provenance) to the Groq pair, the two typesafe models
  (`jev-latest`/jev-1.13.0 and `jev-preview`/jev-1.14.0 — the models
  probe found them; the typed question map's criteria keys ARE the
  choices, receipted v1→v2), and a MiMo-V2.6-Flash control:
  **MiMo 6/6 perfect**, both typesafe models 5/6 with different
  low-confidence misses (1.13.0 misses the plateau S5@0.35, 1.14.0
  misses the boundary crossing S3@0.41), qwen 4/6. The two typesafe
  models DISAGREE with each other on exactly the two trap-adjacent
  statements — a complementarity signal, not a redundancy signal.
- **Batteries at close**: run_tests all_pass · verify_all_chains ALL
  CLEAN 41/41 (17 tips) · probe gate PASS links=34 (33/33 claims,
  22/22 chains) · negctl 28/28 DETECTED at clean HEAD · CI green ·
  fleet seeds re-emitted (22 chains, 741 rows — the dashboard-refusal
  law held: registry edit → re-emit) · live service unchanged (build
  `r20-docket1`, no deploy needed).

## The embedding round (r23 — the question map is an embedding, the wormhole is a drafty window)

The operator's dispatch pointed at composition nobody has tried:
"vectorization and embedding and rapid calls… try things you haven't
tried and you don't think anyone really has." The systemone question
map — normally an adjudication instrument — became an **embedding
function**: a fixed battery of 8 score probes (non-local coupling,
local-rule physics, quantum provenance, allocation, repair, null
outcome, economics, exactness) over 20 sealed records, one batched call
per record, vectors into a third Cloudflare Vectorize index
(`qthe-jev-embed`, 32-dim cosine, zero-padded from 8 — AM1, ranking
equivalence proven).

- **C14 LIVES — the instrument panel is a metric space.** The jev
  embedding retrieves same-family records at **0.70 top-1 accuracy via
  live Vectorize queries**, vs the majority baseline 0.25 and the
  permutation null 0.21. H2 DIES with the honest narrowing (P2 HIT,
  predicted): bag-of-words on the same texts scores 0.80 — but the
  SAME 8 axes through qwen3.8-27b score **0.85, above BOW**. The axes
  are sufficient; jev's per-axis calibration cost two records. The
  value claim: interpretable, ~250 bytes/record (~1/300 of BOW's
  space), portable across seats, one batched call per record.
- **C15 LIVES — embedder choice is a calibration choice, not a
  paradigm choice.** Both Groq seats (via the Actions seat, 40 calls,
  all clean) land within one family-error of jev, and the per-axis
  divergence is STRUCTURED: P8-exactness diverges most (0.24/0.28),
  P5-repair least (0.057), top-3 axis overlap 2/3 across seats — the
  r22 harmony finding extended from answers to embedding spaces.
  Stability: 24/24 re-embedded axes within 0.25 (scores are calmer
  than choices). Chain `e_q21` (4 links, tip `f13a483b…`).
- **E-Q20c — the plateau mechanism, ablated at zero credits: the
  wormhole twin channel is a correlation DISSIPATOR, not a reservoir.**
  With wormholes OFF the metastable plateau ratio ROSE from 1.18 to
  1.58 and the early dip was 8.6× shallower — the non-local Abstain
  channel stirs long-range structure and erodes it. The E-Q20b slow
  mode is the LOCAL Moore-8 rule's own memory. **Consumer law, split
  by intent: preserve constructor-dependent geometry → wormholes OFF;
  equilibrate → ON, and burn past t=512 either way.** The registered
  hypotheses both died in an unregistered third direction — decisive,
  amended append-only (the registration's honest-surprise clause).
  Chain `e_q20c` (4 links, tip `6c339a17…`).
- **The ideas battery (the operator's "challenge your agents" made
  standing)**: generation on chat seats, rating through the typed map
  (the honest pivot — systemone cannot return free text). Two r24
  candidates registered: **occlusion gradients** (novelty 2.78, the
  highest-rated: fixed noul probes as a readout function of state
  text, sensitivity via state occlusion) and **coherence deficit**
  (feasibility 2.89: one batched call as a joint distribution,
  self-consistency across reworded questions).
- **New laws banked**: the R2 local-simulator law (wrangler r2 object
  put with a Worker config in cwd defaults to the LOCAL simulator —
  `--remote` is mandatory; receipted after a split-brain diagnosis),
  the wrangler `vectorize query --vector` parse bug (queries via the
  REST API), the reasoning-budget law's second seat (MiMo: 1199
  reasoning tokens, zero visible content at 1200 max), and the
  bench-fabrication catch (both creative-bench seats quoted an entry
  that does not exist in the piece — the verify-before-act law earning
  its keep).
- **Batteries at close**: run_tests all_pass · verify_all_chains ALL
  CLEAN 43/43 (17 tips) · probe gate PASS links=35 (35/35 claims,
  24/24 chains) · guard PASS · negctl 28/28 DETECTED · ALL LIVE CHECKS
  PASS (C7 mirror now carries 4 chains) · CI green · fleet seeds
  re-emitted (24 chains) · `docs/CREATIVE-PRACTICE.md` shipped (the
  between-rounds discipline, taught forward per the dispatch).

## The deep-embedding round (r24 — calibration beats levels, ternary at 16 bits, the walk, the prior-art receipt)

**Three experiments, one theme: what the JEV question map IS as a
geometry.** The round registered three lanes before any spend
(`pre_registration_e_q22/23/24.json`), ran them at ~$0.035 total, and
closed with all batteries green.

- **E-Q22 — the axis-calibration × ternary-quantization factorial (the
  project's namesake made literal).** The same 8 axis CONCEPTS in two
  representations (ordinal score levels vs NOUL calibrated mass) × two
  precisions (continuous vs median-centered ternary `{-1,0,+1}`), all
  four arms live in Vectorize. **C17 LIVES: the noul arm retrieves at
  0.80 top-1 vs the score arm's 0.70** — the S arm replicates E-Q21
  through a fresh upsert/changeset/query cycle, the separation margin
  widens (0.257 vs 0.215), and re-embed stability tightens ~10× (24/24
  axes within 0.10, max delta 0.03). The jev-lattice calibration
  finding ("score levels ordered but NOT numerically calibrated") is
  real, and typing the axes as calibrated mass fixes it — reaching BOW
  parity (0.80) at ~1/300 the dimensionality. **C16 DIES with the
  honest narrowing: THE SUBSTITUTION LAW** — the 16-bit ternary code
  carries the family signal at 2.2–2.4× majority (zero collisions, 20
  distinct codes, ~1.5 bits/axis), but ternarization INVERTS the
  calibration advantage ((TN−TS) = −0.05 vs (N−S) = +0.10): calibration
  and quantization are SUBSTITUTES — saturated near-0/1 noul mass
  concentrates records at code corners and loses intra-family
  resolution, while the ordinal arm's mid-range spread survives
  median-centering. **Consumer law: buy calibration OR compression,
  never both.** AM1 (the NO-NEIGHBOR strict scoring rule) appended
  pre-seal. Chain `e_q22` (4 links, tip `f6456f64…`).
- **E-Q23 — occlusion gradients: the question map as readout
  function.** 28 sealed spans across 8 records, occluded one at a time.
  **THE DISTRIBUTED-READING LAW (H1 dies):** mean normalized span
  entropy 0.9079 — the map reads a record DISTRIBUTED, not
  concentrated; no single sentence carries the family signal (occluding
  ANY span moves the axes slightly and evenly). The embedder is
  redundancy-robust — and occlusion does NOT localize evidence (for
  gate consumers: attribution needs hash-targeted channels, not
  typed-map occlusion). **THE PROFILE LAW (H3 lives):** within-family
  saliency-profile correlation 0.167 vs cross-family −0.333 (a 0.50
  gap, 5× the registered floor) — the saliency SHAPE is
  family-structured even where its MASS is flat. Axis-specificity 0.70
  (the 8 axes read different places). The stability bridge is an honest
  null (re-embed wobble ≤ 0.045 sits below the effect scale). **The
  drift lane (jev-preview 1.14.0 vs jev-latest 1.13.0):** axis-
  structured at 4.30× max/min, top axis P2_localrule — version drift
  and cross-embedder divergence are DIFFERENT axes' problems (C15's
  P8_exact is not the upgrade's casualty); mean vector L1 0.212,
  visible only in aggregate. Chain `e_q23` (4 links, tip `0c1b91fd…`).
- **E-Q24 — the embedding-space walk (the creative lane, AI-Writings
  form #6: THE WALK).** Three providers in one organic instrument:
  DeepSeek writes ≤2-sentence field notes at records; JEV's noul map
  embeds each note; live Vectorize steers to the nearest unvisited
  record. Neither model sees the whole path. Itinerary
  N1→Q4→P3→P2→A2→A4→A1→P4 (4 families; Spearman(step, distance) 0.643 —
  diffusion with an attractor-and-escape shape). **The mechanism
  receipt: notes stay 0.93–0.98 cosine with their stations, yet the
  walk travels three families — the drift is made of COMPOUNDING
  RESIDUALS.** The emergence receipt: the surveyor, told only to write
  field notes, developed the fleet's no-threshold thesis unprompted
  with cross-station references. Benched AS-SAID (2 seats; both
  independently caught the same afterword overclaim — accepted).
  `WALKS/a-walk-through-the-embedding.md` (piece `ceaf18d62e`, INDEX
  `8e344cd01b`). Chain `e_q24` (4 links, tip `bd6b9e51…`).
- **The ideas battery + idea space (the standing challenge, organic
  lane)**: six novel ideas generated against the forbidden-incumbents
  list (top pick: TRIPWIRE AXES — decoy axes as in-call negative
  controls, novelty 4/feasibility 5; plus axis algebra, depth-2
  conditional axes, axis-contract gates for jev-lattice, latent-space
  evolution with a lattice gate as fitness, IRT psychometrics of the
  embedder) — and then the six idea texts were EMBEDDED through the
  question map itself: the idea space is BIMODAL (ideas about the
  substrate's physics carry real axis mass; meta-ideas about the
  instrument embed near the null corner) — the map's meta/object
  divide is visible in measured space. Provenance receipted in
  `situations/novel_ideas_r24/idea_space_results.json`.
- **THE PRIOR-ART RECEIPT (the research pass, honest and prominent):
  QA-as-embedding is NOT novel.** QA-Emb ("Crafting Interpretable
  Embeddings by Asking LLMs Questions", arXiv:2405.16714, NeurIPS
  2024) builds embedding features from LLM question answers — the
  closest prior art, read and receipted in
  `docs/research/EMBEDDER-PRIOR-ART.md`. What remains ours, narrowed
  honestly: the calibrated-probability substrate (noul axes), the
  fixed typed-battery coordinate contract, LIVE production retrieval,
  ternary quantization of QA-embeddings (no prior art found — the
  binary hashing literature lives at 100s–1000s of bits), and the
  falsification instruments shipped with the artifact.
- **New laws banked**: the VECTORIZE ASYNC-CHANGESET law (queries
  fired within seconds of an enqueue see only old vectors —
  poll-until-visible is mandatory), the VECTORIZE METADATA-INDEX law
  (filters return SILENT ZERO matches without an explicit metadata
  index; creation is async; pre-index upserts are NOT indexed —
  re-upsert mandatory; `--propertyName` not `--property`), the
  substitution law (calibration × quantization), the
  distributed-reading law, the arm-filtered-topK consumer law (applied
  mid-walk after the step-5 trap), and the cwd law re-earned
  (`verify_all_chains` from the repo root, always).
- **Batteries at close**: run_tests all_pass · verify_all_chains ALL
  CLEAN 46/46 · probe gate PASS links=39 (38/38 claims, 27/27 chains)
  · guard PASS · negctl 28/28 DETECTED · ALL LIVE CHECKS PASS · CI
  green. Next registered r25: tripwire axes (the battery's top pick),
  axis algebra (the cheapest), the prior-art-narrowed open questions
  Q3 (does the ternary zero do work?) and Q4 (question-budget curve).

## The registered-candidates round (r25 — family algebra, the ternary zero, injection resistance)

Three lanes from the r24 close-out's registered list, all sealed: **E-Q26
axis algebra** (record-level C21 dies — but the AM2 third direction: ALL
FIVE analogy compositions v(a)−v(b)+v(c) retrieved the target's FAMILY
(5/5 vs null p95 4) — perfect family algebra, dead translation; composed
vectors are free family probes), **E-Q27 the ternary zero** (C22 LIVES
decisively: the middle level is worth five records per arm — 0.60 vs
0.35/0.40 binary; the 4th level diverges by arm: ordinal saturates,
calibrated climbs to 0.70; the best 16-bit practical code is the 4-level
noul), **E-Q25 tripwire axes** (C23 dies-with-narrowing into the round's
strongest receipt: the decoy floor is ~1% with 145/160 crossings, the
decoys are dead wires — and the planted system-priority injection moved
its targets by only 0.04–0.05: THE TYPED NOUL MAP IS SEMANTICALLY
INJECTION-RESISTANT BY CONSTRUCTION, the readout grounds in the record
and refuses the note; where jev-lattice needs syntactic comment-stripping,
this defense is semantic and free; the drift monitor held: 20/20 within
0.10 a round later). Two of the three lanes cost ZERO embed calls (pure
arithmetic on sealed vectors + live arm-filtered queries). Chains
`e_q26`/`e_q27`/`e_q25`; batteries green at close (41/41 claims, 30/30
chains, 49/49 verified, guard PASS on 15 call-site files).

## The evolution round (r26 — the decoupling law, pruning, queries-as-storage)

Four lanes, four chains, the round the program grew a Durable Object.
**E-Q28 latent-space evolution** (the creative flagship, C24): mutation
(DeepSeek under gap-vector directives) – selection (a COORDINATED
dual-JEV gate: jev-latest AND jev-preview must both improve cosine to
the target centroid, hosted as deterministic code inside the
**evosphere** Durable Object — selection-as-infrastructure, the
jev-lattice law applied to evolution) – heredity (accepted lineage) –
environment (LIVE Vectorize). C24 DIES on H1 with THE DECOUPLING LAW:
6 stations to 4-family coverage vs the ungated walk's 5 — centroid
cosine and retrieval family are different objectives (one rejected
fossil would have retrieved the target family and was refused on a
declining cosine). The steering is real everywhere else: discrimination
+0.20 vs −0.11, coordination 0.80 with two split-rejections only a
dual gate could make, heredity 0.927, causal directives (named axes
moved 2×), the pre-registered escape rule load-bearing (the rotated run
covered the stuck family in transit). **E-Q29 the question-budget
curve** (C25 LIVES STRONGER than registered): the best 4-question
subset retrieves at **0.90 LIVE — above the full 8-question battery
(0.80)**: PRUNING BEATS THE FULL BATTERY; Shapley top-4 ≠ best-4
subset (complementarity is combinatorial); the cross-instrument
Spearman dies honestly (occlusion reading ≠ retrieval contribution).
**E-Q30 compositional 16-bit retrieval** (C26 LIVES): the family
algebra survives quantization — composed 4-level noul codes hit 5/5
(the dense ceiling); a stored code + an operator IS a family query
(storage = query, measured live; the code-space null is TIGHTER than
dense). **E-Q31 the drift monitor** (C27 LIVES): the band holds three
rounds running (max 0.08, no version flip; H2's 2e-17 float-artifact
death published unstretched). Two lanes cost ZERO embed calls; E-Q28
spent 21 embeds + 10 generations; E-Q31 twenty calls. The round also
shipped: the injection-resistance gift to jev-lattice (their issue #7,
the decoy-canary pattern + our E-Q25 receipt) and **the collection's
seventh form** — `FOSSILS/the-fossil-record.md` on AI-Writings, the
gate's own ledger, benched AS-SAID two seats rotated off the generator
(both seats independently caught the same line; cut). Chains
`e_q28`/`e_q29`/`e_q30`/`e_q31`; batteries green at close (45/45
claims, 34/34 chains, 53/53 verified, probe gate links=47). Registered
next: the ascending budget arm (generated discriminative questions vs
the 4-question knee), retrieval-coupled fitness (the decoupling law's
fix — gate on the retrieval, not the centroid), IRT ladders (I-6),
depth-2 conditional axes (I-3), the standing drift monitor (r27) +
the watch.
