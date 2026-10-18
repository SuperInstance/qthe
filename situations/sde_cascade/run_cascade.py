#!/usr/bin/env python3
# situations/sde_cascade/run_cascade.py -- ORCH-R13 Lane T4-b: the SDE
# cascade for tavern adjudication (cookbook 4.1, registration 8.3).
#
# THE CLAIM UNDER TEST: a cheap briefing-side per-field bad-true Noul battery
# (max-gate at FIRE_T) can route audit findings so the expensive tier (the
# earned grounded loop) only sees escalations -- "the cascade frontier sits
# up-and-left of every single model."
#
# DESIGN (frozen in docs/discussions/2026-10-18-orch-r13-registration.md):
#   - corpus: 90 sealed outcome-labelled findings (r10 40 + r11 18 +
#     grounding 32 claims), ground truth from the sealed records with
#     per-finding certainty receipts (see build_ground_truth below).
#   - arm 1 (all-expensive): the sealed earned-loop outcomes + sealed
#     per-finding prices -- NO new calls.
#   - arm 2 (cascade @ FIRE_T 0.7): 7 per-field nouls per finding
#     (unreasonable / hallucinated / off_target / incomplete /
#     format_violation / name_desc_mismatch / type_mismatch) + 1 UNGATED
#     __overall__ per group; state = round briefing + findings verbatim
#     (briefing-side only -- the §0 law: the battery sees what a judge-side
#     router can see, NOT code-side located sections, which are the
#     expensive tier's job). 3 repeats (the honest-null protocol). Escalate
#     iff max per-field noul > 0.7 in ANY repeat.
#   - arm 3 (swept): FIRE_T in {0.3, 0.5, 0.7, 0.9} recomputed from the
#     same sealed battery rows -- arithmetic, zero new calls.
#
# FALSIFIER (frozen): cascade quality below all-expensive by more than the
# cost saving justifies at our actual seat prices, OR the battery fires on
# > 50% of clean findings (no separation) -> the pareto claim does not
# transfer.
#
# House laws: AS-SAID, append+flush, resume by call_id, fail-closed, no
# .format() on JSON-bearing strings, foreground only. Key from env only.

import hashlib
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROWS = HERE / "rows_battery.jsonl"

ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
CALL_TIMEOUT_S = 180
MAX_ATTEMPTS = 5
GAP_S = 1.0
REPEATS = 3
USD_PER_MTOK_IN = 0.042  # sde_cascade cookbook quote, carried by house precedent
USD_PER_MTOK_OUT = 0.0

# --- the per-field bad-true battery (SDE cookbook 4.1, frozen) ---
FIELDS = {
    "unreasonable": (
        "Is this finding's claim internally inconsistent or implausible on its face given the briefing?",
        "The claim contradicts itself or violates basic sanity",
        "The claim is internally consistent and plausible",
    ),
    "hallucinated": (
        "Does this finding name artifacts, files, flags, numbers, or mechanisms that do not match anything in the briefing or the sealed record it describes?",
        "It cites something the briefing/record does not contain",
        "Everything it cites matches the briefing/record",
    ),
    "off_target": (
        "Does this finding address something other than what it claims -- is its evidence about a different thing than its stated subject?",
        "The evidence and the stated subject diverge",
        "Evidence and subject align",
    ),
    "incomplete": (
        "Does this finding stop short of what its own claim requires -- missing the qualifier, scope, or exception that the briefing itself states?",
        "It omits a stated qualifier/scope/exception that changes its truth",
        "It carries the qualifiers it needs",
    ),
    "format_violation": (
        "Does this finding break the contract its form implies -- a severity label its content does not earn, or an action item that is not actionable?",
        "Form and content mismatch",
        "Form fits content",
    ),
    "name_desc_mismatch": (
        "Does this finding's label (severity/keyword) fail to match its actual description?",
        "Label and description disagree",
        "Label matches description",
    ),
    "type_mismatch": (
        "Does this finding misclassify the KIND of thing it describes -- treating a prose convention as an enforced mechanism, or a measured result as a design guarantee?",
        "It misclassifies the kind of thing",
        "The classification of kind is right",
    ),
}

