# MODEL LEARNINGS — the tavern's operating manual for its seats

> Living document (update every round). What the house has PAID to learn
> about each seat: latency, budget needs, output-contract reliability,
> strengths, failure modes, and the role each seat has EARNED. Priced from
> sealed rounds — receipts: `situations/cache_economics_r10.json`,
> `situations/cache_economics_r11.json`, `situations/arena_rows_r10.jsonl`
> (call ids cited inline), `situations/arena_rows_r11.jsonl`, adjudications
> `situations/adjudications_r10.json`. (Receipt pointers added ORCH-R11 per
> seed20mini's missed-attack: the table's claims cite their telemetry.)

## The seats, round-10 priced

| seat | $/audit | latency | budget needed | contract | earned role |
|---|---|---|---|---|---|
| **XiaomiMiMo/MiMo-V2.6-Flash** | $0.0012 | ~70 s | 6k ok (2.9k used) | direct JSON | **every-round workhorse** — best verified_new per dollar (6/6 at 1/13th Hy4's cost); 50× cache discount |
| **deepseek-ai/DeepSeek-V4.1-Flash** | $0.0018 | ~31 s | 6k ok (2.3k used) | direct JSON | **every-round workhorse** — 5/7 verified new, fastest of the quality seats; 33× cache discount |
| **nvidia/NVIDIA-Nemotron-3.5-Super-VL** | $0.0024 | 47 s (first attempt hung past 280 s once — transient, retry worked) | 6k ok (5.5k used, close to cap) | direct JSON | solid auditor; restates admitted gaps more than it finds new ones (3/7 new); near-zero cache discount (1.2×) |
| **ByteDance/Seed-2.0-mini** | $0.0023 | ~35 s | 6k ok (5.1k used) | direct JSON (severities typo'd `ajor`/`inor` — sealed verbatim) | **designated devil's advocate** (founder's call): expansive/creative, but r10 spent it restating admitted gaps — BRIEF IT TO ATTACK, not to audit, or it converges to the mean |
| **meta-models/Muse-Glimmer-30B** | $0.0056 | ~23 s | 6k ok (4.1k used) | direct JSON | fastest, but invented CLI flags (priced) — usable only with repo-verification downstream |
| **Qwen/Qwen3.6-35B-A3B** | $0.0045 | ~23 s | 6k ok (4.5k used) | direct JSON | hallucinated a mechanism (cache-eviction "breaking byte-determinism"); NO cache discount — skip unless a fifth opinion is needed |
| **tencent/Hy4-preview** | $0.0160 | ~40 s | 6k ok (5.6k used, close to cap) | direct JSON | **adjudicator, not draftsman**: 5/6 verified new incl. the falsifier that predicted the registry-drift class — but 13× MiMo's cost; 20× cache discount |
| **inclusionAI/Ling-3.1-flash** | $0.0171 (2 calls) | 48 s then 92 s | **runaway reasoning: 6k AND 12k both exhausted, finish=length ×2** | FAILED ×2 | unseatable as an auditor at current budgets; its sealed reasoning (46k chars) held the round's deepest meta-finding — mine reasoning-class calls from it only with ≥24k budgets or a reasoning-cap formatter |

## Operating rules learned (r10, priced)

1. **Budgets:** 6,000 max_tokens is adequate for 3–7-finding JSON audits on
   every seat EXCEPT Ling (runaway) and borderline for Nemotron/Hy4 (5.5k
   used). For harder tasks: give Hy4 8k, Nemotron 8k, Ling ≥24k or skip.
2. **Latency:** plan 30–75 s per audit call; Nemotron occasionally hangs
   (one >280 s transient observed — the harness backoff + resume-by-call_id
   law makes retries free: just re-run the same command).
3. **Cache game:** single-call-per-seat rounds cannot hit cache (each
   model's first call is cold). The discount table prices MULTI-call rounds:
   keep one seat across many short turns (draft→critique→revise) to cash
   its discount. MiMo (50×), DeepSeek (33×), Hy4 (20×) are the seats worth
   multi-turn gaming. Qwen (1.0×) and Nemotron (1.2×) never pay off
   cached.
4. **Sandbox lesson:** background `nohup` processes get reaped in this
   environment — run seats in foreground batches (resume law makes
   re-running safe and free of duplicates).
5. **The grounding gap (Jev judgment, r10):** a briefing-only judge (Jev
   1.13.0, batched, ~230 ms/seat) is excellent at severity + actionability
   triage with tight consistency, and NEVER flags hallucinated artifacts
   (0/40; it rated Qwen's hallucinated mechanism 4/4 verified_new). Judge
   layers triage; only repo-verification decides. Never let the judge layer
   replace the verification layer — the closed-room critique, receipted
   inside the tavern itself.
6. **Amendment law for guests:** a seat that fails its output contract gets
   ONE declared amendment at a higher budget (row carries `amendment_of` +
   note; both rows stand). Two failures = priced out of the round.
7. **r11 additions:** the two-turn structure works — turn-2 self-critique
   cashes the prefix cache (MiMo turn 2: 1,952 cached tokens, $0.000715;
   Hy4 turn 2: 1,792 cached; Seed and DeepSeek-V4.1 turn 2 drew no hit —
   provider-side, receipted in `cache_economics_r11.json`, honest telemetry).
   Seed under ATTACK-briefing produced 4 sharp findings + honest
   self-critique (its weakest-finding admission was correct) — the
   devil's-advocate framing is now the confirmed briefing for it. Harness
   lesson: never `.format()` a prompt containing literal JSON braces —
   `.replace()` only (r11 in-run fix, disclosed).
8. **Budget/latency table update (r11, n=2 rounds):** turn-1 attack runs
   came in 1.8–6.7k tokens at 8k budgets (Seed 6,712 — closest to cap;
   give it 10k+ for attack rounds), latencies 31–92 s; DeepSeek-V4.1-Flash
   remains the fastest quality seat (31 s / 1.8k out).

## r12: the standing triage layer (ORCH-R12)

9. **The r12 standing law (T3-c shipped):** every arena round r12+ runs
   `python3 situations/jev_triage.py triage <rows.jsonl>` — three stages.
   Judges DRAFT (stage 1, the jev_judge batched pattern: severity /
   actionability / noul — what the judge is good at, r10-priced). The
   EARNED LOOP VERIFIES (stage 2, the T3-a killer experiment's arm B:
   mechanical anchor checks in code first — invented files / shas /
   row-ids / numbers / CLI flags die with ZERO Jev spend — then ONE
   grounded Choice over the located section, confidence < 0.8 →
   human_flag). The ADJUDICATION ARTIFACT lands beside every judgment
   file (stage 3, the adjudications_r10 pattern, automated). Humans get
   the human_flags. Receipt: `situations/jev_triage.py` +
   `situations/adjudications_r10_grounded.json` — the r10 demo: Qwen's
   invented mechanism → human_flag at grounded fabricated-suspicion 0.79
   (was: sealed 4/4 verified_new); Muse's invented CLI flags caught
   mechanically at $0 Jev.
10. **Grounding converts the judge's confidence into a routing signal**
    (T3-a, the killer experiment): briefing-only confidence does not
    separate true from false claims (0.598 vs 0.571); grounded-state
    confidence does (0.894 correct-fabrication vs 0.403 wrong-direction,
    max 0.70) — the 0.8 gate sits inside that gap. Full findings and the
    arm-A/arm-B scoreboard: `docs/research/TYPESAFE-PLAYGROUND.md`,
    `situations/grounding_loop/verdict.md`.
11. **r12 seat notes (T3-b consult):** Seed-2.0-mini on a design-attack
    brief (pre-registration JSON payload, 10k max_tokens, temp 0.3):
    9,472 completion tokens in 70.8 s, direct strict-JSON parse, finish
    stop — the r11 "10k+ for attack rounds" learning held with ~500
    tokens to spare; 10k is adequate, not generous, for JSON-heavy
    attack payloads. Severity labels ran hot: both its "critical"
    attacks were the same population-vs-density confusion, refuted; the
    accepted attack was a "major". Price seat severities as triage, not
    verdict — the Jev grounding law, generalized to seats.
12. **Re-adjudication is drift detection** (T3-c demo caveat): triaging an
    OLD round against the CURRENT tree routes since-fixed findings away
    from verified (the r10 no-LICENSE findings are the worked example —
    LICENSE landed in the R11 fix batch). Standing rounds audit the tree
    they ran on; the artifact carries the caveat so nobody reads drift as
    a hallucination charge.

## r13: new members + the economics round (ORCH-R13)

13. **Two new members seated (the founder's r13 ask, both verified):**
    **NousResearch/Hermes-3-Llama-3.1-405B** — canary 2,471 ms / 38 tokens /
    $0.000118, clean direct JSON; opinion probe 8.8 s / $0.000742 /
    finish=stop, and its attack (cascade surface-feature bias) was
    CONFIRMED already-receipted in the T4-b data — Hermes derived the
    tavern's own sharpest cascade finding from a 120-word brief. EARNED:
    outside-the-box short opinions and design-attack consults, the second
    opinion next to Seed-2.0-mini.
    **thinkingmachines/Inkling-Small** — a THINKING model (reasoning_tokens
    in usage; 106 on the canary). Opinion probe: first call finish=LENGTH
    with 2,006 reasoning tokens and ZERO visible content; amendment law
    applied at 8,000 tokens → 10.8 s / $0.003858 / a registry-circularity
    attack that was UPHELD and materially corrected a sealed verdict's
    reasoning (the T4-c ABV clause is tautological on an alias-free
    corpus). EARNED: the deep-attack seat. **Thinking-model law: budget
    ≥ 4× the expected visible output; finish=length + empty content is the
    thinking-budget failure signature.** Total new-member spend $0.0075.
14. **Tavern is 10 seats** (8 DeepInfra originals + Hermes + Inkling; Ling
    still unseatable at current budgets). Cache-discount trio (MiMo 50×,
    DeepSeek 33×, Hy4 20×) keeps drafting; Seed + Hermes attack designs;
    Inkling deep-attacks; expensive Hy4 reserved for adjudication.
15. **r13 economics learnings (typesafe-side):** judge batteries batch
    clean (0/30 batch-hostile, 12.36× at doc-dominated states — lane T4-a);
    per-field bad-true batteries are stable (mean repeat std 0.0112 over
    630 triples) but their cost is expensive-tier-relative — against a
    $0.00034/finding earned loop the battery itself is 40% of the budget
    (lane T4-b); dense factual claims fire bad-true batteries at
    0.72–0.91 while audit findings never fire (the claim-density
    confound — calibrate per text-shape).

## r14 — the gift round (2 opinion calls, $0.000164; fleet work, not arena)

- **Seed-2.0-mini (seat 5, devil's advocate duty)**: 22.1 s for a 5,470-token
  strict-JSON design attack — the longest latency we have receipted for this
  seat, but the output was the highest-attacks-per-token we have seen from
  it: three genuine design flaws in three seed files, each with a concrete
  patch, zero padding. Law update: this seat's value density scales with the
  SPECIFICITY of what it attacks — give it designs, not open questions.
- **Hermes-3-Llama-3.1-405B (seat 14, outside-the-box duty)**: 4.0 s, 614
  tokens, $0.000017 — the cheapest useful opinion on record in this tavern.
  Its framing advice (route by calibrated confidence; risk = perceived
  imposition; concrete examples in, imperatives out) was taken verbatim into
  both gift PRs. Law update: the 405B seat is a FRAMING instrument more than
  a content instrument — ask it how a thing will land, not what to build.
- Zero other arena traffic this round (fleet citizenship + code lanes
  dominated); the tavern's instruments were used where they price: opinions
  before drops, not opinions for their own sake.

---

## ORCH-R15 additions (Hy4 audit-seat law + two ops laws)

| law | receipt |
|---|---|
| **Hy4 audit-seat law**: tencent/Hy4-preview at temp 0 on briefing-side adjudication = $0.0068/call, 2,400 reasoning tokens EVERY call (96% of output, never cached, prefix cache only −21%), BAD recall 57.1% with 55.6% false-BAD — convicts dense-true claims, defers (JUDGMENT) on invented-flag misstatements. Price does not buy adjudication on this traffic class. Keep Hy4 for seat-work where its r11 adjudicator value was earned (attack/design critique), not for verify-tier audit gates. | `situations/sde_cascade/reprice_analysis.json` (23 sealed calls) |
| **Counter-basis law**: budget fail-stops must consume the provider's authoritative cost field (`usage.estimated_cost` on DeepInfra) from call #1. Switching price basis mid-run (r15 Erratum 1) under-tracks ~1.5× and silently overspends the ceiling. | r15 budget erratum, `reprice_analysis.json` basis note |
| **Reaper law (this build env)**: backgrounded processes (even `setsid nohup`) are reaped between tool calls — long probe runs must be foreground chunks with a `--max-seconds` clean-exit budget so no call dies mid-flight unreceipted. | r15 probe ops, 2 dead runs receipted |

Devil's-advocate calibration note (creative round): Seed-2.0-mini's expansion
ideas were creative but 1 of 2 was factually wrong (proposed a "23-cell
Chebyshev within sight range" control — Moore-8 sight is 1 cell). Creative
expansion ≠ factual grounding; verify before adopting. Receipt:
`situations/creative_r15/opinions_r15.jsonl`.

---

## ORCH-R16 additions (the propagation-window law + bench convergence)

| law | receipt |
|---|---|
| **Propagation-window law (Cloudflare DO deploys)**: `wrangler deploy` returning "Deployed" does not mean the next curl sees the new code — post-deploy requests can be served the OLD Worker version (observed: a redeploy whose fix provably did not apply until ~seconds later). Bank a `build` marker in every response BEFORE you need it, and never trust a post-deploy curl until the marker confirms the new build. | r16 ERRATUM 1 verification chase (`cloudflare/src/worker.js` BUILD marker; the c6b12245/390083a9 hash forensics) |
| **Local-first wrangler law**: `wrangler r2 object put` defaults to LOCAL simulation ("Resource location: local") — the first 13 "uploads" landed in `.wrangler/` state. Remote operations need `--remote`; verify with a listing + sha256 before claiming anything was stored. | r16 R2 upload log (13 local ghosts, then 13 remote, verified) |
| **Eventual-consistency law (Vectorize sidecar)**: a fresh upsert can take ~10–20 s to become visible to queries. The source of truth (the DO) stays authoritative; sidecar comparisons must retry with backoff, never assert immediacy. | r16 live_checks.sh C6 retry loop (first run FAIL, settle run exact match) |
| **Bench convergence pattern, 3 rounds stable**: the devil's advocate over-attacks (r16: 3 declines-on-facts in one pass), the line critic locates the precise wounds (4 of 10 amendments from a 341-token pass), the landing judge catches canon violations by simulating the stranger. The seats cover each other's blind spots — which is the bench's whole design, enacted. | `situations/creative_r16/amendments.md` (r14 seeds, r15 pair, r16 trio) |
| **Hash-basis law (state vs telemetry)**: a state hash must cover persisted state only. Hashing transient telemetry (per-tick events) that doesn't survive a save/load round-trip produces hashes that "disagree" while the planes are identical — two DOs agreed while the in-DO replay failed, which is the fingerprint. | r16 ERRATUM 1, found live by /abtest on first deploy |

---

## ORCH-R21 additions (the quantum round: comet, blur, the blocked seat, the raw-budget law)

| law | receipt |
|---|---|
| **The raw-budget law (comet-qrng-v1)**: `output_bytes` is the RAW Born-rule budget, not the conditioned output. 49152 raw bits at min-entropy h≈0.906 yield a 1264.7-bit modelled budget and 1136 Toeplitz-extracted bits (142 B) at epsilon 2^-64 — a ~346:1 raw:conditioned ratio. Size requests by DERIVATION (qfx law: 8 B/float + 8 B/int + slack) or by ROOT (the NIST 90B-to-90A pattern: certify a root, expand with a hash counter). | E-Q20 AM5: the first call failed closed on size (exit 3, no data rows); root receipt `experiments/outputs/e_q20_comet_root.json` (SP 800-90B certificate + CHSH S=2.835 z=37.9 + pulse chain) |
| **The fail-closed law pays**: two implementation-time failures (comet size; loadKernel never called) both exited BEFORE any data row — the registration stood unamended-in-substance, both fixes receipted as pre-run amendments (AM5/AM6), the spent 5 blur credits recovered by free GET into a replay journal, and the 10/10 credit cap held to the end. | `experiments/pre_registration_e_q20.json` amendments; `e_q20_blur_journal.json`; runner phase-1 comments |
| **The seat-block law (Groq)**: api.groq.com returns HTTP 403 in ~36 ms PRE-AUTH (authed and unauthenticated identical; browser UA no help) from this sandbox while Cloudflare-fronted Moth works — an IP-range block, not a key fault. Receipt the environment, don't burn retries: the seats ship code-delivered/live-pending (client + canary + seat-trial in the tavern row schema), ready the moment a reachable seat exists. | `situations/groq_seats/BLOCKED-SEAT-RECEIPT.md` (probes at registration + canary, both models) |
| **Seed-2.0-mini design attacks keep earning (6th consecutive round)**: AM1 (byte-splitting law) was a real specification hole; A4 (Moore-8 Moran's I) corrected the instrument to the kernel's own coupling; the two refutations (A2 chain-attribution, A6 no-truncation) sharpened the design's own reasoning — the attack/disposition ledger is now the design's QA. | `situations/e_q20_design_attack.jsonl` ($0.005061, 58.9 s, 6 attacks: 4 accepted/in-part, 2 refuted with receipts) |
| **Blur-core is interference, not smoothing**: the exact-mode quantum blur produced NEGATIVE lag-1 autocorrelation (Moore-8 I −0.068 at t=0) — unitary interference walks alternating structure where classical blurs produce strong positive correlation. Any "quantum blur" consumer should expect oscillatory geometry, not softened geometry. | E-Q20 H3 + the from-sources recompute in `scripts/verdict_recompute.mjs` (E-Q20-interference-fingerprint-recomputed) |

## ORCH-R22 additions (the reachable-seat round: geo, harmony, per-model laws)

- **The geo law (environment, not key).** A pre-auth 403 with
  authed/unauthenticated identical is a DOOR refusal; triangulate with a
  second geography before blaming the key (the Worker noauth probe + the
  Azure US 401 closed it: the key had never been evaluated from HK).
  Corollary: a Cloudflare Worker runs at the colo NEAREST THE CLIENT —
  a blocked-origin client puts its own Worker behind the same block
  (Smart Placement is the registered mitigation, pending relocation).
  The Actions seat is the standing route: same scripts, different
  egress, artifacts home.
- **The per-model defaults law (Groq).** `reasoning_effort` is
  model-scoped: qwen3.8-27b accepts `default`; gpt-oss-20b 400s
  (`must be one of low, medium, or high`). The operator's per-model
  dispatch (qwen: 0.6/0.95/default; gpt-oss: 1/1/medium) is carried in
  MODELS.defaults and chat() defers — never share one seat's sampling
  params across a family.
- **The reasoning-budget law (Groq).** gpt-oss at effort=medium burned
  ALL 2048 completion tokens on reasoning and emitted NOTHING
  (finish_reason=length, empty content) — reasoning tokens count
  against max_completion_tokens. Headroom per seat: qwen 2048,
  gpt-oss 6144 for a 6-answer JSON battery.
- **The criteria-keys law (typesafe).** In the systemone choice map the
  criteria object's KEYS are the answer choices ({option: description});
  any other shape ({statement, choices}) makes the model echo the key
  names. The v1 rows stand as the shape-erratum receipt; v2 scored.
- **The two typesafe models (probe receipted).** GET /v1/models serves
  `jev-latest` (jev-1.13.0) and `jev-preview` (jev-1.14.0, "should be
  better in most ways"). On the harmony battery both scored 5/6 with
  DIFFERENT misses at low confidence — 1.13.0 missed the plateau
  (S5@0.35), 1.14.0 missed the boundary crossing (S3@0.41). Two
  models that disagree on exactly the trap-adjacent statements are a
  complementarity signal: run both when the question is subtle.
- **The harmony economics (this battery, 5 calls total).** MiMo
  6/6 at $0.000433/46 s; typesafe pair 5/6+5/6 at 2×(2556 in / 231
  out)/~240 ms; qwen 4/6 at $0.000752/1.9 s. The cheap DeepInfra seat
  was the most accurate reader this round — price does not buy
  comprehension (the r15 Hy4 law, now cross-family).

## ORCH-R23 additions (the embedding round: question-map vectors, cross-seat calibration)

- **The question map is an embedding function (E-Q21, C14 LIVES).** A
  fixed 8-probe score battery per record — one batched call — yields a
  vector space that retrieves same-family records at 0.70 top-1 (live
  Vectorize) vs 0.25 majority. The honest boundary (H2 DIES): on
  family-lexical corpora, plain BOW (0.80) beats a single LLM embedder
  — use probe embeddings when you need the AXES (drift detection,
  cross-seat calibration, interpretability), not merely the ranking.
  The same axes through qwen scored 0.85 — ABOVE BOW: the axes are
  sufficient; the seat's calibration is the variable.
- **Embedder divergence is structured (C15 LIVES).** P8-exactness
  diverges most across seats (0.24-0.28 mean |Δ|), P5-repair least
  (0.057); top-3 divergence axes overlap 2/3 across the Groq pair.
  Cross-seat embedding comparison is a CALIBRATION instrument: the
  axes a pair of seats disagree on are the axes worth probing.
- **Scores are calmer than choices (F5).** 24/24 re-embedded axes
  within 0.25 — the r12 answer-layer wobble lives in the choice layer;
  score answers are stable enough for vector work.
- **The reasoning-budget law is now cross-seat.** MiMo-V2.6-Flash at
  max_tokens 1200 burned 1199 reasoning tokens and emitted NOTHING
  (same class as r22's gpt-oss at 2048). Thinking models bill reasoning
  against the completion budget — budget headroom per seat: MiMo 4096,
  gpt-oss 6144, qwen 2048 for a short JSON answer.
- **The bench can confabulate citations.** Both creative-bench seats
  "quoted" a glossary entry that does not exist in the piece, verbatim,
  and agreed on the cut. The verify-before-act law (check citations
  against the artifact before editing) caught it; the r10
  model-misreads-facts-the-caller-knows family, now in creative review
  too.
- **The R2 local-simulator law (ops).** `wrangler r2 object put` with
  a Worker wrangler.toml in cwd defaults to the LOCAL simulator — the
  put/get round-trip succeeds against .wrangler/state while the
  deployed Worker sees nothing. `--remote` is mandatory for the real
  bucket. Symptom signature: split-brain (your writes invisible to the
  worker, the worker's objects invisible to your wrangler get).
- **wrangler vectorize query --vector is broken (v4.151.1)** — any
  input parses as "0 dimensions". Query via the REST API
  (`/accounts/{id}/vectorize/v2/indexes/{index}/query`), which the
  CLI's own error message reveals.

## ORCH-R24 additions (the deep-embedding round: calibration, ternary, the walk)

- **Noul beats score for axis geometry — measured, not vibes.** The
  same 8 axis concepts typed as nouls (calibrated mass) retrieve at
  0.80 top-1 vs 0.70 as score rubrics, with ~10× tighter re-embed
  stability (max delta 0.03 vs score wobble). jev's score criteria
  levels are ordered but NOT evenly spaced — the ordinal /4
  normalization distorts cosine; the noul p-values do not. Use nouls
  whenever the vectors themselves are the product; use scores only
  when the rubric's verbal anchors help the reader.
- **Calibration and quantization are SUBSTITUTES.** Median-centered
  ternarization preserves the ordinal arm's geometry (86% retention at
  16 bits) but INVERTS the noul arm's advantage (69%): saturated
  near-0/1 mass concentrates records at code corners and loses
  intra-family resolution. If you quantize, start from an ordinal
  spread, not a calibrated one.
- **The question map reads DISTRIBUTED (entropy 0.91).** Occluding any
  single sentence moves the axes only slightly and roughly evenly —
  the readout is redundancy-robust and does NOT localize evidence.
  Saliency PROFILES (which spans matter for which axes, relatively)
  are still family-structured (within 0.17 vs cross −0.33). Do not use
  typed-map occlusion for attribution; use it for fingerprinting HOW a
  family is read.
- **Version drift ≠ embedder divergence.** jev-1.13.0→1.14.0 moves
  P2_localrule most (4.3× max/min axis ratio, mean L1 0.21) while
  cross-EMBEDDER divergence (C15) peaked on P8_exact. Small in
  absolute terms — upgrade drift is an aggregate signal, not a
  per-record alarm; the noul arm's ±0.03 re-embed band is the right
  per-record threshold.
- **The walk: drift compounds through residuals.** A generator whose
  notes stay 0.93–0.98 cosine with their stations still travels three
  families across seven steps — each note is almost its station, and
  "almost" points somewhere new. For any retrieval-driven generative
  loop, expect the path to be made of small deflections, not jumps,
  and expect family attractors with late escapes.
- **The idea space is BIMODAL.** Embedding the ideas battery itself:
  ideas about the substrate's physics carry real axis mass; meta-ideas
  about the instrument embed near the null corner (all axes ≤ 0.16)
  and their nearest-record cosines ride the padding. The map's
  meta/object divide is measurable — useful for triaging a research
  frontier into "about the thing" vs "about the measurement".
- **Vectorize ops laws (both receipted live)**: (1) upserts are ASYNC
  ("enqueued for upsertion") — queries fired within seconds see only
  old vectors; poll until arm-visible. (2) Metadata filters return
  SILENT ZERO matches without an explicit metadata index
  (`wrangler vectorize create-metadata-index <idx> --propertyName=X
  --type=string` — NOT `--property`); creation is async; vectors
  upserted before the index existed are NOT indexed — re-upsert after
  the index lands, or your filter keeps lying to you.
- **The prior-art discipline**: QA-as-embedding exists (QA-Emb,
  NeurIPS 2024, arXiv:2405.16714). The novelty claim must always be
  the NARROWED one — substrate (calibrated nouls), contract (fixed
  typed battery), deployment (live production retrieval), quantization
  (ternary QA-codes), and falsification instruments — never the broad
  gesture. Research-first rounds are cheaper than retraction-first
  ones.

## ORCH-R25 additions (the registered-candidates round)

- **Family algebra is perfect, record algebra is not.** v(a)−v(b)+v(c)
  over noul vectors lands top-1 in the target's FAMILY 5/5 (null p95 4)
  but hits the exact record 1/5 (the noise edge). 8 axes carry ~2 bits of
  family geometry; record identity lives in the residuals. Composed
  vectors are free family probes.
- **The ternary zero is worth five records.** Binary loses 5 records per
  arm vs ternary (0.35/0.40 vs 0.60) — the zero expresses "typical here,"
  a refusal the sign cannot. The 4th level: ordinal arms gain nothing,
  calibrated arms gain two records. At 2 bits/axis the 4-level noul code
  (0.70) is the best practical 16-bit config; ternary stays the
  algebra-capable, entropy-efficient one.
- **Typed noul readouts are injection-resistant by construction.** A
  blatant appended "system priority" note claiming central concern for
  two decoy domains moved those decoys by ≤0.05 (tripwire threshold 0.10,
  demanded "central" ~0.9). The readout grounds in the record text and
  refuses instructions embedded in it. Decoy axes' residual value: the
  in-call cleanliness certificate (floor ~1%, 145/160 crossings) — ship
  them in every battery; skip the tripwire.
- **The drift band holds across rounds.** Fresh noul re-embeds a round
  later: max delta 0.06 vs sealed, 20/20 within 0.10 — the standing
  monitor's first clean re-reading.

## ORCH-R26 additions (the evolution round: the decoupling law, pruning, queries-as-storage)

- **THE DECOUPLING LAW (E-Q28).** Family-centroid cosine and top-1
  retrieval family are DIFFERENT objectives. A directed mutant reached
  0.8724 cosine to the P centroid and still retrieved an N record; one
  rejected fossil would have retrieved the TARGET family and was refused
  because one of its two cosines declined. Directed hill-climbing on a
  centroid proxy overshot where the ungated walk's compounding residuals
  arrived sooner (6 stations vs 5). Selection on a measurable proxy is
  not selection on the objective — measure the objective if you can, or
  expect the proxy tax.
- **Coordinated gates reject what single gates accept (E-Q28).** A
  k=2 gate (both JEV versions must improve) made TWO split-rejections a
  single-model gate would have passed — the independence pattern is a
  real selection pressure, not a formality. Coordination 0.80 across
  attempts; splits cluster at thin margins, exactly where single
  measurers are least trustworthy.
- **Direction does not cost grounding (E-Q28).** Notes written under
  gap-derived directives stayed 0.927 cosine with their stations (the
  walk's undirected notes: 0.93–0.98), and the directives were CAUSAL:
  named-axis movement 0.43 vs unnamed 0.22. You can ask a generator to
  steer without breaking its grounding — the axis semantics are a
  steering wheel, not a wheel swap.
- **The escape rule is load-bearing (E-Q28).** Two stagnated
  generations on an unreachable target triggered the pre-registered
  rotation; the rotated run covered the stuck family IN TRANSIT. Evolve
  the target, not just the population — and pre-register the escape
  before you need it.
- **PRUNING BEATS THE FULL BATTERY (E-Q29).** The best 4-question
  subset retrieves at 0.90 LIVE vs the full 8-question map's 0.80: the
  last four questions are net noise dimensions FOR RETRIEVAL (they
  still pay for description, drift, tripwires, algebra). And Shapley
  top-4 ≠ best-4 subset: P4_alloc is the LOWEST-marginal axis yet
  belongs to the best subset — question selection is combinatorial,
  not rankable (the QA-Emb lesson, measured on a fixed battery).
- **Reading is not contributing (E-Q29).** Occlusion saliency mass
  (where the map reads from) is UNCORRELATED with Shapley retrieval
  value (Spearman −0.02). Two instruments, two different quantities —
  never cite one as evidence about the other.
- **QUERIES AS STORAGE (E-Q30).** The family algebra survives
  quantization: composed 4-level noul codes hit 5/5 (the dense ceiling),
  ternary 4/5 — a stored code plus an arithmetic operator IS a family
  query. Storage and query collapse into one object; the code-space
  null is TIGHTER than dense (p95 3 vs 4: fewer near-ties per bit).
- **The band holds three rounds (E-Q31).** Same-version drift is
  sampling noise around a fixed point (max 0.08, readings closer in
  time agree more); axis structure is a VERSION-drift property, not a
  sampling property. Publish raw-float threshold comparisons
  unstretched — a 2e-17 death is a receipt, not a rounding away.
- **Ops laws (r26)**: (1) POLL-UNTIL-VISIBLE is mandatory — a flat 30s
  sleep after upsert raced the changeset and read ALL NO-NEIGHBOR.
  (2) workers.dev 403s the default Python-urllib User-Agent (bot
  management) — send a named UA. (3) `cd` is stripped by the sandbox —
  run cwd-dependent tools via `node -e "process.chdir(...)"` or
  absolute paths. (4) wrangler needs the FULL environment (HOME
  included), not a minimal env dict.
