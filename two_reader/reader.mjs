#!/usr/bin/env node
// two_reader/reader.mjs — lane 48-b "two-reader rule, installment 2".
//
// An independent chain reader LIVING IN qthe that verifies the crab-traps
// repo's own receipt chains. Written from the stone-v1 law itself:
//   - a chain is a sequence of JSON rows;
//   - every link is a sha256 over exact bytes;
//   - the walker recomputes the chain from genesis and folds a rolling
//     tip; it exits 0 ONLY if every row digest matches its pin, every
//     registered binding check holds, and the tip matches;
//   - ANY tamper fails closed at a precise row index.
//
// ZERO shared code: no import from crab-traps, fleet-seeds, or any other
// repo. Stdlib-only Node (node:crypto/fs/path/process). The pin table and
// chain definitions are DATA, loaded from two_reader/registration.json
// (pre-registered and sealed BEFORE any run — the reader verifies the seal
// and refuses to walk against an unsealed or mutated pin table).
//
// Usage:
//   node reader.mjs --repo <crab-traps-root> --pins <registration.json> \
//        --chain <chain-id> [--out <receipt.json>] [--moth-fixture <path>]
//        [--expect-tip <hex>]   // override (P4 negative control only)
//
// Exit: 0 iff ok; 1 on any verification failure; 2 on usage/seal errors.

import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const sha256Hex = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------- arg parsing (hand-rolled, stdlib only) ----------
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const key = t.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) a[key] = true;
      else { a[key] = next; i++; }
    } else a._.push(t);
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
const RUN_AT = new Date().toISOString(); // the ONLY wall-clock field in the receipt

function fail2(msg) {
  console.error('reader: ' + msg);
  process.exit(2);
}
if (!args.repo || !args.pins || !args.chain) {
  fail2('usage: node reader.mjs --repo <crab-traps-root> --pins <registration.json> --chain <id> [--out receipt.json] [--moth-fixture path] [--expect-tip hex]');
}

// ---------- pin table + seal verification (fail closed) ----------
const PINS_PATH = resolve(String(args.pins));
let pinsRaw;
try { pinsRaw = readFileSync(PINS_PATH); } catch (e) { fail2(`pins file unreadable: ${e.message}`); }
const pins = JSON.parse(pinsRaw.toString('utf8'));
const seal = pins.seal || {};
if (!seal.self_sha256_masked || seal.self_sha256_masked.length !== 64) {
  fail2('pin table seal missing/malformed (seal.self_sha256_masked) — refusing to walk (fail closed)');
}
// masked-self-sha: replace the 64-hex seal value IN THE RAW BYTES with 64 '0's
const maskRe = /("self_sha256_masked"\s*:\s*")([0-9a-f]{64})(")/;
const m = pinsRaw.toString('utf8').match(maskRe);
if (!m) fail2('seal field not found verbatim in pin-table bytes — refusing to walk');
const maskedBytes = Buffer.from(
  pinsRaw.toString('utf8').replace(maskRe, '$1' + '0'.repeat(64) + '$3'),
  'utf8'
);
const maskedSha = sha256Hex(maskedBytes);
if (maskedSha !== seal.self_sha256_masked) {
  fail2(`pin table seal MISMATCH: masked sha ${maskedSha} != sealed ${seal.self_sha256_masked} — the pin table was mutated after sealing; refusing to walk (fail closed)`);
}
// mtime binding: recorded mtime must still be on the file (utimes-restored at seal time).
// Wave-52 registered evolution (fleet law A4): under the EXPLICIT --mtime-witness flag the
// mtime is demoted to a local WITNESS — a mismatch is receipted but does not refuse the walk.
// Rationale (receipted): npm install normalizes extracted mtimes to the 1985-10-26T08:15Z
// epoch (499162500000 ms), so distribution consumers cannot carry the sealed local mtime.
// Strict binding remains the DEFAULT; bytes (masked-self-sha + per-row pins) always bind.
const MTIME_WITNESS = args['mtime-witness'] === true || args['mtime-witness'] === '';
const sealStat = statSync(PINS_PATH);
const sealMs = Date.parse(seal.mtime_local);
if (!Number.isFinite(sealMs) || Math.abs(sealStat.mtimeMs - sealMs) > 2) {
  const msg = `pin table mtime does not match seal.mtime_local (${sealStat.mtimeMs} vs ${sealMs})`;
  if (MTIME_WITNESS) {
    console.error(`reader: mtime WITNESS mismatch (not refusing, --mtime-witness): ${msg}`);
    globalThis.__MTIME_WITNESS_MISMATCH = true;
  } else {
    fail2(`${msg} — refusing to walk (fail closed); distribution consumers: pass --mtime-witness (fleet law A4)`);
  }
}

