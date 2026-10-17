# ARENA R10 VERDICT — the eight-seat audit, verified and priced

> Round 10 of the tavern, reopened on DeepInfra (rounds 6–9 ran DeepSeek-native;
> r9 fail-closed when that key left the workspace). One immutable briefing
> (prefix sha `5d44a0d1…`, 8,882 chars), one identical audit task, eight
> competing seats. **Every finding below was verified by the orchestrator
> against the repository itself** — model claims are hypotheses until they
> survive that check, exactly as the briefing promised the seats.
> Ledger: `situations/arena_rows_r10.jsonl` (9 rows, content sealed AS SAID).
> Economics: `situations/cache_economics_r10.json` — 9 calls, 21,997 prompt /
> 47,852 completion tokens, **$0.0509 total**. The only cache hit of the round
> is honest and structural: Ling's amendment call reused its own first call's
> prefix (2,432 tokens) — single-call seats cannot hit cache by construction;
> the per-seat discount table prices FUTURE rounds, not this one.

## The scoreboard

Scoring: **verified_new** = true, not already conceded by the corpus, and
implies an action; **already_admitted** = true but the briefing conceded it
(the rule priced restatements); **plausible** = could be true, not settleable
from the briefing; **misstated** = misreads the sealed record or invents an
interface (penalized).

| seat | findings | verified_new | already_admitted | plausible | misstated | cost |
|---|---|---|---|---|---|---|
| **mimov26f** | 6 | **6** | 0 | 0 | 0 | $0.0012 |
| **dsv41f** | 7 | **5** | 1 | 1 | 0 | $0.0018 |
| **hy4p** | 6 | **5** | 0 | 1 | 0 | $0.0160 |
| **nemotron35sv** | 7 | **3** | 4 | 0 | 0 | $0.0024 |
| **seed20mini** | 5 | 0 | 5 | 0 | 0 | $0.0023 |
| **musegl30b** | 5 | 0 | 3 | 1 | 1 (+ invented CLI flags) | $0.0056 |
| **qwen3635b** | 4 | 0 | 2 | 1 | 1 | $0.0045 |
| **ling31f** | 0 (contract failed ×2) | — | — | — | — | $0.0171 |

**Reading.** The cheap efficiency seats (MiMo $0.0012, DeepSeek $0.0018)
delivered the two strongest audits — the cache-game thesis priced in its
first round: the seats with the biggest cache discounts are the seats you can
afford to run every round. Hy4 (the expensive flagship) matched their quality
at 13× the cost: reserve it for adjudication, not drafting. Seed and Muse
restated admitted gaps (Seed's severities even arrived typo'd — `ajor`,
`inor` — sealed verbatim per the AS-SAID law). Qwen hallucinated a mechanism
(physical cache eviction "breaking byte-determinism" — M6 determinism is
arithmetic, not memory placement). Muse invented CLI flags
(`probe_gate --experiment`, `verify_all_chains --list`) — the exact penalty
class the briefing named.

## The verified findings, and what they change

1. **C3's null is formation-scoped, and the corpus never says so next to the
   headline** (mimov F2, dsv F4, nemotron F2 — three seats, independent).
   E-Q2 sealed "sigma monotone-inert" on bridge *formation*; E-Q16-B sealed
   completion scaling ~1/σ (38→3 ticks over σ 0.25→4). Both are true; the
   scoreboard language invites an adopter to read C3 as "sigma does nothing."
   → **ACTION: scope note in SPEC.md C3 row + CLAIM-VERDICTS.md +
   BOUNDARY-MAP.md** (this batch).
2. **"Delivery robust to 256 polluters" is baseline-relative** (mimov F1,
   dsv F2, verified against `e_q14_results.json`): the zero-pollution arm
   ALSO delivers 80/80 while failing its provenance floor (B3 False) —
   delivery was at ceiling before pollution was added; what pollution costs
   is provenance, already compressed at zero. The DELIVERY-robust /
   PROVENANCE-fragile boundary stands; the robustness *phrasing* must not
   imply pollution threatened delivery. → **ACTION: BOUNDARY-MAP note.**
3. **"Locality holds to 256×256" can be misread as table capacity**
   (hy4 F2): per-cell firing stability is grid-size-independent; the 64-slot
   table itself is a hard capacity bound, receipted as contention
   353→5,874 writes/slot (~100× oversubscription at 256²/10% Abstain). Both
   numbers are sealed; the interpretation risk is real. → **ACTION:
   BOUNDARY-MAP grid row wording.**
4. **E-Q16's correction row does not name the run-1 rows it supersedes**
   (mimov F5, verified: prose only, no row-id linkage). → **ACTION: append an
   erratum row to the e_q16 chain naming the superseded rows (append-only).**
5. **The seedFn harness-contamination question closes clean** (dsv F3, the
   sharpest single finding of the round): sweep shows the rng-at-call-time
   pattern was E-Q16-local (e_q10's closure is pure geometry; the shared
   `seedFnFrom` is pair-deterministic), and the corpus's own run-twice F0
   floors are the mechanical detector — a latent bug of this class would
   have failed determinism exactly as E-Q16's run-1 did. → **ACTION: receipt
   this closure in DEVELOPER-GUIDE.**
