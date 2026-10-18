#!/usr/bin/env python3
# situations/embedding_r26/drift_monitor.py — E-Q31 lane T17-d: the standing
# drift monitor's r26 re-read. 20 fresh embeds of the sealed corpus through
# the byte-identical E-Q22 noul map (qmap sha verified at runtime), compared
# against the sealed r24 vectors AND the r25 reading (three-point series).
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
R24 = ROOT / "situations" / "embedding_r24"
R25 = ROOT / "situations" / "tripwire_r25"

ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
CALL_TIMEOUT_S = 180
ROUND = "r26"

corpus = json.loads((R23 / "corpus.json").read_text())
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

# F1: the qmap must be byte-identical to E-Q22's (sha match against the sealed rows)
eq22_rows = [json.loads(l) for l in (R24 / "noul_embed_rows_r24.jsonl").read_text().splitlines() if l.strip()]
sealed_qmap = {r["question_map_sha256"] for r in eq22_rows if not r["call_id"].endswith("-stab")}
assert len(sealed_qmap) == 1 and sealed_qmap.pop() == QMAP_SHA, "F1 BREACH: qmap sha differs from E-Q22's sealed map"

# the sealed r24 vectors
EQ22 = json.loads((R24 / "eval_eq22_results.json").read_text())
N_r24 = EQ22["vectors"]["N"]

# F3: the r25 comparison vectors re-derived from the sealed E-Q25 rows
REAL_AXES = [ax for ax, _ in AXES]
N_r25 = {}
for line in (R25 / "tripwire_rows_r25.jsonl").read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    if r["call_id"].endswith("-stab") or r["call_id"].endswith("-poison"):
        continue
    ans = r.get("answers_raw") or {}
    vec = []
    ok = True
    for ax in REAL_AXES:
        p = (ans.get(ax) or {}).get("noul")
        if p is None:
            ok = False
            break
        vec.append(max(0.0, min(1.0, float(p))))
    if ok:
        N_r25[r["record_id"]] = vec
assert len(N_r25) == 20, f"F3 BREACH: r25 comparison vectors incomplete ({len(N_r25)})"

rows_path = HERE / "drift_rows_r26.jsonl"
sealed_ids = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            try:
                sealed_ids.add(json.loads(line)["call_id"])
            except json.JSONDecodeError:
                pass

def api_key() -> str:
    k = os.environ.get("TYPESAFE_API_KEY")
    if not k:
        raise SystemExit("TYPESAFE_API_KEY not set (env-only key doctrine)")
    return k

def embed(rec, tag=""):
    call_id = f"{ROUND}-drift-{rec['id']}{tag}"
    if call_id in sealed_ids:
        return None
    payload = {
        "state": "RECORD " + rec["id"] + " (from the qthe kernel's sealed experiment record):\n\n" + rec["text"],
        "model": MODEL,
        "questions": QUESTIONS,
    }
    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode())
    req.add_header("Authorization", f"Bearer {api_key()}")
    req.add_header("Content-Type", "application/json")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=CALL_TIMEOUT_S) as r:
            status, body = r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        status, body = e.code, {"error": str(e)}
    elapsed = int((time.time() - t0) * 1000)
    row = {
        "round": ROUND, "call_id": call_id, "seat": "typesafe/jev-latest",
        "task": "drift-monitor-reembed", "record_id": rec["id"], "family": rec["family"],
        "model_served": body.get("model"), "question_map_sha256": QMAP_SHA,
        "state_sha256": sha(payload["state"]), "sealed_at": now(),
        "http_status": status, "elapsed_ms": elapsed,
        "answers_raw": body.get("answers"), "usage": body.get("usage"),
    }
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    if status != 200:
        print(f"  {call_id}: HTTP {status}")
        return None
    ans = body.get("answers", {})
    vec = []
    for ax, _ in AXES:
        p = (ans.get(ax) or {}).get("noul")
        vec.append(max(0.0, min(1.0, float(p))) if p is not None else None)
    return vec

