# GROQ SEATS — EARNED (ORCH-R22/T13-b, the new-member law discharged)

Sealed 2026-10-18T15:31Z by the orchestrator, from Actions run
39140738877 (artifact `groq-seat-r22-3`, sha256 of the downloaded
files receipted in RUN-RECEIPT below). The rows are AS-SAID, unedited.

## The canary (both seats, LIVE)

| call_id | model_served | latency | cost | content |
| --- | --- | --- | --- | --- |
| r22-canary-qwen38-27b | qwen/qwen3.8-27b | 165 ms | $0.000015 | "canary-ok" |
| r22-canary-gpt-oss-20b | openai/gpt-oss-20b | 339 ms | $0.000045 | "canary-ok" |

## The trial (design attack on pre_registration_e_q20b.json, AS-SAID)

- **qwen38-27b** (4036 ms, $0.001582, 1688 in / 1852 out): 6 attacks —
  A1 CRITICAL: the n=20 LOO 95th-pct nearest-rank floor IS the 19th
  order statistic (the second-largest distance) — the floor is
  tail-sensitive, and its stability across checkpoints must be reported
  alongside T*; A2 MAJOR: the floor is checkpoint-dependent, so the
  "and stays" clause could fire on floor wobble rather than A3
  dynamics; A3 MAJOR: the A3S shuffle spec (global vs local) lives in
  the E-Q20 inheritance chain, not this document; A4/A5 MINOR: the
  controls' floor definition and the H2b "first touch" definition need
  pinning; A6 MINOR: F0' exactness is same-seat only (the E-Q20
  determinism scope note is the answer).
- **gpt-oss-20b** (2349 ms, $0.000551, 1611 in / 1947 out): 6 attacks —
  A1 CRITICAL: "Moran's I distance" conflates the autocorrelation
  coefficient with a distance — the exact per-plane-vs-population
  reduction must be stated; A2 CRITICAL: floor over per-plane distances
  vs over aggregated medians is ambiguous as written; A3 MAJOR: the
  "stay" clause vs brief re-excursions; A4 MAJOR: the A2-exclusion
  weakens the contrast baseline (declined-on-facts: H1 is already
  sealed — byte provenance is invisible — so A2 adds no discriminating
  power for T*; the exclusion is registered, not accidental); A5/A6
  MINOR: floor consistency for the controls; the F0' gate's runtime
  enforcement is code order in a single-threaded script.

## The repo's answers (judges draft, the repo decides)

1. **Floor definition ambiguity (qwen-A1/A2, oss-A2 — the convergent
   critical family):** ANSWERED BY THE F0' GATE. E-Q20b must reproduce
   E-Q20's sealed t=0/t=64 values BYTE-EXACTLY, which pins the exact
   floor computation (per-plane Moran's I; per-plane LOO distance to
   the other 19's median; the 95th-pct nearest-rank over the pooled
   per-plane distances; population statistic = median of per-plane
   distances — the AM2/AM3 laws). The E-Q20b run will ADD the floor
   trajectory to its output so the wobble question is answerable from
   the artifact (qwen-A2 accepted).
2. **"First touch" (qwen-A5):** PINNED: the first checkpoint where A3's
   distance <= 1.5x that checkpoint's floor.
3. **A3S shuffle (qwen-A3):** inherited verbatim from E-Q20: ONE global
   fixed-seed Fisher-Yates permutation (mulberry32(20261018), the
   E-Q9-DT idiom) over the pooled 4096 cells — global, not local.
4. **A2 exclusion (oss-A4):** DECLINED ON FACTS (registered in the
   pre-registration itself).
5. **F0' same-seat scope (qwen-A6):** CONFIRMED, receipted — the
   replay runs in the same sandbox/node as E-Q20's computation.

## Verdict

**BOTH SEATS EARNED.** The two seats found the same critical family
(the floor's statistical definition) from different angles — qwen from
the order-statistic structure, gpt-oss from the metric-conflation
structure — and each contributed unique minors. That is exactly what
the new-member law asks: outside-the-box angles the incumbent seats
miss. The tavern grows to 12 seats.

## RUN-RECEIPT

- Actions run 39140738877 (groq-seat, lane=both, round=r22, target
  experiments/pre_registration_e_q20b.json), completed success
  2026-10-18T15:29:51Z. Egress: Azure US (Des Moines, Iowa, AS8075
  Microsoft) — the geo receipt.
- artifact groq-seat-r22-3 (12141885303, 12408 B) downloaded by the
  orchestrator; canary.jsonl sha256
  129e1371c088797d920a02026b231b560dc86afdc62f3df3869268b5e0719175;
  seat_trial_r22.jsonl sha256
  237af993d018cff7c1862809d8fe32fd164cc11034856cd5e95b59c347855fb7.
- Total Groq spend this lane: canary $0.00006 + trial $0.002133 =
  **$0.002193** (of the $0.05 round cap).
- Prior partial run 39140596417 (qwen PASS live, gpt-oss 400 on
  reasoning_effort=default — the per-model defaults law receipted in
  groq_client.mjs; its superseded partial canary row is NOT sealed
  here; the complete pair from 39140738877 is the sealed record).
