#!/usr/bin/env node
// two_reader/selftest.mjs — lane 48-b NEGATIVE CONTROLS (installment 2).
//
// The two-reader must fail closed. Every claim of detection is only as good
// as its negative controls, so this self-test:
//   (S1) TAMPER SWEEP — flips ONE byte in EVERY row of EVERY registered chain
//        (49 rows) in a scratch copy and requires the reader to exit non-zero
//        with first_failure.row_index == the tampered row (every row carries
//        its own bytes pin, so detection localizes at the tampered row).
//   (S2) MISSING FILE — deletes one row file; reader must fail closed at
//        that row's index.
//   (S3) WRONG TIP — good bytes, wrong --expect-tip; reader must fail closed
//        at the tip check.
//   (S4) TAMPERED USAGE ROW — one flipped byte inside usage.jsonl (a row-set
//        row) must be caught at the usage row's index (named control; also
//        covered by the sweep).
//   (S5) UNKNOWN CHAIN — --chain not in the pin table must exit non-zero.
//   (S6) MUTATED PIN TABLE — one flipped byte inside a copied registration
//        (seal no longer valid) must make the reader REFUSE to walk.
//
// Stdlib-only. Writes run_receipts/self-test-receipt.json. Exit 0 iff every
// case was DETECTED and (where applicable) localized to the correct row.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, mkdtempSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MY_PROJECT = resolve(HERE, '..', '..');
// CRAB resolution (wave 52): env override > bundled fixtures (package context)
// > repo sibling (two_reader/ inside the qthe repo). The probe checks a known
// row directory so a partially-present tree is never silently used.
const CRAB_CANDIDATES = [join(HERE, 'fixtures', 'crab-traps'), resolve(HERE, '..', '..', 'crab-traps')];
const CRAB = process.env.CRAB_TRAPS_PATH ||
  CRAB_CANDIDATES.find((p) => { try { statSync(join(p, 'worker', 'src')); return true; } catch { return false; } }) ||
  CRAB_CANDIDATES[1];
const PINS = join(HERE, 'registration.json');
const READER = join(HERE, 'reader.mjs');
const OUTDIR = join(HERE, 'run_receipts');
const RUN_AT = new Date().toISOString();
mkdirSync(OUTDIR, { recursive: true });

const pins = JSON.parse(readFileSync(PINS, 'utf8'));
const chains = pins.registration.chains;

const results = [];
let escapes = 0;

function scratchTree(chainId) {
  const chain = chains.find((c) => c.id === chainId);
  const root = mkdtempSync(join(tmpdir(), `two-reader-${chainId}-`));
  for (const row of chain.rows) {
    const dst = join(root, row.path);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(join(CRAB, row.path), dst);
  }
  return { root, chain };
}

// ---------- mode detection (wave 52, fleet law A4) ----------
// Strict mtime binding requires the pins file to still carry its sealed mtime.
// Distribution installers (npm) normalize mtimes (receipted epoch 499162500000),
// so in that context the selftest runs with --mtime-witness and receipts the mode.
const sealJson = JSON.parse(readFileSync(PINS, 'utf8'));
const sealedMtimeMs = Date.parse(sealJson.seal?.mtime_local || '');
const pinsStatMtimeMs = statSync(PINS).mtimeMs;
const DISTRIBUTION_CONTEXT = Number.isFinite(sealedMtimeMs) &&
  Math.abs(pinsStatMtimeMs - sealedMtimeMs) > 2;
const MODE_FLAG = DISTRIBUTION_CONTEXT ? ['--mtime-witness'] : [];
const MODE_LABEL = DISTRIBUTION_CONTEXT
  ? 'mtime-witness (distribution context: pins mtime normalized by installer; strict suite would self-refuse — fleet law A4)'
  : 'strict (pins mtime matches seal.mtime_local; mtime binds)';

function runReader(repo, chainId, extra = []) {
  const r = spawnSync('node', [READER, '--repo', repo, '--pins', PINS, '--chain', chainId, ...MODE_FLAG, ...extra], { encoding: 'utf8' });
  let rec = null;
  try { rec = JSON.parse(r.stdout || '{}'); } catch { /* non-JSON output (usage error) */ }
  return { exit: r.status, rec, stderr: r.stderr || '' };
}

function flipMiddleByte(file) {
  const buf = readFileSync(file);
  const off = Math.floor(buf.length / 2);
  buf[off] = buf[off] === 0xff ? 0x00 : 0xff;
  writeFileSync(file, buf);
  return off;
}

// ---------- S1: full tamper sweep ----------
for (const chain of chains) {
  const { root } = scratchTree(chain.id);
  for (const row of chain.rows) {
    const f = join(root, row.path);
    flipMiddleByte(f);
    const r = runReader(root, chain.id);
    const detected = r.exit !== 0;
    const localized = detected && r.rec && r.rec.first_failure &&
      r.rec.first_failure.row_index === row.index && r.rec.first_failure.check === 'bytes_pin';
    results.push({
      case: 'S1-tamper-sweep', chain: chain.id, row_index: row.index, row_id: row.id,
      detected, localized_at_row: r.rec?.first_failure?.row_index ?? null, expected_row: row.index,
      pass: detected && !!localized,
      first_failure: r.rec?.first_failure ?? null,
    });
    if (!(detected && localized)) escapes++;
    // restore
    cpSync(join(CRAB, row.path), f);
  }
  rmSync(root, { recursive: true, force: true });
}

