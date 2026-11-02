# JARGON — the stranger-blocking vocabulary audit

> Seat: stranger-experience · Round G1-3. Sources audited: repo description,
> `docs/ONBOARDING.md`, `docs/DAY-1.md`, `docs/CLAIM-VERDICTS.md`,
> `docs/ADOPTION-KIT.md`, `qthe.mjs` header (all fetched and read this
> round). The problem, precisely: the docs are written in the founder's
> internal fleet culture — an insider reads warmth and provenance; a
> stranger reads gatekeeping. The first sentence of ONBOARDING.md currently
> contains **five** untranslated culture terms ("gifted vision", "house
> honesty law", "priced claim", "stone-v1 receipt chains", "the Looking
> Glass") before a stranger has seen a single byte.
>
> **The test applied to every term below:** *would a competent creative
> coder, game engineer, embedded engineer, or researcher — arriving cold
> from the GitHub homepage — understand this word on first meeting, or does
> it cost them a wiki they don't have?* Verdicts: **KEEP+GLOSSARY** (term is
> load-bearing; define at first use), **REPLACE** (swap for a plain term in
> all stranger-facing docs), **RELEGATE-TO-LORE** (fine in the internal
> journal and deep technical files; banned at the front door).

## Quick reference

| # | Term | Verdict |
|---|------|---------|
| 1 | timbre / τ | KEEP+GLOSSARY |
| 2 | Ground / Attract / Repel | KEEP+GLOSSARY |
| 3 | Abstain | KEEP+GLOSSARY |
| 4 | "the Looking Glass" | RELEGATE-TO-LORE |
| 5 | wormhole table | KEEP+GLOSSARY |
| 6 | twin resonance / twins | KEEP+GLOSSARY |
| 7 | substrate | KEEP+GLOSSARY |
| 8 | d (amplitude) | KEEP+GLOSSARY |
| 9 | σ (sigma) | KEEP+GLOSSARY |
| 10 | LAYER 0 / 1 / 2 | KEEP+GLOSSARY |
| 11 | pre-registration | KEEP+GLOSSARY |
| 12 | receipt chain | KEEP+GLOSSARY |
| 13 | A2UI | REPLACE |
| 14 | "priced / LARP" | REPLACE |
| 15 | house law | REPLACE |
| 16 | fleet / "erised fleet" | REPLACE |
| 17 | "the gifted corpus" / "gifted vision" | REPLACE |
| 18 | Quilt-Ternary Hyper-Embeddings (the expansion) | REPLACE |
| 19 | stone-v1 | RELEGATE-TO-LORE |
| 20 | "the tavern" | RELEGATE-TO-LORE |
| 21 | ORCH rounds / waves / docket | RELEGATE-TO-LORE |
| 22 | T* | KEEP+GLOSSARY |

---

## The audit

### 1. timbre / τ — KEEP+GLOSSARY
Load-bearing: it's the exported constant `TAU`, the header of every byte,
and the frozen invariant ("timbre never changes inside tick"). No plainer
word carries "the 2-bit operator character of a cell" without ambiguity.
**Glossary:** *"timbre (τ): the 2-bit 'character' of a cell — Ground,
Attract, Repel, or Abstain — stored in the top two bits of its byte. It
never changes during simulation; only your code changes it."*

### 2. Ground / Attract / Repel — KEEP+GLOSSARY
These are the API's own names (`TAU.GROUND` etc.) and they're already the
right metaphors: Ground is inert, Attract pulls, Repel pushes. A stranger
guesses correctly before reading. **Glossary:** *"Ground (τ=0): contributes
to neither channel, inert. Attract (τ=1): adds its amplitude to neighbors.
Repel (τ=2): subtracts it. Together they drive all local dynamics."*

### 3. Abstain — KEEP+GLOSSARY
The wormhole actor; the 'i' of the Ψ algebra {0, +1, −1, i}. The name is
slightly odd but it is *accurate* — this timbre sits out local physics —
and it's in the API (`TAU.ABSTAIN`). **Glossary:** *"Abstain (τ=3): the
timbre that exits local physics; its cells communicate only through the
wormhole table. The 'imaginary' channel of the algebra."*

### 4. "the Looking Glass" — RELEGATE-TO-LORE
A Carroll-allusion stacked on the erised culture, used in ONBOARDING's
identity sentence as a synonym for Abstain/the mirror. A stranger must
decode *poetry* to reach the *mechanism*. The technical term "wormhole
table" already exists and is better. Keep "Looking Glass" only in lore/
journal files and one parenthetical in SPEC.md if the founder wants the
poetry preserved. **Front-door replacement:** "Abstain — the wormhole
timbre."

