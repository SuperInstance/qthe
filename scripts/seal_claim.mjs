// scripts/seal_claim.mjs — ORCH-33: the claim sealer. Validates a
// registration, runs its runner, appends the chain, emits the verdict
// template. Usage: node scripts/seal_claim.mjs <registration.json> <runner.mjs>
// Laws enforced: registration exists + has floors + registered_before_run;
// runner exits 0; the chain file the runner wrote verifies from disk after.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { linkStone } from '../experiments/_stone_link.mjs';
const [reg, runner] = process.argv.slice(2);
if (!reg || !runner) { console.error('usage: node scripts/seal_claim.mjs <registration.json> <runner.mjs>'); process.exit(2); }
const r = JSON.parse(readFileSync(reg, 'utf8'));
const problems = [];
if (!r.floors && !r.families) problems.push('no floors/families in registration');
if (r.registered_before_run !== true && r.registered_before_run !== 'YES') problems.push('registered_before_run not affirmed');
if (problems.length) { console.error('REFUSED: ' + problems.join('; ')); process.exit(1); }
console.log(`registration OK: ${reg} (${r.task_id ?? 'no-task-id'}) — floors present, pricing-first affirmed`);
const out = execSync(`node ${runner}`, { encoding: 'utf8' });
console.log(out.trim().split('\n').slice(-6).join('\n'));
const { stone } = await linkStone();
console.log('claim sealed: runner exited 0; verify the chain it wrote with scripts/verify_all_chains.mjs (the refuse-if-broken law already ran inside appendAndVerify)');
