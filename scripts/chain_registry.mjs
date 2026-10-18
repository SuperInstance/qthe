// scripts/chain_registry.mjs — THE single source of truth for every receipt
// of record in this repository (ORCH-R10 mechanism fix).
//
// ORIGIN OF THIS FILE (the defect it exists to make impossible): arena round
// 10's verification pass found chain-registry drift — four hand-maintained
// lists had diverged from disk and from each other (verify_all_chains
// verified 11 of 16 stone chains, probe_gate 13, emit_fleet_seeds pinned 14,
// falsification_budget's glob missed tests/receipts.jsonl). The E-Q15 and
// E-Q16 run commits sealed chains without registering them — the exact
// failure the DEVELOPER-GUIDE registration law existed to prevent, unenforced.
//
// THE LAW THIS FILE ENFORCES: the commit that seals a chain registers it —
// same commit, always. Registration is adding an entry here. Enforcement is
// strayChainFiles(): every chain-shaped file on disk that is NOT in this
// registry fails the probe gate (PG1) and the chain-of-chains auditor. An
// unregistered seal can no longer pass silently.
//
// Consumers: scripts/verify_all_chains.mjs, scripts/probe_gate.mjs,
// scripts/emit_fleet_seeds.mjs, scripts/falsification_budget.mjs,
// scripts/build_dashboard.mjs. If you are about to hardcode a chain list
// anywhere else, stop — import this file instead.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// path: repo-relative chain file (the receipt of record)
// gate: short scope name used by the probe gate + tip files (<gate>_tip.txt)
// label: human description for the auditors
// pin: fleet-seeds ledger key (emit_fleet_seeds.mjs)
export const STONE_CHAINS = [
  { path: 'tests/receipts.jsonl', gate: 'G0-G6', label: 'kernel gates G0–G6', pin: 'gates_G0_G6' },
  { path: 'crossimpl/receipts/crossimpl_chain.jsonl', gate: 'crossimpl-py', label: 'python LAYER 0 crossimpl', pin: 'crossimpl_py' },
  { path: 'crossimpl/receipts/cimpl_chain.jsonl', gate: 'crossimpl-c', label: 'c LAYER 0+1 crossimpl (ORCH-7)', pin: 'crossimpl_c' },
  { path: 'crossimpl/receipts/rs_chain.jsonl', gate: 'crossimpl-rs', label: 'rust LAYER 0+1 crossimpl (ORCH-R20/T11-a)', pin: 'crossimpl_rs' },
  { path: 'fixedpoint/receipts/fixedpoint_chain.jsonl', gate: 'fixedpoint', label: 'no-floats plane R8', pin: 'fixedpoint_R8' },
  { path: 'receipts/e_q1_chain.jsonl', gate: 'e_q1', label: 'E-Q1 · C2 wormhole', pin: 'e_q1_C2' },
  { path: 'receipts/e_q2_chain.jsonl', gate: 'e_q2', label: 'E-Q2 · C3 sigma sweep', pin: 'e_q2_C3' },
  { path: 'receipts/e_q5_chain.jsonl', gate: 'e_q5', label: 'E-Q5 · C5 armor ring', pin: 'e_q5_C5' },
  { path: 'receipts/e_q6_chain.jsonl', gate: 'e_q6', label: 'E-Q6 · slot collision', pin: 'e_q6_slots' },
  { path: 'receipts/e_q7_chain.jsonl', gate: 'e_q7', label: 'E-Q7 · C4 checkerboard cascade', pin: 'e_q7_C4' },
  { path: 'receipts/e_q8_chain.jsonl', gate: 'e_q8', label: 'E-Q8 · float-only artifact probe', pin: 'e_q8_float_artifact' },
  { path: 'receipts/e_q10_chain.jsonl', gate: 'e_q10', label: "E-Q10 · C5' injector one-pager", pin: 'e_q10_C5i' },
  { path: 'receipts/e_q13_chain.jsonl', gate: 'e_q13', label: 'E-Q13 · C1 gain of function', pin: 'e_q13_C1' },
  { path: 'receipts/e_q14_chain.jsonl', gate: 'e_q14', label: 'E-Q14 · adversarial probes', pin: 'e_q14_adversarial' },
  { path: 'receipts/e_q15_chain.jsonl', gate: 'e_q15', label: 'E-Q15 · reweighting probe', pin: 'e_q15_reweighting' },
  { path: 'receipts/e_q16_chain.jsonl', gate: 'e_q16', label: 'E-Q16 · measurement wave', pin: 'e_q16_measurement' },
  { path: 'receipts/e_q17_chain.jsonl', gate: 'e_q17', label: 'E-Q17 · provenance at scale (ORCH-R12/T3-b)', pin: 'e_q17_provenance_scale' },
  { path: 'receipts/e_q18_chain.jsonl', gate: 'e_q18', label: 'E-Q18 · hierarchical wormholes, population axis (ORCH-R18/T9-a)', pin: 'e_q18_hier_population' },
  { path: 'receipts/probe_gate_chain.jsonl', gate: 'probe_gate', label: 'probe gate runs', pin: 'probe_gate' },
];

// Content-hash receipts that are deliberately NOT stone chains (E-Q9
// precedent: "stone chain not bound by the E-Q9 registration, decision on
// the record"). Audited as present-and-recomputable instead.
export const CONTENT_TIPS = [
  { path: 'experiments/outputs/e_q11_tip.txt', gate: 'e_q11', label: 'E-Q11 · collapse predicate (content-hash receipt)' },
  { path: 'experiments/outputs/e_q12_tip.txt', gate: 'e_q12', label: 'E-Q12 · k-family predicate (content-hash receipt)' },
];

// Every chain-shaped file on disk that the registry does not know about.
// The probe gate and the auditor fail loudly on any stray: a sealed chain
// that was never registered is exactly the defect class this file exists to
// kill. (Chain-shaped = *_chain.jsonl in the three receipt directories, plus
// tests/receipts.jsonl which predates the naming convention.)
export function strayChainFiles(root) {
  const found = new Set();
  if (existsSync(join(root, 'tests/receipts.jsonl'))) found.add('tests/receipts.jsonl');
  for (const d of ['receipts', 'crossimpl/receipts', 'fixedpoint/receipts']) {
    const dir = join(root, d);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('_chain.jsonl')) found.add(`${d}/${f}`);
  }
  const registered = new Set(STONE_CHAINS.map((r) => r.path));
  return [...found].filter((p) => !registered.has(p));
}
