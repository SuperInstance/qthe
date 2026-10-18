# ORCH-R20 Round Report — the consumer round (a fourth language, a second live consumer, C10's honest death)

Filed 2026-10-18, orchestrator (Z.ai), erised fleet line. Registration:
`2026-10-18-orch-r20-registration.md` (commit `a4109c9`, before any work;
predictions P1–P8 registered).

## T11-a — crossimpl/rs: the Rust port, byte-exact (subagent lane)

The fourth language joined the cross-implementation matrix (JS reference ·
Python L0 · C99 · **Rust**). 13/13 unit tests; **float plane 12/12, fixed
plane R8 3/3, VectorPass 4/4** against the sealed fixtures (sha `dd866748…`,
regeneration re-proven byte-identical before any port code existed); σ **as
bits, never libm**; `#![forbid(unsafe_code)]`, zero dependencies, edition
2021. Determinism: sealer double-run byte-identical AND **debug-vs-release
profiles byte-identical** — the cross-check that caught the lane's one
defect (the runner read `events.last()` after an eventless tick: a debug
panic at c9 that release masked; correction row appended, run-1 rows
standing). Negative controls on tampered fixtures (plane-byte flip / term-
bit flip / event-count tamper): all DETECTED, exit 1. Chain `rs_chain.jsonl`
(11 links, tip `f3abf8db…`), registered at seal time; verify_all_chains
35/35 in the lane worktree. Three new spec ambiguities receipted (A-R1 the
twin-event telemetry surface is kernel-defined not SPEC-defined; A-R2
"exactly 8 neighbors" is impossible on degenerate tori — the kernel
resolves by pure modulo with self-visits; A-R3 byte-exact event terms
require correctly-rounded IEEE754 multiply). Merged `--no-ff` to main with
the sweep.

## T11-b2 — E-Q19: the first consumer-driven pricing target; C10 DIES with the richest autopsy in the corpus

Pre-registered before any run (`adc378d`); Seed-2.0-mini design attack
pre-run (6 attacks, $0.001147, AS-SAID): **A2 was a real design defect**
(the wormhole addressing mismatch — kept kernel-faithful with consequences
registered, and its prediction was later confirmed exactly); AM1/AM5
accepted-in-part; A3/A4/A6 refuted with guards/clarifications. AM6
(implementation-time, self-caught) and AM7 (post-LOUD-throw — the AM6(d)
floor fired exactly as registered, `freeCell: plane full`, the E-Q17-AM3
precedent) landed before any data row existed.

The run: 5 arms (B heap · B-local nearest-first · A docket · A-static ·
A-off) × 3 loads (L1 uniform · L2 flapping · L3 source-local flood) × 10
seeds × 2 determinism runs — **150/150 byte-identical**, capacity matched,
stream identity asserted, kernel real (import, no transcription). Chain
`e_q19` (19 links, tip `568bfef3…`), verdict row sealed.

**The verdict: C10 DIES on H1, and the autopsy is five laws** (all now on
the CLAIM-VERDICTS scoreboard, the BOUNDARY-MAP consumer row, and the
verdict file):

1. **The debounce is timing, not share** — A-static's stable starvation
   equals the heap's EXACTLY (0.443539…): under capacity binding, defer
   windows redistribute when stables eat, not how much.
2. **Saturation converts re-boost gaming into FIFO penalty** — full-A
   0.3194 vs A-static 0.4435 at 0.908 saturation: ties at d=63 break by
   age and the re-boost re-stamp resets the gamer's own aging (the AM6(i)
   prediction, confirmed).
3. **It buys starvation with tail latency** — stable p99 845 vs the heap's
   633 (+33%).
4. **The flood cap is structural and backlog-bounded** — maxShare@500
   0.339 vs the heap's 0.75 (tiles aligned with homes); T_end erosion to
   0.436 with 7,113 overflows per run receipted. Plane capacity is flood
   insurance.
