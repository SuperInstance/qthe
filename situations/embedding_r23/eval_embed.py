#!/usr/bin/env python3
# situations/embedding_r23/eval_embed.py — E-Q21 lane T14-a: the retrieval eval.
# Upserts all three embedders' vectors to Cloudflare Vectorize (qthe-jev-embed),
# queries each record's vector live (topK 20), filters to the same embedder's
# prefix, and scores top-1 non-self family accuracy. Baselines computed in
# code: the majority-class baseline, the permutation null (1000 draws), and a
# bag-of-words cosine control over the SAME record texts. Also: F5 stability
# (the -stab rows), the per-axis divergence profile (C15), pairwise cosine
# histograms (E vals, AS-SAID). Writes e_q21 results + verdict inputs.
#
# Prereq: the Groq rows landed (situations/groq_seats/embed_r23.jsonl).
import json
import math
import pathlib
import random
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
GROQ_ROWS = ROOT / "situations" / "groq_seats" / "embed_r23.jsonl"
TS_ROWS = HERE / "typesafe_embed_rows_r23.jsonl"
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]

corpus = json.loads((HERE / "corpus.json").read_text())
records = corpus["records"]
FAMILY = {r["id"]: r["family"] for r in records}
IDS = [r["id"] for r in records]

def norm_axis(score, k=4.0):
    v = float(score) / k
    return max(0.0, min(1.0, v))

def pad(vec8):
    return [round(v, 6) for v in vec8] + [0.0] * 24  # AM1: 32-dim zero-padded

# ── collect vectors ──────────────────────────────────────────────────────────
vectors = {}  # embedder -> record_id -> [8]
usage_meta = {}

# typesafe: answers_raw[ax].score (0-4 rubric)
for line in TS_ROWS.read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    if r["call_id"].endswith("-stab"):
        continue
    ans = r.get("answers_raw") or {}
    vec = []
    ok = True
    for ax in AXES:
        a = ans.get(ax) or {}
        s = a.get("score")
        if s is None:
            ok = False
            break
        vec.append(norm_axis(s))
    if not ok:
        print(f"WARN: {r['call_id']} missing an axis (F2 breach — will VOID if any)")
        continue
    vectors.setdefault("jev", {})[r["record_id"]] = vec

# groq: content_raw {"scores": {ax: 0-4}}
for line in GROQ_ROWS.read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    seat = r["seat"]
    m = re.search(r'"record_id"?|RECORD ([A-Z]\d)', "")  # placeholder; rid parsed below
    rid = r["call_id"].rsplit("-", 1)[-1]
    c = r.get("content_raw") or ""
    try:
        p = json.loads(c)
    except Exception:
        m2 = re.search(r"\{[\s\S]*\}", c)
        p = json.loads(m2.group(0)) if m2 else None
    if not p or "scores" not in p:
        print(f"WARN: {r['call_id']} unparseable (F2 breach class — row sealed, vector absent)")
        continue
    vec = []
    ok = True
    for ax in AXES:
        s = p["scores"].get(ax)
        if s is None:
            ok = False
            break
        vec.append(norm_axis(s, 4.0))
    if ok:
        vectors.setdefault(seat, {})[rid] = vec
    usage_meta.setdefault(seat, {"usd": 0.0, "n": 0})
    usage_meta[seat]["usd"] += r["usd"]["if_no_cache"]
    usage_meta[seat]["n"] += 1

for seat in ("qwen38-27b", "gpt-oss-20b"):
    if seat not in vectors or len(vectors[seat]) < 20:
        print(f"FAIL-CLOSED: {seat} has {len(vectors.get(seat, {}))}/20 vectors — the Groq artifact has not landed or rows are unparseable")
        sys.exit(3)

# F2: typesafe completeness
if len(vectors.get("jev", {})) != 20:
    print(f"FAIL-CLOSED: jev has {len(vectors.get('jev', {}))}/20 vectors")
    sys.exit(3)

