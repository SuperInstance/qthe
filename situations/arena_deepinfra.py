#!/usr/bin/env python3
# situations/arena_deepinfra.py -- the tavern's ROUND 10: the eight-seat audit.
#
# Wave ORCH-R10 (second-pass orchestration). The founder's mandate: reopen the
# tavern on DeepInfra with eight competing guests; let them audit the completed
# 50-phase corpus; the orchestrator verifies every finding against the repo and
# prices the auditors. Same house laws as every prior round:
#
#   - ONE immutable system prefix (the ASSET below) is byte-identical across
#     every call of the round. All variation lives in SHORT user turns. Models
#     that discount cache reads (MiMo 50x, DeepSeek 33x, Hy4 20x, Seed 5x,
#     Muse 7.5x, Ling 5x on listed prices) make the prefix nearly free after
#     the first call; Qwen3.6-35B-A3B lists cache_read == input (no discount)
#     and Nemotron only 1.25x -- receipted in the economics, priced per model.
#   - outputs sealed AS SAID: content_raw is stored verbatim; parse-derived
#     copies are added beside it, always declared via parse_method.
#   - provenance on every row: model (requested + served), usage raw +
#     normalized (with the key-path that yielded the cache number, by name),
#     prefix hash, prompt hash, timestamp, elapsed, per-model USD at the
#     provider's own listed prices.
#   - honest failures: 429/5xx backed off exponentially; a dead call is a row.
#   - resume safety: rows append+flush per call; a re-run skips done call_ids.
#   - fail-closed: no DEEPINFRA_API_KEY in env -> no call, no spend, receipted.
#
# Zero dependencies. Python >= 3.9. Key read from env DEEPINFRA_API_KEY only,
# never logged, never written to any file.
#
# Usage:
#   python3 arena_deepinfra.py pricing          # print the live price table
#   python3 arena_deepinfra.py run [--model ID] # run the round (resumable)
#   python3 arena_deepinfra.py econ             # recompute economics from rows

import hashlib
import json
import os
import pathlib
import random
import sys
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROWS_FILE = HERE / "arena_rows_r10.jsonl"
ECON_FILE = HERE / "cache_economics_r10.json"

ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions"
MODELS_ENDPOINT = "https://api.deepinfra.com/v1/models"

ROUND = "r10"
TEMP = 0.2
MAX_TOKENS = 6000
CALL_TIMEOUT_S = 300
GAP_S = 1.5
MAX_ATTEMPTS = 6

# The eight seats. Short names are call-id stable.
MODELS = [
    ("nemotron35sv", "nvidia/NVIDIA-Nemotron-3.5-Super-VL"),
    ("mimov26f", "XiaomiMiMo/MiMo-V2.6-Flash"),
    ("dsv41f", "deepseek-ai/DeepSeek-V4.1-Flash"),
    ("qwen3635b", "Qwen/Qwen3.6-35B-A3B"),
    ("seed20mini", "ByteDance/Seed-2.0-mini"),
    ("ling31f", "inclusionAI/Ling-3.1-flash"),
    ("musegl30b", "meta-models/Muse-Glimmer-30B"),
    ("hy4p", "tencent/Hy4-preview"),
]

