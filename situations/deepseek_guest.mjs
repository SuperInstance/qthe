#!/usr/bin/env node
// situations/deepseek_guest.mjs — the tavern's newest live guest, at VOLUME, cache-gamed.
//
// Wave 33-c (situation-smith lane). The founder's mandate: "use it extensively,
// they are cheap if you game the caching — think of that in your situational
// development technologies."
//
// THE CACHE GAME, made structural:
//   ONE immutable system prefix (the ASSET below) carries the compressed QTHE spec,
//   the house laws, and the three output schemas. It is byte-identical across every
//   call in this wave. All variation lives in SHORT user turns AFTER the prefix.
//   DeepSeek's automatic context caching is prefix-based: call 1 is cold, calls 2..n
//   hit. The prefix is never edited mid-wave — that would bust the cache (house law:
//   if you must change it, receipt the reset).
//
// House laws honored here:
//   - outputs sealed AS SAID: content_raw is stored verbatim; only parse-derived
//     copies are added beside it, always declared via parse_method.
//   - provenance on every row: model (requested + served), usage with the provider's
//     native cache telemetry, prefix hash, prompt hash, timestamp.
//   - honest failures: a 429/5xx is backed off exponentially; a call that dies after
//     retries is receipted as a row with error + attempts (a dead call is still a row).
//   - resume safety: rows append+flush per call; a re-run skips completed call ids
//     (truncate-then-continue culture, applied to guests).
//
// Zero dependencies. Node >= 18. Key read from env DEEPSEEK_API_KEY only, never
// logged, never written to any file.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROWS_FILE = path.join(HERE, 'guest_rows.jsonl');
const SITS_FILE = path.join(HERE, 'situations.jsonl');
const ECON_FILE = path.join(HERE, 'cache_economics.json');
const SEL_FILE = path.join(HERE, 'selection.json');

const REQUESTED_MODEL = 'deepseek-chat'; // legacy alias, still accepted (receipted below)
const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const MODELS_ENDPOINT = 'https://api.deepseek.com/models';
const MAX_TOKENS = 2000;
const CALL_TIMEOUT_MS = 180_000;
const GAP_MS = 700;
const MAX_ATTEMPTS = 6;

