#!/usr/bin/env python3
# situations/embedding_r26/irt_ladders.py — E-Q34 lane T18-c: IRT strictness
# ladders (the r24 ideas battery I-6). 8 axes x 5 strictness rungs = one
# 40-question batched call per record over the frozen 8-record subset.
# Assumption-light discrimination: monotonicity, threshold location,
# family separation, and the second cross-instrument convergence test.
import hashlib
import json
import math
import os
import pathlib
import time
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
R24 = ROOT / "situations" / "embedding_r24"

TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone"
SUBSET8 = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]  # the frozen E-Q23 subset
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]
CONCEPTS = {
    "P1_nonlocal": "NON-LOCAL coupling — distant cells, wormholes, twin resonance, remote slot reads and writes",
    "P2_localrule": "the LOCAL update rule's physics — neighborhood coupling, timbre states, thresholds, cascades, saturation",
    "P3_quantum": "QUANTUM construction or randomness provenance — certified entropy, Bell witnesses, quantum blur, interference",
    "P4_alloc": "ALLOCATION or ARBITRATION — task routing, queues, starvation, priorities, arbitration among consumers",
    "P5_repair": "REPAIR, healing, self-maintenance, or recovery from damage",
    "P6_null": "a REFUTED or failed hypothesis — an honest null, a DIES verdict, a falsified claim",
    "P7_econ": "COST, price, performance, or economics — token budgets, pricing tiers, speed and spend",
    "P8_exact": "EXACTNESS or determinism — byte-identity, replay, verification, reproducibility",
}
HOME_FAMILY = {"P1_nonlocal": "N", "P2_localrule": "P", "P3_quantum": "Q", "P4_alloc": "A",
               "P5_repair": None, "P6_null": None, "P7_econ": "A", "P8_exact": "P"}
# (family-defining axes per E-Q21: N=P1, P=P2, Q=P3, A=P7; P4_alloc arbitrates
#  within A; the honest receipt: P4's home family is contested — the E-Q29
#  complementarity finding — so it is treated as family-defining for A only in
#  the secondary table; the primary separation table uses the four clean axes.)

RUNGS = [
    ("R1", "{X} appears in this record at all, even in passing"),
    ("R2", "the record substantively concerns {X}"),  # the map's anchor phrasing
    ("R3", "{X} is a central concern of the record"),
    ("R4", "{X} is among the record's two most dominant concerns"),
    ("R5", "{X} is THE single dominant concern of the record"),
]

def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

# F1: the frozen 40-question battery (deterministic construction).
# AM1 (pre_registration_amendment_e_q34_1.json): the anchor rung R2 is
# BYTE-IDENTICAL to the sealed E-Q22 question (the phrasing law: a
# semantically-identical rewording moved mass up to 0.18 = 2x the band);
# R1/R3/R4/R5 keep the fixed declarative strictness template.
def build_questions():
    qs = {}
    for ax in AXES:
        for rung, template in RUNGS:
            if rung == "R2":
                qs[f"{ax}__{rung}"] = {
                    "type": "noul",
                    "instructions": (
                        f"Record: does it substantively concern {CONCEPTS[ax]}? "
                        "Judge whether the record is about this concern."
                    ),
                    "criteria": {
                        "true": "The record is substantively about this concern",
                        "false": "The record is not about this concern",
                    },
                }
            else:
                qs[f"{ax}__{rung}"] = {
                    "type": "noul",
                    "instructions": (
                        f"Record: {template.format(X=CONCEPTS[ax])}. "
                        "Judge whether this is true of the record."
                    ),
                    "criteria": {
                        "true": "This is true of the record",
                        "false": "This is not true of the record",
                    },
                }
    return qs

QMAP = build_questions()
QMAP_SHA = sha(json.dumps(QMAP, sort_keys=True))

corpus = json.loads((R23 / "corpus.json").read_text())
records = {r["id"]: r for r in corpus["records"]}
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}
N_SEALED = json.loads((R24 / "eval_eq22_results.json").read_text())["vectors"]["N"]