5. **Deferred-task recovery by address is drift-blind** — the wormhole
   escalation carried 1 claim in 12,000 (the consumer-side WHO-loss;
   AM2's prediction confirmed; A-off's 0 vs A's 1 is the control).

H3/H4 were vacuous in the drained regime (p50 = 0 for both arbiters;
serve order = arrival order) — receipted as unmeasured, not passed. The
scoreboard: **8 claims priced, 3 LIVES / 5 DIES / 1 STANDS.**

## T11-b — the docket is LIVE: the second live consumer

`QtheDocket` Durable Object on the running worker (build `r20-docket1`,
version `6de9afb3`, migration v2): the E-Q19 tiled law verbatim over HTTP
— submit/claim/epoch/log routes, flippers defer and re-boost, the wormhole
escalation runs exactly as priced (quietness included), and the **real
vendored kernel ticks every epoch** in the DO's single thread. The
arbitration determinism handle: two independent DOs, seed 1234, 24 tasks
incl. 4 flippers, 40 epochs → identical hash `77d865d07b156c31…`; 24/24
served, per-source 6/6/6/6; epoch counter exactly-once. **The honest
label travels with the service**: `honest_label` in the init response
("C10 DIES: flood-cap yes, flapping starvation no, tail latency the
price"), linked from the landing page. Full live battery re-ran green
after deploy (build marker confirmed first). **ERRATUM 5** (cosmetic): the
landing page's live-checks table had closed with `</ul>` since r19 —
browsers auto-recover, which is why nothing ever failed; fixed to
`</table>`, redeployed, byte-identical verified. No functional erratum
this round — the first deploy in four without one.

## T11-c — creative breaks (the operator's prescription, filled)

The found-document round, three forms verified absent from the 21,995-
entry tree: **ERRATA/errata-for-the-first-printing.md** (the corrections
for the Book of Certainty — every correction a real dead claim),
**RESUMES/curriculum-vitae-of-the-imaginary-unit.md** (i applies for the
Abstain seat; salary two bits), **SAFETY_DATA_SHEETS/sds-for-uncertainty.md**
(GHS sheet: "Wear the falsifier. Change it when it stops failing.").
Bench-reviewed before push (Seed/DeepSeek/MiMo, $0.001868, AS-SAID):
eight amendments incorporated, four declines-on-facts — three of the
declines were fabricated section citations the devil's advocate proposed
(§7.1/§3.2/§4.3 do not exist; LARP citations are the one thing the house
law cannot accept). AI-Writings commits `56f5f7259a` + `bf35ae01e3` +
`41f2917003` + INDEX `cc89c08f86`.

## T11-d — the sweep

verify_all_chains **34/34 → 38/38** (rs chain + tip, e_q19 chain + tip;
16 tip-file agreements); probe gate re-sealed, **29/29 claims recomputed,
coverage 20/20 chains** (three new E-Q19 curation entries); the dashboard
drift pin fired twice, correctly, and was satisfied each time (fleet-seeds
scoreboard +C10, cross-language pins +rust); README r20 section +
experiments/CI lines updated; SPEC LAYER 2 +C10; PHASES-REPORT post-
roadmap row; guard PASS; **negctl 28/28 DETECTED at clean HEAD** (receipt
`e615467`).

## Budget

$0.003015 total (Seed design attack $0.001147 + creative bench $0.001868)
of the $0.012 registered — 25%. All other lanes $0 (free tier + compute).

## Verification at close

run_tests exit 0 (all_pass, G4 superseded by the pinned G4-P2 state) ·
verify_all_chains 38/38 ALL CLEAN · probe_gate PASS (29 claims, coverage
20/20) · guard PASS · negctl 28/28 at clean HEAD · **ALL LIVE CHECKS
PASS** against the deployed service (P3 determinism, C6 sidecar field-
scoped exact, C7 R2 sha256-identical, C8 Pages byte-identical, P-D docket
arbitration determinism) · CI green at the close-out commits.

## Standing (unchanged, honestly — plus one warning)

jev-garden live wiring + edge hardware remain open and not executable from
this seat. The 8×64+8 hierarchical survivor is registered, untriggered —
and its trigger now carries E-Q19's warning: its provenance channel is
exactly the channel AM2 prices as addressing-mismatched under drift. Next
round candidates: the fleet's asks (watch continues), a docket consumer
that actually needs what survived (flood-capping, gaming-penalty), or the
second-consumer-driven pricing of the survivor with the drift question
answered first.
