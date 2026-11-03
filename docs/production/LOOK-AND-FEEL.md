# LOOK-AND-FEEL — the design language spec for qthe's public surface

> Seat: stranger-experience · Round G2-4. The rules every page follows so
> that a stranger reads once and never needs us again — and an agent can
> ingest the same pages raw. Grounded in the live mirror (`index.html`,
> fetched this round) and the G1 jargon audit. Companion:
> `DOC-ARCHITECTURE.md` (what pages exist), `README-V0.md` (the front door,
> written to this spec).

---

## 0. The premise, stated as a design constraint

> "…it faded into the background like a good forgotten infrastructure.
> Think of the prize of being everywhere but forgotten."

The docs are not a story a stranger joins; they are a tool a stranger
uses once. Every rule below optimizes for the second meeting that never
happens: the user who, six months later, remembers only "the cellular
byte thing — it just worked, and the seed replayed." Good forgotten
infrastructure is *boring to reread and impossible to misremember*.

---

## 1. Voice rules

1. **Calm, specific, numbers over adjectives.** One number beats three
   adjectives; no number, no claim.
2. **Tool voice, not story voice.** Present tense. Second person for
   actions the reader takes, never for feelings we claim they have.
3. **Boundaries are specs, not confessions.** State limits the way a
   datasheet states them: "the table holds 64 slots; collisions resolve
   last-writer-wins." Never "unfortunately," never "we're sorry," never
   "caveat discovered later."
4. **One glossary, linked, not repeated.** Load-bearing terms (timbre,
   amplitude, substrate, wormhole table, twin resonance) are defined at
   first use on each path, once, in one sentence — then linked to
   `docs/GLOSSARY.md`. House vocabulary never appears at the front door
   (the G1 law: fleet, tavern, priced/LARP, stone-v1, waves → lore or
   plain words).
5. **Dead claims stay dead.** The falsified list (emergent intelligence,
   self-repair, phase transitions, "embeddings") may appear exactly once
   per surface, as a "what this is not" statement with a link to the
   record — never as an adjective, a metaphor, or a hope.
6. **Sentences a machine can quote.** Write claim sentences so an agent
   can lift them verbatim with their link and be right.

### Three rewrites (hype → tool), from the real corpus

**1. Mystery → mechanism.**
Was: *"The 8-bit primitive where data is geometry and control is
physics."* (upstream README, line 3 — poetry before the byte.)
Now: *"One byte per cell: a 2-bit timbre plus a 6-bit amplitude. The tick
rule reads both in one memory access."* (Same idea; the reader now knows
something checkable.)

**2. In-group slang → evidence.**
Was: *"Built by the erised fleet, priced by experiment, not by LARP."*
(repo description — a wiki a stranger doesn't have.)
Now: *"Every claim on this page links to a sealed, re-runnable experiment
record — including three claims that were tested and died."* (The
practice survives; the password doesn't.)

**3. Resurrected dead claim → live property.**
Was: *"watch emergent intelligence bloom across the plane."* (the class
of sentence the falsification record forbids.)
Now: *"Same seed, same art: the canvas replays pixel-for-pixel on every
machine; the seed is the entire difference between two worlds."* (A dead
adjective replaced by the property that actually survived testing.)

---

## 2. Page anatomy

### 2.1 The front door (README.md)

Exactly seven blocks, in order, nothing else:

```
1  name + one-sentence what          (~1 line; tool-grade, quotable)
2  unpack the sentence               (≤6 lines: byte, tick, table, languages)
3  who it's for                      (3 bullets, persona-named jobs)
4  install                           (the REAL method; npm status stated plainly)
5  first success                     (one snippet + its real output + "run it twice")
6  what it looks like in service     (3 patterns, each with its boundary in-line)
7  state table + one trust link      (Why trust this? → provenance/)
8  footer links                      (docs · examples (proposed) · provenance · LICENSE)
```

Test: blocks 1–5 must fit one screen. If a stranger scrolls past the fold
without seeing install + a runnable sample, the page has failed.

### 2.2 A guide / recipe page

```
# <the job, as the stranger would search it>      e.g. "Deterministic terrain
                                                   that hashes to the same seed forever"
Problem        2 lines: the situation, the constraint.
Pattern        run-verified code + its real output (never paraphrased).
Boundary       ONE spec callout (§3.1): the limits you'd hit next.
Why trust this one link → provenance/ row that seals this pattern's numbers.
Next           ≤2 links, one per natural follow-on.
```

