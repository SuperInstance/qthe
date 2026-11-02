# EXPERIMENT-MATRIX — Pre-Registered Designs E-F1/E-F2/E-F3
**Seat:** fleet-wrangler · **Coursework:** G1-5 · **Status:** PRE-REGISTERED (design frozen before any live run; key-pending per No-Key Law)

House law inherited from qthe: falsifier-first, honest null = crown jewel, a claim that dies dies cheap with the receipt kept beside the body, and a mechanism-level explanation either way. **No amendment after unblinding — post-run discoveries reopen as a new experiment id.**

## 0. Shared pre-registration block (applies to all three)

| Field | Value |
|---|---|
| Corpus pin | git sha of qthe (or the production-library repo when it exists) at run start + corpus file list, sealed into the experiment's `registration.json` |
| Seat/prefix pin | served model ids as reported by API; prefix_version + sha256 (PLAYBOOK §1.3); price table from canary ritual (PLAYBOOK §5.4), all rows EST-labeled until canaried |
| Receipts | one `rows_*.jsonl` (per-call schema, PLAYBOOK §5.3) + one `*_economics.json` per arm per round; verification verdicts beside every judgment |
| Analysis | pre-registered primary metric, bootstrap 90% CI (10k resamples), pre-registered margin M; no metric shopping |
| Stop conditions | budget cap B_round per arm (EST until canaried; hard-stops the arm when hit), contract-failure cap 2 per seat (amendment law), wall-clock cap per round |
| Amendment protocol | numbered + dated, pre-run only; every amendment carries its reason and its source (e.g., a Seed attack finding) |
| Verdict | LIVES / DIES / NULL-NOT-ADOPTED, each with a mechanism-level explanation, sealed as `verdict.md` beside the rows |

**Ground truth, all experiments:** the repo decides. Mechanical anchor checks (invented files/shas/row-ids/CLI flags die at $0), kernel executions (determinism law: same seed+ticks → byte-identical), and the earned grounding loop with the 0.8 confidence gate → human. Judges draft; the repo decides (r10-priced: a briefing-only judge rated a hallucinated mechanism 4/4 verified_new; fabrication detection 6/7 vs 4/7 briefing-only; true-flag 81.8%; zero auto-fabrications — all MEASURED).

**Task corpus (REAL Guild task classes; every task gets a stable id):**
- **T-API** — API critiques: critique a proposed usage of the DeepInfra OpenAI-compatible endpoint or a TypeSafe systemone question map (e.g., "this map is sensitive to answer-layer wobble — find where"). Ground truth: docs + telemetry of the recorded calls.
- **T-JARGON** — jargon audits: find terms used-before-defined / unparseable to a new adopter in a SPEC/README section. Ground truth: the repo text; admitted-gaps list prices restatements.
- **T-ATTACK** — plan attacks: Seed-style adversarial briefs against a proposed experiment plan; plan authors seal a known-weakness list BEFORE the run. Ground truth: the sealed list + adjudication of novel attacks.
- **T-KERNEL** — kernel ambiguities: questions about qthe kernel behavior. Ground truth: running the reference kernel (byte-deterministic).

Task difficulty is stratified at registration: each task labeled MECH-settleable (no model needed), LLM-settleable (cheap tier sufficient), or ESCALATION-class (adjudication needed) by the registrar BEFORE arms run — this labeling is itself an artifact the router is judged against.

**Quality scoring (pre-registered weights, r10 classes):** verified_new = 1.0 · already_admitted = 0.25 · plausible = 0.1 · misstated = −0.5. Verified-quality points VQ = Σ weights over a task's findings; **VQP = VQ per dollar** (all dollars: drafting + routing/adjudication + verification).

---

## E-F1 ROUTING — does decision-model routing beat simple heuristics on quality-per-dollar?

**H1:** a TypeSafe/Jev decision model choosing the handler per task achieves VQP ≥ best static arm × (1 + M) with M = 0.5 (i.e., ≥1.5×), with zero routing-induced contract failures.
**H0 (honest null):** routing overhead (decision-call cost + mis-routing damage) consumes the savings from avoided mis-spent calls; VQP CI overlaps the best static arm. A null is a crown jewel — reported, not spun.