GROUND_TRUTH_RECEIPTS = {
    "r10": (
        "Labels from the ROUND-TIME verification (situations/arena_r10_verdict.md table + "
        "items 1-8 + situations/adjudications_r10.json), NOT the T3-c grounded re-adjudication "
        "(which is drift-contaminated: the tree moved between r10 and T3-c -- the T3-c caveat). "
        "BAD = invented interfaces/mechanisms, agreed at finding granularity by both sealed "
        "sources (arena_r10_verdict 'misstated' rows + T3-c mechanical/grounded catches): "
        "qwen3635b/F3 (invented cache-eviction mechanism), musegl30b/F1+F2+F5 (invented CLI "
        "flags, T3-c mechanical). CLEAN = the 17 per-finding-named verified-new in verdict "
        "items 1-8 (mimov F1-F6; dsv F2,F3,F4,F5; hy4 F2,F3,F5,F6; nemotron F2,F4,F6). "
        "Everything else = JUDGMENT (already-admitted/plausible classes are not sealed at "
        "finding granularity; the 2 unnamed verified-new and the admitted rows route here "
        "conservatively). Muse F3/F4 -> JUDGMENT (conservative read, admitted/plausible split "
        "not sealed per-finding)."
    ),
    "r11": (
        "Labels from situations/arena_r11_verdict.md scoreboard + the R11 close-out mispricing "
        "list (worklog + commit 885301c): BAD = hy4p/F1 + seed20mini/F2 (the existsSync "
        "misstatement -- 'missing/typo'd-path entries ARE caught by existsSync in PG1 + the "
        "auditor') and hy4p/F5 (the TCB-as-theater claim, registered as honest TCB residue). "
        "CLEAN = the unambiguously named verified-new: mimov26f F1/F2/F4 (curated-table "
        "class; Jev rows unadjudicated; erratum single-consumer), seed20mini F5 (coverage "
        "growth). All other findings -> JUDGMENT (the verdict's verified-new parentheticals "
        "do not resolve to finding ids for dsv41f/hy4p's remaining rows; conservative)."
    ),
    "grounding": (
        "Labels from situations/grounding_loop/ground_truth.json (sha-pinned at T3-a seal): "
        "22 TRUE -> CLEAN, 7 FALSE -> BAD, 3 unverifiable -> JUDGMENT. No drift: the claims "
        "were built and judged against the same tree."
    ),
}


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def api_key() -> str:
    k = os.environ.get("TYPESAFE_API_KEY")
    if not k:
        raise SystemExit("TYPESAFE_API_KEY missing from env (fail-closed)")
    return k


def http_post(body: dict) -> dict:
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": "Bearer " + api_key(), "Content-Type": "application/json"},
        method="POST",
    )
    last = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=CALL_TIMEOUT_S) as res:
                return {"ok": True, "j": json.loads(res.read().decode("utf-8"))}
        except urllib.error.HTTPError as e:
            txt = e.read().decode("utf-8", "replace")[:200]
            if e.code in (429, 529) or e.code >= 500:
                wait = min(60.0, 1.5 * 2 ** (attempt - 1))
                last = "http_%d" % e.code
                print("  attempt %d: %s, backoff %.1fs" % (attempt, last, wait), flush=True)
                time.sleep(wait)
                continue
            return {"ok": False, "error": "http_%d: %s" % (e.code, txt)}
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            wait = min(60.0, 1.5 * 2 ** (attempt - 1))
            last = "net:%s" % str(e)[:100]
            print("  attempt %d: %s, backoff %.1fs" % (attempt, last, wait), flush=True)
            time.sleep(wait)
    return {"ok": False, "error": last or "exhausted"}


