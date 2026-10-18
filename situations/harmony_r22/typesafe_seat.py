#!/usr/bin/env python3
# situations/harmony_r22/typesafe_seat.py — the typesafe arm of HARMONY-r22
# (ORCH-R22/T13-c): the same 6-statement battery through the systemone typed
# question map (choice: TRUE/FALSE/UNCERTAIN per statement). Runs from the
# sandbox (typesafe is HK-reachable). AS-SAID rows; the key is env-only.
#
# The operator's dispatch named "the two typesafe.ai models" — this script
# first probes the models list (free) and receipts whatever it finds, then
# runs the battery on jev-latest (the documented model id) and, if a second
# distinct model id exists, on that too.
import hashlib
import json
import os
import pathlib
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODELS_ENDPOINT = "https://api.typesafe.ai/v1/models"
CALL_TIMEOUT_S = 180
ROUND = os.environ.get("GROQ_ROUND", "r22")

briefing = (HERE / "briefing.txt").read_text()
statements = json.loads((HERE / "statements.json").read_text())
ids = list(statements)

def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def api_key() -> str:
    k = os.environ.get("TYPESAFE_API_KEY")
    if not k:
        raise SystemExit("TYPESAFE_API_KEY not set (env-only key doctrine)")
    return k

def http_json(url, payload=None, method=None):
    req = urllib.request.Request(url, method=method or ("POST" if payload is not None else "GET"))
    req.add_header("Authorization", f"Bearer {api_key()}")
    req.add_header("Content-Type", "application/json")
    body = json.dumps(payload).encode() if payload is not None else None
    with urllib.request.urlopen(req, body, timeout=CALL_TIMEOUT_S) as r:
        return r.status, json.loads(r.read().decode())

# ── probe: what models does typesafe serve? (the 'two models' question) ─────
probe_status, probe_body = 0, None
try:
    probe_status, probe_body = http_json(MODELS_ENDPOINT)
except urllib.error.HTTPError as e:
    probe_status = e.code
    probe_body = {"error": str(e)}
except Exception as e:  # noqa: BLE001 — the probe receipts any failure shape
    probe_status = -1
    probe_body = {"error": str(e)}
print(f"[typesafe-probe] GET /v1/models -> {probe_status}: {json.dumps(probe_body)[:400]}")

model_ids = ["jev-latest"]
if probe_status == 200 and isinstance(probe_body, dict):
    found = probe_body.get("models") or probe_body.get("data") or []
    names = [m.get("id") or m.get("name") for m in found if isinstance(m, dict)]
    if names:
        model_ids = [n for n in names if n][:2] or model_ids
    print(f"[typesafe-probe] served models: {names}")

# ── the battery ── v2: the criteria keys ARE the choices (the r12 working
# shape: {option_id: description}); v1 used {statement, choices} and the
# models echoed the key names — 2 rows sealed as the shape-erratum, spend
# counted, no re-laundering.
CRITERIA = {
    "TRUE": "The experiment record in the briefing evidences the statement: the named values, trajectory, gate results, or spend match what the record says.",
    "FALSE": "The record contradicts the statement: an inverted trajectory, a wrong value, a misattributed spend, or a gate result the record does not own.",
    "UNCERTAIN": "The briefing cannot settle the statement either way.",
}
# explicit aggregation loop — the T5-a guard's BATCHED pattern (a comprehension
# is invisible to it; this site IS batched: 6 questions, one call)
questions = {}
for sid in ids:
    questions[sid] = {
        "type": "choice",
        "instructions": (
            f"Statement [{sid}]: {statements[sid]}  "
            "Is this statement TRUE, FALSE, or UNCERTAIN per the experiment record in the briefing? "
            "Judge strictly from the record; when the record settles it, do not answer UNCERTAIN."
        ),
        "criteria": CRITERIA,
    }

rows_path = HERE / f"typesafe_rows_{ROUND}.jsonl"
sealed_ids = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            try:
                sealed_ids.add(json.loads(line)["call_id"])
            except json.JSONDecodeError:
                pass  # a torn tail line is skipped, never trusted
for model in model_ids:
    call_id = f"{ROUND}-harmony-typesafe-{model}-v2"
    if call_id in sealed_ids:
        print(f"[typesafe] {model}: call_id {call_id} already sealed — resuming past it (the tavern's resume law; no re-spend)")
        continue
    payload = {"state": briefing, "model": model, "questions": questions}
    t0 = time.time()
    try:
        status, body = http_json(ENDPOINT, payload)
    except urllib.error.HTTPError as e:
        status = e.code
        body = {"error": str(e)}
    elapsed = int((time.time() - t0) * 1000)
    row = {
        "round": ROUND, "call_id": call_id, "seat": f"typesafe/{model}",
        "task": "harmony-battery",
        "model_requested": model, "model_served": body.get("model"),
        "briefing_sha256": sha(briefing), "question_map_sha256": sha(json.dumps(questions, sort_keys=True)),
        "sealed_at": now(), "http_status": status,
        "answers_raw": body.get("answers"), "usage": body.get("usage"),
        "elapsed_ms": elapsed,
    }
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    if status == 200:
        ans = body.get("answers", {})
        print(f"[typesafe] {model} -> served {body.get('model')} {elapsed}ms: " +
              " ".join(f"{sid}={ans.get(sid, {}).get('choice')}" for sid in ids))
    else:
        print(f"[typesafe] {model} -> HTTP {status} (row sealed with error body)")
    time.sleep(1.0)