// ---------- chain selection ----------
const chainDefs = (pins.registration && pins.registration.chains) || [];
const chainDef = chainDefs.find((c) => c.id === args.chain);
if (!chainDef) {
  emitAndExit({
    ok: false,
    error: `unknown chain id '${args.chain}' (registered: ${chainDefs.map((c) => c.id).join(', ') || 'none'})`,
    first_failure: { chain: args.chain, row_index: null, row_id: null, check: 'chain_exists', detail: 'chain id not present in pin table' },
  }, 1, 'unknown chain id — fail closed');
}

const REPO = resolve(String(args.repo));
const rowPath = (rel) => resolve(REPO, rel);

// ---------- helpers ----------
function getPath(obj, dotted) {
  let cur = obj;
  for (const k of dotted.split('.')) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[k];
  }
  return cur;
}
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (!deepEqual(ka, kb)) return false;
    for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }
  return false; // primitives already handled by a === b
}

// ---------- the walk ----------
const rows = chainDef.rows;
const computed = [];
let firstFailure = null;
let fold = sha256Hex(Buffer.from('CRAB-GENESIS-1', 'ascii')); // genesis (the law)

const noteFail = (row_index, row_id, check, detail) => {
  if (!firstFailure) firstFailure = { chain: chainDef.id, row_index, row_id, check, detail };
};

// cache parsed JSON / raw text per row for cross-row checks
const rowRaw = new Map();
const rowJson = new Map();
const rowText = new Map();

for (const row of rows) {
  const entry = { index: row.index, id: row.id, checks: [] };
  let bytes;
  const abs = rowPath(row.path);
  try {
    bytes = readFileSync(abs);
  } catch (e) {
    entry.checks.push({ type: 'bytes_pin', ok: false, detail: `file unreadable: ${e.code || e.message}` });
    computed.push(entry);
    noteFail(row.index, row.id, 'bytes_pin', `file unreadable: ${e.code || e.message} (absence fails closed)`);
    break;
  }
  rowRaw.set(row.index, bytes);
  rowText.set(row.index, bytes.toString('utf8'));

  // LAW: row link — sha256 over exact bytes must equal the pin
  const dg = sha256Hex(bytes);
  entry.bytes_sha256 = dg;
  if (dg !== row.bytes_sha256) {
    entry.checks.push({ type: 'bytes_pin', ok: false, detail: `sha256 ${dg} != pinned ${row.bytes_sha256}` });
    computed.push(entry);
    noteFail(row.index, row.id, 'bytes_pin', `row digest ${dg} != pinned ${row.bytes_sha256} — tamper or pin drift detected AT THIS ROW`);
    break;
  }
  entry.checks.push({ type: 'bytes_pin', ok: true });

  // LAW: fold the chain from genesis
  fold = sha256Hex(Buffer.from(fold + ':' + dg + ':' + row.id, 'utf8'));

  // registered binding checks for this row
  let rowFailed = false;
  for (const chk of row.checks || []) {
    const res = runCheck(chk, row);
    entry.checks.push(res);
    if (!res.ok) { noteFail(row.index, row.id, chk.type, res.detail || 'binding check failed'); rowFailed = true; break; }
  }
  computed.push(entry);
  if (rowFailed) break;
}

function parsed(row) {
  if (!rowJson.has(row)) rowJson.set(row, JSON.parse(rowText.get(row)));
  return rowJson.get(row);
}
function rawOfRow(idx) { return rowRaw.get(idx); }
function digestOfRow(idx) { return sha256Hex(rawOfRow(idx)); }