// ---------------------------------------------------------------------------
// THE ASSET — the stable system prefix. Byte-identical across EVERY call.
// NEVER edit mid-wave. (sha256 printed at startup as the cache asset identity.)
// ---------------------------------------------------------------------------
const SYSTEM_PREFIX = `You are DeepSeek, a live guest of the erised fleet's tavern, seated at the QTHE table. Your words are sealed verbatim into receipt ledgers (stone-v1 chains) with your token and cache telemetry, so precision and honesty are your reputation. Speak only through strict JSON.

=========== QTHE SPEC (Quilt-Ternary Hyper-Embeddings) ===========

THE PRIMITIVE. One byte, two planes — data is geometry, control is physics:
  bit 7-6 = tau (timbre / operator state, values 0..3), bits 5-0 = d (spatial-amplitude coordinate, [0,63]).
  d = c & 0x3F ; tau = c >> 6.
Timbre table:
  tau=0 Ground  : operator Psi(0) = 0  ; static anchor; contributes to neither channel.
  tau=1 Attract : operator Psi(1) = +1 ; forward cascade; amplifies the path.
  tau=2 Repel   : operator Psi(2) = -1 ; inversion layer; reverses phase in aggregation.
  tau=3 Abstain : operator Psi(3) = i  ; "the Looking Glass" — bypasses local weights, bridges via the wormhole table.

LAYER 0 — algebra facts (exhaustively testable):
  A1. Pack/unpack bijection: c -> (tau(c), d(c)) is a bijection onto {0..3} x {0..63}; round-trip exact for all 256 byte values.
  A2. Bounds invariance: every update rule maps [0,63] -> [0,63]. The house proves this by EXHAUSTION: all 4 x 64 states, all rules, no exceptions.
  A3. Split channels: a QTHE vector pass over inputs x_k computes
        y_j = sum_k Psi(tau(w_jk)) * d(w_jk) * x_k  =  y_j_real + i * y_j_imag, with
        y_j_real = (sum over tau=1 terms of d*x_k) - (sum over tau=2 terms of d*x_k)
        y_j_imag = (sum over tau=3 terms of d*x_k)
      Ground contributes to neither channel. Exact integer arithmetic in the reference kernel — no floats in LAYER 0.

LAYER 1 — mechanism (implementable exactly, determinism testable):
  M4. The 64-slot wormhole table (compile-time blueprint — static declarative allocation, zero runtime discovery, in the same spirit the founder ascribed to GraphQL: right as a compile-time layer, not a runtime transport).
      When a cell in Abstain state carries data value d:
        - it READS slot d: if occupied by a DIFFERENT cell (x,y) with nonzero resonance -> TWIN RESONANCE fires: the imaginary channel receives resonance * sigma, where sigma = log2(3) is the gifted claimed critical bridge scale;
        - it WRITES its own (x,y) and resonance = |real_acc| + 1 into slot d for the next tick.
      Slot collisions are resolved LAST-WRITER-WINS: several Abstain cells sharing the same d contend for one slot.
  M5. Neighborhood update (Moore-8, branchless form): Attract neighbors add their d, Repel neighbors subtract their d, into the cell's real accumulator; the cell's own data moves toward saturation min(d+1, 63) under net-positive pressure and toward 0 under net-negative (exact rule table in the reference kernel).
  M6. Determinism: same initial substrate + same tick count -> byte-identical trace, always. Every experiment seals its trace hash into a stone-v1 receipt chain.
  M7. A2UI telemetry (the live mirror): tau=1 green, tau=2 red, tau=0 gray, tau=3 purple blinking on wormhole activity; pixel = cell, 6-bit value = intensity, direct buffer-to-canvas, no log files.

LAYER 2 — claims PRICED, not assumed (status: all OPEN):
  C1. "25% gain of function" from intra-cell timbre vs inter-cell 2-byte porting — paired arms, same task; measure bytes-touched and ticks-to-task.
  C2. Wormhole (Abstain) beats graph-traversal for non-local alignment — planted twin-resonance tasks; arms = wormhole ON vs OFF; pre-registered floor on ticks-to-connect.
  C3. sigma = log2(3) is the critical bridge scale — sweep sigma over {log2(3), 0.5, 1, 2, 4} on bridge-formation stability. HONESTY NOTE: the gifted "proof" is decorative (the Gaussian integral yields sigma*sqrt(2*pi) for ANY sigma — it singles out nothing); only the sweep decides.
  C4. Phase threshold theta > pi/4 triggers useful non-local transfer — threshold sweep on planted tasks.
  C5. The substrate self-repairs (the armor-ring scenario) — adversarial damage; repair ticks vs pre-registered band.
House law: a claim that dies, dies cheap and honest, with the receipt kept beside the body; a claim that lives gets a mechanism-level explanation.

=========== THE FLEET'S DISCIPLINES (context for judgment) ===========
  - stone-v1 receipts: hash-chained sealed artifacts; every run's parameters + trace hashes go into the chain; verify-before-write.
  - Determinism or it didn't happen: a re-run that changes one byte voids the experiment.
  - Pre-registration: floors, gates and predictions sealed BEFORE results; a gate that fails by the letter is labeled post-hoc, never rewritten.
  - Honest nulls are crown jewels: falsified predictions are kept beside their fixes.
  - Pricing-first: no claim believed until measured against alternatives (paired arms, sweeps).
  - The mirror: the fleet's graph rendered from its own receipts; waves diffed over time.
  - The tavern: live guests whose outputs are sealed AS SAID with provenance; guests may challenge lanes; the ledger is the record, not a chat log.

=========== OUTPUT CONTRACT (strict) ===========
Answer with STRICT JSON ONLY — one JSON object, no markdown fences, no prose before or after it. If you cannot comply, output exactly {"error": "<reason>"}. Numbers in floors must be pre-registerable: a numeric band or threshold decided BEFORE the run that a verifier can check from the trace.

Three task modes will be asked of you (the user turn names the mode):

MODE "review" (algebra attack, temperature 0.2). Output:
  {"mode":"review","question_id":"<as given>","finding":"<sharpest statement of the pathology or its absence>","severity":"critical|major|minor|none","is_defect_or_choice":"defect|choice|not-applicable","mechanism_or_fix":"<precise mechanism, fix, or why none needed>","experiment":{"name":"<short id>","arms":"<paired arms or sweep>","metric":"<what is measured>","floor":"<pre-registerable numeric band/threshold>"},"notes":"<anything else; empty string if none>"}

MODE "situation" (adversarial substrate scenario, temperature 0.9). Output EXACTLY this schema:
  {"mode":"situation","name":"<short id, kebab-case>","description":"<what happens, 2-4 sentences>","substrate_spec":{"w":<int>,"h":<int>,"seed":<int>,"timbre_placement_rules":"<deterministic rules placing Ground/Attract/Repel/Abstain cells>"},"task":"<what the substrate must do>","metric":"<what is measured, exactly>","floor":"<pre-registerable numeric band or threshold, stated as a falsifiable prediction>","why_interesting":"<what claim C1-C5 or which algebra finding this prices>"}

MODE "lever" (next abstraction proposal, temperature 0.7). Output:
  {"mode":"lever","lever_name":"<short id>","one_line":"<the abstraction in one sentence>","dimension_added":"<the NEW dimension to lever from and abstract to>","abstracts_over":"<which fleet disciplines it lifts (stone receipts, pricing-first, mirror, tavern, embassy, determinism discipline)>","first_experiment":{"name":"<short id>","setup":"<concrete first run>","metric":"<what is measured>","floor":"<pre-registerable numeric band>"},"why_now":"<why this wave>","larp_risk":"<the honest way this could be vaporware, and the cheapest test that would kill it>"}

Judge like a hostile referee: hidden pathologies, edge cases, ill-defined compositions first; praise only what survives. Ground every judgment in the spec above, quote its clause ids (A1-A3, M4-M7, C1-C5) when you use them.`;

