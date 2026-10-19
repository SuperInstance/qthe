#!/usr/bin/env python3
# situations/embedding_r30/eq40_census.py — E-Q40 lane T21-a: THE
# LEXICAL-SENSITIVITY CENSUS runner. 120 single-word near-synonym substitutions
# (the sealed word map) + 4 in-run anchors, one batched 12-question call each,
# the byte-identical E-Q25 map (F1 sha-asserted), states differing from the
# sealed texts ONLY at the sampled word's surface occurrences (F2 asserted by
# inverse substitution), model_served receipted per call (F3; any non-1.13.0
# serving ABORTS the lane per the Oct-21 flip law).
import hashlib
import json
import os
import pathlib
import re
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
R25 = ROOT / "situations" / "tripwire_r25"
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
ROUND = "r30"
EXPECTED_SERVED = "jev-1.13.0"

corpus = json.loads((R23 / "corpus.json").read_text())
records = {r["id"]: r for r in corpus["records"]}
wordmap = json.loads((HERE / "eq40_word_map.json").read_text())

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
DECOYS = [
    ("D1_far_marine", "the marine biology of the Marianas trench — hadal amphipods, whale fall ecology"),
    ("D2_far_painting", "Renaissance oil painting technique — sfumato, chiaroscuro, pigment grounds"),
    ("D3_near_bio", "cell division cycles in biological tissue — mitosis, differentiation"),
    ("D4_near_price", "the market price of consumer compute hardware — GPU MSRPs, RAM spot prices"),
]


def build_questions():
    questions = {}
    for ax, concept in AXES:
        questions[ax] = {"type": "noul",
            "instructions": f"Record: does it substantively concern {concept}? Judge whether the record is about this concern.",
            "criteria": {"true": "The record is substantively about this concern", "false": "The record is not about this concern"}}
    for dx, concept in DECOYS:
        questions[dx] = {"type": "noul",
            "instructions": f"Record: does it substantively concern {concept}? Judge whether the record is about this concern.",
            "criteria": {"true": "The record is substantively about this concern", "false": "The record is not about this concern"}}
    return questions


QUESTIONS = build_questions()
QMAP_SHA = hashlib.sha256(json.dumps(QUESTIONS, sort_keys=True).encode()).hexdigest()

# F1: byte-identical to the sealed E-Q25 map
sealed_qmap = set()
for line in (R25 / "tripwire_rows_r25.jsonl").read_text().splitlines():
    if line.strip():
        r = json.loads(line)
        if not (r["call_id"].endswith("-stab") or r["call_id"].endswith("-poison")):
            sealed_qmap.add(r["question_map_sha256"])
assert len(sealed_qmap) == 1 and sealed_qmap.pop() == QMAP_SHA, "F1 BREACH: qmap sha differs from E-Q25's sealed map"


def word_pattern(word):
    return re.compile(r"(?<![A-Za-z0-9-])" + re.escape(word) + r"(?![A-Za-z0-9-])", re.IGNORECASE)


def substitute(text, word, sub):
    def repl(m):
        s = m.group(0)
        if s.isupper():
            return sub.upper()          # AM1: all-caps occurrences (E-Q1) get the all-caps substitute
        return (sub[0].upper() + sub[1:]) if s[0].isupper() else sub
    return word_pattern(word).sub(repl, text)


def base_state(rid):
    return "RECORD " + rid + " (from the qthe kernel's sealed experiment record):\n\n" + records[rid]["text"]


# F2 pre-flight (fail loud before ANY call): every substitution must be
# inverse-exact — substitute then invert == the original text byte-identical —
# and the substitute must not already occur in the base text (no ambiguity).
for rid in wordmap["records"]:
    text = records[rid]["text"]
    for w in wordmap["records"][rid]["words"]:
        word, sub = w["word"], w["substitute"]
        assert not word_pattern(sub).search(text), f"F2 BREACH {rid}: substitute '{sub}' already in base text"
        new = substitute(text, word, sub)
        assert word_pattern(word).findall(text) and new != text, f"F2 BREACH {rid}/{word}: no-op substitution"
        # exact inverse with case (AM1: all-caps aware)
        def inv(m):
            s = m.group(0)
            if s.isupper():
                return word.upper()
            return (word[0].upper() + word[1:]) if s[0].isupper() else word
        back = word_pattern(sub).sub(inv, new)
        assert back == text, f"F2 BREACH {rid}/{word}: inverse substitution is not byte-identical"
print(f"[eq40] F2 pre-flight: 120 substitutions inverse-exact; qmap sha {QMAP_SHA[:12]}… (F1 verified vs E-Q25)")

rows_path = HERE / "eq40_rows_r30.jsonl"
done_ok = set()
if rows_path.exists():
    for line in rows_path.read_text().splitlines():
        if line.strip():
            r = json.loads(line)
            if r.get("http_status") == 200:
                done_ok.add(r["call_id"])


def sha(s):
    return hashlib.sha256(s.encode()).hexdigest()


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def call(state, call_id, task, meta):
    if call_id in done_ok:
        return
    payload = {"state": state, "model": MODEL, "questions": QUESTIONS}
    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), headers={
        "Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}",
        "Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            body = json.load(r)
        status = 200
    except urllib.error.HTTPError as e:
        status, body = e.code, {"error": str(e)}
    dt = int((time.time() - t0) * 1000)
    row = {"round": ROUND, "call_id": call_id, "task": task,
           "model_served": body.get("model"), "question_map_sha256": QMAP_SHA,
           "state_sha256": sha(state), "sealed_at": now(),
           "http_status": status, "elapsed_ms": dt,
           "answers_raw": body.get("answers"), **meta}
    with rows_path.open("a") as f:
        f.write(json.dumps(row) + "\n")
    served = body.get("model")
    print(f"  {call_id}: {dt}ms http={status} model={served}")
    if status == 200 and served != EXPECTED_SERVED:
        raise SystemExit(f"*** FLIP ABORT: {call_id} served {served} (expected {EXPECTED_SERVED}) — "
                         "the lane halts for re-registration; the drift monitor's once-in-a-version "
                         "reading fires under the standing E-Q31/E-Q38 instrument registration ***")
    if status != 200:
        print(f"  {call_id}: HTTP {status} — row receipted; re-run resumes this call_id")


def main():
    # the 4 in-run anchors first (F4): N1/P1/Q1/A1 byte-identical
    for rid in ("N1", "P1", "Q1", "A1"):
        call(base_state(rid), f"{ROUND}-eq40-anchor-{rid}", "eq40-anchor",
             {"record_id": rid, "family": records[rid]["family"], "word": None})
    # the 120 substitutions
    for rid in sorted(wordmap["records"]):
        for w in wordmap["records"][rid]["words"]:
            state = "RECORD " + rid + " (from the qthe kernel's sealed experiment record):\n\n" + \
                substitute(records[rid]["text"], w["word"], w["substitute"])
            call(state, f"{ROUND}-eq40-{rid}-{w['word']}", "eq40-subst",
                 {"record_id": rid, "family": records[rid]["family"],
                  "word": w["word"], "substitute": w["substitute"], "pos": w["pos"],
                  "occurrences": w["occurrences"], "echo_orig": w["echo_orig"],
                  "echo_axes_orig": w["echo_axes_orig"], "echo_sub": w["echo_sub"],
                  "echo_axes_sub": w["echo_axes_sub"]})
            time.sleep(0.2)
    print("[eq40] census calls complete (124 total: 4 anchors + 120 substitutions)")


if __name__ == "__main__":
    main()