def main():
    print(f"[drift] qmap sha {QMAP_SHA[:12]}… (F1 verified vs E-Q22)")
    sealed_served = {r.get("model_served") for r in eq22_rows if r.get("model_served")}
    fresh = {}
    for rec in records:
        vec = embed(rec)
        if vec is None:
            # resume path: read from sealed rows
            for line in rows_path.read_text().splitlines():
                if line.strip():
                    r = json.loads(line)
                    if r["call_id"] == f"{ROUND}-drift-{rec['id']}":
                        ans = r.get("answers_raw") or {}
                        vec = [max(0.0, min(1.0, float((ans.get(ax) or {}).get("noul")))) for ax, _ in AXES]
        fresh[rec["id"]] = vec
    # model_served receipt from rows
    served = set()
    for line in rows_path.read_text().splitlines():
        if line.strip():
            served.add(json.loads(line).get("model_served"))
    served = {s for s in served if s}
    print(f"[drift] model_served: {served} (r24 sealed served: {sealed_served})")

    d24, d25 = [], []
    per_axis_24 = [0.0] * 8
    per_record_max_24 = {}
    per_record_max_25 = {}
    for rec in records:
        rid = rec["id"]
        rm24, rm25 = 0.0, 0.0
        for i in range(8):
            dd24 = abs(fresh[rid][i] - N_r24[rid][i])
            dd25 = abs(fresh[rid][i] - N_r25[rid][i])
            d24.append(dd24)
            d25.append(dd25)
            per_axis_24[i] += dd24
            rm24 = max(rm24, dd24)
            rm25 = max(rm25, dd25)
        per_record_max_24[rid] = rm24
        per_record_max_25[rid] = rm25
    per_axis_24 = [x / 20 for x in per_axis_24]

    r25_max = 0.06  # the sealed E-Q25 reading's max (the receipt of record)
    # the registered semantics: the band is per-RECORD (each record's max axis
    # delta within 0.10) — the E-Q25 receipt convention
    H1 = all(v <= 0.10 for v in per_record_max_24.values())
    H2 = max(per_record_max_24.values()) <= r25_max + 0.02  # raw-float comparison, no silent stretching
    C27 = H1
    P1 = H1 and 0.03 <= max(per_record_max_24.values()) <= 0.08
    P2 = served == sealed_served  # no version flip vs the r24 sealed serving
    P3 = per_axis_24[1] >= per_axis_24[3]  # P2_localrule mover >= P4_alloc calm (the E-Q23 structure)
    P4 = (sum(d25) / len(d25)) <= (sum(d24) / len(d24))  # r26 closer to r25 than to r24
    h2_artifact = (not H2) and (max(per_record_max_24.values()) - (r25_max + 0.02)) < 1e-9

    out = {
        "experiment": "E-Q31",
        "model_served": sorted(served),
        "model_served_r24_sealed": sorted(sealed_served),
        "drift_vs_r24": {"max": max(per_record_max_24.values()), "mean_axis": sum(d24) / len(d24),
                         "within_010": sum(1 for v in per_record_max_24.values() if v <= 0.10),
                         "per_record_max": {k: round(v, 4) for k, v in sorted(per_record_max_24.items())}},
        "drift_vs_r25": {"max": max(per_record_max_25.values()), "mean_axis": sum(d25) / len(d25),
                         "within_010": sum(1 for v in per_record_max_25.values() if v <= 0.10)},
        "per_axis_mean_vs_r24": {AXES[i][0]: round(per_axis_24[i], 4) for i in range(8)},
        "r25_reference_max": r25_max,
        "hypotheses": {"H1_band_holds": H1, "H2_no_trend": H2, "C27": C27,
                       "H2_float_artifact_receipt": h2_artifact},
        "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4},
    }
    (HERE / "eq31_results.json").write_text(json.dumps(out, indent=1))
    print(f"[drift] vs r24: per-record max {max(per_record_max_24.values()):.4f} mean-axis {sum(d24)/len(d24):.4f} within-0.10 {sum(1 for v in per_record_max_24.values() if v<=0.10)}/20")
    print(f"[drift] vs r25: per-record max {max(per_record_max_25.values()):.4f} mean-axis {sum(d25)/len(d25):.4f}")
    print(f"[drift] H1={H1} H2={H2} C27={C27} | per-axis {[round(x,3) for x in per_axis_24]}")

if __name__ == "__main__":
    main()
