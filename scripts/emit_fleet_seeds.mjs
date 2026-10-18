// scripts/emit_fleet_seeds.mjs — ORCH-25: emit the fleet-seeds-ready
// ledger entry for qthe (verdicts + chain tips + kernel sha), so every
// experiment result lands in the registry with one command. The registry
// (SuperInstance/fleet-seeds) stays the consumer; this is the producer.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STONE_CHAINS as REGISTRY } from './chain_registry.mjs';
const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const tips = {};
// ORCH-R10: the pin list comes from the single registry (chain_registry.mjs)
// — this script's own list had drifted to 14 of 16 chains (defect #7).
for (const [name, path] of REGISTRY.map((r) => [r.pin, r.path])) {
  tips[name] = existsSync(join(ROOT, path))
    ? { sha256: sha(join(ROOT, path)), rows: readFileSync(join(ROOT, path), 'utf8').split('\n').filter((l) => l.trim()).length }
    : 'MISSING';
}

const entry = {
  kind: 'fleet-seeds.entry', repo: 'SuperInstance/qthe', emitted_by: 'scripts/emit_fleet_seeds.mjs (ORCH-25)',
  kernel_sha256: sha(join(ROOT, 'qthe.mjs')),
  // ORCH-R11 (hy4p self-critique, adopted): pin the REGISTRY's own sha — the
  // single source of truth is itself now a verified artifact; a forged-chain
  // legalization via registry edit fails the dashboard's drift check.
  chain_registry_sha256: sha(join(ROOT, 'scripts', 'chain_registry.mjs')),
  scoreboard: { C1: 'LIVES (E-Q13, 47.40%)', C2: 'LIVES (E-Q1, 8/8 vs 0/20)', C3: 'DIES honest-null (E-Q2)', C4: 'DIES (E-Q7)', C5: 'DIES honest-null (E-Q5)', "C5'": 'STANDS definitional (E-Q10)', C9: 'DIES with prejudice, opposite direction (E-Q18, 0.0066 vs 0.0725 clean)' },
  cross_language: { js_float: 'reference', js_fixed_R8: 'byte-identical on swept sigma', c99: 'BYTE-EXACT 19/19 both planes (cimpl chain)', python_L0: '10,272/10,272 (lane 34-e)' },
  tooling: ['scripts/probe_gate.mjs (mandatory PG1-PG5)', 'scripts/verify_all_chains.mjs', 'scripts/repl.mjs', 'scripts/replay.mjs', 'scripts/falsification_budget.mjs'],
  chain_tips: tips,
};
writeFileSync(join(ROOT, 'experiments', 'outputs', 'fleet_seeds_entry.json'), JSON.stringify(entry, null, 1) + '\n');
console.log('wrote experiments/outputs/fleet_seeds_entry.json');
console.log('kernel sha:', entry.kernel_sha256.slice(0, 16) + '…', '| chains pinned:', Object.keys(tips).length);
