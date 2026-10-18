#!/usr/bin/env python3
# situations/embedding_r26/ascending_budget.py — E-Q33 lane T18-b: the
# question-budget curve, ASCENDING arm. ONE DeepSeek call proposes a
# 4-question battery from 2 example records per family (our axis concepts
# HIDDEN); the battery is embedded over all 20 records (noul, jev-latest)
# and evaluated LIVE against the sealed corpus. The single-shot dignity rule.
import hashlib
import json
import os
import pathlib
import subprocess
import sys
import time
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
R24 = ROOT / "situations" / "embedding_r24"

TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone"
DEEPINFRA_URL = "https://api.deepinfra.com/v1/openai/chat/completions"
GENERATOR = "deepseek-ai/DeepSeek-V4.1-Flash"
SUBSET8 = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]  # the frozen E-Q23 subset

corpus = json.loads((R23 / "corpus.json").read_text())
records = corpus["records"]
FAMILY = {r["id"]: r["family"] for r in records}
IDS = [r["id"] for r in records]

def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

rows_path = HERE / "ascending_rows_r27.jsonl"
def seal_row(row):
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")

# ── step 1: the single generation call ──────────────────────────────────────
examples = []
for rid in SUBSET8:
    r = next(x for x in records if x["id"] == rid)
    examples.append(f"[{r['family']}] {r['text']}")
sys_p = (
    "You design question batteries for embedding experiment records. You will see "
    "eight records from four families (N, P, Q, A — two each). Propose exactly FOUR "
    "yes/no questions that, asked about any single record, best distinguish which "
    "family the record belongs to. Each question must be answerable from the record's "
    "text alone, physically concrete, and non-redundant with the others. Return ONLY "
    "a JSON array of exactly 4 question strings."
)
user_p = "RECORDS:\n\n" + "\n\n".join(examples) + "\n\nReturn the JSON array of 4 questions now."

