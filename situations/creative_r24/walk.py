#!/usr/bin/env python3
# situations/creative_r24/walk.py — E-Q24 lane T15-d: THE EMBEDDING-SPACE
# WALK. An organic cross-model process hosted by the live embedding space:
# DeepSeek (DeepInfra) writes field notes; the JEV noul question map embeds
# each note; Cloudflare Vectorize steers to the next station record.
# Neither model sees the whole path — the generator sees the current station
# and its own memory of notes; the embedder sees only the note. The trace is
# the artifact (AI-Writings form #6: THE WALK).
#
# Protocol frozen in pre_registration_e_q24.json: seed N1, 8 stations,
# visited-set exclusion (the walk must leave every station it reaches),
# ONE generation per station AS-SAID (a single parse-retry allowed and
# receipted), arm = the E-Q22 NOUL arm (F2 complete), next = top-1 unvisited
# eq22N match from a LIVE query.
import hashlib
import json
import os
import pathlib
import re
import time
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
R24 = ROOT / "situations" / "embedding_r24"

corpus = json.loads((R23 / "corpus.json").read_text())
records = {r["id"]: r for r in corpus["records"]}
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}

SEED = "N1"
STATIONS = 8
GENERATOR = "deepseek-ai/DeepSeek-V4.1-Flash"
DEEPINFRA_URL = "https://api.deepinfra.com/v1/openai/chat/completions"
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

def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

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
QMAP_SHA = sha(json.dumps(QUESTIONS, sort_keys=True))

trace_path = HERE / "walk_trace.jsonl"
steps_done = set()
if trace_path.exists():
    for line in trace_path.read_text().splitlines():
        if line.strip():
            steps_done.add(json.loads(line)["step"])

def generate_note(station_id, notes_so_far):
    """The generator sees the station record + its own memory of notes."""
    rec = records[station_id]
    memory = "\n".join(f"  {i+1}. {n}" for i, n in enumerate(notes_so_far)) or "  (none yet — this is the first entry)"
    sys = (
        "You are the surveyor on a walk through an embedding space. You are visiting "
        "experiment records from a cellular-automata kernel fleet, one at a time; after each "
        "visit, your note is vectorized and the nearest unvisited record becomes your next "
        "station. You do not choose the path — the space does. Write the next entry for the "
        "field survey log: at most 2 sentences, grounded in the station record's content, "
        "no verbatim copying, direct physical language, honest nulls welcome."
    )
    user = (
        f"CURRENT STATION: record {station_id} (family {FAMILY[station_id]}):\n\n{rec['text']}\n\n"
        f"YOUR SURVEY LOG SO FAR:\n{memory}\n\n"
        "Write the next log entry (at most 2 sentences)."
    )
    body = json.dumps({
        "model": GENERATOR,
        "messages": [{"role": "system", "content": sys}, {"role": "user", "content": user}],
        "max_tokens": 300, "temperature": 0.9,
    }).encode()
    req = urllib.request.Request(DEEPINFRA_URL, data=body, headers={
        "Authorization": f"Bearer {os.environ['DEEPINFRA_API_KEY']}", "Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=300) as r:
        out = json.load(r)
    dt = int((time.time() - t0) * 1000)
    text = (out["choices"][0]["message"]["content"] or "").strip()
    u = out.get("usage", {})
    return text, dt, u

def embed_note(note, step):
    """The embedder sees only the note (noul arm)."""
    state = "FIELD NOTE (from a survey of the qthe kernel's experiment records):\n\n" + note
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
        if p is None:
            raise SystemExit(f"F2 breach: note embed missing axis {ax}")
        vec.append(max(0.0, min(1.0, float(p))))
    return vec, dt, body.get("model"), body.get("usage")

def query_topk(vec, k=20, arm_filter=None):
    # r24 receipt: the AM1 consumer law APPLIED — unfiltered topK=20 global
    # starves the low-norm noul arm of same-arm candidates (the walk trapped
    # at step 5 with zero unvisited eq22N neighbors in the global top-20).
    # The Vectorize metadata filter restricts candidates to the frozen arm.
    payload = {"vector": [round(v, 6) for v in vec] + [0.0] * 24, "topK": k}
    if arm_filter:
        payload["filter"] = {"arm": arm_filter}
    body = json.dumps(payload).encode()
    req = urllib.request.Request(CF_QUERY_URL, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    if not d.get("success"):
        return None
    return (d.get("result") or {}).get("matches", [])

def main():
    visited = [SEED]
    notes = []
    print(f"[walk] seed {SEED} ({FAMILY[SEED]}), {STATIONS-1} retrievals to go (qmap {QMAP_SHA[:10]}…)")
    for step in range(STATIONS - 1):
        if step in steps_done:
            # resume: replay from the trace
            for line in trace_path.read_text().splitlines():
                if line.strip():
                    row = json.loads(line)
                    if row["step"] == step:
                        visited.append(row["retrieval"]["next_station"])
                        notes.append(row["note"])
            print(f"  step {step}: resumed (visited now {visited})")
            continue
        station = visited[-1]
        note, gen_ms, gen_usage = generate_note(station, notes)
        retries = 0
        if not note or len(note) < 10:
            note, gen_ms, gen_usage = generate_note(station, notes)  # the ONE receipted retry
            retries = 1
        vec, emb_ms, model_served, emb_usage = embed_note(note, step)
        matches = query_topk(vec, arm_filter="eq22N")  # the AM1 consumer law, applied mid-walk after the step-5 trap (receipted)
        if matches is None:
            raise SystemExit("F2 breach: live query failed")
        arm = [m for m in matches if str(m.get("id", "")).startswith("eq22N:")]
        unvisited = [m for m in arm if m["id"].split(":", 1)[1] not in visited]
        if not unvisited:
            raise SystemExit(f"walk trapped at step {step}: no unvisited eq22N neighbor EVEN WITH the arm filter (protocol event — receipt and stop)")
        nxt = unvisited[0]
        next_station = nxt["id"].split(":", 1)[1]
        station_score = next((m["score"] for m in arm if m["id"].endswith(":" + station)), None)
        row = {
            "step": step, "sealed_at": now(),
            "station": station, "station_family": FAMILY[station],
            "note": note, "note_vector": vec,
            "generator": GENERATOR, "gen_ms": gen_ms, "gen_usage": gen_usage, "gen_retries": retries,
            "embedder_model_served": model_served, "emb_ms": emb_ms, "qmap_sha": QMAP_SHA,
            "retrieval": {"next_station": next_station, "next_family": FAMILY[next_station],
                          "next_score": nxt["score"], "station_score": station_score,
                          "unvisited_candidates": [{"id": m["id"].split(":", 1)[1], "score": m["score"]} for m in unvisited[:5]]},
        }
        with trace_path.open("a") as f:
            f.write(json.dumps(row) + "\n")
        visited.append(next_station)
        notes.append(note)
        print(f"  step {step}: {station}({FAMILY[station]}) -> note [{len(note)} ch] -> next {next_station}({FAMILY[next_station]}) score {nxt['score']:.3f}")
    print(f"[walk] complete: itinerary {visited}")
    print(f"[walk] families: {[FAMILY[v] for v in visited]}")

if __name__ == "__main__":
    main()
