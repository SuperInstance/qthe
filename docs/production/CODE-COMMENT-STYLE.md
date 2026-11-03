# CODE-COMMENT-STYLE — the qthe house comment law

**Status:** binding for @qthe/core, the kernel, and all lane code from v0.1
**Author:** library-craft seat, coursework G2-7 · **Adopted:** 2026-11-02
**Amendments:** none yet — nothing counts until it is in an ADJUDICATIONS file

---

## 0. The founding receipt

The principal's directive, verbatim — every rule below exists to enforce some
part of it, and where a rule and an intuition disagree, the directive wins:

> "remember that making good thorough comments in code, especially on how the
> parts interconnect with distant files, can help the next agent coming
> through optimizing understand the bigger picture without having to look
> around. push often as you go with good comment. they mark our thinking at
> the different moments making it easier to reimagine later where the thoughts
> were at at the time of inception for fine tuning and reiterative
> development in novel ways."

Three obligations hide in that paragraph, and they are the law's spine:

1. **Interconnection** — comments must carry the file-to-file wiring
   ("distant files… the bigger picture without having to look around").
2. **Moments** — comments must be *dated records of thinking at the time of
   inception*, not timeless prose ("they mark our thinking at the different
   moments").
3. **Cadence** — push often, comment as you go ("push often as you go with
   good comment").

Comments in this house are therefore not decoration. They are the **decision
ledger**: code says what happens, the ledger says why it had to, and git says
when and by whom. A comment that can be deleted without losing information
was noise; a comment that contradicts the code is a lie with seniority.

---

## 1. Rule one — the header receipt block

Every file opens with a block that answers, before any code: why does this
file exist, which rulings does it embody, and which distant files does it
talk to?

```
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
// One paragraph: the job, and why the job is a file and not a function
// somewhere else. If the paragraph can't be written, the file might not
// deserve to exist.
//
// ── RECEIPTS ──────────────────────────────────────────────────────────
// The rulings this file embodies, by citation (never restated at length):
//   ADJUDICATIONS-G1.md flag 1 — digest stamps ≠ npm semver
//   CRITIQUE.md F1 — σ leak, receipt V5
//
// ── INTERCONNECTS ─────────────────────────────────────────────────────
// One line per distant file: path — what flows between us.
//   OLOG-SPEC.md — op schema is normative here; this file types it
//   ../field-lane/bytePlane.ts — reads sub.bytes; we must not break it
```

Requirements:

- **INTERCONNECTS names files, not folders, and says what flows.** "utils/"
  is not an interconnect. "traceView.js — the HUD renders exactly this
  shape; a field rename here is a cross-lane break" is. List every file
  whose contract this file consumes or produces, especially the ones far
  away — the distant files are the whole point.
- **RECEIPTS cite; they do not copy.** A receipt restated in a comment
  drifts the moment the ruling is amended; a citation never does. One line
  of citation plus, at most, one line of why-it-bites-here.
- **The block is the map, not the territory.** The test for the whole
  header: could an agent who reads only this block know which files to
  open next, and why? If the answer is "they'd open everything," the
  header has failed at its one job: saving the next agent the looking
  around.

---

## 2. Rule two — thinking markers

A thinking marker records the decision **moment**. Format, fixed and
grep-able:

```
// [YYYY-MM-DD][author] decision: X over Y because Z; revisit if W.
```

- **Dated** (ISO, `2026-11-02`) and **attributable** (seat name or handle:
  `[library-craft]`, `[kernel-forge]`, a personal handle outside the
  guild). The date is not bureaucracy — "reimagine later where the
  thoughts were at at the time of inception" is impossible without it.
- **Placed at the decision site**, not collected at the file top. The
  marker lives next to the line whose fate it decided.
- **The revisit clause is what makes a marker a marker.** A decision
  without a reopen condition is a wall, not a choice. "Revisit if a sealed
  corpus is found to contain wrapped seeds" tells the next agent exactly
  when this conversation reopens; "we decided" tells them nothing.
- **Append-friendly: never edit, never delete.** When a decision is
  superseded, append a marker that names the old one by date:

```
// [2026-10-28][kernel-forge] Int32Array backing for the table: slot count
//   is fixed at 64, so static allocation beats a Map on every tick.
// [2026-11-02][library-craft] supersedes 2026-10-28 for @qthe/core only:
//   Int32Array's silent coercion (NaN→0 retargeted a twin, receipt V6)
//   is indefensible behind a public API — write() now validates and
//   throws. Kernel keeps the raw arrays; compat keeps the coercion.
```

The old marker stays. The pair, read together, IS the history of the
thinking — the shape of "reiterative development in novel ways" is exactly
these two lines next to each other.

---

## 3. Rule three — why-not-what, and the next-agent test

**Comment the why. Never narrate the what.** The code already states what
it does, in the only language that executes. The comment's jurisdiction is
everything the code cannot say: the constraint that forced the shape, the
alternative that was rejected and the reason, the receipt that settled it,
the hazard that was knowingly kept.

- `acc += nb & D_MAX; // accumulate Attract neighbor` — crime: the code
  says this.
- `acc += nb & D_MAX; // Attract contributes +d to the real channel and
  nothing to the imaginary one (PSI table, SPEC LAYER 0) — the sign split
  is what makes the paired arms comparable` — earns its bytes: the why, the
  constraint, the interconnect.

**The next-agent test** (the law's enforcement gate, used in review):

> An optimizing agent that reads ONLY this file must be able to reconstruct
> the decision lattice — the choices, the reasons, the hazards kept, the
> reopen conditions — without opening any other file.

The agent may need other files to *change* behavior; it must never need
them to *understand the decisions*. If a reviewer has to open the SPEC to
learn why τ is frozen inside tick(), the comment at `cells[i] = (tau << 6)
| nextD(...)` failed. (This test is what the principal's "next agent coming
through optimizing… without having to look around" means operationally.)

---

## 4. Rule four — comment-first commits

The directive pairs the two ledgers: "push often as you go with good
comment." The rule that binds them:

- **The commit message extends the thinking-marker; it never replaces it.**
  A commit message is a chronological ledger entry — dated, pushed, durable
  — but it lives in git, far from the code it explains. The marker lives
  at the site. Both, always: the marker records the decision where the
  next optimizer will trip over it; the commit records the push-moment
  ("ships the 2026-11-02 σ-lifetime marker; tick() options removed").
- **A commit whose why exists only in the message is incomplete.** Review
  gate: if the commit's reasoning is not findable in a marker adjacent to
  the changed lines, the PR goes back. Six months later nobody bisects
  prose; everybody reads the line above the bug.
- **Push small, push often.** The cadence is not a style preference — the
  pushes ARE the moment-record. A month-old omnibus commit marked "various
  fixes" has destroyed four weeks of thinking-markers git could have kept.

---

## 5. Rule five — anti-patterns (the crimes, ranked)

1. **The stale comment — worst crime.** A comment that contradicts the
   code is trusted precisely because comments are supposed to be the why.
   It converts every future reader's shortcut into a trap. When behavior
   changes, the old marker is superseded by name (Rule 2) or dies with the
   deleted code — silently-editable prose comments go stale by default.
2. **Narrating the obvious.** `i++; // increment i` trains readers to skip
   comments, which is how the important ones get skipped.
3. **Lore that rots.** "We tried that once, it was slow" — no date, no
   number, no reopen condition: unverifiable and unactionable. If it
   mattered, it would be a dated marker with a receipt. If it didn't, it
   is noise with nostalgia.
4. **Spec-in-comments.** Restating a normative document inside a comment
   creates a second normative document that will diverge (see: the
   kernel's own `seedFn(i, x, y)` doc-comment vs its `fn(x, y, i)` code —
   CRITIQUE F4, receipt V8). Cite the doc; state only the local
   consequence.
5. **TODO without a trigger.** Every TODO names a condition and a date
   ("TODO when corpus 24/24 lands: re-price the cached-port caveat") or it
   is a wish, and wishes are not maintainable.
6. **Jargon without a receipt.** House slang ("priced", "receipt", "LARP")
   is fine in comments — for this house — but a claim word ("determinism:
   priced") must carry or cite its receipt. api-surface-v0.1.d.ts's
   DETERMINISM RECEIPT blocks are the standard: the claim, the corpus
   count, the open half, all in the comment, none of it in prose memory.

---

## 6. Doc comments vs. line comments

- **JSDoc on the public surface is contract, not commentary.** It states
  the promise (signature meaning, domains, throws, invariants, receipts)
  and it may state WHAT — because for an API surface the what *is* the
  why. The standard is `api-surface-v0.1.d.ts`: every determinism claim
  carries its receipt block verbatim; every deprecated compat export
  carries its defect receipts; every v0.1 decision carries its dated
  marker.
- **Line comments inside implementations are thinking markers and
  why-notes** (Rules 2–3). They never restate the JSDoc; they record what
  the contract's reasons were at the moment of writing.
- The distinction is load-bearing: contract docs change with the API and
  are reviewed like the API; markers are history and are append-only.

---

## 7. Worked example — the real kernel's tick(), re-commented under the law

**Before** — `qthe.mjs` (main, fetched 2026-11-02), lines 216–231, verbatim.
This is *better* than industry median — it cites receipts — which is exactly
why it makes a fair test case: what is still missing?

```js
      let pressure = acc;
      if (tau === 3 && wormholes) {
        const hit = table.read(d);                    // live read (R2)
        if (hit && hit.resonance !== 0 && (hit.x !== x || hit.y !== y)) {
          const term = hit.resonance * sigma;         // twin resonance, item 4
          pressure = acc + term;                      // imaginary pressure (R3)
          events.push({ kind: 'twin', x, y, slot: d, resonance: hit.resonance, term });
        }
        table.write(d, x, y, Math.abs(acc) + 1);      // write for the next tick
      }
      cells[i] = (tau << 6) | nextD(d, pressure);   // in place (R6); tau frozen
    }
  }
  cells.ticks = (cells.ticks | 0) + 1;
  cells.__wormholes = wormholes ? table : cells.__wormholes;
  cells.lastEvents = events;
  return cells;
```

What the before gets right: receipt citations (R2, R3, R6) instead of
nothing. What it lacks under the law: the *why* behind each receipt, the
two known hazards sitting on the persistence lines, every interconnect, and
every date. A receipt citation without the why is a library card with no
book behind it — the next agent still has to look around, which is the
exact failure the directive names.

**After** — the same sixteen lines under the law. (We were not present at
the kernel's inception; the receipts R1–R7 are the kernel's own recorded
decisions, and the markers below date OUR study moment while phrasing ITS
choices. Had the law existed at inception, the author's markers would carry
the inception dates. That is the point of the format: the moment is part of
the record.)

```js
      // ── Abstain channel: the only place tick() touches the wormhole table.
      // WHY live here when everything else reads the snapshot: cells are
      // pre-tick so the update stays synchronous, but the table is read LIVE
      // in row-major order, so an equal-d twin pair becomes mutually audible
      // from their second co-tick on — that exact schedule is the G5
      // mechanism claim, pinned in tests/receipts.jsonl. Fixed iteration
      // order is what keeps a live read deterministic (receipt R2).
      // [2026-11-02][library-craft] revisit if the table ever goes
      // concurrent or slot-count leaves 64 — determinism of the live read
      // rests entirely on this loop's order.
      let pressure = acc;
      if (tau === 3 && wormholes) {
        const hit = table.read(d); // d IS the slot index: amplitude is the address
        // WHY the guard triple: resonance 0 means present-but-inert (a
        // cleared slot keeps coordinates but must not fire — R4); the
        // self-hit exclusion stops a cell resonating with its own write,
        // which would turn the twin channel into a self-echo. Both guards
        // are mechanism, not defense — delete either and G5's fixtures
        // change. A NaN resonance coerced to 0 makes the first guard eat
        // a real twin silently (CRITIQUE V6b) — kernel-exact, kept.
        if (hit && hit.resonance !== 0 && (hit.x !== x || hit.y !== y)) {
          // term = resonance·σ: the imaginary channel enters through the
          // only degree of freedom the byte has — d — because τ is frozen
          // (R3). σ is therefore empirically potent (a lone resonance-1
          // twin at σ=log2(3) flips exactly one unit of net pressure) and
          // the C3 sweep rides on this line; traceView() and the A2UI HUD
          // consume the event shape below — a field rename here is a
          // cross-lane break, not a refactor.
          const term = hit.resonance * sigma;
          pressure = acc + term;
          events.push({ kind: 'twin', x, y, slot: d, resonance: hit.resonance, term });
        }
        // resonance = |acc|+1: the +1 guarantees nonzero, which is what
        // keeps the inert guard above meaningful for every writer; |…|
        // because acc's sign has already acted on d and resonance is a
        // magnitude. This write is LIVE (R2): a same-tick later reader of
        // slot d hears it — that is not a race, it is the mechanism.
        table.write(d, x, y, Math.abs(acc) + 1);
      }
      // τ frozen inside tick (R3/R4): timbre is written only by injectors,
      // so C2's paired arms stay byte-comparable — the timbre plane is the
      // experimental variable; the physics must not move it. In-place
      // writing is exact here only because every neighbor read above came
      // from `snap`, never from `cells` (R6).
      cells[i] = (tau << 6) | nextD(d, pressure);
    }
  }
  cells.ticks = (cells.ticks | 0) + 1;
  // ── state-persistence epilogue: two known hazards live on these lines ──
  // [2026-11-02][library-craft] HAZARD, kept kernel-exact: if `table` was
  // lazily constructed this tick, it captured the caller's one-tick sigma
  // in its constructor — and this line makes that σ PERMANENT substrate
  // state (CRITIQUE.md F1, receipt V5: tick({sigma:5}); tick({}) runs at
  // σ=5 forever). The doc comment on tick() promises "for this tick"; this
  // line breaks the promise. @qthe/core prevents it by construction (no
  // per-tick σ exists to leak — invariant I6). Fixing it here would break
  // every script that depends on the leak; revisit only if a core release
  // replaces this kernel as the normative build.
  cells.__wormholes = wormholes ? table : cells.__wormholes;
  // [2026-11-02][library-craft] HAZARD: lastEvents is ONE slot — each tick
  // overwrites it, so events-over-time statistics are silently wrong
  // unless the caller captured traceView() after every single tick
  // (CRITIQUE F3). Core's traces carry the full per-tick stream instead.
  cells.lastEvents = events;
  // R6 frozen cross-lane contract: mutate AND return the same object —
  // callers may reassign or not, both must keep working.
  return cells;
```

**What the deltas each bought** (the analysis is the lesson):

- The live-read block answers the question the original citation (R2)
  begged: *why* would a synchronous kernel read anything live? Answer
  includes the interconnect (tests/receipts.jsonl, the G5 fixtures) and
  the reopen condition (loop order, slot count).
- The guard triple and the `|acc|+1` now explain themselves as mechanism
  with consequences ("delete either and G5's fixtures change") — the next
  agent knows what not to "optimize."
- The two persistence hazards (F1, F3) went from invisible to labeled
  with receipts, dates, and the reason they are deliberately kept — a
  stranger optimizing this file will now trip over the warning *before*
  the bug, not after.
- The event-push line carries its cross-lane contract (HUD, traceView),
  which is the directive's "distant files" requirement in miniature.
- Nothing narrates the obvious. The after is longer because sixteen lines
  of kernel physics contain more than sixteen decisions; every added line
  carries a decision, a hazard, or an interconnect.

---

## 8. Enforcement

- **Review gate:** the next-agent test (Rule 3). Reviewer asks of each
  changed hunk: did I need to open another file to understand a decision?
  If yes → incomplete, return to author.
- **Grep-ability as law:** markers are mechanically findable —
  `rg "\[\d{4}-\d{2}-\d{2}\]\["` lists every recorded moment; files whose
  first block lacks `WHY THIS FILE EXISTS` fail the header check.
  [2026-11-02][library-craft] a CI checker for both is a one-file script;
  owed when the repo grows past one package. Revisit at first external PR.
- **The law binds every language in the house** — `.mjs`, `.ts`, `.d.ts`,
  the C kernel (adapt comment syntax, keep the shape: header block,
  dated markers, receipts cited, interconnects named).
- **Amendments** to this law follow house procedure: proposed as a dated
  marker inside this file, adopted only when recorded in an ADJUDICATIONS
  file. Nothing counts until verified.
