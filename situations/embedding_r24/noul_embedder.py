#!/usr/bin/env python3
# situations/embedding_r24/noul_embedder.py — E-Q22 lane T15-b: the NOUL arm
# of the axis-calibration x ternary-quantization factorial.
#
# THE DESIGN (pre_registration_e_q22.json): the SAME 8 axis CONCEPTS as the
# E-Q21 score battery, but typed as NOUL questions (calibrated mass p in
# [0,1]) instead of ordinal score levels. One systemone call PER RECORD, all
# 8 probes batched (the T5-a law; the questions map is built by an EXPLICIT
# aggregation loop — the r22 guard law). AS-SAID rows with the resume law;
# the key is env-only. F5 stability: 3 records re-embedded once (-stab).
#
# The concept texts are IDENTICAL to situations/embedding_r23/typesafe_embedder.py
# AXES — only the question TYPE changes (the calibration variable).
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
ROUND = "r24"

corpus = json.loads((HERE.parent / "embedding_r23" / "corpus.json").read_text())
records = corpus["records"]

AXES = [
    ("P1_nonlocal", "NON-LOCAL coupling — distant cells, wormholes, twin resonance, remote slot reads and writes"),
    ("P2_localrule", "the LOCAL update rule's physics — neighborhood coupling, timbre states, thresholds, cascades, saturation"),
    ("P3_quantum", "QUANTUM construction or randomness provenance — certified entropy, Bell witnesses, quantum blur, interference"),
    ("P4_alloc", "ALLOCATION or ARBITRATION — task routing, queues, starvation, priorities, arbitration among consumers"),
    ("P5_repair", "REPAIR, healing, self-maintenance, or recovery from damage"),
    ("P6_null", "a REFUTED or failed hypothesis — an honest null, a DIES verdict, a falsified claim"),
    ("P7_econ", "COST, price, performance, or economics — token budgets, pricing tiers, speed and spend"),
    ("P8_exact", "EXACTNESS or determinism — byte-identity, replay, verification, reproducibility"),
]

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

# the noul probe battery — ONE fixed map shape, applied per record.
# EXPLICIT aggregation loop (the T5-a guard's BATCHED pattern; the questions
# dict is built by for-header + map-assign, never a comprehension).
def build_questions():
    questions = {}
    for ax, concept in AXES:
        questions[ax] = {
            "type": "noul",
            "instructions": (
                f"Record: does it substantively concern {concept}? "
                "Judge whether the record is about this concern."
            ),
            "criteria": {
                "true": "The record is substantively about this concern",
                "false": "The record is not about this concern",
            },
        }
    return questions

QUESTIONS = build_questions()
QMAP_SHA = sha(json.dumps(QUESTIONS, sort_keys=True))

rows_path = HERE / "noul_embed_rows_r24.jsonl"
sealed_ids = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            try:
                sealed_ids.add(json.loads(line)["call_id"])
            except json.JSONDecodeError:
                pass

STABILITY_IDS = ["N1", "P4", "A5"]  # same records as E-Q21's F5 (frozen)

def embed(rec, tag):
    call_id = f"{ROUND}-embed-noul-{rec['id']}{tag}"
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
        "task": "noul-embedding-probe", "record_id": rec["id"], "family": rec["family"],
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
    print(f"  {call_id}: {elapsed}ms " + " ".join(f"{ax}={(ans.get(ax) or {}).get('noul')}" for ax, _ in AXES))
    return row

def main():
    print(f"[noul-embedder] {len(records)} records x 8 noul probes, one batched call each (qmap sha {QMAP_SHA[:12]}…)")
    for rec in records:
        embed(rec, "")
    for rid in STABILITY_IDS:
        rec = next(r for r in records if r["id"] == rid)
        embed(rec, "-stab")
    print(f"[noul-embedder] rows -> {rows_path}")

if __name__ == "__main__":
    main()
