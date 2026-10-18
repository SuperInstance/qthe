// experiments/moth_client_v2.mjs — the quantum house's second client (ORCH-R21/T12-a).
//
// WHY v2: the r7/r9-era client (moth_client.mjs, STANDING — E-Q9-DT history)
// spoke only graph-v1 and debiased its 0.55-balance stream by hand. The
// catalog has moved: comet-qrng-v1 ships SP 800-90B-certified Born-rule
// bytes (Toeplitz extractor, epsilon_log2 security parameter, CHSH Bell
// witness), and blur-core-v1 is a DETERMINISTIC exact-mode quantum operator
// over N-D grids of non-negative numbers. This client wraps the JSON-runnable
// engine set with the fleet's hard-won laws baked in.
//
// PROVENANCE OF THE LAWS (read-the-record, all live-receipted by the fleet):
// - browser User-Agent REQUIRED — Cloudflare 1010 blocks non-browser UAs
//   (AI-Writings/labs/quantum-fx/qfx.mjs UA law).
// - comet derive sizing: 8 B per float + 8 B per integer + slack, or the
//   derivation fails "conditioned bytes ran out"; retry a job that completes
//   with no extractable bytes (qfx.mjs qrng law).
// - blur-core output is RESCALED to the input's max (sum NOT conserved);
//   omit `shots` for the EXACT result (MOTH-ENGINES-PROBES.md).
// - qpixl `values` MUST be a JSON array, never a bare CSV string
//   (MOTH-ENGINES-PROBES.md: the engine's own doc sample fails).
// - every engine reports is_async:false but submission still returns a
//   job_id; poll /jobs/{id}/status -> /jobs/{id}/result (fleet idiom).
//
// KEY DOCTRINE (unchanged from v1, receipted E-D3): the key lives ONLY in
// process.env.MOTH_KEY or /home/z/my-project/.env (parsed at RUNTIME). It is
// NEVER written to any file, log, receipt, cache or console output.
//
// TEST LAW: createMothClient accepts an injected fetch — the offline fixture
// selftest (moth_client_v2_test.mjs) replays synthetic bodies with ZERO
// credits; a fixture is labeled synthetic and never pretends to be quantum.
//
// BUDGET LAW: this module enforces nothing; lanes enforce their own caps
// (E-Q20: 1 comet + 5 blur, hard-capped in the runner). Fail-closed is the
// CALLER's contract: an unreachable API surfaces as MothError, never as a
// silent mock (v1's labeled-mock fallback stays available to callers that
// pre-register it).

import { readFileSync, existsSync } from 'node:fs';

const ENV_PATH = '/home/z/my-project/.env';
const DEFAULT_BASE = 'https://api.mothquantum.com/api/v1';
// Cloudflare fronts the API and blocks non-browser User-Agents (error 1010).
export const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export class MothError extends Error {
  constructor(message, info = {}) {
    super(message);
    this.name = 'MothError';
    Object.assign(this, info); // { status, job_id, engine_id, stage, retryable }
  }
}

export function loadKey(envPath = ENV_PATH) {
  if (process.env.MOTH_KEY) return process.env.MOTH_KEY;
  try {
    if (existsSync(envPath)) {
      const m = readFileSync(envPath, 'utf8').match(/^MOTH_KEY\s*=\s*(\S+)\s*$/m);
      if (m) return m[1];
    }
  } catch { /* fallthrough: stay null, caller fails closed */ }
  return null;
}

