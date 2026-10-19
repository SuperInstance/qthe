#!/usr/bin/env python3
# situations/embedding_r30/eq41_transfer.py — E-Q41 lane T21-b: THE
# CROSS-CORPUS TRANSFER. Do the E-Q27 quantization laws (the ternary zero
# is worth records; the 4-level noul is the best 16-bit practical code)
# hold at 60 records on the eq36N substrate's OWN sealed vectors?
# ZERO typesafe calls: quantize the sealed rows, upsert three new arms,
# poll-until-visible, strict NO-NEIGHBOR arm-filtered live scoring, plus a
# fresh dense re-read of eq36N as the same-session reference (F4: must
# replicate the sealed E-Q36 full-8 live reading within one record).
import hashlib, json, os, pathlib, statistics, subprocess, sys, time, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R28 = ROOT / "situations" / "embedding_r28"
CF = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]

# F1: the sealed 60-record substrate, -stab rows excluded, sha asserted
corpus_sha = hashlib.sha256((R28 / "corpus_at_scale.json").read_bytes()).hexdigest()
assert corpus_sha.startswith("c0d77c32"), "corpus sha drift: " + corpus_sha[:12]
rows = [json.loads(l) for l in (R28 / "eq36_rows_r28.jsonl").read_text().splitlines() if l.strip()]
base = {r["record_id"]: r for r in rows if not r["call_id"].endswith("-stab")}
assert len(base) == 60, f"expected 60 sealed base rows, got {len(base)}"
models_served = sorted({r["model_served"] for r in rows})
assert models_served == ["jev-1.13.0"], models_served

corpus = json.loads((R28 / "corpus_at_scale.json").read_text())
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}
IDS = [r["id"] for r in corpus["records"]]
assert set(IDS) == set(base)

V = {}
for rid in IDS:
    ans = base[rid].get("answers_raw") or {}
    V[rid] = [max(0.0, min(1.0, float((ans.get(ax) or {}).get("noul")))) for ax in AXES]

# ── the E-Q27 quantization recipe, rule-identical, n=60 percentile indices ──
def med(xs):
    s = sorted(xs)
    return (s[29] + s[30]) / 2.0  # n=60: the two middle order statistics

def quant_table(vectors):
    table = []
    for i in range(8):
        xs = [vectors[rid][i] for rid in IDS]
        m = med(xs)
        mad = med([abs(x - m) for x in xs])
        s = sorted(xs)
        q25 = (s[14] + s[15]) / 2.0
        q75 = (s[44] + s[45]) / 2.0
        table.append({"m": m, "mad": mad, "q25": q25, "q75": q75})
    return table

def quantize(x, t, levels):
    if levels == "binary":
        return 1.0 if x > t["m"] else -1.0
    if levels == "ternary":
        if x > t["m"] + 0.5 * t["mad"]:
            return 1.0
        if x < t["m"] - 0.5 * t["mad"]:
            return -1.0
        return 0.0
    if x <= t["q25"]:
        return -1.5
    if x <= t["m"]:
        return -0.5
    if x <= t["q75"]:
        return 0.5
    return 1.5

TABLE = quant_table(V)
ARMS = {}
for levels in ("binary", "ternary", "quad"):
    ARMS[levels] = {rid: [quantize(V[rid][i], TABLE[i], levels) for i in range(8)] for rid in IDS}

zero_mass = sum(1 for rid in IDS for v in ARMS["ternary"][rid] if v == 0.0) / (60 * 8)
print(f"[eq41] ternary zero-level mass: {zero_mass:.4f} (n=20 read 0.2375)")

# ── upsert the three arms ────────────────────────────────────────────────────
def pad32(vals):
    v = [round(x, 6) for x in vals]
    return v + [0.0] * (32 - len(v))

ndjson = HERE / "upsert_eq41.ndjson"
with ndjson.open("w") as f:
    for levels, arm in (("binary", "eq41B60"), ("ternary", "eq41T60"), ("quad", "eq41Q60")):
        for rid in IDS:
            f.write(json.dumps({"id": f"{arm}:{rid}", "values": pad32(ARMS[levels][rid]),
                                "metadata": {"family": FAMILY[rid], "arm": arm}}) + "\n")
env = {"PATH": os.environ["PATH"], "CLOUDFLARE_API_TOKEN": os.environ["CLOUDFLARE_TOKEN"],
       "CLOUDFLARE_ACCOUNT_ID": "049ff5e84ecf636b53b162cbb580aae6"}
up = subprocess.run(["npx", "wrangler", "vectorize", "upsert", "qthe-jev-embed", "--file", str(ndjson)],
                    cwd=str(ROOT / "cloudflare"), env=env, capture_output=True, text=True, timeout=600)
print("[upsert]", (up.stdout + up.stderr).strip().splitlines()[-1] if (up.stdout + up.stderr).strip() else up.returncode)
if up.returncode != 0:
    sys.exit(4)

