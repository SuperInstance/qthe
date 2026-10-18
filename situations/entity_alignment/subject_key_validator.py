#!/usr/bin/env python3
# situations/entity_alignment/subject_key_validator.py -- T5-b (ORCH-R14)
#
# The SUBJECT-KEY law (docs/SUBJECT-KEY.md) made executable on the sealed
# T4-c corpus. Retro-computes code-side subject keys for every pair in
# situations/entity_alignment/pairs_part1.json + pairs_part2.json:
#
#   subject_key = artifact_key + "::" + claim_id     (string concatenation)
#   same_subject  <->  subject_key_a == subject_key_b (string comparison)
#
#   Part 1 (registry/list replay): the artifact is the chain file PATH,
#     parsed AS-SAID from the sealed state_entry text ("path: X" or
#     "matched file (glob *_chain.jsonl): X"); the claim dimension is the
#     constant 'chain_reference' (receipted: every part-1 entry contests
#     the same question -- which chain artifact does this entry refer to).
#   Part 2 (cross-seat findings): artifact_key comes from the PINNED
#     normalization table keyed by the artifact field text VERBATIM as the
#     seat wrote it (AS-SAID, parsed from the sealed state_finding text);
#     claim_id comes from the per-pair subject_a/subject_b fields sealed
#     in pairs_part2.json at build time -- the pre-pairing subject map
#     derived from the r10 adjudication record (subject_map_receipts,
#     same file).
#
# Refusal rule (R4): any side whose key components cannot be computed is
# REFUSED (curator queue), never guessed. A negative control proves the
# rule fires. Fail-closed: structural surprises abort; a changed
# re-derivation of an existing output aborts (append-only discipline for
# the derived artifact; identical re-derivation is a no-op rewrite).
#
# Falsifier (registration Lane T5-b): if the validator cannot express the
# three wrong merges (p2-D02/D03/D06) as subject-key mismatches, the
# schema is NOT sufficient -> exit 2 (refused/uncomputable) or exit 3
# (computable but keys equal). All three mismatched -> exit 0.
#
# Usage: python3 situations/entity_alignment/subject_key_validator.py
# Writes: situations/entity_alignment/subject_key_retrofit.json
# Zero network, zero LLM calls, zero git writes. No .format() anywhere.
import hashlib
import json
import pathlib
import sys

QTHE = pathlib.Path("/home/z/my-project/qthe")
EA = QTHE / "situations" / "entity_alignment"
OUT_PATH = EA / "subject_key_retrofit.json"

VALIDATOR_VERSION = 1
FALSIFIER_PAIRS = ["p2-D02", "p2-D03", "p2-D06"]

PART1_CLAIM_ID = "chain_reference"
PART1_CLAIM_RULE = (
    "constant claim id for part 1: every pre-fix list entry contests the same "
    "question -- WHICH chain artifact does this entry refer to -- so the claim "
    "dimension is constant and the subject is fully determined by the artifact "
    "path (receipted: this is why part 1 is the path-keyed application; the "
    "Inkling ORCH-R13 correction already established the path is the registry's "
    "own key on this corpus, zero alias cases)"
)

