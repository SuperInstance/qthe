// scripts/emit_fleet_seeds.mjs — ORCH-25: emit the fleet-seeds-ready
// ledger entry for qthe (verdicts + chain tips + kernel sha), so every
// experiment result lands in the registry with one command. The registry
// (SuperInstance/fleet-seeds) stays the consumer; this is the producer.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const tips = {};
for (const [name, path] of [
  ['gates_G0_G6', 'tests/receipts.jsonl'], ['crossimpl_py', 'crossimpl/receipts/crossimpl_chain.jsonl'],
  ['crossimpl_c', 'crossimpl/receipts/cimpl_chain.jsonl'], ['fixedpoint_R8', 'fixedpoint/receipts/fixedpoint_chain.jsonl'],
  ['e_q1_C2', 'receipts/e_q1_chain.jsonl'], ['e_q2_C3', 'receipts/e_q2_chain.jsonl'], ['e_q5_C5', 'receipts/e_q5_chain.jsonl'],
  ['e_q6_slots', 'receipts/e_q6_chain.jsonl'], ['e_q7_C4', 'receipts/e_q7_chain.jsonl'], ['e_q8_float_artifact', 'receipts/e_q8_chain.jsonl'],
  ["e_q10_C5i", 'receipts/e_q10_chain.jsonl'], ['e_q13_C1', 'receipts/e_q13_chain.jsonl'], ['e_q14_adversarial', 'receipts/e_q14_chain.jsonl'],
  ['probe_gate', 'receipts/probe_gate_chain.jsonl'],
]) {
  tips[name] = existsSync(join(ROOT, path))
    ? { sha256: sha(join(ROOT, path)), rows: readFileSync(join(ROOT, path), 'utf8').split('\n').filter((l) => l.trim()).length }
    : 'MISSING';
}

const entry = {
  kind: 'fleet-seeds.entry', repo: 'SuperInstance/qthe', emitted_by: 'scripts/emit_fleet_seeds.mjs (ORCH-25)',
  kernel_sha256: sha(join(ROOT, 'qthe.mjs')),
  scoreboard: { C1: 'LIVES (E-Q13, 47.40%)', C2: 'LIVES (E-Q1, 8/8 vs 0/20)', C3: 'DIES honest-null (E-Q2)', C4: 'DIES (E-Q7)', C5: 'DIES honest-null (E-Q5)', "C5'": 'STANDS definitional (E-Q10)' },
  cross_language: { js_float: 'reference', js_fixed_R8: 'byte-identical on swept sigma', c99: 'BYTE-EXACT 19/19 both planes (cimpl chain)', python_L0: '10,272/10,272 (lane 34-e)' },
  tooling: ['scripts/probe_gate.mjs (mandatory PG1-PG5)', 'scripts/verify_all_chains.mjs', 'scripts/repl.mjs', 'scripts/replay.mjs', 'scripts/falsification_budget.mjs'],
  chain_tips: tips,
};
writeFileSync(join(ROOT, 'experiments', 'outputs', 'fleet_seeds_entry.json'), JSON.stringify(entry, null, 1) + '\n');
console.log('wrote experiments/outputs/fleet_seeds_entry.json');
console.log('kernel sha:', entry.kernel_sha256.slice(0, 16) + '…', '| chains pinned:', Object.keys(tips).length);
