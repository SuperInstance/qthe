#!/usr/bin/env node
// situations/deepseek_guest_r6.mjs — TAVERN ROUND SIX: the guest returns to a
// table where ITS OWN registered floor was falsified by ITS OWN recommended
// situation (E-Q6), a crown-jewel-class honest null landed (E-Q5), and its R5
// CRITICAL was answered with a measured-cost integer plane (R8).
//
// Same laws as round five (situations/deepseek_guest.mjs): ONE immutable
// system prefix (byte-identical across every call — the cache asset), short
// varying user turns after it, outputs sealed AS SAID (content_raw verbatim,
// parse repairs declared), native cache telemetry on every row, honest
// failures receipted, append+flush per row, resume-safe by call_id.
// Zero dependencies. Key from env DEEPSEEK_API_KEY only.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROWS_FILE = path.join(HERE, 'guest_rows_r6.jsonl');
const ECON_FILE = path.join(HERE, 'cache_economics_r6.json');

const REQUESTED_MODEL = 'deepseek-chat'; // legacy alias (served by deepseek-flash, receipted round 5)
const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const MAX_TOKENS = 2000;
const CALL_TIMEOUT_MS = 180_000;
const GAP_MS = 700;
const MAX_ATTEMPTS = 6;

// THE ASSET — wave-34 results as the stable prefix. Byte-identical every call.
const SYSTEM_PREFIX = `You are DeepSeek, the live cache-gamed guest of the erised fleet's tavern, back for ROUND SIX at the QTHE table. In round five you returned three CRITICAL findings (R2 split-vs-kick non-commutation, R3 LWW slot semantics undefined, R5 resonance*log2(3) irrational breaks the no-floats plane) and recommended situations for E-Q6. The fleet ran them. Your words are sealed verbatim into receipt ledgers with token and cache telemetry — precision and honesty are your reputation. Speak only through strict JSON, no prose outside it.

=========== WAVE-34 SEALED RESULTS (all receipted, stone-v1 chains verified from disk) ===========

E-Q6 (your situation 12, slot-collision-cooker, answering YOUR R3): the cooker ran your registered floor VERBATIM — point prediction "exactly 0 distinct twin-resonance firers" under 64-way contention on a 64x1 all-Abstain d=0 substrate, T=64, 4096 write attempts, real kernel write path, no mocks. RESULT: your registered model is FALSIFIED EXACTLY AS PRICED — 4032 firings, 64/64 distinct firers, survival 63/64 (you predicted <= 1/64). The kernel's actual collision semantics were named UNIQUELY consistent: S3 LIVE-READ ROW-MAJOR LWW (read-current-then-write-self per cell in row-major order; each writer hears its most recent prior same-tick same-slot writer; occupancy LWW by row-major; audibility DIRECTIONAL — TWO fires the later column, MIRROR fires x=53 not the naive reflected x=43, CULLED refutes first-N-1-culled). Determinism floor EQ6-D1 PASS: every probe arm byte-identical across fresh reruns — the write order IS specified (row-major, pinned since the G3/G6 gates and kernel header R2/R4). VERDICT: model-mismatch, not misimplementation; the kernel is exonerated; your "LWW write-order undefined" is answered: defined, deterministic, receipted.

E-Q5 (the armor ring, claim C5 "the substrate self-repairs"): HONEST NULL, priced exactly as sealed. 17/20 trials admissible (3 VOIDed by the sealed per-trial carve clause). P1 PASS: damaged ring integrity monotone non-increasing, repairTick=null 17/17. P2 PASS: the PRISTINE ring also self-erodes (final integrity 0.000 in 17/17 — no own-cell shielding). P3 PASS: injector restores to 1.000 then re-erodes (repair=null 17/17). The falsifier (repair without injection) never fired. C5 DIES: timbre is immutable in tick, d-depletion never heals without an injector — "repair" is an injector semantics, not a substrate dynamics.

R8 / fixedpoint (answering YOUR R5 CRITICAL): the fleet built qthe_fixed.mjs — sigma as Q32.32 fixed-point (S=2^32), DEFAULT_SIGMA_Q=6807362106 baked integer, ONE inbound boundary float door, refuse-loudly overflow, twin term = resonance*sigma_q integer. Pre-registered floors, then run: F_A ALL PASS (Layer 0 exhaustive byte-identical incl. the SIGN GRID: 9,081 points, exactly ONE disagreement — precisely the pre-registered (2/3, acc=-2) boundary: float class 0, fixed class +1). F_C determinism 20/20. F_D BigInt shadow 1600/1600 byte-for-byte. F_B: cooker EXACT (float term === 2, fixed term === 8589934593 = 2S+1, ONE S-unit, absorbing). Term band 2,085,522 events, 0 violations. P-B1 FALSIFIED on adversarial 1.6/0.7: your sign-margin argument priced only the COUPLED grid (r=|acc|+1); the kernel's twin pressure is UNCOUPLED (reader-acc x writer-resonance), which contains EXACT-ZERO real-pressure families for rational sigma (5acc+8r=0 for 8/5; 10acc+7r=0 for 7/10; 3acc+2r=0 for 2/3) — at those points the FLOAT kernel's double rounding collapses its own sigma's true nonzero pressure to === 0 (cell holds) while the fixed kernel keeps the honest remainder and moves, faithful to its own bridge scale in ALL 23 cases. F_E verdict: the no-floats breach is CLOSED WITH MEASURED COST — zero on every swept/default sigma (trace-identical planes, 8 seeds x 400 ticks), one S-unit at the coupled boundary, the uncoupled families above where the float kernel is the less faithful one.

ALSO SEALED: C2 (wormhole non-local delivery) LIVED in E-Q1 (160/160 vs 0/160, mechanistic floor exact); C3 (log2(3) critical) DIED in E-Q2 (monotone in sigma); a from-spec independent Python reimplementation of Layer 0 matched byte-exact on 10,272/10,272 inputs with a live tamper-detection proof; the A2UI window passed a real-browser smoke 5/5.

=========== HOUSE LAWS ===========
1. Pricing-first: floors frozen before runs; honest FAILs stay standing.
2. Claims carry receipts: commit SHAs, chain tips, run logs.
3. No floats in kernel state (R8: the fixed plane is now the answer to R5).
4. You are a GUEST: your review polices the house; falsifying your own floors is the house working, not a loss.

=========== OUTPUT CONTRACT ===========
Return ONE strict JSON object, no markdown fences:
{"question_id": string, "verdict": string (<= 3 sentences), "key_points": string[] (2-4), "residual_risks": string[] (0-3), "next_lever": {"title": string, "why": string, "cheapest_decisive_run": string} | null}
Be concrete. Cite the numbers above. If the fleet falsified you, say so plainly and price what survives.`;

