// scripts/_creative_r21_bench.mjs — the bench round for the r21 creative piece
// (the-fourth-state's lineage law: Seed devil's advocate / DeepSeek line
// critic / MiMo landing judge, AS-SAID, sealed to
// situations/creative_r21/opinions_r21.jsonl before any push).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const KEY = process.env.DEEPINFRA_KEY;
if (!KEY) throw new Error('DEEPINFRA_KEY not set');
const PIECE = readFileSync('/home/z/my-project/ai-writings-staging/the-shapes-a-constructor-leaves.md', 'utf8');

const SEATS = [
  { seat: 'seed20mini', model: 'ByteDance/Seed-2.0-mini', role: `You are the devil's advocate of a creative bench reviewing a field-guide prose piece before it is pushed to a 21,995-entry creative repo. Attack: factual errors about the science it transmutes (a cellular automaton kernel; the piece claims specific measured facts), canon violations (the repo's FIELD_GUIDE already has the-four-weather-states.md about the four states; this piece is about constructor geometry and must NOT re-cover the states), and anything that would embarrass the author. Fabricating section citations is the one unforgivable. Answer ONLY JSON: {"verdict":"push|amend","amendments":[{"quote":"<exact words from the piece>","problem":"<why>","fix":"<concrete replacement>"}]}`, temp: 0.3 },
  { seat: 'deepseek-v41f', model: 'deepseek-ai/DeepSeek-V4.1-Flash', role: `You are the line critic of a creative bench. Judge the PROSE of this field-guide piece sentence by sentence: precision, rhythm, deadpan, whether the naturalist voice holds, whether any line is filler. Only flag what you would actually rewrite. Answer ONLY JSON: {"verdict":"push|amend","amendments":[{"quote":"<exact words>","problem":"<why>","fix":"<concrete replacement>"}]}`, temp: 0.3 },
  { seat: 'mimo-v26f', model: 'XiaomiMiMo/MiMo-V2.6-Flash', role: `You are the landing judge of a creative bench. Simulate a stranger from the repo's audience (people who read dense technical-creative hybrids) landing on this piece cold. Does it work without knowing the experiment? Does the ending land? Is the length honest? Answer ONLY JSON: {"verdict":"push|amend","notes":"<two sentences max>","amendments":[{"quote":"<exact words>","problem":"<why>","fix":"<concrete replacement>"}]}`, temp: 0.3 },
];

const rows = [];
mkdirSync('situations/creative_r21', { recursive: true });
const OUT = 'situations/creative_r21/opinions_r21.jsonl';
if (existsSync(OUT)) throw new Error(`${OUT} exists — append-only law`);
for (const s of SEATS) {
  const t0 = Date.now();
  const res = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: s.model, temperature: s.temp, max_tokens: 6000,
      messages: [
        { role: 'system', content: s.role },
        { role: 'user', content: `THE PIECE (a field guide to constructor geometry, transmuting a real experiment where a quantum-random-seeded cellular substrate was compared against PRNG-seeded and quantum-blur-conditioned planes; the measured facts: certified random bytes statistically indistinguishable from pseudo-random at every metric; the quantum blur left NEGATIVE spatial autocorrelation at t=0 (interference-shaped, not smoothing-shaped); spatial correlation had not equilibrated by tick 64 (a slow mode) while value-distributions had; a shuffled control with identical value-histograms persisted identically):\n\n${PIECE}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`deepinfra ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const raw = data.choices[0].message.content;
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); if (m) try { parsed = JSON.parse(m[0]); } catch {} }
  const usage = data.usage || {};
  const usd = Math.round((((usage.prompt_tokens || 0) / 1e6) * 0.15 + ((usage.completion_tokens || 0) / 1e6) * 0.60) * 1e6) / 1e6;
  rows.push({ round: 'r21', seat: s.seat, model: s.model, task: 'creative-bench', finish_reason: data.choices[0].finish_reason, usd, elapsed_ms: Date.now() - t0, verdict: parsed ? parsed.verdict : 'PARSE-FAIL', amendments: (parsed && parsed.amendments) || [], notes: (parsed && parsed.notes) || null, content_raw: raw, resume_safe: true });
  console.log(`${s.seat}: ${parsed ? parsed.verdict : 'PARSE-FAIL'} (${(parsed && parsed.amendments || []).length} amendments) $${usd} ${Date.now() - t0}ms`);
}
writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
const total = rows.reduce((a, r) => a + r.usd, 0);
console.log(`sealed ${OUT} — $${total.toFixed(6)} total`);
