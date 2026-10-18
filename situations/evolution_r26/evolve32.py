#!/usr/bin/env python3
# situations/evolution_r26/evolve32.py — E-Q32 lane T18-a: RETRIEVAL-COUPLED
# FITNESS (the decoupling law's fix). Same harness as E-Q28 but the gate is
# the retrieval itself: a mutant is accepted iff BOTH models' top-1
# unvisited retrievals land in the SAME UNVISITED family. The centroid
# cosines are still receipted per attempt (the decoupling delta measure).
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

TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone"
DEEPINFRA_URL = "https://api.deepinfra.com/v1/openai/chat/completions"
CF_QUERY_URL = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"
EVO_URL = "https://qthe-evosphere.casey-digennaro.workers.dev/r27"
GENERATOR = "deepseek-ai/DeepSeek-V4.1-Flash"
SEED = "N1"
MAX_TOTAL_EMBED_CALLS = 40

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
AXIS_NAME = {i: a for i, (a, _) in enumerate(AXES)}
CONCEPT = {a: c for a, c in AXES}

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

corpus = json.loads((R23 / "corpus.json").read_text())
records = {r["id"]: r for r in corpus["records"]}
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}
EQ22 = json.loads((R24 / "eval_eq22_results.json").read_text())
N_SEALED = EQ22["vectors"]["N"]
FAMS = ["N", "P", "Q", "A"]
CENTROIDS = {}
for f in FAMS:
    mem = [v for rid, v in N_SEALED.items() if FAMILY[rid] == f]
    CENTROIDS[f] = [sum(col) / len(col) for col in zip(*mem)]

rows_path = HERE / "evolution32_rows_r27.jsonl"
def seal_row(row):
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")