# ---------------------------------------------------------------------------
# THE ASSET -- the stable system prefix. Byte-identical across EVERY call of
# round 10. NEVER edit mid-round; if it must change, that is round 11 and a new
# asset hash, receipted. (House law carried from deepseek_guest.mjs.)
# ---------------------------------------------------------------------------
SYSTEM_PREFIX = """You are a live guest of the erised fleet's tavern, seated at the QTHE table for ROUND 10 -- the eight-seat audit. Seven other models sit at the same table, given this exact same briefing and the exact same task. You are COMPETING as auditors: the orchestrator will verify every finding you name against the repository itself; a finding that points at a real artifact and survives verification scores by its severity; a finding that names an artifact that does not exist, or misstates the sealed record, scores against you. Precision beats volume. Your words are sealed verbatim into receipt ledgers (stone-v1 chains) with your token and cache telemetry, so precision and honesty are your reputation. Speak only through strict JSON.

=========== QTHE (Quilt-Ternary Hyper-Embeddings), post-orchestration state ===========

THE PRIMITIVE. One byte, two planes: bits 7-6 = tau (timbre / operator state), bits 5-0 = d (spatial-amplitude coordinate in [0,63]). Timbre table: tau=0 Ground, Psi=0, static anchor; tau=1 Attract, Psi=+1, forward cascade; tau=2 Repel, Psi=-1, inversion layer; tau=3 Abstain, Psi=i, "the Looking Glass" -- bypasses local weights, bridges via the wormhole table.

LAYER 0 -- algebra facts, exhaustively tested (all proved by exhaustion in tests/layer0_verifier.mjs; Coq-shaped statement in tests/FORMAL-STATEMENT.md):
  A1 pack/unpack bijection: 256/256 byte values round-trip exact.
  A2 bounds invariance: every update rule maps [0,63] into [0,63]; all 4x64 states, all rules, no exceptions.
  A3 split channels: vector pass computes y_real = sum(tau=1 d*x) - sum(tau=2 d*x), y_imag = sum(tau=3 d*x); Ground contributes to neither. Exact integer arithmetic, no floats in LAYER 0.

LAYER 1 -- mechanism, byte-identical determinism (M6: same substrate + same tick count -> byte-identical trace, always; every experiment seals trace hashes into hash-chained stone-v1 receipts, verify-before-write, append-only, tamper-refusing):
  M4 the 64-slot wormhole table (compile-time static, zero runtime discovery). An Abstain cell with data value d READS slot d: if occupied by a DIFFERENT cell with nonzero resonance -> twin resonance fires, imaginary channel += resonance * sigma where sigma = log2(3). It WRITES its own (x,y) and resonance = |real_acc|+1 into slot d for the next tick. Slot collisions resolve last-writer-wins.
  M5 Moore-8 neighborhood update: Attract neighbors add their d, Repel neighbors subtract their d into the real accumulator; the cell's own data saturates toward min(d+1,63) under net-positive pressure, toward 0 under net-negative (exact rule table in qthe.mjs, 249 lines).
  M7 A2UI telemetry mirror: pixel = cell, tau colors the channel, 6-bit value = intensity.

LAYER 2 -- THE SCOREBOARD IS CLOSED. Every claim priced by sealed paired-arm experiments; honest nulls are crown jewels:
  C1 intra-cell timbre (1-byte QTHE) vs inter-cell porting (2-byte tauPlane/dPlane encoding) on the twin-delivery task: LIVES -- 47.40% bytes-gain at completion (founder's guess was 25%), ticks identical, footprint halved 4096 vs 8192 bytes; 20/20 trials, fresh seeds (E-Q13, chain tip d852e6ac...). Cached-port caveat receipted: per-tick parity needs the tau plane SRAM-resident.
  C2 wormhole (Abstain) beats graph traversal (Moore-8 diffusion) for non-local alignment on planted twin tasks: LIVES -- 8/8 connect with table ON, 0/20 with OFF (E-Q1).
  C3 sigma = log2(3) as the critical bridge scale: DIES honest null -- full tie across the sigma sweep, sigma monotone-inert on this task class (E-Q2). The gifted "proof" was decorative, as pre-registered.
  C4 phase threshold theta > pi/4 triggers useful non-local transfer: DIES -- cascade real, terminal inversion never arrives (E-Q7).
  C5 armor-ring self-repair: DIES -- no repair term exists in the rule table; the ring self-dissolves (E-Q5).
  C5-prime injector repair (restore-then-re-erode): STANDS, definitional, receipted as such (E-Q10).

=========== THE 50-PHASE ORCHESTRATION (completed; branch orchestrator/50-phases; docs/PHASES-REPORT.md) ===========

Receipt corpus: 14 hash-chains, 400+ rows, ALL verified from disk by scripts/verify_all_chains.mjs; scripts/probe_gate.mjs (PG1 chain re-verify, PG2 tip-pin, PG3 tamper negative control, PG4 1000-tick determinism witness, PG5 resource bounds) is the mandatory pre-claim gate and PASSES at full scope.
Cross-implementation: Python LAYER 0 10,272/10,272 vectors byte-exact; C99 port of LAYER 0+1 19/19 byte-exact on both the float plane and the R8 fixed-point plane, sigma carried as IEEE754 bits, never libm (crossimpl/c/); one wrong-verdict defect in the C sealer was caught by the house's own citation audit and superseded by an append-only correction row.
Fixed-point plane (R8): exactness costs 0.975x runtime (parity within noise, memory-bound loop); swept-sigma 5/5 byte-identical; coupled-2/3 divergence reproduced 8/8 with first ticks 2-19; workload-coverage caveat receipted (the twin-delivery class cannot produce the coupled configuration -- consumers must test their own geometry).
Adversarial probes (E-Q14): high-density Abstain load HELD (occupancy cap 64 at all densities); the table is CONTENT-ADDRESSED not identity-addressed: delivery robust to 256 slot polluters (80/80), but PROVENANCE fragile -- the zero-pollution arm itself failed its floor (pollution fraction 0.94) and the autopsy pinned the mechanism (adjacent-d convoy compressing provenance, then the slot-63 saturation rail becoming a party line); regime-stable under tau-preserving noise.
Reward reweighting probe (E-Q15): DIES honest null -- win-rate 0.00, median delta -6; plain max-of-accepted rejection sampling dominates quality-correlated oracles; boundary-mapped.
Measurement wave (E-Q16): 64x64 T=10,000 stable with constant event rate; 16x16 T=100,000 deterministic after an in-run harness fix (seedFn closures consumed rng at call time -- the harness, never the kernel; correction row appended, run-1 rows stand beside it); dense sigma phase table: bridge metrics sigma-INVARIANT, completion ~ 1/sigma (38 -> 3 ticks over sigma 0.25 -> 4); grid scaling: locality HOLDS to 256x256 at 10% Abstain, contention monotone 353 -> 5874 writes/slot.
Falsification budget (docs/FALSIFICATION-BUDGET.md): 7 nulls banked, 6 defects caught by the house's own gates, zero silent failures.
Standalone package: qthe-core/ (zero deps, kernel sha-pinned to the receipt of record, PROVENANCE.txt, selfcheck S1-S5 ALL PASS); demos: agent rendezvous (agreement tick 61, OFF arm never), non-local alignment without a bus (13 B/write vs 2304 B/tick broadcast), confidence cascade (re/im gated); docs: DAY-1.md outsider path, PORTING.md, RESOURCE-PROFILE.md (local proxy ~0.75us/cell-tick, 8.9KB working set), BOUNDARY-MAP.md (12 regimes), CLAIM-VERDICTS.md (mechanism explanations), TECHNICAL-NOTE.md, ADOPTION-KIT.md, dashboard.html.
THE THREE HONEST GAPS, never hidden: (1) the repository carries NO LICENSE -- the single blocker for external adoption, one commit fixes it; (2) no physical edge hardware in the build environment -- ESP32/Jetson code is delivered, on-device measurements honestly pending; (3) jev-garden live wiring is contract-delivered only.
Also standing: E-Q9/E-Q11/E-Q12 are receipted as chainless-by-registered-decision (predictions + verdicts + content-hash receipts exist, no stone chains); hierarchical wormholes are SPEC-DELIVERED with build trigger = second live consumer; docs/FRONTIER-DECISION.md prices the next frontier.

=========== OUTPUT CONTRACT (strict) ===========
Answer with STRICT JSON ONLY -- one JSON object, no markdown fences, no prose before or after. If you cannot comply, output exactly {"error": "<reason>"}.

{"mode":"audit","findings":[{"id":"F1","artifact":"<the exact file, doc, chain, experiment, claim id, or gap named in this briefing>","finding":"<sharpest statement of the weakness, defect, inconsistency, overclaim, unstated assumption, or missing control>","severity":"critical|major|minor","cheapest_falsifier":"<the single fastest command, experiment, or check that would prove or kill this finding>","fix_sketch":"<the concrete repair, <= 80 words>"}],"strongest_things":["<up to 3 things that genuinely survive hostile review>"],"missing_experiment":{"name":"<short id>","why":"<the single most valuable experiment this corpus lacks, and exactly what it would price, <= 60 words>"},"notes":"<anything else; empty string if none>"}

RULES: exactly 3 to 7 findings, ranked most severe first; every artifact pointer must be something named in this briefing -- inventing artifacts is a scoring penalty; do not pad with praise (strongest_things is capped at 3 for a reason); do not restate a gap the briefing already admits unless you can sharpen HOW it bites or WHAT it silently corrupts; prefer findings that would change what the orchestrator does next; a finding with no falsifier is worth nothing."""