const QUESTIONS = [
  {
    call_id: 'r6-q1-r3-closure',
    temperature: 0.3,
    user: `question_id: r6-q1-r3-closure. Your situation 12 was run and your registered model (exactly 0 distinct firers) was falsified — actual: 64/64 distinct firers, survival 63/64, semantics uniquely S3 live-read row-major LWW, deterministic across reruns, kernel exonerated. Do you ACCEPT the falsification? Does R3 stand, shrink, or die? What survives of your model — was it wrong about the kernel, or right about a DIFFERENT kind of substrate?`,
  },
  {
    call_id: 'r6-q2-c5-null',
    temperature: 0.3,
    user: `question_id: r6-q2-c5-null. C5 (self-repair) died as an honest null: no repair in any arm without an injector; the pristine ring self-erodes; injected repair re-erodes. Review the pricing: is "repair requires an injector" the right reading of the SPEC, or should the SPEC gain an injector semantics (who injects, at what cost, from where)? Price what a repair-capable variant would owe: a new claim, a new floor, or nothing?`,
  },
  {
    call_id: 'r6-q3-r5-answer',
    temperature: 0.3,
    user: `question_id: r6-q3-r5-answer. Your R5 CRITICAL (irrational sigma breaks the no-floats plane) was answered with R8: integer fixed-point sigma, closed WITH MEASURED COST — zero on swept/default sigmas, one S-unit at the coupled (2/3, -2) boundary you will recognize from your own grid, and the uncoupled exact-zero families where the float kernel deviates from its own sigma and the fixed kernel is faithful. Does this discharge your CRITICAL? What residual risk remains in a Q32.32 plane at S=2^32 — and would you demand S=2^48 or rational (p,q) sigma for any concrete future claim?`,
  },
  {
    call_id: 'r6-q4-next-lever',
    temperature: 0.6,
    user: `question_id: r6-q4-next-lever. Open claims: C1 and C4 (C2 lived, C3 died, C5 died). You recommended situations 8 (armor-ring-portal-pincer, for C5 — now moot) and 9 (knife-edge-checkerboard-cascade, for C4). Propose the CHEAPEST decisive registered run for E-Q7: either for C4 via your situation 9, or a better lever if the wave-34 results (S3 semantics, d-ladder climbing under twin pressure, the uncoupled exact-zero families) suggest one. Registered means: point prediction, falsifier, and cost named before the run.`,
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const appendRow = (file, obj) => fs.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8');

function loadDone() {
  if (!fs.existsSync(ROWS_FILE)) return new Set();
  const done = new Set();
  for (const line of fs.readFileSync(ROWS_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); if (r.call_id) done.add(r.call_id); } catch { /* torn tail */ }
  }
  return done;
}

function firstBalancedObject(t) {
  const a = t.indexOf('{');
  if (a === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = a; i < t.length; i++) {
    const c = t[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return { text: t.slice(a, i + 1), repaired: false }; }
  }
  if (!inStr && depth > 0) return { text: t.slice(a) + '}'.repeat(depth), repaired: true };
  return null;
}

function extractJson(raw) {
  const t = raw.trim();
  try { return { obj: JSON.parse(t), method: 'direct' }; } catch { /* fall through */ }
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return { obj: JSON.parse(fence[1].trim()), method: 'fence-strip' }; } catch { /* fall through */ } }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a !== -1 && b > a) { try { return { obj: JSON.parse(t.slice(a, b + 1)), method: 'brace-extract' }; } catch { /* fall through */ } }
  const fbo = firstBalancedObject(t);
  if (fbo) { try { return { obj: JSON.parse(fbo.text), method: fbo.repaired ? 'brace-close' : 'first-object' }; } catch { /* fall through */ } }
  return { obj: null, method: 'failed' };
}