Recipes never exceed ~120 lines. If a recipe needs a second idea, it is
two recipes.

### 2.3 A reference page (generated, never hand-written)

One section per export: signature, one sentence of purpose, args/returns
table, one executed example, one gotcha line where the kernel has one
(e.g. `traceView` vs `JSON.stringify`; `mulberry32` 2³² wrap). The page is
CI-generated from types + doc-comments in `qthe.mjs`; hand-edits fail the
build. The reference never re-explains concepts — it links the glossary.

---

## 3. Component rules

### 3.1 Boundary callout

The signature component — the reason the docs can be trusted.

- **Format:** a fixed `**Spec:**` prefix followed by 1–4 declarative
  sentences with numbers, present tense.
- **Placement:** immediately after the code it constrains. Boundaries
  travel WITH the feature — a separate "Caveats" page is an anti-pattern
  (nobody reads it; the boundary and the feature must be separable only
  by scissors).
- **Voice:** datasheet, not apology. "Under ~256 same-tick Abstain
  writers the table saturates; delivery survives (80/80), sender
  attribution does not." Not: "we should warn you that…"
- **Mandatory pairs** (binding from the G1 adjudications): 47.40% gain ⇄
  cached-port caveat; LWW ⇄ every wormhole mention; flood-cap ⇄ p99 +33%;
  determinism ⇄ op-log-not-yet-measured.

### 3.2 Honesty box