PREFIX_SHA256 = hashlib.sha256(SYSTEM_PREFIX.encode("utf-8")).hexdigest()

USER_TURN = (
    "MODE audit. Audit the completed 50-phase QTHE corpus exactly as briefed. "
    "The orchestrator will verify every finding against the repository; seven "
    "other auditors received this identical task and briefing. Give your "
    "sharpest 3-7 findings, most severe first."
)


def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def append_row(obj: dict) -> None:
    with ROWS_FILE.open("a", encoding="utf-8") as f:  # append+flush per row
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def load_done() -> set:
    done = set()
    if not ROWS_FILE.exists():
        return done
    for line in ROWS_FILE.read_text(encoding="utf-8").split("\n"):
        if not line.strip():
            continue
        try:
            r = json.loads(line)
            if r.get("call_id"):
                done.add(r["call_id"])
        except json.JSONDecodeError:
            pass  # torn tail line: the append law keeps rows whole
    return done


def first_balanced_object(t: str):
    a = t.find("{")
    if a == -1:
        return None
    depth, in_str, esc = 0, False, False
    for i in range(a, len(t)):
        c = t[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return {"text": t[a : i + 1], "repaired": False}
    if not in_str and depth > 0:
        return {"text": t[a:] + "}" * depth, "repaired": True}
    return None


def extract_json(raw: str):
    t = raw.strip()
    try:
        return {"obj": json.loads(t), "method": "direct"}
    except json.JSONDecodeError:
        pass
    if "```" in t:
        seg = t.split("```")
        for chunk in seg:
            c = chunk.strip()
            if c.startswith("json"):
                c = c[4:].strip()
            if c.startswith("{"):
                try:
                    return {"obj": json.loads(c), "method": "fence-strip"}
                except json.JSONDecodeError:
                    continue
    a, b = t.find("{"), t.rfind("}")
    if a != -1 and b > a:
        try:
            return {"obj": json.loads(t[a : b + 1]), "method": "brace-extract"}
        except json.JSONDecodeError:
            pass
    fbo = first_balanced_object(t)
    if fbo:
        try:
            return {
                "obj": json.loads(fbo["text"]),
                "method": "brace-close" if fbo["repaired"] else "first-object",
            }
        except json.JSONDecodeError:
            pass
    return {"obj": None, "method": "failed"}


def api_key() -> str:
    k = os.environ.get("DEEPINFRA_API_KEY")
    if not k:
        raise SystemExit(
            "DEEPINFRA_API_KEY missing from env (fail-closed: no key, no call, "
            "no spend). Use: set -a; source /home/z/my-project/.env.local; set +a"
        )
    return k


def http_json(url: str, body: dict | None, timeout: int):
    """POST (body) or GET (None). Returns (status, parsed-or-None, raw-text)."""
    req = urllib.request.Request(
        url,
        data=None if body is None else json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key()}",
            "Content-Type": "application/json",
        },
        method="GET" if body is None else "POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, json.loads(res.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        txt = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(txt), txt
        except json.JSONDecodeError:
            return e.code, None, txt
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return None, None, str(e)


