#!/usr/bin/env python3
# situations/novel_ideas_r24/idea_space.py — the r24 organic-engagement
# twist: the IDEAS BATTERY embedded through the question map itself. The
# fleet's own ideation lives in the measured space: each idea is vectorized
# (noul arm), queried against the 20 sealed records, and the idea-idea
# geometry is measured. This is the instrument instrumenting its own
# frontier — and the r25 candidates' provenance receipt.
import hashlib
import json
import math
import os
import pathlib
import re
import time
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
IDEAS = HERE / "ideas_r24.md"
TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone"
CF_QUERY_URL = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"

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

def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

# EXPLICIT aggregation loop (the T5-a guard's BATCHED pattern)
def build_questions():
    questions = {}
    for ax, concept in AXES:
        questions[ax] = {
            "type": "noul",
            "instructions": (
                f"Text: does it substantively concern {concept}? "
                "Judge whether the text is about this concern."
            ),
            "criteria": {
                "true": "The text is substantively about this concern",
                "false": "The text is not about this concern",
            },
        }
    return questions

QUESTIONS = build_questions()

# parse the six idea sections: "## I-N. Title" ... until next "## "
md = IDEAS.read_text()
sections = re.split(r"\n## ", md)
ideas = []
for sec in sections[1:]:
    title = sec.splitlines()[0].strip()
    body = "\n".join(sec.splitlines()[1:]).strip()
    # the mechanism paragraph (skip the constraint table sections)
    m = re.search(r"\*\*Mechanism\.\*\*\s*(.+?)(?=\n\*\*|\n## |\Z)", body, re.S)
    if not m:
        continue
    mech = re.sub(r"\s+", " ", m.group(1)).strip()
    ideas.append({"id": title.split(".")[0], "title": title.split(". ", 1)[-1], "excerpt": (title + ". " + mech)[:600]})
assert len(ideas) == 6, f"expected 6 ideas, parsed {len(ideas)}"

rows_path = HERE / "idea_space_rows_r24.jsonl"
sealed = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            sealed.add(json.loads(line)["call_id"])

vectors = {}
for idea in ideas:
    call_id = f"r24-idea-space-{idea['id']}"
    if call_id in sealed:
        for line in rows_path.read_text().splitlines():
            if line.strip():
                r = json.loads(line)
                if r["call_id"] == call_id:
                    vectors[idea["id"]] = r["vector"]
        continue
    state = "RESEARCH IDEA " + idea["id"] + " (from the qthe fleet's r24 ideas battery):\n\n" + idea["excerpt"]
    payload = {"state": state, "model": "jev-latest", "questions": QUESTIONS}
    req = urllib.request.Request(TYPESAFE_URL, data=json.dumps(payload).encode(), headers={
        "Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=180) as r:
        body = json.load(r)
    dt = int((time.time() - t0) * 1000)
    ans = body.get("answers", {})
    vec = []
    for ax, _ in AXES:
        p = (ans.get(ax) or {}).get("noul")
        vec.append(max(0.0, min(1.0, float(p))))
    vectors[idea["id"]] = vec
    with rows_path.open("a") as f:
        f.write(json.dumps({"round": "r24", "call_id": call_id, "task": "idea-space-embed",
                            "idea": idea["id"], "title": idea["title"], "model_served": body.get("model"),
                            "elapsed_ms": dt, "vector": vec, "sealed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}) + "\n")
    print(f"  {idea['id']}: {dt}ms " + " ".join(f"{ax.split('_')[0]}={v:.2f}" for ax, v in zip([a for a, _ in AXES], vec)))

# live queries: nearest sealed records per idea
def query_topk(vec, k=5):
    body = json.dumps({"vector": [round(v, 6) for v in vec] + [0.0] * 24, "topK": k, "filter": {"arm": "eq22N"}}).encode()
    req = urllib.request.Request(CF_QUERY_URL, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

out = {"ideas": ideas, "vectors": vectors, "nearest_records": {}, "idea_pair_cosine": {}}
for idea in ideas:
    out["nearest_records"][idea["id"]] = query_topk(vectors[idea["id"]])
    print(f"  {idea['id']} nearest: {[(r, round(s, 3)) for r, s in out['nearest_records'][idea['id']][:3]]}")
ids = [i["id"] for i in ideas]
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        out["idea_pair_cosine"][f"{a}|{b}"] = round(cos(vectors[a], vectors[b]), 4)

(HERE / "idea_space_results.json").write_text(json.dumps(out, indent=1))
print("[idea-space] done — results in idea_space_results.json")
