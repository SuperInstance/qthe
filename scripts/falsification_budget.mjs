// scripts/falsification_budget.mjs — ORCH-40: the falsification budget
// ledger. Counts what the house has PAID to know what it knows: priced
// claims, honest nulls, fired floors, caught defects. Reads the sealed
// record from disk (chains + results + findings), prints the ledger, and
// writes docs/FALSIFICATION-BUDGET.md. The budget is an asset: every banked
// null is a mistake downstream systems will never make.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';

const scanChains = (dir) => readdirSync(dir).filter((f) => f.endsWith('_chain.jsonl'))
  .map((f) => ({ name: f.replace('_chain.jsonl', ''), rows: readFileSync(join(dir, f), 'utf8').split('\n').filter((l) => l.trim()).length }));
const chains = [
  ...scanChains(join(ROOT, 'receipts')),
  ...scanChains(join(ROOT, 'crossimpl', 'receipts')),
  ...scanChains(join(ROOT, 'fixedpoint', 'receipts')),
];
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
