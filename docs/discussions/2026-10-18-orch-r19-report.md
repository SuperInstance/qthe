# ORCH-R19 Round Report — the housekeeping round (deployments, docs, README)

Filed 2026-10-18 (after r18's close), orchestrator (Z.ai), erised fleet
line. Registration: `2026-10-18-orch-r19-registration.md` (commit
`bfc9c6a`, before any work).

## T10-a — deployment health: ERRATUM 4, found, fixed, redeployed

The r18 flag was honest: live_checks had not run since r17, and the r19
battery found the C6 sidecar check **FAILING** (5×8 s budget exhausted).
Falsifier-first diagnosis:

- **Probe** (`/twins/13` vs both fields): the sidecar HAD converged to
  livecheck-a's values — the observed failure was propagation latency
  exceeding the budget, not divergence.
- **But reading the code exposed the latent race**: `syncTwins` upserted
  field-AGNOSTIC ids (`slot-N`), so in a multi-field deployment every
  field's sync overwrote every other's slots — the 5-minute cron beat
  could deterministically clobber a livecheck's sidecar between its tick
  and its query. A race no retry budget can fix; today it was latency,
  but the collision sat beside it as a loaded gun.

**The fix (worker build `r19-erratum4`, version
`d362793a-016b-4f0d-88a7-f9b2c2e26c4b`):** vector ids namespaced per
field (`${field}::slot-N`), metadata carries `field`, `/twins/:slot`
accepts `?field=` — and because same-slot one-hots across fields all
score 1.0 against the query, the field's vector is SELECTED from the
match set by metadata, not hoped for from the ranking. Unscoped lookups
prefer namespaced vectors during the transition. The 64 legacy `slot-N`
vectors were deleted via the Vectorize REST `delete_by_ids` endpoint
(mutation `56ca507c-e907-46f7-89c0-b149bda1b9a2`); ops note receipted:
the endpoint is `delete_by_ids` (underscores) — the dashed variant
404s with a raw router error, and the v1 endpoint reports the
api-version mismatch itself.

`live_checks.sh` also gained the null-guard on the VC expression (a
latent script bug surfaced by the retries: `'NoneType' object is not
subscriptable`) and the retry budget 15×15 s (the delete-mutation +
fresh-upsert propagation window observed >100 s).

**Post-fix battery: ALL LIVE CHECKS PASS** — build marker confirms
`r19-erratum4`; cross-DO determinism (seed 777, 40 ticks, hash
`753da5a1…`); in-DO replay; field-scoped twin lookup EXACT
({x:29, y:12, resonance:84}, similarity 1.0, converged attempt 1); R2
`e_q1_chain.jsonl` sha256-identical; Pages live. The census route
remains field-agnostic by design (counts the 64 slots, whichever
field's vector answers).

## T10-b — the sweep (all 8 staleness-map items closed)

1. `README.md` experiments line: E-Q1..E-Q17 / six claims → **E-Q1..
   E-Q18 / seven claims** (C9 named with its verdict).
2. `README.md` CI line: 33/33 + 23-claim → **34/34 + 26-claim**.
3. `SPEC.md` LAYER 2: **+C9 row** (marked as the roadmap's own P42, not
   a gifted claim) and the closing pointer now names the
   deployment-layer receipts (C6/C7/C8, KV+cron) with their live-check
   battery.
4. `docs/PHASES-REPORT.md` P42: SPEC-DELIVERED → **DONE
   (investigation — DIES)**, with the E-Q18 receipts inline.
5. `cloudflare/assets/index.html`: the sidecar bullet now separates the
   LIVE infrastructure from the r17 pricing death ("died below chance —
   measured honestly, kept beside the body"); ERRATA 1–4 all listed
   (the page previously carried only 1–2); build marker
   `r19-erratum4`; poke links field-scoped; page re-dated round 19.
   **Pages redeployed** (`17cfa2a.qthe-demo.pages.dev` → production
   alias) and verified: served index.html and demo.html both
   **byte-identical** to `cloudflare/assets/`.
6. `docs/CLOUDFLARE-DEPLOYMENT.md` Addendum 3: the full ERRATUM 4
   receipt + the fifth banked ops law: **a check that can fail two ways
   teaches you which one you have** (the latency fix and the namespace
   fix were both necessary; only the failing check made the second
   visible).
7. GitHub repo metadata: **homepage = https://qthe-demo.pages.dev**,
   **10 topics** set (cellular-automata, deterministic,
   distributed-systems, edge-computing, esm, javascript,
   zero-dependency, complex-valued-logic, experiment-driven,
   receipt-chains). Description already current — untouched.
8. `cloudflare/live_checks.sh`: run twice this round (found the failure,
   then verified the fix) — the deploy-touching regression gate paid
   for itself.

## T10-c — creative breaks (the operator's prescription, filled)

Three compact pieces in AI-Writings, forms no previous round used
(commits `b3c0da3`→rebased `f3f7e65`, after the landing-page bot's
auto-update — rebased, not force-pushed):

- **OBITUARIES/what-died-and-what-it-taught.md** — in memoriam for the
  five dead claims (C3, C4, C5, C6, C9), every death certificate citing
  its chain tip, every "survived by" a real priced sibling.
- **FIELD_GUIDE/the-four-weather-states.md** — the naturalist's guide
  to the timbre alphabet ("specimens are not collected; they are
  hashed").
- **PROBLEM_SET/substrate-problems-first-set.md** — six problems with
  worked solutions; P6 states the C2/C9 separation (delivery robust,
  provenance dead, at identical load) as an exam question.

## Budget

$0 (no LLM seats; all lanes were code, docs, deployment, compute).

## Verification at close

run_tests exit 0 (all_pass, G4 superseded by the pinned G4-P2 state) ·
verify_all_chains 34/34 · probe_gate PASS (26 claims, chain links=25
pre-reseal) · guard PASS · negctl at clean HEAD (receipt carried in the
follow-up commit) · ALL LIVE CHECKS PASS against the redeployed service
· CI green at the close-out commit.

## Standing (unchanged, honestly)

Battery loaded. jev-garden live wiring + edge hardware remain open and
not executable from this seat. The 8×64+8 hierarchical survivor is
registered, untriggered (no consumer). Next round candidates: the
fleet's asks (watch continues), or the first consumer-driven pricing
target.