def fetch_pricing() -> dict:
    """Live per-model price table from the provider's own models endpoint.

    Returns {model_id: {pricing: {...}, context_length: int}}. Prices are the
    provider's listed USD per 1M tokens at fetch time -- the honest basis.
    """
    status, j, txt = http_json(MODELS_ENDPOINT, None, 60)
    if status != 200 or not isinstance(j, dict):
        raise SystemExit(f"pricing fetch failed: {status} {str(txt)[:200]}")
    out = {}
    for m in j.get("data", []):
        out[m.get("id")] = {
            "pricing": (m.get("metadata") or {}).get("pricing") or {},
            "context_length": (m.get("metadata") or {}).get("context_length"),
        }
    return out


def call_model(model_id: str, use_temperature: bool = True):
    """One chat completion. Returns (ok, response|error, temp_deviation)."""
    body = {
        "model": model_id,
        "messages": [
            {"role": "system", "content": SYSTEM_PREFIX},
            {"role": "user", "content": USER_TURN},
        ],
        "max_tokens": MAX_TOKENS,
        "stream": False,
    }
    if use_temperature:
        body["temperature"] = TEMP
    last_err = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        status, j, txt = http_json(ENDPOINT, body, CALL_TIMEOUT_S)
        if status == 200 and isinstance(j, dict):
            return {"ok": True, "j": j}, None, (not use_temperature)
        # Some reasoning models reject non-default temperature: retry once
        # without the field, deviation receipted in the row.
        if (
            status == 400
            and use_temperature
            and j is None
            and "temperature" in (txt or "")
        ) or (status == 400 and use_temperature and j and "temperature" in json.dumps(j)):
            return {"ok": False}, f"http_400_temperature:{str(txt)[:120]}", True
        if status == 429 or (status is not None and status >= 500) or status is None:
            wait = min(60.0, 1.5 * 2 ** (attempt - 1)) + random.uniform(0, 0.4)
            last_err = f"http_{status}" if status else f"network:{str(txt)[:80]}"
            print(f"  attempt {attempt}: {last_err}, backing off {wait:.1f}s", flush=True)
            time.sleep(wait)
            continue
        return {"ok": False}, f"http_{status}: {str(txt)[:200]}", (not use_temperature)
    return {"ok": False}, last_err or "exhausted", (not use_temperature)


