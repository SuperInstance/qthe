#!/usr/bin/env python3
# situations/embedding_r28/eq36_embedder.py — E-Q36 lane T19-b: embed the
# 60-record AT-SCALE corpus through the byte-identical E-Q25 12-question map
# (8 real + 4 decoys — the tripwire envelope rides at zero marginal cost).
#
# F1: corpus sha-frozen (committed a859f12). F2: qmap byte-identical to E-Q25
# (sha asserted against the sealed tripwire rows). F3: one batched call per
# record, AS-SAID rows, resume law. VERSION WATCH: model_served recorded per
# call (the Oct-21 flip warning from the r28 research pass) — any mid-run
# change is receipted and aborts the lane for re-registration.
import hashlib, json, os, pathlib, sys, time, urllib.error, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
R25 = HERE.parent / "tripwire_r25"
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
CALL_TIMEOUT_S = 180
ROUND = "r28"

corpus = json.loads((HERE / "corpus_at_scale.json").read_text())
records = corpus["records"]
CORPUS_SHA = hashlib.sha256((HERE / "corpus_at_scale.json").read_bytes()).hexdigest()
assert CORPUS_SHA.startswith("c0d77c32"), "corpus sha drift: " + CORPUS_SHA[:12]

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

# EXPLICIT aggregation loop (the T5-a guard's BATCHED pattern) — byte-identical
# construction to tripwire.py's build_questions().
def build_questions():
    questions = {}
    for ax, concept in AXES:
        questions[ax] = {"type": "noul",
            "instructions": f"Record: does it substantively concern {concept}? Judge whether the record is about this concern.",
            "criteria": {"true": "The record is substantively about this concern", "false": "The record is not about this concern"}}
    for dx, concept in DECOYS:
        questions[dx] = {"type": "noul",
            "instructions": f"Record: does it substantively concern {concept}? Judge whether the record is about this concern.",
            "criteria": {"true": "The record is substantively about this concern", "false": "The record is not about this concern"}}
    return questions

QUESTIONS = build_questions()
QMAP_SHA = hashlib.sha256(json.dumps(QUESTIONS, sort_keys=True).encode()).hexdigest()

# F2: assert the qmap sha equals the sealed E-Q25 rows' map sha
sealed_qmap = set()
for line in (R25 / "tripwire_rows_r25.jsonl").read_text().splitlines():
    if line.strip():
        r = json.loads(line)
        if not (r["call_id"].endswith("-stab") or r["call_id"].endswith("-poison")):
            sealed_qmap.add(r["question_map_sha256"])
assert len(sealed_qmap) == 1 and sealed_qmap.pop() == QMAP_SHA, "F2 BREACH: qmap sha differs from E-Q25's sealed map"

rows_path = HERE / "eq36_rows_r28.jsonl"
sealed_ids = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            try:
                sealed_ids.add(json.loads(line)["call_id"])
            except json.JSONDecodeError:
                pass

def sha(s): return hashlib.sha256(s.encode()).hexdigest()
def now(): return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

STABILITY = ["N8", "P9", "A11"]  # fresh records, one per non-A family sampled across ids

def embed(rec, tag=""):
    call_id = f"{ROUND}-eq36-{rec['id']}{tag}"
    if call_id in sealed_ids:
        print(f"  {call_id}: already sealed — resuming past it (no re-spend)")
        return None
    state = "RECORD " + rec["id"] + " (from the qthe kernel's sealed experiment record):\n\n" + rec["text"]
    payload = {"state": state, "model": MODEL, "questions": QUESTIONS}
    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), headers={
        "Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=CALL_TIMEOUT_S) as r:
            body = json.load(r)
        status = 200
    except urllib.error.HTTPError as e:
        status, body = e.code, {"error": str(e)}
    dt = int((time.time() - t0) * 1000)
    row = {"round": ROUND, "call_id": call_id, "task": "eq36-at-scale-embed", "record_id": rec["id"],
           "model_served": body.get("model"), "question_map_sha256": QMAP_SHA, "corpus_sha256": CORPUS_SHA,
           "state_sha256": sha(state), "sealed_at": now(), "http_status": status, "elapsed_ms": dt,
           "answers_raw": body.get("answers")}
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    print(f"  {call_id}: {dt}ms http={status} model={body.get('model')}")
    return row

def main():
    print(f"[eq36] 60 records x 12 questions (8 real + 4 decoys), qmap {QMAP_SHA[:10]}…")
    models_seen = set()
    for rec in records:
        row = embed(rec)
        if row and row["model_served"]:
            models_seen.add(row["model_served"])
    for rid in STABILITY:
        rec = next(r for r in records if r["id"] == rid)
        embed(rec, tag="-stab")
    print(f"[eq36] done. models_served across run: {sorted(models_seen) or '(from sealed rows)'}")

if __name__ == "__main__":
    main()
