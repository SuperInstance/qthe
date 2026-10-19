#!/usr/bin/env python3
# situations/embedding_r30/eq40_build_wordmap.py — E-Q40 lane T21-a: build and
# SEAL the lexical-sensitivity census's word map BEFORE any embed call (the
# registration law). Two ingredients, both frozen by this commit:
#   (1) the SALIENCE RULE (mechanical, deterministic): TF-IDF top-6 per record
#       over the sealed E-Q21 20-record corpus;
#   (2) the SUBSTITUTION TABLE (hand-crafted, one near-synonym per sampled
#       word, POS-class and identifier discipline) + POS classes.
# Echo flags and echo-axes are then COMPUTED mechanically against the frozen
# E-Q25 12-question map text (surface/variant word-boundary match). Nothing
# in this file depends on any model output — sealing before spend is safe.
import json
import math
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
R25 = ROOT / "situations" / "tripwire_r25"

corpus = json.loads((R23 / "corpus.json").read_text())
records = corpus["records"]

# ── the frozen salience rule ────────────────────────────────────────────────
# tokens: [A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)*  (hyphenated compounds and
# experiment ids stay whole; digit-led tokens like 64x64 are excluded)
TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*")
# the frozen stopword list (standard English function words + contractions)
STOP = set("""the a an and or but if then than that this these those of in on at
to for from by with without into onto over under above below between among
through during before after while when where which who whom whose what how why
not no nor so as is are was were be been being am do does did done have has had
having will would shall should can could may might must it its it's they them
their there here he she his her we us our you your i me my one two three four
five six seven eight nine ten also only just very much more most less least
each every any all some none own same other another such per via etc within
upon about against because again further once s t d ll m o re ve y ain aren
couldn didn doesn don hadn hasn haven isn ma mightn mustn needn shan shouldn
wasn weren won wouldn""".split())
MIN_LEN = 3


def tokens(text):
    return TOKEN_RE.findall(text)


df = {}
first_pos = {}
for rec in records:
    seen = set()
    for i, tok in enumerate(tokens(rec["text"])):
        low = tok.lower()
        seen.add(low)
        first_pos.setdefault(low, {}).setdefault(rec["id"], i)
    for low in seen:
        df[low] = df.get(low, 0) + 1


def top6(rec):
    toks = [t.lower() for t in tokens(rec["text"])]
    counts = {}
    for low in toks:
        counts[low] = counts.get(low, 0) + 1
    scored = []
    for low, tf in counts.items():
        if len(low) < MIN_LEN or low in STOP:
            continue
        d = df.get(low, 0)
        if d == 0 or d == len(records):
            continue
        score = tf * math.log(len(records) / d)
        scored.append((round(score, 4), -first_pos[low][rec["id"]], low))
    scored.sort(reverse=True)
    return [low for _, _, low in scored[:6]]


# boundary semantics CONSISTENT WITH THE TOKENIZER: a surface form occurs
# where it is not glued to another alnum char OR A HYPHEN ("cell" does not
# occur inside "intra-cell" — the tokenizer makes that one token; "fold" does
# not occur inside "folded"; "e-q1" does not occur inside "e-q18").
def word_pattern(word):
    return re.compile(r"(?<![A-Za-z0-9-])" + re.escape(word) + r"(?![A-Za-z0-9-])", re.IGNORECASE)