rows_path = HERE / "irt_rows_r27.jsonl"
phrasing_rows_path = HERE / "irt_phrasing_receipt_r27.jsonl"
sealed_ids = set()
if rows_path.exists():
    # AM1: the first run (declarative anchor) becomes the phrasing receipt;
    # the amended run uses fresh call ids r27-eq34b-*
    if phrasing_rows_path.exists():
        phrasing_rows_path.unlink()
    phrasing_rows_path.write_text(rows_path.read_text())
    rows_path.unlink()
    # recompute the phrasing receipt stats for the results file
    _phr = [json.loads(l) for l in phrasing_rows_path.read_text().splitlines() if l.strip()]
    _AXES = AXES
    _N = N_SEALED
    _deltas = []
    for r in _phr:
        ans = r["answers_raw"]
        rid = r["record_id"]
        for i, ax in enumerate(_AXES):
            p = float((ans.get(f"{ax}__R2") or {}).get("noul"))
            _deltas.append(abs(p - _N[rid][i]))
    PHRASING_RECEIPT = {"calls": len(_phr), "max_delta": max(_deltas),
                        "mean_delta": sum(_deltas) / len(_deltas),
                        "over_005": sum(1 for d in _deltas if d > 0.05)}
    print(f"[eq34][AM1] phrasing receipt: max {PHRASING_RECEIPT['max_delta']:.3f}, mean {PHRASING_RECEIPT['mean_delta']:.3f}, n>0.05: {PHRASING_RECEIPT['over_005']}/64 (retained in irt_phrasing_receipt_r27.jsonl)")
for line in []:
    pass
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            try:
                sealed_ids.add(json.loads(line)["call_id"])
            except json.JSONDecodeError:
                pass

def embed(rid, call_id):
    if call_id in sealed_ids:
        return None
    rec = records[rid]
    payload = {"state": "RECORD " + rid + " (from the qthe kernel's sealed experiment record):\n\n" + rec["text"],
               "model": "jev-latest", "questions": QMAP}
    req = urllib.request.Request(TYPESAFE_URL, data=json.dumps(payload).encode())
    req.add_header("Authorization", "Bearer " + os.environ["TYPESAFE_API_KEY"])
    req.add_header("Content-Type", "application/json")
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=180) as r:
        body = json.loads(r.read().decode())
    dt = int((time.time() - t0) * 1000)
    ans = body.get("answers") or {}
    row = {"round": "r27", "call_id": call_id, "kind": "embed", "model": "jev-latest",
           "model_served": body.get("model"), "elapsed_ms": dt, "record_id": rid,
           "family": FAMILY[rid], "qmap_sha": QMAP_SHA, "answers_raw": ans,
           "usage": body.get("usage"), "sealed_at": now()}
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    return ans

# run (or resume from) the 8 calls
P = {}  # P[rid][ax][rung] = p
for rid in SUBSET8:
    call_id = f"r27-eq34b-embed-{rid}"
    ans = embed(rid, call_id)
    if ans is None:
        for line in rows_path.read_text().splitlines():
            if line.strip():
                r = json.loads(line)
                if r["call_id"] == call_id:
                    ans = r["answers_raw"]
    if not ans or len(ans) != 40:
        raise SystemExit(f"F3 breach: {rid} answers incomplete ({len(ans or {})})")
    P[rid] = {ax: {rung: max(0.0, min(1.0, float((ans.get(f"{ax}__{rung}") or {}).get("noul")))) for rung, _ in RUNGS} for ax in AXES}
    print(f"[eq34] {rid}: embedded 40 questions")

# ── F2: the anchor check (R2 vs the sealed E-Q22 vectors) ──────────────────
anchor_deltas = []
for rid in SUBSET8:
    for i, ax in enumerate(AXES):
        anchor_deltas.append(abs(P[rid][ax]["R2"] - N_SEALED[rid][i]))
anchor_max = max(anchor_deltas)
anchor_ok = anchor_max <= 0.10
print(f"[eq34] ANCHOR (R2 vs sealed E-Q22): max delta {anchor_max:.4f} -> {'OK' if anchor_ok else 'BREACH — lane fails'}")
if not anchor_ok:
    raise SystemExit("F2 breach: the anchor rung does not replicate")

# ── M1: monotonicity (perfect-ladder rate) ─────────────────────────────────
perfect = 0
violations = []
for rid in SUBSET8:
    for ax in AXES:
        ladder = [P[rid][ax][r] for r, _ in RUNGS]
        if all(ladder[i] >= ladder[i + 1] - 1e-9 for i in range(4)):
            perfect += 1
        else:
            violations.append({"rid": rid, "axis": ax, "ladder": [round(x, 3) for x in ladder]})
perfect_rate = perfect / 64
print(f"[eq34] M1 monotonicity: {perfect}/64 = {perfect_rate:.2f} perfect ladders")

# ── M2: threshold location (the 0.5-crossing rung per record-axis) ─────────
thresholds = {}
for ax in AXES:
    thr = []
    for rid in SUBSET8:
        ladder = [P[rid][ax][r] for r, _ in RUNGS]
        cross = None
        for i in range(5):
            if ladder[i] <= 0.5:
                cross = RUNGS[i][0]
                break
        thr.append(cross or "none")
    thresholds[ax] = thr

