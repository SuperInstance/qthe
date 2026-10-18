// situations/groq_seats/seat_trial.mjs — the new-member trial harness for the
// Groq seats (ORCH-R21/T12-c), shaped by the r13 new-member law: a seat is
// EARNED by a canary + one outside-the-box opinion/design-attack, AS-SAID.
// LIVE-PENDING: refuses to run while the seat is blocked (run canary.mjs
// first; it refreshes BLOCKED-SEAT-RECEIPT.md on the 403 signature).
//
// Usage: node situations/groq_seats/seat_trial.mjs [attack-target.json]
// The trial payload defaults to the NEXT registered experiment's
// pre-registration (the same discipline the Seed seat runs) — concrete,
// falsifiable, and priced.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chat } from './groq_client.mjs';

const RECEIPT = 'situations/groq_seats/BLOCKED-SEAT-RECEIPT.md';
if (existsSync(RECEIPT)) {
  console.error('[seat-trial] seat BLOCKED (see BLOCKED-SEAT-RECEIPT.md) — run canary.mjs from a reachable seat first; refusing to burn retries (the seat-block law)');
  process.exit(3);
}

const target = process.argv[2] || 'experiments/pre_registration_e_q20b.json'; // r22: the current registration (E-Q20b); r21 default was e_q20
const ROUND = process.env.GROQ_ROUND || 'r22';
const reg = readFileSync(target, 'utf8');

const system = `You are a candidate seat of the qthe tavern (an LLM review bench for a cellular-automata kernel repo, SuperInstance/qthe). House law: judges draft, the repo decides; opinions are priced AS-SAID; every attack must name its exact target and be falsifiable by running code. You are ATTACK-BRIEFED and OUTSIDE-THE-BOX-BRIEFED: your value is the angle the incumbent seats miss. Answer ONLY with a JSON object: {"mode":"design-attack","attacks":[{"id":"A1","severity":"critical|major|minor","target":"<exact field/section>","attack":"<the defect>","cheapest_falsifier":"<how to check it>","fix_sketch":"<the concrete amendment if accepted>"}]}`;

const user = `The experiment registration below is frozen and about to run (or has just run — attack the DESIGN either way). Attack it.\n\nREGISTRATION:\n${reg.slice(0, 12000)}\n\nMaximum 6 attacks, sharpest first, your own angle.`;

for (const [model, seat] of [['qwen/qwen3.8-27b', 'qwen38-27b'], ['openai/gpt-oss-20b', 'gpt-oss-20b']]) {
  const row = await chat({
    model, seat, round: ROUND, callId: `${ROUND}-seattrial-${seat}`, task: 'design-attack',
    system, user, max_completion_tokens: 4096, // r22: temperature/top_p/reasoning_effort defer to MODELS defaults (the operator's per-model dispatch — gpt-oss 400s on effort=default)
  });
  const OUT = `situations/groq_seats/seat_trial_${ROUND}.jsonl`;
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  writeFileSync(OUT, prev + JSON.stringify(row) + '\n');
  let parsed = null;
  try { parsed = JSON.parse(row.content_raw); } catch { const m = row.content_raw.match(/\{[\s\S]*\}/); if (m) try { parsed = JSON.parse(m[0]); } catch {} }
  console.log(`${seat}: ${row.finish_reason} $${row.usd.if_no_cache} ${row.elapsed_ms}ms — ${parsed ? (parsed.attacks || []).length + ' attacks' : 'PARSE-FAIL (row sealed raw)'}`);
}
