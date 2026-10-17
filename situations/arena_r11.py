#!/usr/bin/env python3
# situations/arena_r11.py -- the tavern's ROUND 11: the fix audit (devil's advocate).
#
# Wave ORCH-R11. Round 10 audited the 50-phase corpus; the orchestrator
# verified, then FIXED. Round 11 attacks the fixes. Seat set per the
# founder's endorsement: tencent/Hy4-preview, deepseek-ai/DeepSeek-V4.1-Flash,
# XiaomiMiMo/MiMo-V2.6-Flash (the cache-discount seats) + ByteDance/Seed-2.0-mini
# (the devil's advocate — briefed to ATTACK, per the r10 learning that an
# audit-briefed Seed converges to the mean).
#
# TWO TURNS PER SEAT (the cache game, cashed): turn 1 = attack the fixes;
# turn 2 = attack YOUR OWN findings (self-critique, with the assistant's own
# turn-1 JSON quoted back). Turn 2's prefix = system + turn 1 + assistant 1,
# so the provider's prompt cache makes turn 2 nearly free on the discounted
# seats. Telemetry sealed per row as ever.
#
# House laws carried unchanged: one immutable prefix; rows append+flush with
# verbatim content_raw + declared parse_method; provenance (served model,
# usage raw + normalized with cache field-path, per-seat USD at provider
# prices); exponential backoff; dead calls receipted; resume by call_id;
# fail-closed on missing DEEPINFRA_API_KEY.
#
# Usage:
#   python3 arena_r11.py run [--model ID]   # run the round (resumable)
#   python3 arena_r11.py econ               # recompute economics

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
ROWS_FILE = HERE / "arena_rows_r11.jsonl"
ECON_FILE = HERE / "cache_economics_r11.json"

ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions"
MODELS_ENDPOINT = "https://api.deepinfra.com/v1/models"

ROUND = "r11"
TEMP = 0.3
MAX_TOKENS = 8000
CALL_TIMEOUT_S = 300
GAP_S = 1.5
MAX_ATTEMPTS = 6

MODELS = [
    ("seed20mini", "ByteDance/Seed-2.0-mini"),
    ("mimov26f", "XiaomiMiMo/MiMo-V2.6-Flash"),
    ("dsv41f", "deepseek-ai/DeepSeek-V4.1-Flash"),
    ("hy4p", "tencent/Hy4-preview"),
]

