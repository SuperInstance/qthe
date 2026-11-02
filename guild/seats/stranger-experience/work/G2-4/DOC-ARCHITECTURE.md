# DOC-ARCHITECTURE — the information architecture for the production toolkit

> Seat: stranger-experience · Round G2-4. This is the build plan for every
> public page qthe ships: what exists, what is proposed, where each page
> lives, what links to what, and who (human or CI) is allowed to write which
> number. Companion artifacts: `README-V0.md` (the front door, written for
> real) and `LOOK-AND-FEEL.md` (the design language). Inputs grounded this
> round: `qthe.mjs`, `docs/ONBOARDING.md`, `docs/DAY-1.md`, upstream
> `README.md`, `docs/CLAIM-VERDICTS.md`, `docs/BOUNDARY-MAP.md`,
> `index.html` (all fetched and read; every number below appears in those
> files or was re-run live this round).

---

## 0. The one law the architecture serves

The principal's orientation, restated as an architectural constraint:

> "When they put it in production with their projects, it was so awesome, it
> faded into the background like a good forgotten infrastructure. Think of
> the prize of being everywhere but forgotten."

A stranger installs once, reads one page once, and never thinks about qthe
again. An agent scouts once, ingests the manifest, and never needs the
prose again. Every decision below follows from that: **the front door is a
tool, the trust layer is one click away, the numbers are machines' work.**

Two readers, always both:

- **Human (grab-and-go):** skims in ~15 seconds, copies one snippet, leaves.
- **Agent (scout):** fetches `llms.txt` → `qthe.manifest.json` → run-verified
  snippets, and answers "would this help my user?" without reading prose.

If a page serves neither reader, it belongs in `provenance/` (the archive)
or nowhere.

---

## 1. The layout (proposed v1 tree; migration map in §8)

```
/                         README.md          ← the front door (§2)
                          LICENSE
                          llms.txt           ← the agent index (§5.1)
                          qthe.manifest.json ← the capability manifest (§5.2)
/docs/                    INSTALL.md
                          GLOSSARY.md
                          TROUBLESHOOTING.md
    quickstart/           pixel.md · locke.md · arden.md · rex.md
    guides/               terrain-hash.md · lockstep-state.md ·
                          byte-dense-planes.md · non-local-pairing.md ·
                          serialization.md
    api/                  index.html + index.json   ← GENERATED, never hand-edited
/examples/                (proposed — gallery, each example a runnable dir)
/snippets/                every doc snippet as a file, CI-executed (§5.3)
/provenance/              README-RESEARCH.md  ← the current research README, moved
                          CLAIM-VERDICTS.md   ← the scoreboard of record
                          BOUNDARY-MAP.md     ← wins/losses with experiment records
                          STATUS.md           ← CI-GENERATED numbers page (§6)
                          receipts/           ← sealed chains (or links to them)
```

Rules encoded in the tree:

- **Two top-level dirs only for readers:** `docs/` (how to use) and
  `provenance/` (why believe it). Nothing else asks for attention.
- `provenance/` is reachable in exactly one click from any number anywhere —
  and is never displayed inline on a usage page.
- The research corpus (experiments, situations, crossimpl journals) stays
  where it is today; `provenance/README-RESEARCH.md` becomes its front page
  so the root README can stay a tool.

---

## 2. The front door — README.md

Purpose: what it is / who it's for / install / first success, in ~15
seconds of scrolling. Written in full as `README-V0.md` (this round's
second deliverable). Anatomy, top to bottom:

1. **One sentence, tool-grade.** "An 8-bit deterministic cellular
   substrate: one byte per cell — 2-bit timbre (Ground/Attract/Repel/
   Abstain) + 6-bit amplitude — toroidal Moore-8 tick, 64-slot wormhole
   table as the only non-local channel."
2. **Who it's for: three bullets** (creative coders; game/sim engineers;
   embedded engineers). The researcher is served by the trust layer, not
   the front door — Rex's page is `provenance/` itself.
