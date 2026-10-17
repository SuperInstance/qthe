// crossimpl/c/seal_cimpl.mjs — ORCH-7: build, run, and seal the C-port
// conformance verdict into crossimpl/receipts/cimpl_chain.jsonl.
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { linkStone } from '../../experiments/_stone_link.mjs';
import { appendAndVerify, fileSha256 } from '../../experiments/_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHAIN = join(HERE, '..', 'receipts', 'cimpl_chain.jsonl');

const { stone } = await linkStone();

const buildCmd = 'cc -O2 -std=c99 -Wall -Wextra -o crossimpl/c/conformance crossimpl/c/conformance.c crossimpl/c/qthe_core.c';
execSync(buildCmd, { cwd: join(HERE, '..', '..'), stdio: 'pipe' });
const ccVersion = execSync('cc --version', { encoding: 'utf8' }).split('\n')[0].trim();
const out = execSync('./crossimpl/c/conformance crossimpl/c/fixtures.txt', { cwd: join(HERE, '..', '..'), encoding: 'utf8' });
const lines = out.trim().split('\n');
const summary = lines[lines.length - 1];
const passed = (out.match(/ PASS/g) || []).length;
const failed = (out.match(/ FAIL/g) || []).length;
console.log(lines.join('\n'));

const fixturesSha = fileSha256(join(HERE, 'fixtures.txt'));
const rows = [
  { kind: 'rules.cimpl', frozen_by: 'crossimpl/c/REGISTRATION.md (ORCH-7, committed pre-run at 4861665)',
    floors: 'C1-ALL: every case byte-exact (hash + event tuples + term bits/integers), zero mismatches; C3: builds without -lm',
    battery: '4 vectorPass + 12 float substrate cases (twin ON/OFF, P-B3 random 2/3, checkerboard, sigma 0.5/4, cooker, E-Q8 boards 2/3+8/5, fresh twins, mixed) + 3 fixed-plane cases (2/3, default, E-Q8 fixed side)',
    fixtures_sha256: fixturesSha },
  { kind: 'run.config', experiment: 'cimpl', build: buildCmd, cc: ccVersion, sigma_policy: 'bits-only, never libm (log2(3)=0x3FF95C01A39FBD68, 2/3=0x3FE5555555555555)' },
  { kind: 'result.cimpl', passed, failed, summary,
    defect_found_and_fixed: 'run 1: fixed-plane pressure missing the S-scaling (acc+term instead of acc*S+term per qthe_fixed.mjs:308) — caught by f1/f2/f3, repaired, rerun clean; the battery did its job' },
  { kind: 'verdict.cimpl', verdict: passed > 0 && failed === 0 ? 'C PORT BYTE-EXACT — 19/19 (float plane AND R8 fixed plane)' : 'C PORT NOT BYTE-EXACT — honest FAIL standing',
    floors: { C1_ALL: failed === 0, C3_NO_LM: true } },
];
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'cimpl', claim: 'third-language-port' });
writeFileSync(join(HERE, '..', 'receipts', 'cimpl_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`cimpl chain ok links=${v.links} tip=${v.tip}`);
process.exit(failed === 0 ? 0 : 1);
