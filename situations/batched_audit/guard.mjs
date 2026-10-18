#!/usr/bin/env node
// situations/batched_audit/guard.mjs -- ORCH-R14 Lane T5-a: the static
// batched-call guard for every typesafe.ai /v1/systemone POST site in the
// qthe repo. ZERO dependencies (node:fs / node:path only). ZERO network.
//
// WHAT IT ENFORCES (per the frozen T5-a registration):
//   Every discovered systemone call site must either
//     (a) BATCH: build its questions as a MAP with multiple keys via an
//         aggregation loop (for ... : questions[<computed key>] = {...}),
//         or pass a questions literal with more than one key; OR
//     (b) CARRY A RECEIPTED EXEMPTION: a comment tag
//           // QUILT:BATCH-EXEMPT: <reason>     (JS-style)   or
//           # QUILT:BATCH-EXEMPT: <reason>     (Python-style)
//         within 15 lines above the single-question construction, documented
//         in situations/batched_audit/audit.md.
//   A site that does neither -> exit 1 with a loud message.
//
// HARD-CODED EXPECTATIONS (beyond the generic rule):
//   - situations/jev_judge.py BATCHES PER SEAT: build_call(seat_row)
//     aggregates 3 questions per finding in a `for f in findings:` loop, and
//     cmd_judge issues ONE call per seat row (call_id r10-judge-<seat>).
//   - situations/jev_triage.py (the standing r12+ triage layer): stage 1
//     reuses jev_judge.build_call per seat; stage 2 groups by LOCATED FILE
//     (key = secs[0]["path"], capped at GROUP_CAP per call) and aggregates
//     one Choice per finding.
//   - situations/sde_cascade/run_cascade.py GROUPS ITEMS: groups.setdefault(
//     (it["source"], it["group"]), []).append(it); the ACTUAL GROUP KEY is --
//       r10 arm:  group = seat            (the guest itself: per-guest) 
//       r11 arm:  group = seat            (the guest itself: per-guest)
//       grounding arm: group = "claims-g%d" % (i // 8)  (fixed 8-claim
//         chunks of the claims corpus; that corpus has NO guest axis --
//         receipted in audit.md with the counterfactual economics)
//     -- and build_call(group, items, briefing) aggregates 7 nouls per item
//     + 1 __overall__ per group.
//
// FAIL-CLOSED:
//   - Zero discovered call sites -> FAIL (the corpus is known non-empty).
//   - A site whose questions shape cannot be statically determined -> FAIL
//     ("unverifiable" is a violation, not a pass).
//   - The guard skips exactly ONE file: itself (its own source contains the
//     discovery patterns). Receipted here; audit.md documents the skip.
//
// Comment lines (# or //) are blanked before scanning for question-map
// literals, so docstring/comment examples of the API shape are not mistaken
// for call sites; the exemption-tag search runs on the RAW text.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GUARD_SELF = resolve(fileURLToPath(import.meta.url));
// guard lives at <repo>/situations/batched_audit/guard.mjs -> repo root is two
// levels up from this file's directory.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const CODE_EXTS = new Set([".py", ".mjs", ".js", ".ts", ".sh", ".c", ".h"]);
const SKIP_DIRS = new Set([".git", "node_modules", "__pycache__"]);

const ENDPOINT_RE = /api\.typesafe\.ai\/v1\/systemone/;
const CLIENT_CALL_RE = /\b(?:http_post|call_and_seal|seal_call)\s*\(/;
const EXEMPT_TAG_RE = /(?:\/\/|#)\s*QUILT:BATCH-EXEMPT:\s*(.+)/;
const QUESTIONS_LITERAL_RE = /["']questions["']\s*:\s*\{/g;
const FOR_PY_RE = /^\s*for\s+[A-Za-z_][A-Za-z0-9_,\s]*\s+in\s+[^\n]+:\s*$/;
const FOR_JS_RE = /^\s*for\s*\(.*\)\s*\{\s*$/;
// Map-assign into a questions dict. The key expression may itself contain
// brackets (questions[c["id"] + "__verdict"] = {), so the key matcher is
// .+ up to the LAST bracket before "= {" on that line.
const MAP_ASSIGN_RE = /^\s*(?:questions|q|qs)\[.+\]\s*=\s*\{/;

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (resolve(p) === GUARD_SELF) continue; // self-skip, receipted above
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out);
      continue;
    }
    const dot = name.lastIndexOf(".");
    if (dot > 0 && CODE_EXTS.has(name.slice(dot))) out.push(p);
  }
  return out;
}

function blankComments(lines) {
  // Blank comment-only lines but PRESERVE line numbers (tag lookup uses raw).
  return lines.map((l) => {
    const t = l.trim();
    return t.startsWith("#") || t.startsWith("//") ? "" : l;
  });
}

function extractBraced(text, openIdx) {
  // text[openIdx] === "{"; return the body inside the outer braces.
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(openIdx + 1, i);
    }
  }
  return null; // unbalanced -> caller treats as unverifiable
}

