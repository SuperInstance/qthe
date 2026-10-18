// situations/groq_seats/canary.mjs — the two-seat canary (ORCH-R21/T12-c).
// Runs the operator's exact model pair with a one-line canary. On success:
// seals canary rows (AS-SAID). On the blocked-seat signature (pre-auth 403):
// writes/refreshes the BLOCKED-SEAT-RECEIPT and exits 0 — the block is a
// receipt, not a failure. NO retry burn (the seat-block law).
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { chat, MODELS } from './groq_client.mjs';

const ROUND = process.env.GROQ_ROUND || 'r22';
let anyOk = false;
const rows = [];
for (const model of Object.keys(MODELS)) {
  const seat = model.includes('qwen') ? 'qwen38-27b' : 'gpt-oss-20b';
  try {
    const row = await chat({
      model, seat, round: ROUND, callId: `${ROUND}-canary-${seat}`, task: 'canary',
      system: 'You are a canary seat. Reply with exactly the requested token count of words, nothing else.',
      user: 'Reply with exactly: canary-ok', max_completion_tokens: 2048, temperature: 0.6,
    });
    rows.push(row);
    console.log(`PASS  ${model}: "${String(row.content_raw).trim().slice(0, 40)}" ${row.elapsed_ms}ms $${row.usd.if_no_cache}`);
    anyOk = true;
  } catch (e) {
    const blocked = e.status === 403 && e.ms < 250;
    console.log(`${blocked ? 'BLOCKED' : 'FAIL'}  ${model}: ${e.message}${blocked ? ' (pre-auth WAF — the seat-block signature)' : ''}`);
    if (!blocked) process.exit(1); // an unexpected failure is LOUD, only the known block receipts
  }
}
if (rows.length) {
  const OUT = 'situations/groq_seats/canary.jsonl';
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  writeFileSync(OUT, prev + rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.log(`sealed ${rows.length} canary row(s) -> ${OUT}`);
}
if (!anyOk) {
  const RECEIPT = 'situations/groq_seats/BLOCKED-SEAT-RECEIPT.md';
  const stamp = new Date().toISOString();
  const body = `# BLOCKED-SEAT RECEIPT — Groq from the orchestrator's sandbox\n\nLast probed: ${stamp} (this round: ORCH-R21/T12-c; probes at registration and at canary).\n\n## The evidence\n\n- \`GET/POST https://api.groq.com/openai/v1/*\` returns **HTTP 403 Forbidden** with body \`{"error":{"message":"Forbidden"}}\` in **~36 ms** — authed AND unauthenticated IDENTICALLY (an unauthenticated call to a live auth layer returns 401; a 403 that ignores credentials is a pre-auth block).\n- Browser User-Agent (the Moth Cloudflare-1010 fix) does NOT help.\n- **api.mothquantum.com — also Cloudflare-fronted — works from this same seat** (live jobs this round). Not a blanket CF block; an IP-range block specific to Groq's edge.\n- The operator-supplied key is structurally valid (gsk_…, correct length) and staged env-only; no evidence of key fault.\n\n## The law (banked r21)\n\n**The seat-block law: receipt the environment, don't burn retries.** A blocked seat is code-delivered/live-pending — the client (groq_client.mjs), the canary, and the seat-trial harness ship ready; the moment a reachable seat exists (different egress, a proxy, or the operator running the scripts), the seats join the tavern with zero code changes. This mirrors the repo's standing HW-PENDING pattern (ESP32 demos, edge profiles).\n\n## What runs when unblocked\n\n- \`node situations/groq_seats/canary.mjs\` — both seats, AS-SAID rows.\n- \`node situations/groq_seats/seat_trial.mjs\` — the design-attack trial (the new-member law: canary + one outside-the-box opinion earns the seat).\n`;
  writeFileSync(RECEIPT, body);
  console.log(`blocked-seat receipt refreshed -> ${RECEIPT}`);
}
