// scripts/_eq18_consult.mjs — one ATTACK-briefed Seed-2.0-mini call on the
// E-Q18 registration (the E-Q17 consult discipline: attacks on the frozen
// design, AS-SAID, sealed to situations/e_q18_design_attack.jsonl; any
// accepted attack becomes a pre-run amendment — none after the first data row).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KEY = process.env.DEEPINFRA_KEY;
if (!KEY) throw new Error('DEEPINFRA_KEY not set');
const MODEL = 'ByteDance/Seed-2.0-mini';
const SEAT = 'seed20mini';
const CALL_ID = 'r18-eq18-seed20mini-designattack';

const reg = readFileSync('experiments/pre_registration_e_q18.json', 'utf8');
const regSha = createHash('sha256').update(reg, 'utf8').digest('hex');
const eq17verdict = readFileSync('experiments/outputs/e_q17_verdict.md', 'utf8');

const system = `You are the devil's advocate seat of the qthe tavern (an LLM review bench for a cellular-automata kernel repo, SuperInstance/qthe). House law: judges draft, the repo decides; opinions are priced AS-SAID; every attack must name its exact target and be falsifiable by running code. You are ATTACK-BRIEFED: your job is to find real defects in an experiment design BEFORE it runs. A good attack names a confound, an incoherent metric, a floor that cannot hold, or a verdict rule that misreads its own data. Wrong-but-sharp attacks are acceptable; vague ones are not. Answer ONLY with a JSON object: {"mode":"design-attack","attacks":[{"id":"A1","severity":"critical|major|minor","target":"<exact field/section of the registration>","attack":"<the defect>","cheapest_falsifier":"<how to check it>","fix_sketch":"<the concrete amendment if accepted>"}]}`;

const user = `The experiment registration below is frozen and about to run. Attack it.

CONTEXT (sealed prior ground):
${eq17verdict.slice(0, 3500)}

REGISTRATION (the canon to attack):
${reg}

Attack the design: the two-level table semantics (region map, s = d&7 fold, b = d>>3 buckets, presence masks, fixed-order escalation, +1 tick), the arms/ladder, the metrics (pf/provFrac/provDirect, the instrument asymmetry receipt, delivery meter, contention), the controls (F0-T transcription, F1, F-CAL bit-exact reproduction, F0 determinism), and the verdict rules (H1/H2/H3 with their thresholds). Maximum 6 attacks, sharpest first.`;

const prompt = system + '\n\n' + user;
const promptHash = createHash('sha256').update(prompt, 'utf8').digest('hex');

const t0 = Date.now();
const res = await fetch(`https://api.deepinfra.com/v1/openai/chat/completions`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 10000,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  }),
});
if (!res.ok) throw new Error(`deepinfra ${res.status}: ${await res.text()}`);
const data = await res.json();
const elapsed = Date.now() - t0;
const choice = data.choices[0];
const raw = choice.message.content;

let parsed = null, parseMethod = null;
try { parsed = JSON.parse(raw); parseMethod = 'direct'; } catch {
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { parsed = JSON.parse(m[0]); parseMethod = 'regex-extract'; } catch {} }
}

const usage = data.usage || {};
const price = { with_cache: 0.0, if_no_cache: 0.0, basis: 'provider-listed usd/1M (seed20mini: $0.15/1M in, $0.60/1M out)' };
price.if_no_cache = (usage.prompt_tokens / 1e6) * 0.15 + (usage.completion_tokens / 1e6) * 0.60;
price.with_cache = ((usage.prompt_tokens - (usage.prompt_tokens - (usage.prompt_cache_hit_tokens || 0))) / 1e6) * 0.15 + (usage.completion_tokens / 1e6) * 0.60;
price.if_no_cache = Math.round(price.if_no_cache * 1e6) / 1e6;
price.with_cache = Math.round(price.with_cache * 1e6) / 1e6;

const row = {
  round: 'r18', call_id: CALL_ID, seat: SEAT, task: 'design-attack',
  model_requested: MODEL, model_served: data.model || MODEL,
  temperature: 0.3, max_tokens: 10000,
  prompt_hash: promptHash,
  prefix_sha256: createHash('sha256').update(system, 'utf8').digest('hex'),
  sealed_at: new Date().toISOString(),
  attacks_pre_registration_sha256: regSha,
  finish_reason: choice.finish_reason,
  content_raw: raw,
  content_json: parsed,
  parse_method: parseMethod,
  usage_norm: { prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens, prompt_cache_hit_tokens: usage.prompt_cache_hit_tokens ?? 0 },
  usd: price,
  elapsed_ms: elapsed,
  resume_safe: true,
};
const OUT = 'situations/e_q18_design_attack.jsonl';
if (existsSync(OUT)) throw new Error(`${OUT} already exists — append-only law; refusing to clobber`);
writeFileSync(OUT, JSON.stringify(row) + '\n');
console.log(`sealed ${OUT}: ${parsed ? parsed.attacks.length : 'PARSE-FAIL'} attacks, $${price.with_cache}, ${elapsed}ms, finish=${choice.finish_reason}`);
if (parsed) for (const a of parsed.attacks) console.log(`  ${a.id} [${a.severity}] ${a.target}: ${String(a.attack).slice(0, 110)}…`);
