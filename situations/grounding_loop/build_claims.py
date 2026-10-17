#!/usr/bin/env python3
# situations/grounding_loop/build_claims.py -- the T3-a stimulus + ground
# truth, pre-registered BEFORE any judgment call (the registration law:
# ground truth written and sha-pinned first; never edited after the first
# Jev call).
#
# Pre-seal self-verification: every TRUE claim's evidence value is asserted
# present in the named repo file, and every FALSE claim's disproof is
# asserted, at build time. A failed assertion aborts the build loudly --
# ground truth must be repo-true before it is pinned.
#
# Claim mix (registration Lane T3-a):
#   22 TRUE  - sampled across the sealed record (SPEC scoreboard lines,
#              CLAIM-VERDICTS verdicts + shas, FALSIFICATION-BUDGET counts,
#              chain tips from experiments/outputs/*_tip.txt, E-Q14/E-Q16
#              result numbers; forms vary: sha / count / verdict word /
#              number from an output JSON).
#   7  FALSE - the planted r10 4/4 artifact verbatim (Qwen's invented
#              cache-eviction mechanism) + exactly one fabrication per
#              class: sha-not-in-repo, row-id-out-of-range,
#              number-not-in-output-JSON, invented-file, inverted-verdict,
#              wrong-metric-unit.
#   3  UNVERIFIABLE distractors - 2 selected verbatim from the single
#              Seed-2.0-mini candidate call (r12-cc-distractors-seed,
#              verified unverifiable-from-repo) + 1 authored, verified the
#              same way.
import hashlib
import json
import pathlib
import random
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent

# ---------------------------------------------------------------- helpers
def rd(p):
    return (REPO / p).read_text(encoding="utf-8")


def rj(p):
    return json.loads(rd(p))


def repo_wide_contains(needle, skip_dirs=(".git", "grounding_loop", "__pycache__")):
    """Pure-python walk; returns list of repo-relative paths containing needle."""
    hits = []
    for p in REPO.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(REPO)
        if any(part in skip_dirs for part in rel.parts):
            continue
        try:
            if needle in p.read_text(encoding="utf-8"):
                hits.append(str(rel))
        except (UnicodeDecodeError, OSError):
            continue
    return hits


