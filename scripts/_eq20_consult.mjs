// scripts/_eq20_consult.mjs — one ATTACK-briefed Seed-2.0-mini call on the
// E-Q20 registration (the E-Q17/E-Q18/E-Q19 discipline: attacks on the frozen
// design, AS-SAID, sealed to situations/e_q20_design_attack.jsonl; any
// accepted attack becomes a pre-run amendment — none after the first data row).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KEY = process.env.DEEPINFRA_KEY;
if (!KEY) throw new Error('DEEPINFRA_KEY not set');
const MODEL = 'ByteDance/Seed-2.0-mini';
const SEAT = 'seed20mini';
const CALL_ID = 'r21-eq20-seed20mini-designattack';

const reg = readFileSync('experiments/pre_registration_e_q20.json', 'utf8');
const regSha = createHash('sha256').update(reg, 'utf8').digest('hex');

const context = `KERNEL FACTS (sealed ground truth, do not re-derive):
- qthe.mjs: 8-bit packed cells [tau:2][d:6]; Psi(tau) in {Ground 0, Attract +1, Repel -1, Abstain i}; Moore-8 neighborhood; torus topology; compile-time 64-slot wormhole table; tick(cells) is PURE and DETERMINISTIC (LAYER 0 law F0: same initial bytes + same tick count -> byte-identical planes, exhaustively tested).
- makeSubstrate(w, h, seedFn): seedFn(x, y, i) -> byte & 0xff fills the whole initial plane. This is the ONLY construction-time injection point — the experiment's entire quantum attack surface.
- d saturates at min(d+1, 63); wormhole resonance writes across the table; twin events are emitted by the kernel itself.

MOTH ENGINE FACTS (live-receipted by the fleet, 2026-09-29 + this session):
- comet-qrng-v1: Born-rule bytes on IBM hardware or Aer emu; SP 800-90B min-entropy certificate; Toeplitz extractor with epsilon_log2 security parameter; CHSH Bell witness (fleet live prior S=2.80 emu). Conditioned bytes can run out if output_bytes undersized.
- blur-core-v1: quantum blur over N-D grids of non-negative numbers; EXACT mode when shots omitted (deterministic); output RESCALED to input max (sum NOT conserved); the blur walks qubit/bit neighbours, not just +/-1 grid neighbours.

THE QUESTION: does construction provenance (PRNG vs certified QRNG vs quantum-blur-conditioned geometry) leave a fingerprint that survives tick dynamics, or does the tick operator wash it out?`;

const system = `You are the devil's advocate seat of the qthe tavern (an LLM review bench for a cellular-automata kernel repo, SuperInstance/qthe). House law: judges draft, the repo decides; opinions are priced AS-SAID; every attack must name its exact target and be falsifiable by running code. You are ATTACK-BRIEFED: your job is to find real defects in an experiment design BEFORE it runs. A good attack names a confound, an incoherent metric, a floor that cannot hold, or a verdict rule that misreads its own data. Wrong-but-sharp attacks are acceptable; vague ones are not. Answer ONLY with a JSON object: {"mode":"design-attack","attacks":[{"id":"A1","severity":"critical|major|minor","target":"<exact field/section of the registration>","attack":"<the defect>","cheapest_falsifier":"<how to check it>","fix_sketch":"<the concrete amendment if accepted>"}]}`;

const user = `The experiment registration below is frozen and about to run. Attack it.

${context}

REGISTRATION (the canon to attack):
${reg}

Attack the design: the arms (A2's 40960-of-49152 byte consumption; A3's tau-from-A2 + blur d-field + round-half-up requantization; A3S's fixed-seed shuffle as the marginals control), the statistical power (A1 n=10 as the noise-floor population, A3/A3S n=5), the metrics (64-bin Wasserstein with these n; Moran's I rook-4 on a torus; the leave-one-out 95th-pct floor), the floors (F2's CHSH S>2 halt; F3's exact-mode; F5's marginal identity), the verdict rules (H1/H2/H3, the T* wash-out tick definition), and the honest-null framing of C11 itself. Maximum 6 attacks, sharpest first.`;

const prompt = system + '\n\n' + user;
const promptHash = createHash('sha256').update(prompt, 'utf8').digest('hex');

const t0 = Date.now();
const res = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
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
price.with_cache = ((usage.prompt_cache_hit_tokens || 0) / 1e6) * 0.15 + (usage.completion_tokens / 1e6) * 0.60;
price.if_no_cache = Math.round(price.if_no_cache * 1e6) / 1e6;
price.with_cache = Math.round(price.with_cache * 1e6) / 1e6;

const row = {
  round: 'r21', call_id: CALL_ID, seat: SEAT, task: 'design-attack',
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
const OUT = 'situations/e_q20_design_attack.jsonl';
if (existsSync(OUT)) throw new Error(`${OUT} already exists — append-only law; refusing to clobber`);
writeFileSync(OUT, JSON.stringify(row) + '\n');
console.log(`sealed ${OUT}: ${parsed ? parsed.attacks.length : 'PARSE-FAIL'} attacks, $${price.with_cache}, ${elapsed}ms, finish=${choice.finish_reason}`);
if (parsed) for (const a of parsed.attacks) console.log(`  ${a.id} [${a.severity}] ${a.target}: ${String(a.attack).slice(0, 110)}…`);
