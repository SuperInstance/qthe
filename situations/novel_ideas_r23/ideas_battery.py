#!/usr/bin/env python3
# situations/novel_ideas_r23/ideas_battery.py — T14-c: the standing novel-ideas
# challenge (the operator's r23 instruction made concrete). DESIGN (the honest
# pivot, receipted): the systemone typed map (noul/choice/score) cannot return
# free text — so IDEA GENERATION runs on the chat-capable seats (MiMo here;
# both Groq seats via the Actions seat, dispatched separately), and the
# TYPESAFE arm RATES the generated ideas through the typed question map
# (novelty / feasibility / falsifiability per idea, batched in ONE call per
# model — the division of labor the API's own design suggests: judgment
# instrument vs generator). AS-SAID rows; the best idea registers as an r24
# candidate in the round report.
import hashlib
import json
import os
import pathlib
import re
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROUND = "r23"
TS_ENDPOINT = "https://api.typesafe.ai/v1/systemone"
DI_ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions"
DI_MODEL = "XiaomiMiMo/MiMo-V2.6-Flash"
DI_RATES = (0.05, 0.19)

BRIEF = """FLEET CONTEXT — what we have ALREADY tried with the typesafe.ai systemone API (do NOT repeat these):
- typed question maps (noul/choice/score) batched per guest (96 questions in one call; 12.36x cheaper than per-question calls)
- answer-layer wobble measured (same inputs, byte-identical usage, answers differ run to run)
- confidence as a grounding signal (fabricated-choice confidence on FALSE claims 0.894 vs 0.403 wrong-direction)
- subject-key routing (identity decided in code; the model barred from same-entity questions)
- cross-exam batteries, adjudication panels, cache-economics pricing
- THIS ROUND (E-Q21, in flight): the question map as an EMBEDDING FUNCTION — a fixed 8-probe score battery per record, vectors in Cloudflare Vectorize, retrieval scored against sealed family labels.
API surface: POST /v1/systemone with a state text, a model id (jev-latest | jev-preview), and a
questions map (id -> {type, instructions, criteria}) -> per-question answers with
probabilities/confidence. Two served models: jev-latest (jev-1.13.0) and jev-preview (jev-1.14.0)."""

GEN_PROMPT = f"""{BRIEF}

TASK: Propose ONE novel experiment with the systemone API that this fleet has NOT tried — think about what the typed question map, the two models, the probabilities, or the batching make possible that nobody would think to try. Be genuinely creative AND mechanically concrete. Answer ONLY with JSON:
{{"idea": "...", "mechanism": "...", "cheapest_falsifier": "...", "why_novel": "..."}}"""

def sha(s): return hashlib.sha256(s.encode()).hexdigest()
def now(): return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def http_json(url, payload, key, timeout=240):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST")
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, json.loads(r.read().decode())

rows_path = HERE / f"ideas_rows_{ROUND}.jsonl"
sealed_ids = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            try:
                sealed_ids.add(json.loads(line)["call_id"])
            except json.JSONDecodeError:
                pass

# ── phase A: generation (MiMo, 2 calls at temp 0.9 for diversity) ────────────
# THE REASONING-BUDGET LAW (r22 for gpt-oss; now receipted for MiMo too:
# 1199 reasoning tokens, zero visible content at max_tokens 1200 — thinking
# models bill reasoning against the completion budget): 4096 headroom.
k = os.environ.get("DEEPINFRA_API_KEY")
if not k:
    raise SystemExit("DEEPINFRA_API_KEY not set")
ideas = []
for i in (1, 2):
    call_id = f"{ROUND}-ideas-mimov26f-{i}v2"
    if call_id in sealed_ids:
        continue
    t0 = time.time()
    status, body = http_json(DI_ENDPOINT, {
        "model": DI_MODEL,
        "messages": [{"role": "user", "content": GEN_PROMPT}],
        "temperature": 0.9, "max_tokens": 4096,
    }, k)
    elapsed = int((time.time() - t0) * 1000)
    content = (body.get("choices") or [{}])[0].get("message", {}).get("content", "")
    usage = body.get("usage", {})
    usd = round((usage.get("prompt_tokens", 0) / 1e6 * DI_RATES[0] + usage.get("completion_tokens", 0) / 1e6 * DI_RATES[1]) * 1e6) / 1e6
    with rows_path.open("a") as f:
        f.write(json.dumps({"round": ROUND, "call_id": call_id, "seat": "mimov26f", "task": "novel-ideas-gen",
                            "prompt_sha256": sha(GEN_PROMPT), "sealed_at": now(), "http_status": status,
                            "content_raw": content, "usage_norm": usage, "usd": {"if_no_cache": usd},
                            "elapsed_ms": elapsed}) + "\n")
    m = re.search(r"\{[\s\S]*\}", content or "")
    p = None
    if m:
        try:
            p = json.loads(m.group(0))
        except json.JSONDecodeError:
            # literal control chars (newlines) inside JSON strings — MiMo's habit; strict=False accepts
            try:
                p = json.loads(m.group(0), strict=False)
            except json.JSONDecodeError:
                p = None
    if p and "idea" in p:
        ideas.append({"id": f"idea{i}", **p})
        print(f"[ideas] MiMo #{i}: ${usd} :: {p['idea'][:110]}")
    else:
        print(f"[ideas] MiMo #{i}: PARSE-FAIL (row sealed raw)")