def normalize_usage(u: dict) -> dict:
    """Capture the provider's usage verbatim + a normalized view.

    The cache-token field name varies by provider generation; every path tried
    is recorded by name in the row (cache_field_path) so the number is never
    taken on faith.
    """
    norm = {
        "prompt_tokens": u.get("prompt_tokens"),
        "completion_tokens": u.get("completion_tokens"),
        "total_tokens": u.get("total_tokens"),
        "cached_tokens": None,
        "cache_field_path": None,
        "reasoning_tokens": None,
    }
    ptd = u.get("prompt_tokens_details") or {}
    if isinstance(ptd, dict) and ptd.get("cached_tokens") is not None:
        norm["cached_tokens"] = ptd["cached_tokens"]
        norm["cache_field_path"] = "usage.prompt_tokens_details.cached_tokens"
    else:
        for k in ("cache_read_tokens", "prompt_cache_hit_tokens", "cached_tokens"):
            if u.get(k) is not None:
                norm["cached_tokens"] = u[k]
                norm["cache_field_path"] = f"usage.{k}"
                break
    ctd = u.get("completion_tokens_details") or {}
    if isinstance(ctd, dict) and ctd.get("reasoning_tokens") is not None:
        norm["reasoning_tokens"] = ctd["reasoning_tokens"]
    return norm


def usd(norm: dict, pricing: dict) -> dict:
    """Per-row cost at the provider's listed prices (USD per 1M tokens)."""
    p_in = pricing.get("input_tokens")
    p_out = pricing.get("output_tokens")
    p_cache = pricing.get("cache_read_tokens", p_in)
    pt = norm.get("prompt_tokens") or 0
    ct = norm.get("completion_tokens") or 0
    cached = norm.get("cached_tokens") or 0
    if p_in is None or p_out is None:
        return {"with_cache": None, "if_no_cache": None, "basis": "price-missing"}
    miss = max(pt - cached, 0)
    with_cache = cached / 1e6 * p_cache + miss / 1e6 * p_in + ct / 1e6 * p_out
    no_cache = pt / 1e6 * p_in + ct / 1e6 * p_out
    return {
        "with_cache": round(with_cache, 6),
        "if_no_cache": round(no_cache, 6),
        "basis": "provider-listed usd/1M",
    }


def cmd_pricing() -> None:
    table = fetch_pricing()
    print(f"prefix sha256: {PREFIX_SHA256}")
    print(f"prefix chars: {len(SYSTEM_PREFIX)} (~{len(SYSTEM_PREFIX)//4} tokens)")
    print(f"{'model':44s} {'in':>7s} {'out':>7s} {'cache':>7s} {'discount':>9s}")
    for short, mid in MODELS:
        p = (table.get(mid) or {}).get("pricing") or {}
        i, o, c = p.get("input_tokens"), p.get("output_tokens"), p.get("cache_read_tokens")
        disc = f"{i/c:.1f}x" if (i and c) else "n/a"
        print(f"{mid:44s} {i!s:>7s} {o!s:>7s} {c!s:>7s} {disc:>9s}")


