#!/usr/bin/env python3
# situations/grounding_loop/jev_client.py -- shared Jev (typesafe.ai) client,
# the jev_judge.py integration-of-record pattern, parameterized for the
# grounding-loop arms. House laws carried: Bearer auth from env only
# (fail-closed, never printed/logged), exponential backoff on 429/529/5xx,
# append+flush rows, resume by call_id, AS-SAID sealing (verbatim
# response_raw, declared parse_method), model_served taken FROM the response.
#
# No .format() anywhere near JSON-bearing strings (fleet defect #9).

import hashlib
import json
import os
import pathlib
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent  # qthe repo root

ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
CALL_TIMEOUT_S = 180
MAX_ATTEMPTS = 5
GAP_S = 1.0

# House pricing assumption for systemone (sde_cascade cookbook quotes
# jev-1.12 at $0.042 per 1M input tokens / $0.00 output; registration calls
# Jev "sub-cent per call"). Spend is computed from response usage with this
# constant and the assumption is declared in every row + verdict.md.
PRICE_PER_1M_INPUT_USD = 0.042
PRICE_PER_1M_OUTPUT_USD = 0.0


def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def api_key() -> str:
    k = os.environ.get("TYPESAFE_API_KEY")
    if not k:
        raise SystemExit(
            "TYPESAFE_API_KEY missing from env (fail-closed: no key, no call, "
            "no spend). Read from env only, never committed, never logged."
        )
    return k


def http_post(body: dict):
    """POST /v1/systemone with the jev_judge.py backoff law."""
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + api_key(),
            "Content-Type": "application/json",
        },
        method="POST",
    )
    last_err = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=CALL_TIMEOUT_S) as res:
                return {"ok": True, "j": json.loads(res.read().decode("utf-8"))}
        except urllib.error.HTTPError as e:
            txt = e.read().decode("utf-8", "replace")
            if e.code in (429, 529) or e.code >= 500:
                wait = min(60.0, 1.5 * 2 ** (attempt - 1))
                last_err = "http_" + str(e.code) + ": " + txt[:200]
                print("  attempt " + str(attempt) + ": " + last_err[:120]
                      + ", backing off " + format(wait, ".1f") + "s", flush=True)
                time.sleep(wait)
                continue
            return {"ok": False, "error": "http_" + str(e.code) + ": " + txt[:400]}
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            wait = min(60.0, 1.5 * 2 ** (attempt - 1))
            last_err = "network:" + str(e)[:150]
            print("  attempt " + str(attempt) + ": " + last_err[:120]
                  + ", backing off " + format(wait, ".1f") + "s", flush=True)
            time.sleep(wait)
    return {"ok": False, "error": last_err or "exhausted"}


def append_row(path: pathlib.Path, obj: dict) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")
        f.flush()


def load_done(path: pathlib.Path) -> set:
    if not path.exists():
        return set()
    done = set()
    for line in path.read_text(encoding="utf-8").split("\n"):
        if line.strip():
            try:
                done.add(json.loads(line)["call_id"])
            except (json.JSONDecodeError, KeyError):
                pass
    return done


def spend_of(usage: dict) -> float:
    """USD estimate from a systemone usage dict (declared pricing above)."""
    if not isinstance(usage, dict):
        return 0.0
    it = usage.get("input_tokens") or 0
    ot = usage.get("output_tokens") or 0
    return (it / 1e6) * PRICE_PER_1M_INPUT_USD + (ot / 1e6) * PRICE_PER_1M_OUTPUT_USD


def call_and_seal(call_id: str, body: dict, rows_path: pathlib.Path,
                  extra: dict = None) -> dict:
    """One systemone call, sealed AS-SAID with full provenance.

    Row carries: call_id, model_requested, model_served (from response),
    state_hash, questions_hash, question_count, elapsed_ms, usage, usd_est,
    response_raw (verbatim), parse_method, sealed_at, + extra (arm-specific:
    repeat, claims_sha, ground_truth_sha, ...). Resume by call_id: a call_id
    already present in rows_path is skipped.
    """
    done = load_done(rows_path)
    if call_id in done:
        print("skip " + call_id + " (already sealed)")
        return {"skipped": True, "call_id": call_id}
    qmap_hash = sha(json.dumps(body.get("questions") or {}, sort_keys=True))
    print("call " + call_id + " (" + str(len(body.get("questions") or {}))
          + " questions, state " + str(len(body.get("state") or "")) + " chars) ...",
          flush=True)
    t0 = time.time()
    r = http_post(body)
    elapsed_ms = int((time.time() - t0) * 1000)
    row = {
        "call_id": call_id,
        "model_requested": MODEL,
        "model_served": None,
        "state_hash": sha(body.get("state") or ""),
        "state_chars": len(body.get("state") or ""),
        "questions_hash": qmap_hash,
        "question_count": len(body.get("questions") or {}),
        "elapsed_ms": elapsed_ms,
        "sealed_at": now(),
        "endpoint": ENDPOINT,
        "parse_method": "systemone-json-direct (answers read from response "
                        "object at .answers, no text parsing)",
    }
    if extra:
        row.update(extra)
    if r["ok"]:
        j = r["j"]
        row.update({
            "model_served": j.get("model"),
            "response_raw": j,
            "usage": j.get("usage"),
            "usd_est": round(spend_of(j.get("usage")), 8),
        })
        append_row(rows_path, row)
        print("  sealed: served " + str(j.get("model")) + " | "
              + str(len(j.get("answers") or {})) + " answers | " + str(elapsed_ms)
              + "ms | usage " + json.dumps(j.get("usage")), flush=True)
        return {"ok": True, "row": row}
    row.update({"error": r["error"], "attempts": MAX_ATTEMPTS})
    append_row(rows_path, row)
    print("  FAILED: " + str(r["error"]) + " -- failure receipted", flush=True)
    return {"ok": False, "row": row}


def read_rows(path: pathlib.Path):
    if not path.exists():
        return []
    out = []
    for line in path.read_text(encoding="utf-8").split("\n"):
        if line.strip():
            out.append(json.loads(line))
    return out