**Arms (n = 40 tasks per arm, stratified 10/20/10 across MECH/LLM/ESC classes, same tasks across arms):**
- **A-JEV-ROUTE:** before each task, one systemone call with a typed choice question over handlers {MECH, LLM-CHEAP, ESCALATE}, given registrar-published task features (class, artifact length, novelty flag, ground-truth mode) — NOT the registrar's label itself (the router must infer, not read the answer). Confidence < 0.8 → default LLM-CHEAP. Handler then executes per PLAYBOOK tiers. Router call cost billed to the arm.
- **B-STATIC-CHEAP:** every task → LLM-CHEAP (MiMo-class loop, PLAYBOOK §4).
- **C-KEYWORD:** orchestrator heuristic routing (current baseline: task-type keyword table → handler), the incumbent to beat.
- **D-RANDOM:** uniform random handler choice — the sanity floor; an arm losing to D is a broken arm, not a finding.

**Metrics:** primary VQP; secondary: routing accuracy vs registrar labels (% correct handler per class), routing overhead $ per task, task completion within contract (%), latency, handler-spend distribution.
**Kill criteria (the experiment dies honestly when):**
1. K1: at n=40, A's VQP ≤ max(B, C) with CI overlap → **NULL-NOT-ADOPTED** (Jev judge seat remains triage-only).
2. K2: A's routing accuracy ≤ C's accuracy → routing adds a middleman without judgment → DIES on H1.
3. K3: routing overhead > 20% of A's total spend → DIES on H1 regardless of accuracy.
4. K4: A routes > 30% of MECH-class tasks to any paid model → the decision model cannot see mechanical settleability (the exact skill the seat was bet to have) → DIES on H1.
5. K5 (sanity): any arm below D on VQP → that arm's implementation is audited before any verdict is written.
**LIVES if:** VQP ≥ 1.5× best static arm (90% CI), zero routing-induced contract failures, and the router's MECH-class avoidance ≥ 70%. Adoption = the router joins the standing harness for E-F3's B arm.

---

## E-F2 ARBITRATION — two seats disagree: decision model vs Orchestrator as judge?

**H1:** Jev arbitration of seat disagreements agrees with repo-verified ground truth ≥ mechanical-battery-alone + M (M = 10 accuracy points) AND costs < the Hy4 adjudication arm × 0.5.
**H0:** the mechanical battery already captures the agreement; the decision model adds cost without accuracy (the r15 precedent predicts a version of this for expensive LLM judges).

**Disagreement corpus (built before unblinding, sealed):** (i) pairs of conflicting findings mined from sealed `arena_rows_r10/r11.jsonl` (e.g., one seat flags a claim another passes on the same artifact); (ii) fresh two-seat passes (MiMo + DeepSeek-Flash, the r10-strongest cheap pair) over 30 new tasks from the T-corpus above, retaining every instance where verdicts conflict (flag-vs-pass, severity gap ≥ 2, or misstated-vs-verified disagreement). Every pair adjudicated by ground truth (repo verification + human at the 0.8-gate floor) BEFORE arms run; adjudications sealed. Target n = 60 disagreements (piloted; if yield < 60 after the fresh pass, n = what the corpus gives, sealed, and the margin is not relaxed).

