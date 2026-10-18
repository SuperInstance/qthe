// situations/groq_seats/groq_client.mjs — the Groq seat client (ORCH-R21/T12-c).
//
// STATUS: CODE-DELIVERED, LIVE-PENDING. The operator's dispatch adds Groq as
// a rapid-cheap seat family ("qwen/qwen3.8-27b", "openai/gpt-oss-20b") in
// harmony with the typesafe.ai tooling. This seat is BLOCKED from the
// orchestrator's sandbox: api.groq.com returns HTTP 403 in ~36 ms PRE-AUTH
// (authed and no-auth identical; browser User-Agent does not help; Moth —
// also Cloudflare-fronted — works from the same seat, so this is an IP-range
// block, not a key fault). Receipt: BLOCKED-SEAT-RECEIPT.md.
//
// DESIGN LAWS (the tavern's, carried verbatim):
// - AS-SAID rows: every call seals {round, call_id, seat, task, model,
//   prompt_hash, prefix_sha256, finish_reason, usage_norm, usd, elapsed_ms}
//   — opinions are priced, never laundered.
// - key doctrine: GROQ_API_KEY from env ONLY; never in a row, log, or file.
// - fail-closed: a 401/403 throws GroqError with the evidence; NO retry burn
//   (the seat-block law: receipt the environment, don't hammer it).
// - pricing: Groq's listed usd/1M rates carried in RATES below; with_cache
//   accounting mirrors the DeepInfra seats' schema so the tavern ledger
//   reads one shape.

import { createHash } from 'node:crypto';

export const BASE = 'https://api.groq.com/openai/v1';
export const MODELS = {
  'qwen/qwen3.8-27b': { in: 0.29, out: 0.59, reasoning_effort: true, note: 'the qwen seat (operator-dispatched)' },
  'openai/gpt-oss-20b': { in: 0.10, out: 0.20, reasoning_effort: true, note: 'the oss seat (operator-dispatched)' },
};

export class GroqError extends Error {
  constructor(message, info = {}) {
    super(message);
    this.name = 'GroqError';
    Object.assign(this, info); // { status, ms, blocked }
  }
}

export function loadKey() {
  const k = process.env.GROQ_API_KEY;
  if (!k) throw new GroqError('GROQ_API_KEY not set (env-only key doctrine)', { status: 0 });
  return k;
}

// one chat completion -> an AS-SAID-shaped row (the tavern ledger schema).
// opts: { temperature, max_completion_tokens, top_p, reasoning_effort, stream:false }
export async function chat({ model, system, user, round, callId, seat, task, temperature = 0.6, max_completion_tokens = 2048, top_p = 0.95, reasoning_effort = 'default', fetch: doFetch = globalThis.fetch, timeoutMs = 60000 }) {
  if (!MODELS[model]) throw new GroqError(`unknown seat model ${model} (known: ${Object.keys(MODELS).join(', ')})`, { status: 0 });
  const key = loadKey();
  const prompt = (system || '') + '\n\n' + (user || '');
  const promptHash = createHash('sha256').update(prompt, 'utf8').digest('hex');
  const t0 = Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await doFetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: user }],
        model, temperature, max_completion_tokens, top_p, reasoning_effort, stream: false,
      }),
      signal: ctl.signal,
    });
    const ms = Date.now() - t0;
    const text = await res.text();
    if (!res.ok) {
      // the seat-block signature: pre-auth 403, tiny latency
      throw new GroqError(`groq ${res.status} in ${ms}ms: ${text.slice(0, 200)}`,
        { status: res.status, ms, blocked: res.status === 403 && ms < 250 });
    }
    const data = JSON.parse(text);
    const choice = data.choices[0];
    const usage = data.usage || {};
    const rates = MODELS[model];
    const price = { with_cache: 0, if_no_cache: 0, basis: `provider-listed usd/1M (${model}: $${rates.in}/1M in, $${rates.out}/1M out)` };
    price.if_no_cache = Math.round(((usage.prompt_tokens || 0) / 1e6 * rates.in + (usage.completion_tokens || 0) / 1e6 * rates.out) * 1e6) / 1e6;
    price.with_cache = price.if_no_cache; // Groq lists no prompt-cache discount at press time; honest zero-delta
    return {
      round, call_id: callId, seat, task,
      model_requested: model, model_served: data.model || model,
      temperature, max_completion_tokens, reasoning_effort,
      prompt_hash: promptHash,
      prefix_sha256: createHash('sha256').update(system || '', 'utf8').digest('hex'),
      sealed_at: new Date().toISOString(),
      finish_reason: choice.finish_reason,
      content_raw: choice.message.content,
      usage_norm: { prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens },
      usd: price,
      elapsed_ms: ms,
      resume_safe: true,
    };
  } finally { clearTimeout(timer); }
}
