#!/usr/bin/env python3
# situations/embedding_r30/canary_flip_watch.py — R30 flip-watch canary.
# ONE call: record N1, P1_nonlocal axis, the sealed E-Q25 qmap byte-identical.
# Band: r24/r25/r26/r28 sealed readings (N1 P1) with the +-0.10 law; the r28
# close read 0.96. The moment model_served reports 1.14.0 the full once-in-a-
# version drift reading fires (E-Q38 pattern, 20 records).
import json, os, pathlib, sys, time, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
QTHE = HERE.parent.parent
WORKSPACE = QTHE.parent
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"

# --- load key from .env.local (never printed) ---
key = None
for envpath in (WORKSPACE / ".env.local", QTHE / ".env.local"):
    if envpath.exists():
        for line in envpath.read_text().splitlines():
            if line.startswith("TYPESAFE_API_KEY="):
                key = line.split("=", 1)[1].strip()
if not key:
    key = os.environ.get("TYPESAFE_API_KEY")
assert key, "no TYPESAFE_API_KEY"

# --- the sealed qmap, byte-identical to E-Q38's P1 axis ---
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
DECOYS = [
    ("D1_far_marine", "the marine biology of the Marianas trench — hadal amphipods, whale fall ecology"),
    ("D2_far_painting", "Renaissance oil painting technique — sfumato, chiaroscuro, pigment grounds"),
    ("D3_near_bio", "cell division cycles in biological tissue — mitosis, differentiation"),
    ("D4_near_price", "the market price of consumer compute hardware — GPU MSRPs, RAM spot prices"),
]
QUESTIONS = {}
for ax, concept in AXES:
    QUESTIONS[ax] = {"type": "noul",
        "instructions": f"Record: does it substantively concern {concept}? Judge whether the record is about this concern.",
        "criteria": {"true": "The record is substantively about this concern", "false": "The record is not substantively about this concern"}}
for dx, concept in DECOYS:
    QUESTIONS[dx] = {"type": "noul",
        "instructions": f"Record: does it substantively concern {concept}? Judge whether the record is about this concern.",
        "criteria": {"true": "The record is substantively about this concern", "false": "The record is not substantively about this concern"}}

corpus = json.loads((HERE.parent / "embedding_r23" / "corpus.json").read_text())
rec = [r for r in corpus["records"] if r["id"] == "N1"][0]
state = "RECORD " + rec["id"] + " (from the qthe kernel's sealed experiment record):\n\n" + rec["text"]

payload = {"state": state, "model": MODEL, "questions": QUESTIONS}
req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), headers={
    "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
t0 = time.time()
with urllib.request.urlopen(req, timeout=180) as r:
    body = json.load(r)
dt = int((time.time() - t0) * 1000)

served = body.get("model")
p1 = body.get("answers", {}).get("P1_nonlocal", {})
p1_val = p1.get("noul") if isinstance(p1, dict) else None
SEALED = {"r24": None, "r25": None, "r26": None, "r28": 0.96}  # r28 close canary read 0.96; band law 0.10

row = {"round": "r30", "task": "flip-watch-canary", "record_id": "N1", "axis": "P1_nonlocal",
       "model_served": served, "p1_noul": p1_val, "elapsed_ms": dt,
       "sealed_r28_close": 0.96, "band": 0.10,
       "within_band": (p1_val is not None and abs(p1_val - 0.98) <= 0.10),
       "flip_detected": (served != "jev-1.13.0"),
       "sealed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
(HERE / "canary_r30.json").write_text(json.dumps(row, indent=2))
print(json.dumps(row, indent=2))
print()
if served != "jev-1.13.0":
    print("[CANARY] >>> FLIP DETECTED: model_served =", served, "— the once-in-a-version drift reading FIRES")
    sys.exit(2)
print("[CANARY] no flip: still", served, "— P1", p1_val, "vs sealed 0.98 (band 0.10)")