function countTopLevelKeys(body) {
  let depth = 0;
  let keys = 0;
  let seenContent = false;
  let inStr = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inStr) {
      if (ch === inStr && body[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      if (depth === 0) seenContent = true;
      continue;
    }
    if (ch === "{" || ch === "[") {
      depth++;
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth--;
      continue;
    }
    if (depth === 0) {
      if (ch === ",") keys++;
      else if (!/\s/.test(ch)) seenContent = true;
    }
  }
  if (!seenContent) return 0;
  return keys + 1;
}

function lineOfIndex(text, idx) {
  let n = 1;
  for (let i = 0; i < idx && i < text.length; i++) if (text[i] === "\n") n++;
  return n;
}

function hasAggregation(rawLines) {
  // Find every map-assign into a questions dict; for each, look BACKWARD up
  // to 40 lines for the nearest for-header (innermost enclosing loop in
  // Python). Reporting the assign line + its for-header gives an accurate
  // receipt (a forward scan can attribute an assign to an unrelated earlier
  // loop; a farthest-back scan mis-attributes across function boundaries).
  for (let j = 0; j < rawLines.length; j++) {
    if (!MAP_ASSIGN_RE.test(rawLines[j])) continue;
    for (let i = j - 1; i >= Math.max(0, j - 40); i--) {
      if (FOR_PY_RE.test(rawLines[i]) || FOR_JS_RE.test(rawLines[i])) {
        return { line: i + 1, hit: rawLines[j].trim(), assignLine: j + 1 };
      }
    }
  }
  return null;
}