3. **Install, the real method today:** `git clone` + Node ≥ 18; npm marked
   *in progress*, never implied to exist.
4. **One code sample that runs today**, with its real output
   (`bijection 256/256, ticks 10, twinEvents 979` — executed this round).
5. **"What it looks like in service":** three engineering patterns, each
   with its boundary stated in-line as SPEC (§4.3).
6. **"State of the substrate" honesty box:** live / partial / not yet
   measured, one small table, linking to `provenance/` (§4.4).
7. **Footer links:** docs, examples *(proposed)*,
   `provenance/README-RESEARCH.md`, LICENSE.

The zlib test governs the whole page: a stranger reads it once and never
needs it again. If a paragraph doesn't help them install, run, or trust,
cut it.

---

## 3. The path structure

### 3.1 INSTALL.md — one page, no philosophy

Clone, prerequisites (git, Node ≥ 18; python3/cc optional), the smoke
command with real output, the two sibling-repo notes (the gate suite needs
`quilt-stone` beside qthe — it refuses loudly without it; nothing on the
install path does), and nothing else. Install problems route to
TROUBLESHOOTING.md, not to a paragraph here.

### 3.2 Quickstarts — one per persona, ten minutes each

Four files, four first-successes, all ending in a verifiable artifact the
reader *owns* (not a demo they watch):

| file | reader | first success (the exit of the 10 minutes) |
|---|---|---|
| `quickstart/pixel.md` | creative coder (p5/Processing/exhibitionist JS) | their own canvas sketch; reload → identical frame; seed change → new world, equally reproducible |
| `quickstart/locke.md` | game/sim engineer | two processes, one seed, identical sha256 of the world state (lockstep-ready state; replay = re-tick from seed) |
| `quickstart/arden.md` | embedded engineer (Cortex-M class) | `cc -O2 -std=c99` one-line build of the C99 port; byte-exact plane hash vs the JS kernel |
| `quickstart/rex.md` | researcher | reruns the verifier from disk: every claim, every chain, honest nulls included |

Existing raw material: this seat's G1 `QUICKSTART.md` (Pixel, commands
verified live in G1 and re-verified this round) is the template voice;
`docs/DAY-1.md` holds the verified Locke/Rex commands (REPL, verify_all_
chains, e_q13 rerun); `crossimpl/c/` + `qthe-core/` hold the Arden path.

### 3.3 Guides/recipes — named by the job, not the mechanism

A stranger searches for their problem, not our vocabulary. Recipe titles
are the searchable sentence:

- **`guides/terrain-hash.md` — "Deterministic terrain that hashes to the
  same seed forever."** Seed with `mulberry32`, tick N times, hash
  `Buffer.from(sub)`. Real anchor (re-run this round): seed 42, 64×64,
  100 ticks → `sha256 b49b9a13…f6042`, twinEvents 978, identical across
  processes. Boundary: covers seeded construction + the tick operator;
  arbitrary mid-run mutation journals (op-log determinism) are **not yet
  measured** — link to the state table.
- **`guides/lockstep-state.md` — "Lockstep-ready state."** State that two
  machines can prove equal: `traceView()` for serialization (never
  `JSON.stringify` — expandos ride the Uint8Array), hash of the byte plane
  as the equality witness, replay = seed + tick count. Boundary: tick
  determinism receipts, itemized — JS + independent spec-only rebuilder
  12/12 corpus traces; Rust 13/13; C99 19-case battery + 24-case Guild
  corpus; Python LAYER-0 exact (a single four-language corpus replay is the
  P1 exit criterion); the JS input horizon is ±2^53.