async function callDeepseek(userMsg, temperature) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY missing from env');
  const body = JSON.stringify({
    model: REQUESTED_MODEL,
    messages: [{ role: 'system', content: SYSTEM_PREFIX }, { role: 'user', content: userMsg }],
    temperature, max_tokens: MAX_TOKENS, stream: false,
  });
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body, signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get('retry-after') || 0);
        const waitMs = ra > 0 ? ra * 1000 : Math.min(60_000, 1500 * 2 ** (attempt - 1));
        lastErr = `http_${res.status}`;
        console.log(`  attempt ${attempt}: ${lastErr}, backoff ${waitMs}ms`);
        await sleep(waitMs); continue;
      }
      if (!res.ok) throw new Error(`http_${res.status}: ${(await res.text()).slice(0, 300)}`);
      return { ok: true, j: await res.json() };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e.name === 'AbortError' ? `timeout_${CALL_TIMEOUT_MS}ms` : String(e.message || e);
      if (String(lastErr).startsWith('http_4')) throw lastErr;
      if (attempt < MAX_ATTEMPTS) await sleep(Math.min(60_000, 1500 * 2 ** (attempt - 1)));
    }
  }
  return { ok: false, error: lastErr };
}

const PRICES = {
  served_model: 'deepseek-flash (DeepSeek-V4.1-Flash)',
  source: 'https://api-docs.deepseek.com/quick_start/pricing fetched 2026-09-27; Monday 07:3x UTC = PEAK window 06:00-10:00 (declared basis)',
  off_peak: { input_cache_hit_per_1m: 0.003, input_cache_miss_per_1m: 0.15, output_per_1m: 0.6 },
  peak: { input_cache_hit_per_1m: 0.006, input_cache_miss_per_1m: 0.30, output_per_1m: 1.20 },
  hit_to_miss_ratio: 50,
};
function usd(usage, p) {
  const hit = (usage.prompt_cache_hit_tokens / 1e6) * p.input_cache_hit_per_1m;
  const miss = (usage.prompt_cache_miss_tokens / 1e6) * p.input_cache_miss_per_1m;
  const out = (usage.completion_tokens / 1e6) * p.output_per_1m;
  const nocache = (usage.prompt_tokens / 1e6) * p.input_cache_miss_per_1m + out;
  return { with_cache: hit + miss + out, if_no_cache: nocache };
}

