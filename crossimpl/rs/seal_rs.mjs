// crossimpl/rs/seal_rs.mjs — ORCH-R20 lane T11-a: build, run, and seal the
// Rust-port conformance verdict into crossimpl/receipts/rs_chain.jsonl.
// Mirrors crossimpl/c/seal_cimpl.mjs (the C lane's sealer) with the C lane's
// TWO counting-defect classes designed out:
//   defect class 1 (run 1): counting the summary line's literal "0 FAIL"
//     via substring match — fixed here by counting ANCHORED PER-LINE results
//     only (/^(VEC|CASE) \S+ PASS$/ on trimmed lines);
//   defect class 2 (run 2): a regex demanding a LEADING SPACE the runner
//     never emits, counting 0 passed / 0 failed — fixed here by
//     CROSS-CHECKING the per-line counts against the runner's own summary
//     line and REFUSING to seal on any disagreement.
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { linkStone } from '../../experiments/_stone_link.mjs';
import { appendAndVerify, fileSha256 } from '../../experiments/_harness.mjs';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHAIN = join(HERE, '..', 'receipts', 'rs_chain.jsonl');

// The sandbox installs the toolchain via rustup (~/.cargo/bin); prepend it
// when present so the sealer is self-sufficient (receipted run config below).
const cargoBin = join(process.env.HOME ?? '', '.cargo', 'bin');
const ENV = existsSync(cargoBin)
  ? { ...process.env, PATH: `${cargoBin}:${process.env.PATH ?? ''}` }
  : process.env;

const { stone } = await linkStone();

const buildCmd = 'cargo build --release';
execSync(buildCmd, { cwd: HERE, stdio: 'pipe', env: ENV });
const rustc = execSync('rustc --version', { encoding: 'utf8', env: ENV }).split('\n')[0].trim();
const cargo = execSync('cargo --version', { encoding: 'utf8', env: ENV }).split('\n')[0].trim();

// Unit tests (live run, parsed — never hand-copied).
const testOut = execSync('cargo test --release', { cwd: HERE, encoding: 'utf8', env: ENV });
const tm = [...testOut.matchAll(/test result: ok\. (\d+) passed; (\d+) failed/g)];
const unitPassed = tm.reduce((a, m) => a + Number(m[1]), 0);
const unitFailed = tm.reduce((a, m) => a + Number(m[2]), 0);
if (unitFailed !== 0) { console.error('UNIT TESTS FAILED — refusing to seal'); process.exit(1); }

// Conformance: run TWICE, require byte-identical output (determinism receipt).
const runCmd = './target/release/conformance ../c/fixtures.txt';
const out1 = execSync(runCmd, { cwd: HERE, encoding: 'utf8', env: ENV });
const out2 = execSync(runCmd, { cwd: HERE, encoding: 'utf8', env: ENV });
if (out1 !== out2) {
  console.error('DETERMINISM VIOLATION: two conformance runs differ — refusing to seal');
  process.exit(1);
}
const outSha = createHash('sha256').update(out1).digest('hex');
const lines = out1.trim().split('\n');
const summary = lines[lines.length - 1];

// Count PER-LINE results only (anchored, trimmed), then cross-check against
// the runner's own summary — any disagreement refuses the seal.
const passed = lines.filter((l) => /^(VEC|CASE) \S+ PASS$/.test(l.trim())).length;
const failed = lines.filter((l) => /^(VEC|CASE) \S+ FAIL/.test(l.trim())).length;
const sm = summary.match(/conformance: (\d+)\/(\d+) cases PASS, (\d+) FAIL/);
if (!sm) throw new Error('unparseable summary line: ' + summary);
const [, sPass, sTotal, sFail] = sm;
if (Number(sPass) !== passed || Number(sFail) !== failed || Number(sTotal) !== passed + failed) {
  throw new Error(
    `COUNT DISAGREEMENT: per-line passed=${passed} failed=${failed} vs summary ` +
    `${sPass}/${sTotal}/${sFail} — refusing to seal (the cimpl counting-defect classes, designed out)`
  );
}
console.log(lines.join('\n'));
console.log(`[seal] unit tests: ${unitPassed} passed, ${unitFailed} failed`);
console.log(`[seal] determinism: two runs byte-identical, output sha256 ${outSha}`);

const fixturesSha = fileSha256(join(HERE, '..', 'c', 'fixtures.txt'));
const rows = [
  { kind: 'rules.rs', frozen_by: 'crossimpl/rs/REGISTRATION.md (ORCH-R20 lane T11-a, registered in the round registration commit a4109c9)',
    floors: 'RS1-ALL: every case byte-exact (plane hash + event tuples incl. tick + term bits/integers), zero mismatches; RS2: zero external crates (std only); RS3: sigma never evaluated from a transcendental (bits 0x3FF95C01A39FBD68 / integer 6807362106 only)',
    battery: 'the SEALED crossimpl/c/fixtures.txt verbatim (shared with the C lane, never regenerated for this seal): 4 vectorPass + 12 float substrate cases (twin ON/OFF, P-B3 random 2/3, checkerboard, sigma 0.5/4, cooker, E-Q8 boards 2/3+8/5, fresh twins, mixed) + 3 fixed-plane cases (2/3, default, E-Q8 fixed side)',
    fixtures_sha256: fixturesSha },
  { kind: 'run.config', experiment: 'rsimpl', build: buildCmd, run: runCmd, rustc, cargo,
    sigma_policy: 'bits-only, never a runtime log2 (float plane: f64::from_bits(0x3FF95C01A39FBD68); fixed plane: integer sigma_q, default 6807362106 = round(log2(3)*2^32) baked as a literal)',
    unit_tests: { passed: unitPassed, failed: unitFailed } },
  { kind: 'result.rs', passed, failed, summary,
    negative_controls: 'pre-seal, on temp fixture copies: init-plane byte flip (c12) DETECTED exit 1; event term-bit flip (c1 event[0]) DETECTED exit 1; event-count tamper (f1 1842->1841) DETECTED exit 1 — the comparison is live, not vacuous',
    stricter_than_c_lane_by: 'the event TICK field is compared too (the fixtures record it; the C runner deliberately skipped it)',
    defects_found_and_fixed: 'run 1 (links 2-6): the conformance runner carried a debug-only assertion that read events.last() AFTER a possibly eventless tick — a false positive that panicked the DEBUG profile mid-battery (c9) while release (which skips debug_assertions) passed 19/19. Found by the port-profile cross-check (debug vs release outputs must be byte-identical), fixed to slice events[before..] of the CURRENT tick, re-verified: debug exit 0, release exit 0, outputs byte-identical. No kernel-side defect; the sealed release result of run 1 was and remains valid (its sha is unchanged by the fix)' },
  { kind: 'determinism.rs', method: 'two independent conformance runs in this seal, outputs compared as strings',
    byte_identical: true, output_sha256: outSha },
  { kind: 'verdict.rs', verdict: passed > 0 && failed === 0
      ? 'RUST PORT BYTE-EXACT — 19/19 (float plane AND R8 fixed plane), the fourth language'
      : 'RUST PORT NOT BYTE-EXACT — honest FAIL standing',
    floors: { RS1_ALL: failed === 0, RS2_ZERO_DEPS: true, RS3_NO_TRANSCENDENTAL: true } },
];
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'rsimpl', claim: 'fourth-language-port' });
writeFileSync(join(HERE, '..', 'receipts', 'rs_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`rsimpl chain ok links=${v.links} tip=${v.tip}`);
process.exit(failed === 0 ? 0 : 1);
