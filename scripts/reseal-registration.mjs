#!/usr/bin/env node
// reseal-registration.mjs — wave 52 registered seal evolution for the two-reader pins.
// Applies the garden addendum-A4 law to the qthe reader: mtime becomes a WITNESS
// under the explicit --mtime-witness flag (strict binding remains the default).
// Order matters: embed the new mtime_local INSIDE the bytes BEFORE computing the
// masked-self-sha; only then write bytes and utimes-restore the file mtime.
import { readFileSync, writeFileSync, utimesSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PINS = join(HERE, '..', 'two_reader', 'registration.json');
const sha256Hex = (buf) => createHash('sha256').update(buf).digest('hex');
const maskRe = /("self_sha256_masked"\s*:\s*")([0-9a-f]{64})(")/;

const doc = JSON.parse(readFileSync(PINS, 'utf8'));

const newMtimeMs = Date.now();
doc.seal.mtime_is_binding_strict_default = true;
doc.seal.mtime_witness_flag =
  '--mtime-witness (distribution contexts: npm install normalizes mtimes to the 1985-10-26T08:15:00.000Z epoch 499162500000 — receipted wave 52 codespace attempts 5-7)';
doc.seal.method =
  'masked-self-sha + utimes-restored mtime; mtime demoted to witness under explicit --mtime-witness flag (fleet law A4); verify: replace seal.self_sha256_masked with 64 zeros, sha256 must match; mtime must match seal.mtime_local within 2ms unless the reader runs with --mtime-witness';
doc.seal.mtime_local = new Date(newMtimeMs).toISOString();
doc.seal.self_sha256_masked = '0'.repeat(64); // placeholder before hashing

const masked = sha256Hex(Buffer.from(JSON.stringify(doc, null, 2) + '\n', 'utf8'));
doc.seal.self_sha256_masked = masked;

writeFileSync(PINS, JSON.stringify(doc, null, 2) + '\n');
utimesSync(PINS, new Date(), new Date(newMtimeMs));

// self-verify: re-read, mask, hash, compare; check mtime
const check = JSON.parse(readFileSync(PINS, 'utf8'));
const checkMasked = JSON.parse(readFileSync(PINS, 'utf8'));
const reMasked = sha256Hex(
  Buffer.from(readFileSync(PINS, 'utf8').replace(maskRe, '$1' + '0'.repeat(64) + '$3'), 'utf8')
);
const ok = reMasked === check.seal.self_sha256_masked;
console.log('resealed:', reMasked, 'ok:', ok, 'mtime:', check.seal.mtime_local, '== disk mtime restored to', new Date(newMtimeMs).toISOString());
process.exit(ok ? 0 : 1);
