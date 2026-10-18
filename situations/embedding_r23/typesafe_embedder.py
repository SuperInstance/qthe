#!/usr/bin/env python3
# situations/embedding_r23/typesafe_embedder.py — E-Q21 lane T14-a: the
# question map as an EMBEDDING FUNCTION (typesafe arm).
#
# THE DESIGN (pre_registration_e_q21.json + AM1): a FIXED battery of 8 score
# probes over each of the 20 sealed corpus records -> an 8-axis vector
# (normalized to [0,1], zero-padded to 32 dims for Vectorize). One systemone
# call PER RECORD, all 8 probes batched (the T5-a law; the questions map is
# built by an EXPLICIT aggregation loop — the r22 guard law).
#
# AS-SAID rows with the resume law; the key is env-only. F5 stability: 3
# records re-embedded once (call ids suffixed -stab).
import hashlib
import json
import os
import pathlib
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
CALL_TIMEOUT_S = 180
ROUND = "r23"

corpus = json.loads((HERE / "corpus.json").read_text())
records = corpus["records"]

AXES = [
    ("P1_nonlocal", "how much is this record about NON-LOCAL coupling — distant cells, wormholes, twin resonance, remote slot reads and writes?"),
    ("P2_localrule", "how much is this record about the LOCAL update rule's physics — neighborhood coupling, timbre states, thresholds, cascades, saturation?"),
    ("P3_quantum", "how much is this record about QUANTUM construction or randomness provenance — certified entropy, Bell witnesses, quantum blur, interference?"),
    ("P4_alloc", "how much is this record about ALLOCATION or ARBITRATION — task routing, queues, starvation, priorities, arbitration among consumers?"),
    ("P5_repair", "how much is this record about REPAIR, healing, self-maintenance, or recovery from damage?"),
    ("P6_null", "how much does this record document a REFUTED or failed hypothesis — an honest null, a DIES verdict, a falsified claim?"),
    ("P7_econ", "how much is this record about COST, price, performance, or economics — token budgets, pricing tiers, speed and spend?"),
    ("P8_exact", "how much is this record about EXACTNESS or determinism — byte-identity, replay, verification, reproducibility?"),
]
RUBRIC = ["zero", "low", "moderate", "high", "central"]

def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def api_key() -> str:
    k = os.environ.get("TYPESAFE_API_KEY")
    if not k:
        raise SystemExit("TYPESAFE_API_KEY not set (env-only key doctrine)")
    return k

def http_json(url, payload=None):
    req = urllib.request.Request(url, method="POST" if payload is not None else "GET")
    req.add_header("Authorization", f"Bearer {api_key()}")
    req.add_header("Content-Type", "application/json")
    body = json.dumps(payload).encode() if payload is not None else None
    with urllib.request.urlopen(req, body, timeout=CALL_TIMEOUT_S) as r:
        return r.status, json.loads(r.read().decode())

# the probe battery — ONE fixed map shape, applied per record.
# EXPLICIT aggregation loop (the T5-a guard's BATCHED pattern; the questions
# dict is built by for-header + map-assign, never a comprehension).
def build_questions():
    questions = {}
    for ax, prompt in AXES:
        questions[ax] = {
            "type": "score",
            "instructions": (
                f"Record: how much does it concern this axis — {prompt} "
                "Score the record's degree of concern with the axis."
            ),
            "criteria": RUBRIC,
        }
    return questions

QUESTIONS = build_questions()
QMAP_SHA = sha(json.dumps(QUESTIONS, sort_keys=True))

rows_path = HERE / "typesafe_embed_rows_r23.jsonl"
sealed_ids = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            try:
                sealed_ids.add(json.loads(line)["call_id"])
            except json.JSONDecodeError:
                pass

STABILITY_IDS = ["N1", "P4", "A5"]  # one per a large family spread (F5)

def embed(rec, tag):
    call_id = f"{ROUND}-embed-jev-{rec['id']}{tag}"
    if call_id in sealed_ids:
        print(f"  {call_id}: already sealed — resuming past it (no re-spend)")
        return None
    payload = {
        "state": "RECORD " + rec["id"] + " (from the qthe kernel's sealed experiment record):\n\n" + rec["text"],
        "model": MODEL,
        "questions": QUESTIONS,
    }
    t0 = time.time()
    try:
        status, body = http_json(ENDPOINT, payload)
    except urllib.error.HTTPError as e:
        status, body = e.code, {"error": str(e)}
    elapsed = int((time.time() - t0) * 1000)
    row = {
        "round": ROUND, "call_id": call_id, "seat": "typesafe/jev-latest",
        "task": "embedding-probe", "record_id": rec["id"], "family": rec["family"],
        "model_served": body.get("model"), "question_map_sha256": QMAP_SHA,
        "state_sha256": sha(payload["state"]),
        "sealed_at": now(), "http_status": status, "elapsed_ms": elapsed,
        "answers_raw": body.get("answers"), "usage": body.get("usage"),
    }
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    if status != 200:
        print(f"  {call_id}: HTTP {status} (row sealed with error body)")
        return None
    ans = body.get("answers", {})
    print(f"  {call_id}: {elapsed}ms " + " ".join(f"{ax}={ans.get(ax, {}).get('score')}" for ax, _ in AXES))
    return row

def main():
    print(f"[typesafe-embedder] {len(records)} records x 8 probes, one batched call each (qmap sha {QMAP_SHA[:12]}…)")
    for rec in records:
        embed(rec, "")
    for rid in STABILITY_IDS:
        rec = next(r for r in records if r["id"] == rid)
        embed(rec, "-stab")
    print(f"[typesafe-embedder] rows -> {rows_path}")

if __name__ == "__main__":
    main()
