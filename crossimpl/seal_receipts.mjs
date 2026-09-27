// crossimpl/seal_receipts.mjs — seal the 34-e conformance receipt chain
// (stone-v1 dialect through THE STONE, READ-ONLY link, never forked), then
// verify the chain FROM DISK. Law: a receipt without a chain is a rumor.
//
// Rows: stone.header / rules.crossimpl (frozen pre-peek ledger + impl + kernel
// shas + selftest) / artifacts (sha256 of every committed artifact) /
// result.A|B|C (exhaustive + battery numbers, byte-exact digests) /
// controls (NC1a/NC1b/NC2 tamper detection) / findings (F1-F3 boundary and
// validation-behavior findings, honestly classified) / report (findings.md sha).

import { writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = new URL('.', import.meta.url).pathname;          // crossimpl/
const REPO = new URL('..', import.meta.url).pathname;

const STONE_CANDIDATES = [
  '../quilt-stone/stone.mjs',
  '/home/z/my-project/download/quilt-stone/stone.mjs',
];
let stone = null, stonePath = null;
for (const c of STONE_CANDIDATES) {
  try {
    const m = await import(c.startsWith('/') ? pathToFileURL(c).href : new URL(c, import.meta.url).href);
    if (typeof m.sealChain === 'function' && typeof m.verifyChainFile === 'function') { stone = m; stonePath = c; break; }
  } catch { /* next */ }
}
if (!stone) throw new Error('THE STONE could not be resolved READ-ONLY');

const sha256File = (p) => createHash('sha256').update(readFileSync(p), 'utf8').digest('hex');

const AMBIG = HERE + 'AMBIGUITY.md';
const PYIMPL = HERE + 'py/qthe_layer0.py';
const summary = JSON.parse(readFileSync(HERE + 'artifacts/summary.json', 'utf8'));
const verdict = JSON.parse(readFileSync(HERE + 'artifacts/verdict.json', 'utf8'));
const probe = JSON.parse(readFileSync(HERE + 'artifacts/probe_exactness.json', 'utf8'));

const rows = [
  {
    kind: 'stone.header', alg: 'stone-v1', genesis: 'STONE-GENESIS-1',
    repo: 'SuperInstance/qthe', lane: '34-e porter-smith', owns: 'crossimpl/',
    experiment: 'LAYER-0-CROSSIMPL (independent Python re-implementation of LAYER 0, cross-verified byte-exact against the JS kernel)',
  },
  {
    kind: 'rules.crossimpl',
    frozen_by: 'crossimpl/AMBIGUITY.md — ambiguities A1..A10 + battery spec (mulberry32 seed 0x5EED34E, N=10000, 12 edges, NC1a/NC1b/NC2) written BEFORE the kernel was opened; battery ran only after the Python passed its own self-tests',
    registration_commit: '050d4fa',
    ambiguity_ledger_frozen_sha256: 'a4dfd527c33acda38debfe75fff48f1c491baeba817cdc416b3513b1c357b6c3',
    ambiguity_ledger_frozen_note: 'sha256 of crossimpl/AMBIGUITY.md as committed at 050d4fa — the pre-peek ledger + battery registration exactly as frozen (git show 050d4fa:crossimpl/AMBIGUITY.md)',
    ambiguity_ledger_final_sha256: sha256File(AMBIG),
    ambiguity_ledger_final_note: 'post-peek: RESOLUTIONS section appended (A1..A10 resolved), pre-peek sections untouched',
    python_impl_sha256: sha256File(PYIMPL),
    kernel_sha256: sha256File(REPO + 'qthe.mjs'),
    selftest: { assertions: 36, pass: true, log_sha256: sha256File(HERE + 'artifacts/selftest.log'), transcript_sha256: 'cc3daefe4e58b02c2a863bc8a1a8d875cb9058fda5405512871d4d9d1c2198f6' },
    seed_correction: 'decimal expansion of the seed corrected in AMBIGUITY.md pre-run (hex normative), before any vector was generated',
  },
  {
    kind: 'artifacts.crossimpl',
    vectors_json_sha256: sha256File(HERE + 'artifacts/vectors.json'),
    py_results_json_sha256: sha256File(HERE + 'artifacts/py_results.json'),
    js_results_json_sha256: sha256File(HERE + 'artifacts/js_results.json'),
    verdict_json_sha256: sha256File(HERE + 'artifacts/verdict.json'),
    summary_json_sha256: sha256File(HERE + 'artifacts/summary.json'),
    run_log_sha256: sha256File(HERE + 'artifacts/run.log'),
    probe_exactness_json_sha256: sha256File(HERE + 'artifacts/probe_exactness.json'),
    note: 'py_results.json and js_results.json are byte-IDENTICAL (one sha) — two independent serializers (Python json sort_keys vs stone canonicalJSON) produced the same bytes',
  },
  {
    kind: 'result.A.bijection', method: 'exhaustive, full 2^8 domain (256 inputs; state space 2^8 — exhaustive is cheap)',
    n: summary.A.n, matched: summary.A.matched, divergences: summary.A.divergences,
    byteExact: true, canonical_sha256: summary.shas.bijection_js,
    roundTrips: '256/256', distinctPairs: 256, fullProductCoverage: true,
  },
  {
    kind: 'result.B.psi', method: 'exhaustive, domain {0,1,2,3}; compared as channel coefficients (real, imag)',
    n: summary.B.n, matched: summary.B.matched, divergences: summary.B.divergences,
    byteExact: true, canonical_sha256: summary.shas.psi_js,
    kernel_PSI_literal: "[0,1,-1,'i']",
    mapping_note: "kernel psi(3) returns the operator CHARACTER 'i'; exact-integer reading maps it to real 0 / imag +1 per SPEC's own channel expansion",
  },
  {
    kind: 'result.C.vectorpass', method: 'randomized battery (mulberry32 seed 0x5EED34E) + 12 fixed edge vectors, byte-exact',
    n: summary.C.n, nRandomized: summary.C.randomized, nEdges: summary.C.edges,
    seed: summary.C.seed, matched: summary.C.matched, divergences: summary.C.divergences,
    byteExact: true, canonical_sha256_py: summary.shas.vectorpass_py, canonical_sha256_js: summary.shas.vectorpass_js,
    determinism_rerun: 'harness re-run produced byte-identical artifacts (vectors/py_results/js_results/verdict sha256 all equal across runs)',
    exactness_domain: 'pre-registered max|y| <= 8*63*2^40 ~ 5.57e14 < 2^53 so both languages are exact and byte-parity decidable',
  },
  {
    kind: 'controls.crossimpl', note: 'negative controls prove the comparison is live, not vacuous; all must DETECT',
    NC1a: { what: 'transit tamper: one value flipped in the Python-emitted results (id 5000 yR[0] -8036 -> -8035)', detected: summary.controls.NC1a, localized: true },
    NC1b: { what: 'raw byte flip in the Python-emitted canonical text (offset recorded, char 0->7)', detected: summary.controls.NC1b },
    NC2: { what: 'source tamper: the Python worker itself corrupted id 5000 via QTHE_TAMPER_VECTOR before emitting', detected: summary.controls.NC2, localized: true },
    allDetected: summary.controlsDetected,
  },
  {
    kind: 'finding.F1.exactness-horizon', classification: 'SPEC-ambiguity (SPEC silent on integer bound; kernel limited by JS Number)',
    detail: 'kernel exact at 63*2^53 (P1, both sides agree — 6-bit mantissa over 2^53 is representable) but the INPUT horizon is 2^53 and it is SILENT: (2**53+1)===(2**53) in JS, so x = 2^53+1 reaches Layer 0 pre-rounded; Python (unbounded ints) multiplies the true integer and diverges (P2/P3)',
    probe_rows: probe.rows.filter((r) => r.probe.startsWith('P1') || r.probe.startsWith('P2') || r.probe.startsWith('P3')).map((r) => ({ probe: r.probe, js: r.js_re, py: r.py_re, agree: r.agree })),
    action: 'none — nothing patched on either side; battery domain was pre-registered inside the safe range so the battery verdict is unaffected',
  },
  {
    kind: 'finding.F2.ragged-input', classification: 'SPEC-ambiguity (SPEC silent on malformed shapes; validation behavior outside the specified surface)',
    detail: 'kernel vectorPass with a row longer than xs silently produces NaN (xs[k] undefined -> float poison, violating "no floats in LAYER 0" only off the specified surface); Python raises ValueError per A3; probe P4',
    probe_rows: probe.rows.filter((r) => r.probe.startsWith('P4')),
    action: 'none — recorded; a follow-up kernel validation is a core-lane question, not this lane\'s to patch',
  },
  {
    kind: 'finding.F3.domain-validation', classification: 'SPEC-ambiguity (masking vs raising outside the primitive domain)',
    detail: 'kernel pack/unpack/vectorPass MASK out-of-range inputs (tau&3, d&63, w&0xff) where the Python implementation RAISES (A1/A4/A7 readings); over the SPECIFIED domains the two agree byte-exact — the divergence exists only on inputs the SPEC never admits',
    action: 'none — validation-style choice, receipted for the next reader',
  },
  {
    kind: 'report.crossimpl', findings_md_sha256: sha256File(HERE + 'findings.md'),
    verdict: verdict.verdict, controlsDetected: verdict.controlsDetected,
    resolutions: 'A1..A10 all CONFIRMED by the kernel on the specified surface (AMBIGUITY.md RESOLUTIONS); 3 findings F1/F2/F3, all classified SPEC-ambiguity, all outside the specified surface; nothing patched on either side',
  },
];

stone.sealChain(rows, 'STONE-GENESIS-1', { alg: 'stone-v1' });
const OUT = HERE + 'receipts/crossimpl_chain.jsonl';
writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

const v = stone.verifyChainFile(OUT);
console.log(`sealed ${rows.length} rows -> crossimpl/receipts/crossimpl_chain.jsonl`);
console.log(`verified FROM DISK: ok=${v.ok} links=${v.links} tip=${v.tip} alg=${v.alg} genesis=${v.genesis}`);
if (!v.ok) { console.error(`CHAIN BROKEN: ${JSON.stringify(v)}`); process.exit(1); }
