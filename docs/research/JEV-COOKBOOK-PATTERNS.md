# JEV-COOKBOOK-PATTERNS — the typesafe.ai cookbooks, deep-dived for the qthe fleet

> Research artifact, Task 2-a. Sources: every page of https://docs.typesafe.ai/cookbooks
> plus `primitives.md` (+ choice/score/noul/box/advanced), `api.md`, `confidence.md`,
> `models.md`, `model-jaggedness/jev-1.13.md`, and the four `patterns/` pages, all
> fetched from the live docs (index at https://docs.typesafe.ai/llms.txt). The count is
> **20 cookbooks in 5 groups** (6 LLMs-and-agents, 3 classification, 4 extraction,
> 3 search-and-matching, 4 techniques) — the fleet's prior note
> (`docs/RESEARCH-DECISION-MODELS.md`) said "18 recipes" and covered four patterns at
> summary level; this note goes deep on all twenty and complements, not replaces, it.

## §0 The one law this document is written under

**A briefing-only judge is first-pass triage only.** The fleet priced it: a Jev call
that received only a *briefing* (a natural-language description of an audit finding)
rated an **invented mechanism 4/4 verified-new**. Nothing in the cookbook set
contradicts this — everything in the cookbook set *confirms* it, because every
high-value recipe in the docs grounds the model in the primary artifact before asking
it anything:

- citation check string-matches the quote **in the source document** first
  (https://docs.typesafe.ai/cookbooks/citation_check.md);
- pre-parsed extraction offers only spans **a regex found in the real text**
  (https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md);
- RAG passage scoring puts the **actual passage** in the state
  (https://docs.typesafe.ai/cookbooks/classifying_rag_passages.md);
- SDE verification puts the **source text** alongside the extraction
  (https://docs.typesafe.ai/cookbooks/sde_cascade.md).

And the vendor's own honesty page — "Jev 1.13 jaggedness,"
https://docs.typesafe.ai/model-jaggedness/jev-1.13.md — lists the failure mode our
incident instantiated, in their words: *"State is data, and `jev-1.13` does not treat
it as hostile by default. Content written to adversarially steer the model … a
deliberately misleading framing, or text that argues for its own classification, can
move the answer."* A hallucinated finding that reads like a clean briefing **is** text
that argues for its own classification. The law is not a fleet quirk; it is the
documented shape of the model.

So: every application proposed below is a **triage → grounded-verification → human**
pipeline in which Jev owns severity/actionability ranking and code owns grounding, and
no Jev output is ever allowed to assert *that an artifact exists in the repository*.

## §1 The five meta-patterns that run through all 20 cookbooks

Before the per-cookbook detail, the load-bearing regularities (all quotable to the
fetched pages):

1. **Assessment and decision are separated.** The model returns probabilities; a
   `route()`/`decide()` function **in code** owns every threshold. Guardrails:
   "TypeSafe supplies the assessment; your application owns the decision"
   (https://docs.typesafe.ai/cookbooks/llm_guardrails.md). Twitch filter: changing a
   rule re-runs `decide()` "with no new request to Jev." Entity alignment has **no
   threshold constant anywhere in the file** — the three Score levels *are* the
   decision.
2. **Verifier nouls are framed bad-true, per-field, aggregated with max.** SDE
   cascade, Appendix A: "one checkable yes/no about one field against the source …
   frame each question so the *escalate* case is the `true` case … a per-field flag
   localizes the error and stays sparse and strong; `max` ensures one confident red
   flag escalates, instead of being averaged into silence."
3. **Grounding by construction.** Where fabrication is the failure mode, the model's
   option set is built from the real artifact (regex-found spans, string-matched
   sections, line-ids into the real document). "Because TypeSafe only ever chooses
   among the spans the regex found … It cannot invent a value or transpose a digit."
4. **Confidence is the second axis.** Three bands: act / review / don't-act
   (https://docs.typesafe.ai/confidence.md). Exact formulas: Noul → none (use
   |2p−1| if you need one); Choice → `(p_max − 1/n)/(1 − 1/n)`; Score →
   probability-weighted mean level-distance vs the uniform spread. Alternatives the
   docs themselves recommend: raw `p_max`, and the top-to-second ratio.
5. **Batching is free and answer-neutral.** One request, N questions, evaluated in
   parallel against one state; "Asking a question you might not need is close to free"
   (https://docs.typesafe.ai/primitives.md). Two-request pipelines exist only when the
   second request's *options or state* depend on the first answers (skill suggestion,
   autoformat, hierarchical classification — the docs name exactly these three).

Economics snapshot used across the docs (repeated in several cookbooks): **jev-1.12 /
jev-1.13 at $0.042 per MTok input, output tokens free**; the blog adds 70–500 ms
end-to-end and RLCD training (https://typesafe.ai/blog/introducing-system-one-models-and-jev).
Model aliases: `jev-latest` → `jev-1.13.0`, `jev-preview` → `jev-1.14.0`; long context
(262k) exists behind a `TypeSafe-Danger-Zone-Long-Context` header and is "slower and
less accurate" (https://docs.typesafe.ai/models.md). Version pinning matters to us:
our receipts already attribute `typesafe@jev-1.13.0` from the response — keep doing
that, because thresholds tuned on one version are not guaranteed on the next.

One doc-drift catch, since we cite numbers: `primitives.md` says batching 13 questions
is "11.5x cheaper and 9.6x faster" while the parallel-questions cookbook itself
measured **12.2x cheaper, 10.0x faster**. Same experiment, different snapshot runs.
Treat every doc number as a dated receipt, not a constant — which is exactly our house
rule already.

---

## §2 LLMs and agents (6 cookbooks)

### 2.1 Function calling
URL: https://docs.typesafe.ai/cookbooks/function_calling.md

**Pattern.** Input: one natural-language command ("plot rolling correlation between
nvda and spy for the past month"). Code reads the target functions' type signatures
and sorts arguments into three shapes — `Literal[...]` → **Choice**, `list[Literal]` →
one **Noul per member** ("Does the user want {} in the comparison?"), `bool` → flag.
A human-written `spec.json` supplies, per argument, a *question about the idea* ("Does
the user want a plain line or candles?") plus per-option descriptions, plus a `stated`
noul ("Does the user say anything about this argument at all?") — when `stated` is no,
the argument is omitted and the function default stands. The dispatcher sends **54
questions in one request** (10 functions, 28 fillable arguments) and reads only the
chosen function's answers. `confidence` on the whole call is the **minimum** over its
judgments ("the least uncertain judgement behind that call, rather than the product …
one wrong argument is enough to spoil the result").

**Numbers (jev-1.12).** 14 demo commands; tool probability ≥ 0.82 on all; weakest
example call 0.53 ("when during the day does nvda trade the most"); "is amd tracking
nvidia lately" resolved `symbol=AMD p 0.87 / benchmark=NVDA p 0.78` because the spec
spells out roles ("the one being measured, named first" vs "the yardstick").

**qthe-corpus application.** Our audit tooling has a closed function surface
(`scripts/verify_all_chains.mjs`, `replay.mjs`, `probe_gate.mjs`, `seal_*.mjs`,
`falsification_budget.mjs`). A Jev dispatcher over those signatures would let a tavern
guest — or the founder — drive the verification toolchain in plain language while
**code still owns every invocation**: the model can only pick among functions and enum
values that exist. This is triage-shaped by construction: no Jev output reaches the
repo except as arguments to already-written, already-receipted tools. The `stated`
pattern is the right way to keep optional flags (e.g., `--tick-limit`) at defaults
instead of having the judge confidently invent a window (the docs say exactly this:
without `stated`, "the choice would have to name some window, and it would have named
one confidently").

**Tavern application.** Seat-orchestration commands ("cross-examine the Hy4 audit
against the B3 autopsy") map to a closed set of tavern operations. Same law: Jev picks
the operation; the sealed harness executes it.

### 2.2 Skill suggestion
URL: https://docs.typesafe.ai/cookbooks/skill_suggestion.md

**Pattern.** Problem: agents pick skills from a one-line index (Hermes truncates to
60 chars) and load the wrong one. Two TypeSafe requests per turn: **(1)** rank all 182
skills (one Choice) + three nouls deciding whether *any* skill is needed ("act on
their stuff / follow written steps / just talk"), gate = mean of the three ≥ 0.30;
**(2)** re-read only the top 3 with 700-char excerpts of their real instructions and
re-ask, free to reject all. Winner is injected as one `<skill_relevance>` line that the
agent may ignore; the roster (and any prefix cache over it) never changes.

**Numbers.** 488 requests against `claude-haiku-4-5-20251001`: wrong-skill loads
**16.8% → 7.3%**, unnecessary loads **9.8% → 4.0%**; floor (agent handed the right
answer) 2.5%/1.2% — i.e., most of the remaining error is the agent, not the selector.

**qthe-corpus application.** Fleet-seeds / registry hygiene: our knowledge-map and
registry rows are a "skill roster" the orchestrator currently loads wholesale. A
two-call rank-and-recheck would decide which *prior experiment receipt* a new audit
actually needs in context — the jaggedness page's "large state full of irrelevant
detail" failure is our default mode when we stuff whole chain files into briefings.
Killer-shaped, triage-only: the selector decides what evidence to *load*; it never
decides what the evidence *says*.

**Tavern application.** Guest prompting: pick at most one corpus doc per guest turn,
re-check the top three against the turn, inject "ignore if it does not fit." Same
numbers apply as priors, not promises.

### 2.3 Guardrails for LLMs
URL: https://docs.typesafe.ai/cookbooks/llm_guardrails.md

**Pattern.** One request per message, on **both sides** of an LLM call (input and
output batteries). Four hazard **Nouls** (jailbreak / harmful request / medical advice
/ self-harm — the output-side battery mirrors them: broke_policy / harmful_reply / …)
plus one **Score** for severity of complying (4 written levels, 0–3). Code routes with
two thresholds per hazard (review ≥ 0.35, action ≥ 0.70 under `strict`; 0.85 action
under `permissive`), a per-hazard action map, severity ≥ 2.0 upgrades review→block,
precedence `support > block > review > pass`.

**Numbers (jev-1.12, 2026-08-15).** 10 prompts + 5 replies, jailbreaks taken verbatim
from the public TrustAIRLab in-the-wild collection. All four planted violation classes
routed correctly: `dan` jailbreak 0.98; `neurosemantical` (jailbreak dressed as a
medical-accommodation request) 0.74 → block under strict, review under permissive with
**the same probabilities** — the demo's point: re-routing is a constant edit, not a
re-prompt; `self_harm` → support, not block; `novelist_poison` passes at 0.05 because
asking-how-a-detective-describes-poisoning is not asking to poison.

**qthe-corpus application.** This is the exact shape our **audit-triage battery**
should take — not because our hazards are jailbreaks, but because the *structure*
(severity Score + per-hazard nouls + code-owned policy + both-sides screening) is the
disciplined version of "first-pass triage": `hallucination_shaped` ("does this finding
assert a mechanism, file, or receipt that the briefing itself does not evidence?"),
`severity`, `actionability`, `conflicts_with_priced_claim`. Screen the guest's finding
on the way in and the finding-plus-our-grounding on the way out.

**Tavern application.** Screen guest outputs before they enter the corpus and before
they're sealed: battery of nouls for `asserts_unreceipted_artifact`, `severity`,
`actionability`, plus a policy knob per fleet phase. The both-sides pattern matters:
we currently judge guest *findings*; we should equally judge our *orchestrator
briefings* for leading language (see §0 — the judge is not hostile by default).

### 2.4 Double-checking citations
URL: https://docs.typesafe.ai/cookbooks/citation_check.md — **the most law-relevant
cookbook in the set.**

**Pattern.** Input: a source document + a citation (claim, quote, section). **Step 1,
code:** normalize whitespace/curly quotes, exact substring search of the quote in the
source; not found → `fabricated`, **no model called at all**. **Step 2, model:** one
**Choice** (supports / contradicts / says_nothing) over the *section the string match
actually located* — state = `{"claim", "section"}` where `section` comes from the
source, never from the citing model. `AUTO_ACCEPT = 0.8`: below it, a human confirms.
**Step 3:** verdict ∈ {verified, contradicted, unsupported, fabricated}.

**Numbers (jev-1.12, 2026-08-16).** RFC 7519, 8 citations (4 accurate, 4 planted).
Accurate four → `verified` at confidence ≥ 0.93. Planted: fabricated quote caught by
string match alone; `contradicted` at 0.99 (quote verbatim, section says "Use of this
claim is OPTIONAL"); two `unsupported` at 0.27 and 0.56 → human review. Stated limits:
exact match means lightly reworded quotes read as fabricated — production needs fuzzy
matching.

**qthe-corpus application — this is the fix for the 4/4 incident.** Every
experiment-claim in our corpus is checkable against a **sealed chain row** the way a
citation is checkable against a source document. Pipeline: claim → code extracts the
cited artifacts (chain rows, output JSON fields, doc lines) → **code** verifies what
code can verify (hash exists? row index in range? number matches the JSON?) → only the
residual *relation* judgment (does this receipt support this claim's wording?) goes to
Jev as a Choice with `says_nothing` as an explicit option → confidence < 0.8 to human.
The briefing-only failure mode is structurally impossible when the state is
`{claim, located_section_from_repo}` and the fabrication check runs in code first.
**Tavern application.** Guests citing corpus docs get the same loop; `unsupported`
findings surface to the founder rather than auto-sealing.

### 2.5 Classifying RAG passages
URL: https://docs.typesafe.ai/cookbooks/classifying_rag_passages.md

**Pattern.** Between retrieval and generation: one request per (query, passage) pair —
never batching passages into one request, "because each question is about one pair."
Four nouls: `is_relevant`, `contains_answer_evidence`, `contradicts_query_premise`,
`contains_prompt_injection`. Code routes in fixed order (injection first — "a security
decision, not an evidence one"; contradiction before evidence, because a
premise-refuting passage usually also states usable evidence): exclude /
conflicting-evidence-block / include. The generator prompt keeps accepted and
conflicting evidence in **separate blocks** "so the answer can push back."

**Numbers (jev-1.12, claude-sonnet-5, 2026-08-27).** 81 passages (80 verbatim Supabase
auth docs at pinned commit `2440b06` + 1 hand-written forum post whose last paragraph
is a prompt injection). Top-12 by cosine (`text-embedding-3-small`, 256 dims). The
injection ranked **1st at 0.584 similarity and scored 0.99 on the injection noul**;
the premise-refuting passage ranked 7th and was promoted via `contradicts=0.92`. All
similarity scores sat in 0.455–0.584 — "a spread too narrow to separate the passage
that corrects the query from the one trying to hijack the answer." Honest caveats:
"a passage that scores under the threshold still reaches the prompt … Nothing here is
a security boundary."

**qthe-corpus application.** Knowledge-map curation *is* retrieval + gating: a guest
asks about a substrate behavior; the corpus (SPEC, CLAIM-VERDICTS, BOUNDARY-MAP,
chain rows) is retrieved by cheap similarity; a four-noul battery decides
include/conflict/drop — with `contradicts_query_premise` being the one that saves us
when a guest's question smuggles in a wrong premise about qthe (exactly the demo's
case). The separate-evidence/conflict-blocks prompt shape should be our tavern
briefing template.

**Tavern application.** Cross-examination prep: when a devil's-advocate seat attacks
a finding, the passages that *contradict the finding's premise* must land in a
separate block or the advocate only sees ammunition for the premise.

### 2.6 Simple memory system
URL: https://docs.typesafe.ai/cookbooks/basic_memory.md

**Pattern.** Wrapper `ask_with_memory()` = same signature as `ask()`. After each call,
a **gate** Noul judges *the original request together with the answer*: "does
`request.ticket` state a lasting fact … Count what the customer or our support staff
wrote … do not count anything `jev_answered` says or implies." P(yes) ≥ `REMEMBER_AT`
(0.5) → save `{request, jev_answered}` under the customer ID; later calls inject the
saved list into the state under a key the questions never mention.

**Numbers (jev-1.13.0, 2026-09-28).** 2 customers, 5 earlier tickets, 3 later
messages. Lasting facts saved at noul 0.91/0.91/0.92; transient facts (airport phone,
public holiday) rejected at 0.07/0.10. Routing accuracy on later messages:
**2/6 without memory → 6/6 with**; e.g., C-1042 "slow dashboards" flips
cloud_ops 0.80 → selfhosted_windows 0.94→0.99 after the Windows/Enterprise memories
land. The docs' own appendix is the law-compatible part: **"Can a saved answer
reinforce a mistake? Yes."** The gate only prevents the *answer alone* from earning a
save; once saved, a mistaken inference rides along in every later call.

**qthe-corpus application.** KNOWLEDGE-MAP/FINDINGS triage: which sealed verdicts
deserve a doc pointer is currently a human call (the prior research note says
exactly this). The gate pattern — count only what's in the *primary artifact*
(the receipt row), never what the judge *said* about it — is the right anti-feedback
rule for us, and the docs' own appendix is the warning label our receipts must carry:
memory of a judge's inference is not memory of a sealed fact.

**Tavern application.** Memory of what guests said: gate on the guest's verbatim
sealed output, not on our triage of it; store `{guest_output, our_answer}` pairs and
inject under a fixed key. The "memory only grows" limitation is priced in the Next
steps (relevance selection, replacement, expiry) — for us, replacement = a new sealed
row superseding an old one, which our append-only chains already model.

---

## §3 Classification (3 cookbooks)

### 3.1 Hierarchical classification (parallel beam search)
URL: https://docs.typesafe.ai/cookbooks/hierarchical_classification.md

**Pattern.** Taxonomies as trees of Choice questions; each node's full probability
vector is its edge distribution. **Greedy** = follow the max child. **Beam search
K=3** = keep the three best partial paths by `path_score = product(edge_probs) **
(1/decisions)` (geometric mean, so shallow and deep leaves compare fairly), evaluate
the frontier **in parallel** (the API's questions-are-independent property used as a
search fan-out), prune; report `separation = top/second` as an ambiguity metric. Deep
hierarchies (>10 layers) should use `exp(mean(log(probs)))` for numerical safety.

**Numbers.** Four pinned hierarchies — CPC 2026.05 patents, Shopify product taxonomy
2026-02, MeSH 2026, and TypeSafe's own CookSafe repo. Beam K=3 hit **4/4** expected
leaves; greedy **2/4** (CPC and Shopify recovered by the beam). Observability claim:
per-node/per-edge traversal counts make misclassification localizable and hierarchy
updates unit-testable.

**qthe-corpus application.** Our claims taxonomy is genuinely hierarchical
(claim → verdict family → experiment → chain row). Triage of a new audit finding
against CLAIM-VERDICTS is a beam search where the frontier runs as parallel Choices —
and where `separation ≈ 1×` (near-tie paths) is precisely the "send to human" band.
This is the search shape for *routing a finding to the right priced claim*, not for
deciding the claim.

**Tavern application.** Seat-to-task assignment through the fleet's own hierarchy
(audit/review/cross-examine → substrate area → experiment family), with the beam
keeping three candidate assignments when the top is ambiguous.

### 3.2 Classification using confidence
URL: https://docs.typesafe.ai/cookbooks/classification_using_confidence.md

**Pattern.** One Choice over **75** industry groups per SEC 10-K filing (Item 1 text);
read the answer's own `confidence`; if < 0.9, report not the group but the **division
it rolls up into** — a coarser-but-still-true label, free, because the hierarchy is
code-side arithmetic. "Every filing still comes back with a usable label."

**Numbers (jev-1.12, 2026-08-12).** 60 filings; forced to name a group every time:
39/60. Split at confidence 0.9: the 30 sure ones 27/30 (**90%**); the 30 unsure 12/30
(**40%** — "naming a group was wrong more often than right"). Reported one level up,
those same unsure answers are 70% useful → **48/60 useful**. Also: "a Choice works
reliably up to roughly 240 options," and the hard cases are legible in the text
(development-stage companies describing businesses they *intend* to run — the
aspirational-filing problem).

**qthe-corpus application.** The report-coarser-when-unsure move is the single most
importable trick in the whole cookbook set for audit triage: a finding Jev can't
confidently place under a specific claim family should be reported at the coarser
"boundary-map regime" level rather than forced — a forced fine label is wrong more
often than right at the same confidence. It is also the honest answer to
aspirational-text: our docs contain *planned* work (E-Q17 pending, H1–H3 registered
unrun) that reads like completed work.

**Tavern application.** Seat scores get two resolutions: per-experiment verdicts only
at confidence ≥ threshold; else per-regime summaries. The 40%-accuracy-when-forced
number is the receipt to quote whenever someone asks why we don't just make the judge
pick.

### 3.3 Twitch chat filter
URL: https://docs.typesafe.ai/cookbooks/twitch_chat_filter.md

**Pattern.** One request per message (up to 8 concurrent), state = stream title/game +
one message; three questions in that single request: **Choice** `category` (question /
hype / conversation / backseat / spam — with careful anti-confusion criteria:
"repetition alone does not make cheering spam," "a link alone is not spam"),
**Noul** `toxic`, **Noul** `spoiler`. `decide()` in code maps answers → show /
highlight / dim / hide / blur; thresholds `TOXIC_AT`/`SPOILER_AT` = 0.7. Context
dependence is handled by putting the *stream/game* in the state: whether "go left,
there's a treasure box behind the tree" is a spoiler depends on the game.

**Numbers (jev-1.13.0, 2026-09-25).** 29 hand-written Elden Ring messages: 7 hidden,
2 blurred, 6 highlighted. There's a working Chrome-extension demo video.

**qthe-corpus application.** This is the minimal-cost shape for a **pre-seal lint**
over tavern guest prose before it enters a receipt: category (finding / question /
opinion / restatement / noise) + one noul for `asserts_artifact_not_evidenced` + one
for `overstates_certainty`. Five options, two nouls, one request, rules in code.

**Tavern application.** Literal: the tavern is a chat with worse signal-to-noise;
"backseat" (unasked-for advice) and "spoiler" (revealing the answer to a
pre-registered hypothesis before the arm runs) are real categories for us. The
pre-registration discipline makes "spoiler" almost mechanically checkable.

---

## §4 Extraction (4 cookbooks)

### 4.1 SDE cascade (mini → verify → reasoning)
URL: https://docs.typesafe.ai/cookbooks/sde_cascade.md

**Pattern.** Extract with a cheap model; **verify with a per-field Noul battery in one
TypeSafe call** (state = system message + source text + schema + extraction; questions
keyed `field::metric`: unreasonable / hallucinated / off_target / incomplete /
format_violation / name_desc_mismatch / type_mismatch, plus an `absence_wrong` variant
for empty fields, plus one holistic `__overall__::judge` shown but **not** part of the
gate); **escalate iff any per-field noul > `FIRE_T` 0.7** — a max gate, "one confident
red flag is enough instead of being averaged into silence."

**Numbers.** Prices quoted: gpt-5.4-mini $0.75/$4.50, gpt-5.5 $5/$30 (~7× mini),
jev-1.12 $0.042/$0.00. Worked example (NYU registration date): the battery fired
`description::hallucinated 0.95`, `description::off_target 0.85`; the escalated
reasoning model **dropped the fabricated description to an honest empty field** —
"the cascade turned a confident, schema-valid fabrication into an honest empty field."
Internal 100-prompt sweep (gate threshold 0→1): gpt-5.5-reasoning alone ≈ 0.81 quality
at ≈ $0.10/extraction; the cascade frontier "sits up-and-left of every single model."
Appendix A is the verifier-design canon: narrow and grounded; bad=TRUE with explicit
criteria; per-field then max; independent and cheap; separating/calibrated.

**qthe-corpus application.** Fleet audit economics in one recipe: cheap seats (the
tavern's drafting models) produce findings; Jev's per-field battery localizes what's
wrong with each finding (`hallucinated` = the finding cites artifacts the repo doesn't
contain — **note: this works only because the source text sits in the state**, which
is the §0 law again); only findings that fire escalate to the expensive adjudicator
seats. Appendix A should be laminated into the tavern's README.

**Tavern application.** The absence question matters most for us: an *empty* audit
claim ("no issues found in chain X") is only correct if the chain actually has no
issues — `absence_wrong` is the typed version of our falsification-budget discipline.

### 4.2 Date extraction
URL: https://docs.typesafe.ai/cookbooks/date_extraction_cookbook.md

**Pattern.** The model **never does calendar math**. Seven Choices in one call:
`mode` (absolute/relative/none), `month`, `day` (1–31), `year` (1900–2050 **plus two
escapes**: `none` = text states no year, `out_of_range` = stated but outside the
list), `day_anchor`, `weekday`, `week_offset`. Code reads only the pieces `mode`
calls for, assembles a `date`, resolves relatives against a **pinned `TODAY`**
(2026-07-30) "so relative dates resolve reproducibly." `REVIEW_BELOW = 0.60` sends
low-confidence reads to a human.

**Numbers.** Four demo documents; the flagged cases are exactly the ones whose parts
"do not add up to a date at all, including a date the document never states."

**qthe-corpus application.** Direct: receipt timestamps, chain-row dates, and
worklog dates are how we audit *when* claims were priced; extraction into Choices
with explicit `none`/`out_of_range` escapes means a missing date is **reported, not
guessed** — the typed version of "pending never extrapolated." The pinned-TODAY trick
is our replay discipline in miniature.

**Tavern application.** Guests quoting "the 2026-10-11 run" get dates normalized
through this shape before their prose is sealed, so citations point at real chain
rows.

### 4.3 Pre-parsed value extraction
URL: https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md

**Pattern.** Regex over-finds candidates (emails, phones, money) → **Choice whose
options are the found spans plus `none`** → the picked value is copied **verbatim**
and normalized in code (phonenumbers, Decimal). Companion Choices classify attributes
(currency, country), a Noul reads booleans (credit vs charge).

**Numbers.** Three worked cases (receipt address, `+14155550177`, `1315.50 USD` as a
charge). The law in their words: "Because TypeSafe only ever chooses among the spans
the regex found, the value you get back is one of those spans, copied unchanged. It
cannot invent a value or transpose a digit."

**qthe-corpus application.** Chain tips, sha fragments, row counts, and experiment
IDs quoted in guest prose should be extracted this way: a code-side candidate
generator over the *actual repo* (all `*_chain.jsonl` row ids, all shas in
`chain_tip.txt` files) + a Choice over those real candidates. A guest "citing" a sha
that isn't in the candidate set picks `none` — fabrication becomes mechanically
visible. This is the cheapest half of the citation-check loop and needs no Jev at all
for the fabrication half.

**Tavern application.** Same, for seat-to-seat references ("as the MiMo seat found
in row 70…"): the option set is the real row inventory.

### 4.4 Structure recovery (autoformat)
URL: https://docs.typesafe.ai/cookbooks/autoformat.md

**Pattern.** Reconstruct Markdown from stripped text **without any text generation**:
pass 1, one Noul per adjacent line-pair (all pairs in one request) — "does this line
break split a sentence?" — code merges survivors into blocks; pass 2, one Choice per
block (heading/paragraph/list/quote/code/callout) + companion questions (heading
level, step order, callout kind) whose answers are read **only when the block's type
makes them relevant**. "Blank lines and explicit markers (`- `, `1.`, `#`) are read in
code, never sent to the model to reconsider." Line-ids (`L014| `) make every judgment
pointable.

**Numbers (jev-1.12).** One team memo: two round trips, **10,211 tokens, 0.8 s,
$0.0015**.

**qthe-corpus application.** The line-id + code-reads-what-code-can-read split is the
template for auditing *our own docs*: SPEC/CLAIM-VERDICTS structure checks (does this
"pending" row still have no receipt?) are mostly code-checkable; the model gets only
the genuinely judgmental residuals. Also the correct shape for ingesting outside
artifacts (PDFs, READMEs) into the corpus without ever letting a generator rewrite
their words — every character of output comes from the input.

**Tavern application.** Guest transcripts → structured findings: code detects
markers; Jev classifies blocks; nothing is paraphrased before sealing.

---

## §5 Search and matching (3 cookbooks)

### 5.1 Re-ranking
URL: https://docs.typesafe.ai/cookbooks/rerank_typesafe.md

**Pattern.** BM25 shortlist (top 30) → one **Noul per (query, candidate) pair** — "could
this candidate be the cited precedent?" with criteria fixing true/false ("states the
specific rule the query cites" vs "merely on a similar topic") — sort the shortlist by
noul. Independent pair scoring is the point: same question, same standard, every pair;
"a general-purpose model … repeated calls can still produce different scores for the
same pair," which is what the noul is for.

**Numbers (jev-1.12).** CLERC legal dataset (https://aclanthology.org/2025.findings-naacl.441/):
3,565 passages, 40 queries, **1,200 calls** run 12-wide. **Top-1: 5% → 18%; top-10:
38% → 62%.** Honest boundary: the shortlist contained the correct passage for all 40
queries — "re-ranking … cannot add a passage that fast search did not select."

**qthe-corpus application.** Audit triage is re-ranking: the "shortlist" is the
candidate receipt rows a cheap retriever (or the guest) proposes; the noul re-scores
each *against the actual query/claim*. The 5%→18% number is the receipt to quote for
why cheap-first + judge-second beats judge-only. And the stated boundary is our law
again, in their words: if the shortlist didn't contain the truth, no re-ranker can
insert it.

**Tavern application.** Seat-candidate matching: which of the N prior sealed verdicts
is this guest finding actually about.

### 5.2 Line-by-line search (semantic_find)
URL: https://docs.typesafe.ai/cookbooks/semantic_find.md

**Pattern.** Tag every line with an id (`L052| `); **Choice over the 218 line-ids**
("which line contains the answer to …", option descriptions `None` because the
document is the state) + a **Noul `exists`** ("Does any line of the document address
…") **in the same request** — because Choice probabilities sum to 1, "a line ranks
first even when none answer the query," and only the exists-noul can fall near zero.
Code thresholds: `FOUND = 0.7`, `ABSENT = 0.35`, middle = "partially addressed"
(present answers typically ≥ 0.9, absent ≤ 0.05). Choice caps at **255 options**;
beyond that, two-pass: a Choice picks a window, a second ranks within it.

**Numbers (jev-1.12).** GitHub's Terms of Service, 218 clauses; included queries
"rank lines with direct answers first" and the exists-gate classifies missing/partial.

**qthe-corpus application.** SPEC.md and CLAIM-VERDICTS.md are exactly a
line-addressable document. A guest claim like "the spec promises byte-identical
determinism for all ports" becomes: Choice over SPEC line-ids + `exists` noul. If
`exists` lands low, the claim is about something the corpus doesn't say — **that is a
typed, receiptable version of the grounding gap.** Docs longer than 255 lines
(TECHNICAL-NOTE) need the two-pass window variant.

**Tavern application.** "What did seat X actually say about Y" over sealed transcripts
— line-ids into the sealed verbatim record only.

### 5.3 Knowledge-graph entity alignment
URL: https://docs.typesafe.ai/cookbooks/entity_alignment.md

**Pattern.** 450 candidate pairs (two beer catalogues, Magellan benchmark, text left
"exactly as published" with HTML entities and mojibake intact). One **Score** with
three levels that *are* the decision — different product / **related, but possibly
not the same** / same product — plus per-field **Nouls** (name, brewery, style; ABV
is compared **in code** because "comparing two numbers is arithmetic"). Round the
score to the nearest level; the middle level goes to a curator queue. "Merging two
entities inappropriately is the more expensive mistake" — hence the three-way shape.
"There is no threshold you had to fit to your own data."

**Numbers (jev-1.12, 2026-08-11).** One request per pair; cost follows the number of
pairs, not the size of either source.

**qthe-corpus application.** Fleet-seeds registry hygiene is entity alignment: the
registry (REGISTRY.md rows), the budget scanner's chain inventory, and the chain files
themselves are three catalogues of the same entities — the fleet has already hit a
live reconciliation (fleet-seeds pins 14 chains/305 rows; the scanner counts 13
`*_chain.jsonl`/295 rows; the gates chain lives in `tests/receipts.jsonl`). A
Score(differ / related-needs-curator / same) + per-field nouls over the *disagreeing*
fields is the typed version of that reconciliation, with the merge-is-expensive
asymmetry matching our append-only law (a bad merge is a corrupted chain).

**Tavern application.** "Are these two findings the same issue found by different
seats?" — the middle level (related-but-not-same) is the cross-examination queue.

---

## §6 Techniques (4 cookbooks)

### 6.1 Self-consistency: choices
URL: https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook.md

**Pattern.** One borderline post, an 8-Choice moderation rubric, **15 repeats** per
condition; conditions = haiku/gpt-5.4-mini at temp 0 and default, same in forced
True/False mode, gpt-5.5/opus reasoning, and TypeSafe (fresh `uid` per call). Report
plurality-label stability and per-question probability variation; then require
`MIN_CHOICE_PROBABILITY = 0.60` for automatic action, else `uncertain` → human.

**Numbers (jev-latest, 2026-09-11).** LLM distribution settings repeat their plurality
labels 87.5–100%; TypeSafe 90.8% — i.e., **not deterministic**. TypeSafe's mean
probability variation is lower than 5 of 6 LLM conditions (Haiku at temp 0 varies
less). TypeSafe flips on 2 of 8 questions. With the 0.60 floor: **agreement 99.2%,
automatic labels on 74.2%.**

**qthe-corpus application.** Our judges are repeatable-by-receipt, not by nature:
before any Jev question is allowed to gate anything, it should survive a 5×-repeat
stability check with its flip count recorded in the receipt. The 2-of-8 flip datum
says: even a calibrated judge has specific questions it cannot hold still on — those
questions are exactly the ones that must route to humans, permanently.

**Tavern application.** Cross-examination design: repeat the contested question 5×
across the *same* seat before escalating to a different seat; agreement-with-self is
cheaper to buy than agreement-with-truth.

### 6.2 Self-consistency: nouls
URL: https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md

**Pattern.** Same 15× protocol with a 14-Noul rubric over one insurance claim
(deliberately borderline: track-day parking-lot collision, no required police report,
rental line item without coverage, pre-written "approved, pay full" triage note).
Route noul ∈ [0.30, 0.70] to `uncertain`/human; keep the underlying probabilities
visible.

**Numbers (jev-latest, 2026-09-11).** **TypeSafe mean per-question std dev 0.0102**,
below all LLM probability conditions here; but its `covered` answer **spans 0.43–0.53
across repeats, crossing a 0.5 decision threshold** — the docs show this honestly.
LLM answers move run to run "at temperature `0` too," and on judgment calls "the
models disagree with *themselves*."

**qthe-corpus application.** The 0.30–0.70 review band is the audit-triage band we
should adopt verbatim for noul-gated findings; the crossing-a-threshold-span datum is
the receipt for why thresholds must not sit at 0.5 where the judge's own noise lives.
Combined with §6.1: an abstention band *plus* a repeat-stability receipt per question
is the full honest-null protocol for a judge layer over our corpus.

**Tavern application.** Seat scores published as noul + band + repeat-count, so a
"0.48" in a receipt is never mistaken for a stable "no."

### 6.3 Parallel questions
URL: https://docs.typesafe.ai/cookbooks/parallel_questions.md

**Pattern.** One document (GDPR Wikipedia article, pinned revision `1363040264`,
53,777 chars), 13 questions (8 Noul, 2 Choice, 3 Score). Ask all-in-one-call vs
one-per-call, **5 repeats each**; compare per-question mean (bias) and std dev
(noise). One tracked metric per type: noul = p(yes); choice = max prob; score =
score/(levels−1).

**Numbers (jev-1.12).** Batched: **$0.000497, 0.27 s**; 13 singles: **$0.006090,
2.71 s** → **12.2× cheaper, 10.0× faster**. Most answers identical across all 5
repeats either way (std dev exactly 0.0); the two that moved (`breach_72h`,
`criminal_penalties`) moved the same amount under both strategies — batching adds no
noise; the document dominates cost ("the bigger the document, the nearer that saving
comes to a full Nx").

**qthe-corpus application.** Our audit briefings are document-dominated (whole chain
files, whole docs). Every place we currently ask one question per call about the same
state — severity, then actionability, then claim-family — is a 12× cost leak. The
5-repeat mean/std protocol is also the acceptance test any batched battery must pass
before it enters receipts.

**Tavern application.** The tavern's per-guest scoring battery (novelty, grounding,
severity, actionability…) should be one call per guest output, not five. Note the
docs' own drift (primitives.md quotes 11.5×/9.6× from an earlier run) — which is why
our receipts must carry the measured number, not the doc's.

### 6.4 Autoresearch feature discovery
URL: https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery.md

**Pattern.** Turn free text into numeric features: an LLM *proposes* questions (typed
schema: add/revise/drop, up to 18 actions per round, against a fixed spec of
intensity-scale vs presence-noul templates); TypeSafe answers them for every row; a
**score answer becomes two columns** (expected level + spread/uncertainty), a noul
one; CatBoost trains; its error report (which questions it used, which rows it still
misses) feeds the next proposal round.

**Numbers (jev-1.12).** 2,000 wine reviews, held-out 800. RMSE: predict-the-mean
**3.09**; CatBoost on word counts **2.47**; ask-TypeSafe-for-the-score **2.15**;
**18 questions from one proposal call 1.87**; **38 questions after five loop rounds
1.77** — most of the gain in the first call, the loop's marginal rounds measured, not
assumed.

**qthe-corpus application.** Adversarial-probe generation and question-library
curation are autoresearch-shaped: propose typed probe questions against seeded
substrate damage scenarios, run the paired arms, and let the *error report* (which
probes discriminated, which families the judges still miss) propose the next round.
The two-columns-per-score trick (level + spread) is a free uncertainty feature for any
judge-scored corpus statistic.

**Tavern application.** Seat-quality regression: predict which guest findings will
survive grounded verification from typed features of the finding prose; the loop
discovers which features matter instead of us hand-writing them.

---

## §7 Primitives, API, and confidence — the parts the cookbooks assume

- **Choice** (`choice`, `probabilities`, `confidence`) — closed set, unordered; docs
  claim reliable to ~240 options (classification cookbook) / hard 255 cap
  (semantic_find Info box). **Score** (`score`, `legend`, `probabilities`,
  `confidence`) — ordered levels, position can fall between levels; do **not**
  interpolate magnitudes from expectations (jaggedness page: "score levels are weak in
  numerical calibration"). **Noul** (`noul` only, no confidence; use |2p−1| if you
  need a comparable number). **Box** — image localization, four edges as fractions of
  width/height (https://docs.typesafe.ai/primitives/box.md). **Advanced** —
  instructions/criteria accept JSON structure, referenced by backticked paths
  (https://docs.typesafe.ai/primitives/advanced.md).
- **API** (https://docs.typesafe.ai/api.md): `POST /v1/systemone`, `state` (string |
  object | array), `model`, `questions` map; body ≤ 32 MiB, ≤ 64 nesting levels,
  finite numbers only ("send identifiers and exact large quantities as strings" —
  relevant to our 64-bit shas), gzip/zstd supported; per-request **and** per-question
  context limits both count the state once (https://docs.typesafe.ai/models.md).
- **Confidence formulas** (https://docs.typesafe.ai/confidence.md): Choice
  `(p_max − 1/n)/(1 − 1/n)`; Score = 1 − (prob-weighted level-distance from peak) /
  (uniform-spread distance), floored at 0; the docs explicitly bless computing your
  own statistic from the returned `probabilities` instead. Function-calling's
  whole-call confidence = **min over judgments** — the weakest-link reduction our
  composite audit scores should copy.
- **Jaggedness canon** (https://docs.typesafe.ai/model-jaggedness/jev-1.13.md): nine
  failure modes — literal reading; math/counting ("recognizes the shape of an answer
  rather than tallying"); date/time comparison; indirection; large irrelevant state
  ("context rot"); **adversarial content** (state is not treated as hostile);
  contradictory criteria; **choice-option order bias** (leans toward the first option
  — "reorder the options to double check"); generation (don't). Every one of these
  has a fleet consequence; the first-option bias in particular means our Choice
  batteries should be order-shuffled and checked, the way the docs themselves advise.

---

## §8 Adopt-next: top 5 by value-to-effort, each with its killer experiment

Ranked for *our* stack — a corpus whose artifacts are sealed and byte-replayable, a
tavern of 8 seats, and a judge that has already been caught rating an invented
mechanism 4/4.

1. **Citation-check grounding loop** (§2.4 + §4.3). Effort: days. Value: converts the
   priced grounding-gap law from a caution into a mechanism.
   **Killer experiment:** assemble ~30 claims about the repo — including the exact
   planted 4/4 artifact and ~6 deliberate fabrications (sha not in the repo, row id
   out of range, number not in the output JSON) — and run two sealed arms over the
   same claim set: (A) briefing-only Jev triage (the status quo), (B) code-grounded
   citation loop (string/hash match first, Choice over the located section second,
   confidence < 0.8 → human). Metric: fabrication-detection rate, per-arm, receipted.
   **Falsifier:** if arm B does not beat arm A on planted fabrications (or beats it
   only by re-labeling true claims as suspicious), the loop's cost is not earned and
   the law stays a human-review rule instead of a pipeline.
2. **Parallel-question batching for the tavern battery** (§6.3). Effort: hours.
   **Killer experiment:** take the live per-guest scoring battery, run it against 20
   sealed guest outputs both ways (one call vs N calls) × 5 repeats; publish cost,
   latency, and per-question mean/std drift in one receipt. **Falsifier:** any
   question whose batched mean shifts beyond its own single-call run-to-run noise —
   that question is batch-hostile and must be split back out; if ≥ 20% of questions
   are batch-hostile, batching is out for us regardless of the 12×.
3. **SDE cascade for tavern adjudication** (§4.1). Effort: days. Value: the economics
   table the fleet already priced (cheap seats draft, Jev verifies, expensive seats
   adjudicate) gets its missing middle rung. **Killer experiment:** 100 real audit
   findings, three arms — all-expensive adjudication / cascade with the per-field
   bad-true battery at FIRE_T 0.7 / cascade at a swept threshold — scored against
   grounded-verified outcomes. **Falsifier:** if the cascade's quality at any
   threshold sits below the all-expensive arm by more than the cost saving justifies
   at our actual seat prices, or if the verifier battery fires on > 50% of clean
   findings (no separation), the pattern's pareto claim does not transfer to our
   traffic.
4. **Self-consistency nouls + 0.30–0.70 review band** (§6.2 + §6.1). Effort: hours.
   Value: the honest-null protocol for the judge layer itself.
   **Killer experiment:** pick the 15 questions that currently gate anything in our
   audit flow; run each 15× against fixed state; record per-question std dev, flip
   count, and how often the value crosses its own decision threshold. Any question
   with a threshold-crossing span gets its threshold moved out of the noise band or
   gets demoted to triage-only. **Falsifier:** if ≥ 1/3 of our gating questions turn
   out unstable, that is not a null — that is the finding; the pattern paid for
   itself by retiring bad questions. The pattern is falsified only if all 15 are
   already stable at 0.000 std, in which case the repeats are wasted spend.
5. **Entity alignment for registry/chain reconciliation** (§5.3). Effort: a day.
   Value: the fleet has a live, receipted instance of the exact problem (14 chains/
   305 rows vs 13/295; gates chain outside the scanner's inventory — see the ORCH-C
   worklog entry). **Killer experiment:** run the Score(3-level)+per-field-noul
   battery over all entity pairs that the two inventories disagree about, curator
   queue for the middle level; compare its merge/differ/curate decisions against the
   human reconciliation already performed. **Falsifier:** if the battery's decisions
   match the human reconciliation on < 80% of pairs, or if the ABV-rule (numbers
   compared in code, not by the model) catches what the Score misses, then keep it
   code-only and price the pattern as not-yet.

Deliberately not in the top five: **memory** (§2.6 — the docs' own appendix says a
saved answer can reinforce a mistake; our append-only chains already give us a better
memory primitive), **autoresearch** (§6.4 — real value but the loop needs a labelled
outcome corpus we only partially have), and **hierarchical beam search** (§3.1 — worth
it the day our claims taxonomy grows past the point a human can route by hand).

## Status

- All 20 cookbook pages, the primitives/API/confidence/models/jaggedness/patterns
  pages fetched and read from the live docs (index:
  https://docs.typesafe.ai/llms.txt); numbers above are quoted from those pages with
  their pinned model versions and dates. No API calls were made; no repo files were
  modified in producing this note.
- Companion survey: `docs/research/DECISION-MODEL-TRENDING.md` (Jev ecosystem,
  decision-model trends, JEPA family, with URLs).
