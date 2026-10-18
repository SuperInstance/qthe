#!/usr/bin/env python3
# situations/harmony_r22/deepinfra_control.py — the DeepInfra control arm of
# HARMONY-r22 (ORCH-R22/T13-c): ONE call on the tavern's cheap cache-discount
# seat (XiaomiMiMo/MiMo-V2.6-Flash), the same battery, AS-SAID. The control
# anchors the agreement matrix on a seat family the tavern already knows.
import hashlib
import json
import os
import pathlib
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions"
MODEL = "XiaomiMiMo/MiMo-V2.6-Flash"
RATES = {"in": 0.05, "out": 0.19}  # usd/1M, the tavern's cached rates for this seat
ROUND = os.environ.get("GROQ_ROUND", "r22")

briefing = (HERE / "briefing.txt").read_text()
statements = json.loads((HERE / "statements.json").read_text())
ids = list(statements)

def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

k = os.environ.get("DEEPINFRA_API_KEY")
if not k:
    raise SystemExit("DEEPINFRA_API_KEY not set (env-only key doctrine)")

system = ("You are a careful technical reader being tested on comprehension of an experiment record. "
          "Answer ONLY with a JSON object: {\"answers\":[{\"id\":\"S1\",\"answer\":\"TRUE|FALSE|UNCERTAIN\","
          "\"confidence\":0.0-1.0,\"reason\":\"one sentence\"}]} — one entry per statement, in order. "
          "Judge strictly from the briefing. When the briefing settles a statement, do not answer UNCERTAIN.")
user = f"{briefing}\n\nSTATEMENTS:\n" + "\n".join(f"{sid}: {statements[sid]}" for sid in ids) + f"\n\nAnswer for all {len(ids)} statements."

payload = {
    "model": MODEL,
    "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
    "temperature": 0.6, "max_tokens": 2048,
}
req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), method="POST")
req.add_header("Authorization", f"Bearer {k}")
req.add_header("Content-Type", "application/json")
t0 = time.time()
try:
    with urllib.request.urlopen(req, timeout=180) as r:
        status, body = r.status, json.loads(r.read().decode())
except urllib.error.HTTPError as e:
    status, body = e.code, {"error": str(e)}
elapsed = int((time.time() - t0) * 1000)

usage = body.get("usage", {}) or {}
cost = round((usage.get("prompt_tokens", 0) / 1e6 * RATES["in"] + usage.get("completion_tokens", 0) / 1e6 * RATES["out"]) * 1e6) / 1e6
row = {
    "round": ROUND, "call_id": f"{ROUND}-harmony-mimov26f", "seat": "mimov26f", "task": "harmony-battery",
    "model_requested": MODEL, "model_served": body.get("model", MODEL),
    "prompt_sha256": sha(system + "\n\n" + user),
    "sealed_at": now(), "http_status": status,
    "finish_reason": (body.get("choices") or [{}])[0].get("finish_reason"),
    "content_raw": (body.get("choices") or [{}])[0].get("message", {}).get("content"),
    "usage_norm": {"prompt_tokens": usage.get("prompt_tokens"), "completion_tokens": usage.get("completion_tokens"),
                   "cached_tokens": (usage.get("prompt_tokens_details") or {}).get("cached_tokens")},
    "usd": {"if_no_cache": cost, "basis": f"tavern-cached rates {MODEL}: ${RATES['in']}/1M in, ${RATES['out']}/1M out"},
    "elapsed_ms": elapsed,
}
out = HERE / f"deepinfra_rows_{ROUND}.jsonl"
with out.open("a") as f:
    f.write(json.dumps(row) + "\n")
content = row["content_raw"] or ""
parsed = None
try:
    parsed = json.loads(content)
except Exception:
    import re
    m = re.search(r"\{[\s\S]*\}", content)
    if m:
        try:
            parsed = json.loads(m.group(0))
        except Exception:
            parsed = None
if status == 200:
    print(f"[deepinfra] {MODEL} {elapsed_ms}ms ${cost} — " +
          (" ".join(f"{a['id']}={a['answer']}" for a in (parsed or {}).get("answers", [])) if parsed else "PARSE-FAIL (row sealed raw)"))
else:
    print(f"[deepinfra] HTTP {status} (row sealed with error body)")