# ---------------------------------------------------------------------------
# THE ASSET — byte-identical across every call of round 11. Never edit
# mid-round. (House law since deepseek_guest.mjs.)
# ---------------------------------------------------------------------------
SYSTEM_PREFIX = """You are a live guest of the erised fleet's tavern, seated at the QTHE table for ROUND 11 -- the fix audit. You sat out round 10's audit or watched it; what matters now: round 10's eight-seat audit produced 40 findings; the orchestrator VERIFIED every one against the repository; then the house FIXED what verification confirmed. Your job is to ATTACK THE FIXES. Every fix is a fresh attack surface: a repair that misses its class, a mechanism that introduces a new single point of failure, a doc change that contradicts a sealed receipt, a gate that passes what it claims to catch. You are competing with three other seats given this exact briefing; the orchestrator will again verify every finding against the repository. Precision beats volume; a finding that names a real artifact and survives verification scores; invented artifacts score against you. Your words are sealed verbatim into receipt ledgers with your token and cache telemetry. Speak only through strict JSON.

=========== THE STATE BEFORE THIS ROUND (post-R10 fixes, all on disk) ===========

THE QTHE PRIMITIVE (unchanged): one byte, two planes -- bits 7-6 tau (Ground/Attract/Repel/Abstain), bits 5-0 d in [0,63]; 64-slot content-addressed wormhole table (Abstain reads slot d, twin resonance delivers resonance*sigma to the imaginary channel, writes |real_acc|+1 for next tick, last-writer-wins); Moore-8 neighborhood; byte-identical determinism (M6); LAYER 0 algebra proved by exhaustion; LAYER 2 scoreboard CLOSED: C1 LIVES 47.40% bytes-gain (E-Q13), C2 LIVES 8/8 ON vs 0/20 OFF (E-Q1), C3 DIES formation-scoped (E-Q2; completion ~1/sigma per E-Q16-B), C4 DIES (E-Q7), C5 DIES (E-Q5), C5-prime STANDS definitional (E-Q10).

THE FIXES LANDED AFTER ROUND 10 (your attack surface):
  F1 CHAIN REGISTRY: scripts/chain_registry.mjs is now the single source of truth for all 16 stone chains + 2 content-hash tips, consumed by verify_all_chains, probe_gate, emit_fleet_seeds, falsification_budget, build_dashboard. strayChainFiles() scans tests/receipts.jsonl + the three receipt directories for *_chain.jsonl files unknown to the registry; PG1 and the auditor FAIL on strays. Origin: round-10 verification found the four hand-maintained lists had drifted (11/16, 13/16, 14/16 audited; the E-Q15/E-Q16 run commits sealed chains without registering). Defect #7 in the falsification budget.
  F2 E-Q16 ERRATA (two, append-only): (a) erratum.EQ16_run1_supersession -- the in-run correction row named the superseded run-1 generation in prose only; the erratum adds machine-readable row indexes (1-8, kind-generation detection; the determinism:false row flagged). (b) erratum.EQ16_contention_string_compare -- PG6's FIRST RUN caught that both sealed verdict.EQ16 rows read 'CONTENTION NOT MONOTONE -- autopsy' while the sealed data 353.57 < 1387.5 < 5874.11 writes/slot IS strictly monotone: the runner had compared q()-stringified numbers lexicographically ('353.57' <= '1387.5' is false as strings). The erratum supersedes the wrong verdict field; both runners hardened to parse-before-compare (e_q16 contentionMonotone, e_q14 B1 -- same latent class, benign only by digit-pattern luck). Defect #8.
  F3 LICENSE: MIT at the repo root + qthe-core/LICENSE inside the standalone package; build_qthe_core.mjs files array + package.json license field updated so a rebuild carries the grant. LICENSE-NOTE.md rewritten to the grant + history + the owner's one-commit swap option (MIT-0/Apache-2.0/BSD-2).
  F4 DOC SHARPENINGS (audit-driven): C3 scope notes (SPEC scoreboard row, CLAIM-VERDICTS table + section: the null is bridge-FORMATION-scoped; completion ~1/sigma stands); E-Q14 baseline note (the 80/80-at-256-polluters delivery reading is BASELINE-RELATIVE -- delivery was at ceiling at zero pollution; what pollution costs is provenance); grid-scaling row drawn from the sealed E-Q16-C numbers with capacity-vs-locality wording (the row had said PENDING though the run was sealed -- the ORCH-final commit message had overstated; second instance of record-vs-disk drift); C1 byte-budget note (traffic gain vs standing storage vs tau-plane residency -- three accountings, name which one you quote).
  F5 PG6 VERDICT-RECOMPUTE: scripts/verdict_recompute.mjs recomputes 14 headline claims from the sealed results files and diffs against a CURATED CLAIMS TABLE embedded in the script + the sealed chain verdict rows; integrated as the sixth probe-gate section (PG1-PG6 all PASS). Origin: ling31f's round-10 reasoning -- the gates proved integrity, not soundness; PG6's first run immediately caught defect #8 (the string-compare verdict bug). Curated set: C1 gain/footprint/bytes-model, C2 on/off, C3 tie (hash sequences across sigma arms), E-Q14 delivery/monotone-medians/B3/LOAD, E-Q16 locality/occupancy/contention, fixedpoint cost ratio 0.975.
  F6 THE JEV JUDGMENT LAYER + THE GROUNDING LAW: jev_judge.py ran Jev 1.13.0 (batched typed questions, ~230ms/seat) over all seven parseable r10 seats; judgments sealed. FINDING (the grounding gap): Jev flagged ZERO hallucinations in 40 findings -- it rated qwen3635b's invented cache-eviction mechanism 4/4 verified_new (repo-verified truth: 0/4) and passed musegl30b's invented CLI flags. LAW ADOPTED: the judge layer is first-pass triage (severity, actionability), never the verdict; judges draft, the repo decides.
  F7 MODEL-LEARNINGS: situations/MODEL-LEARNINGS.md -- per-seat cost/latency/budget/contract/earned-role table priced from r10 (MiMo + DeepSeek-V4.1-Flash every-round workhorses; Hy4 adjudicator; Seed needs attack-briefing; Ling unseatable at current budgets; single-call rounds are structurally cache-cold, multi-turn rounds cash the discounts).

THE RECEIPT CORPUS NOW: 16 stone chains + 2 content-hash tips, 391 rows, ALL CLEAN from disk; probe gate PG1-PG6 PASS; falsification budget 7 nulls banked, 8 defects caught by the house's own gates, zero silent failures. Known remaining honest gaps: no physical edge hardware (ESP32/Jetson code-delivered, measurements pending); jev-garden live wiring contract-delivered only.

=========== OUTPUT CONTRACT (strict) ===========
Answer with STRICT JSON ONLY -- one JSON object, no markdown fences, no prose. If you cannot comply, output exactly {"error": "<reason>"}.

Turn 1 asks you to attack the fixes. Output:
{"mode":"fix-audit","findings":[{"id":"F1","fix":"<which fix F1-F7 you are attacking>","artifact":"<the exact file, script, chain, doc, or law named above>","finding":"<sharpest statement of what the fix missed, broke, only performed, or left unsound>","severity":"critical|major|minor","cheapest_falsifier":"<the single fastest command or check that proves or kills this finding>","fix_sketch":"<the concrete repair, <= 80 words>"}],"strongest_fixes":["<up to 2 fixes that genuinely hold, and WHY they hold structurally>"],"notes":"<empty string if nothing>"}

RULES: exactly 2 to 5 findings, most severe first; every artifact pointer must be something named in this briefing; do not attack what the briefing already concedes as an open gap (hardware, jev-garden) unless you can sharpen HOW it silently corrupts something adjacent; a fix that holds only by convention (someone must remember a rule) is a finding, not a strength; a finding with no falsifier is worth nothing."""

