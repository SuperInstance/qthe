#!/usr/bin/env python3
# situations/embedding_r28/eq35_conditional.py — E-Q35 lane T19-a: DEPTH-2
# CONDITIONAL AXES (the r24 ideas battery I-3). Stage-2 questions EMBED the
# sealed stage-1 (E-Q22) measured profile: arm C names axes AND values, arm N
# names axes only. Six relation questions per record per arm.
#
# AM1 (implementation-time, BEFORE any dependent analysis): the registration's
# design_frozen reads "3 records re-embedded once per arm" while the budget line
# reads "8 + 8 + 3". Interpretation adopted: 3 stability records PER ARM
# (6 stab calls, total 22) — the safer superset; the extra 3 calls cost ~$0.001
# and breach no floor (F5 is a band, not a cap).
import hashlib, json, os, pathlib, statistics, time, urllib.error, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
R24 = HERE.parent / "embedding_r24"
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
CONCEPT = dict(AXES)
AXNAMES = [a for a, _ in AXES]

corpus = json.loads((HERE / "corpus_at_scale.json").read_text())
records = {r["id"]: r for r in corpus["records"]}
SUBSET = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}

# the sealed stage-1 profiles (E-Q22 noul vectors — F2: values cited from the sealed file only)
EQ22 = json.loads((R24 / "eval_eq22_results.json").read_text())
N_SEALED = EQ22["vectors"]["N"]

def profile(rid):
    v = N_SEALED[rid]
    ranked = sorted(AXNAMES, key=lambda a: -v[AXNAMES.index(a)])
    top, second, bottom = ranked[0], ranked[1], ranked[-1]
    boundary = min(AXNAMES, key=lambda a: abs(v[AXNAMES.index(a)] - 0.5))
    dom = abs(v[AXNAMES.index(top)] - v[AXNAMES.index(second)])
    return {"top": top, "second": second, "bottom": bottom, "boundary": boundary,
            "v": {a: v[AXNAMES.index(a)] for a in AXNAMES}, "dominance": dom}

PROFILES = {rid: profile(rid) for rid in SUBSET}

# the six relation templates (F1: frozen byte-identical construction)
def relation_questions(rid, arm):
    p = PROFILES[rid]
    top_c, second_c, bottom_c, bound_c = (CONCEPT[p["top"]], CONCEPT[p["second"]],
                                          CONCEPT[p["bottom"]], CONCEPT[p["boundary"]])
    def pre(x, y):
        if arm == "C":
            return (f"Stage-1 measured {CONCEPT[x]} at {p['v'][x]:.2f} and {CONCEPT[y]} at {p['v'][y]:.2f}. ")
        return f"Stage-1 identified {CONCEPT[x]} and {CONCEPT[y]} as this record's leading concerns. "
    qs = {}
    qs["R1_subordination"] = (pre(p["top"], p["second"]),
        f"Does the record's {top_c} subordinate its {second_c} — does the second only execute what the top delivers?")
    qs["R2_independence"] = (pre(p["top"], p["bottom"]),
        f"Does the record's {top_c} operate independently of its {bottom_c}?")
    qs["R3_provenance"] = (pre(p["top"], p["second"]),
        f"Is the record's {top_c} carried by its explicit mechanism rather than its framing?")
    qs["R4_boundary"] = (pre(p["boundary"], p["top"]),
        f"Is the record's {bound_c} genuinely ambiguous, or settled?")
    qs["R5_polarity"] = (pre(p["top"], p["second"]),
        f"Is the record's {top_c} load-bearing (removing it breaks the record) or incidental?")
    qs["R6_family_edge"] = (pre(p["top"], p["second"]),
        "Does the record sit at the boundary of its family label or deep inside it?")
    out = {}
    for k, (preamble, q) in qs.items():
        out[k] = {"type": "noul",
                  "instructions": preamble + q,
                  "criteria": {"true": "Yes — the relation holds for this record",
                               "false": "No — the relation does not hold for this record"}}
    return out

rows_path = HERE / "eq35_rows_r28.jsonl"
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

def embed(rid, arm, tag=""):
    call_id = f"{ROUND}-eq35-{arm}-{rid}{tag}"
    if call_id in sealed_ids:
        print(f"  {call_id}: sealed, resuming")
        return None
    questions = relation_questions(rid, arm)
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
    row = {"round": ROUND, "call_id": call_id, "task": "eq35-depth2-" + arm, "record_id": rid,
           "model_served": body.get("model"), "question_map_sha256": sha(json.dumps(questions, sort_keys=True)),
           "state_sha256": sha(state), "sealed_at": now(), "http_status": status, "elapsed_ms": dt,
           "answers_raw": body.get("answers")}
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    print(f"  {call_id}: {dt}ms http={status} model={body.get('model')}")
    return row

def main():
    print("[eq35] arm C (values) + arm N (names only), 6 relation questions each")
    for rid in SUBSET:
        embed(rid, "C")
    for rid in SUBSET:
        embed(rid, "N")
    for rid in ["N1", "P3", "Q1"]:
        embed(rid, "C", "-stab")
        embed(rid, "N", "-stab")
    print("[eq35] embeds complete")

if __name__ == "__main__":
    main()