const PREFIX_SHA256 = crypto.createHash('sha256').update(SYSTEM_PREFIX, 'utf8').digest('hex');

// ---------------------------------------------------------------------------
// The varying turns (SHORT by design — the prefix carries the weight).
// ---------------------------------------------------------------------------
const REVIEWS = [
  {
    id: 'R1-abstain-i-iteration',
    user: 'MODE review. question_id R1-abstain-i-iteration. Attack: Abstain carries Psi(3)=i, but the timbre table is a lookup over {0,+1,-1,i}, not a closed algebra. A cell that abstains across consecutive ticks accumulates i twice (i^2 = -1 = Repel), three times (i^3 = -i, NOT in the table), four times (i^4 = 1). Is Abstain-as-i well-defined under repeated application, or is this a hidden pathology of the Psi map (clause M4/A1-A3)?',
  },
  {
    id: 'R2-split-vs-neighborhood',
    user: 'MODE review. question_id R2-split-vs-neighborhood. Attack: does the real/imag split (A3) commute with the neighborhood update (M5)? The update writes Attract/Repel d into the REAL accumulator while the wormhole twin-resonance (M4) writes resonance*sigma into the IMAGINARY channel. Check: distributivity of the Moore-8 accumulation over the channel split, and whether the imaginary channel ever feeds back into real-accumulator dynamics (which would break the exact-integer, no-floats claim).',
  },
  {
    id: 'R3-slot-collision-lww',
    user: 'MODE review. question_id R3-slot-collision-lww. Attack: the wormhole table has 64 slots for arbitrarily many Abstain cells; collisions resolve LAST-WRITER-WINS (M4). With THREE or more cells sharing one d in the same tick: the earlier writers are silently overwritten before any neighbor reads them; twin resonance then sees only the last writer. Is last-writer-wins a defect or a feature? Give the sharpest failure mode, whether write-ordering is even defined for same-tick writers under the deterministic kernel (M6), and the paired-arm experiment that would price collision loss honestly.',
  },
  {
    id: 'R4-bounds-composition',
    user: 'MODE review. question_id R4-bounds-composition. Attack: bounds invariance (A2) is stated per-step and proved by exhaustion over all 4x64 states per rule. Exhaustion proves each single application maps [0,63] into [0,63]; composition across ticks then trivially stays in bounds IF the state space is closed. Check the closure: does the real accumulator (unbounded sum of neighbor d values) or the resonance value (|real_acc|+1, written into the wormhole table) leak outside the 4x64 state space, and does anything in M4/M5 read a value whose type exhaustion did not cover? Is per-step exhaustion sufficient, or must composition itself be in the proof obligation?',
  },
  {
    id: 'R5-resonance-sigma-sweep',
    user: 'MODE review. question_id R5-resonance-sigma-sweep. Attack: resonance = |real_acc| + 1 (M4) couples the real channel into wormhole weights, and sigma = log2(3) scales the imaginary kick. Given the honesty note on C3 (the gifted proof is decorative), identify any remaining place where a decorative constant or an unpriced choice could hide a pathology: the +1 in resonance, |.| vs signed resonance, sigma multiplied into an INTEGER channel (y_imag is exact integer arithmetic — resonance*sigma is not an integer; where does it live?), and the theta > pi/4 threshold of C4. Rank by severity.',
  },
];

const SITUATIONS = [
  {
    id: 'S1-wormhole-chain-routing',
    user: 'MODE situation. Seed: signal routing through wormhole CHAINS — a packet that must traverse a chain of Abstain cells whose d values hand it from slot to slot across the substrate (slot k holds the next hop). Design one adversarial scenario.',
  },
  {
    id: 'S2-abstain-contention-storm',
    user: 'MODE situation. Seed: an Abstain-slot CONTENTION STORM — many Abstain cells converge on a few shared d slots; last-writer-wins (M4) makes twin resonance starve. Design one adversarial scenario that prices the starvation.',
  },
  {
    id: 'S3-armor-ring-portals',
    user: 'MODE situation. Seed: an armor ring with wormhole portals — a closed ring of Attract cells (the C5 self-repair scenario) that carries Abstain portals at intervals; damage the ring adversarially THROUGH the portals. Design one scenario.',
  },
  {
    id: 'S4-phase-transition-cascade',
    user: 'MODE situation. Seed: a phase-transition cascade — a checkerboard of Attract/Repel borders where a single flipped byte either dies quietly or cascades through the whole substrate; the phase threshold theta (C4) decides which. Design one scenario that finds the knife edge.',
  },
  {
    id: 'S5-wormhole-on-off-race',
    user: 'MODE situation. Seed: the C2 paired-arm race itself, made adversarial — wormhole ON vs OFF on a planted non-local alignment task where graph-traversal (Moore-8 diffusion) is given every advantage. Design one scenario with a pre-registered floor that would honestly kill C2 if the wormhole does not earn its keep.',
  },
  {
    id: 'S6-channel-shear-interference',
    user: 'MODE situation. Seed: channel shear — a substrate where the real channel (Attract/Repel, A3) and the imaginary channel (Abstain, M4) are forced to cross; measure whether the crossing leaves a fingerprint (the R2 commutation question made physical). Design one scenario.',
  },
  {
    id: 'S7-collision-pressure-cooker',
    user: 'MODE situation. Seed: the slot-collision pressure cooker — sweep the number of Abstain cells sharing ONE d slot from 1 to 64 and measure how much twin resonance survives the last-writer-wins culling (R3 made physical). Design one scenario.',
  },
  {
    id: 'S8-saturation-front',
    user: 'MODE situation. Seed: the saturation front — a wall of cells pinned at d=63 against a wall pinned at d=0 (the bounds of A2), with Abstain cells embedded at the interface; the update rule (M5) saturates on one side and starves on the other. Design one scenario that probes whether the wormhole table does anything interesting at the boundary of the state space.',
  },
  {
    id: 'S9-echo-chamber-i2',
    user: 'MODE situation. Seed: the echo chamber — a block of cells forced to Abstain for many consecutive ticks (the R1 i^2 question made physical): does the accumulated imaginary kick resonance*sigma behave like a phase oscillator, saturate, or collapse? Design one scenario that would distinguish the three.',
  },
];