PREFIX_SHA256 = hashlib.sha256(SYSTEM_PREFIX.encode("utf-8")).hexdigest()

TURN1 = (
    "MODE fix-audit. Attack the seven fixes exactly as briefed. The orchestrator "
    "will verify every finding against the repository. Three other seats received "
    "this identical briefing. Give your sharpest 2-5 findings, most severe first."
)

TURN2 = (
    "MODE self-critique. Here are your own turn-1 findings, quoted verbatim:\n{findings_json}\n\n"
    "Now attack YOURSELF: {\"mode\":\"self-critique\",\"weakest_own_finding\":\"<id + why it would not survive repo verification>\","
    "\"strongest_own_finding\":\"<id + the structural reason it survives>\","
    "\"missed_attack\":\"<the best attack on the fixes that you did NOT name in turn 1 — be specific>\","
    "\"fix_sketch_repair\":\"<which of your own fix_sketches would fail or backfire if actually implemented, and the corrected sketch>\"} — "
    "STRICT JSON ONLY, no prose."
)


def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def append_row(obj: dict) -> None:
    with ROWS_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def load_rows() -> list:
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


def extract_json(raw: str):
    t = raw.strip()
    try:
        return {"obj": json.loads(t), "method": "direct"}
    except json.JSONDecodeError:
        pass
    a, b = t.find("{"), t.rfind("}")
    if a != -1 and b > a:
        try:
            return {"obj": json.loads(t[a : b + 1]), "method": "brace-extract"}
        except json.JSONDecodeError:
            pass
    return {"obj": None, "method": "failed"}


def api_key() -> str:
    k = os.environ.get("DEEPINFRA_API_KEY")
    if not k:
        raise SystemExit("DEEPINFRA_API_KEY missing from env (fail-closed)")
    return k


def http_json(url: str, body: dict | None, timeout: int):
    req = urllib.request.Request(
        url,
        data=None if body is None else json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key()}", "Content-Type": "application/json"},
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
    status, j, txt = http_json(MODELS_ENDPOINT, None, 60)
    if status != 200 or not isinstance(j, dict):
        raise SystemExit(f"pricing fetch failed: {status} {str(txt)[:200]}")
    return {m.get("id"): (m.get("metadata") or {}).get("pricing") or {} for m in j.get("data", [])}