# ---------------------------------------------------------------------------
# Pinned part-2 artifact normalization table.
# Keyed by the artifact field text VERBATIM as the seat wrote it (AS-SAID),
# so the mapping is a pure function of the sealed field. Every mapping
# carries a receipt. A text not in this table => the pair is REFUSED (R4).
# Derived from situations/arena_rows_r10.jsonl (40 findings, sealed r10)
# -- the texts below are byte-identical to the sealed artifact fields.
# ---------------------------------------------------------------------------
ARTIFACT_TABLE = {
    "C1 (E-Q13, chain tip d852e6ac...)": (
        "c1_e_q13",
        "dsv F1: names claim C1 on E-Q13 via its chain tip",
    ),
    "E-Q14 provenance autopsy (slot-63 saturation rail / adjacent-d convoy)": (
        "e_q14",
        "dsv F2: the E-Q14 autopsy (floor failure mechanics)",
    ),
    "E-Q16 16x16 T=100,000 in-run harness fix (seedFn closures consumed rng at call time)": (
        "e_q16",
        "dsv F3: the E-Q16 measurement wave / its chain",
    ),
    "C3 sigma = log2(3) critical bridge scale (E-Q2)": (
        "c3_e_q2",
        "dsv F4: claim C3 on E-Q2",
    ),
    "THE THREE HONEST GAPS (1) no LICENSE": (
        "repo_license",
        "dsv F5: the repository-level missing-LICENSE gap",
    ),
    "E-Q15 reward reweighting probe (win-rate 0.00, median delta -6)": (
        "e_q15",
        "dsv F6: the E-Q15 probe",
    ),
    "C5-prime injector repair (E-Q10)": (
        "c5p_e_q10",
        "dsv F7: claim C5-prime on E-Q10",
    ),
    "E-Q14 / M4 wormhole table / C2 / demos (agent rendezvous, non-local alignment without a bus)": (
        "m4_wormhole_table",
        "hy4 F1: co-names E-Q14/C2/demos, but the contested artifact is the M4 "
        "table's content-addressing (co-named artifacts receipted, not keyed)",
    ),
    "E-Q16 / M4 / grid scaling claim (locality HOLDS to 256x256 at 10% Abstain)": (
        "m4_wormhole_table",
        "hy4 F2: co-names E-Q16 as evidence; the contested artifact is the "
        "64-slot table's capacity vs the locality phrasing",
    ),
    "C1 / E-Q13 / cached-port caveat (tau plane SRAM-resident)": (
        "c1_e_q13",
        "hy4 F3: claim C1 on E-Q13, cached-port caveat",
    ),
    "E-Q16 / seedFn closures consumed rng at call time (harness fix)": (
        "e_q16",
        "hy4 F4: the E-Q16 measurement wave / its chain",
    ),
    "E-Q9/E-Q11/E-Q12 (chainless-by-registered-decision) / scripts/verify_all_chains.mjs": (
        "e_q9_11_12",
        "hy4 F5: the E-Q9/11/12 chainless set (co-names verify_all_chains.mjs)",
    ),
    "NO LICENSE gap / qthe-core/ / crossimpl/c/ / ADOPTION-KIT.md": (
        "repo_license",
        "hy4 F6: the repository-level missing-LICENSE gap (distribution roots "
        "co-named; the contested fact is the absent license)",
    ),
    "E-Q14 (adversarial probes, docs/FALSIFICATION-BUDGET.md)": (
        "e_q14",
        "mimov F1: the E-Q14 zero-pollution floor failure",
    ),
    "C3 (E-Q2) vs E-Q16 dense sigma phase table": (
        "c3_e_q2",
        "mimov F2: claim C3 on E-Q2 (E-Q16's table co-named as the conflicting "
        "evidence)",
    ),
    "C1 / E-Q13 (twin-delivery bytes-gain, cached-port caveat)": (
        "c1_e_q13",
        "mimov F3: claim C1 on E-Q13",
    ),
    "E-Q9/E-Q11/E-Q12 (chainless-by-registered-decision)": (
        "e_q9_11_12",
        "mimov F4: the E-Q9/11/12 chainless set",
    ),
    "E-Q16 run-1 rows (16x16 T=100,000 harness fix)": (
        "e_q16",
        "mimov F5: the E-Q16 measurement wave / its chain",
    ),
    "qthe-core/ PROVENANCE.txt + docs/ADOPTION-KIT.md (no LICENSE)": (
        "repo_license",
        "mimov F6: the repository-level missing-LICENSE gap",
    ),
    "E-Q14": (
        "e_q14",
        "muse F1: the E-Q14 zero-pollution floor failure",
    ),
    "E-Q9/E-Q11/E-Q12": (
        "e_q9_11_12",
        "muse F2: the E-Q9/11/12 chainless set",
    ),
    "E-Q16": (
        "e_q16",
        "muse F3: the E-Q16 measurement wave / its chain",
    ),
    "THE THREE HONEST GAPS": (
        "repo_license",
        "muse F4: the repository-level missing-LICENSE gap",
    ),
    "cross-implementation C99 port": (
        "cimpl_c99_sealer",
        "muse F5: the C99 sealer (crossimpl/c/)",
    ),
    "E-Q16 measurement wave (16x16 T=100,000) and scripts/probe_gate.mjs PG4 determinism witness": (
        "e_q16",
        "nemotron F1: the E-Q16 measurement wave / its chain (probe_gate.mjs "
        "PG4 co-named as the determinism witness; not keyed)",
    ),
    "C3 (E-Q2) vs E-Q16 dense sigma phase table": (
        "c3_e_q2",
        "mimov F2 AND nemotron F2 (byte-identical sealed text, two seats): "
        "claim C3 on E-Q2, with E-Q16's dense sigma table co-named as the "
        "conflicting evidence",
    ),
    "M4 wormhole table (64-slot, content-addressed, last-writer-wins) and E-Q14 provenance autopsy": (
        "m4_wormhole_table",
        "nemotron F3: the M4 table (E-Q14 autopsy co-named as evidence)",
    ),
    "E-Q9, E-Q11, E-Q12 (chainless-by-registered-decision)": (
        "e_q9_11_12",
        "nemotron F4: the E-Q9/11/12 chainless set",
    ),
    "C5-prime injector repair (E-Q10, \"STANDS, definitional\")": (
        "c5p_e_q10",
        "nemotron F5: claim C5-prime on E-Q10",
    ),
    "C1 (E-Q13, chain tip d852e6ac...) intra-cell vs inter-cell porting": (
        "c1_e_q13",
        "nemotron F6: claim C1 on E-Q13",
    ),
    "THREE HONEST GAPS gap (1) NO LICENSE vs ADOPTION-KIT.md / DAY-1.md outsider path": (
        "repo_license",
        "nemotron F7: the repository-level missing-LICENSE gap",
    ),
    "M4 the 64-slot wormhole table / E-Q14 Adversarial probes": (
        "m4_wormhole_table",
        "qwen F1: the M4 table (E-Q14 co-named; the invented cache-eviction "
        "mechanism is the claim side, adjudicated invented)",
    ),
    "RESOURCE-PROFILE.md / Fixed-point plane (R8)": (
        "resource_profile",
        "qwen F2: the resource profile doc / fixed-point plane",
    ),
    "C1 intra-cell timbre (1-byte QTHE) vs inter-cell porting (2-byte tauPlane/dPlane encoding) on the twin-delivery task": (
        "c1_e_q13",
        "qwen F3: claim C1 on E-Q13 (encoding comparison)",
    ),
    "E-Q15 Reward reweighting probe": (
        "e_q15",
        "qwen F4: the E-Q15 probe",
    ),
    "qthe-core/ standalone package repository root": (
        "repo_license",
        "seed F1: the repository-level missing-LICENSE gap",
    ),
    "E-Q14 adversarial probe results": (
        "e_q14",
        "seed F2: the E-Q14 zero-pollution floor failure",
    ),
    "C99 cross-implementation sealer code (crossimpl/c/)": (
        "cimpl_c99_sealer",
        "seed F3: the C99 sealer",
    ),
    "E-Q15 reward reweighting probe results": (
        "e_q15",
        "seed F4: the E-Q15 probe",
    ),
    "C3 sigma critical scale claim and associated gifted proof": (
        "c3_e_q2",
        "seed F5: claim C3 on E-Q2 (the gifted-proof claim side)",
    ),
}