def query_topk(vec, arm, k=60):
    body = json.dumps({"vector": pad32(vec), "topK": k, "filter": {"arm": arm}}).encode()
    req = urllib.request.Request(CF, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

# F3: poll-until-visible for all three new arms (the async-changeset law)
for arm in ("eq41B60", "eq41T60", "eq41Q60"):
    visible = 0
    for _ in range(60):  # up to 300s
        try:
            visible = len(query_topk([1.0] * 8, arm))
        except Exception:
            visible = 0
        if visible >= 60:
            break
        time.sleep(5)
    print(f"[poll] {arm}: {visible}/60 visible")
    assert visible >= 60, f"poll-until-visible FAILED for {arm}"

# ── scoring: strict NO-NEIGHBOR, live per arm + local for the local==live law ─
def cos(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    return dot / (na * nb) if na and nb else 0.0

def live_strict(arm, vec_of):
    hits = 0
    misses = []
    for rid in IDS:
        m = query_topk(vec_of(rid), arm)
        others = [(r2, s) for r2, s in m if r2 != rid]
        if not others:
            misses.append((rid, "NO-NEIGHBOR"))
            continue
        if FAMILY[others[0][0]] == FAMILY[rid]:
            hits += 1
        else:
            misses.append((rid, others[0][0]))
    return hits / 60.0, misses

def local_strict(vec_of):
    hits = 0
    misses = []
    for rid in IDS:
        q = vec_of(rid)
        best, best_s = None, -2.0
        for rid2 in IDS:
            if rid2 == rid:
                continue
            s = cos(q, vec_of(rid2))
            if s > best_s:
                best_s, best = s, rid2
        if FAMILY[best] == FAMILY[rid]:
            hits += 1
        else:
            misses.append((rid, best))
    return hits / 60.0, misses

results = {}
for levels, arm in (("binary", "eq41B60"), ("ternary", "eq41T60"), ("quad", "eq41Q60")):
    acc_l, miss_l = live_strict(arm, lambda rid, L=levels: ARMS[L][rid])
    acc_o, miss_o = local_strict(lambda rid, L=levels: ARMS[L][rid])
    agree = acc_l == acc_o
    results[levels] = {"live": acc_l, "local": acc_o, "local_equals_live": agree,
                       "live_misses": miss_l, "local_misses": miss_o}
    print(f"[retrieval] {levels:7s}: live {acc_l:.3f} local {acc_o:.3f} agree={agree} misses={len(miss_l)}")

# F4: the dense same-session reference (fresh re-read of the sealed arm eq36N)
dense_live, dense_miss = live_strict("eq36N", lambda rid: V[rid])
dense_local, _ = local_strict(lambda rid: V[rid])
print(f"[dense] eq36N fresh re-read: live {dense_live:.4f} local {dense_local:.4f} (sealed E-Q36 full-8 live 0.7333)")
replication_delta = abs(dense_live - 44.0 / 60.0)
F4 = replication_delta <= 1.0 / 60.0
print(f"[F4] dense replication |delta| = {replication_delta:.4f} (bound 1/60 = {1.0/60.0:.4f}) -> {'PASS' if F4 else 'FAIL'}")

# ── hypotheses ───────────────────────────────────────────────────────────────
b, t, q = results["binary"]["live"], results["ternary"]["live"], results["quad"]["live"]
H1 = (b < t) and (t < q)
H2 = (t - b) >= 0.10
H3 = (dense_live - q) <= 0.15
C39 = H1 and H3
P1 = 0.15 <= zero_mass <= 0.35
P2 = F4
P3 = min(b, t, q) >= 1.5 * (14.0 / 59.0)
P4 = all(results[l]["local_equals_live"] for l in results)

print(f"\n[EQ41] H1 ladder (b<t<q): {H1} ({b:.3f} / {t:.3f} / {q:.3f})")
print(f"[EQ41] H2 zero's margin >= 0.10: {H2} (t-b = {t-b:.3f})")
print(f"[EQ41] H3 practical bound (dense-quad <= 0.15): {H3} ({dense_live - q:.3f})")
print(f"[EQ41] C39 = H1 AND H3: {C39}")
print(f"[EQ41] P1 zero-mass in [0.15,0.35]: {P1} | P2 dense replication: {P2} | P3 all >= 1.5x majority: {P3} | P4 local==live: {P4}")

out = {
    "experiment": "E-Q41",
    "models_served": models_served,
    "corpus_sha256": corpus_sha,
    "n_records": 60,
    "quant_table": TABLE,
    "arms": {k: {"live": v["live"], "local": v["local"], "local_equals_live": v["local_equals_live"],
                 "live_misses": v["live_misses"]} for k, v in results.items()},
    "dense_reference": {"live": dense_live, "local": dense_local, "sealed_eq36_live": 44.0 / 60.0,
                        "replication_delta": replication_delta, "F4_pass": F4},
    "zero_mass": zero_mass,
    "majority_floor": 14.0 / 59.0,
    "hypotheses": {"H1_ladder": H1, "H2_zeros_worth": H2, "H3_practical_bound": H3, "C39": C39},
    "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4},
    "margins": {"ternary_minus_binary": t - b, "quad_minus_ternary": q - t, "dense_minus_quad": dense_live - q},
    "vectors_quantized": {l: ARMS[l] for l in ARMS},
}
(HERE / "eq41_results.json").write_text(json.dumps(out, indent=1))
print("[eq41] wrote eq41_results.json")