def append_row(obj: dict) -> None:
    with ROWS.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def load_done() -> set:
    if not ROWS.exists():
        return set()
    out = set()
    for line in ROWS.read_text(encoding="utf-8").split("\n"):
        if line.strip():
            try:
                out.add(json.loads(line)["call_id"])
            except (json.JSONDecodeError, KeyError):
                pass
    return out


def extract_prefix(path: pathlib.Path) -> str:
    """Extract the SYSTEM_PREFIX triple-quoted constant from an arena script."""
    txt = path.read_text(encoding="utf-8")
    m = re.search(r'SYSTEM_PREFIX = """(.*?)"""', txt, re.S)
    if not m:
        raise SystemExit("SYSTEM_PREFIX not found in %s" % path)
    return m.group(1)


def load_jsonl(path: pathlib.Path) -> list:
    return [json.loads(l) for l in path.read_text(encoding="utf-8").split("\n") if l.strip()]


# ----------------------------------------------------------------------------
# Ground truth table
# ----------------------------------------------------------------------------

R10_CLEAN = {  # per-finding-named verified-new, arena_r10_verdict.md items 1-8
    ("mimov26f", "F1"), ("mimov26f", "F2"), ("mimov26f", "F3"), ("mimov26f", "F4"),
    ("mimov26f", "F5"), ("mimov26f", "F6"),
    ("dsv41f", "F2"), ("dsv41f", "F3"), ("dsv41f", "F4"), ("dsv41f", "F5"),
    ("hy4p", "F2"), ("hy4p", "F3"), ("hy4p", "F5"), ("hy4p", "F6"),
    ("nemotron35sv", "F2"), ("nemotron35sv", "F4"), ("nemotron35sv", "F6"),
}
R10_BAD = {("qwen3635b", "F3"), ("musegl30b", "F1"), ("musegl30b", "F2"), ("musegl30b", "F5")}
R11_BAD = {("hy4p", "F1"), ("hy4p", "F5"), ("seed20mini", "F2")}
R11_CLEAN = {("mimov26f", "F1"), ("mimov26f", "F2"), ("mimov26f", "F4"), ("seed20mini", "F5")}


