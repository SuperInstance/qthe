#!/usr/bin/env python3
# situations/sde_cascade/reprice_hy4.py -- ORCH-R15 Lane T6-a: the Hy4
# verify-tier cascade re-price. TRIGGERS the r13 re-registration pointer by
# measurement: tencent/Hy4-preview runs as the verify tier on the sealed
# 90-item corpus, and the FIRE_T sweep is re-priced from measured seat prices.
#
# DESIGN (frozen in docs/discussions/2026-10-18-orch-r15-registration.md):
#   - corpus: the 90 sealed items + ground truth (ground_truth_table.json,
#     labels receipted at seal; NO re-labeling, NO new labels).
#   - verify tier: tencent/Hy4-preview via DeepInfra, temperature 0,
#     max_tokens 4000, ONE ITEM PER CALL (audit-seat semantics). State = the
#     group's sealed briefing verbatim (extract_prefix of arena_deepinfra.py /
#     arena_r11.py -- same shas as the sealed battery run) + the item verbatim.
#   - sub-sample (seed 33001, frozen before any call, sealed to
#     reprice_subsample.json): all 14 BAD + 14/43 CLEAN + 6/33 JUDGMENT = 34.
#   - call order grouped by briefing so calls 2+ hit the prefix cache (20x).
#   - falsifiers: F-a validity (Hy4 BAD recall >= 6/14 on sub-sample);
#     F-b dominance (cascade strictly better one axis, no worse other);
#     F-c cache law (cost reported raw AND cache-aware).
#   - lane ceiling $0.10, fail-stop; append+flush rows; resume by call_id;
#     fail-closed on parse; no .format() on JSON-bearing strings.
#
# House laws: AS-SAID, append-only rows, foreground only, key from env only.

import hashlib
import json
import os
import pathlib
import random
import re
import sys
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
PARENT = HERE.parent

KEY = os.environ.get("DEEPINFRA_API_KEY", "")
ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions"
MODEL = "tencent/Hy4-preview"
CALL_TIMEOUT_S = 180
MAX_ATTEMPTS = 5
GAP_S = 1.0
LANE_CEILING_USD = 0.13  # AMENDMENT 2: cumulative, under the $0.15 round ceiling
SUBSAMPLE_SEED = 33001
N_CLEAN = 14
N_JUDGMENT = 6

SUBSAMPLE_F = HERE / "reprice_subsample.json"
ROWS = HERE / "reprice_rows.jsonl"
USD_PER_MTOK_IN = 0.60    # DeepInfra list for Hy4-preview class, corrected by receipts
USD_PER_MTOK_CACHED = 0.03  # 20x cache discount (MODEL-LEARNINGS r11 law)
USD_PER_MTOK_OUT = 1.20

INSTRUCTIONS = (
    "You are the expensive verify tier of an audit cascade. You see one "
    "finding (or claim) from a code-review round, together with the round "
    "briefing it was written against. Adjudicate it.\n\n"
    "Verdict vocabulary (use EXACTLY one):\n"
    "- BAD: the finding misstates the record -- it names artifacts, flags, "
    "numbers, or mechanisms that do not exist or do not match the briefing; "
    "or its conclusion is wrong on its own evidence.\n"
    "- CLEAN: the finding is accurate and fairly stated against the briefing.\n"
    "- JUDGMENT: defensible either way; a curator could reasonably accept or "
    "reject it; the text itself does not decide.\n\n"
    "Answer with ONE JSON object on a single line and nothing else:\n"
    '{"id": "<the item id>", "verdict": "BAD|CLEAN|JUDGMENT", "reason": "<one line>"}'
)


def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def extract_prefix(path: pathlib.Path) -> str:
    txt = path.read_text(encoding="utf-8")
    m = re.search(r'SYSTEM_PREFIX = """(.*?)"""', txt, re.S)
    if not m:
        raise SystemExit("SYSTEM_PREFIX not found in %s" % path)
    return m.group(1)