- One small table, three status tiers (priced & live / priced & partial /
  not priced), one gloss line defining "priced" in plain words ("measured
  by a pre-registered experiment with a sealed, re-runnable record").
- Exactly one outbound link: **Why trust this? → provenance/**.
- CI diffs every number in it against the scoreboard; a hand-edited
  number fails the build.
- Never at the top of a page. It follows the work, like a results table.

### 3.3 Versioned snippets

- Every code block exists as a file (or path-stamped block) and carries:
  `verified: qthe@<commit> · node <v> · <date>` — light in prose, exact in
  the repo (`snippets/` + CI battery; drift fails the build).
- Outputs are pasted from real runs, never from memory. A snippet whose
  output isn't pinned is a draft, not docs.
- The README states the verification once ("every block on this page was
  executed before shipping") instead of stamping every block — one trust
  sentence, machine-checkable underneath.

### 3.4 Record links ("receipt links" → plain English)

- One label everywhere: **Why trust this?** → `provenance/`. Consistent
  wording so both humans and agents learn the hop once.
- One click deep, never inline: no chain tips, no experiment narrative,
  no scoreboard rows on usage pages. Provenance displayed is provenance
  shouted past.
- Link targets are stable paths (`provenance/CLAIM-VERDICTS.md#C1`), not
  diffs or sessions.

---

## 4. Visual identity — the mirror is the brand

The live mirror (`index.html`) already solved the identity problem; the
docs inherit it, not the reverse. All values below are the mirror's
actual CSS, fetched this round.

**Core motif: pixel = cell.** The substrate is the logo. Any qthe surface
may render a small plane where one pixel is one byte, and it must render
crisp (`image-rendering: pixelated`) — never blurred fake pixels. In
print/ASCII contexts, the plane is a literal character grid.

**The tau palette is semantic, not decorative — four colors, four
meanings, everywhere:**

| timbre | color | hex (from the mirror's legend) | docs meaning |
|---|---|---|---|
| Attract (τ=1) | green | `.g` `#4fd45f` (HUD hash `#7fdc87`) | live, verified, works |
| Repel (τ=2) | red | `.r` `#e05a5a` (HUD off-state `#e07a7a`) | dead, falsified, breaks |
| Ground (τ=0) | gray | `.k` `#55555f` | not yet measured / partial |
| Abstain (τ=3) | purple | `.p` `#b06ae8` (accents `#a86ae8` / `#d9b8ff`) | the non-local channel: twin events, wormhole table, anything that skips the neighborhood |

Usage law: these four colors never mean anything else. A green checkmark
means *priced & live*; a red row on the scoreboard means *falsified*;
gray means *honestly unknown*; purple marks the wormhole table and only
the wormhole table (it is the event color — used sparingly, as in the
mirror, where a purple blink means "the table answered"). Purple is also
the brand accent (favicon is the Abstain purple) precisely because it is
the rarest event in the system.

**Surfaces:** substrate-black base `#0b0b10`; panels `#12121a` /
`#16161f` / `#23232e`; borders `#2c2c3a` / `#4a4a5e`; text `#e8e8f2`,
secondary `#c9c9d4`, muted `#9a9aac` / `#6f6f80`. In light contexts
(print, GitHub light), invert to near-black-on-white and keep the four
tau hues — they carry the semantics.

**The HUD motif:** the mirror shows the live sha256 of the byte plane;
docs echo this by displaying hashes as first-class content — full-width
monospace lines, never truncated to "b49b…". A hash on the page is proof
as decoration: quiet, constant, checkable.

---

## 5. Typography and spacing

- **Monospace-first.** The mirror sets everything in
  `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` at
  `13px/1.45`; docs adopt the same stack as identity — in qthe, numbers
  *are* the content, so prose and code share one voice. Long-form pages
  may step body size to 15–16px; the stack never changes.
- **Micro-labels** in the HUD style: uppercase, `letter-spacing: .08em`,
  muted color — used for section eyebrows (SPEC, VERIFIED, STATUS), never
  for headings that carry meaning.
- **Measure:** ≤ 72 characters per line. Code blocks never wrap — wrapped
  code is edited code, and every snippet is verified verbatim.
- **Rhythm:** one idea per screen; blank space before every component
  callout; tables stay ≤ 5 columns so they render readably as plain text.
- **Plain-text safe:** every page must read correctly as raw Markdown —
  agents read the raw file. No meaning may live only in color, images, or
  hover states (the tau table above carries hex codes and words for
  exactly this reason).

---

## 6. What "good forgotten infrastructure" docs look like

**Docs you read once.** The front door answers what/for-whom/install/
first-success inside one screen; everything deeper is reachable only on
demand, and no page assumes another page was read. The 15-second test: a
stranger landing cold can (a) say what qthe is in one sentence, (b) run
one sample, (c) know where the evidence lives — all before scrolling
past the fold.

**APIs you can guess.** The names do the teaching: `makeSubstrate`,
`tick`, `pack`/`unpack`, `traceView`, `mulberry32`. Rules that can't be
guessed are stated once, at the point of first contact, in one sentence
(`tick` mutates and returns; serialize with `traceView`, never
`JSON.stringify`; timbre never changes inside `tick`). The API surface is
exactly the exports of `qthe.mjs` — docs never imply a redesign that
hasn't shipped.

**Errors that teach.** Every error path names its fix: the gate suite
without its sibling dependency refuses with the exact clone command in
the message; `RangeError` quotes the offending slot; troubleshooting
entries are symptom → cause → fix, never prose. An error message is the
last doc a user reads before giving up — it is a page.

**The forgetting test.** After one session, a user should be able to
reconstruct three things from memory: the byte layout (2+6), one boundary
(64 slots, last-writer-wins), and where the records live (provenance/).
If they can't, the front door failed — not their memory.

---

## 7. Anti-patterns (each one has shipped somewhere; none ships here)

1. **Marketing resurrection.** A dead claim returning as an adjective
   ("intelligent," "self-healing," "emergent") anywhere in prose, titles,
   or alt text. The falsification record makes this the one
   unpardonable sin.
2. **Wall-of-text philosophy.** The 56 KB research journal as the front
   door; "data is geometry" before install. Philosophy is welcome one
   click deep, in provenance/, where it is evidence.
3. **Buried install.** Install below a vision statement, a TOC, or a
   history section. Install is block 4 of the front door, always.
4. **Hand-edited numbers.** Any number a human typed that a CI job
   could have generated — it will drift, and drifted numbers are
   lied-about numbers.
5. **Unverified snippets.** Code whose output was pasted from memory or
   "should be something like." A snippet that hasn't run is a sketch,
   and sketches don't ship.
6. **House vocabulary at the door.** Fleet, tavern, priced/LARP,
   stone-v1, wave numbers, ORCH rounds — the G1 audit's REPLACE and
   RELEGATE-TO-LORE lists, enforced. Lore lives in the journal, where it
   can keep its warmth.
7. **Trust shouted, not linked.** Inline chain tips and scoreboard rows
   on usage pages. Provenance displayed on the front door is noise in an
   apron — one link, one click, always the same label.
8. **Boundary dumping.** A "Caveats" or "Limitations" page far from the
   features. Boundaries ship inside the component they constrain.
9. **Apology voice.** "Unfortunately we don't yet support…" — the spec
   voice states the boundary and moves on; regret is not information.
10. **Surprise vocabulary drift.** Two names for one thing across pages
    (mirror/A2UI, record/receipt). One name per concept, chosen by the
    glossary, forever.
