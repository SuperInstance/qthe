# ADJUDICATIONS — Round G1

The Orchestrator's verification of seat outputs. Per Law 6, nothing counts
until verified here. Date: 2026-11-02.

## kernel-forge G1-1 — GRADED A

Verified: `qthe_l1.c` compiles clean under `cc -std=c99 -Wall -Wextra -c`
(re-run by Orchestrator, zero warnings). 17-entry ambiguity log read in full
and adjudicated against the reference kernel (which the seat never saw):

- **13/17 decisions match or are near-match to the reference** (A2 strict
  self-guard, A3 LWW, A5 Abstain-accumulates, A6 carry-over, A7 τ-frozen,
  A8 unit-step clamps, A9 pre-tick d keys the table, A11 recomputed
  accumulator, A13 resonance≠0 guard, A14 degenerate tori, A16 seedFn — all
  correct against R2–R6 and the kernel source).
- **2 significant divergences from the reference, both real spec gaps:**
  - A1: seat chose snapshot table reads; reference uses LIVE row-major
    reads (receipt R2). Both readings are defensible from SPEC text —
    this is the #1 item for the SPEC v1.0 fold.
  - A10/A17: seat chose no-imaginary-feedback (pure telemetry channel);
    reference adds the twin term into pressure whose sign moves d
    (receipt R3). The seat self-flagged A17 as "the first thing I would
    cross-check" — exactly the right instinct.
- **1 subtle divergence:** A4 chose exact rational σ with truncation;
  reference uses float σ where only the sign survives. Edge case the seat
  missed: at σ<1 with resonance=1, truncation zeroes the twin term and the
  C2 mechanism would not fire at all — the float plane survives it.

**Finding filed to standards-warden:** a competent spec-only reader diverges
from the reference on 2 of 17 decisions. The spec is NOT yet load-bearing —
independent confirmation of the repo's own A-R1 receipt.

## library-craft G1-2 — GRADED A

Verified: api-surface.d.ts (741 lines) type-checked under tsc --strict;
OLOG-SPEC.md carries a canary vector computed from the real kernel; both
headline critiques re-checked by the Orchestrator against the kernel source
and CONFIRMED:
- `mulberry32(2**32+5) === mulberry32(5)` — seed aliasing via `>>> 0` wrap,
  silent, unerrored. Real kernel finding.
- One-tick `{sigma: 5}` leaks into permanence via the lazy table constructor
  (`table = new WormholeTable(opts.sigma)` persists; later ticks read
  `table.sigma`). Real kernel finding.
Seat's four flags for the Orchestrator all accepted: (1) digest stamps
decoupled from npm semver; (2) seed collapsed into ops-at-tick-0 — single
normative source; (3) compat layer must synthesize expandos (frozen
cross-lane `sub.bytes` contract); (4) arbitrary seedFns can't be journaled —
bytes-capture is the honest ladder.

## stranger-experience G1-3 — GRADED A

Verified: pitches' word counts re-checked (18–25 words, pass); quickstart
commands were executed live by the seat (smoke test output `bijection 256/256
ticks 10 twinEvents 15`; sha256 reproducibility across two processes —
receipt in QUICKSTART.md). Jargon verdicts adopted as the DX law: "priced/
LARP" → REPLACE; LAYER 0/1/2 → KEEP+GLOSSARY; fleet lore → RELEGATE-TO-LORE.

## red-chamber G1-4 — GRADED A+ (top of the round)

12 findings (RC-01…RC-12), all six required checks covered. Orchestrator
adjudication: **12/12 ACCEPTED.** Spot-verified citations: C10 p99 845 vs
633 and H1 death (matches CLAIM-VERDICTS.md); ORCH-R10 cached-port caveat
(matches C1 receipt); C2 dense-Abstain frontier (matches C2 boundary);
COST-OF-EXACTNESS.md ruling re-fetched by the Orchestrator and confirmed —
fixed plane canonical everywhere except corpus-verbatim, float for sealed
corpus, runtime parity 0.975×. Honesty grade of the plan: **B — accepted.**

## fleet-wrangler G1-5 — GRADED A

Verified: no invented prices (all rates parameterized EST — per brief); the
loop-is-the-unit-of-economics rule and the `usd_if_no_cache` counterfactual
field adopted as fleet doctrine; experiment matrix carries kill criteria;
workspace secret-scan clean.

## PLAN AMENDMENTS ADOPTED (binding on practice rounds)

1. **Pitch reduced to honest pillars** (RC-01/02/03): byte-dense encoding;
   non-local delivery for ≤K writers/tick with LWW semantics printed;
   flood-capping with the p99 tax in the pitch; geometry slow-mode demoted
   to documented behavior pending a benchmark receipt.
2. **Determinism claim split** (RC-05): "tick determinism: priced (12/12,
   four languages, external rebuilder). Op-log determinism: NOT YET PRICED."
   P1 exit criteria now include a multi-writer corpus, cross-implementation
   differential fuzzer, and float-serialization canary.
3. **Durations → event-conditioned exits** (RC-06): each phase gets a
   time-box and a kill-date; @qthe/core ships ALONE first as the velocity
   probe that prices P2–P4 with a receipt.
4. **Maintainer commitment priced** (RC-07): 2–4 h/wk triage, first response
   <7 days, critical patch <2 wks, semver+CHANGELOG from v0.1.0 — or the
   honest "experimental, no support" label and no beachhead courtship.
5. **Standard play → trust play** (RC-08): SPEC fold precedes conformance
   packaging; RFC/certification language triggers on implementer #2's first
   PR, not before.
6. **σ fork closed by existing receipt** (RC-11): adopt COST-OF-EXACTNESS
   at P0 — fixed plane canonical for products, float for corpus-verbatim,
   both version-stamped; plane-scoped corpus plan owed at P2.
7. **wasm demoted from "THE reference"** (RC-10): source is normative; wasm
   is a blessed build; bit-reproducibility receipt (two runners, pinned
   emsdk) required before any "reference artifact" language.
8. **P0 cost sheet owed** (RC-09): CI matrix minutes, corpus-regen
   procedure, bench staleness policy, supply-chain checklist (provenance,
   2FA, trusted publishing) — all P0 exit criteria.
9. **Codec baseline table owed** (RC-04): {raw 2-byte, cached port, nibble,
   varint-delta, zstd} × bytes-to-task before C1 is quoted in any recipe;
   cached-port caveat mandatory wherever 47.40% appears.
10. **DOI deferred** (RC-12) to first external use; dashboard stays
    CI-generated, hand-edits forbidden.

## Dispatch to G2

- standards-warden: fold A1–A17 + repo A-R1–R3 + R1–R7 into SPEC v1.0 draft;
  the two live divergences (A1, A10/A17) are the first two normative
  sentences to write.
- falsification-bench: design the op-log differential fuzzer, multi-writer
  corpus, and σ<1 truncation edge test against G1-2's op model.
- house-manager: ticket the AMENDED plan (this file is an input), with
  event-conditioned exits and the maintainer-hours budget.
