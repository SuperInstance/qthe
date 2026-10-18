#!/usr/bin/env python3
# situations/embedding_r24/occlusion_embedder.py — E-Q23 lane T15-c: span
# occlusion through the question map (the score arm — the incumbent
# representation, question map byte-identical to E-Q21's).
#
# Three row classes, all AS-SAID with the resume law:
#   full   — the record re-embedded intact (fresh baseline v_full; ALSO the
#            stability bridge anchor vs the E-Q21 sealed vector)
#   occl   — the record with ONE sealed span replaced by '[…]'
#   drift  — the record re-embedded via model=jev-preview (lane D1: the
#            1.13.0 -> 1.14.0 embedding-drift receipt)
import hashlib
import json
import os
import pathlib
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
CALL_TIMEOUT_S = 180
ROUND = "r24"

corpus = json.loads((HERE.parent / "embedding_r23" / "corpus.json").read_text())
records = {r["id"]: r for r in corpus["records"]}
spans_doc = json.loads((HERE / "spans_eq23.json").read_text())
SPANS = spans_doc["spans"]
SUBSET = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]

# AXES + question map: byte-identical to situations/embedding_r23/typesafe_embedder.py
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

# EXPLICIT aggregation loop (the T5-a guard's BATCHED pattern)
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

rows_path = HERE / "occlusion_rows_r24.jsonl"
sealed_ids = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            try:
                sealed_ids.add(json.loads(line)["call_id"])
            except json.JSONDecodeError:
                pass

def occlude(text, span):
    # replace the FIRST exact occurrence of the span with '[…]'
    if span not in text:
        raise SystemExit(f"F2 breach: sealed span not found verbatim in record text")
    return text.replace(span, "[…]", 1)

def call(call_id, state, record_id, family, task, extra=None, model="jev-latest"):
    if call_id in sealed_ids:
        print(f"  {call_id}: already sealed — resuming past it (no re-spend)")
        return None
    payload = {"state": state, "model": model, "questions": QUESTIONS}
    t0 = time.time()
    try:
        status, body = http_json(ENDPOINT, payload)
    except urllib.error.HTTPError as e:
        status, body = e.code, {"error": str(e)}
    elapsed = int((time.time() - t0) * 1000)
    row = {
        "round": ROUND, "call_id": call_id, "seat": f"typesafe/{model}",
        "task": task, "record_id": record_id, "family": family,
        "model_served": body.get("model"), "question_map_sha256": QMAP_SHA,
        "state_sha256": sha(state),
        "sealed_at": now(), "http_status": status, "elapsed_ms": elapsed,
        "answers_raw": body.get("answers"), "usage": body.get("usage"),
    }
    if extra:
        row.update(extra)
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    if status != 200:
        print(f"  {call_id}: HTTP {status} (row sealed with error body)")
        return None
    ans = body.get("answers", {})
    print(f"  {call_id}: {elapsed}ms model={body.get('model')}")
    return row

def main():
    print(f"[occlusion-embedder] 8 full + {sum(len(v) for v in SPANS.values())} occlusions + 8 drift calls (qmap sha {QMAP_SHA[:12]}…)")
    for rid in SUBSET:
        rec = records[rid]
        base_state = "RECORD " + rid + " (from the qthe kernel's sealed experiment record):\n\n" + rec["text"]
        call(f"{ROUND}-occl-full-{rid}", base_state, rid, rec["family"], "occlusion-full")
        for i, span in enumerate(SPANS[rid]):
            occ_state = "RECORD " + rid + " (from the qthe kernel's sealed experiment record):\n\n" + occlude(rec["text"], span)
            call(f"{ROUND}-occl-{rid}-s{i}", occ_state, rid, rec["family"], "occlusion-span",
                 extra={"span_index": i, "span_len": len(span)})
        # lane D1: the jev-preview drift receipt
        call(f"{ROUND}-drift-preview-{rid}", base_state, rid, rec["family"], "drift-preview", model="jev-preview")
    print(f"[occlusion-embedder] rows -> {rows_path}")

if __name__ == "__main__":
    main()