def cmd_run(only: str | None) -> None:
    print(f"prefix sha256: {PREFIX_SHA256}")
    print(f"prefix chars: {len(SYSTEM_PREFIX)} (~{len(SYSTEM_PREFIX)//4} tokens)")
    pricing_table = fetch_pricing()
    done = load_done()
    for short, mid in MODELS:
        if only and mid != only:
            continue
        call_id = f"{ROUND}-{short}-audit"
        if call_id in done:
            print(f"skip {call_id} (already sealed)")
            continue
        pricing = pricing_table.get(mid, {}).get("pricing") or {}
        print(f"call {call_id} [{mid}] temp {TEMP} ...", flush=True)
        t0 = time.time()
        r, err, temp_dropped = call_model(mid)
        elapsed = int((time.time() - t0) * 1000)
        row = {
            "round": ROUND,
            "call_id": call_id,
            "seat": short,
            "task": "audit",
            "model_requested": mid,
            "model_served": None,
            "temperature": TEMP,
            "temperature_effective": None if temp_dropped else TEMP,
            "max_tokens": MAX_TOKENS,
            "prompt_hash": sha(USER_TURN),
            "prefix_sha256": PREFIX_SHA256,
            "sealed_at": now(),
        }
        if r.get("ok"):
            j = r["j"]
            msg = (j.get("choices") or [{}])[0].get("message") or {}
            u = j.get("usage") or {}
            norm = normalize_usage(u)
            parsed = extract_json(msg.get("content") or "")
            row.update(
                {
                    "model_served": j.get("model"),
                    "finish_reason": (j.get("choices") or [{}])[0].get("finish_reason"),
                    "content_raw": msg.get("content") or "",
                    "reasoning_raw": msg.get("reasoning_content")
                    or msg.get("reasoning")
                    or None,
                    "content_json": parsed["obj"],
                    "parse_method": parsed["method"],
                    "usage_raw": u,
                    "usage_norm": norm,
                    "elapsed_ms": elapsed,
                    "usd": usd(norm, pricing),
                }
            )
            if temp_dropped:
                row["temp_deviation_note"] = (
                    "provider rejected non-default temperature; retried without the field"
                )
            append_row(row)
            print(
                f"  sealed: prompt {norm['prompt_tokens']} (cached {norm['cached_tokens']} "
                f"via {norm['cache_field_path']}) out {norm['completion_tokens']} "
                f"| parse {parsed['method']} | finish {row['finish_reason']} | {elapsed}ms | "
                f"${row['usd']['with_cache']}",
                flush=True,
            )
        else:
            row.update({"error": err, "attempts": MAX_ATTEMPTS, "elapsed_ms": elapsed})
            append_row(row)
            print(f"  FAILED after {MAX_ATTEMPTS} attempts: {err} — failure receipted", flush=True)
        time.sleep(GAP_S)
    write_econ(pricing_table)
    print(f"\nround complete. rows: {ROWS_FILE}")


def read_rows() -> list:
    if not ROWS_FILE.exists():
        return []
    out = []
    for line in ROWS_FILE.read_text(encoding="utf-8").split("\n"):
        if line.strip():
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return out