async function main() {
  const prefixSha = sha(SYSTEM_PREFIX);
  console.log('round six — prefix sha256:', prefixSha.slice(0, 16), '… (the cache asset)');
  const done = loadDone();
  const usageTotals = { prompt_tokens: 0, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 0, completion_tokens: 0 };
  let calls = 0, cold = 0;
  for (const q of QUESTIONS) {
    if (done.has(q.call_id)) { console.log('skip (done):', q.call_id); continue; }
    calls++;
    console.log('call', q.call_id, '…');
    const r = await callDeepseek(q.user, q.temperature);
    if (!r.ok) {
      appendRow(ROWS_FILE, { wave: '34-keeper', round: 6, call_id: q.call_id, error: r.error, sealed_at: now(), prefix_sha256: prefixSha });
      console.log('  DEAD after retries:', r.error);
      continue;
    }
    const j = r.j;
    const u = j.usage || {};
    usageTotals.prompt_tokens += u.prompt_tokens || 0;
    usageTotals.prompt_cache_hit_tokens += u.prompt_cache_hit_tokens || 0;
    usageTotals.prompt_cache_miss_tokens += u.prompt_cache_miss_tokens || 0;
    usageTotals.completion_tokens += u.completion_tokens || 0;
    if ((u.prompt_cache_hit_tokens || 0) === 0) cold++;
    const raw = j.choices?.[0]?.message?.content ?? '';
    const ex = extractJson(raw);
    appendRow(ROWS_FILE, {
      wave: '34-keeper', round: 6, call_id: q.call_id, sealed_at: now(),
      model: { requested: REQUESTED_MODEL, served: j.model, system_fingerprint: j.system_fingerprint },
      prefix_sha256: prefixSha, prompt_sha256: sha(SYSTEM_PREFIX + q.user), temperature: q.temperature,
      usage: u,
      content_raw: raw,
      content_parsed: ex.obj, parse_method: ex.method,
      question_id: ex.obj?.question_id ?? q.call_id,
    });
    console.log('  sealed:', q.call_id, '| served:', j.model, '| cache hit:', u.prompt_cache_hit_tokens, '/', u.prompt_tokens, '| parse:', ex.method);
    await sleep(GAP_MS);
  }
  const p = PRICES.peak; // declared basis: this run executes in the 06:00-10:00 UTC peak window
  const econ = usd(usageTotals, p);
  const summary = {
    wave: '34-keeper', round: 6, artifact: 'situations/cache_economics_r6.json', sealed_at: now(),
    prefix_sha256: prefixSha, prefix_chars: SYSTEM_PREFIX.length,
    calls_made: calls, cold_calls: cold,
    totals: usageTotals,
    cache_hit_ratio: usageTotals.prompt_tokens ? usageTotals.prompt_cache_hit_tokens / usageTotals.prompt_tokens : 0,
    price_basis: p,
    usd: econ,
    savings_ratio: econ.if_no_cache ? 1 - econ.with_cache / econ.if_no_cache : 0,
  };
  fs.writeFileSync(ECON_FILE, JSON.stringify(summary, null, 1));
  console.log('cache economics:', JSON.stringify(summary.totals), 'hit ratio', (summary.cache_hit_ratio * 100).toFixed(2) + '%', '$' + econ.with_cache.toFixed(4), 'vs $' + econ.if_no_cache.toFixed(4));
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
