# E-Q19 verdict — C10 DIES with autopsy; the docket's flood cap LIVES

**The first consumer-driven pricing target** (ORCH-R20/T11-b2). The docket —
a qthe-backed task-arbitration substrate, the frontier doc's "second live
consumer" — priced against the standard inbox. Registration
`experiments/pre_registration_e_q19.json` (sha-sealed at run), Seed-2.0-mini
design attack pre-run (6 attacks, $0.001147, AS-SAID), amendments AM1/AM2/AM5
(from the attack), AM6 (implementation-time, self-caught), AM7 (post-LOUD-
throw, the E-Q17-AM3 precedent). Chain: `receipts/e_q19_chain.jsonl`,
19 links, tip `568bfef308622b0e0e5b8558442348d42f43ee258bb45c7ac0a7f3db3bb700c6`.

## The verdict, verbatim from the sealed row

- **H1 (flapping debounce): DIES.** A stableStarve 0.3194 vs the heap's
  0.4435 — an improvement, but the frozen rule demanded ≤ 0.5× (0.2218).
  A stableP99 845 vs the heap's 633 — the docket made stable-task tail
  latency WORSE (rule demanded ≤ 0.7× = 443).
- **H2 (source-local flood cap): LIVES** at the pre-overflow checkpoint —
  A maxShare@500 0.339 vs the heap's 0.75. T_end erosion to 0.4356, the
  registered backlog-bounded boundary receipt (size the substrate to the
  backlog; the cap is spatial and the backlog is not).
- **H3 (uniform parity vs B-local): vacuous pass** — p50 = 0 for both
  arbiters at 75% utilization; the drained regime serves tasks within their
  arrival epoch. Parity was not contradicted; it was not measured. The
  locality price vs the global heap is likewise 0-vs-0 here.
- **H4 (priority fidelity, advisory): unmeasurable in the drained regime** —
  serve order ≈ arrival order, uncorrelated with p0 (Spearman −0.0003).
  Fidelity needs backlog to be a quantity.
- **C10: DIES** (H1 failed). The scoreboard's eighth priced claim: 3 LIVES /
  4 DIES / 1 STANDS is now 3/5/1.

## The autopsy (mechanism, re-derivable from the kernel)

1. **The debounce changes timing, not throughput share.** A-static's
   stableStarve equals the heap's EXACTLY (0.443539…): with flappers spread
   across every tile and capacity the binding constraint, the epochs a
   flapper spends deferred (τ=3 contributes 0 to every real accumulator —
   LAYER 0) are epochs the tile's claim goes to a stable task that would
   have gotten it anyway in expectation. Deference redistributes WHICH
   epochs stables eat; the flapper's absence does not shrink its share of
   the binding capacity. To cap a gamer under overload you need admission
   control or per-source quotas — arbitration physics alone does not have
   an opinion, and that is a finding, not a failure of the finding.
2. **The physics bundle DOES cut starvation — the AM6(i) prediction
   confirmed.** Full-A stableStarve 0.3194 vs A-static's 0.4435: under
   saturation (satFrac 0.90 at L2), ties at d=63 break by age, and the
   flapper's periodic re-boost re-stamps its cell at [48..62] — resetting
   its own aging. The gamer's boost is a self-inflicted FIFO penalty. The
   substrate prices patience: whoever keeps re-arriving as new loses to
   whoever kept waiting as old.
3. **But the same aging buys starvation with tail latency.** stableP99 845
   vs the heap's 633: age-tie serving means young stable tasks queue behind
   old ones FIFO-style within tiles, while the heap keeps serving fresh
   high-p0 work instantly. The docket's trade: −28% starvation, +33% tail.
   A consumer who values tails over starvation should keep the heap.
4. **The flood cap is structural, and it erodes exactly as registered.**
   Tiles aligned with source homes cap the flooder at one tile's claim rate
   (maxShare@500 0.339 vs the heap's 0.75 — the heap gives the flooder
   100% of the overload gap). Once the flooder's backlog physically
   overflows its home region (epoch ~500 of 2000; overflow 7,113 receipted
   per run), its tasks compete in other tiles and the cap erodes to 0.4356.
   The boundary: the spatial cap holds while the substrate holds the
   backlog — plane capacity is flood insurance, priced 4096 cells at a time.
5. **AM2 confirmed (Seed's real defect, kept kernel-faithful):** the
   wormhole escalation carried 1 claim in 12,000 tasks. The table is
   written at slot = the deferred task's CURRENT d (which drifts to 48–63
   under the re-boost band) and read at the claimer's cargo slot [8..15] —
   the consumer-side restatement of E-Q14's WHO-loss: under d-drift,
   address-based recovery misses. The channel is not dead (A-off's 0 vs A's
   1 is the control), it is addressing-mismatched for priority-evolving
   cargo. A consumer needing deferred-task recovery should pin the defer
   band to the claimer band — or accept that deferral's guarantee is
   eventual re-visibility via τ-flip, not remote discovery.

## What survives for the consumer story

The docket stands as the second live consumer (the deployment lane, T11-b,
ships it against the running worker) with an honest label: it caps
source-local floods structurally and converts re-boost gaming into FIFO
penalty; it does NOT beat the inbox on flapping starvation, and it trades
tail latency for starvation. The 8×64+8 hierarchical survivor's r21 trigger
now carries E-Q19's warning: the docket's provenance channel (wormhole
recovery of deferred work) is exactly the channel AM2 shows to be
addressing-mismatched under drift — the survivor's region-split-without-
folding design must answer that or stay untriggered.

## Floors (all held)

F0 determinism 150/150 byte-identical (serve logs + live sets + plane
hashes, 2× fresh construction per cell) · F1 kernel-real (`qthe/qthe.mjs`
imported, never transcribed; the tick ran every epoch in A/A-off) · F2
A-off wormhole claims 0 everywhere · F3 capacity matched per load · F4
arrival-stream identity asserted inline. Round spend: $0.001147 (the Seed
design attack; everything else compute).