// ---------- S2: missing file ----------
{
  const chain = chains.find((c) => c.id === 'crab45c');
  const { root } = scratchTree('crab45c');
  const victim = chain.rows.find((r) => r.id === 'whitening-receipt');
  rmSync(join(root, victim.path));
  const r = runReader(root, 'crab45c');
  const detected = r.exit !== 0;
  const localized = detected && r.rec?.first_failure?.row_index === victim.index && /unreadable|ENOENT/i.test(r.rec.first_failure.detail || '') === true;
  results.push({ case: 'S2-missing-file', chain: 'crab45c', row_index: victim.index, row_id: victim.id, detected, localized_at_row: r.rec?.first_failure?.row_index ?? null, pass: detected && localized, first_failure: r.rec?.first_failure ?? null });
  if (!(detected && localized)) escapes++;
  rmSync(root, { recursive: true, force: true });
}

// ---------- S3: wrong expected tip on good bytes ----------
{
  const { root } = scratchTree('crab44a');
  const wrongTip = 'a'.repeat(64);
  const r = runReader(root, 'crab44a', ['--expect-tip', wrongTip]);
  const detected = r.exit !== 0;
  const atTip = detected && r.rec?.first_failure?.check === 'expect_tip' && r.rec?.chain?.tip_ok === false;
  results.push({ case: 'S3-wrong-tip', chain: 'crab44a', expect_tip_given: wrongTip, detected, first_failure: r.rec?.first_failure ?? null, pass: detected && atTip });
  if (!(detected && atTip)) escapes++;
  rmSync(root, { recursive: true, force: true });
}

// ---------- S4: tampered byte INSIDE the usage.jsonl row-set row ----------
{
  const { root } = scratchTree('crab45c');
  const usageRow = chains.find((c) => c.id === 'crab45c').rows.find((r) => r.id === 'usage-jsonl');
  flipMiddleByte(join(root, usageRow.path));
  const r = runReader(root, 'crab45c');
  const detected = r.exit !== 0;
  const localized = detected && r.rec?.first_failure?.row_index === usageRow.index;
  results.push({ case: 'S4-usage-row-tamper', chain: 'crab45c', row_index: usageRow.index, row_id: usageRow.id, detected, localized_at_row: r.rec?.first_failure?.row_index ?? null, pass: detected && localized, first_failure: r.rec?.first_failure ?? null });
  if (!(detected && localized)) escapes++;
  rmSync(root, { recursive: true, force: true });
}

// ---------- S5: unknown chain id ----------
{
  const r = runReader(CRAB, 'crab999');
  const detected = r.exit !== 0;
  const named = detected && r.rec?.first_failure?.check === 'chain_exists';
  results.push({ case: 'S5-unknown-chain', chain: 'crab999', detected, pass: detected && named, first_failure: r.rec?.first_failure ?? null });
  if (!(detected && named)) escapes++;
}

// ---------- S6: mutated pin table (seal must refuse) ----------
{
  const tmpPins = join(mkdtempSync(join(tmpdir(), 'two-reader-pins-')), 'registration.json');
  const raw = readFileSync(PINS, 'utf8');
  const m = raw.match(/"bytes_sha256"\s*:\s*"([0-9a-f])()/);
  const flipped = m[1] === 'a' ? 'b' : 'a';
  const mutated = raw.slice(0, m.index) + raw.slice(m.index).replace(/"bytes_sha256"\s*:\s*"[0-9a-f]/, `"bytes_sha256": "${flipped}`);
  writeFileSync(tmpPins, mutated);
  const r = runReader(CRAB, 'crab45c', ['--pins', tmpPins]);
  const refused = r.exit === 2 && /seal/i.test(r.stderr || '');
  results.push({ case: 'S6-mutated-pins-refused', chain: 'crab45c', detected: refused, pass: refused, stderr_excerpt: (r.stderr || '').slice(0, 200) });
  if (!refused) escapes++;
}

const total = results.length;
const passed = results.filter((r) => r.pass).length;
const receipt = {
  tool: 'qthe two_reader/selftest.mjs (negative controls, installment 2; wave-52 mode-aware)',
  mode: MODE_LABEL,
  lane: 'wave 48 lane 48-b',
  run_at: RUN_AT,
  cases_total: total,
  cases_passed: passed,
  escapes,
  controls: {
    S1: 'one flipped byte in EVERY row of EVERY chain (49 rows) — detected + localized at the tampered row',
    S2: 'missing row file fails closed at that row',
    S3: 'wrong --expect-tip on good bytes fails closed at the tip check',
    S4: 'tampered byte inside usage.jsonl (row-set row) caught at the usage row',
    S5: 'unknown chain id fails closed',
    S6: 'mutated registration (broken seal) — reader refuses to walk',
  },
  ok: escapes === 0,
  results,
};
writeFileSync(join(OUTDIR, 'self-test-receipt.json'), JSON.stringify(receipt, null, 1) + '\n');
process.stdout.write(JSON.stringify({ cases_total: total, cases_passed: passed, escapes, ok: receipt.ok }, null, 1) + '\n');
process.exit(receipt.ok ? 0 : 1);
