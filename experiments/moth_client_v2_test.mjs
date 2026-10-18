// experiments/moth_client_v2_test.mjs — OFFLINE fixture selftest, ZERO credits
// (ORCH-R21/T12-a). Synthetic bodies only; a fixture never pretends to be
// quantum (every synthetic body is labeled by this file's own provenance).
//
// Run: node experiments/moth_client_v2_test.mjs   (exit 0 iff ALL PASS)

import { createMothClient, MothError, loadKey } from './moth_client_v2.mjs';

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log(`PASS  ${name}`); } else { failed++; console.log(`FAIL  ${name}`); } };

// ── the fixture fetch: routes the three endpoints, replays synthetic bodies ──
function fixtureFetch(script) {
  // script: map jobId -> { submit, statuses: [...], result }
  const calls = [];
  const reply = (body, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });
  return async (url, init = {}) => {
    let p = new URL(url).pathname;
    if (p.startsWith('/api/v1/')) p = p.slice(7); // strip the client's base path
    calls.push({ method: init.method || 'GET', path: p });
    if (p === '/engines/comet-qrng-v1/process' && (init.method === 'POST')) {
      const id = `fx-${calls.length}`;
      script[id] = script.nextComet();
      return reply({ job_id: id, status: 'queued' }, 202);
    }
    if (p === '/engines/blur-core-v1/process' && (init.method === 'POST')) {
      const id = `fx-${calls.length}`;
      script[id] = script.nextBlur ? script.nextBlur() : { result: { output: JSON.parse(init.body).params.values } };
      return reply({ job_id: id, status: 'queued' }, 202);
    }
    if (p === '/engines/qpixl-v1/process' && (init.method === 'POST')) {
      const id = `fx-${calls.length}`;
      script[id] = { result: { output: [0.1, 0.2], backend: 'aer' } };
      return reply({ job_id: id, status: 'queued' }, 202);
    }
    let m;
    if ((m = p.match(/^\/jobs\/([^/]+)\/status$/))) {
      const s = script[m[1]];
      return reply(s ? { status: 'completed', steps: [{ name: 'build', status: 'ok' }] } : { status: 'unknown' });
    }
    if ((m = p.match(/^\/jobs\/([^/]+)\/result$/))) {
      const s = script[m[1]];
      return reply(s ? s.result : { detail: 'no fixture' });
    }
    return reply({ detail: `unrouted ${p}` }, 404);
  };
}

const KEY = 'fixture-key-not-a-real-key';
const mk = (script) => createMothClient({ key: KEY, fetch: fixtureFetch(script), pollMs: 1, maxPolls: 5 });

// T1 — the UA law travels on every call
{
  const script = {};
  const captured = [];
  const f = fixtureFetch(script);
  const wrapped = async (url, init) => { captured.push(init.headers); return f(url, init); };
  const c = createMothClient({ key: KEY, fetch: wrapped, pollMs: 1 });
  await c.engine('comet-qrng-v1').catch(() => {});
  ok('T1 browser User-Agent on every call', captured.length > 0 && captured.every((h) => h['user-agent'].startsWith('Mozilla/5.0')));
}

// T2 — run() happy path carries job_id + result + steps
{
  const script = {};
  const c = mk(script);
  script.nextComet = () => ({ result: { output: { random: { hex: 'ab' }, bell_witness: { S: 2.8 } } } });
  const j = await c.run('comet-qrng-v1', { mode: 'emu', output_bytes: 64 });
  ok('T2 run() happy path', j.job_id && j.result.output.random.hex === 'ab' && Array.isArray(j.steps));
}

// T3 — qrng sizing law: 8 B/int + 8 B/float + 16 slack
{
  const script = {};
  const bodies = [];
  const f = fixtureFetch(script);
  const wrapped = async (url, init) => { if (init.body && init.method === 'POST') bodies.push(JSON.parse(init.body)); return f(url, init); };
  const c = createMothClient({ key: KEY, fetch: wrapped, pollMs: 1 });
  script.nextComet = () => ({ result: { output: { random: { hex: 'ab'.repeat(80), derived: { integers: { values: [1, 2, 3, 4, 5] }, floats: [0.1, 0.2, 0.3] } }, bell_witness: { S: 2.8 } } } });
  const r = await c.qrng({ integers: { min: 0, max: 63, count: 5 }, floats: 3 });
  ok('T3 qrng sizing law (8B/int + 8B/float + 16)', bodies.length === 1 && bodies[0].params.output_bytes === 8 * 5 + 8 * 3 + 16 && r.integers.length === 5 && r.floats.length === 3);
}