**Arms (each disagreement flows through every arm — within-item design):**
- **A-JEV-ARBITRATE:** systemone typed choice over {finding-holds, finding-dies, needs-human} + confidence; confidence < 0.8 → needs-human (the earned gate, MEASURED to sit inside the 0.894/0.403 gap).
- **B-MECH-BATTERY:** orchestrator alone: mechanical anchor checks + grounding loop, no LLM judgment (the r12 standing law's stage-2).
- **C-HY4-ARBITRATE:** Hy4-preview adjudicates with repo excerpts supplied (price anchor; r15 predicts it loses on both axes — this arm is retained to re-price that precedent in the arbitration role rather than the verification role).
- **D-HUMAN-CALIBRATION:** n=15 disagreements double-human-adjudicated, to measure ground-truth noise (if humans disagree with the sealed truth > 15%, the corpus itself is flagged and the margin re-examined BEFORE arm verdicts).

**Metrics:** agreement with sealed ground truth (primary); false-OK (accepting a false finding — the dangerous error) and false-BAD (killing a true finding) separately; $/adjudication; latency; auto-fabrication rate (hard floor: 0 — any fabricated anchor in a judgment kills the arm).
**Kill criteria:**
1. K1: A's agreement < B's agreement (CI) → **DIES** — a judge that adds errors on top of the battery.
2. K2: A's false-OK rate > B's → DIES regardless of aggregate accuracy (the asymmetric-error law: false-OK is the expensive error class; r10's 2 hallucination classes are the priced precedent).
3. K3: A's accuracy ≤ B's with CI overlap AND $/adjudication > B's → NULL-NOT-ADOPTED.
4. K4: any auto-fabrication in A or C → that arm DIES with prejudice (grounding-loop precedent: zero auto-fabrications is the earned standard).
**LIVES if:** agreement ≥ B + 10 points, false-OK ≤ B's, $/adjudication < 0.5 × C's, zero fabrications. Adoption = Jev arbitration becomes the first-line disagreement resolver, humans reserved for the 0.8-gate.

---

## E-F3 VERIFICATION ECONOMICS — $/verified-finding for this project, with a target and a kill threshold

**H1:** the Guild's production-library build rounds can hold **T_vf = $0.005 per verified finding** (generation + triage + verification combined) while holding BAD recall ≥ 61.4% (the r15 battery's 71.4% minus a 10-point pre-registered regression allowance) and auto-fabrications at 0. T_vf is EST — anchored DERIVED on r10 (≈$0.0027 generation spend per verified finding: $0.0509 ÷ 19) with headroom for the heavier verification the production library needs; T_vf may be re-based ONCE, dated, before round-2 data is read, with the re-basing reason sealed.
**H0:** the target was set wrong — the honest outcome is a re-registered target with a mechanism note, not a quietly fudged metric.

**Arms (findings randomized at finding level, stratified by task class; every generated finding enters exactly one arm):**
- **A-BATTERY-ALL (doctrine arm):** every finding → mechanical anchor checks ($0) → earned grounding loop (r13-priced $0.00034/finding) → battery where needed → human below the 0.8 gate. The current standing law.
- **B-TRIAGE-FIRST (experimental arm):** Jev batched severity/actionability triage (the r12 pattern) → battery + grounding loop only for severity ≥ S_t (S_t = 3 on the 1–4 scale, pre-registered) → below-threshold findings auto-parked (recoverable, never silently dropped).
- **C-STRONG-VERIFY (negative control):** a strong LLM verifies everything (the r15-killed arm, retained as the price/accuracy control to confirm the kill transfers to this corpus).

**Corpus:** the Guild's real task stream — every finding from T-API, T-JARGON, T-ATTACK, T-KERNEL tasks across rounds R1..R3 of the production-library build (per-round n reported; no minimum asserted — yield is what the work produces, sealed as it lands).

**Metrics:** $/verified-finding (primary, all-in); verified_new yield per task; BAD recall vs the sealed adjudications; false-BAD rate; auto-fabrication count (floor 0); human-flag rate (workload proxy); per-round trend (is the target converging or receding?).

**Kill criteria:**
1. K1: any hallucination class escapes B that A catches → **B DIES** (triage-first is a filter, not a blind spot) — the r10 precedent: 2 hallucination classes priced is exactly what triage must not wave through.
2. K2: A-arm $/verified-finding > 2 × T_vf after two complete rounds → **the target DIES honestly**: re-register at the measured value with a mechanism-level cost decomposition (which tier ate the budget), or accept that this corpus is costlier than the audit-tavern corpus.
3. K3: BAD recall in A < 61.4% → the doctrine arm itself is mis-specified for this corpus → halt, autopsy against the r12/r15 anchors before any further spend.
4. K4: C (strong-verify) beats A on $/verified-finding → contradicts r15 → audit for corpus mismatch first, then re-price; only if it survives audit does the r15 kill get re-opened (as a NEW experiment id).
**LIVES if:** A (or B, surviving K1) holds ≤ T_vf with recall floor and zero fabrications across two consecutive rounds → the target is adopted as the standing verification budget for the production library, and $/verified-finding joins the per-round receipt as a tracked metric.

---

## Run order and dependency

1. Canary ritual (PLAYBOOK §5.4) — prices every EST symbol.
2. E-F3 round 1 begins immediately (its A arm is the standing doctrine; it generates the disagreement yield that feeds E-F2's corpus).
3. E-F1 runs on the frozen task corpus once triage batches are live (needs only router + handlers).
4. E-F2 runs when its disagreement corpus reaches the sealed n.
5. Cross-experiment law: no experiment's verdict cites another's unsealed data; each verdict stands on its own receipts.
