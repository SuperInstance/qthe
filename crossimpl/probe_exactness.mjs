// crossimpl/probe_exactness.mjs — POST-battery boundary probe (NOT part of the
// pre-registered battery; registered in AMBIGUITY.md A4 as a seam-finder).
// Question: where does the kernel's "exact integers, no floats" leave JS
// double territory? Python ints are unbounded, so any divergence here is a
// FINDING about the kernel's exactness horizon, not a battery failure — the
// battery was pre-registered INSIDE the safe range (max|y| <= 8*63*2^40 ~
// 5.57e14 < 2^53) precisely so byte-parity stays decidable.
//
// PROBE HONESTY NOTE (receipted from the first probe run): the probe itself
// was bitten by the very seam it hunts — JSON.parse of the Python worker's
// EXACT big-integer output rounded it to a double in the PROBE's own
// comparison, producing a phantom disagreement at P1. The probe now compares
// RAW TEXT digits from the worker's canonical output, never parsed numbers.
//
// Probes (weight = pack(1,63) = 127, Attract d=63, xs length 1):
//   P1 x = 2^53        : exact double input; product 63*2^53 is exactly
//                        representable (6-bit mantissa) though > 2^53-1
//   P2 x = 2^53+1      : the JS caller CANNOT construct this input at all
//                        (2**53+1 === 2**53); the kernel never sees it. The
//                        horizon is the INPUT side, silently.
//   P3 x = -(2^53+1)   : mirror of P2
//   P4 ragged row      : row longer than xs — outside the specified surface;
//                        kernel vs Python validation behavior (A3 family)

import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const HERE = new URL('.', import.meta.url).pathname;
const REPO = new URL('..', import.meta.url).pathname;
const { pack, vectorPass } = await import(pathToFileURL(REPO + 'qthe.mjs').href);

// Python side: run the worker, return the RAW canonical text (never parsed).
// rawJob overrides JSON generation entirely — the ONLY honest way to feed an
// integer beyond 2^53 to Python: a JS Number literal cannot carry it.
function pyRawText(weights, xs, rawJob) {
  const job = rawJob !== undefined ? rawJob
    : JSON.stringify({ task: 'vectorpass', vectors: [{ id: 0, weights, xs }] });
  const p = spawnSync('python3', [HERE + 'py/worker.py'], {
    input: job, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  return { status: p.status, text: p.stdout.trim(), stderr: p.stderr.trim() };
}
// The worker emits one vector id:0 -> extract the exact yR digits from text.
function pyYrDigits(text) {
  const m = text.match(/"yR":\[(-?\d+)/);
  return m ? m[1] : null;
}

const w = [[pack(1, 63)]];   // Attract, d=63
const rows = [];

function probe(name, jsXs, pyRawJob, note) {
  const jsOut = vectorPass(w, jsXs)[0];           // kernel's honest output
  const jsText = Number.isFinite(jsOut.re) ? BigInt(jsOut.re).toString() : String(jsOut.re);
  const py = pyRawText(w, pyRawJob ? null : jsXs, pyRawJob); // raw job string OR plain xs
  const pyText = py.status === 0 ? pyYrDigits(py.text) : `exit${py.status}`;
  const agree = pyText === jsText;
  rows.push({ probe: name, note, js_re: jsText, py_re: pyText, agree,
    js_input_constructed_exactly: pyRawJob ? false : true });
  console.log(`${name}: js=${jsText} py=${pyText} agree=${agree}`);
  return agree;
}

const p1 = probe('P1 x=2^53', [2 ** 53], undefined,
  '63*2^53 exactly representable (6-bit mantissa) though outside Number.isSafeInteger');

// P2/P3: the input 2^53+1 does not exist as a JS Number. Feed Python the TRUE
// integer via a hand-built JSON string (the only honest transport); the kernel
// gets the rounded value it cannot escape. The resulting disagreement is the
// finding: the horizon is on the INPUT side, silent.
const JOB_P2 = '{"task":"vectorpass","vectors":[{"id":0,"weights":[[127]],"xs":[9007199254740993]}]}';
const JOB_P3 = '{"task":"vectorpass","vectors":[{"id":0,"weights":[[127]],"xs":[-9007199254740993]}]}';
const p2 = probe('P2 x=2^53+1', [2 ** 53 + 1], JOB_P2,
  'JS literal rounds to 2^53 BEFORE Layer 0 sees it; Python multiplies the true input -> disagreement IS the finding');
const p3 = probe('P3 x=-(2^53+1)', [-(2 ** 53 + 1)], JOB_P3, 'mirror of P2');

// P4: ragged row (2-col row, 1 input) — outside the specified surface
const jsOut4 = vectorPass([[pack(1, 1), pack(2, 1)]], [1])[0];
const py4 = pyRawText([[pack(1, 1), pack(2, 1)]], [1]);
rows.push({
  probe: 'P4 ragged (row > xs)', note: 'outside specified surface: kernel silently NaNs (float poison), Python raises ValueError (A3)',
  js_re: String(jsOut4.re), js_isNaN: Number.isNaN(jsOut4.re),
  py_re: py4.status === 0 ? pyYrDigits(py4.text) : `exit ${py4.status} (${py4.stderr.split('\n').pop()})`,
  agree: false,
});
console.log(`P4: js_re=${jsOut4.re} isNaN=${Number.isNaN(jsOut4.re)} python exit=${py4.status}`);

const inputHorizon = (2 ** 53 + 1) === 2 ** 53;
const out = {
  probe: 'exactness boundary', kernelWeight: pack(1, 63),
  js_literal_2pow53plus1_is_2pow53: inputHorizon,
  battery_domain_note: 'pre-registered battery stays <= 8*63*2^40 ~ 5.57e14 < 2^53: byte-parity decidable',
  rows,
};
writeFileSync(HERE + 'artifacts/probe_exactness.json', JSON.stringify(out, null, 2) + '\n');
console.log(`P2 input-horizon fact: (2**53+1)===(2**53) in JS: ${inputHorizon}`);
console.log('probe written to crossimpl/artifacts/probe_exactness.json');
process.exit(0);
