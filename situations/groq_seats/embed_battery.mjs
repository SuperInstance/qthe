// situations/groq_seats/embed_battery.mjs — the Groq arm of E-Q21
// (ORCH-R23/T14-a, claim C15): the SAME 8-probe battery through both Groq
// seats, one call per record, JSON-scored. Vectors ride the artifact home;
// the orchestrator upserts to Vectorize from the sandbox (the CF token never
// enters this repo). Resume law: skips sealed call_ids. Per-model token
// budgets per the r22 reasoning-budget law (qwen 2048 / gpt-oss 6144).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chat } from './groq_client.mjs';

const ROUND = process.env.GROQ_ROUND || 'r23';
const HERE = new URL('.', import.meta.url).pathname;
const ROOT = HERE.replace(/situations\/groq_seats\/$/, '');
const corpus = JSON.parse(readFileSync(ROOT + 'situations/embedding_r23/corpus.json', 'utf8'));
const OUT = `situations/groq_seats/embed_${ROUND}.jsonl`;
const sealed = new Set(existsSync(OUT) ? readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l).call_id; } catch { return '?'; } }) : []);

const AXES = [
  ['P1_nonlocal', 'NON-LOCAL coupling — distant cells, wormholes, twin resonance, remote slot reads and writes'],
  ['P2_localrule', "the LOCAL update rule's physics — neighborhood coupling, timbre states, thresholds, cascades, saturation"],
  ['P3_quantum', 'QUANTUM construction or randomness provenance — certified entropy, Bell witnesses, quantum blur, interference'],
  ['P4_alloc', 'ALLOCATION or ARBITRATION — task routing, queues, starvation, priorities, arbitration among consumers'],
  ['P5_repair', 'REPAIR, healing, self-maintenance, or recovery from damage'],
  ['P6_null', 'a REFUTED or failed hypothesis — an honest null, a DIES verdict, a falsified claim'],
  ['P7_econ', 'COST, price, performance, or economics — token budgets, pricing tiers, speed and spend'],
  ['P8_exact', 'EXACTNESS or determinism — byte-identity, replay, verification, reproducibility'],
];

const system = `You are an embedding instrument. For each record you will score 8 fixed semantic axes from 0 (zero) to 4 (central), each an independent continuous score. Answer ONLY with a JSON object: {"scores":{"P1_nonlocal":0-4,"P2_localrule":0-4,"P3_quantum":0-4,"P4_alloc":0-4,"P5_repair":0-4,"P6_null":0-4,"P7_econ":0-4,"P8_exact":0-4}} — no prose, no reasoning text in the answer.`;

for (const [model, seat, maxTokens] of [['qwen/qwen3.8-27b', 'qwen38-27b', 2048], ['openai/gpt-oss-20b', 'gpt-oss-20b', 6144]]) {
  for (const rec of corpus.records) {
    const callId = `${ROUND}-embed-${seat}-${rec.id}`;
    if (sealed.has(callId)) { console.log(`${seat} ${rec.id}: already sealed — resuming`); continue; }
    const user = `RECORD ${rec.id} (from the qthe kernel's sealed experiment record):\n\n${rec.text}\n\nAXES (score each 0-4 for THIS record):\n${AXES.map(([ax, d]) => `- ${ax}: ${d}`).join('\n')}`;
    const row = await chat({
      model, seat, round: ROUND, callId, task: 'embedding-probe',
      system, user, max_completion_tokens: maxTokens,
    });
    const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    writeFileSync(OUT, prev + JSON.stringify(row) + '\n');
    let parsed = null;
    try { parsed = JSON.parse(row.content_raw); } catch { const m = row.content_raw.match(/\{[\s\S]*\}/); if (m) try { parsed = JSON.parse(m[0]); } catch {} }
    const s = parsed && parsed.scores ? AXES.map(([ax]) => parsed.scores[ax]).join(',') : 'PARSE-FAIL';
    console.log(`${seat} ${rec.id}: ${row.finish_reason} ${row.elapsed_ms}ms $${row.usd.if_no_cache} [${s}]`);
  }
}