# ── M3: family separation (per axis, best rung, home vs others) ────────────
separation = {}
for ax in AXES:
    home = HOME_FAMILY[ax]
    if home is None:
        separation[ax] = None
        continue
    best = 0.0
    best_rung = None
    for rung, _ in RUNGS:
        hm = [P[rid][ax][rung] for rid in SUBSET8 if FAMILY[rid] == home]
        om = [P[rid][ax][rung] for rid in SUBSET8 if FAMILY[rid] != home]
        gap = (sum(hm) / len(hm)) - (sum(om) / len(om))
        if gap > best:
            best, best_rung = gap, rung
    separation[ax] = {"gap": round(best, 4), "best_rung": best_rung}

# ── M4: the cross-instrument convergence (separation vs Shapley) ───────────
eq29 = json.loads((HERE / "eq29_results.json").read_text())
SHAPLEY = eq29["shapley"]
def spearman(xs, ys):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and v[order[j + 1]] == v[order[i]]:
                j += 1
            avg = (i + j) / 2.0 + 1.0
            for t in range(i, j + 1):
                r[order[t]] = avg
            i = j + 1
        return r
    rx, ry = ranks(xs), ranks(ys)
    mx, my = sum(rx) / len(rx), sum(ry) / len(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    den = math.sqrt(sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry))
    return num / den if den else 0.0

sep_axes = [ax for ax in AXES if separation[ax] is not None]
xinstr = round(spearman([separation[ax]["gap"] for ax in sep_axes], [SHAPLEY[ax] for ax in sep_axes]), 4)

# hypotheses / claims
H1 = perfect_rate >= 0.70
H2 = sum(1 for ax in sep_axes if (separation[ax] or {}).get("gap", 0) > 0) >= 6
H3 = xinstr > 0.4
C32 = H1 and H2
P1 = 0.70 <= perfect_rate <= 0.90
# P2: home-family records' thresholds sit later than foreign ones
home_later = 0
pairs = 0
for ax in sep_axes:
    home = HOME_FAMILY[ax]
    for rid in SUBSET8:
        cross = thresholds[ax][SUBSET8.index(rid)]
        if cross is None or cross == "none":
            continue
        rung_idx = ["R1", "R2", "R3", "R4", "R5"].index(cross)
        pairs += 1
        if FAMILY[rid] == home:
            home_later += rung_idx >= 2
P2 = pairs > 0 and (home_later / max(1, sum(1 for rid in SUBSET8 for ax in sep_axes if FAMILY[rid] == HOME_FAMILY[ax] and thresholds[ax][SUBSET8.index(rid)] not in (None, "none")))) >= 0.5
P3 = sum(1 for ax in sep_axes if (separation[ax] or {}).get("best_rung") == "R3") >= sum(1 for ax in sep_axes if (separation[ax] or {}).get("best_rung") == "R2")
P4 = 0.3 <= xinstr <= 0.7
P5 = anchor_ok

out = {
    "experiment": "E-Q34",
    "amendment": "AM1 (pre_registration_amendment_e_q34_1.json): the anchor phrasing law — the declarative rewording moved mass up to 0.18 (2x the band); R2 amended to byte-identical E-Q22 text BEFORE dependent analysis; the original 8 calls retained as the phrasing receipt",
    "phrasing_receipt": PHRASING_RECEIPT,
    "anchor": {"max_delta_r2_vs_sealed": anchor_max, "ok": anchor_ok},
    "monotonicity": {"perfect_rate": perfect_rate, "perfect": perfect, "total": 64,
                     "violations": violations[:12]},
    "thresholds": thresholds,
    "separation": separation,
    "cross_instrument_spearman_sep_shapley": xinstr,
    "calls": 8,
    "hypotheses": {"H1_monotone": H1, "H2_separation": H2, "H3_convergence": H3, "C32": C32},
    "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4, "P5": P5},
}
(HERE / "eq34_results.json").write_text(json.dumps(out, indent=1))
print(f"[eq34] M3 separation: " + " ".join(f"{ax.split('_')[0]}:{(separation[ax] or {}).get('gap')}@{(separation[ax] or {}).get('best_rung')}" for ax in sep_axes))
print(f"[eq34] M4 Spearman(separation, Shapley) = {xinstr}")
print(f"[eq34] H1={H1} H2={H2} H3={H3} C32={C32} | P1..P5: {P1} {P2} {P3} {P4} {P5}")
