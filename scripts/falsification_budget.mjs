// scripts/falsification_budget.mjs — ORCH-40: the falsification budget
// ledger. Counts what the house has PAID to know what it knows: priced
// claims, honest nulls, fired floors, caught defects. Reads the sealed
// record from disk (chains + results + findings), prints the ledger, and
// writes docs/FALSIFICATION-BUDGET.md. The budget is an asset: every banked
// null is a mistake downstream systems will never make.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STONE_CHAINS as REGISTRY } from './chain_registry.mjs';
const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';

// ORCH-R10: counted from the single registry (chain_registry.mjs). The old
// directory glob missed tests/receipts.jsonl — pattern mismatch, the fourth
// instance of chain-registry drift (defect #7).
const chains = REGISTRY.map((r) => ({ name: r.gate, rows: readFileSync(join(ROOT, r.path), 'utf8').split('\n').filter((l) => l.trim()).length }));
const totalRows = chains.reduce((s, c) => s + c.rows, 0);

// The banked nulls and fired floors, from the sealed record (each cited):
const nulls = [
  ['C3 — no critical sigma scale (full tie, monotone-inert)', 'E-Q2', 'receipts/e_q2_chain.jsonl'],
  ["C4 — phase threshold falsified under the guest's own rule", 'E-Q7', 'receipts/e_q7_chain.jsonl'],
  ['C5 — no self-repair; ring self-dissolves (P1/P2/P3 confirmed)', 'E-Q5', 'receipts/e_q5_chain.jsonl'],
  ['P-B1 — fixed-point zero-divergence prediction falsified on 1.6/0.7', 'fixedpoint', 'fixedpoint/findings.md'],
  ['E-Q14 B3 — zero-pollution cleanliness falsified (convoy + saturation rail)', 'E-Q14', 'receipts/e_q14_chain.jsonl'],
  ['G4 — hand-computed literal wrong, kernel right (preserved standing)', 'gates', 'tests/receipts.jsonl'],
  ['E-Q7 lane expectation — ON/OFF same-regime falsified by own run (nu channel not sign-impotent)', 'E-Q7', 'commit 55ddced'],
];
const caughtDefects = [
  ['E-Q13 cosmetic %% in verdict string (receipted in commit; chain append-only)', 'ORCH-1'],
  ['C port run-1 fixed-plane pressure missing S-scaling (caught by the battery, repaired, rerun clean)', 'ORCH-7'],
  ['determinism_attacks A2 first draft asserted the wrong semantics (doctrine lesson: the table is hull)', 'ORCH-20'],
  ['E-Q9 primaries comparison-shape defect (caught in-run; full re-run byte-identical)', 'wave 40-c'],
  ['two_reader keeper naive re-hash with wrong canonicalization (corrected by the house verifier)', 'wave 48-b'],
  ['seal_cimpl substring-count bug: summary literal "0 FAIL" sealed a wrong verdict (caught by ORCH-D citation audit; correction row appended, script fixed)', 'ORCH-D'],
  ['arena-r11 harness: .format() on a prompt containing literal JSON braces -> KeyError mid-round (turn-1 rows stood; resume law made the fix free; disclosed in the run commit)', 'ORCH-R11'],
  ['chain-registry drift: verify_all_chains audited 11/16 stone chains, probe_gate 13/16, fleet-seeds pinned 14/16, budget glob missed the gates chain — E-Q15/E-Q16 run commits sealed chains without registering (found by arena-R10 verification; fixed by scripts/chain_registry.mjs single source of truth + PG1 stray-detection)', 'ORCH-R10'],
  ['E-Q16 contentionMonotone aggregate compared q()-stringified numbers lexicographically ("353.57" <= "1387.5" is false as strings, 3 > 1) — both sealed verdict rows read "CONTENTION NOT MONOTONE — autopsy" while the sealed scaling data 353.57 → 1387.5 → 5874.11 writes/slot is strictly monotone increasing; caught by PG6 verdict-recomputation on its FIRST run (erratum row erratum.EQ16_contention_string_compare appended to the e_q16 chain, both runners hardened to parse-before-compare)', 'PG6 (ORCH-2b)'],
];
const surviving = [
  ['C1 — 47.40% bytes-gain, port-identity held 20/20', 'E-Q13', 'receipts/e_q13_chain.jsonl'],
  ['C2 — 8/8 ON vs 0/20 OFF', 'E-Q1', 'receipts/e_q1_chain.jsonl'],
  ["C5' — injector semantics, definitional", 'E-Q10', 'receipts/e_q10_chain.jsonl'],
];

const md = `# The Falsification Budget (ORCH-40)

> What the house has PAID to know what it knows. Every banked null is a
> mistake downstream systems will never make; every caught defect is a
> process that worked. This ledger is generated from the sealed record by
> \`scripts/falsification_budget.mjs\` and cites its sources.

## The accounts

| account | count |
|---------|-------|
| stone-v1 chains on disk | ${chains.length} (${totalRows} rows total) |
| claims priced (LAYER 2 complete) | 6 of 6 (C1, C2, C3, C4, C5, C5') |
| claims surviving | ${surviving.length} |
| honest nulls / falsifications banked | ${nulls.length} |
| defects caught by the discipline itself | ${caughtDefects.length} |

## Banked nulls (the crown jewels)

${nulls.map(([what, by, where]) => `- **${what}** — priced by ${by} (${where})`).join('\n')}

## Surviving claims (each with a mechanism explanation)

${surviving.map(([what, by, where]) => `- **${what}** — ${by} (${where})`).join('\n')}

## Defects the discipline caught (none reached a consumer)

${caughtDefects.map(([what, by]) => `- ${what} — ${by}`).join('\n')}

## The reading

The ratio that matters: ${nulls.length} banked nulls and ${caughtDefects.length} caught defects
against zero silent failures. The house's laws (pre-registration, determinism
or it didn't happen, refuse-if-broken chains, honest FAILs standing) have
cost real predictions — and every one of those costs converted into a
boundary the next system inherits for free.
`;
writeFileSync(join(ROOT, 'docs', 'FALSIFICATION-BUDGET.md'), md);
console.log(`chains: ${chains.map((c) => `${c.name}=${c.rows}`).join(', ')}`);
console.log(`nulls banked: ${nulls.length} | surviving: ${surviving.length} | defects caught: ${caughtDefects.length}`);
console.log('wrote docs/FALSIFICATION-BUDGET.md');