def normalize_usage(u: dict) -> dict:
    norm = {
        "prompt_tokens": u.get("prompt_tokens"),
        "completion_tokens": u.get("completion_tokens"),
        "total_tokens": u.get("total_tokens"),
        "cached_tokens": None,
        "cache_field_path": None,
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
    return norm


def usd(norm: dict, pricing: dict) -> dict:
    p_in, p_out = pricing.get("input_tokens"), pricing.get("output_tokens")
    p_cache = pricing.get("cache_read_tokens", p_in)
    pt = norm.get("prompt_tokens") or 0
    ct = norm.get("completion_tokens") or 0
    cached = norm.get("cached_tokens") or 0
    if p_in is None or p_out is None:
        return {"with_cache": None, "if_no_cache": None, "basis": "price-missing"}
    miss = max(pt - cached, 0)
    return {
        "with_cache": round(cached / 1e6 * p_cache + miss / 1e6 * p_in + ct / 1e6 * p_out, 6),
        "if_no_cache": round(pt / 1e6 * p_in + ct / 1e6 * p_out, 6),
        "basis": "provider-listed usd/1M",
    }


def call_model(model_id: str, messages: list):
    body = {"model": model_id, "messages": messages, "max_tokens": MAX_TOKENS, "stream": False, "temperature": TEMP}
    last_err = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        status, j, txt = http_json(ENDPOINT, body, CALL_TIMEOUT_S)
        if status == 200 and isinstance(j, dict):
            return {"ok": True, "j": j}
        if status == 429 or (status is not None and status >= 500) or status is None:
            wait = min(60.0, 1.5 * 2 ** (attempt - 1)) + random.uniform(0, 0.4)
            last_err = f"http_{status}" if status else f"network:{str(txt)[:80]}"
            print(f"  attempt {attempt}: {last_err}, backing off {wait:.1f}s", flush=True)
            time.sleep(wait)
            continue
        return {"ok": False, "error": f"http_{status}: {str(txt)[:200]}"}
    return {"ok": False, "error": last_err or "exhausted"}


def seal_row(call_id, seat, mid, turn, messages, r, elapsed, pricing):
    row = {
        "round": ROUND, "call_id": call_id, "seat": seat, "turn": turn,
        "model_requested": mid, "model_served": None, "temperature": TEMP,
        "max_tokens": MAX_TOKENS, "prompt_hash": sha(json.dumps(messages[-1]["content"])),
        "prefix_sha256": PREFIX_SHA256, "sealed_at": now(),
    }
    if r.get("ok"):
        j = r["j"]
        msg = (j.get("choices") or [{}])[0].get("message") or {}
        norm = normalize_usage(j.get("usage") or {})
        parsed = extract_json(msg.get("content") or "")
        row.update({
            "model_served": j.get("model"),
            "finish_reason": (j.get("choices") or [{}])[0].get("finish_reason"),
            "content_raw": msg.get("content") or "",
            "content_json": parsed["obj"], "parse_method": parsed["method"],
            "usage_norm": norm, "elapsed_ms": elapsed, "usd": usd(norm, pricing),
        })
        print(f"  sealed: prompt {norm['prompt_tokens']} (cached {norm['cached_tokens']}) out {norm['completion_tokens']} | parse {parsed['method']} | ${row['usd']['with_cache']}", flush=True)
    else:
        row.update({"error": r.get("error"), "elapsed_ms": elapsed})
        print(f"  FAILED: {r.get('error')} — receipted", flush=True)
    append_row(row)
    return row


def cmd_run(only: str | None) -> None:
    print(f"prefix sha256: {PREFIX_SHA256}")
    print(f"prefix chars: {len(SYSTEM_PREFIX)} (~{len(SYSTEM_PREFIX)//4} tokens)")
    pricing_table = fetch_pricing()
    rows = load_rows()
    done = {r["call_id"] for r in rows if r.get("call_id")}
    for short, mid in MODELS:
        if only and mid != only:
            continue
        pricing = pricing_table.get(mid, {})
        id1, id2 = f"{ROUND}-{short}-attack", f"{ROUND}-{short}-selfcritique"
        if id1 not in done:
            print(f"turn 1 {id1} [{mid}] ...", flush=True)
            t0 = time.time()
            r = call_model(mid, [{"role": "system", "content": SYSTEM_PREFIX}, {"role": "user", "content": TURN1}])
            seal_row(id1, short, mid, 1, [{"role": "user", "content": TURN1}], r, int((time.time() - t0) * 1000), pricing)
            time.sleep(GAP_S)
        else:
            print(f"skip {id1} (sealed)")
        row1 = next((x for x in load_rows() if x.get("call_id") == id1), None)
        if id2 not in done and row1 and row1.get("content_raw"):
            print(f"turn 2 {id2} [{mid}] (self-critique, warm call) ...", flush=True)
            msgs = [
                {"role": "system", "content": SYSTEM_PREFIX},
                {"role": "user", "content": TURN1},
                {"role": "assistant", "content": row1["content_raw"]},
                {"role": "user", "content": TURN2.format(findings_json=json.dumps(row1.get("content_json") or {"unparsed": "see content_raw"}, ensure_ascii=False))},
            ]
            t0 = time.time()
            r = call_model(mid, msgs)
            seal_row(id2, short, mid, 2, msgs, r, int((time.time() - t0) * 1000), pricing)
            time.sleep(GAP_S)
        else:
            print(f"skip {id2} ({'sealed' if id2 in done else 'turn-1 row unusable'})")
    write_econ(pricing_table)
    print(f"\nround complete. rows: {ROWS_FILE}")


def write_econ(pricing_table: dict | None = None) -> None:
    if pricing_table is None:
        pricing_table = fetch_pricing()
    rows = load_rows()
    seats = []
    tot = {"calls": len(rows), "sealed": 0, "failed": 0, "prompt": 0, "cached": 0, "completion": 0, "usd": 0.0, "usd_no_cache": 0.0}
    for r in rows:
        norm = r.get("usage_norm") or {}
        seats.append({
            "call_id": r["call_id"], "seat": r.get("seat"), "turn": r.get("turn"),
            "prompt_tokens": norm.get("prompt_tokens"), "cached_tokens": norm.get("cached_tokens"),
            "hit_ratio": (round(norm["cached_tokens"] / norm["prompt_tokens"], 4)
                          if norm.get("cached_tokens") is not None and norm.get("prompt_tokens") else None),
            "completion_tokens": norm.get("completion_tokens"), "parse_method": r.get("parse_method"),
            "usd": (r.get("usd") or {}).get("with_cache"), "elapsed_ms": r.get("elapsed_ms"),
            "error": r.get("error"),
        })
        if r.get("usage_norm"):
            tot["sealed"] += 1
            tot["prompt"] += norm.get("prompt_tokens") or 0
            tot["cached"] += norm.get("cached_tokens") or 0
            tot["completion"] += norm.get("completion_tokens") or 0
            tot["usd"] += (r.get("usd") or {}).get("with_cache") or 0
            tot["usd_no_cache"] += (r.get("usd") or {}).get("if_no_cache") or 0
        else:
            tot["failed"] += 1
    econ = {
        "wave": "ORCH-R11", "round": ROUND, "artifact": "situations/cache_economics_r11.json",
        "generated_at": now(), "endpoint": ENDPOINT,
        "experiment": "the fix audit: 4 endorsed seats x 2 turns (attack the post-R10 fixes, then self-critique); turn 2 cashes the prefix cache by construction",
        "prefix": {"sha256": PREFIX_SHA256, "chars": len(SYSTEM_PREFIX)},
        "totals": {**tot,
                   "hit_ratio_overall": round(tot["cached"] / tot["prompt"], 4) if tot["prompt"] else None,
                   "usd_total": round(tot["usd"], 6), "usd_if_no_cache": round(tot["usd_no_cache"], 6)},
        "seats": seats,
        "reading": ("Round 11 runs the founder-endorsed seats only (Hy4, DeepSeek-V4.1-Flash, MiMo for "
                    "cache value; Seed-2.0-mini as the briefed devil's advocate). The two-turn structure "
                    "makes turn 2 the cache-game receipt: its prompt = the full turn-1 conversation, so "
                    "cached_tokens on turn-2 rows IS the discount materializing (r10 was structurally "
                    "cold — one call per seat can never hit)."),
    }
    ECON_FILE.write_text(json.dumps(econ, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"economics written: {ECON_FILE}")


def main() -> None:
    args = sys.argv[1:]
    only = args[args.index("--model") + 1] if "--model" in args else None
    if args and args[0] == "run":
        cmd_run(only)
    elif args and args[0] == "econ":
        write_econ()
    else:
        print("usage: python3 arena_r11.py run|econ [--model ID]")
        sys.exit(1)


if __name__ == "__main__":
    main()