6. **C1's caveat deserves a "state your byte budget" pointer** (mimov F3,
   hy4 F3, nemotron F6): the traffic-model gain (47.40%) and the
   tau-plane-residency caveat (4,096 B standing) are both sealed; comparisons
   must say which bytes they count. → **ACTION: CLAIM-VERDICTS note.**
7. **The license gap bites deeper than "one commit"** (mimov F6, dsv F5,
   hy4 F6): selfcheck S1–S5 asserts the package is whole but not that it is
   distributable; the distribution roots (qthe-core/, crossimpl/c/, py/) are
   multiple. → **ACTION: LICENSE (MIT) at root + qthe-core/LICENSE +
   LICENSE-NOTE rewrite; flagged for owner veto (MIT-0/Apache-2.0 are
   one-commit alternatives).**
8. **E-Q9/11/12 stand outside the gate's coverage** (mimov F4, hy4 F5,
   nemotron F4): true and registered — and the orchestrator's own
   verification found the **worse, adjacent instance**: the standing auditors
   had drifted (see the defect below). hy4's falsifier *predicted* the
   silent-skip class; the actual hit was e_q13–e_q16, not E-Q9/11/12.

## The orchestrator-found defect (found while verifying this round)

**Chain-registry drift.** Four hand-maintained chain lists, four different
counts, none matching disk: `verify_all_chains.mjs` verified 11 of 16 stone
chains (silent on e_q13, e_q14, e_q15, e_q16, probe_gate — the four chains
the orchestration itself sealed); `probe_gate.mjs` covered 13 (missing e_q15,
e_q16, its own chain); `emit_fleet_seeds.mjs` pinned 14 (missing e_q15,
e_q16); `falsification_budget.mjs`'s auto-discovery missed
`tests/receipts.jsonl` (pattern mismatch); PHASES-REPORT said 14. The
DEVELOPER-GUIDE law ("register the chain at registration time") was violated
by exactly the two experiments sealed after the last gate update (E-Q15,
E-Q16). **Correction batch:** all lists repaired to the true inventory
(16 stone chains + 2 content-hash tips), gate re-sealed at 16-chain scope,
fleet seeds / budget / dashboard regenerated, defect #7 banked in the
falsification budget. **Mechanism:** `scripts/chain_registry.mjs` — one
source of truth + PG1 stray-detection: a chain file on disk that is not in
the registry fails the gate. The sealing commit registers the chain — same
commit, always; the next unregistered seal becomes impossible to miss.

## Ling: the contract failure with a gem inside

Ling-3.1-flash failed the output contract twice (6,000 then 12,000 tokens,
finish=length both times, reasoning never terminates into the JSON body).
Priced as a failure. But its sealed reasoning (`reasoning_raw`, 46,657
chars, verbatim in the row) contains the round's deepest uncontracted
insight: **"the verification corpus proves integrity, not soundness"** — the
gates re-verify hashes and tamper-refusal, but no gate recomputes a verdict
from its sealed trace. → **ADOPTED: PG6 verdict-recomputation arm registered
in DEVELOPER-GUIDE as the next gate extension** (spec now, build priced
against the registry work). An auditor that cannot follow the output
contract still shipped the best meta-finding — the ledger keeps both facts.

## Disposition

- Findings 1–8 + the registry defect: **fix batches landed this round**
  (see the commits following the run commit; each names its findings).
- PG6 (Ling's gem): registered, next gate extension.
- Missing experiments proposed by seats (E-Q17 provenance-correct wormhole at
  scale; edge hardware; harness sweep) — recorded here as the seats' priced
  proposals; the harness sweep is CLOSED by finding 5; hardware remains
  gap #2; E-Q17-provenance is a candidate for the next registration, priced
  against HIERARCHICAL-WORMHOLES' second-consumer trigger.

## Postscript (same round, key unblocked): the Jev judgment layer, priced

The TypeSafe key returned mid-round; `situations/jev_judge.py judge` ran
Jev 1.13.0 over all seven parseable seats (batched parallel-questions
pattern: ~230 ms and one call per seat, judgments sealed in
`situations/jev_judgments_r10.jsonl` with responses verbatim).

**The finding that matters: the grounding gap.** Jev's classifications
track the orchestrator's verified verdict on severity and actionability
(tight, consistent rubric scores ~1.8–1.9 across seats) — but Jev flagged
**zero hallucinations in 40 findings**, including Qwen's invented
cache-eviction mechanism (Jev: 4/4 verified_new; repo-verified truth: 0/4)
and Muse's invented CLI flags (Jev: 2 verified_new). A briefing-only judge
cannot see the repository; plausible-looking prose passes. This is Xing's
closed-room critique — latent judgment without generative re-grounding —
observed live inside the tavern, at 230 ms and $0.00 per seat.

**Disposition:** the judge layer is adopted as FIRST-PASS TRIAGE (severity,
actionability, noul-routed review), never as the verdict. Verification
against the repository remains the load-bearing wall. This law is now in
`situations/MODEL-LEARNINGS.md` §5 and prices every future round: judges
draft, the repo decides.
