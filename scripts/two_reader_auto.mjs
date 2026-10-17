// scripts/two_reader_auto.mjs — ORCH-22: bidirectional two-reader discipline
// as ONE command (the wave-48 rule made automatic): run the qthe-side reader
// over its own chains AND the counterpart chains it can see, run the
// selftest, pin the verdict. Zero shared code with crab-traps (the original
// installment's law); this automates the qthe side.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const run = (cmd) => { try { return { cmd, ok: true, out: execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').slice(-3).join(' | ') }; } catch (e) { return { cmd, ok: false, out: String(e.message).slice(0, 200) }; } };
const steps = [run('node two_reader/selftest.mjs'), run('node scripts/verify_all_chains.mjs')];
// the cross-repo reader needs the crab-traps counterpart; absent -> ARMED-SKIPPED (receipted, not a failure)
const counterpart = existsSync(join(ROOT, '..', 'crab-traps'));
const cross = counterpart ? run('node two_reader/run.mjs') : { cmd: 'node two_reader/run.mjs', ok: true, out: 'ARMED-SKIPPED: crab-traps counterpart not cloned in this workspace (the bidirectional rule stays armed)' };
steps.push(cross);
for (const s of steps) console.log(`${s.ok ? 'PASS' : 'FAIL'} ${s.cmd}\n  ${s.out}`);
// counterpart side: the crab-traps reader runs in ITS repo (bidirectional =
// both sides run their own reader; this emits the reminder row)
console.log(existsSync('../crab-traps') ? 'counterpart repo visible: run its reader there for the full bidirectional rule' : 'counterpart repo not cloned here — the bidirectional rule stays armed: run the crab-traps-side reader in that repo');
process.exit(steps.every((s) => s.ok) ? 0 : 1);