# ── phase B: the typesafe arm RATES the ideas (both models, batched) ─────────
# resume law: re-derive the ideas from the sealed generation rows when the
# generation calls were skipped (fresh-run population only fills `ideas` live)
if not ideas and rows_path.exists():
    import json as _json
    for line in rows_path.read_text().splitlines():
        if not line.strip():
            continue
        r = _json.loads(line)
        if "gen" not in r.get("task", "") or "v2" not in r.get("call_id", ""):
            continue
        c = r.get("content_raw") or ""
        m = re.search(r"\{[\s\S]*\}", c)
        if not m:
            continue
        try:
            p = json.loads(m.group(0))
        except json.JSONDecodeError:
            try:
                p = json.loads(m.group(0), strict=False)
            except json.JSONDecodeError:
                continue
        if "idea" in p:
            ideas.append({"id": f"idea{len(ideas) + 1}", **p})
    print(f"[ideas] resume: {len(ideas)} idea(s) re-derived from sealed rows")
ts_key = os.environ.get("TYPESAFE_API_KEY")
if not ts_key:
    raise SystemExit("TYPESAFE_API_KEY not set")
if ideas:
    state = BRIEF + "\n\nCANDIDATE IDEAS (generated by another seat; rate each):\n\n" + "\n\n".join(
        f"[{i['id']}] IDEA: {i['idea']}\nMECHANISM: {i['mechanism']}\nFALSIFIER: {i['cheapest_falsifier']}\nWHY NOVEL: {i['why_novel']}"
        for i in ideas)
    # explicit aggregation loop — the T5-a guard's BATCHED pattern
    questions = {}
    for i in ideas:
        questions[f"{i['id']}__novelty"] = {
            "type": "score",
            "instructions": f"Rate idea [{i['id']}]'s NOVELTY: is it genuinely absent from the tried list, and non-obvious given the API's design?",
            "criteria": ["derivative", "mildly_new", "clearly_new", "strikingly_new"],
        }
        questions[f"{i['id']}__feasibility"] = {
            "type": "score",
            "instructions": f"Rate idea [{i['id']}]'s FEASIBILITY: could it run this week with one API key, sealed receipts, and cents of spend?",
            "criteria": ["impractical", "stretch", "workable", "cheap_and_direct"],
        }
        questions[f"{i['id']}__falsifiability"] = {
            "type": "score",
            "instructions": f"Rate idea [{i['id']}]'s FALSIFIABILITY: does its cheapest falsifier have a sealed, decisive outcome?",
            "criteria": ["unfalsifiable", "murky", "decisive", "knife_edge_decisive"],
        }
    qmap_sha = sha(json.dumps(questions, sort_keys=True))
    for model in ["jev-latest", "jev-preview"]:
        call_id = f"{ROUND}-ideas-rate-{model}"
        if call_id in sealed_ids:
            continue
        t0 = time.time()
        try:
            status, body = http_json(TS_ENDPOINT, {"state": state, "model": model, "questions": questions}, ts_key)
        except urllib.error.HTTPError as e:
            status, body = e.code, {"error": str(e)}
        elapsed = int((time.time() - t0) * 1000)
        with rows_path.open("a") as f:
            f.write(json.dumps({"round": ROUND, "call_id": call_id, "seat": f"typesafe/{model}",
                                "task": "novel-ideas-rating", "model_served": body.get("model"),
                                "question_map_sha256": qmap_sha, "sealed_at": now(), "http_status": status,
                                "answers_raw": body.get("answers"), "usage": body.get("usage"),
                                "elapsed_ms": elapsed}) + "\n")
        if status == 200:
            ans = body.get("answers", {})
            print(f"[ideas] {model} ({body.get('model')}): " + " ".join(
                f"{qid.split('__')[0]}.{qid.split('__')[1]}={a.get('score')}" for qid, a in ans.items()))
        else:
            print(f"[ideas] {model}: HTTP {status}")
        time.sleep(1.0)

print(f"[ideas] rows -> {rows_path}")