def usd_of(usage: dict) -> float:
    # ERRATUM 1: DeepInfra's own estimate is authoritative (Hy4-preview burns
    # 2400 reasoning tokens per call; house constants under-priced ~1.5x).
    est = usage.get("estimated_cost")
    if est is not None:
        return float(est)
    pin = usage.get("prompt_tokens", 0) or 0
    pcached = usage.get("prompt_tokens_cached"
                        ) or usage.get("cached_tokens") or usage.get("prompt_cache_hit_tokens") or 0
    pout = usage.get("completion_tokens", 0) or 0
    return (pin - pcached) * USD_PER_MTOK_IN / 1e6 + pcached * USD_PER_MTOK_CACHED / 1e6 \
        + pout * USD_PER_MTOK_OUT / 1e6


def call_hy4(state_briefing: str, item_id: str, item_text: str) -> dict:
    user = (
        state_briefing
        + "\n\nFINDING UNDER ADJUDICATION (sealed verbatim):\n"
        + json.dumps({"id": item_id, "text": item_text}, ensure_ascii=False)
        + "\n\n" + INSTRUCTIONS
    )
    body = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are a careful audit adjudicator. Output one JSON object only."},
            {"role": "user", "content": user},
        ],
        "temperature": 0,
        "max_tokens": 4000,
    }).encode("utf-8")
    req = urllib.request.Request(ENDPOINT, data=body, headers={
        "Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=CALL_TIMEOUT_S) as r:
        j = json.loads(r.read().decode("utf-8"))
    return {"raw": j, "elapsed_ms": int((time.time() - t0) * 1000)}


def parse_verdict(text: str) -> dict:
    # find the outermost {...} JSON object; fail closed if absent/unparseable
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise ValueError("no JSON object in response")
    obj = json.loads(m.group(0))
    if obj.get("verdict") not in ("BAD", "CLEAN", "JUDGMENT"):
        raise ValueError("verdict not in vocabulary: %r" % obj.get("verdict"))
    return obj


def main() -> None:
    # foreground-chunk law: the sandbox reaps background processes between
    # tool calls, so the probe runs in bounded chunks. --max-seconds exits
    # CLEANLY between calls (a mid-call kill = dead unreceipted spend).
    max_seconds = float(sys.argv[sys.argv.index("--max-seconds") + 1]) \
        if "--max-seconds" in sys.argv else 1e9
    t_start = time.time()
    if not KEY:
        sys.exit("DEEPINFA_API_KEY missing (set DEEPINFRA_API_KEY)")

    gt = json.loads((HERE / "ground_truth_table.json").read_text(encoding="utf-8"))
    items = gt["items"]
    assert len(items) == 90

    # ── frozen sub-sample, sealed before any call ──────────────────────────
    if SUBSAMPLE_F.exists():
        sub = json.loads(SUBSAMPLE_F.read_text(encoding="utf-8"))
    else:
        rng = random.Random(SUBSAMPLE_SEED)
        bad = [i["id"] for i in items if i["label"] == "BAD"]
        clean = [i["id"] for i in items if i["label"] == "CLEAN"]
        judg = [i["id"] for i in items if i["label"] == "JUDGMENT"]
        sub = {
            "seed": SUBSAMPLE_SEED, "n_clean": N_CLEAN, "n_judgment": N_JUDGMENT,
            "ids": sorted(bad) + sorted(rng.sample(clean, N_CLEAN)) + sorted(rng.sample(judg, N_JUDGMENT)),
            "sealed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        SUBSAMPLE_F.write_text(json.dumps(sub, ensure_ascii=False, indent=1), encoding="utf-8")
        print("sub-sample sealed: %d ids (all %d BAD + %d/%d CLEAN + %d/%d JUDGMENT)" % (
            len(sub["ids"]), len(bad), N_CLEAN, len(clean), N_JUDGMENT, len(judg)), flush=True)

    by_id = {i["id"]: i for i in items}
    chosen = [by_id[i] for i in sub["ids"]]

    # briefings, same extraction as the sealed battery run
    r10_prefix = extract_prefix(PARENT / "arena_deepinfra.py")
    r11_prefix = extract_prefix(PARENT / "arena_r11.py")
    print("briefings: r10 %d chars (sha %s...), r11 %d chars (sha %s...)" % (
        len(r10_prefix), sha(r10_prefix)[:16], len(r11_prefix), sha(r11_prefix)[:16]), flush=True)
    brief_of = {"r10": r10_prefix, "r11": r11_prefix, "grounding": r10_prefix}

    # group order: briefing-grouped; AMENDMENT 1: BAD stratum first (ceiling
    # survival -- the F-a recall denominator must complete inside $0.10),
    # then CLEAN, then JUDGMENT; strata keyed for cache-friendly sequencing
    order = {"r10": 0, "grounding": 0, "r11": 1}
    stratum = {"BAD": 0, "CLEAN": 1, "JUDGMENT": 2}
    chosen.sort(key=lambda it: (stratum[it["label"]], order[it["source"]], it["group"], it["id"]))

    done = set()
    spend = 0.0  # AMENDMENT 2: cumulative across processes, from the rows file
    if ROWS.exists():
        for line in ROWS.read_text(encoding="utf-8").split("\n"):
            if line.strip():
                row_ = json.loads(line)
                if "call_id" in row_:
                    done.add(row_["call_id"])
                    spend += row_.get("usd_est") or 0.0
    print("resuming: %d done, $%.5f already spent (cumulative ceiling $%.2f)" % (
        len(done), spend, LANE_CEILING_USD), flush=True)
    n_calls = 0
    with ROWS.open("a", encoding="utf-8") as f:
        for it in chosen:
            cid = "r15-hy4v-" + it["id"].replace("/", "_")
            if cid in done:
                continue
            if spend >= LANE_CEILING_USD:
                print("LANE CEILING HIT (%.4f USD) -- fail-stop at %d/%d calls" % (
                    spend, n_calls, len(chosen)), flush=True)
                break
            # time budget: never START a call that cannot finish inside the chunk
            if time.time() - t_start > max_seconds - 150:  # 150s = worst-call headroom
                print("CHUNK TIME BUDGET -- clean exit, %d calls this chunk, resume next run" % n_calls, flush=True)
                break
            briefing = brief_of[it["source"]]
            ok, row, attempt = False, None, 0
            while not ok and attempt < MAX_ATTEMPTS:
                attempt += 1
                try:
                    out = call_hy4(briefing, it["id"], it["text"])
                    text = out["raw"]["choices"][0]["message"]["content"]
                    verdict = parse_verdict(text)
                    usage = out["raw"].get("usage", {})
                    usd = usd_of(usage)
                    row = {
                        "call_id": cid, "item_id": it["id"], "ground_truth": it["label"],
                        "group": it["group"], "source": it["source"],
                        "verdict": verdict["verdict"], "reason": verdict.get("reason", ""),
                        "usage": usage, "usd_est": usd, "elapsed_ms": out["elapsed_ms"],
                        "attempt": attempt, "sealed_at": time.strftime(
                            "%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
                    ok = True
                except Exception as e:  # noqa: BLE001 -- receipt every failure
                    row = {"call_id": cid, "item_id": it["id"], "error": repr(e),
                           "attempt": attempt, "sealed_at": time.strftime(
                               "%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
                    print("  attempt %d failed: %r" % (attempt, e), flush=True)
                    time.sleep(GAP_S * attempt)
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            f.flush()
            if row.get("verdict"):
                spend += row["usd_est"]
                n_calls += 1
                print("[%s] gt=%s verdict=%s %.1fs $%.5f (run $%.4f)" % (
                    it["id"], it["label"], row["verdict"], row["elapsed_ms"] / 1000,
                    row["usd_est"], spend), flush=True)
            else:
                print("[%s] FAILED after %d attempts -- receipted, continuing" % (
                    it["id"], attempt), flush=True)
            time.sleep(GAP_S)
    print("RUN DONE: %d calls, $%.5f est spend (cache-aware)" % (n_calls, spend), flush=True)


if __name__ == "__main__":
    main()
