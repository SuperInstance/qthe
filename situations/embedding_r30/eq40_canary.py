#!/usr/bin/env python3
# situations/embedding_r30/eq40_canary.py — E-Q40's FIRST call: the flip-check
# canary (the registered protocol: state+questions shape from drift_monitor.py,
# model jev-latest, read model_served). If model_served reports 1.14.0, the
# census DROPS and the drift monitor's once-in-a-version reading fires instead
# (re-embed the sealed 20-record battery vs all three sealed baselines under
# the standing E-Q31/E-Q38 instrument registration). One call, fully receipted.
import hashlib
import json
import os
import pathlib
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"

ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
ROUND = "r30"

# the drift_monitor.py shape: the 8-question E-Q22 map (no decoys), N1 state
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
QMAP_SHA = hashlib.sha256(json.dumps(QUESTIONS, sort_keys=True).encode()).hexdigest()

corpus = json.loads((R23 / "corpus.json").read_text())
rec = [r for r in corpus["records"] if r["id"] == "N1"][0]
state = "RECORD " + rec["id"] + " (from the qthe kernel's sealed experiment record):\n\n" + rec["text"]

payload = {"state": state, "model": MODEL, "questions": QUESTIONS}
req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), headers={
    "Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}",
    "Content-Type": "application/json"})
t0 = time.time()
try:
    with urllib.request.urlopen(req, timeout=180) as r:
        body = json.load(r)
    status = 200
except urllib.error.HTTPError as e:
    status, body = e.code, {"error": str(e)}
dt = int((time.time() - t0) * 1000)

reading = {
    "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "call_id": f"{ROUND}-canary-N1",
    "model_served": body.get("model"),
    "http_status": status,
    "elapsed_ms": dt,
    "question_map_sha256": QMAP_SHA,
    "state_sha256": hashlib.sha256(state.encode()).hexdigest(),
    "answers_raw": body.get("answers"),
    "flipped": body.get("model") not in (None, "jev-1.13.0"),
}
out = HERE / "flip_canary_r30.json"
out.write_text(json.dumps(reading, indent=1))
print(f"[canary] model_served={reading['model_served']} flipped={reading['flipped']} http={status} {dt}ms")
if reading["flipped"]:
    print("[canary] *** THE FLIP HAS HAPPENED — census DROPS; the drift monitor's "
          "once-in-a-version reading fires under the standing E-Q31/E-Q38 registration ***")
else:
    print("[canary] still 1.13.0 — the census proceeds per registration")