### 5. wormhole table — KEEP+GLOSSARY
The mechanism itself (64 slots, `WormholeTable`), and honestly a good name:
"wormhole" says *non-local* faster than any neutral term. The risk is
sci-fi overpromise — defused by the gloss, which pins it to 64 concrete
slots. **Glossary:** *"wormhole table: a fixed 64-slot table through which
Abstain cells can couple at any distance — the only channel that bypasses
the 8-neighbor rule. Each slot holds one cell's coordinates and strength."*

### 6. twin resonance / twins — KEEP+GLOSSARY
The event kind in the public API (`{kind:'twin', …}`, `sub.lastEvents`) and
the subject of claim C2 (8/8 ON vs 0/20 OFF). **Glossary:** *"twin
resonance: when two Abstain cells share the same amplitude d, each reads
the other through the wormhole table and gains a push toward or away from
saturation. Emitted as a 'twin' event on every tick it fires."*

### 7. substrate — KEEP+GLOSSARY
Standard ALife vocabulary and the constructor's name (`makeSubstrate`).
"Grid" would collide with the *state* vs *state+table+counter* distinction.
Keep, but never let it appear unglossed next to "primitive" and "plane" in
one sentence (the current repo description stacks three abstractions in
nine words). **Glossary:** *"substrate: the whole simulated world — a
w×h array of packed bytes plus its tick counter and wormhole table."*

### 8. d (amplitude) — KEEP+GLOSSARY
Field name in `unpack()`. Single letters are cheap for strangers *if*
introduced once. **Glossary:** *"d: a cell's 6-bit amplitude, 0–63, stored
in the low six bits. What actually changes during a tick."*

### 9. σ (sigma) — KEEP+GLOSSARY
The wormhole coupling strength (default log₂ 3), swept by claim C3 (which
died as a *critical-scale* claim; σ survives as a monotone engineering
knob). Strangers need to know it's a dial, not a mystery. **Glossary:**
*"σ (sigma): how strongly a wormhole twin pushes — a per-tick parameter,
default ≈ 1.585. A tuning knob, not a law of nature (C3's 'critical scale'
died honestly)."*

### 10. LAYER 0 / 1 / 2 — KEEP+GLOSSARY
This is the project's *best* stranger feature hiding behind its driest
name: a three-tier honesty hierarchy (proven algebra / deterministic
mechanism / priced claims). Once decoded it tells a stranger exactly how
much to trust each sentence they read. Keep everywhere; gloss at every
entry point, not just ONBOARDING. **Glossary:** *"LAYER 0: byte-level
algebra, proven by exhaustion (all 256 bytes). LAYER 1: the tick mechanism,
determinism-checked. LAYER 2: performance claims — believed only with a
sealed experiment, nulls included."*

### 11. pre-registration — KEEP+GLOSSARY
Standard research methodology (clinical-trial vocabulary); Rex knows it
cold, Pixel has never met it. The concept is a selling point — commit the
success criteria before the run so results can't be moved. **Glossary:**
*"pre-registration: the experiment's pass/fail criteria are hashed and
committed before the run — nobody, including the author, can move the
goalposts after seeing results."*

### 12. receipt chain — KEEP+GLOSSARY
The honesty mechanism a researcher can *cite*: append-only sha256-linked
records of every run, verifiable from disk. "Receipt" alone can read as
accounting; "chain" alone smells of crypto hype; together with a gloss it
is precise. **Glossary:** *"receipt chain: every experiment appends its
setup, numbers, and verdict to a tamper-evident chain of sha256-linked
records — anyone can re-verify a claim from the repo, no trust required."*