# ── upsert to Vectorize (F4) ─────────────────────────────────────────────────
ndjson = HERE / "upsert.ndjson"
with ndjson.open("w") as f:
    for seat, m in vectors.items():
        for rid, vec in m.items():
            f.write(json.dumps({"id": f"{seat}:{rid}", "values": pad(vec), "metadata": {"family": FAMILY[rid], "embedder": seat}}) + "\n")
env = {
    "PATH": __import__("os").environ["PATH"],
    "CLOUDFLARE_API_TOKEN": __import__("os").environ["CLOUDFLARE_TOKEN"],
    "CLOUDFLARE_ACCOUNT_ID": "049ff5e84ecf636b53b162cbb580aae6",
}
up = subprocess.run(
    ["npx", "wrangler", "vectorize", "upsert", "qthe-jev-embed", "--file", str(ndjson)],
    cwd=str(ROOT / "cloudflare"), env=env, capture_output=True, text=True, timeout=300)
print("[upsert]", (up.stdout + up.stderr).strip().splitlines()[-1] if (up.stdout + up.stderr).strip() else up.returncode)
if up.returncode != 0:
    print(up.stdout[-800:], up.stderr[-800:])
    sys.exit(4)

# ── live queries (F4 round-trip + retrieval) ────────────────────────────────
# r23 receipt: wrangler CLI query's --vector parsing is broken ("got 0
# dimensions" for any input) — queries go through the Vectorize REST API
# directly (the endpoint the CLI error itself revealed).
import urllib.request as _urq

