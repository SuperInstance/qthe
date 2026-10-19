#!/usr/bin/env python3
# situations/embedding_r28/eq37_phrasing.py — E-Q37 lane T19-c: THE
# PHRASING-SENSITIVITY CURVE. Four treatments x the frozen 8-record subset,
# question-side transforms only (record texts byte-identical):
# T0 anchor (byte-identical standard map) / T1 synonym-swap / T2 syntactic-
# reorder / T3 role-reframe. The 4 decoys ride byte-identical in every call.
import hashlib, json, os, pathlib, time, urllib.error, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
R25 = HERE.parent / "tripwire_r25"
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
ROUND = "r28"

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

# T0 must be byte-identical to the E-Q25 sealed map (asserted below vs tripwire rows)
def q_standard(concept):
    return {"type": "noul",
            "instructions": f"Record: does it substantively concern {concept}? Judge whether the record is about this concern.",
            "criteria": {"true": "The record is substantively about this concern", "false": "The record is not about this concern"}}

def q_t1(concept):
    # synonym-swap: 'substantively concern'->'meaningfully engage'; 'Judge whether'->'Assess whether'; 'about this concern'->'on this matter'
    return {"type": "noul",
            "instructions": f"Record: does it meaningfully engage {concept}? Assess whether the record is on this matter.",
            "criteria": {"true": "The record is meaningfully on this matter", "false": "The record is not meaningfully on this matter"}}

def q_t2(concept):
    # syntactic-reorder: the same words, clause order flipped
    return {"type": "noul",
            "instructions": f"Is the record about this concern? The record: does it substantively concern {concept}. Judge whether.",
            "criteria": {"true": "The record is substantively about this concern", "false": "The record is not about this concern"}}

def q_t3(concept):
    # role-reframe: auditor framing, same semantics
    return {"type": "noul",
            "instructions": f"You are auditing a sealed experiment record. Determine whether it substantively concerns {concept}.",
            "criteria": {"true": "The record is substantively about this concern", "false": "The record is not about this concern"}}

TREATMENTS = {"T0": q_standard, "T1": q_t1, "T2": q_t2, "T3": q_t3}

def build_questions(treatment):
    f = TREATMENTS[treatment]
    questions = {}
    for ax, concept in AXES:
        questions[ax] = f(concept)
    for dx, concept in DECOYS:  # decoys ride byte-identical in EVERY call
        questions[dx] = q_standard(concept)
    return questions

QMAPS = {t: build_questions(t) for t in TREATMENTS}
T0_SHA = hashlib.sha256(json.dumps(QMAPS["T0"], sort_keys=True).encode()).hexdigest()

# F-floor: T0 must equal the sealed E-Q25 map sha
sealed_qmap = set()
for line in (R25 / "tripwire_rows_r25.jsonl").read_text().splitlines():
    if line.strip():
        r = json.loads(line)
        if not (r["call_id"].endswith("-stab") or r["call_id"].endswith("-poison")):
            sealed_qmap.add(r["question_map_sha256"])
assert len(sealed_qmap) == 1 and sealed_qmap.pop() == T0_SHA, "F1 BREACH: T0 differs from the sealed E-Q25 map"

corpus = json.loads((HERE / "corpus_at_scale.json").read_text())
records = {r["id"]: r for r in corpus["records"]}
SUBSET = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]

rows_path = HERE / "eq37_rows_r28.jsonl"
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

def embed(rid, treatment):
    call_id = f"{ROUND}-eq37-{treatment}-{rid}"
    if call_id in sealed_ids:
        print(f"  {call_id}: sealed, resuming")
        return None
    questions = QMAPS[treatment]
    state = "RECORD " + rid + " (from the qthe kernel's sealed experiment record):\n\n" + records[rid]["text"]
    payload = {"state": state, "model": MODEL, "questions": questions}
    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), headers={
        "Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            body = json.load(r)
        status = 200
    except urllib.error.HTTPError as e:
        status, body = e.code, {"error": str(e)}
    dt = int((time.time() - t0) * 1000)
    row = {"round": ROUND, "call_id": call_id, "task": "eq37-phrasing-" + treatment, "record_id": rid,
           "model_served": body.get("model"), "question_map_sha256": sha(json.dumps(questions, sort_keys=True)),
           "state_sha256": sha(state), "sealed_at": now(), "http_status": status, "elapsed_ms": dt,
           "answers_raw": body.get("answers")}
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    print(f"  {call_id}: {dt}ms http={status} model={body.get('model')}")
    return row

def main():
    for t in ("T0", "T1", "T2", "T3"):
        print(f"[eq37] treatment {t}")
        for rid in SUBSET:
            embed(rid, t)
    print("[eq37] 32 calls complete")

if __name__ == "__main__":
    main()
