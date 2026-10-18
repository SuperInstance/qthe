# ORCH-R15 REGISTRATION — the creative-citizen round

*Registered before any run. Round ceiling $0.15. Lanes below are frozen; any
deviation gets an erratum, not a silent edit. The round also carries one
unpriced civic lane (T6-d) and one learning lane (T6-e).*

## Round state at open

- qthe main @ `fa75f25` = origin (verified at open; local clean except this
  round's new artifacts).
- r14 close-out: 19 chains + 14 tip agreements ALL CLEAN, gate PASS
  (links=19, tip `c18d0743…`), CI live, MIT licensed.
- Gift PRs `gitpp-reading-room#1` + `jev-semantic#1`: OPEN, unanswered at
  round open (checked 2026-10-18 ~02:2xZ). Watch only; answer on the branch
  if asked.
- Seedbox watch: continuous duty (T6-d).

## T6-a — Hy4 verify-tier cascade re-price (TRIGGERS the r13 pointer)

The r13 standing decision banked the battery as a triage signal because arm-1
(the earned loop) was cheap ($0.00034/finding). The re-registration pointer:
"if the tavern ever runs expensive adjudicator seats (Hy4 at $0.016/audit) as
the verify tier, re-run this sweep with arm-1 priced at seat prices — the
economics flip when the expensive tier is actually expensive." The r14
next-registered clause makes it conditional. **This lane triggers the
condition by measurement**: Hy4-preview runs as the verify tier on the sealed
corpus, and the sweep is re-priced from measured seat prices.

- Corpus: the 90 sealed items + ground truth (`situations/sde_cascade/
  ground_truth_table.json`, labels receipted at seal time; NO re-labeling).
- Verify tier: `tencent/Hy4-preview` via DeepInfra
  (`/v1/openai/chat/completions`), temperature 0, max_tokens 4000, one item
  per call (audit-seat semantics: the expensive tier sees one finding at a
  time). State = the group's sealed briefing verbatim (`extract_prefix` of
  `arena_deepinfra.py` / `arena_r11.py`, same shas as the sealed battery run)
  + the item verbatim. Output: JSON `{id, verdict: BAD|CLEAN|JUDGMENT,
  reason}` — verdict vocabulary identical to the ground truth's.
- Sub-sample (budget law; frozen BEFORE any call; seed 33001 via
  `random.Random(33001).sample`): all 14 BAD; 14 of 43 CLEAN; 6 of 33
  JUDGMENT = **34 audit calls**. The sealed sub-sample list is written to
  `reprice_subsample.json` before the first call.
- Arms (re-priced):
  - all-expensive-90: cost = 90 × measured per-audit cost; quality = Hy4
    recall on BAD (measured on all 14 — the full BAD stratum is in the
    sub-sample by construction) + false-BAD rate on CLEAN.
  - cascade@0.7: cost = $0.012118 (battery, sealed) + 28 × measured
    per-audit cost; quality = battery-gated ceiling (10/14) × Hy4 recall on
    the escalated BAD subset (measured where escalated ∩ sub-sample).
- Falsifiers (frozen):
  - F-a (validity): the re-price counts only if Hy4's BAD recall on the
    sub-sample ≥ 6/14 — otherwise the verify tier underperforms the battery
    itself and the r13 verdict stands on new grounds (report AS-SAID).
  - F-b (dominance): the cascade dominates iff it is strictly better on one
    axis (recall, cost) and no worse on the other vs all-expensive-90.
  - F-c (cache law): per-audit cost is reported BOTH raw and
    prefix-cache-aware (grouped call order so calls 2+ within a briefing hit
    the 20× discount) — the table carries the honest number a fleet seat
    would actually pay.
- Lane ceiling: **$0.10**, fail-stop, spend receipted per call in
  `reprice_rows.jsonl`.

## T6-b — subject-key battery completion (the r14 next-registered clause)

"Complete them BEFORE any call" — the fill-in template
(`situations/entity_alignment/cross_exam_preregistration_template.md`) is
completed against the sealed alignment corpus (parts 1+2, shas already
sealed), validated by the standing validator, sealed (sha256 of canonical
JSON §0–§5, `sealed_before_first_call_at`). **Zero LLM calls in this lane.**
The one-line test governs: every subject_key cell fillable by string
concatenation from §1+§2, or the lane files what's missing as curator work.