# ── the frozen substitution table + POS classes (hand-crafted, T21-a) ───────
# discipline: same word class, near-synonym in context, single token. For
# IDENT-class tokens (experiment ids, versioned names, proper names) ANY swap
# changes the reference — that is the nature of identifiers, receipted here.
# Number words have no exact synonym: myriad = 10^4 exactly (semantics kept).
SUBS = {
    "N1": {"cells": ("units", "NOUN"), "runs": ("trials", "NOUN"),
           "wormholes": ("tunnels", "NOUN"), "e-q1": ("e-q3", "IDENT"),
           "alignment": ("correspondence", "NOUN"), "planted": ("seeded", "VERB")},
    "N2": {"sidecar": ("companion", "NOUN"), "table": ("registry", "NOUN"),
           "twin": ("mirror", "NOUN"), "slot": ("bucket", "NOUN"),
           "dead": ("defunct", "ADJ"), "layer": ("tier", "NOUN")},
    "N3": {"hierarchical": ("layered", "ADJ"), "fold": ("bend", "NOUN"),
           "provenance": ("lineage", "NOUN"), "population": ("occupancy", "NOUN"),
           "worse": ("poorer", "ADJ"), "times": ("steps", "NOUN")},
    "N4": {"semantics": ("definitions", "NOUN"), "row-major": ("scanline", "ADJ"),
           "writes": ("stores", "VERB"), "value": ("quantity", "NOUN"),
           "slot": ("bucket", "NOUN"), "e-q6": ("e-q12", "IDENT")},
    "N5": {"artifact": ("byproduct", "NOUN"), "property": ("trait", "NOUN"),
           "families": ("branches", "NOUN"), "kernel": ("core", "NOUN"),
           "e-q8": ("e-q14", "IDENT"), "same-slot": ("same-position", "ADJ")},
    "P1": {"timbre": ("tonality", "NOUN"), "porting": ("transplanting", "VERB"),
           "cell": ("unit", "NOUN"), "rule": ("law", "NOUN"),
           "e-q13": ("e-q16", "IDENT"), "byte": ("octet", "NOUN")},
    "P2": {"sigma": ("spread", "NOUN"), "bridge": ("linkage", "NOUN"),
           "critical": ("pivotal", "ADJ"), "scale": ("magnitude", "NOUN"),
           "formation": ("genesis", "NOUN"), "completion": ("finish", "NOUN")},
    "P3": {"threshold": ("cutoff", "NOUN"), "useful": ("valuable", "ADJ"),
           "transfer": ("shipment", "NOUN"), "phase": ("stage", "NOUN"),
           "cascade": ("waterfall", "NOUN"), "wave": ("ripple", "NOUN")},
    "P4": {"field": ("grid", "NOUN"), "thousand": ("myriad", "NUM"),
           "held": ("kept", "VERB"), "harness": ("rig", "NOUN"),
           "sigma": ("spread", "NOUN"), "run": ("trial", "NOUN")},
    "P5": {"neighbors": ("adjacencies", "NOUN"), "toward": ("towards", "ADP"),
           "update": ("refresh", "NOUN"), "add": ("contribute", "VERB"),
           "subtract": ("deduct", "VERB"), "accumulator": ("collector", "NOUN")},
    "Q1": {"c11": ("c10", "IDENT"), "blur": ("haze", "NOUN"),
           "certified": ("accredited", "ADJ"), "quantum": ("wave-mechanical", "ADJ"),
           "tick": ("step", "NOUN"), "lives": ("survives", "VERB")},
    "Q2": {"certificate": ("credential", "NOUN"), "root": ("base", "NOUN"),
           "equal": ("identical", "ADJ"), "conditioned": ("treated", "VERB"),
           "bits": ("digits", "NOUN"), "toeplitz": ("circulant", "IDENT")},
    "Q3": {"floor": ("baseline", "NOUN"), "ladder": ("staircase", "NOUN"),
           "e-q20b": ("e-q20c", "IDENT"), "burn-in": ("warmup", "NOUN"),
           "credits": ("funds", "NOUN"), "relaxation": ("cooling", "NOUN")},
    "Q4": {"channel": ("conduit", "NOUN"), "wormholes": ("tunnels", "NOUN"),
           "e-q20c": ("e-q18", "IDENT"), "plateau-mechanism": ("mesa-mechanism", "NOUN"),
           "ablation": ("dissection", "NOUN"), "arms": ("branches", "NOUN")},
    "Q5": {"grid": ("lattice", "NOUN"), "r9-era": ("r7-era", "IDENT"),
           "superseded": ("retired", "VERB"), "graph-v1": ("graph-v2", "IDENT"),
           "emulator": ("simulator", "NOUN"), "balance": ("evenness", "NOUN")},
    "A1": {"tiles": ("patches", "NOUN"), "share": ("allotment", "NOUN"),
           "stable": ("steady", "ADJ"), "starvation": ("deprivation", "NOUN"),
           "heap": ("stack", "NOUN"), "cap": ("ceiling", "NOUN")},
    "A2": {"reweighting": ("rebalancing", "NOUN"), "quality-correlated": ("merit-linked", "ADJ"),
           "plain": ("simple", "ADJ"), "max-of-accepted": ("best-of-accepted", "NOUN"),
           "e-q15": ("e-q19", "IDENT"), "reward": ("payoff", "NOUN")},
    "A3": {"question": ("query", "NOUN"), "batching": ("grouping", "NOUN"),
           "guard": ("sentry", "NOUN"), "cheaper": ("less-costly", "ADJ"),
           "state": ("status", "NOUN"), "economics": ("financials", "NOUN")},
    "A4": {"price": ("expense", "NOUN"), "recall": ("sensitivity", "NOUN"),
           "cheap": ("inexpensive", "ADJ"), "battery": ("suite", "NOUN"),
           "percent": ("pct", "NOUN"), "verify-tier": ("check-tier", "NOUN")},
    "A5": {"seat": ("bench", "NOUN"), "families": ("branches", "NOUN"),
           "panel": ("board", "NOUN"), "record": ("account", "NOUN"),
           "different": ("distinct", "ADJ"), "harmony": ("accord", "NOUN")},
}