def generate_battery(call_id, retry=False):
    body = json.dumps({
        "model": GENERATOR,
        "messages": [{"role": "system", "content": sys_p}, {"role": "user", "content": user_p}],
        "max_tokens": 600, "temperature": 0.7,
    }).encode()
    req = urllib.request.Request(DEEPINFRA_URL, data=body, headers={
        "Authorization": f"Bearer {os.environ['DEEPINFRA_API_KEY']}", "Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=300) as r:
        out = json.load(r)
    dt = int((time.time() - t0) * 1000)
    text = (out["choices"][0]["message"]["content"] or "").strip()
    seal_row({"round": "r27", "call_id": call_id, "kind": "generate", "model": GENERATOR,
              "elapsed_ms": dt, "usage": out.get("usage"), "raw": text,
              "retry": retry, "sealed_at": now()})
    return text

raw = generate_battery("r27-eq33-generate-1")
# parse: one retry allowed and receipted
def parse_questions(text):
    m = text[text.find("["):text.rfind("]") + 1]
    try:
        arr = json.loads(m)
        if isinstance(arr, list) and len(arr) == 4 and all(isinstance(q, str) and 15 < len(q) < 300 for q in arr):
            return arr
    except Exception:
        pass
    return None

questions = parse_questions(raw)
retries = 0
if questions is None:
    retries = 1
    raw = generate_battery("r27-eq33-generate-2", retry=True)
    questions = parse_questions(raw)
if questions is None:
    raise SystemExit("F1 breach: two unparseable generations — stop and receipt")
print(f"[eq33] generated battery (retries={retries}):")
for i, q in enumerate(questions):
    print(f"  Q{i+1}: {q}")

# ── step 2: embed all 20 records with the generated battery ────────────────
def build_questions():
    qs = {}
    for i, q in enumerate(questions):
        qs[f"G{i+1}"] = {
            "type": "noul",
            "instructions": (
                f"Record: does it substantively concern {q}? "
                "Judge whether the record is about this concern."
            ),
            "criteria": {
                "true": "The record is substantively about this concern",
                "false": "The record is not about this concern",
            },
        }
    return qs

QMAP = build_questions()
QMAP_SHA = sha(json.dumps(QMAP, sort_keys=True))

def embed(rec, call_id):
    payload = {"state": "RECORD " + rec["id"] + " (from the qthe kernel's sealed experiment record):\n\n" + rec["text"],
               "model": "jev-latest", "questions": QMAP}
    req = urllib.request.Request(TYPESAFE_URL, data=json.dumps(payload).encode())
    req.add_header("Authorization", "Bearer " + os.environ["TYPESAFE_API_KEY"])
    req.add_header("Content-Type", "application/json")
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=180) as r:
        body = json.loads(r.read().decode())
    dt = int((time.time() - t0) * 1000)
    ans = body.get("answers") or {}
    vec = []
    for i in range(4):
        p = (ans.get(f"G{i+1}") or {}).get("noul")
        vec.append(max(0.0, min(1.0, float(p))))
    seal_row({"round": "r27", "call_id": call_id, "kind": "embed", "model": "jev-latest",
              "model_served": body.get("model"), "elapsed_ms": dt,
              "qmap_sha": QMAP_SHA, "answers_raw": ans, "usage": body.get("usage"),
              "sealed_at": now()})
    return vec

G = {}
for rec in records:
    G[rec["id"]] = embed(rec, f"r27-eq33-embed-{rec['id']}")
print(f"[eq33] embedded 20 records x 4 generated questions")

# ── step 3: the local subset curve over the generated battery's own axes ───
import itertools
import math
def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

def subset_accuracy(subset):
    hits = 0
    for rid in IDS:
        v = [G[rid][i] for i in subset]
        best, best_s = None, -2.0
        for oid in IDS:
            if oid == rid:
                continue
            s = cos(v, [G[oid][i] for i in subset])
            if s > best_s:
                best_s, best = s, oid
        if FAMILY[best] == FAMILY[rid]:
            hits += 1
    return hits / 20.0

acc = {}
for mask in range(1, 16):
    subset = tuple(i for i in range(4) if mask & (1 << i))
    acc[subset] = subset_accuracy(subset)
best_curve = {k: max(a for s, a in acc.items() if len(s) == k) for k in range(1, 5)}

# Shapley over 4 axes
FACT = [math.factorial(i) for i in range(5)]
acc[()] = 0.0
shapley = {}
for a_i in range(4):
    val = 0.0
    for s, sv in acc.items():
        if a_i in s:
            continue
        k = len(s)
        val += FACT[k] * FACT[3 - k] / FACT[4] * (acc[tuple(sorted(s + (a_i,)))] - sv)
    shapley[f"G{a_i+1}"] = val

# ── step 4: the LIVE evaluation ─────────────────────────────────────────────
ndjson = HERE / "upsert_eq33.ndjson"
with ndjson.open("w") as f:
    for rid in IDS:
        f.write(json.dumps({"id": f"eq33G:{rid}", "values": [round(v, 6) for v in G[rid]] + [0.0] * 28,
                            "metadata": {"family": FAMILY[rid], "arm": "eq33G"}}) + "\n")
env = dict(os.environ)
env["CLOUDFLARE_API_TOKEN"] = os.environ["CLOUDFLARE_TOKEN"]
env["CLOUDFLARE_ACCOUNT_ID"] = "049ff5e84ecf636b53b162cbb580aae6"
up = subprocess.run(["npx", "wrangler", "vectorize", "upsert", "qthe-jev-embed", "--file", str(ndjson)],
                    cwd=str(ROOT / "cloudflare"), env=env, capture_output=True, text=True, timeout=300)
print("[upsert]", (up.stdout + up.stderr).strip().splitlines()[-1] if (up.stdout + up.stderr).strip() else up.returncode)
if up.returncode != 0:
    sys.exit(4)

CF = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"
def query_topk(vec, k=20):
    body = json.dumps({"vector": [round(v, 6) for v in vec] + [0.0] * 28, "topK": k,
                       "filter": {"arm": "eq33G"}}).encode()
    req = urllib.request.Request(CF, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

# poll-until-visible (the law)
for _ in range(40):
    if len(query_topk([1.0] * 4)) >= 19:
        break
    time.sleep(5)

hits = 0
misses = []
for rid in IDS:
    matches = query_topk(G[rid])
    others = [(r2, s) for r2, s in matches if r2 != rid]
    if not others:
        misses.append((rid, "NO-NEIGHBOR"))
        continue
    if FAMILY[others[0][0]] == FAMILY[rid]:
        hits += 1
    else:
        misses.append((rid, others[0][0]))
live_acc = hits / 20
print(f"[eq33] LIVE generated-4 accuracy: {hits}/20 = {live_acc:.2f} (fixed knee 0.90, full-8 0.80)")

H1 = live_acc >= 0.70
H2 = live_acc >= 0.90
C31 = H1
P1 = 0.65 <= live_acc <= 0.85
P3_flat = (best_curve[4] - best_curve[3]) <= 0.10  # flat: the generated 4 are redundant
# P2/P4 (concept rediscovery, miss-table disagreement) are inspection receipts, below
fixed_misses = {("P4", "A5"), ("Q4", "N5")}  # the sealed eq29S4 miss table
gen_misses = {tuple(m) for m in misses if m[1] != "NO-NEIGHBOR"}
P4 = bool(gen_misses) and not gen_misses.issubset(fixed_misses)

out = {
    "experiment": "E-Q33",
    "generated_questions": questions,
    "generation_retries": retries,
    "live_accuracy": live_acc,
    "live_hits": hits,
    "misses": misses,
    "local_best_curve": {str(k): best_curve[k] for k in range(1, 5)},
    "local_full4": acc[(0, 1, 2, 3)],
    "shapley": {k: round(v, 5) for k, v in shapley.items()},
    "references": {"fixed_knee_eq29S4": 0.90, "full8_eq29S8": 0.80},
    "hypotheses": {"H1_beats_full": H1, "H2_beats_knee": H2, "C31": C31},
    "predictions": {"P1": P1, "P3_flat": P3_flat, "P4": P4,
                    "P2_inspection": "receipted in the verdict doc (concept rediscovery)"},
}
(HERE / "eq33_results.json").write_text(json.dumps(out, indent=1))
print(f"[eq33] H1(beats full-8)={H1} H2(beats knee)={H2} C31={C31}")
print(f"[eq33] own-axis best curve: {best_curve} | shapley {shapley}")