## T6-c — Cloudflare readiness (learning lane, tokenless)

The operator's message names a Cloudflare token that was not attached; the
tokenless move is to LEARN from the fleet's live patterns (`quilt-cloudflare`
Workers+D1+Vectorize+KV+R2 runtime, `quilt-elf` background housekeeping,
`gitpp-fold-edge` edge fold) and write `docs/CLOUDFLARE-DEPLOYMENT.md` — the
qthe-on-Workers design (Durable Objects for tick orchestration, Vectorize for
hyper-embedding storage, Pages for the A2UI mirror) so the design is
plug-and-play when the token arrives. Design doc only; no deploy, no spend.

## T6-d — fleet watch (civic, unpriced)

Seedbox (are the three r14 seeds being worked?), the two PRs, and the day's
new sibling repos (peanut-gallery-npm, tminus-dispatcher, synoptic-sheet,
moldmaker) — read, learn, receipt anything load-bearing in
`situations/MODEL-LEARNINGS.md` or the round report.

## T6-e — creative citizenship (DONE at registration time)

Two pieces committed to `SuperInstance/AI-Writings` (commits `ffab050f91`
poem, `ef399d3f0a` story, `0f7710eb87` INDEX addendum), team-reviewed
before push (Seed-2.0-mini / DeepSeek-V4.1-Flash / MiMo-V2.6-Flash, opinions
AS-SAID in `situations/creative_r15/opinions_r15.jsonl`; spend $0.0000 at
registration-time accounting — receipts in the JSONL).

---

## ERRATUM 1 + AMENDMENT 1 (T6-a, filed mid-run BEFORE continuing — append-only)

**Erratum 1 — the price basis was wrong.** The registration priced via house
constants; DeepInfra's `usage.estimated_cost` is authoritative and higher:
Hy4-preview returns **2,400 reasoning tokens on EVERY call** (96% of output;
temperature 0 does not disable thinking), so the real cache-warm audit price
is **~$0.0066/call** ($0.0084 cache-cold), not my $0.0045 estimate. After 9
sealed calls the lane stands at **$0.0608 real** (vs $0.0409 by the wrong
constants). The ceiling is hereafter evaluated on `estimated_cost`. The
constants stay in the script as fallback only.

**Amendment 1 — BAD-first call ordering (ceiling survival).** At the real
price the $0.10 ceiling lands at ~24 calls; the frozen sort (briefing-grouped
alphabetical) would spend the budget on grounding CLEAN/JUDGMENT items before
reaching the r10/r11 BAD stratum, breaking the F-a recall denominator.
Remaining calls are re-ordered: **all BAD first** (briefing-grouped within
the stratum), then CLEAN, then JUDGMENT. Expected coverage at ceiling: 14/14
BAD, ~7/14 CLEAN (false-BAD rate receipted as partial), ~2-6 JUDGMENT.
Coverage losses are receipted in the analysis, not silently dropped.

**Load-bearing finding already earned (banked at erratum time):** for a
reasoning-model verify tier, the prefix cache barely moves the seat price
($0.0084 → $0.0066, 21%) because reasoning tokens dominate and are never
cached. The r11 law "multi-turn rounds cash the discounts" does NOT transfer
to audit seats on reasoning models. Pointer (not this round): price a
low-reasoning Hy4 seat if the API exposes the knob.

## AMENDMENT 2 (T6-a, filed after killing the resumed run — append-only)

**The fail-stop was not cumulative.** The resumed process counted only its own
new spend, so the $0.10 lane ceiling would have been evaluated against $0 of
prior spend (real prior: $0.0608 over 10 calls). Killed before the next call
completed; one in-flight call (claim-f06, ~$0.0066) may have completed
server-side unreceipted — counted against the lane as a dead call.

**Lane ceiling raised to $0.13** under the round-ceiling law: the round
ceiling is $0.15 and no other priced lane remains (creative round $0.000);
the binding constraint is the round, not the lane. Justification: at the real
$0.0066/audit, $0.10 buys 11/14 of the BAD stratum — the F-a recall
denominator broken; $0.13 buys the full denominator (14/14) plus ~4 CLEAN.
Cumulative accounting is now initialized from the rows file. This amendment
is filed BEFORE the spend it authorizes.