def build_ground_truth() -> list:
    items = []
    # r10: 7 seats, 40 findings
    for row in load_jsonl(HERE.parent / "arena_rows_r10.jsonl"):
        if not row.get("content_json"):
            continue
        seat = row.get("seat")
        for f in (row["content_json"].get("findings") or []):
            fid = str(f.get("id"))
            key = (seat, fid)
            if key in R10_BAD:
                lab = "BAD"
            elif key in R10_CLEAN:
                lab = "CLEAN"
            else:
                lab = "JUDGMENT"
            items.append({
                "source": "r10", "group": seat, "id": seat + "/" + fid, "label": lab,
                "text": "[" + str(f.get("severity")) + "] " + str(f.get("finding")) +
                        " (artifact: " + str(f.get("artifact")) + ")",
                "receipt": GROUND_TRUTH_RECEIPTS["r10"],
            })
    # r11: turn-1 rows of the 4 endorsed seats, 18 findings
    for row in load_jsonl(HERE.parent / "arena_rows_r11.jsonl"):
        if not row.get("content_json"):
            continue
        seat = row.get("seat")
        for f in (row["content_json"].get("findings") or []):
            fid = str(f.get("id"))
            key = (seat, fid)
            if key in R11_BAD:
                lab = "BAD"
            elif key in R11_CLEAN:
                lab = "CLEAN"
            else:
                lab = "JUDGMENT"
            items.append({
                "source": "r11", "group": seat, "id": "r11-" + seat + "/" + fid, "label": lab,
                "text": "[" + str(f.get("severity")) + "] " + str(f.get("finding")) +
                        " (artifact: " + str(f.get("artifact")) + ")",
                "receipt": GROUND_TRUTH_RECEIPTS["r11"],
            })
    # grounding: 32 claims
    gt = json.loads((HERE.parent / "grounding_loop" / "ground_truth.json").read_text(encoding="utf-8"))
    truth = gt["truth"]
    claims = json.loads((HERE.parent / "grounding_loop" / "claims.json").read_text(encoding="utf-8"))["claims"]
    truth_by_id = {t["id"]: t for t in (truth if isinstance(truth, list) else truth.values())}
    for i, c in enumerate(claims):
        t = truth_by_id.get(c["id"]) or {}
        tv = t.get("label")
        lab = {"true": "CLEAN", "false": "BAD"}.get(tv, "JUDGMENT")
        items.append({
            "source": "grounding", "group": "claims-g%d" % (i // 8), "id": "claim-" + c["id"],
            "label": lab, "text": "Claim " + c["id"] + ": " + c["text"],
            "receipt": GROUND_TRUTH_RECEIPTS["grounding"],
        })
    return items


# ----------------------------------------------------------------------------
# Battery
# ----------------------------------------------------------------------------

def build_call(group: str, items: list, briefing: str) -> dict:
    state = (
        briefing
        + "\n\nFINDINGS/CLAIMS UNDER ROUTING REVIEW (sealed verbatim; the battery "
        + "decides which of them need escalation to the expensive grounded "
        + "verification tier):\n"
        + json.dumps([{ "id": it["id"], "text": it["text"] } for it in items], ensure_ascii=False, indent=1)
    )
    questions = {}
    for it in items:
        qid_base = it["id"].replace("/", "_")
        for field, (q, t, f) in FIELDS.items():
            questions[qid_base + "__" + field] = {
                "type": "noul",
                "instructions": "Finding [%s]: %s" % (it["id"], q),
                "criteria": {"true": t, "false": f},
            }
    questions["__overall__"] = {
        "type": "noul",
        "instructions": (
            "Overall, for this set: does any finding above clearly need "
            "escalation to a grounded code-side verification tier before its "
            "verdict can be trusted? (Informational only -- NOT part of the gate.)"
        ),
        "criteria": {"true": "At least one clearly needs escalation", "false": "None clearly need it"},
    }
    return {"state": state, "model": MODEL, "questions": questions}


def item_id_from_qid(base: str) -> str:
    """Undo the qid mangling to recover the ground-truth item id."""
    if base.startswith("claim-"):
        return base
    if base.startswith("r11-"):
        return base.replace("_", "/", 1)
    return base.replace("_", "/", 1)


def cmd_run() -> None:
    items = build_ground_truth()
    counts = {}
    for it in items:
        counts[it["label"]] = counts.get(it["label"], 0) + 1
    print("ground truth: %d items %s" % (len(items), counts), flush=True)
    (HERE / "ground_truth_table.json").write_text(
        json.dumps({"items": items, "counts": counts,
                    "receipts": GROUND_TRUTH_RECEIPTS}, ensure_ascii=False, indent=1),
        encoding="utf-8")

    r10_prefix = extract_prefix(HERE.parent / "arena_deepinfra.py")
    r11_prefix = extract_prefix(HERE.parent / "arena_r11.py")
    print("briefings: r10 %d chars (sha %s...), r11 %d chars (sha %s...)" % (
        len(r10_prefix), sha(r10_prefix)[:16], len(r11_prefix), sha(r11_prefix)[:16]), flush=True)

    groups = {}
    for it in items:
        groups.setdefault((it["source"], it["group"]), []).append(it)

    done = load_done()
    for (source, group), gitems in sorted(groups.items()):
        briefing = {"r10": r10_prefix, "r11": r11_prefix, "grounding": r10_prefix}[source]
        call = build_call(group, gitems, briefing)
        for rep in range(1, REPEATS + 1):
            cid = "r13-sc-%s-%s-r%d" % (source, group, rep)
            if cid in done:
                print("skip %s (sealed)" % cid, flush=True)
                continue
            t0 = time.time()
            r = http_post(call)
            elapsed = int((time.time() - t0) * 1000)
            row = {
                "call_id": cid, "source": source, "group": group, "repeat": rep,
                "sealed_at": now(), "model_requested": MODEL,
                "state_hash": sha(call["state"]), "questions_hash": sha(json.dumps(call["questions"], sort_keys=True)),
                "question_count": len(call["questions"]), "elapsed_ms": elapsed,
                "item_ids": [it["id"] for it in gitems],
            }
            if r["ok"]:
                j = r["j"]
                u = j.get("usage") or {}
                row.update({
                    "model_served": j.get("model"), "response_raw": j, "answers": j.get("answers"),
                    "usage": u,
                    "usd_est": (u.get("input_tokens") or 0) * USD_PER_MTOK_IN / 1e6
                              + (u.get("output_tokens") or 0) * USD_PER_MTOK_OUT / 1e6,
                })
                print("  %s: %d answers, %dms, $%.6f" % (
                    cid, len(j.get("answers") or {}), elapsed, row["usd_est"]), flush=True)
            else:
                row.update({"error": r["error"], "attempts": MAX_ATTEMPTS})
                print("  %s FAILED: %s (receipted)" % (cid, r["error"]), flush=True)
            append_row(row)
            time.sleep(GAP_S)
    print("\nbattery rows: %s" % ROWS)


def cmd_verdict() -> None:
    items = {it["id"]: it for it in build_ground_truth()}
    rows = [r for r in load_jsonl(ROWS) if r.get("answers")]

    # per-item per-field noul values across repeats
    vals = {}  # id -> field -> [noul x repeats]
    overall = {}
    for r in rows:
        for qid, ans in (r.get("answers") or {}).items():
            if ans.get("type") != "noul":
                continue
            if qid == "__overall__":
                overall.setdefault(r["group"], []).append(ans.get("noul"))
                continue
            base, field = qid.rsplit("__", 1)
            iid = item_id_from_qid(base)
            vals.setdefault(iid, {}).setdefault(field, []).append(ans.get("noul"))

    # reconcile ids (fail loud on any mismatch)
    unmatched = [k for k in vals if k not in items]
    if unmatched:
        print("UNMATCHED ids (battery vs ground truth): %s" % unmatched[:10])
        print("ground-truth ids sample: %s" % list(items)[:10])
        raise SystemExit(1)

    def max_field(iid: str) -> float:
        return max((max(v) for v in vals[iid].values()), default=0.0)

    THRESHOLDS = [0.3, 0.5, 0.7, 0.9]
    sweep = {}
    for T in THRESHOLDS:
        esc = {iid: max_field(iid) > T for iid in vals}
        bad = [iid for iid in vals if items[iid]["label"] == "BAD"]
        clean = [iid for iid in vals if items[iid]["label"] == "CLEAN"]
        judg = [iid for iid in vals if items[iid]["label"] == "JUDGMENT"]
        sweep[T] = {
            "recall": sum(esc[i] for i in bad) / len(bad) if bad else None,
            "clean_pass": sum(not esc[i] for i in clean) / len(clean) if clean else None,
            "n_escalated_bad": sum(esc[i] for i in bad),
            "n_bad": len(bad),
            "n_escalated_clean": sum(esc[i] for i in clean),
            "n_clean": len(clean),
            "n_escalated_judg": sum(esc[i] for i in judg),
            "n_judg": len(judg),
            "n_total_escalated": sum(esc.values()),
        }

    # arm 1 (all-expensive) from sealed data -- no new calls
    arm1 = {
        "loop_price_per_finding": {
            "r10": 0.0165 / 40,        # T3-c spend / findings
            "grounding": 0.0077 / 28,  # T3-a arm B spend / claims
            "r11": 0.00034,            # r10+grounding average; r11 was orchestrator-verified (receipted)
        },
        "sealed_quality": {
            "r10_bad_auto_caught": "3/4 (muse F1/F2/F5 mechanical; qwen F3 -> human_flag at suspicion 0.79)",
            "grounding_bad_flagged": "6/7 (T3-a arm B fabrication detection)",
            "note": "arm-1 recall on the loop-priced BAD subsets = 9/11 = 81.8%",
        },
    }

    bat_cost = sum(r.get("usd_est") or 0 for r in rows)
    bat_in = sum((r.get("usage") or {}).get("input_tokens") or 0 for r in rows)
    bat_out = sum((r.get("usage") or {}).get("output_tokens") or 0 for r in rows)
    loop_avg = 0.00034

    out = {
        "meta": {
            "lane": "T4-b", "round": "ORCH-R13",
            "model_served_rows": sorted({r.get("model_served") for r in rows}),
            "rows": len(rows), "repeats": REPEATS,
            "battery_spend_usd": round(bat_cost, 6),
            "battery_tokens": {"in": bat_in, "out": bat_out},
            "arm1": arm1,
            "falsifier": "fires_on_clean > 50% of CLEAN at FIRE_T 0.7 -> no separation; cascade quality below arm1 beyond cost saving -> pareto does not transfer",
        },
        "sweep": {str(T): {
            "fabrication_recall": sweep[T]["recall"],
            "clean_pass_through": sweep[T]["clean_pass"],
            "escalated_bad": "%d/%d" % (sweep[T]["n_escalated_bad"], sweep[T]["n_bad"]),
            "fires_on_clean": "%d/%d" % (sweep[T]["n_escalated_clean"], sweep[T]["n_clean"]),
            "escalated_judgment": "%d/%d" % (sweep[T]["n_escalated_judg"], sweep[T]["n_judg"]),
            "total_escalated": sweep[T]["n_total_escalated"],
            "cascade_cost_usd_est": round(bat_cost + sweep[T]["n_total_escalated"] * loop_avg, 6),
            "arm1_cost_usd_est": round(len(vals) * loop_avg, 6),
        } for T in THRESHOLDS},
        "per_item_max_field": {iid: round(max_field(iid), 4) for iid in sorted(vals)},
        "per_item_label": {iid: items[iid]["label"] for iid in sorted(vals)},
        "overall_by_group": {g: [round(x, 3) for x in v] for g, v in sorted(overall.items())},
    }
    (HERE / "cascade_computation.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")

    print("\n=== CASCADE SWEEP (ground truth: BAD %d / CLEAN %d / JUDGMENT %d) ===" % (
        sweep[0.7]["n_bad"], sweep[0.7]["n_clean"], sweep[0.7]["n_judg"]))
    for T in THRESHOLDS:
        s = sweep[T]
        print("FIRE_T %.1f: recall %.3f (%d/%d BAD) | clean pass-through %.3f (%d/%d fired) | escalated %d total" % (
            T, s["recall"], s["n_escalated_bad"], s["n_bad"],
            s["clean_pass"], s["n_escalated_clean"], s["n_clean"], s["n_total_escalated"]))
    print("battery spend: $%.6f (%d calls, %d in / %d out tokens)" % (bat_cost, len(rows), bat_in, bat_out))
    sep = sweep[0.7]["n_escalated_clean"] / max(1, sweep[0.7]["n_clean"])
    print("no-separation clause at 0.7: fires on %.1f%% of CLEAN (falsifier fires at >50%%)" % (sep * 100))


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in ("run", "verdict", "plan"):
        print("usage: python3 run_cascade.py run|verdict|plan")
        raise SystemExit(1)
    if sys.argv[1] == "plan":
        items = build_ground_truth()
        from collections import Counter
        print(json.dumps({"items": len(items), "labels": dict(Counter(i["label"] for i in items)),
                          "by_source": {str(k): v for k, v in Counter(
                              (i["source"], i["label"]) for i in items).items()}}, indent=1))
        return
    {"run": cmd_run, "verdict": cmd_verdict}[sys.argv[1]]()


if __name__ == "__main__":
    main()