# ── the frozen echo rule (mechanical) ───────────────────────────────────────
# A word ECHOES the question map iff the word (or its simple s-variant:
# word+s / word-minus-trailing-s) matches at a word boundary in the frozen
# E-Q25 12-question map text. Known limitation, receipted: lemma-family
# overlaps that are neither surface nor s-variants (neighbors vs neighborhood)
# do NOT count — the rule is deliberately mechanical.
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


QMAP = build_questions()
QMAP_TEXT = json.dumps(QMAP).lower()
ALL_KEYS = [ax for ax, _ in AXES] + [dx for dx, _ in DECOYS]


def echo_axes(word):
    variants = {word}
    if not word.endswith("s"):
        variants.add(word + "s")
    elif len(word) > 3:
        variants.add(word[:-1])
    hits = []
    for key in ALL_KEYS:
        blob = (key + " " + json.dumps(QMAP[key])).lower()
        if any(re.search(r"\b" + re.escape(v) + r"\b", blob) for v in variants):
            hits.append(key)
    return hits


def counts_tf(rec, word):
    return sum(1 for t in tokens(rec["text"]) if t.lower() == word)


# ── assemble + verify the word map ──────────────────────────────────────────
out = {"experiment": "E-Q40", "law": "the sealed lexical-sensitivity census word map (TF-IDF top-6 per record x hand-crafted single-token near-synonym substitutions; POS classes; mechanical echo flags vs the frozen E-Q25 12-question map)",
       "salience_rule": "tokens [A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)* lowercased; stopword list + min length 3 frozen in eq40_build_wordmap.py; score = tf_in_record * ln(20/df_across_records); top 6 by (score desc, first-occurrence asc, token asc)",
       "substitution_rule": "ALL occurrences of the exact surface form (case-insensitive) replaced, first-letter case preserved per occurrence; occurrence count receipted per row",
       "echo_rule": "word-boundary match of {word, word+s, word-minus-s} in the frozen E-Q25 12-question map text (key + question json); mechanical, limitations receipted",
       "records": {}}

n_words = 0
for rec in records:
    rid = rec["id"]
    sampled = top6(rec)
    table = SUBS[rid]
    assert sampled == list(table.keys()), f"{rid}: sampler/substitution mismatch: {sampled} vs {list(table.keys())}"
    rows = []
    text = rec["text"]
    for word in sampled:
        sub, pos = table[word]
        pat = word_pattern(word)
        occ = pat.findall(text)
        assert len(occ) >= 1, f"{rid}/{word}: no occurrences?!"
        # the boundary-aware count must equal the tokenizer's tf (F2 floor)
        assert len(occ) == counts_tf(rec, word), \
            f"{rid}/{word}: boundary count {len(occ)} != tokenizer tf {counts_tf(rec, word)}"
        # F2 pre-check: the substitution must be applyable and reversible
        ea, es = echo_axes(word), echo_axes(sub)
        rows.append({
            "word": word, "substitute": sub, "pos": pos,
            "occurrences": len(occ),
            "tf": len(occ), "df": df[word],
            "echo_orig": bool(ea), "echo_axes_orig": ea,
            "echo_sub": bool(es), "echo_axes_sub": es,
        })
        n_words += 1
    out["records"][rid] = {"family": rec["family"], "words": rows}

out["n_words"] = n_words
out["n_echo"] = sum(1 for rid in out["records"] for w in out["records"][rid]["words"] if w["echo_orig"])
out["pos_counts"] = {}
for rid in out["records"]:
    for w in out["records"][rid]["words"]:
        out["pos_counts"][w["pos"]] = out["pos_counts"].get(w["pos"], 0) + 1

(HERE / "eq40_word_map.json").write_text(json.dumps(out, indent=1))
print(f"[wordmap] sealed {n_words} words across {len(out['records'])} records; "
      f"echo {out['n_echo']}; pos {out['pos_counts']}")