def evo(method, path, payload=None):
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(EVO_URL + path, data=body, method=method)
    req.add_header("Authorization", "Bearer " + os.environ["EVOSPHERE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "qthe-orchestrator/27.0 (evolution32 driver)")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode())
        except Exception:
            return {"error": f"HTTP {e.code}"}

def embed(state, model, call_id):
    payload = {"state": state, "model": model, "questions": QUESTIONS}
    req = urllib.request.Request(TYPESAFE_URL, data=json.dumps(payload).encode())
    req.add_header("Authorization", "Bearer " + os.environ["TYPESAFE_API_KEY"])
    req.add_header("Content-Type", "application/json")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            status, body = r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        status, body = e.code, {"error": str(e)}
    dt = int((time.time() - t0) * 1000)
    ans = body.get("answers") or {}
    vec = []
    for ax, _ in AXES:
        p = (ans.get(ax) or {}).get("noul")
        vec.append(max(0.0, min(1.0, float(p))) if p is not None else None)
    seal_row({"round": "r27", "call_id": call_id, "kind": "embed", "model": model,
              "model_served": body.get("model"), "elapsed_ms": dt, "http_status": status,
              "state_sha256": sha(state), "qmap_sha": QMAP_SHA, "answers_raw": ans,
              "usage": body.get("usage"), "sealed_at": now()})
    if status != 200 or any(v is None for v in vec):
        raise SystemExit(f"F2 breach: embed failed or incomplete ({call_id}, HTTP {status})")
    return vec, body.get("model")

def generate(system, user, call_id):
    body = json.dumps({
        "model": GENERATOR,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "max_tokens": 300, "temperature": 0.9,
    }).encode()
    req = urllib.request.Request(DEEPINFRA_URL, data=body, headers={
        "Authorization": f"Bearer {os.environ['DEEPINFRA_API_KEY']}", "Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=300) as r:
        out = json.load(r)
    dt = int((time.time() - t0) * 1000)
    text = (out["choices"][0]["message"]["content"] or "").strip()
    seal_row({"round": "r27", "call_id": call_id, "kind": "generate", "model": GENERATOR,
              "elapsed_ms": dt, "usage": out.get("usage"), "note": text,
              "note_sha256": sha(text), "sealed_at": now()})
    return text

def query_topk(vec, k=20):
    payload = {"vector": [round(v, 6) for v in vec] + [0.0] * 24, "topK": k, "filter": {"arm": "eq22N"}}
    req = urllib.request.Request(CF_QUERY_URL, data=json.dumps(payload).encode(), method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

SYS = (
    "You are the surveyor on a walk through an embedding space. You are visiting "
    "experiment records from a cellular-automata kernel fleet, one at a time; after each "
    "visit, your note is vectorized and the nearest unvisited record becomes your next "
    "station. You do not choose the path — the space does. A keeper you never see has "
    "asked that the survey move toward certain concerns; you honor the request by what "
    "you choose to notice, never by inventing content. Write the next entry for the "
    "field survey log: at most 2 sentences, grounded in the station record's content, "
    "no verbatim copying, direct physical language, honest nulls welcome."
)

def build_user(dir_concepts, station, memory, retry_residual=None):
    rec = records[station]
    mem = "\n".join(f"  {i+1}. {n}" for i, n in enumerate(memory)) or "  (none yet — this is the first entry)"
    keeper = (
        f"THE KEEPER'S REQUEST: the survey should move toward records concerning (1) {dir_concepts[0]} "
        f"and (2) {dir_concepts[1]}."
    )
    if retry_residual:
        keeper += (
            " The previous note did not move the survey enough; sharpen this one toward "
            f"(1) {retry_residual[0]} and (2) {retry_residual[1]}."
        )
    return (
        f"CURRENT STATION: record {station} (family {FAMILY[station]}):\n\n{rec['text']}\n\n"
        f"{keeper}\n\n"
        f"YOUR SURVEY LOG SO FAR:\n{mem}\n\n"
        "Write the next log entry (at most 2 sentences): what THIS record says that touches "
        "the keeper's concerns; if it touches none, the most physical sentence you can about "
        "how the first concern might bear on this station."
    )

def main():
    embed_calls = 0
    probe = evo("GET", "/state")
    if probe.get("initialized"):
        print("[evo32] r27 world already initialized — resuming")
    else:
        seed_state = "RECORD " + SEED + " (from the qthe kernel's sealed experiment record):\n\n" + records[SEED]["text"]
        v_prev, prev_model = embed(seed_state, "jev-preview", f"r27-evo32-seedpreview-{SEED}")
        embed_calls += 1
        r = evo("POST", "/init", {
            "centroids": CENTROIDS,
            "config": {"max_gens": 10, "max_attempts": 2, "target_order": ["P", "Q", "A", "N"],
                       "escape_after": 2, "gate_mode": "retrieval"},
            "seed": {"station": SEED, "station_family": FAMILY[SEED],
                     "v_latest": N_SEALED[SEED], "v_preview": v_prev},
        })
        print(f"[evo32] r27 world initialized (retrieval-coupled gate): {r}")
        seal_row({"round": "r27", "call_id": "r27-evo32-init", "kind": "do_init", "sealed_at": now(),
                  "gate_mode": "retrieval",
                  "centroids": {f: [round(x, 4) for x in c] for f, c in CENTROIDS.items()},
                  "seed_preview_model_served": prev_model, "qmap_sha": QMAP_SHA})

    last_note_vec = None
    while True:
        d = evo("GET", "/directive")
        if d.get("done"):
            print(f"[evo32] done: {d['done']}")
            break
        if embed_calls >= MAX_TOTAL_EMBED_CALLS:
            print("[evo32] hard cap reached — stopping with receipt")
            seal_row({"round": "r27", "call_id": f"r27-evo32-cap-{embed_calls}", "kind": "cap_event",
                      "sealed_at": now(), "note": "registered 40-call cap hit"})
            break
        gen, att = d["gen"], d["attempts_used"] + 1
        dir_axes = d["directive_axes"]
        dir_concepts = [CONCEPT[AXIS_NAME[i]] for i in dir_axes]
        retry_residual = None
        if att == 2 and last_note_vec is not None:
            gap = [CENTROIDS[d["target_family"]][i] - last_note_vec[i] for i in range(8)]
            idx = sorted(range(8), key=lambda i: -gap[i])[:2]
            retry_residual = [CONCEPT[AXIS_NAME[i]] for i in idx]
        user = build_user(dir_concepts, d["station"], d["memory"], retry_residual)
        note = generate(SYS, user, f"r27-evo32-gen{gen}-att{att}")
        note_state = "FIELD NOTE (from a survey of the qthe kernel's experiment records):\n\n" + note
        v_lat, lat_model = embed(note_state, "jev-latest", f"r27-evo32-lat-gen{gen}-att{att}")
        v_pre, pre_model = embed(note_state, "jev-preview", f"r27-evo32-pre-gen{gen}-att{att}")
        embed_calls += 2
        last_note_vec = v_lat
        # BOTH models' retrievals, live, top-1 unvisited each (the gate inputs)
        st = evo("GET", "/state")
        visited = {s["id"] for s in st["stations"]}
        retr = {}
        for tag, vec in (("latest", v_lat), ("preview", v_pre)):
            matches = query_topk(vec)
            if not matches:
                raise SystemExit(f"F2 breach: live {tag} query returned no matches")
            unvis = [(rid, s) for rid, s in matches if rid not in visited]
            top1, top1_score = unvis[0] if unvis else matches[0]
            retr[tag] = {"top1": top1, "family": FAMILY[top1], "score": top1_score,
                         "revisit": top1 in visited}
        res = evo("POST", "/attempt", {
            "note": note, "note_sha": sha(note),
            "v_latest": v_lat, "v_preview": v_pre,
            "directive_axes": dir_axes,
            "retrieval": retr["latest"],
            "retrieval_latest": retr["latest"],
            "retrieval_preview": retr["preview"],
        })
        f = res.get("fitness", {})
        print(f"  gen{gen} att{att} [{d['target_family']}{' ESC' if d['escaped'] else ''}] "
              f"note[{len(note)}ch] -> {res['verdict'].upper()}"
              + (f" ({res.get('rejection_clause')})" if res.get('rejection_clause') else "") +
              f" | retr L:{retr['latest']['top1']}({retr['latest']['family']}) "
              f"P:{retr['preview']['top1']}({retr['preview']['family']}) "
              f"| cosL {f.get('latest', 0):.4f} vs {f.get('parent_latest', 0):.4f}"
              + (f" event={res['event']}" if res.get("event") else ""))
        seal_row({"round": "r27", "call_id": f"r27-evo32-attempt-gen{gen}-att{att}", "kind": "do_attempt",
                  "sealed_at": now(), "gen": gen, "attempt": att, "target": d["target_family"],
                  "directive_axes": [AXIS_NAME[i] for i in dir_axes], "note_sha": sha(note),
                  "note": note, "verdict": res["verdict"],
                  "rejection_clause": res.get("rejection_clause"),
                  "fitness": res.get("fitness"),
                  "retrieval_latest": retr["latest"], "retrieval_preview": retr["preview"],
                  "models_served": {"latest": lat_model, "preview": pre_model}})
        if res.get("done"):
            print(f"[evo32] done: {res['done']}")
            break

    state = evo("GET", "/state")
    (HERE / "evosphere32_state.json").write_text(json.dumps(state, indent=1))
    print(f"[evo32] stations: {[s['id'] for s in state['stations']]}")
    print(f"[evo32] families: {[s['family'] for s in state['stations']]}")
    print(f"[evo32] done={state['done']} attempts={len(state['attempts'])} embed_calls={embed_calls}")

if __name__ == "__main__":
    main()
