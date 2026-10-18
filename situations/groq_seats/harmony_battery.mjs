// situations/groq_seats/harmony_battery.mjs — the Groq arm of HARMONY-r22
// (ORCH-R22/T13-c): the same 6-statement battery, the same briefing, AS-SAID
// rows. Runs from ANY reachable seat (the Actions seat dispatches this; the
// row's via_relay field receipts the route).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chat } from './groq_client.mjs';

const ROUND = process.env.GROQ_ROUND || 'r22';
const HERE = new URL('.', import.meta.url).pathname;
const ROOT = HERE.replace(/situations\/groq_seats\/$/, '');
const briefing = readFileSync(ROOT + 'situations/harmony_r22/briefing.txt', 'utf8');
const statements = JSON.parse(readFileSync(ROOT + 'situations/harmony_r22/statements.json', 'utf8'));
const ids = Object.keys(statements);

const system = `You are a careful technical reader being tested on comprehension of an experiment record. Answer ONLY with a JSON object: {"answers":[{"id":"S1","answer":"TRUE|FALSE|UNCERTAIN","confidence":0.0-1.0,"reason":"one sentence"}]} — one entry per statement, in order. Judge strictly from the briefing. When the briefing settles a statement, do not answer UNCERTAIN.`;

const user = `${briefing}

STATEMENTS:
${ids.map((id) => `${id}: ${statements[id]}`).join('\n')}

Answer for all ${ids.length} statements.`;

for (const [model, seat] of [['qwen/qwen3.8-27b', 'qwen38-27b'], ['openai/gpt-oss-20b', 'gpt-oss-20b']]) {
  const row = await chat({
    model, seat, round: ROUND, callId: `${ROUND}-harmony-${seat}`, task: 'harmony-battery',
    system, user, max_completion_tokens: 2048,
  });
  const OUT = `situations/groq_seats/harmony_${ROUND}.jsonl`;
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  writeFileSync(OUT, prev + JSON.stringify(row) + '\n');
  let parsed = null;
  try { parsed = JSON.parse(row.content_raw); } catch { const m = row.content_raw.match(/\{[\s\S]*\}/); if (m) try { parsed = JSON.parse(m[0]); } catch {} }
  console.log(`${seat}: ${row.finish_reason} $${row.usd.if_no_cache} ${row.elapsed_ms}ms — ${parsed ? (parsed.answers || []).map((a) => `${a.id}=${a.answer}`).join(' ') : 'PARSE-FAIL (row sealed raw)'}`);
}