def sha_file(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


# ------------------------------------------------------- verifiable facts
SPEC = rd("SPEC.md")
CV = rd("docs/CLAIM-VERDICTS.md")
FB = rd("docs/FALSIFICATION-BUDGET.md")
Q14 = rj("experiments/outputs/e_q14_results.json")
Q16 = rj("experiments/outputs/e_q16_results.json")
Q7 = rj("experiments/outputs/e_q7_results.json")
Q6 = rj("experiments/outputs/e_q6_results.json")
Q15 = rj("experiments/outputs/e_q15_results.json")
Q10 = rj("experiments/outputs/e_q10_results.json")
Q13 = rj("experiments/outputs/e_q13_results.json")
Q8 = rj("experiments/outputs/e_q8_results.json")
TIP14 = rd("experiments/outputs/e_q14_tip.txt").strip()
TIP16 = rd("experiments/outputs/e_q16_tip.txt").strip()
TIP6 = rd("experiments/outputs/e_q6_tip.txt").strip()
TIPFP = rd("fixedpoint/receipts/chain_tip.txt").strip()
EQ16_ROWS = [l for l in rd("receipts/e_q16_chain.jsonl").split("\n") if l.strip()]
PG_ROWS = [json.loads(l) for l in rd("receipts/probe_gate_chain.jsonl").split("\n") if l.strip()]
Q11 = rj("experiments/outputs/e_q11_results.json")
Q12 = rj("experiments/outputs/e_q12_results.json")
FVE = rj("fixedpoint/outputs/f_e_verdict.json")
CIMPL_TIP = rd("crossimpl/receipts/cimpl_tip.txt").strip()
QWEN_ROW = None
for line in rd("situations/arena_rows_r10.jsonl").split("\n"):
    if line.strip():
        r = json.loads(line)
        if r.get("seat") == "qwen3635b":
            QWEN_ROW = r
QWEN_F3 = [f for f in QWEN_ROW["content_json"]["findings"] if f["id"] == "F3"][0]
ADJ = rj("situations/adjudications_r10.json")

FAKE_SHA = hashlib.sha256(b"qthe-t3a-fake-sha-not-in-repo-v1").hexdigest()
FAKE_PF16 = "0.9127408"  # plausible-looking provenance median, absent from the file

# ------------------------------------------------- pre-seal self-verification
def check(cond, what):
    if not cond:
        print("SELF-VERIFICATION FAILED: " + what)
        sys.exit(1)


check("LIVES — 47.40% bytes-gain" in SPEC, "C-01 SPEC C1 row")
check("8/8 ON vs 0/20 OFF" in SPEC, "C-02 SPEC C2 row")
check("**DIES** (honest null, formation-scoped)" in CV, "C-03 CLAIM-VERDICTS C3 row")
check(TIP6 == "ab4ea19681888b11c2843b9ca43d12f652dca045338217dc5bf1b5cd9e477db0 links=15", "C-04 e_q6 tip")
check("16 (394 rows total)" in FB, "C-05 budget chain count")
check("honest nulls / falsifications banked | 7" in FB and "defects caught by the discipline itself | 9" in FB, "C-06 budget counts")
check(TIP14 == "6a7a2118da79ef038cbd0d8a319d15108ce64238cd7a3849febc010994b03a56 links=70", "C-07 e_q14 tip")
check(Q14["aggregates"]["pfMed"]["0"] == "0.9430661577608143", "C-08 pfMed0")
check(Q14["aggregates"]["B2delivered"] == 80, "C-09 B2delivered")
check(Q16["scaling"][0]["contentionWritesPerSlot"] == "353.57" and Q16["scaling"][2]["contentionWritesPerSlot"] == "5874.11" and Q16["scaling"][2]["grid"] == "256x256", "C-10 scaling endpoints")
check(Q16["phaseTable"][0]["sigma"] == "0.25" and Q16["phaseTable"][0]["medianCompletion"] == 38 and Q16["phaseTable"][-1]["sigma"] == 4 and Q16["phaseTable"][-1]["medianCompletion"] == 3, "C-11 phase table endpoints")
check(Q16["census"]["SATURATED"] == 93 and Q16["census"]["CASCADE"] == 7 and Q16["census"]["STATIC"] == 0, "C-12 census")
check(Q7["aggregates"]["alpha23"]["totalFirings256"] == 991, "C-13 alpha23 firings")
check("survival=0.984375" in Q6["aggregates"]["verdictLine"], "C-14 q6 survival")
check(Q15["aggregates"]["medianDelta"] == -6 and Q15["aggregates"]["winRate"] == 0, "C-15 q15 null")
check(all(Q10["aggregates"][k] is True for k in ["C1","C2","C3","C4","C5","C6","C7","C8","C9"]) and Q10["aggregates"]["admissible"] == 17 and all(t == 105 for t in Q10["aggregates"]["firstZeroTicks"]), "C-16 q10 predicates")
check("47.4026%" in rd("experiments/outputs/e_q13_results.json") and Q13["aggregates"]["medianCompletion"] == 8, "C-17 q13 gain")
vl8 = Q8["aggregates"]["verdictLine"]
check("FLOAT-ONLY-ARTIFACT ESTABLISHED" in vl8 and "slot 20" in vl8 and "ENGINEERED-COUPLED-EXCEPTION" in vl8, "C-18 q8 verdict")
check(TIP16 == "d7c817a851b199461b5ea4c32370894fef847bfb23995db95419f0ebb3a79e7a links=20" and len(EQ16_ROWS) == 20, "C-19 e_q16 tip+rows")
check(TIPFP == "61e723d41268e8ce0f7f8d0c859705832fc3cd05c0a1a8526853254c420247fb", "C-20 fixedpoint tip")
check(Q16["stability"][0]["finalHash"] == "2880a8273f4819b860004e6d32cb2ee186f42d89ba4ee42a358b47b72e716de4" and Q16["stability"][0]["T"] == 10000 and Q16["stability"][0]["checkpoints"] == 11, "C-21 A1 finalHash")
# t05/t06/t22 replaced during build (receipted in gt meta): FALSIFICATION-BUDGET.md
# counts and probe_gate row-count are UNSTABLE this round -- lane T3-b is live
# and regenerates the budget / re-seals the gate chain (a 13th probe_gate row
# was appended mid-build, 2026-10-17T22:06Z). Ground truth pins to sealed,
# immutable artifacts (output JSONs, tip files) instead.
check(Q12["triplesEnumerated"] == 254520 and Q12["passed"] == 10 and Q12["failed"] == 0, "t05 q12 triples")
check(not FVE["fB_P_B1_zero_divergence"] and "NOT closed as registered" in FVE["R5_answer"], "t06 f_e verdict")
check(CIMPL_TIP == "03cf0800e6b02f15af439d3db0b78fe7161af99755cf3822558ba3a35d85f4b0 links=10", "t22 cimpl tip")

# FALSE claim disproofs, asserted at build time
check(ADJ["adjudications"]["r10-judge-qwen3635b"]["repo_verified_new"] == 0 and ADJ["adjudications"]["r10-judge-qwen3635b"]["jev_verified_new"] == 4, "F-01 adjudication receipt")
check("cache-eviction" in ADJ["adjudications"]["r10-judge-qwen3635b"]["verdict"], "F-01 adjudication wording")
check(QWEN_F3["finding"].startswith("The cached-port caveat"), "F-01 verbatim qwen F3")
check(repo_wide_contains(FAKE_SHA) == [], "F-02 fake sha absent repo-wide")
check(len(EQ16_ROWS) == 20 and "erratum.EQ16_contention_string_compare" in EQ16_ROWS[19], "F-03 row 20 carries the erratum, not row 41")
check(FAKE_PF16 not in rd("experiments/outputs/e_q14_results.json") and Q14["aggregates"]["pfMed"]["16"] == "0.9615020511202272", "F-04 fake pfMed16 absent, real value present")
check(not (REPO / "experiments/outputs/e_q3_results.json").exists(), "F-05 invented file absent")
check("the substrate self-repairs (armor-ring) | **DIES** (honest null)" in CV, "F-06 real verdict is DIES")
check(Q16["scaling"][0]["contentionWritesPerSlot"] == "353.57" and Q16["scaling"][0]["firings"] == 19744 and Q16["scaling"][0]["firingsPerTickPerCell"] == "0.0964", "F-07 right number under wrong metric")

# distractors: pull the two selected verbatim from the sealed Seed row
SEED_ROW = None
_dist_path = HERE / "rows_distractors.jsonl"
for line in _dist_path.read_text(encoding="utf-8").split("\n") if _dist_path.exists() else []:
    if line.strip():
        SEED_ROW = json.loads(line)
D_SEAT = None
D_NDA = None
if SEED_ROW:
    content = SEED_ROW["response_raw"]["choices"][0]["message"]["content"]
    try:
        cands = json.loads(content)["distractors"]
    except json.JSONDecodeError:
        cands = json.loads(content[content.index("{"):content.rindex("}") + 1])["distractors"]
    D_SEAT = cands[1]["text"]   # Seat-12 assignment practice
    D_NDA = cands[4]["text"]    # C2 author intent / NDA
check(D_SEAT is not None and D_NDA is not None, "distractors from sealed Seed row")
check(repo_wide_contains("Seat 12") == [] or all("grounding_loop" in h for h in repo_wide_contains("Seat 12")), "D-01 not repo-settleable")
check("non-disclosure" not in CV and "non-disclosure" not in SPEC, "D-02 not repo-settleable")

# ------------------------------------------------------------------ claims
QWEN_F3_TEXT = (
    "Per the C1 receipt in docs/CLAIM-VERDICTS.md: "
    + QWEN_F3["finding"]
)

CLAIMS = [
    # ---- TRUE (22) ----
    ("t01", "SPEC.md's LAYER 2 scoreboard prices claim C1 (intra-cell timbre vs inter-cell porting) as LIVES with a measured 47.40% bytes-gain at completion (E-Q13, chain tip d852e6ac...)."),
    ("t02", "SPEC.md's scoreboard records claim C2 (wormhole beats graph traversal for non-local alignment) as LIVES -- 8/8 connects with the table ON vs 0/20 with it OFF (E-Q1)."),
    ("t03", "docs/CLAIM-VERDICTS.md prices C3 (sigma = log2(3) as the critical bridge scale) as DIES -- an honest null, formation-scoped (E-Q2)."),
    ("t04", "experiments/outputs/e_q6_tip.txt pins the E-Q6 chain tip at ab4ea19681888b11c2843b9ca43d12f652dca045338217dc5bf1b5cd9e477db0 with 15 links -- the chain receipting the S3 live-read row-major LWW slot semantics."),
    ("t05", "experiments/outputs/e_q12_results.json enumerated 254520 predicate triples, all ten claims P1-P10 passing (10 passed, 0 failed)."),
    ("t06", "fixedpoint/outputs/f_e_verdict.json receipts the fixed-point zero-divergence prediction P-B1 as falsified, with R5 answered 'NOT closed as registered'."),
    ("t07", "experiments/outputs/e_q14_tip.txt pins the E-Q14 chain tip at 6a7a2118da79ef038cbd0d8a319d15108ce64238cd7a3849febc010994b03a56 with 70 links."),
    ("t08", "experiments/outputs/e_q14_results.json reports the zero-polluter provenance-fraction median (pfMed at pollution 0) as 0.9430661577608143."),
    ("t09", "experiments/outputs/e_q14_results.json reports B2delivered = 80 (80/80 pair-trials delivered under 256 slot polluters)."),
    ("t10", "experiments/outputs/e_q16_results.json's scaling ladder runs from 64x64 at contentionWritesPerSlot 353.57 to 256x256 at 5874.11."),
    ("t11", "experiments/outputs/e_q16_results.json's phase table runs from medianCompletion 38 ticks at sigma 0.25 down to 3 ticks at sigma 4."),
    ("t12", "experiments/outputs/e_q16_results.json's regime census counts 93 SATURATED and 7 CASCADE, with STATIC at 0."),
    ("t13", "experiments/outputs/e_q7_results.json records totalFirings256 = 991 for the alpha23 arm (the nu-firings count at T=256)."),
    ("t14", "experiments/outputs/e_q6_results.json's verdict line records observed survival = 0.984375, falsifying EQ6-P2 (survival <= 1/64)."),
    ("t15", "experiments/outputs/e_q15_results.json prices the reward-reweighting probe as an honest null: winRate 0 and medianDelta -6."),
    ("t16", "experiments/outputs/e_q10_results.json: all nine injector predicates (C1 through C9 in the results JSON) hold, 17 admissible trials, and firstZeroTicks uniformly 105."),
    ("t17", "experiments/outputs/e_q13_results.json measures the C1 bytes-gain at completion as 47.4026% (medianCompletion 8)."),
    ("t18", "experiments/outputs/e_q8_results.json verdicts FLOAT-ONLY-ARTIFACT ESTABLISHED: primary family 2/3 diverged at tick 1 at contested slot 20, attributed to ENGINEERED-COUPLED-EXCEPTION."),
    ("t19", "experiments/outputs/e_q16_tip.txt pins the E-Q16 chain at tip d7c817a851b199461b5ea4c32370894fef847bfb23995db95419f0ebb3a79e7a with links=20; receipts/e_q16_chain.jsonl carries 20 rows."),
    ("t20", "fixedpoint/receipts/chain_tip.txt pins the fixedpoint chain tip at 61e723d41268e8ce0f7f8d0c859705832fc3cd05c0a1a8526853254c420247fb."),
    ("t21", "experiments/outputs/e_q16_results.json's A1 stability run (T=10000, 11 checkpoints) seals finalHash 2880a8273f4819b860004e6d32cb2ee186f42d89ba4ee42a358b47b72e716de4."),
    ("t22", "crossimpl/receipts/cimpl_tip.txt pins the C99 port's chain tip at 03cf0800e6b02f15af439d3db0b78fe7161af99755cf3822558ba3a35d85f4b0 with 10 links."),
    # ---- FALSE (7) ----
    ("f01", QWEN_F3_TEXT),
    ("f02", "experiments/outputs/e_q13_tip.txt pins the E-Q13 chain tip at " + FAKE_SHA + " (25 links)."),
    ("f03", "Row 41 of receipts/e_q16_chain.jsonl receipts the E-Q16 contention string-compare erratum (erratum.EQ16_contention_string_compare)."),
    ("f04", "experiments/outputs/e_q14_results.json reports the pollution-fraction median at 16 polluters (pfMed at 16) as " + FAKE_PF16 + "."),
    ("f05", "experiments/outputs/e_q3_results.json prices the bridge-formation sigma sweep as a full tie -- the formation-scoped honest null."),
    ("f06", "docs/CLAIM-VERDICTS.md prices C5 -- the substrate self-repairs via the armor ring -- as LIVES, with the repair priced by E-Q5."),
    ("f07", "experiments/outputs/e_q16_results.json: the 64x64 scaling arm measured 353.57 firings per tick per cell."),
    # ---- UNVERIFIABLE distractors (3) ----
    ("d01", D_SEAT),
    ("d02", D_NDA),
    ("d03", "The founder's original 25% gain-of-function estimate for C1 was derived from a hand simulation on paper, before any kernel code existed."),
]

TRUTH = {
    "t01": ("true", "true_spec_scoreboard", "SPEC.md L73: 'LIVES — 47.40% bytes-gain (founder's 25% understated) … (E-Q13, tip d852e6ac…)'"),
    "t02": ("true", "true_spec_scoreboard", "SPEC.md L74: 'LIVES — 8/8 ON vs 0/20 OFF (E-Q1, tip addc22f9…)'"),
    "t03": ("true", "true_verdict_word", "docs/CLAIM-VERDICTS.md scoreboard C3: 'DIES (honest null, formation-scoped)'"),
    "t04": ("true", "true_chain_tip_sha", "experiments/outputs/e_q6_tip.txt verbatim: ab4ea196…47db0 links=15; LWW semantics receipted in CLAIM-VERDICTS supporting verdicts"),
    "t05": ("true", "true_number_from_output_json", "e_q12_results.json: triplesEnumerated 254520, passed 10, failed 0 (claims P1-P10)"),
    "t06": ("true", "true_verdict_word", "fixedpoint/outputs/f_e_verdict.json: fB_P_B1_zero_divergence false; R5_answer 'NOT closed as registered \u2014 see honest_alternatives...'"),
    "t07": ("true", "true_chain_tip_sha", "experiments/outputs/e_q14_tip.txt verbatim: 6a7a2118…3a56 links=70"),
    "t08": ("true", "true_number_from_output_json", "experiments/outputs/e_q14_results.json aggregates.pfMed['0'] == '0.9430661577608143'"),
    "t09": ("true", "true_number_from_output_json", "experiments/outputs/e_q14_results.json aggregates.B2delivered == 80"),
    "t10": ("true", "true_number_from_output_json", "e_q16_results.json scaling[0].contentionWritesPerSlot '353.57' (64x64); scaling[2] '5874.11' (256x256)"),
    "t11": ("true", "true_number_from_output_json", "e_q16_results.json phaseTable[0] sigma '0.25' medianCompletion 38; phaseTable[-1] sigma 4 medianCompletion 3"),
    "t12": ("true", "true_number_from_output_json", "e_q16_results.json census: SATURATED 93, CASCADE 7, STATIC 0"),
    "t13": ("true", "true_number_from_output_json", "e_q7_results.json aggregates.alpha23.totalFirings256 == 991"),
    "t14": ("true", "true_number_from_output_json", "e_q6_results.json aggregates.verdictLine contains 'survival=0.984375' (EQ6-P2 falsified)"),
    "t15": ("true", "true_number_from_output_json", "e_q15_results.json aggregates: medianDelta -6, winRate 0"),
    "t16": ("true", "true_number_from_output_json", "e_q10_results.json aggregates: C1..C9 all true, admissible 17, firstZeroTicks all 105"),
    "t17": ("true", "true_number_from_output_json", "e_q13_results.json: gains include '47.4026%', aggregates.medianCompletion 8"),
    "t18": ("true", "true_verdict_word", "e_q8_results.json aggregates.verdictLine: 'FLOAT-ONLY-ARTIFACT ESTABLISHED', 'contested slot 20', attribution ENGINEERED-COUPLED-EXCEPTION"),
    "t19": ("true", "true_chain_tip_sha", "experiments/outputs/e_q16_tip.txt: d7c817a8…9e7a links=20; receipts/e_q16_chain.jsonl has exactly 20 rows"),
    "t20": ("true", "true_chain_tip_sha", "fixedpoint/receipts/chain_tip.txt verbatim: 61e723d4…47fb"),
    "t21": ("true", "true_number_from_output_json", "e_q16_results.json stability[0]: finalHash 2880a827…6de4, T 10000, checkpoints 11"),
    "t22": ("true", "true_chain_tip_sha", "crossimpl/receipts/cimpl_tip.txt verbatim: 03cf0800\u2026f4b0 links=10"),
    "f01": ("false", "planted_4of4_artifact", "Qwen r10 F3 verbatim (situations/arena_rows_r10.jsonl, seat qwen3635b). Disproof: situations/adjudications_r10.json r10-judge-qwen3635b — repo_verified_new 0, 'cache-eviction determinism-breaking mechanism is invented (M6 determinism is arithmetic, not memory placement)'. CLAIM-VERDICTS C1 boundary says the cached-port caveat prices SRAM residency for PER-TICK PARITY (10 vs 10 reads) under frozen timbre — not a determinism-breaking eviction mechanism."),
    "f02": ("false", "sha_not_in_repo", "Disproof: repo-wide walk finds 0 occurrences of " + FAKE_SHA + " (verified at build time and re-verifiable by grep). Real tip in experiments/outputs/e_q13_tip.txt is d852e6ac37f6d46f190d23e662cf682a5192756ff78f17c31ab570ed603546b3."),
    "f03": ("false", "row_id_out_of_range", "Disproof: receipts/e_q16_chain.jsonl carries 20 rows; erratum.EQ16_contention_string_compare is row 20 (the last), not row 41. Row 41 does not exist."),
    "f04": ("false", "number_not_in_output_json", "Disproof: '" + FAKE_PF16 + "' appears nowhere in experiments/outputs/e_q14_results.json; aggregates.pfMed['16'] == '0.9615020511202272'."),
    "f05": ("false", "invented_file", "Disproof: experiments/outputs/e_q3_results.json does not exist (no E-Q3 was ever run); the sigma-sweep full tie is priced in experiments/outputs/e_q2_results.json."),
    "f06": ("false", "inverted_verdict", "Disproof: docs/CLAIM-VERDICTS.md scoreboard C5 row reads 'DIES (honest null) — ring self-dissolves; no repair term exists'; SPEC.md L77 same. The claim states the opposite."),
    "f07": ("false", "wrong_metric_unit", "Disproof: e_q16_results.json scaling[0]: 353.57 is contentionWritesPerSlot, not firings/tick/cell — firings 19744, firingsPerTickPerCell '0.0964'. Right number, wrong metric."),
    "d01": ("unverifiable", "distractor_seed_selected", "Seed-2.0-mini candidate 2 verbatim (call r12-cc-distractors-seed, situations/grounding_loop/rows_distractors.jsonl). Repo publishes no seating rosters; assignment practice not settleable from repo files."),
    "d02": ("unverifiable", "distractor_seed_selected", "Seed-2.0-mini candidate 5 verbatim (call r12-cc-distractors-seed). Author intent + NDA + 'unrecorded side trials' — nothing in the repo can settle it."),
    "d03": ("unverifiable", "distractor_authored", "Authored distractor. The repo records founderPct 25 (e_q13_results.json) but never how the estimate was derived — not settleable from repo files."),
}

# ------------------------------------------------------- deterministic shuffle
SHUFFLE_SEED = 20261018
order = list(CLAIMS)
random.Random(SHUFFLE_SEED).shuffle(order)

claims_doc = {
    "meta": {
        "built_by": "T3-a build_claims.py (ORCH-R12 lane A)",
        "repo_head_at_build": "08dcb8c",
        "shuffle_seed": SHUFFLE_SEED,
        "counts": {"true": 22, "false": 7, "unverifiable": 3, "total": 32},
        "note": "Stimulus only: id + text. Labels/classes/evidence live in ground_truth.json, "
                "sealed before any judgment call. The planted 4/4 artifact is the Qwen r10 "
                "cache-eviction finding verbatim.",
    },
    "claims": [{"id": cid, "text": text} for cid, text in order],
}

claims_path = HERE / "claims.json"
claims_path.write_text(json.dumps(claims_doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

gt_doc = {
    "meta": {
        "sealed_at": __import__("time").strftime("%Y-%m-%dT%H:%M:%SZ", __import__("time").gmtime()),
        "law": "ground truth written and sha-pinned BEFORE any judgment call (ORCH-R12 "
               "registration, Lane T3-a); not edited after the first Jev call. The "
               "orchestrator re-verifies every row against the repo before verdicts count.",
        "claims_sha256": sha_file(claims_path),
        "pre_seal_self_verification": "PASS (every true-claim value asserted present in its "
                                      "file, every false-claim disproof asserted, at build time)",
        "distractor_provenance": "d01/d02 selected verbatim from the single Seed-2.0-mini call "
                                 "r12-cc-distractors-seed (rows_distractors.jsonl); d03 authored; "
                                 "all three verified unverifiable-from-repo.",
        "concurrency_receipt": "Lane T3-b (E-Q17) ran concurrently and appended a 13th "
                               "probe_gate_chain.jsonl row mid-build (2026-10-17T22:06Z). "
                               "Unstable-filesystem claims (FALSIFICATION-BUDGET counts, "
                               "probe_gate row count) were replaced with sealed immutable "
                               "artifacts before pinning; remaining doc-citing claims "
                               "(SPEC.md, docs/CLAIM-VERDICTS.md) verified at seal time.",
    },
    "truth": [
        {
            "id": cid,
            "label": TRUTH[cid][0],
            "class": TRUTH[cid][1],
            "evidence": TRUTH[cid][2],
        }
        for cid, _ in order
    ],
}

gt_path = HERE / "ground_truth.json"
gt_path.write_text(json.dumps(gt_doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

print("SELF-VERIFICATION: PASS (all 32 rows)")
print("claims.json       sha256 = " + sha_file(claims_path))
print("ground_truth.json sha256 = " + sha_file(gt_path))
print("counts: " + json.dumps(claims_doc["meta"]["counts"]))