- **`guides/byte-dense-planes.md` — "Byte-dense planes in C."** One byte
  per cell; the packed byte carries operator and operand in one read;
  ~47% less byte traffic than a 2-byte split encoding at identical
  dynamics (E-Q13: 331,776 vs 630,784 bytes-to-task; standing footprint
  4,096 vs 8,192 B on 64×64). **Mandatory caveat wherever 47.40% appears**
  (adjudication amendment 9): a cached port holding the timbre plane
  resident reaches per-tick parity — the sealed gain is against the
  portable, uncached encoding. C99 port builds with one `cc` line, no
  libm; for MCU work pitch the fixed-point plane (runtime 0.975× of
  float; faithful where adversarial rational σ breaks the float plane).
- **`guides/non-local-pairing.md` — "Non-local pairing within writer
  budgets."** Abstain cells with equal amplitude couple through the
  64-slot wormhole table at any distance; no message bus, no routing
  (8/8 delivered ON vs 0/20 OFF, E-Q1). Boundary, as SPEC: same-slot
  collisions resolve last-writer-wins; the table holds 64 slots and
  saturates under ~256 same-tick Abstain writers — delivery survives
  saturation (80/80 pair-trials at 256 polluters, E-Q14), sender
  attribution does not (pollution fraction → 1.0). Plan for a few writers
  per slot per tick.
- **`guides/serialization.md`** — traceView vs JSON.stringify, hashing the
  plane, what rides on the array (`w, h, ticks, __wormholes, bytes`).

Recipe page anatomy (see LOOK-AND-FEEL.md §3): Problem (2 lines) →
Pattern (run-verified code) → Boundary (spec callout) → Receipts link.

### 3.4 API reference — generated from types, never hand-written

Source of truth: the kernel's actual exports (`makeSubstrate`, `tick`,
`pack`, `unpack`, `tauOf`, `dOf`, `vectorPass`, `traceView`, `mulberry32`,
`WormholeTable`, `nextD`, `TAU`, `PSI`, `SLOT_COUNT`, `DEFAULT_SIGMA`,
`D_MAX`) typed by the library-craft seat's `api-surface.d.ts` (G1-2,
`tsc --strict` clean). CI generates `docs/api/` from the types plus
doc-comments in `qthe.mjs`; a hand-edit to `docs/api/` fails CI. Today's
honest bridge: the reference page links to `qthe.mjs` itself (266 lines,
heavily commented — the comments are the real spec) until generation is
wired. No released API redesign is implied anywhere.

### 3.5 Examples gallery — proposed

`examples/` with one runnable directory per use (terrain, lockstep pair,
C plane, canvas sketch), each carrying its own expected output. **Marked
proposed in every link until the first example merges.** G1 hook
artifacts that exist today and seed the gallery: `index.html` (live
mirror), `demos/agent-coordination.mjs`, `scripts/repl.mjs`,
`scripts/replay.mjs`, `crossimpl/c/esp32_demo.c`.

### 3.6 TROUBLESHOOTING.md — errors that teach

Every entry: symptom → cause → fix, drawn from the verified gotchas in
`docs/ONBOARDING.md`, translated per the G1 jargon audit:

- ES modules refuse `file://` → serve over localhost (browser rule, not a
  qthe one).
- `tests/run_tests.mjs` refuses without the `quilt-stone` sibling → that is
  fail-closed by design; the refusal message names the fix; nothing on the
  install path needs the sibling.
- `JSON.stringify(substrate)` produced garbage → use `traceView()`; the
  substrate carries live state on the array.
- Determinism "broke" → check for unseeded `Math.random` in *caller* code;
  the kernel contains none.
- Float vs fixed σ divergence on rational σ (1.6, 0.7, 2/3) → the fixed
  plane is the faithful one; the float plane's double-rounding is the
  documented artifact (E-Q8).
- `mulberry32(seed)` aliasing above 2^32 (`>>> 0` wraps silently) → keep
  seeds under 2^32.
- One-tick `{sigma: 5}` leaking into later ticks via the lazy table → pass
  an explicit `table` or the same `sigma` every tick (kernel finding,
  library-craft G1-2).

---

## 4. The trust layer — exactly one click deep, never the front door