function runCheck(chk, row) {
  switch (chk.type) {
    case 'field_constant': {
      const v = getPath(parsed(row.index), chk.field);
      const ok = deepEqual(v, chk.value);
      return { type: chk.type, field: chk.field, ok, detail: ok ? undefined : `field '${chk.field}' = ${JSON.stringify(v)} != pinned ${JSON.stringify(chk.value)}` };
    }
    case 'digest_equals_row_field': {
      const v = getPath(parsed(row.index), chk.field);
      const expect = digestOfRow(chk.row);
      const ok = v === expect;
      return { type: chk.type, field: chk.field, ok, detail: ok ? undefined : `embedded '${chk.field}' = ${v} != recomputed sha256 of row ${chk.row} (${expect})` };
    }
    case 'field_equals_row_len': {
      const v = getPath(parsed(row.index), chk.field);
      const expect = rawOfRow(chk.row).length;
      const ok = v === expect;
      return { type: chk.type, field: chk.field, ok, detail: ok ? undefined : `field '${chk.field}' = ${v} != byte length of row ${chk.row} (${expect})` };
    }
    case 'order_sha_of_array': {
      const arr = getPath(parsed(chk.source_row), chk.source_array_field);
      const orderSha = sha256Hex(Buffer.from(JSON.stringify(arr), 'utf8'));
      const v = getPath(parsed(row.index), chk.field);
      const ok = v === orderSha;
      return { type: chk.type, field: chk.field, ok, detail: ok ? undefined : `sha256(JSON.stringify(${chk.source_array_field} of row ${chk.source_row})) = ${orderSha} != ${chk.field} = ${v}` };
    }
    case 'array_permutation': {
      const arr = getPath(parsed(row.index), chk.field);
      const ok = Array.isArray(arr) && arr.length === chk.n && (() => {
        const seen = new Array(chk.n).fill(false);
        for (const x of arr) { if (!Number.isInteger(x) || x < 0 || x >= chk.n || seen[x]) return false; seen[x] = true; }
        return seen.every(Boolean);
      })();
      return { type: chk.type, field: chk.field, ok, detail: ok ? undefined : `field '${chk.field}' is not a permutation of 0..${chk.n - 1}` };
    }
    case 'array_equal_constant': {
      const v = getPath(parsed(row.index), chk.field);
      const ok = deepEqual(v, chk.value);
      return { type: chk.type, field: chk.field, ok, detail: ok ? undefined : `field '${chk.field}' != pinned array` };
    }
    case 'content_contains': {
      const text = rowText.get(row.index);
      const missing = chk.values.filter((s) => !text.includes(s));
      const ok = missing.length === 0;
      return { type: chk.type, ok, detail: ok ? undefined : `raw text missing: ${JSON.stringify(missing)}` };
    }
    case 'usage_rows_match_calls': {
      const lines = rowText.get(row.index).split('\n').filter((l) => l.trim() !== '');
      let ur;
      try { ur = lines.map((l) => JSON.parse(l)); } catch (e) {
        return { type: chk.type, ok: false, detail: `usage.jsonl not JSON-per-line: ${e.message}` };
      }
      const errors = [];
      if (ur.length !== chk.count) errors.push(`row count ${ur.length} != ${chk.count}`);
      for (let i = 0; i < Math.min(ur.length, chk.count); i++) {
        const call = chk.call_start + i;
        const u = ur[i];
        if (u.call_no !== call) { errors.push(`line ${i + 1}: call_no ${u.call_no} != ${call}`); continue; }
        const reqPath = rowPath(chk.request_pattern.replace('{call}', String(call).padStart(2, '0')));
        const respPath = rowPath(chk.response_pattern.replace('{call}', String(call).padStart(2, '0')));
        let req, resp;
        try {
          req = JSON.parse(readFileSync(reqPath, 'utf8'));
          resp = JSON.parse(readFileSync(respPath, 'utf8'));
        } catch (e) {
          errors.push(`call ${call}: request/response unreadable: ${e.code || e.message}`);
          continue;
        }
        if (u.attempt !== req.attempt) errors.push(`call ${call}: attempt != request.attempt`);
        if (!deepEqual(u.usage, resp.usage)) errors.push(`call ${call}: usage != response.usage`);
        if (u.model !== resp.model) errors.push(`call ${call}: model != response.model`);
        const rfin = (resp.choices || [{}])[0].finish_reason;
        if (u.finish_reason !== rfin) errors.push(`call ${call}: finish_reason ${JSON.stringify(u.finish_reason)} != response.choices[0].finish_reason ${JSON.stringify(rfin)}`);
        if ('requested_model' in u && u.requested_model !== req.model) errors.push(`call ${call}: requested_model != request.model`);
        if ('batch_size' in u && u.batch_size !== req.batch_size) errors.push(`call ${call}: batch_size != request.batch_size`);
        if ('status' in u && req.call_no !== undefined && u.call_no !== req.call_no) errors.push(`call ${call}: call_no != request.call_no`);
      }
      const ok = errors.length === 0;
      return { type: chk.type, ok, detail: ok ? undefined : errors.join('; ') };
    }
    default:
      return { type: chk.type, ok: false, detail: `unknown check type '${chk.type}' (fail closed)` };
  }
}

