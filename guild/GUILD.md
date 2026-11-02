# The qthe Guild — apprenticeship program for the production push

Principal: Casey (SuperInstance). Orchestrator: Z.ai. Founded 2026-11-02.
Current round: **G2 (Coursework II) — COMPLETE.** Six seats trained and
graded; work shipped to branch `guild/toolkit-v0` (main untouched).

## Mission

Turn qthe from a verified research kernel into a production library + toolkit
without losing the house's honesty law. The Guild trains seats (specialist
agents) as master's students: **coursework rounds (G)** build knowledge and
craftsmanship on REAL qthe material; **qualifying reviews (G3)** gate entry to
**practice rounds (P)**, which execute the production phases P0–P4.

## The Guild Law

1. **Receipts or it didn't happen.** Every task is sealed: brief, artifacts,
   grade, learnings. An unsealed run is a rumor.
2. **The No-Key Law.** Credentials are never written to any file, never passed
   to any seat, never echoed in output. External rounds consume principal-
   supplied keys transiently (single shell invocation, env-only); rotation is
   the principal's prerogative. A key observed in any artifact triggers
   HALT → CONTAIN → REPORT → ROTATE → AUDIT → RESUME (see fleet-wrangler
   KEY-LAW.md).
3. **Priced, not asserted.** A seat's readiness is established by qualifying
   review, not claimed. Product claims inherit the repo's law: what LIVES
   needs a mechanism; what DIES is kept beside the body.
4. **Apprenticeship before practice.** Seats do coursework (G-rounds) before
   production tasks (P-rounds). Every task names the competency it builds.
5. **Append-only journals.** Journals grow; history is never rewritten.
   Errata are appended entries.
6. **Seats propose, the Orchestrator verifies.** Nothing a seat produces
   counts until filed, graded, and receipted — mirroring the tavern's law
   that nothing a guest says counts until verified against the repository.

## The seats

| seat | craft domain | stage | status |
|---|---|---|---|
| kernel-forge | C99/Rust/WASM kernels, determinism, fixed-point | coursework | G2-6 graded A+ — corpus battle test 10/24 blind → 24/24 after three rulings (Orchestrator re-run) |
| library-craft | @qthe/core API, op-logs, packaging, semver | coursework | G2-7 graded A — v0.1 surface (σ-leak inexpressible), comment law |
| standards-warden | SPEC v1.0 folding, conformance corpus, RFC process | coursework | G2-1 graded A — SPEC v1.0 draft, 17/17+3/3 forks closed, counterfactual witnesses |
| falsification-bench | property tests, differential fuzzing, sabotage controls | coursework | G2-2 graded A — fuzzer/multi-writer/edge designs; corpus-v2 term-pinning demand |
| stranger-experience | DX, personas, quickstarts, jargon audit | coursework | G2-4 graded A — production README v0 + doc architecture + look-and-feel |
| red-chamber | adversarial critique of plans and claims | coursework | G2-5 graded A+ — 17 findings; RC2-01 verified+applied; Guild grade B+ accepted |
| fleet-wrangler | external-model economics, caching, decision-model synergy | coursework | G1-5 graded A; Phase A live validation gated on principal keys |
| house-manager | roadmap governance, tickets, releases, risk register | enrolled | activates G3 FIRST: draft the review rubric (input: FINDINGS-G2 + AM-G2-4) |

## Rounds

- **G1 (complete)** — Coursework I: five seats trained; three gated seats now
  have their dependency inputs.
- **G2 (complete)** — Coursework II: the conformance corpus (24 golden
  cases, Orchestrator-minted, self-determinism-verified) battle-tested
  kernel-forge (10/24 blind → 24/24 after the three rulings); SPEC v1.0
  drafted with counterfactual witnesses; the production docs orientation
  shipped (README v0 + architecture + look-and-feel); falsification
  designs done; API v0.1 + comment law. Red-chamber's second attack
  (17 findings) produced amendments AM-G2-1…5 — see ADJUDICATIONS-G2.md.
- **G3 (next)** — Qualifying reviews. house-manager activates FIRST to
  draft the review rubric (AM-G2-4: rubric before reviews, inter-rater
  check, hash-chained journals, scripted registry). Then each seat faces
  the board (Orchestrator + red-chamber spot attacks). Pass = cleared for
  practice.
- **P0–P4** — Practice rounds, one per production phase (amended per
  ADJUDICATIONS-G1 + AM-G2-1…5).

## Shipping discipline

Verified work ships to the branch `guild/toolkit-v0` on the principal's
repo (main is never pushed directly; the principal merges). Commits are
thinking-markers: multi-line messages recording the why at each moment.
Pre-push audit is fail-closed (secret-pattern scan; a hit aborts the push).

## External fleet

Doctrine inherited from the tavern: immutable briefing prefix (cache-gamed),
identical tasks, outputs sealed verbatim, nothing counts until verified.
Design: `seats/fleet-wrangler/work/G1-5/`. Execution: gated on principal-
supplied transient keys; every external call receipted with model, cache
status, cost, and verification verdict. Decision-model synergy (TypeSafe-
class) is measured, not assumed: E-F1 routing, E-F2 arbitration, E-F3
verification economics.

## File map

- `GUILD.md` — this charter
- `ADJUDICATIONS-G1.md`, `ADJUDICATIONS-G2.md` — the Orchestrator's
  verification records and binding amendments
- `registry.json` — machine-readable seat/task state
- `corpus/` — the golden conformance corpus (g2-corpus-v1) + generator
- `seats/<seat>/charter.md` — identity, competencies, curriculum
- `seats/<seat>/journal.md` — append-only record of graded tasks
- `seats/<seat>/work/<task-id>/` — artifacts