def query_topk(vec, k=20):
    body = json.dumps({"vector": pad(vec), "topK": k}).encode()
    req = _urq.Request(
        "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query",
        data=body, method="POST")
    req.add_header("Authorization", "Bearer " + env["CLOUDFLARE_API_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with _urq.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    if not d.get("success"):
        return None
    return (d.get("result") or {}).get("matches", [])

def accuracy_via_vectorize(seat):
    hits, misses, total = 0, [], 0
    for rid in IDS:
        res = query_topk(vectors[seat][rid])
        if res is None:
            sys.exit(5)
        same_prefix = [m for m in res if str(m.get("id", "")).startswith(seat + ":")]
        others = [m for m in same_prefix if m["id"] != f"{seat}:{rid}"]
        if not others:
            misses.append((rid, "NO-NEIGHBOR"))
            continue
        total += 1
        top = others[0]
        if FAMILY[top["id"].split(":")[1]] == FAMILY[rid]:
            hits += 1
        else:
            misses.append((rid, top["id"].split(":")[1]))
    return hits / total, misses

results = {}
for seat in ["jev", "qwen38-27b", "gpt-oss-20b"]:
    acc, misses = accuracy_via_vectorize(seat)
    results[seat] = {"accuracy": acc, "misses": misses}
    print(f"[retrieval] {seat}: top-1 non-self family accuracy {acc:.2f} ({int(acc*20)}/20); misses: {misses}")

# ── baselines (in code) ─────────────────────────────────────────────────────
def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

def local_accuracy(vecs):
    hits = 0
    for rid in IDS:
        best, bscore = None, -2
        for oid in IDS:
            if oid == rid:
                continue
            c = cos(vecs[rid], vecs[oid])
            if c > bscore:
                bscore, best = c, oid
        if FAMILY[best] == FAMILY[rid]:
            hits += 1
    return hits / 20

# BOW over the same texts (leanest honest baseline: 1-gram, lowercase, no stoplist)
vocab = {}
texts = {r["id"]: r["text"].lower() for r in records}
for t in texts.values():
    for w in re.findall(r"[a-z0-9]+", t):
        vocab[w] = vocab.get(w, 0) + 1
bow = {}
for rid, t in texts.items():
    v = {w: 1 for w in re.findall(r"[a-z0-9]+", t)}
    bow[rid] = [v.get(w, 0) for w in vocab]
bow_acc = local_accuracy(bow)
print(f"[baseline] BOW-cosine top-1 accuracy: {bow_acc:.2f}")

# permutation null on the jev neighbor graph
jev_local = local_accuracy(vectors["jev"])
random.seed(20261019)
perm_accs = []
fam_list = [FAMILY[i] for i in IDS]
for _ in range(1000):
    shuffled = fam_list[:]
    random.shuffle(shuffled)
    pfam = dict(zip(IDS, shuffled))
    hits = 0
    for rid in IDS:
        best, bscore = None, -2
        for oid in IDS:
            if oid != rid:
                c = cos(vectors["jev"][rid], vectors["jev"][oid])
                if c > bscore:
                    bscore, best = c, oid
        if pfam[best] == pfam[rid]:
            hits += 1
    perm_accs.append(hits / 20)
perm_null = sum(perm_accs) / len(perm_accs)
majority = 5 / 20
print(f"[baseline] permutation null: {perm_null:.3f}; majority-class: {majority:.2f}")

# ── F5 stability ─────────────────────────────────────────────────────────────
stab_rows = {}
for line in TS_ROWS.read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    if r["call_id"].endswith("-stab"):
        ans = r.get("answers_raw") or {}
        stab_rows[r["record_id"]] = [norm_axis((ans.get(ax) or {}).get("score", 0)) for ax in AXES]
stab_report = {}
within = total_axes = 0
for rid, vec2 in stab_rows.items():
    if rid in vectors["jev"]:
        deltas = [abs(a - b) for a, b in zip(vectors["jev"][rid], vec2)]
        stab_report[rid] = {"max_delta": max(deltas), "mean_delta": sum(deltas) / 8}
        within += sum(1 for d in deltas if d <= 0.25)
        total_axes += 8
print(f"[F5] stability: {within}/{total_axes} re-embedded axes within 0.25")

# ── C15: per-axis divergence profile ─────────────────────────────────────────
divergence = {}
for seat in ["qwen38-27b", "gpt-oss-20b"]:
    prof = []
    for i, ax in enumerate(AXES):
        ds = [abs(vectors["jev"][rid][i] - vectors[seat][rid][i]) for rid in IDS]
        prof.append({"axis": ax, "mean_abs_delta": sum(ds) / 20, "max": max(ds)})
    divergence[seat] = prof

# pairwise same-family vs cross-family cosine (jev space, E vals AS-SAID)
def pair_hist(seat):
    same, cross = [], []
    for i, a in enumerate(IDS):
        for b in IDS[i + 1:]:
            c = cos(vectors[seat][a], vectors[seat][b])
            (same if FAMILY[a] == FAMILY[b] else cross).append(c)
    return {"same_mean": sum(same) / len(same), "cross_mean": sum(cross) / len(cross),
            "same_min": min(same), "cross_max": max(cross)}
separation = {seat: pair_hist(seat) for seat in ["jev", "qwen38-27b", "gpt-oss-20b"]}

# ── seal inputs ──────────────────────────────────────────────────────────────
out = {
    "experiment": "E-Q21",
    "retrieval": results,
    "baselines": {"bow": bow_acc, "permutation_null": perm_null, "majority": majority, "jev_local_sanity": jev_local},
    "stability": {"within": within, "total": total_axes, "per_record": stab_report},
    "divergence": divergence,
    "separation": separation,
    "usage": usage_meta,
    "vectors": {seat: {rid: vec for rid, vec in m.items()} for seat, m in vectors.items()},
}
(HERE / "eval_results.json").write_text(json.dumps(out, indent=1))
print("[eval] wrote eval_results.json")
for seat in ["jev", "qwen38-27b", "gpt-oss-20b"]:
    print(f"  {seat}: acc={results[seat]['accuracy']:.2f} sep same={separation[seat]['same_mean']:.3f} cross={separation[seat]['cross_mean']:.3f}")