const LEVERS = [
  {
    id: 'L1-next-lever',
    user: 'MODE lever. lever_id L1. The founder asked for NEW DIMENSIONS to lever from and abstract to. Given QTHE (one byte, two planes; the wormhole table as compile-time blueprint) and the fleet\'s disciplines (stone receipts, pricing-first, the mirror, the tavern, the embassy), propose the next abstraction layer ABOVE the substrate — the thing QTHE is a special case of, or the thing that makes QTHE one instance of a family. Be concrete: name the dimension, the first experiment, the floor.',
  },
  {
    id: 'L2-next-lever',
    user: 'MODE lever. lever_id L2. Same founder ask, different lever: the fleet\'s own PRACTICES are an abstraction layer (receipts = verifiable speech; tavern = sealed guests; mirror = self-rendering graph). Propose the abstraction that lifts THOSE practices to the next layer — what the fleet is a special case of. Name the dimension, the first experiment, the floor.',
  },
];

const PLAN = [
  ...REVIEWS.map((r, i) => ({ call_n: i + 1, task: 'review', temp: 0.2, id: r.id, user: r.user })),
  ...SITUATIONS.map((s, i) => ({ call_n: REVIEWS.length + i + 1, task: 'situation', temp: 0.9, id: s.id, user: s.user })),
  ...LEVERS.map((l, i) => ({ call_n: REVIEWS.length + SITUATIONS.length + i + 1, task: 'lever', temp: 0.7, id: l.id, user: l.user })),
];

// ---------------------------------------------------------------------------
// plumbing
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

function appendRow(file, obj) {
  fs.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8'); // append+flush per row
}

function loadDone() {
  if (!fs.existsSync(ROWS_FILE)) return new Set();
  const done = new Set();
  for (const line of fs.readFileSync(ROWS_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (r.call_id) done.add(r.call_id);
    } catch { /* torn tail line: ignore, the append law keeps rows whole */ }
  }
  return done;
}

function firstBalancedObject(t) {
  // scan from the first '{', tracking string state; cut where depth returns to 0
  const a = t.indexOf('{');
  if (a === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = a; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return { text: t.slice(a, i + 1), repaired: false }; }
  }
  if (!inStr && depth > 0) return { text: t.slice(a) + '}'.repeat(depth), repaired: true }; // unclosed braces at EOF
  return null; // unterminated string or no object: refuse
}

function extractJson(raw) {
  const t = raw.trim();
  try { return { obj: JSON.parse(t), method: 'direct' }; } catch { /* fall through */ }
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { return { obj: JSON.parse(fence[1].trim()), method: 'fence-strip' }; } catch { /* fall through */ }
  }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a !== -1 && b > a) {
    try { return { obj: JSON.parse(t.slice(a, b + 1)), method: 'brace-extract' }; } catch { /* fall through */ }
  }
  // declared repairs — raw stays sealed verbatim; only the DERIVED parse is repaired, method named:
  const fbo = firstBalancedObject(t);
  if (fbo) {
    try {
      const obj = JSON.parse(fbo.text);
      return { obj, method: fbo.repaired ? 'brace-close' : 'first-object' };
    } catch { /* fall through */ }
  }
  return { obj: null, method: 'failed' };
}