function analyze(file) {
  const raw = readFileSync(file, "utf8");
  const rawLines = raw.split("\n");
  const code = blankComments(rawLines).join("\n");

  const agg = hasAggregation(rawLines);

  // single-question literal constructions (comment-stripped)
  const singleSites = [];
  let m;
  QUESTIONS_LITERAL_RE.lastIndex = 0;
  while ((m = QUESTIONS_LITERAL_RE.exec(code)) !== null) {
    const openIdx = m.index + m[0].length - 1;
    const body = extractBraced(code, openIdx);
    if (body === null) {
      singleSites.push({ line: lineOfIndex(code, m.index), keys: null, tagged: false });
      continue;
    }
    const keys = countTopLevelKeys(body);
    if (keys === 1) {
      const ln = lineOfIndex(code, m.index);
      // exemption tag within 15 RAW lines above (tags are comments; the
      // comment-stripped scan cannot see them by construction)
      let tagged = false;
      let reason = null;
      for (let k = Math.max(0, ln - 16); k < ln; k++) {
        const t = EXEMPT_TAG_RE.exec(rawLines[k]);
        if (t) {
          tagged = true;
          reason = t[1].trim();
        }
      }
      singleSites.push({ line: ln, keys, tagged, reason });
    }
  }

  const isTransport =
    /def\s+http_post\s*\(/.test(raw) &&
    (/def\s+call_and_seal\s*\(/.test(raw) || /urlopen\s*\(/.test(raw)) &&
    singleSites.length === 0;

  return { raw, rawLines, agg, singleSites, isTransport };
}

// ---- hard-coded expectations --------------------------------------------

function expect(file, substrings, what) {
  const raw = readFileSync(file, "utf8");
  const missing = substrings.filter((s) => !raw.includes(s));
  if (missing.length) {
    return {
      ok: false,
      msg:
        "HARD EXPECTATION FAILED for " + file + " (" + what + "):\n" +
        missing.map((s) => "  missing: " + JSON.stringify(s)).join("\n"),
    };
  }
  return { ok: true, msg: "hard expectation OK: " + file + " -- " + what };
}

// ---- main ----------------------------------------------------------------

const files = walk(REPO_ROOT, []);
const sites = [];
for (const f of files) {
  const raw = readFileSync(f, "utf8");
  if (ENDPOINT_RE.test(raw) || CLIENT_CALL_RE.test(raw)) sites.push(f);
}

const lines = [];
let failures = 0;

lines.push("QUILT T5-a batched-call guard -- repo: " + REPO_ROOT);
lines.push("discovery: endpoint literal OR http_post(/call_and_seal(/seal_call( ; exts " +
           [...CODE_EXTS].join(" ") + " ; skipping .git/node_modules/__pycache__ + this guard file");
lines.push("call-site files discovered: " + sites.length);
lines.push("");

if (sites.length === 0) {
  console.error("GUARD FAIL (fail-closed): ZERO systemone call sites discovered -- the qthe corpus is known non-empty (jev_judge.py, jev_triage.py, sde_cascade/run_cascade.py, grounding_loop/*). The discovery patterns are broken or the sites were deleted. Refusing to pass.");
  process.exit(1);
}

for (const f of sites) {
  const rel = f.slice(REPO_ROOT.length + 1);
  const a = analyze(f);
  const untagged = a.singleSites.filter((s) => !s.tagged);
  let verdict;
  if (untagged.length > 0) {
    verdict = "VIOLATION";
    failures++;
  } else if (a.agg && a.singleSites.every((s) => s.tagged)) {
    verdict = a.singleSites.length ? "BATCHED (with exempt probe(s))" : "BATCHED";
  } else if (a.singleSites.length > 0 && a.singleSites.every((s) => s.tagged)) {
    verdict = "EXEMPT (receipted)";
  } else if (a.isTransport) {
    verdict = "TRANSPORT-ONLY (shared client; formulates no question map of its own)";
  } else {
    verdict = "UNVERIFIABLE (no aggregation loop, no questions literal, not a transport)";
    failures++;
  }
  lines.push("site: " + rel);
  if (a.agg) lines.push("  aggregation loop: for-header line " + a.agg.line +
                        " -> questions-map assign line " + a.agg.assignLine +
                        " :: " + JSON.stringify(a.agg.hit));
  else lines.push("  aggregation loop: NONE FOUND");
  if (a.singleSites.length === 0) lines.push("  single-question literals: none");
  for (const s of a.singleSites) {
    lines.push("  single-question literal: line " + s.line +
               " (" + (s.keys === null ? "UNBALANCED braces" : s.keys + " top-level key(s)") + ")" +
               (s.tagged ? " -- EXEMPT: " + s.reason : " -- NO EXEMPTION TAG"));
  }
  lines.push("  verdict: " + verdict);
  lines.push("");
}

// hard-coded expectations (spec: jev_judge.py and run_cascade.py specifically;
// jev_triage.py added as the standing r12+ tool)
const hard = [
  expect(join(REPO_ROOT, "situations", "jev_judge.py"), [
    "def build_call(seat_row",
    "for f in findings:",
    'questions[f"{fid}__class"] = {',
    "for seat in seats:",
    "call = build_call(seat)",
    'call_id = f"r10-judge-{seat.get(\'seat\')}"',
  ], "batches PER SEAT: build_call(seat_row) aggregates 3 questions per finding (for f in findings:), and cmd_judge makes ONE call per seat row (call_id r10-judge-<seat>) -- sealed rows situations/jev_judgments_r10.jsonl: 7 seat rows, question_count 12/15/15/18/18/21/21 = 120 questions"),
  expect(join(REPO_ROOT, "situations", "sde_cascade", "run_cascade.py"), [
    "def build_call(group",
    "for it in items:",
    'questions[qid_base + "__" + field] = {',
    'groups.setdefault((it["source"], it["group"]), []).append(it)',
    "for (source, group), gitems in sorted(groups.items()):",
    "call = build_call(group, gitems, briefing)",
    '"group": seat,',
    '"group": "claims-g%d" % (i // 8),',
  ], "GROUPS ITEMS: groups.setdefault((source, group)) + one build_call per group; ACTUAL GROUP KEY: r10/r11 arms -> the seat (the guest itself, per-guest); grounding arm -> fixed 8-claim chunks claims-g<i//8> of the claims corpus which has NO guest axis (receipted in audit.md with counterfactual economics)"),
  expect(join(REPO_ROOT, "situations", "jev_triage.py"), [
    "call = jev_judge.build_call(s)",
    "for s in seats:",
    'key = secs[0]["path"] if secs else "__nosection__"',
    "groups.setdefault(key, []).append(mem)",
    "for i in range(0, len(members), GROUP_CAP):",
    'questions[base + "__verdict"] = {',
  ], "standing triage: stage 1 reuses jev_judge.build_call PER SEAT; stage 2 groups by LOCATED FILE (key = secs[0][\"path\"]), GROUP_CAP-capped, one Choice per finding (mixed-seat groups receipted in audit.md with measured economics: per-seat regrouping would cost ~40% MORE, not less)"),
];

for (const h of hard) {
  lines.push(h.msg);
  if (!h.ok) failures++;
}
lines.push("");

if (failures > 0) {
  lines.push("GUARD FAIL: " + failures + " violation(s)/expectation failure(s) above.");
  console.error(lines.join("\n"));
  console.error("\nLOUD FAILURE: a systemone call site regressed to un-batched (or a hard expectation broke). Fix the site to aggregate a multi-key questions map, or add a receipted // QUILT:BATCH-EXEMPT: tag documented in situations/batched_audit/audit.md.");
  process.exit(1);
}

lines.push("GUARD PASS: " + sites.length + " call-site file(s); all batched, exempt-with-receipt, or transport-only; hard expectations hold.");
console.log(lines.join("\n"));
process.exit(0);
