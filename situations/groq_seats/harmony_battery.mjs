// situations/groq_seats/harmony_battery.mjs — the Groq arm of HARMONY-r22
// (ORCH-R22/T13-c): the same 6-statement battery, the same briefing, AS-SAID
// rows. Runs from ANY reachable seat (the Actions seat dispatches this; the
// row's via_relay field receipts the route).
//
// THE REASONING-BUDGET LAW (r22, receipted): gpt-oss-20b at effort=medium
// burned ALL 2048 completion tokens on reasoning and emitted NOTHING
// (finish_reason=length, empty content, run 39141436502) — reasoning tokens
// count against max_completion_tokens. Per-model headroom: qwen 2048,
// gpt-oss 6144.
// Resume law: skips call_ids already sealed (no re-spend); optional argv[2]
// filters to one seat.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chat } from './groq_client.mjs';

const ROUND = process.env.GROQ_ROUND || 'r22';
const ONLY = process.argv[2] || null;
const SUFFIX = process.env.GROQ_BATTERY_SUFFIX || ''; // amendment suffix for call_ids (v2 after a receipted mis-budget; the v1 rows stand
const HERE = new URL('.', import.meta.url).pathname;
const ROOT = HERE.replace(/situations\/groq_seats\/$/, '');
const briefing = readFileSync(ROOT + 'situations/harmony_r22/briefing.txt', 'utf8');
const statements = JSON.parse(readFileSync(ROOT + 'situations/harmony_r22/statements.json', 'utf8'));
const ids = Object.keys(statements);
const OUT = `situations/groq_seats/harmony_${ROUND}.jsonl`;
const sealed = new Set(existsSync(OUT) ? readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l).call_id; } catch { return '?'; } }) : []);

const system = `You are a careful technical reader being tested on comprehension of an experiment record. Answer ONLY with a JSON object: {"answers":[{"id":"S1","answer":"TRUE|FALSE|UNCERTAIN","confidence":0.0-1.0,"reason":"one sentence"}]} — one entry per statement, in order. Judge strictly from the briefing. When the briefing settles a statement, do not answer UNCERTAIN.`;

const user = `${briefing}

STATEMENTS:
${ids.map((id) => `${id}: ${statements[id]}`).join('\n')}

Answer for all ${ids.length} statements.`;

for (const [model, seat, maxTokens] of [['qwen/qwen3.8-27b', 'qwen38-27b', 2048], ['openai/gpt-oss-20b', 'gpt-oss-20b', 6144]]) {
  if (ONLY && seat !== ONLY) continue;
  const callId = `${ROUND}-harmony-${seat}${SUFFIX}`;
  if (sealed.has(callId)) { console.log(`${seat}: ${callId} already sealed — resuming past it (no re-spend)`); continue; }
  const row = await chat({
    model, seat, round: ROUND, callId, task: 'harmony-battery',
    system, user, max_completion_tokens: maxTokens,
  });
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  writeFileSync(OUT, prev + JSON.stringify(row) + '\n');
  let parsed = null;
  try { parsed = JSON.parse(row.content_raw); } catch { const m = row.content_raw.match(/\{[\s\S]*\}/); if (m) try { parsed = JSON.parse(m[0]); } catch {} }
  console.log(`${seat}: ${row.finish_reason} $${row.usd.if_no_cache} ${row.elapsed_ms}ms — ${parsed ? (parsed.answers || []).map((a) => `${a.id}=${a.answer}`).join(' ') : 'PARSE-FAIL (row sealed raw)'}`);
}