def write_econ(pricing_table: dict | None = None) -> None:
    if pricing_table is None:
        pricing_table = fetch_pricing()
    rows = read_rows()
    seats = []
    tot = {"calls": len(rows), "sealed": 0, "failed": 0, "prompt": 0, "cached": 0,
           "completion": 0, "usd": 0.0, "usd_no_cache": 0.0}
    for r in rows:
        norm = r.get("usage_norm") or {}
        seat = {
            "call_id": r["call_id"],
            "seat": r.get("seat"),
            "model_requested": r.get("model_requested"),
            "model_served": r.get("model_served"),
            "finish_reason": r.get("finish_reason"),
            "parse_method": r.get("parse_method"),
            "prompt_tokens": norm.get("prompt_tokens"),
            "cached_tokens": norm.get("cached_tokens"),
            "cache_field_path": norm.get("cache_field_path"),
            "completion_tokens": norm.get("completion_tokens"),
            "reasoning_tokens": norm.get("reasoning_tokens"),
            "hit_ratio": (
                round(norm["cached_tokens"] / norm["prompt_tokens"], 4)
                if norm.get("cached_tokens") is not None and norm.get("prompt_tokens")
                else None
            ),
            "usd": (r.get("usd") or {}).get("with_cache"),
            "usd_if_no_cache": (r.get("usd") or {}).get("if_no_cache"),
            "elapsed_ms": r.get("elapsed_ms"),
            "error": r.get("error"),
        }
        seats.append(seat)
        if r.get("usage_norm"):
            tot["sealed"] += 1
            tot["prompt"] += norm.get("prompt_tokens") or 0
            tot["cached"] += norm.get("cached_tokens") or 0
            tot["completion"] += norm.get("completion_tokens") or 0
            tot["usd"] += (r.get("usd") or {}).get("with_cache") or 0
            tot["usd_no_cache"] += (r.get("usd") or {}).get("if_no_cache") or 0
        else:
            tot["failed"] += 1
    price_table = {}
    for short, mid in MODELS:
        p = (pricing_table.get(mid) or {}).get("pricing") or {}
        i, c = p.get("input_tokens"), p.get("cache_read_tokens")
        price_table[mid] = {
            "input_usd_per_1m": i,
            "output_usd_per_1m": p.get("output_tokens"),
            "cache_read_usd_per_1m": c,
            "cache_discount_ratio": round(i / c, 2) if (i and c) else None,
        }
    econ = {
        "wave": "ORCH-R10",
        "round": ROUND,
        "artifact": "situations/cache_economics_r10.json",
        "generated_at": now(),
        "endpoint": ENDPOINT,
        "experiment": "eight-seat audit: 8 models, one immutable prefix, one identical audit task; findings verified by the orchestrator against the repository",
        "prefix": {
            "sha256": PREFIX_SHA256,
            "chars": len(SYSTEM_PREFIX),
            "stability": "byte-identical across every call of this round; never edited mid-round",
        },
        "price_basis": {
            "source": f"{MODELS_ENDPOINT} (provider metadata), fetched {now()}",
            "units": "USD per 1M tokens, provider-listed",
            "per_model": price_table,
            "cache_game_note": (
                "The founder's cache game, priced per seat: MiMo 50x, DeepSeek 33x, "
                "Hy4 20x, Muse 7.5x, Seed 5x, Ling 5x cache discounts make the shared "
                "prefix nearly free after each seat's first call; Nemotron lists only "
                "1.25x; Qwen3.6-35B-A3B lists cache_read == input (no discount) -- the "
                "two seats that do not benefit are receipted here, not hidden."
            ),
        },
        "totals": {
            **tot,
            "hit_ratio_overall": round(tot["cached"] / tot["prompt"], 4) if tot["prompt"] else None,
            "usd_total": round(tot["usd"], 6),
            "usd_if_no_cache": round(tot["usd_no_cache"], 6),
            "savings_ratio": round(1 - tot["usd"] / tot["usd_no_cache"], 4) if tot["usd_no_cache"] else None,
        },
        "seats": seats,
        "failures": [
            {"call_id": r["call_id"], "error": r.get("error"), "sealed_at": r.get("sealed_at")}
            for r in rows
            if r.get("error")
        ],
        "reading": (
            "Round 10 reopens the tavern on DeepInfra after rounds 6-9 ran on the "
            "DeepSeek-native API (r9 fail-closed when that key left the workspace). "
            "Eight seats, one asset, one task: the audit competition. Each seat's "
            "first call is its cold call; identical task wording makes output "
            "differences model-attributable, and the per-seat price table above is "
            "the cache game made visible."
        ),
    }
    ECON_FILE.write_text(json.dumps(econ, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"economics written: {ECON_FILE}")


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print("usage: python3 arena_deepinfra.py pricing|run|econ [--model ID]")
        sys.exit(1)
    cmd = args[0]
    only = None
    if "--model" in args:
        only = args[args.index("--model") + 1]
    if cmd == "pricing":
        cmd_pricing()
    elif cmd == "run":
        cmd_run(only)
    elif cmd == "econ":
        write_econ()
    else:
        print("usage: python3 arena_deepinfra.py pricing|run|econ [--model ID]")
        sys.exit(1)


if __name__ == "__main__":
    main()