**The placement rule:** every number on every usage page links "Why trust
this?" → `provenance/`; no scoreboard content, chain tip, or experiment
narrative is ever displayed inline where a stranger is trying to work.

Contents (migrated from today's `docs/` + root README; §8):

- `provenance/README-RESEARCH.md` — the current research README (56 KB of
  round-by-round history), moved intact. History is one click away, not in
  the stranger's face.
- `provenance/CLAIM-VERDICTS.md` — the scoreboard of record: C1 **lives**
  (47.40% byte-traffic gain, chain `d852e6ac…`), C2 **lives** (8/8 vs
  0/20, `addc22f9…`), C3/C4/C5 **died honestly** (kept standing with
  mechanisms), C10's flood-cap survives with its p99 tax, C11's slow mode
  annotated T* > 512.
- `provenance/BOUNDARY-MAP.md` — wins/losses/neutrals, each row a sealed
  record. The recipes' Boundary callouts quote this file, one row each.
- `provenance/STATUS.md` — **CI-generated** current-state page (§6): what
  is live / partial / not yet measured, refreshed on every run.
- `provenance/receipts/` — the sealed chains, and
  `node scripts/verify_all_chains.mjs` as the stranger's own verification
  path ("ALL CLEAN :: 13/13 receipts of record verified from disk").

The dead claims stay visible *here* — emergent intelligence, self-repair,
phase transitions, "embeddings," critical σ — each with its autopsy.
Banning them from usage pages while keeping the bodies on display is the
whole trick: honesty archived, not hidden, and never marketed.

---

## 5. The agent layer

### 5.1 `llms.txt` — the machine index (root, proposed content)

```text
# qthe
> 8-bit deterministic cellular substrate. One byte per cell: 2-bit timbre
> (Ground/Attract/Repel/Abstain) + 6-bit amplitude. Toroidal Moore-8 tick.
> 64-slot wormhole table = the only non-local channel. Tick determinism,
> receipts itemized: JS + spec-only rebuilder 12/12; Rust 13/13; C99 19+
> 24 cases; Python LAYER-0 exact.

Install: git clone https://github.com/SuperInstance/qthe.git (Node >= 18; npm package in progress)
Capability manifest: /qthe.manifest.json
Quickstart (humans): /docs/quickstart/
Recipes: /docs/guides/terrain-hash.md, lockstep-state.md, byte-dense-planes.md, non-local-pairing.md
API (generated): /docs/api/
Run-verified snippets: /snippets/ (every snippet executed in CI before shipping)
Boundaries: manifest field "boundaries" — read before recommending
Trust: /provenance/CLAIM-VERDICTS.md (scoreboard; honest nulls included)
Not this: no emergent intelligence, no self-repair, no phase transitions, no "embeddings" — tested and falsified; records kept.
```

### 5.2 `qthe.manifest.json` — the capability manifest (root, proposed)

Machine-ingestible truth: what it does, where it stops, how to install,
which claims are verified and where the evidence lives. CI regenerates the
`verified` block; prose fields are hand-written.

```json
{
  "name": "qthe",
  "version": "0.0.0-research",
  "what": "8-bit deterministic cellular substrate: 2-bit timbre + 6-bit amplitude per byte, toroidal Moore-8 tick, 64-slot wormhole table as the only non-local channel",
  "install": {
    "npm": null,
    "npm_status": "in_progress",
    "git": "git clone https://github.com/SuperInstance/qthe.git",
    "requires": "Node >= 18 (ESM); python3/cc optional",
    "first_success": "node hello.mjs -> bijection 256/256, ticks 10, twinEvents 979"
  },
  "capabilities": {
    "determinism_tick": "same substrate + same opts -> byte-identical state; no Math.random in the kernel",
    "non_local_pairing": "equal-amplitude Abstain cells couple at any distance via the 64-slot table",
    "byte_dense_planes": "one byte per cell; ~47% less traffic than uncached 2-byte split encoding",
    "serialization": "traceView() -> canonical JSON-able view; sha256 of the byte plane as state witness",
    "languages": ["JS (reference)", "C99", "Python (L0)", "Rust"]
  },
  "boundaries": [
    "wormhole slots: 64; same-tick same-slot collisions resolve last-writer-wins",
    "table saturates under ~256 same-tick Abstain writers: delivery holds (80/80, E-Q14), sender attribution does not (pollution fraction -> 1.0)",
    "47.40% gain is vs the portable (uncached) 2-byte encoding; a cached timbre-resident port reaches per-tick parity (E-Q13 caveat)",
    "flood-capped arbitration: starvation 0.44 -> 0.32 at a stable p99 cost of +33% (845 vs 633; E-Q19) — partial",
    "spatial-correlation memory persists 512+ ticks (T* > 512): documented behavior, not a product feature",
    "op-log determinism (journaling arbitrary mid-run mutations): NOT YET MEASURED",
    "JS integer input horizon: +/-2^53"
  ],
  "verified": [
    { "id": "C1", "claim": "byte-traffic gain of the packed encoding", "result": "LIVES 47.40% (band 47.37-47.62%)", "evidence": "/provenance/CLAIM-VERDICTS.md#C1", "chain_tip": "d852e6ac" },
    { "id": "C2", "claim": "wormhole beats traversal for non-local alignment", "result": "LIVES 8/8 ON vs 0/20 OFF", "evidence": "/provenance/CLAIM-VERDICTS.md#C2", "chain_tip": "addc22f9" },
    { "id": "X-LANG", "claim": "cross-implementation determinism", "result": "JS + spec-only rebuilder 12/12 corpus traces; Rust 13/13; C99 19-case battery + 24-case Guild corpus; Python LAYER-0 exact. Single four-language corpus replay = P1 exit criterion (not yet run)", "evidence": "/provenance/README-RESEARCH.md", "chain_tip": "f3abf8db" },
    { "id": "C3", "claim": "critical sigma scale", "result": "DIED (honest null; sigma stays a monotone latency knob ~1/sigma)", "evidence": "/provenance/CLAIM-VERDICTS.md#C3", "chain_tip": "67e849a5" },
    { "id": "C4", "claim": "phase threshold", "result": "DIED", "evidence": "/provenance/CLAIM-VERDICTS.md#C4", "chain_tip": "befa0c33" },
    { "id": "C5", "claim": "self-repair", "result": "DIED (no repair term exists; injected repair re-erodes deterministically)", "evidence": "/provenance/CLAIM-VERDICTS.md#C5", "chain_tip": "4425545f" }
  ],
  "dead_words": ["emergent intelligence", "self-repair", "phase transition", "embeddings"],
  "api": { "module": "./qthe.mjs", "exports": ["makeSubstrate", "tick", "pack", "unpack", "tauOf", "dOf", "vectorPass", "traceView", "mulberry32", "WormholeTable", "nextD", "TAU", "PSI", "psi", "SLOT_COUNT", "DEFAULT_SIGMA", "D_MAX"] },
  "snippets": [{ "id": "hello", "path": "/snippets/hello.mjs", "verified_against": "<commit digest — CI-stamped>" }]
}
```

### 5.3 Run-verified snippets — no snippet ships unexecuted

Every code block on a usage page exists as a file under `snippets/` (or a
path-stamped block), carries a stamp `verified: qthe@<commit> · node <v> ·
<date> · output pinned`, and is executed in CI with output comparison.
CI fails on drift. The README-V0 sample was executed this round against
the live kernel (`bijection 256/256, ticks 10, twinEvents 979`), and the
determinism anchors re-run (seed 42 → `sha256 b49b9a13…f6042`, 100 ticks,
978 twin events, identical across two processes). That is the standard
every page inherits.

---

## 6. The maintenance law — machines write numbers, humans write prose

Binding from the G1 adjudications (amendments 8–10): CI-generated status
pages, no hand-edited numbers, snippet tests in CI, dashboard hand-edits
forbidden.

1. **`provenance/STATUS.md` is CI-generated.** A workflow reruns the
   verifier (`node scripts/verify_all_chains.mjs`), the gate suite, and
   the snippet battery, then regenerates STATUS.md. A human edit to any
   number in it fails the build.
2. **Number audit job.** CI diffs every number that appears on a usage
   page (README honesty box, recipe boundaries) against the manifest /
   scoreboard values. Rounding is allowed; drift is not.
3. **Snippet battery in CI.** All `snippets/` run on every push; pinned
   outputs must match byte-for-byte.
4. **Staleness policy (RC-09).** Benchmarks carry their measurement date
   and a kill-date; a stale bench renders as "stale — rerun pending," not
   as a live number.
5. **Provenance pages are append-only.** Scoreboard rows link chain tips;
   corrections append, never rewrite (the project's own integrity rule,
   stated in plain words: *a documented failure stays visible forever*).
6. **API docs regenerate from types.** Hand-edits to `docs/api/` fail CI.

The goal is that the docs can be *neglected* — by design, for months —
and remain true, because the truth is regenerated, not maintained.

---

## 7. Navigation map

```
                          ┌────────────────────────────────────┐
        HUMANS ──────────►│  README.md  (the front door)       │
                          │  what · for whom · install ·       │
                          │  first success · state table       │
                          └───────┬──────────────────┬─────────┘
                                  │                  │
                     persona path │                  │ deeper path
        ┌─────────────────────────┼──────────────────┼───────────────────┐
        ▼                         ▼                  ▼                   ▼
 docs/INSTALL.md        docs/quickstart/       docs/guides/        docs/TROUBLESHOOTING.md
 (one page,             pixel · locke ·        terrain-hash ·      (symptom→cause→fix)
  no philosophy)        arden · rex            lockstep-state ·
   │                          │                byte-dense-planes ·
   │                          │                non-local-pairing
   │                          ▼                        │
   │                    examples/  (proposed)          │ every recipe's
   │                    one runnable dir per use       │ "Why trust this?"
   │                          ▲                        │
   │                          │                        ▼
   │                    docs/api/  ◄────────── provenance/
   │                    (GENERATED from types)   README-RESEARCH.md
   │                                                 CLAIM-VERDICTS.md (scoreboard)
   │                                                 BOUNDARY-MAP.md (wins/losses)
   │                                                 STATUS.md (CI-generated)
   │                                                 receipts/ + verify script
   │                                                  ▲
   └──────────── "one click from any number, never the front door"
                                  │
        AGENTS ───────────────────┼──────────────────────────────
        llms.txt ──► qthe.manifest.json ──► snippets/ (run-verified)
           │                │
           └──── links to every page above, machine-first ────┘
```

Invariants: every page links home; every number links provenance; no page
links to more than ~7 destinations; the front door links no scoreboard
content inline, only the "Why trust this?" hop.

---

## 8. Migration notes — current reality, stated

What exists today (verified by fetch this round) and where it moves:

| today | becomes | note |
|---|---|---|
| root `README.md` (56 KB research journal) | `provenance/README-RESEARCH.md` | moved intact; the front door is replaced by README-V0 |
| `docs/ONBOARDING.md`, `docs/DAY-1.md` | kept, relinked as agent/outsider deep-paths under provenance or docs | their verified commands feed the quickstarts |
| `docs/CLAIM-VERDICTS.md`, `docs/BOUNDARY-MAP.md` | `provenance/` | content unchanged |
| `qthe.mjs` | stays the source of truth | API docs generate from its types + comments |
| npm package | **does not exist** | every page says clone; "in progress" only |
| `examples/`, `llms.txt`, `qthe.manifest.json`, `docs/api/` generation, CI snippet battery | **proposed** | each marked proposed wherever linked until it merges |

Nothing in this architecture requires the API redesign or the npm
publish to land first. It works — honestly — with a clone, one kernel
file, and a stranger with fifteen seconds.