// ── client factory (fetch injectable for the offline fixture selftest) ───────
export function createMothClient({
  base = process.env.MOTHQUANTUM_BASE || DEFAULT_BASE,
  key = loadKey(),
  fetch: doFetch = globalThis.fetch,
  pollMs = 2000,
  maxPolls = 90,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
} = {}) {
  if (!key) throw new MothError('MOTH_KEY not set (env or /home/z/my-project/.env)');
  const H = { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'user-agent': UA };

  async function call(path, init = {}, timeoutMs = 30000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const t0 = Date.now();
    try {
      const r = await doFetch(`${base}${path}`, { ...init, headers: H, signal: ctl.signal });
      const text = await r.text();
      let body;
      try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
      if (!r.ok) {
        throw new MothError(`Moth ${init.method || 'GET'} ${path} -> ${r.status}: ${body.detail || body.raw || ''}`,
          { status: r.status, retryable: r.status === 429 || r.status >= 500 });
      }
      return { body, ms: Date.now() - t0 };
    } catch (e) {
      if (e instanceof MothError) throw e;
      throw new MothError(`Moth ${init.method || 'GET'} ${path} unreachable: ${e.message}`, { status: 0, retryable: true });
    } finally { clearTimeout(t); }
  }

  const engines = async () => (await call('/engines')).body.engines;
  const engine = async (id) => (await call(`/engines/${id}`)).body;
  const jobs = async (limit = 10) => (await call(`/jobs?limit=${limit}`)).body.jobs;

  // The uniform primitive: submit -> poll -> result. Throws MothError on a
  // failed job; returns { job_id, engine_id, result, steps, ms }.
  async function run(engine_id, params = {}) {
    const t0 = Date.now();
    const sub = await call(`/engines/${engine_id}/process`, { method: 'POST', body: JSON.stringify({ params }) });
    const jobId = sub.body && sub.body.job_id;
    if (!jobId) throw new MothError(`no job_id from ${engine_id} submit`, { engine_id, stage: 'submit' });
    let st;
    for (let i = 0; ; i++) {
      st = (await call(`/jobs/${jobId}/status`, {}, 15000)).body;
      if (st.status === 'completed') break;
      if (st.status === 'failed') {
        const e = st.error || {};
        throw new MothError(`Moth job ${engine_id} failed: ${e.message || 'unknown'}`,
          { job_id: jobId, engine_id, type: e.type, retryable: !!e.retryable });
      }
      if (i >= maxPolls) throw new MothError(`Moth job ${engine_id} still ${st.status} after ${maxPolls} polls`,
        { job_id: jobId, engine_id, stage: 'poll' });
      await sleep(pollMs);
    }
    const { body } = await call(`/jobs/${jobId}/result`, {}, 30000);
    return {
      job_id: jobId, engine_id,
      result: body && body.result !== undefined ? body.result : body,
      steps: st.steps ? st.steps.map((s) => `${s.name}:${s.status}`) : null,
      ms: Date.now() - t0,
    };
  }

  // comet-qrng-v1 — SP 800-90B-certified Born-rule bytes + optional unbiased
  // derivation + CHSH Bell witness. Sizing law: 8 B/float + 8 B/int + slack,
  // else "conditioned bytes ran out". A job can complete with no extractable
  // bytes -> retry (attempts), each attempt is a REAL 5-credit job: callers
  // on a budget pass attempts:1.
  async function qrng({ bytes, integers, floats = 0, mode = 'emu', attempts = 3, epsilon_log2 = 64, include_raw_counts = false, backend_name } = {}) {
    const derive = { ...(integers && { integers }), ...(floats && { floats }) };
    const output_bytes = Math.min(1e6, bytes ?? Math.max(32, 8 * floats + 8 * (integers?.count || 0) + 16));
    let why;
    for (let a = 0; a < attempts; a++) {
      const j = await run('comet-qrng-v1', {
        mode, output_bytes, include_raw_counts, epsilon_log2,
        ...(backend_name && { backend_name }),
        ...(Object.keys(derive).length && { derive }),
      });
      const o = (j.result && j.result.output) || {};
      const d = (o.random && o.random.derived) || {};
      const ints = (d.integers && d.integers.values) || [];
      const fl = d.floats || [];
      if (!o.random || !o.random.hex || (integers && !ints.length) || (floats && !fl.length)) {
        why = (o.random && o.random.derivation_error) || 'no conditioned bytes';
        continue;
      }
      return {
        job_id: j.job_id, ms: j.ms,
        hex: o.random.hex, bytes: Buffer.from(o.random.hex, 'hex'),
        integers: ints, floats: fl,
        bell_witness: o.bell_witness || null,
        min_entropy: (o.random && o.random.min_entropy) || o.min_entropy || null,
        provenance: o.provenance || { mode },
        output_bytes,
      };
    }
    throw new MothError(`comet-qrng-v1 returned nothing usable after ${attempts} job(s): ${why}`,
      { engine_id: 'comet-qrng-v1', retryable: true });
  }

  // blur-core-v1 — EXACT-mode quantum blur over an N-D grid of non-negative
  // numbers (shots omitted = deterministic; output rescaled to input max).
  // Shape law: output deep-shape must equal input deep-shape, else LOUD.
  async function blurExact(values, { strength = 0.5, reach, axes } = {}) {
    if (!Array.isArray(values)) throw new MothError('blurExact values must be an array (N-D grid)', { engine_id: 'blur-core-v1' });
    const j = await run('blur-core-v1', { values, strength, ...(reach != null && { reach }), ...(axes && { axes }) });
    const out = j.result && j.result.output;
    const shape = (v) => Array.isArray(v) ? [v.length, ...shape(v[0])] : [];
    if (!Array.isArray(out) || JSON.stringify(shape(out)) !== JSON.stringify(shape(values))) {
      throw new MothError(`blur-core-v1 output shape ${JSON.stringify(shape(out))} != input ${JSON.stringify(shape(values))}`,
        { job_id: j.job_id, engine_id: 'blur-core-v1' });
    }
    return { job_id: j.job_id, ms: j.ms, output: out, exact: true, strength };
  }

  // qpixl-v1 — values encoded as qubit angles, read back in one measurement;
  // the shot noise IS the effect. Array law: never a bare CSV string.
  async function qpixl(values, { machine = 'aer', shots = 1024, discretize = 0, dynamic_range = 'none' } = {}) {
    if (!Array.isArray(values)) throw new MothError('qpixl values must be a JSON array (bare CSV strings fail: unparseable_values)', { engine_id: 'qpixl-v1' });
    const j = await run('qpixl-v1', { values, machine, shots, discretize, dynamic_range });
    return { job_id: j.job_id, ms: j.ms, output: j.result && j.result.output, backend: j.result && j.result.backend };
  }

  // coin-toss-v1 — Hadamard coin, flat result shape (no output wrapper).
  async function coinToss({ shots = 16, mode = 'emu' } = {}) {
    const j = await run('coin-toss-v1', { shots, mode });
    const r = j.result || {};
    return { job_id: j.job_id, ms: j.ms, heads: r.heads, tails: r.tails, majority: r.output, backend: r.backend, mode: r.mode };
  }

  // otoc-echo-v1 — perturb a scrambled chain, reverse it, listen for what
  // returns: a signed, complex multi-tap delay map. exact:aer default
  // (infinite-shot expectation values). This is the fleet's scrambling
  // instrument; qthe's wash-out question (E-Q20) is its classical analogue.
  async function otocEcho({ depth = 8, disorder = 0, exact = true, include_taps = true, ...rest } = {}) {
    const j = await run('otoc-echo-v1', { depth, disorder, exact, include_taps, ...rest });
    return { job_id: j.job_id, ms: j.ms, result: j.result };
  }

  return { base, engines, engine, jobs, run, qrng, blurExact, qpixl, coinToss, otocEcho };
}