### 13. A2UI — REPLACE
Never expanded in the public docs a stranger actually reads ("the A2UI live
mirror" — agent-to-what? to-whom?). The project's own plainer phrase
already exists and is better. **Replace with:** "the **live mirror**
(pixel = cell)" in all stranger-facing docs; if "A2UI" must survive as a
project name, expand and define it once in a glossary, then stop using it
in prose.

### 14. "priced / LARP" ("priced by experiment, not by LARP") — REPLACE
Two failures at once: "LARP" as a verb is in-group slang that reads as an
insult at the front door, and "priced" without a sentence of context reads
as money. The *intent* — no claim is believed until an experiment earns it
— is exactly right and must survive the rewrite. **Replace with:** "every
claim is **measured, not asserted** — pre-registered experiments, honest
nulls included." Internally the fleet can keep "priced/LARP" as shorthand.

### 15. house law — REPLACE
"House law: never rewrite a registered gate" reads as casino/cult to a
stranger, and the rules it names (fail-closed, never-rewrite-registered-
gates, an-honest-null-is-a-crown-jewel) are the project's *credibility
spine* — they deserve plain words. **Replace with:** "integrity rules,"
then state the rule: "registered gates are never rewritten; a documented
failure stays visible forever."

### 16. fleet / "erised fleet" — REPLACE
"Built by the erised fleet" (repo description) is a Harry Potter deep cut
plus an unexplained collective noun — the single most stranger-blocking
phrase in the project's public face. The people it describes are real, but
the name costs a wiki. **Replace with:** "built by SuperInstance, with
agent-assisted experiments, every result sealed and re-runnable." The
fleet identity stays in the journal, in lore, and in the worklog.

### 17. "the gifted corpus" / "gifted vision" — REPLACE
ONBOARDING's first paragraph asks a stranger to care about "the founder's
gifted vision" before they've seen a byte. It also obscures the actual,
admirable story: a corpus of ambitious claims, each one *tested to
destruction*. **Replace with:** "the founding research corpus" or "the
original proposal (SPEC.md) — kept, tested, and partly falsified."

### 18. "Quilt-Ternary Hyper-Embeddings" (the expansion of qthe) — REPLACE
The expansion is stranger-hostile three ways: "Quilt-Ternary" is
unexplained, "Hyper-Embeddings" resurrects a banned word (the honest
record says "embeddings" was a loss, not a feature), and the expansion is
longer than the name. **Replace with:** keep "qthe" as a bare proper noun;
let the description say what it *is*: "an 8-bit deterministic cellular
substrate." If an expansion is ever needed: "the packed-byte substrate."
(Repo description rewrite proposed in the appendix below.)

### 19. stone-v1 — RELEGATE-TO-LORE
The chain-record format from the sibling repo `quilt-stone`. The format
name is exactly the right level of detail for `receipts/` and technical
docs, and exactly the wrong level for ONBOARDING's identity paragraph. In
stranger docs, say "sealed receipt chains"; name "stone-v1" at most once,
in parentheses, where a curious reader can follow it.

### 20. "the tavern" — RELEGATE-TO-LORE
The guest-LLM review culture (`situations/`) — a genuinely interesting
practice (adversarial reviewer agents, outputs sealed as receipts) buried
under a D&D metaphor that requires the whole fleet mythology. In stranger
docs: **"the guest-review lane (`situations/`): adversarial LLM reviews of
the algebra, sealed as receipts."** The tavern stays in lore, where it can
keep its atmosphere.

### 21. ORCH rounds / waves / docket — RELEGATE-TO-LORE
Internal session numbering ("ORCH-R20", "wave 69", "the qthe-docket").
These are provenance metadata — *valuable* in the journal, meaningless in
a tutorial, and actively harmful in a claim table where "E-Q19 (ORCH-R20)"
makes a falsified starvation result look like a license plate. In stranger
docs: cite by claim ID and file ("E-Q19, `docs/CLAIM-VERDICTS.md` §C10"),
date if needed, and describe the artifact ("the tiled task-arbitration
inbox"), not the session that produced it. Same for sibling names used as
nouns (crab-traps, jev-garden, MicroMoth-quilt): link them, don't build
sentences on them.

### 22. T* — KEEP+GLOSSARY
Compact and standard scientific notation for a crossover time; it appears
in C11's honest partial (initial-condition spatial memory persists 512+
ticks). Fine *with* a gloss, wrong without one. **Glossary:** *"T*: the
tick count at which a substrate forgets its initial spatial pattern.
Measured to exceed 512 ticks — initial-condition memory is a slow mode of
the tick operator (C11, honest partial)."*

---

## Appendix — the front-door rewrite (proposed repo description)

Current (stranger-blocking, and it re-uses the banned "Embeddings"):

> QTHE — Quilt-Ternary Hyper-Embeddings: the 8-bit primitive (6-bit data +
> 2-bit timbre Ground/Attract/Repel/Abstain-as-i), the 64-slot looking-glass
> wormhole, the A2UI live mirror. Built by the erised fleet, priced by
> experiment, not by LARP.

Proposed (same facts, zero required wiki):

> qthe — an 8-bit deterministic cellular substrate. One byte per cell: a
> 2-bit character (Ground/Attract/Repel/Abstain) + a 6-bit amplitude; a
> 64-slot wormhole table as the only non-local channel; byte-identical
> traces across JS/C99/Python/Rust; a live mirror (pixel = cell). Every
> claim measured, not asserted — honest nulls included.

Two structural fixes this audit implies but does not itself perform:
(1) `demo/` vs `demos/` and the two root demos (`index.html`,
`public-demo.html`) should be consolidated or explicitly signposted — a
stranger's second question after "what is this?" is "which demo do I
open?"; (2) a `GLOSSARY.md` holding the KEEP+GLOSSARY entries above, linked
from README, ONBOARDING, and DAY-1, so every doc can stop re-explaining and
start linking.