// ---------- chain-level optional bindings ----------
const optional = [];
for (const ob of chainDef.optional_bindings || []) {
  if (ob.type === 'fixture_sha_len') {
    if (!args[ob.flag.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] && !args[ob.flag]) {
      optional.push({ type: ob.type, status: 'SKIPPED', detail: `--${ob.flag} not provided (binding to archived bytes not exercised this run)` });
      continue;
    }
    const fp = resolve(String(args[ob.flag] || args[ob.flag.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]));
    let fb;
    try { fb = readFileSync(fp); } catch (e) {
      optional.push({ type: ob.type, status: 'FAIL', detail: `fixture unreadable: ${e.code || e.message}` });
      noteFail(ob.row, chainDef.rows.find((r) => r.index === ob.row)?.id || null, 'fixture_sha_len', `fixture unreadable: ${e.code || e.message}`);
      continue;
    }
    const dg = sha256Hex(fb);
    const okLen = fb.length === ob.expect_len;
    const okSha = dg === ob.expect_sha;
    optional.push({ type: ob.type, status: okLen && okSha ? 'PASS' : 'FAIL', detail: `fixture sha256 ${dg} (len ${fb.length}); expected ${ob.expect_sha} (len ${ob.expect_len})` });
    if (!(okLen && okSha)) noteFail(ob.row, chainDef.rows.find((r) => r.index === ob.row)?.id || null, 'fixture_sha_len', `archived fixture bytes ${dg}/${fb.length} != pinned ${ob.expect_sha}/${ob.expect_len}`);
  } else {
    optional.push({ type: ob.type, status: 'FAIL', detail: `unknown optional binding type (fail closed)` });
    noteFail(null, null, ob.type, 'unknown optional binding type');
  }
}

// ---------- tip + expected tip ----------
const expectTip = args['expect-tip'] ? String(args['expect-tip']) : chainDef.expect_tip;
const tipOk = fold === expectTip;
if (!tipOk) noteFail(rows.length, rows[rows.length - 1]?.id || null, 'expect_tip', `recomputed tip ${fold} != expected ${expectTip}`);

const ok = firstFailure === null && tipOk;

// ---------- receipt ----------
const receipt = {
  tool: 'qthe two_reader/reader.mjs (installment 2 — the qthe side reads crab-traps)',
  lane: 'wave 48 lane 48-b',
  run_at: RUN_AT,
  law: 'stone-v1: rows linked by sha256 over exact bytes, chain folded from genesis, fail closed at precise row',
  args: {
    repo: REPO,
    pins: PINS_PATH,
    pins_rel_to_repo: relative(REPO, PINS_PATH) || PINS_PATH,
    chain: args.chain,
    expect_tip_source: args['expect-tip'] ? 'cli-override' : 'registration',
    moth_fixture: args['moth-fixture'] ? resolve(String(args['moth-fixture'])) : null,
  },
  seal_verified: true,
  mtime_binding: MTIME_WITNESS
    ? (globalThis.__MTIME_WITNESS_MISMATCH ? 'witness-mismatch-receipted' : 'witness-ok')
    : 'strict-ok',
  chain: {
    id: chainDef.id,
    label: chainDef.label,
    pinned_commit: chainDef.pinned_commit,
    rows_registered: rows.length,
    rows_walked: computed.length,
    tip: fold,
    expect_tip: expectTip,
    tip_ok: tipOk,
    rows: computed,
    optional_bindings: optional,
  },
  ok,
  first_failure: firstFailure,
};

function emitAndExit(r, code, _msg) {
  const out = JSON.stringify(r, null, 1) + '\n';
  if (args.out) { try { writeFileSync(String(args.out), out); } catch (e) { console.error('reader: cannot write --out: ' + e.message); } }
  process.stdout.write(out);
  process.exit(code);
}
emitAndExit(receipt, ok ? 0 : 1);
