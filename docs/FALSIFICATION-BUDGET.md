# The Falsification Budget (ORCH-40)

> What the house has PAID to know what it knows. Every banked null is a
> mistake downstream systems will never make; every caught defect is a
> process that worked. This ledger is generated from the sealed record by
> `scripts/falsification_budget.mjs` and cites its sources.

## The accounts

| account | count |
|---------|-------|
| stone-v1 chains on disk | 18 (673 rows total) |
| claims priced (LAYER 2 complete) | 6 of 6 (C1, C2, C3, C4, C5, C5') |
| claims surviving | 3 |
| honest nulls / falsifications banked | 7 |
| defects caught by the discipline itself | 9 |

## Banked nulls (the crown jewels)

- **C3 — no critical sigma scale (full tie, monotone-inert)** — priced by E-Q2 (receipts/e_q2_chain.jsonl)
- **C4 — phase threshold falsified under the guest's own rule** — priced by E-Q7 (receipts/e_q7_chain.jsonl)
- **C5 — no self-repair; ring self-dissolves (P1/P2/P3 confirmed)** — priced by E-Q5 (receipts/e_q5_chain.jsonl)
- **P-B1 — fixed-point zero-divergence prediction falsified on 1.6/0.7** — priced by fixedpoint (fixedpoint/findings.md)
- **E-Q14 B3 — zero-pollution cleanliness falsified (convoy + saturation rail)** — priced by E-Q14 (receipts/e_q14_chain.jsonl)
- **G4 — hand-computed literal wrong, kernel right (preserved standing)** — priced by gates (tests/receipts.jsonl)
- **E-Q7 lane expectation — ON/OFF same-regime falsified by own run (nu channel not sign-impotent)** — priced by E-Q7 (commit 55ddced)

## Surviving claims (each with a mechanism explanation)

- **C1 — 47.40% bytes-gain, port-identity held 20/20** — E-Q13 (receipts/e_q13_chain.jsonl)
- **C2 — 8/8 ON vs 0/20 OFF** — E-Q1 (receipts/e_q1_chain.jsonl)
- **C5' — injector semantics, definitional** — E-Q10 (receipts/e_q10_chain.jsonl)

## Defects the discipline caught (none reached a consumer)

- E-Q13 cosmetic %% in verdict string (receipted in commit; chain append-only) — ORCH-1
- C port run-1 fixed-plane pressure missing S-scaling (caught by the battery, repaired, rerun clean) — ORCH-7
- determinism_attacks A2 first draft asserted the wrong semantics (doctrine lesson: the table is hull) — ORCH-20
- E-Q9 primaries comparison-shape defect (caught in-run; full re-run byte-identical) — wave 40-c
- two_reader keeper naive re-hash with wrong canonicalization (corrected by the house verifier) — wave 48-b
- seal_cimpl substring-count bug: summary literal "0 FAIL" sealed a wrong verdict (caught by ORCH-D citation audit; correction row appended, script fixed) — ORCH-D
- arena-r11 harness: .format() on a prompt containing literal JSON braces -> KeyError mid-round (turn-1 rows stood; resume law made the fix free; disclosed in the run commit) — ORCH-R11
- chain-registry drift: verify_all_chains audited 11/16 stone chains, probe_gate 13/16, fleet-seeds pinned 14/16, budget glob missed the gates chain — E-Q15/E-Q16 run commits sealed chains without registering (found by arena-R10 verification; fixed by scripts/chain_registry.mjs single source of truth + PG1 stray-detection) — ORCH-R10
- E-Q16 contentionMonotone aggregate compared q()-stringified numbers lexicographically ("353.57" <= "1387.5" is false as strings, 3 > 1) — both sealed verdict rows read "CONTENTION NOT MONOTONE — autopsy" while the sealed scaling data 353.57 → 1387.5 → 5874.11 writes/slot is strictly monotone increasing; caught by PG6 verdict-recomputation on its FIRST run (erratum row erratum.EQ16_contention_string_compare appended to the e_q16 chain, both runners hardened to parse-before-compare) — PG6 (ORCH-2b)

## The reading

The ratio that matters: 7 banked nulls and 9 caught defects
against zero silent failures. The house's laws (pre-registration, determinism
or it didn't happen, refuse-if-broken chains, honest FAILs standing) have
cost real predictions — and every one of those costs converted into a
boundary the next system inherits for free.