NEGATIVE_CONTROL_TEXT = (
    "FABRICATED artifact text absent from the pinned table (T5-b negative "
    "control; no seat ever wrote this)"
)


def sha256_file(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


def load_json(name):
    p = EA / name
    if not p.exists():
        raise SystemExit("FAIL-CLOSED: missing input " + str(p))
    return json.loads(p.read_text(encoding="utf-8"))


def load_jsonl(name):
    p = EA / name
    if not p.exists():
        raise SystemExit("FAIL-CLOSED: missing input " + str(p))
    out = []
    for line in p.read_text(encoding="utf-8").split("\n"):
        if line.strip():
            out.append(json.loads(line))
    return out


# ----------------------------------------------------------- part 1 parsing
def part1_artifact_path(state_text, pair_id, side):
    """Parse the artifact path AS-SAID from the sealed state_entry text.

    Formats (from scripts/build_t4c_pairs.py :: entry_text):
      'path: <p>'                                (lists A, B, C, R)
      'matched file (glob *_chain.jsonl): <p>'   (list D, the stem scanner)
    Returns (path, verbatim_line) or (None, None) => REFUSAL (R4).
    """
    for line in state_text.split("\n"):
        if line.startswith("path: "):
            return line[len("path: "):].strip(), line
        if line.startswith("matched file (glob *_chain.jsonl): "):
            return line[len("matched file (glob *_chain.jsonl): "):].strip(), line
    return None, None


# ----------------------------------------------------------- part 2 parsing
def part2_artifact_text(state_text):
    """Parse the artifact field AS-SAID from the sealed state_finding text.

    Shape (from scripts/build_t4c_pairs.py :: fkey_text):
      line 0: 'FINDING (seat: X)'
      line 1: 'severity: Y'
      line 2: 'artifact: Z'   <- what we want, verbatim
      line 3: 'finding: W'
    Fail-closed on shape; returns None => REFUSAL (R4).
    """
    lines = state_text.split("\n")
    if len(lines) < 4:
        return None
    if not lines[0].startswith("FINDING (seat: "):
        return None
    if not lines[1].startswith("severity: "):
        return None
    if not lines[2].startswith("artifact: "):
        return None
    if not lines[3].startswith("finding: "):
        return None
    return lines[2][len("artifact: "):]


def artifact_key_for(text):
    """The pinned-table lookup. Unknown text => (None, None) => REFUSAL."""
    if text is None:
        return None, None
    hit = ARTIFACT_TABLE.get(text)
    if hit is None:
        return None, None
    return hit[0], hit[1]


def subject_key(artifact_key, claim_id):
    return artifact_key + "::" + claim_id


# ------------------------------------------------------------- the retrofit
def build_retrofit():
    p1 = load_json("pairs_part1.json")
    p2 = load_json("pairs_part2.json")
    rows2 = load_jsonl("rows_part2.jsonl")
    rows_by_call = {r["call_id"]: r for r in rows2}

    if len(p1.get("pairs", [])) != 43:
        raise SystemExit("FAIL-CLOSED: pairs_part1.json holds " +
                         str(len(p1.get("pairs", []))) + " pairs, expected 43")
    if len(p2.get("pairs", [])) != 30:
        raise SystemExit("FAIL-CLOSED: pairs_part2.json holds " +
                         str(len(p2.get("pairs", []))) + " pairs, expected 30")

    refusals = []

    # ---- part 1: path-keyed subjects -------------------------------------
    p1_pairs = []
    for pr in p1["pairs"]:
        path_a, line_a = part1_artifact_path(pr["state_entry_a"], pr["pair_id"], "a")
        path_b, line_b = part1_artifact_path(pr["state_entry_b"], pr["pair_id"], "b")
        rec = {
            "pair_id": pr["pair_id"],
            "ground_truth": pr["ground_truth"],
            "path_line_a": line_a,
            "path_line_b": line_b,
        }
        if path_a is None or path_b is None:
            rec["refused"] = True
            rec["refusal_reason"] = "artifact path not parsable from the sealed state_entry text"
            refusals.append({
                "pair_id": pr["pair_id"],
                "part": 1,
                "side": "a" if path_a is None else "b",
                "reason": "artifact path not parsable from the sealed state_entry text",
                "queue": "curator",
            })
            p1_pairs.append(rec)
            continue
        ka = subject_key(path_a, PART1_CLAIM_ID)
        kb = subject_key(path_b, PART1_CLAIM_ID)
        same = ka == kb
        rec.update({
            "refused": False,
            "subject_key_a": ka,
            "subject_key_b": kb,
            "subject_claim_ids": [PART1_CLAIM_ID, PART1_CLAIM_ID],
            "same_subject": same,
            "routing": ("intra_subject_no_identity_question" if same
                        else "cross_subject_same_issue_question"),
            "predicted_relation": "same_entity" if same else "different_entity",
            "agrees_with_ground_truth": ("same_entity" if same else "different_entity") == pr["ground_truth"],
        })
        p1_pairs.append(rec)

    p1_computable = [r for r in p1_pairs if not r["refused"]]
    p1_agree = [r for r in p1_computable if r["agrees_with_ground_truth"]]

    # ---- part 2: (artifact, claim) subjects ------------------------------
    p2_pairs = []
    for pr in p2["pairs"]:
        art_a = part2_artifact_text(pr["state_finding_a"])
        art_b = part2_artifact_text(pr["state_finding_b"])
        ak_a, rcpt_a = artifact_key_for(art_a)
        ak_b, rcpt_b = artifact_key_for(art_b)
        claim_a = pr.get("subject_a")
        claim_b = pr.get("subject_b")
        rec = {
            "pair_id": pr["pair_id"],
            "ground_truth": pr["ground_truth"],
            "class": pr["class"],
            "seat_a": pr["seat_a"], "finding_id_a": pr["finding_id_a"],
            "seat_b": pr["seat_b"], "finding_id_b": pr["finding_id_b"],
            "artifact_text_a": art_a,
            "artifact_text_b": art_b,
            "claim_id_a": claim_a,
            "claim_id_b": claim_b,
        }
        missing = []
        if ak_a is None:
            missing.append("a")
        if ak_b is None:
            missing.append("b")
        if claim_a is None or claim_b is None:
            missing.append("claims")
        if missing:
            rec["refused"] = True
            rec["refusal_reason"] = ("subject key not computable in code ("
                                     + "+".join(missing) + ")")
            refusals.append({
                "pair_id": pr["pair_id"],
                "part": 2,
                "side": "both" if len(missing) > 1 else missing[0],
                "reason": rec["refusal_reason"],
                "as_said": {"a": art_a, "b": art_b},
                "queue": "curator",
            })
            p2_pairs.append(rec)
            continue
        ka = subject_key(ak_a, claim_a)
        kb = subject_key(ak_b, claim_b)
        same = ka == kb
        art_same = ak_a == ak_b
        claim_same = claim_a == claim_b
        rec.update({
            "refused": False,
            "artifact_key_a": ak_a,
            "artifact_key_b": ak_b,
            "artifact_table_receipt_a": rcpt_a,
            "artifact_table_receipt_b": rcpt_b,
            "subject_key_a": ka,
            "subject_key_b": kb,
            "subject_claim_ids": [claim_a, claim_b],
            "same_subject": same,
            "artifact_half_same": art_same,
            "claim_half_same": claim_same,
            "routing": ("intra_subject_no_identity_question" if same
                        else "cross_subject_same_issue_question"),
            "predicted_relation": "same_entity" if same else "different_entity",
            "agrees_with_ground_truth": ("same_entity" if same else "different_entity") == pr["ground_truth"],
            "artifact_half_only_prediction": "same_entity" if art_same else "different_entity",
            "artifact_half_only_agrees": ("same_entity" if art_same else "different_entity") == pr["ground_truth"],
            "claim_half_only_prediction": "same_entity" if claim_same else "different_entity",
            "claim_half_only_agrees": ("same_entity" if claim_same else "different_entity") == pr["ground_truth"],
        })
        p2_pairs.append(rec)

    p2_computable = [r for r in p2_pairs if not r["refused"]]
    p2_agree = [r for r in p2_computable if r["agrees_with_ground_truth"]]
    p2_art_agree = [r for r in p2_computable if r["artifact_half_only_agrees"]]
    p2_claim_agree = [r for r in p2_computable if r["claim_half_only_agrees"]]

    # ---- counterfactual on the three wrong merges (AS-SAID from rows) ----
    counterfactual = []
    falsifier_verdicts = []
    for pid in FALSIFIER_PAIRS:
        pr = next(x for x in p2["pairs"] if x["pair_id"] == pid)
        rec = next(x for x in p2_pairs if x["pair_id"] == pid)
        row = rows_by_call.get(pid)
        cf = {
            "pair_id": pid,
            "ground_truth": pr["ground_truth"],
            "sides_as_said": {
                "a": pr["seat_a"] + "/" + pr["finding_id_a"] + " subject '" +
                     pr["subject_a"] + "': " + pr["subject_desc_a"],
                "b": pr["seat_b"] + "/" + pr["finding_id_b"] + " subject '" +
                     pr["subject_b"] + "': " + pr["subject_desc_b"],
            },
            "sealed_score_as_said": None,
        }
        if row is not None:
            al = row["answers"]["alignment"]
            cf["sealed_score_as_said"] = {
                "model_served": row["model_served"],
                "score": al["score"],
                "confidence": al["confidence"],
                "probabilities": al["probabilities"],
                "path_match_noul": row["answers"]["path_match"]["noul"],
                "label_match_noul": row["answers"]["label_match"]["noul"],
                "note": "sealed in rows_part2.jsonl, call_id " + pid +
                        " (AS-SAID; the Score merged a known-different pair)",
            }
        if rec["refused"]:
            cf["counterfactual_verdict"] = "NOT EVALUABLE -- subject key refused (R4)"
            falsifier_verdicts.append("refused")
        else:
            blocked = not rec["same_subject"]
            cf["subject_key_a"] = rec["subject_key_a"]
            cf["subject_key_b"] = rec["subject_key_b"]
            cf["counterfactual_verdict"] = (
                "BLOCKED -- subject_key_a != subject_key_b; under R3 the "
                "same-entity question is BARRED for this pair (cross-subject "
                "routing); the Score would never have been asked 'same entity?'"
                if blocked else
                "NOT BLOCKED -- subject keys equal; the schema would NOT have "
                "prevented this merge")
            cf["decomposition"] = {
                "artifact_half_same": rec["artifact_half_same"],
                "claim_half_same": rec["claim_half_same"],
                "reading": (
                    "artifact half EQUAL, claim half DIFFERS: the two sides "
                    "name the same experiment artifact but contest different "
                    "claims -- an artifact-only key would NOT have blocked "
                    "this pair; the blocking power is the claim_id half"
                    if (rec["artifact_half_same"] and not rec["claim_half_same"])
                    else "see halves above"),
            }
            falsifier_verdicts.append("blocked" if blocked else "not_blocked")
        counterfactual.append(cf)

    if "refused" in falsifier_verdicts:
        falsifier = ("NOT-YET: falsifier pair refused -- the validator cannot "
                     "express the three wrong merges as subject-key mismatches")
        exit_code = 2
    elif "not_blocked" in falsifier_verdicts:
        falsifier = ("NOT SUFFICIENT: at least one wrong merge has EQUAL "
                     "subject keys -- the schema would not have blocked it")
        exit_code = 3
    else:
        falsifier = ("EXPRESSIBLE: all three wrong merges (p2-D02/D03/D06) "
                     "retro-compute to subject-key MISMATCHES -- under R3 "
                     "their same-entity questions would have been barred "
                     "(cross-subject routing), so the merges could not have "
                     "happened as same-entity answers")
        exit_code = 0

    # ---- refusal-rule negative control (proves R4 fires) -----------------
    ak_nc, _ = artifact_key_for(NEGATIVE_CONTROL_TEXT)
    negative_control = {
        "fabricated_artifact_text": NEGATIVE_CONTROL_TEXT,
        "table_lookup_result": ak_nc,
        "refused": ak_nc is None,
        "receipt": ("R4 negative control: a fabricated artifact text absent "
                    "from the pinned table MUST yield no key (refusal -> "
                    "curator queue), never a guess. "
                    + ("CONTROL PASSES." if ak_nc is None else
                       "CONTROL FAILS -- the validator guessed."))
    }
    if ak_nc is not None:
        raise SystemExit("FAIL-CLOSED: refusal-rule negative control failed")

    retrofit = {
        "lane": "T5-b",
        "artifact": "situations/entity_alignment/subject_key_retrofit.json",
        "law": "docs/SUBJECT-KEY.md",
        "schema": "situations/entity_alignment/subject_key_schema.json",
        "validator": "situations/entity_alignment/subject_key_validator.py",
        "validator_version": VALIDATOR_VERSION,
        "key_rule": "subject_key = artifact_key + '::' + claim_id; same_subject "
                    "<-> string equality; computed in code, never by a model",
        "inputs_sha256": {
            "pairs_part1.json": sha256_file(EA / "pairs_part1.json"),
            "pairs_part2.json": sha256_file(EA / "pairs_part2.json"),
            "rows_part2.jsonl": sha256_file(EA / "rows_part2.jsonl"),
        },
        "deterministic": True,
        "part1": {
            "claim_id_rule": PART1_CLAIM_RULE,
            "pairs": p1_pairs,
            "coverage": {
                "pairs": len(p1_pairs),
                "computable": len(p1_computable),
                "refused": len(p1_pairs) - len(p1_computable),
            },
            "agreement_with_ground_truth": {
                "agree": len(p1_agree),
                "n": len(p1_computable),
                "tautology_receipt": (
                    "BY CONSTRUCTION: part-1 ground truth is registry-record "
                    "identity and the registry's own key is the path (zero "
                    "alias cases in the corpus -- the Inkling ORCH-R13 "
                    "append-only correction). Key agreement here proves "
                    "computability and routing, NOT predictive power. The one "
                    "case path-equality cannot decide (two paths, one "
                    "artifact) is the alias channel -> curator evidence, "
                    "never a model merge (SUBJECT-KEY.md R3)."),
            },
        },
        "part2": {
            "artifact_key_source": "pinned normalization table in the "
                "validator, keyed by the artifact field text VERBATIM "
                "(AS-SAID) as sealed in pairs_part2.json :: state_finding_*; "
                "texts byte-identical to situations/arena_rows_r10.jsonl",
            "claim_id_source": "pairs_part2.json :: per-pair subject_a/"
                "subject_b fields, sealed at build time BEFORE any call -- "
                "the pre-pairing subject map over the r10 adjudication record "
                "(receipts: pairs_part2.json :: subject_map_receipts)",
            "artifact_normalization_table": [
                {"artifact_text_as_said": t, "artifact_key": v[0], "receipt": v[1]}
                for t, v in ARTIFACT_TABLE.items()
            ],
            "pairs": p2_pairs,
            "coverage": {
                "pairs": len(p2_pairs),
                "computable": len(p2_computable),
                "refused": len(p2_pairs) - len(p2_computable),
            },
            "agreement_with_ground_truth": {
                "full_key": {"agree": len(p2_agree), "n": len(p2_computable),
                             "tautology_receipt": (
                    "BY CONSTRUCTION: part-2 ground truth was DEFINED as "
                    "subject-map equality, and the retro claim_id IS the "
                    "subject map -- full-key agreement is the Inkling "
                    "circularity class, receipted. It proves the schema can "
                    "EXPRESS and CARRY the distinctions (routing), not that "
                    "it discovers them (discovery is the tagger's job, "
                    "relocated to pre-registration by the law).")},
                "artifact_half_only": {
                    "agree": len(p2_art_agree), "n": len(p2_computable),
                    "receipt": (
                        "MEASURED, not by construction: the artifact half is "
                        "computed from the seats' own sealed artifact fields "
                        "via the pinned table, independently of the subject "
                        "map. Divergence from ground truth localizes exactly "
                        "where artifact identity does NOT decide the subject "
                        "-- the same-experiment cluster boundaries.")},
                "claim_half_only": {
                    "agree": len(p2_claim_agree), "n": len(p2_computable),
                    "receipt": "tautological for the same reason as the full "
                               "key (claim ids ARE the subject map)"},
            },
        },
        "counterfactual_three_wrong_merges": counterfactual,
        "refusals": refusals,
        "refusals_note": "expected empty for this corpus: the pinned table "
            "covers all 40 sealed artifact texts and every part-1 state_entry "
            "states a path or matched-file line; any non-empty entry is R4 "
            "firing lawfully (curator queue, never a model guess)",
        "refusal_rule_negative_control": negative_control,
        "falsifier_verdict": falsifier,
        "falsifier_rule": "registration Lane T5-b: if the validator cannot "
            "express the three wrong merges (p2-D02/D03/D06) as subject-key "
            "mismatches, the schema is NOT sufficient -> iterate or honest "
            "NOT-YET",
    }
    return retrofit, exit_code


def main():
    retrofit, exit_code = build_retrofit()
    # determinism self-check: a second build must serialize identically
    retrofit2, exit_code2 = build_retrofit()
    s1 = json.dumps(retrofit, indent=1, ensure_ascii=False)
    s2 = json.dumps(retrofit2, indent=1, ensure_ascii=False)
    if s1 != s2 or exit_code != exit_code2:
        raise SystemExit("FAIL-CLOSED: determinism self-check failed")
    retrofit["determinism_selfcheck"] = "two independent builds serialized byte-identically"

    if OUT_PATH.exists():
        existing = OUT_PATH.read_text(encoding="utf-8")
        new = s1 + "\n"
        if existing != new:
            raise SystemExit(
                "FAIL-CLOSED: " + str(OUT_PATH) + " already exists and the "
                "re-derivation DIFFERS (append-only discipline for derived "
                "artifacts) -- receipt the change as a new validator version "
                "instead of silently overwriting")
    OUT_PATH.write_text(s1 + "\n", encoding="utf-8")

    cov1 = retrofit["part1"]["coverage"]
    cov2 = retrofit["part2"]["coverage"]
    agr1 = retrofit["part1"]["agreement_with_ground_truth"]
    agr2 = retrofit["part2"]["agreement_with_ground_truth"]
    print("T5-b subject-key retrofit written: " + str(OUT_PATH))
    print("  part 1 coverage: " + str(cov1["computable"]) + "/" + str(cov1["pairs"]) +
          " computable, " + str(cov1["refused"]) + " refused")
    print("  part 1 key-vs-truth: " + str(agr1["agree"]) + "/" + str(agr1["n"]) +
          " (tautological -- receipted)")
    print("  part 2 coverage: " + str(cov2["computable"]) + "/" + str(cov2["pairs"]) +
          " computable, " + str(cov2["refused"]) + " refused")
    print("  part 2 full-key-vs-truth: " + str(agr2["full_key"]["agree"]) + "/" +
          str(agr2["full_key"]["n"]) + " (tautological -- receipted)")
    print("  part 2 artifact-half-only vs truth: " + str(agr2["artifact_half_only"]["agree"]) +
          "/" + str(agr2["artifact_half_only"]["n"]) + " (MEASURED)")
    print("  part 2 claim-half-only vs truth: " + str(agr2["claim_half_only"]["agree"]) +
          "/" + str(agr2["claim_half_only"]["n"]) + " (tautological -- receipted)")
    for cf in retrofit["counterfactual_three_wrong_merges"]:
        print("  counterfactual " + cf["pair_id"] + ": " + cf["counterfactual_verdict"])
    print("  refusals: " + str(len(retrofit["refusals"])) +
          " (negative control: " +
          ("PASSES" if retrofit["refusal_rule_negative_control"]["refused"] else "FAILS") + ")")
    print("  FALSIFIER: " + retrofit["falsifier_verdict"])
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