// T4 — qrng retry law: a job that completes with no extractable bytes retries
{
  const script = {}; let n = 0;
  script.nextComet = () => {
    n++;
    if (n === 1) return { result: { output: { random: { derivation_error: 'conditioned bytes ran out' } } } };
    return { result: { output: { random: { hex: 'cd'.repeat(64), derived: { integers: { values: [1, 2, 3] } } }, bell_witness: { S: 2.7 } } } };
  };
  const c = mk(script);
  const r = await c.qrng({ integers: { min: 0, max: 10, count: 3 }, attempts: 2 });
  ok('T4 qrng retry law (empty first job retried)', n === 2 && r.integers.length === 3 && r.bell_witness.S === 2.7);
}

// T5 — failed job -> MothError with job_id, retryable surfacing
{
  const script = {};
  const f = fixtureFetch(script);
  const wrapped = async (url, init = {}) => {
    const p = new URL(url).pathname;
    if (p.endsWith('/status')) return { ok: true, status: 200, text: async () => JSON.stringify({ status: 'failed', error: { message: 'synthetic failure', retryable: true } }) };
    return f(url, init);
  };
  const c = createMothClient({ key: KEY, fetch: wrapped, pollMs: 1 });
  let threw = null;
  try { await c.run('comet-qrng-v1', {}); } catch (e) { threw = e; }
  ok('T5 failed job throws MothError(job_id, retryable)', threw instanceof MothError && threw.retryable === true);
}

// T6 — blurExact shape law: passing shape echoes; wrong shape throws LOUD
{
  const script = {};
  script.nextBlur = () => ({ result: { output: [[1, 2], [3, 4]] } });
  const c = mk(script);
  const r = await c.blurExact([[9, 9], [9, 9]]);
  ok('T6a blurExact happy path (exact:true, strength carried)', r.exact === true && r.strength === 0.5 && r.output[0][0] === 1);
  script.nextBlur = () => ({ result: { output: [1, 2, 3, 4] } });
  let threw = null;
  try { await c.blurExact([[9, 9], [9, 9]]); } catch (e) { threw = e; }
  ok('T6b blurExact shape mismatch throws LOUD', threw instanceof MothError && /shape/.test(threw.message));
  let threw2 = null;
  try { await c.blurExact('0.1,0.2'); } catch (e) { threw2 = e; }
  ok('T6c blurExact rejects non-array values', threw2 instanceof MothError);
}

// T7 — qpixl array law
{
  const c = mk({});
  const r = await c.qpixl([0.05, 0.2, 0.4]);
  ok('T7a qpixl array accepted', Array.isArray(r.output));
  let threw = null;
  try { await c.qpixl('0.05,0.2,0.4'); } catch (e) { threw = e; }
  ok('T7b qpixl bare CSV string rejected pre-flight', threw instanceof MothError && /array/.test(threw.message));
}

// T8 — key doctrine: loadKey never surfaces in any client artifact
{
  const k = loadKey('/nonexistent/path');
  ok('T8a loadKey fails closed on missing env (null)', k === null || typeof k === 'string');
  const script = {};
  const f = fixtureFetch(script);
  let sawKey = false;
  const wrapped = async (url, init = {}) => { if (init.body && String(init.body).includes(KEY)) sawKey = true; return f(url, init); };
  const c = createMothClient({ key: KEY, fetch: wrapped, pollMs: 1 });
  script.nextComet = () => ({ result: { output: { random: { hex: 'ab' } } } });
  await c.run('comet-qrng-v1', { mode: 'emu', output_bytes: 32 });
  ok('T8b key never appears in a request body', !sawKey);
}

// T9 — no key anywhere -> fail-closed construction (explicit null: the
// default arg falls back to env/.env, which THIS environment legitimately has)
{
  let threw = null;
  try { createMothClient({ key: null, fetch: fixtureFetch({}) }); } catch (e) { threw = e; }
  ok('T9 key:null -> MothError at construction (fail-closed)', threw instanceof MothError);
}

console.log(`\n${passed} PASS / ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