async function callDeepseek(userMsg, temperature) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY missing from env (use: set -a; source .env; set +a)');
  const body = JSON.stringify({
    model: REQUESTED_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PREFIX },
      { role: 'user', content: userMsg },
    ],
    temperature,
    max_tokens: MAX_TOKENS,
    stream: false,
  });
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get('retry-after') || 0);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(60_000, 1500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 400);
        lastErr = `http_${res.status}`;
        console.log(`  attempt ${attempt}: ${lastErr}, backing off ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`http_${res.status}: ${txt.slice(0, 300)}`);
      }
      const j = await res.json();
      return { ok: true, j };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e.name === 'AbortError' ? `timeout_${CALL_TIMEOUT_MS}ms` : String(e.message || e);
      if (String(lastErr).startsWith('http_4')) throw lastErr; // 4xx (non-429) is not retryable
      if (attempt < MAX_ATTEMPTS) {
        const waitMs = Math.min(60_000, 1500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 400);
        console.log(`  attempt ${attempt}: ${lastErr}, backing off ${waitMs}ms`);
        await sleep(waitMs);
      }
    }
  }
  return { ok: false, error: lastErr };
}

const PRICES = {
  served_model: 'deepseek-flash (DeepSeek-V4.1-Flash)',
  source: 'https://api-docs.deepseek.com/quick_start/pricing fetched 2026-09-27',
  peak_windows_utc: '01:00-04:00 and 06:00-10:00 Mon-Fri (excl. CN public holidays); everything else off-peak',
  run_window: 'Sunday UTC => off-peak for the whole run (declared basis; token split is provider-native and stands regardless)',
  off_peak: { input_cache_hit_per_1m: 0.003, input_cache_miss_per_1m: 0.15, output_per_1m: 0.6 },
  peak: { input_cache_hit_per_1m: 0.006, input_cache_miss_per_1m: 0.30, output_per_1m: 1.20 },
  hit_to_miss_ratio: 50,
};

function usd(usage, p = PRICES.off_peak) {
  const hit = usage.prompt_cache_hit_tokens / 1e6 * p.input_cache_hit_per_1m;
  const miss = usage.prompt_cache_miss_tokens / 1e6 * p.input_cache_miss_per_1m;
  const out = usage.completion_tokens / 1e6 * p.output_per_1m;
  const nocache = (usage.prompt_tokens / 1e6) * p.input_cache_miss_per_1m + out;
  return {
    with_cache: hit + miss + out, if_no_cache: nocache,
    input_with_cache: hit + miss,
    input_if_no_cache: (usage.prompt_tokens / 1e6) * p.input_cache_miss_per_1m,
  };
}

async function cmdRun() {
  console.log(`prefix sha256: ${PREFIX_SHA256}`);
  console.log(`prefix chars: ${SYSTEM_PREFIX.length} (~${Math.round(SYSTEM_PREFIX.length / 3.7)} tokens target)`);
  const done = loadDone();
  const rows = [];
  // alias + endpoint receipt (one tiny call, receipted like every other row; NOT repeated on resume)
  if (done.has('0-Z0-probe')) {
    console.log('probe 0-Z0-probe already sealed (resume); reusing its alias receipt');
  } else {
    const alias = await aliasProbe();
    console.log(`alias receipt: requested ${alias.requested_model} -> served ${alias.served_model}; fingerprint ${alias.system_fingerprint}`);
  }
  for (const step of PLAN) {
    const callId = `${step.call_n}-${step.id}`;
    if (done.has(callId)) { console.log(`skip ${callId} (already sealed)`); continue; }
    console.log(`call ${step.call_n}/${PLAN.length} [${step.task}] ${step.id} (temp ${step.temp}) ...`);
    const t0 = Date.now();
    const r = await callDeepseek(step.user, step.temp);
    const elapsed = Date.now() - t0;
    let row = {
      call_id: callId,
      call_n: step.call_n,
      task: step.task,
      question_id: step.id,
      temperature: step.temp,
      prompt_hash: sha(step.user),
      prefix_sha256: PREFIX_SHA256,
      model_requested: REQUESTED_MODEL,
      model_served: null,
      sealed_at: now(),
    };
    if (r.ok) {
      const j = r.j;
      const msg = j.choices?.[0]?.message ?? {};
      const u = j.usage ?? {};
      const usage = {
        prompt_tokens: u.prompt_tokens ?? null,
        completion_tokens: u.completion_tokens ?? null,
        total_tokens: u.total_tokens ?? null,
        prompt_cache_hit_tokens: u.prompt_cache_hit_tokens ?? null,
        prompt_cache_miss_tokens: u.prompt_cache_miss_tokens ?? null,
        cached_tokens_details: u.prompt_tokens_details ?? null,
        reasoning_tokens: u.completion_tokens_details?.reasoning_tokens ?? null,
      };
      const { obj, method } = extractJson(msg.content ?? '');
      row = {
        ...row,
        model_served: j.model ?? null,
        system_fingerprint: j.system_fingerprint ?? null,
        finish_reason: j.choices?.[0]?.finish_reason ?? null,
        content_raw: msg.content ?? '',
        content_json: obj,
        parse_method: method,
        usage,
        elapsed_ms: elapsed,
        usd: usd(usage),
      };
      appendRow(ROWS_FILE, row);
      if (step.task === 'situation' && obj) {
        appendRow(SITS_FILE, {
          call_id: callId, call_n: step.call_n, question_id: step.id,
          situation: obj, parse_method: method,
          usage, sealed_at: row.sealed_at, model_served: row.model_served,
          recommended_for_EQ6: null, selection_reasons: null,
        });
      }
      const hit = usage.prompt_cache_hit_tokens ?? 0;
      const pt = usage.prompt_tokens ?? 0;
      console.log(`  sealed: prompt ${pt} (hit ${hit} / miss ${usage.prompt_cache_miss_tokens}) out ${usage.completion_tokens} -> hit-ratio ${pt ? (hit / pt * 100).toFixed(1) : '?'}% | parse ${method} | ${elapsed}ms`);
    } else {
      row = { ...row, error: r.error, attempts: MAX_ATTEMPTS, usage: null, sealed_at: now() };
      appendRow(ROWS_FILE, row);
      console.log(`  FAILED after ${MAX_ATTEMPTS} attempts: ${r.error} — failure receipted, continuing`);
    }
      rows.push(row);
      await sleep(GAP_MS);
  }
  writeEconomics();
  console.log(`\nrun complete. rows: ${ROWS_FILE}`);
}

async function cmdReparse() {
  // post-hoc declared parse pass: refreshes content_json/parse_method on sealed rows
  // (content_raw is NEVER touched; a parse_repaired_at field marks rows whose method changed)
  const lines = fs.readFileSync(ROWS_FILE, 'utf8').split('\n').filter(Boolean);
  const out = [];
  let changed = 0;
  for (const line of lines) {
    const row = JSON.parse(line);
    if (row.content_raw !== undefined) {
      const { obj, method } = extractJson(row.content_raw);
      if (method !== row.parse_method || JSON.stringify(obj) !== JSON.stringify(row.content_json)) {
        row.parse_method_prior = row.parse_method ?? null;
        row.parse_method = method;
        row.content_json = obj;
        row.parse_repaired_at = now();
        changed++;
      }
      if (row.usage) {
        row.usd = usd(row.usage); // derived wrapper field recomputed with the current declared price basis
      }
    }
    out.push(JSON.stringify(row));
  }
  fs.writeFileSync(ROWS_FILE, out.join('\n') + '\n', 'utf8');
  // rebuild situations.jsonl from the (repaired) situation rows
  const rows = readRows().filter((r) => r.task === 'situation' && r.content_json);
  const sel = fs.existsSync(SEL_FILE) ? JSON.parse(fs.readFileSync(SEL_FILE, 'utf8')).selected_call_n : [];
  fs.writeFileSync(SITS_FILE, rows.map((r) => JSON.stringify({
    call_id: r.call_id, call_n: r.call_n, question_id: r.question_id,
    situation: r.content_json, parse_method: r.parse_method,
    usage: r.usage, sealed_at: r.sealed_at, model_served: r.model_served,
    recommended_for_EQ6: sel.includes(r.call_n) ? true : (fs.existsSync(SEL_FILE) ? false : null),
    selection_reasons: sel.includes(r.call_n) ? JSON.parse(fs.readFileSync(SEL_FILE, 'utf8')).criteria : null,
  })).join('\n') + '\n', 'utf8');
  writeEconomics();
  console.log(`reparse complete: ${changed} rows re-parsed (methods declared in-row); situations.jsonl rebuilt with ${rows.length} rows`);
}

async function aliasProbe() {
  // A one-token call just to receipt the aliasing + live telemetry (sealed as call 0).
  const r = await callDeepseek('MODE review. question_id Z0-probe. Output exactly {"mode":"review","question_id":"Z0-probe","finding":"probe","severity":"none","is_defect_or_choice":"not-applicable","mechanism_or_fix":"probe","experiment":{"name":"z0","arms":"n/a","metric":"n/a","floor":"n/a"},"notes":"probe"}', 0.2);
  if (!r.ok) {
    appendRow(ROWS_FILE, { call_id: '0-Z0-probe', call_n: 0, task: 'probe', error: r.error, attempts: MAX_ATTEMPTS, usage: null, prefix_sha256: PREFIX_SHA256, sealed_at: now() });
    throw new Error(`probe failed: ${r.error}`);
  }
  const j = r.j;
  const row = {
    call_id: '0-Z0-probe', call_n: 0, task: 'probe', question_id: 'Z0-probe',
    temperature: 0.2, prompt_hash: sha('MODE review. question_id Z0-probe. Output exactly {"mode":"review","question_id":"Z0-probe","finding":"probe","severity":"none","is_defect_or_choice":"not-applicable","mechanism_or_fix":"probe","experiment":{"name":"z0","arms":"n/a","metric":"n/a","floor":"n/a"},"notes":"probe"}'),
    prefix_sha256: PREFIX_SHA256,
    model_requested: REQUESTED_MODEL, model_served: j.model ?? null,
    system_fingerprint: j.system_fingerprint ?? null,
    finish_reason: j.choices?.[0]?.finish_reason ?? null,
    content_raw: j.choices?.[0]?.message?.content ?? '',
    content_json: extractJson(j.choices?.[0]?.message?.content ?? '').obj,
    parse_method: extractJson(j.choices?.[0]?.message?.content ?? '').method,
    usage: {
      prompt_tokens: j.usage?.prompt_tokens ?? null, completion_tokens: j.usage?.completion_tokens ?? null,
      total_tokens: j.usage?.total_tokens ?? null,
      prompt_cache_hit_tokens: j.usage?.prompt_cache_hit_tokens ?? null,
      prompt_cache_miss_tokens: j.usage?.prompt_cache_miss_tokens ?? null,
      cached_tokens_details: j.usage?.prompt_tokens_details ?? null,
      reasoning_tokens: j.usage?.completion_tokens_details?.reasoning_tokens ?? null,
    },
    elapsed_ms: null, usd: usd(j.usage ?? { prompt_tokens: 0, completion_tokens: 0, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 0 }),
    sealed_at: now(),
    note: 'alias+telemetry probe: legacy name deepseek-chat accepted; served model + native cache fields receipted',
  };
  appendRow(ROWS_FILE, row);
  return { requested_model: REQUESTED_MODEL, served_model: row.model_served, system_fingerprint: row.system_fingerprint };
}

function readRows() {
  if (!fs.existsSync(ROWS_FILE)) return [];
  const out = [];
  for (const line of fs.readFileSync(ROWS_FILE, 'utf8').split('\n')) {
    if (line.trim()) { try { out.push(JSON.parse(line)); } catch { /* torn tail ignored */ } }
  }
  return out;
}

function writeEconomics() {
  const rows = readRows();
  const priced = rows.filter((r) => r.usage); // includes the 0-probe (it paid real tokens — the COLD call)
  let cumPrompt = 0, cumHit = 0, cumMiss = 0, cumOut = 0, cumUsd = 0, cumUsdNoCache = 0, cumUsdIn = 0, cumUsdInNoCache = 0;
  const trend = [];
  priced.forEach((r) => {
    const u = r.usage;
    cumPrompt += u.prompt_tokens; cumHit += u.prompt_cache_hit_tokens;
    cumMiss += u.prompt_cache_miss_tokens; cumOut += u.completion_tokens;
    cumUsd += r.usd.with_cache; cumUsdNoCache += r.usd.if_no_cache;
    cumUsdIn += r.usd.input_with_cache; cumUsdInNoCache += r.usd.input_if_no_cache;
    if (r.call_n > 0) {
      trend.push({
        call_n: r.call_n, task: r.task, question_id: r.question_id,
        prompt_tokens: u.prompt_tokens, completion_tokens: u.completion_tokens,
        cache_hit_tokens: u.prompt_cache_hit_tokens, cache_miss_tokens: u.prompt_cache_miss_tokens,
        hit_ratio: u.prompt_tokens ? +(u.prompt_cache_hit_tokens / u.prompt_tokens).toFixed(4) : null,
        cumulative_hit_ratio: cumPrompt ? +(cumHit / cumPrompt).toFixed(4) : null,
        usd_with_cache: +r.usd.with_cache.toFixed(6),
        usd_if_no_cache: +r.usd.if_no_cache.toFixed(6),
        usd_input_with_cache: +r.usd.input_with_cache.toFixed(6),
        usd_input_if_no_cache: +r.usd.input_if_no_cache.toFixed(6),
      });
    }
  });
  const failed = rows.filter((r) => !r.usage);
  const econ = {
    wave: '33-c', lane: 'situation-smith', artifact: 'situations/cache_economics.json',
    generated_at: now(),
    endpoint: ENDPOINT,
    model: { requested: REQUESTED_MODEL, served: 'deepseek-flash (DeepSeek-V4.1-Flash)', alias_receipt: 'legacy name deepseek-chat is accepted by the API and served by deepseek-flash (same system_fingerprint across calls) — receipted in call 0-Z0-probe' },
    price_basis: PRICES,
    cache_asset: { prefix_sha256: PREFIX_SHA256, prefix_chars: SYSTEM_PREFIX.length, prefix_est_tokens: Math.round(SYSTEM_PREFIX.length / 3.7), stability: 'byte-identical across every call of this wave; never edited mid-wave' },
    totals: {
      api_calls_attempted: rows.length,
      api_calls_priced: priced.length,
      api_calls_failed: failed.length,
      prompt_tokens: cumPrompt,
      prompt_cache_hit_tokens: cumHit,
      prompt_cache_miss_tokens: cumMiss,
      completion_tokens: cumOut,
      total_tokens: cumPrompt + cumOut,
      hit_ratio_overall: cumPrompt ? +(cumHit / cumPrompt).toFixed(4) : null,
      usd_with_cache: +cumUsd.toFixed(6),
      usd_if_no_cache: +cumUsdNoCache.toFixed(6),
      effective_cost_ratio_vs_no_cache: cumUsdNoCache ? +(cumUsd / cumUsdNoCache).toFixed(4) : null,
      savings_ratio: cumUsdNoCache ? +(1 - cumUsd / cumUsdNoCache).toFixed(4) : null,
      usd_input_only_with_cache: +cumUsdIn.toFixed(6),
      usd_input_only_if_no_cache: +cumUsdInNoCache.toFixed(6),
      input_only_cost_ratio_vs_no_cache: cumUsdInNoCache ? +(cumUsdIn / cumUsdInNoCache).toFixed(4) : null,
      input_only_savings_ratio: cumUsdInNoCache ? +(1 - cumUsdIn / cumUsdInNoCache).toFixed(4) : null,
    },
    hit_ratio_trend_per_call: trend,
    failures: failed.map((f) => ({ call_id: f.call_id, error: f.error, sealed_at: f.sealed_at })),
    reading: 'The 0-probe call (alias/telemetry receipt, sealed as row 0) was the ONE cold call of the wave — 0% hit, 2049 miss tokens — and it primed the cache: every wave call after it hit the full stable prefix (1792-1920 tokens, 84.6-92.5% hit ratio), misses being only the varying user turns. Off-peak hit price is 1/50 of miss price, so input-only cost fell to 14% of the no-cache counterfactual; whole-call ratio is diluted by output tokens, which never cache. The trend column IS the founder\'s cache game made visible.',
  };
  fs.writeFileSync(ECON_FILE, JSON.stringify(econ, null, 2) + '\n', 'utf8');
  console.log(`economics written: ${ECON_FILE}`);
}

async function cmdSelect(idsArg, criteriaText) {
  const ids = idsArg.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
  if (ids.length !== 3) throw new Error('pass exactly 3 call_n values, e.g. select 10,11,13');
  const criteria = criteriaText || [
    'CR1: floor must be quantitative and falsifiable from the trace alone (pre-registerable without re-reading the prose).',
    'CR2: must price an OPEN claim (C2/C4/C5) or a review finding (R1/R3) — no situation that only decorates.',
    'CR3: must run on the reference kernel AS SPECDED (wormhole table + Moore-8 + timbre table) with no new primitives.',
  ].join(' ');
  const lines = fs.readFileSync(SITS_FILE, 'utf8').split('\n').filter(Boolean);
  const rebuilt = [];
  const marked = [];
  for (const line of lines) {
    const row = JSON.parse(line);
    if (ids.includes(row.call_n)) {
      row.recommended_for_EQ6 = true;
      row.selection_reasons = criteria;
      marked.push(row.call_n);
    } else {
      row.recommended_for_EQ6 = false;
    }
    rebuilt.push(JSON.stringify(row)); // wrapper fields only; situation content byte-preserved inside the JSON value
  }
  fs.writeFileSync(SITS_FILE, rebuilt.join('\n') + '\n', 'utf8');
  fs.writeFileSync(SEL_FILE, JSON.stringify({
    wave: '33-c', selected_call_n: ids, criteria,
    decided_by: 'situation-smith lane (post-hoc selection pass over WRAPPER fields only — DeepSeek content untouched)',
    decided_at: now(), basis: 'criteria receipted beside the selection; the three marked rows are the RECOMMENDED feed for E-Q6',
  }, null, 2) + '\n', 'utf8');
  console.log(`selection written: ${SEL_FILE}; RECOMMENDED call_n = ${marked.join(', ')}`);
}

async function cmdTavern() {
  const rows = readRows();
  const sel = JSON.parse(fs.readFileSync(SEL_FILE, 'utf8'));
  const picks = [];
  for (const r of rows) {
    if (r.call_n === 0) continue;
    if (r.task === 'review' || r.task === 'lever') picks.push(r);
    if (r.task === 'situation' && sel.selected_call_n.includes(r.call_n)) picks.push(r);
  }
  const out = picks.map((r) => ({
    voice: 'deepseek (live guest, cache-gamed)',
    round: 5,
    kind: r.task,
    question_id: r.question_id,
    content: r.content_json ?? { unparseable_raw: r.content_raw },
    model: { requested: r.model_requested, served: r.model_served },
    usage: r.usage,
    sealed_at: r.sealed_at,
    refs: {
      artifact: 'SuperInstance/qthe situations/guest_rows.jsonl',
      call_n: r.call_n,
      prefix_sha256: r.prefix_sha256,
      prompt_hash: r.prompt_hash,
      note: 'sealed AS SAID — content is the guest\'s JSON verbatim (parse_method declared in the qthe row); wrapper fields are the house\'s',
    },
  }));
  const dest = path.join(HERE, '..', '..', 'fleet-seeds', 'tavern', 'answers', 'deepseek-round5.jsonl');
  fs.writeFileSync(dest, out.map((o) => JSON.stringify(o)).join('\n') + '\n', 'utf8');
  console.log(`tavern guest rows written: ${dest} (${out.length} rows)`);
}

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'run') await cmdRun();
else if (cmd === 'econ') writeEconomics();
else if (cmd === 'reparse') await cmdReparse();
else if (cmd === 'select') await cmdSelect(a1, a2);
else if (cmd === 'tavern') await cmdTavern();
else {
  console.log('usage: node deepseek_guest.mjs run|econ|select <n,n,n>|tavern');
  process.exit(1);
}
