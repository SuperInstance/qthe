# E-Q20 verdict — construction provenance and the wash-out question

E-Q20 VERDICT (C11: the tick operator is a construction-provenance blindfold — planes built from PRNG, quantum-ROOTED hash-expanded certified randomness (comet SP 800-90B root, AM5), and quantum-blur-conditioned geometry become statistically indistinguishable across all observed metrics within the PRNG noise floor by tick 64, while each remains individually byte-deterministic): H1 QRNG-PRNG equivalence LIVES (A2 median distance <= A1 LOO 95th-pct floor at EVERY checkpoint x metric);

H2 wash-out at t=64 DIES (excursions: A2 [] A3 [moransI4,moransI8,satFrac] A3S [moransI4,moransI8]);

H3 early fingerprint LIVES (A3 t=0 dW1 12.059741 vs floor 0.507735;

Moore-8 Moran's I 0.071265 vs floor 0.014439);

wash-out tick T*=not reached by t=64 (Moore-8, A3). Floors: F0 determinism 40/40 byte-identical;

F1 kernel-real (import, no transcription);

F2 CHSH S=2.834961 > 2 (witness carried, caveat receipted: fixed settings, no space-like separation, fair sampling);

F3 blur exact-mode (shots never sent) + shape equality asserted;

F4 all-distinct OK;

F5 A3S marginal identity EXACT. Power caveat (AM2): A3/A3S n=5 (credit-capped);

the floor is the direct LOO, not a resampled threshold. C11 DIES.

## The arms

- A1 PRNG n=20 (mulberry32, the noise-floor population)
- A2 comet-qrng-v1 ROOT (142 certified bytes, job 3d7d0a34-5bbf-4ff1-8fde-c158a8a021c3) SHA-256-counter-expanded, CHSH S=2.834961, quantum-ROOTED hash-expanded (AM5), n=10
- A3 blur-core-v1 exact strength 0.5 on the d-field, tau from A2 n=5
- A3S A3's d-multiset under one fixed permutation (marginals identical, correlation destroyed)

## Cross-arm medians vs floor (t=64)

| metric | A2 | A3 | A3S | floor |
|---|---|---|---|---|
| dW1 | 0.452271 | 1.681726 | 1.678308 | 1.733565 |
| tauTV | 0.008612 | 0.007031 | 0.007031 | 0.016717 |
| moransI4 | 0.005346 | 0.03507 | 0.032608 | 0.020696 |
| moransI8 | 0.007249 | 0.038166 | 0.033836 | 0.021348 |
| twinRate | 0.00415 | 0.003643 | 0.00359 | 0.01265 |
| satFrac | 0.011475 | 0.042969 | 0.032959 | 0.03833 |

## Moran's I trajectory (Moore-8, the kernel's own coupling)

| t | A1 pop | A2 | A3 | A3S |
|---|---|---|---|---|
| 0 | 0.003199 | -0.001889 | -0.068067 | -0.004212 |
| 1 | 0.002925 | -0.001468 | -0.066821 | 0.000915 |
| 2 | 0.003194 | 0.000113 | -0.060268 | 0.009937 |
| 4 | 0.008039 | 0.00405 | -0.036158 | 0.025792 |
| 8 | 0.024665 | 0.021692 | 0.02486 | 0.069454 |
| 16 | 0.068657 | 0.067207 | 0.116852 | 0.137358 |
| 32 | 0.143644 | 0.146174 | 0.191955 | 0.195718 |
| 64 | 0.175421 | 0.178778 | 0.213587 | 0.209257 |

## Autopsy (appended per the registration's own permission: explanations may be added, predictions never edited)

**C11 died on H2 alone — and the death decomposes cleanly across the A3-vs-A3S instrument.**

1. **What washed out (t=64, within floor):** the d-value marginals (dW1 1.68/1.68 vs floor 1.73 — from a t=0 distance of 12.06), the tau fractions (frozen by the kernel, uniform for every arm), and the twin-event rate (0.0036 vs floor 0.0127). Byte-level provenance is invisible: H1's clean LIVES says the SP 800-90B-certified root, hash-expanded, is statistically indistinguishable from mulberry32 at EVERY checkpoint on EVERY metric — the NIST 90B-to-90A deployment pattern is behaviorally transparent here.
2. **What did not wash out (t=64, above floor):** spatial autocorrelation — Moran's I on both rook-4 and Moore-8 — for BOTH A3 (0.038 Moore-8) and A3S (0.034) against floor 0.021, plus a marginal satFrac excursion for A3 only (0.0430 vs 0.0383). The registered death candidate (b) — "Moran's I decays slower than 64 ticks" — is EXACTLY what fired.
3. **The quantum fingerprint is real, distinctive, and t=0-only in its purest form:** blur-core-v1's exact circuit produced NEGATIVE lag-1 autocorrelation (Moore-8 I = −0.068 at t=0). A classical smoothing blur would produce strong POSITIVE autocorrelation; the quantum blur's unitary interference walks values across qubit/bit neighbours with alternating structure. Interference-shaped geometry is a genuinely quantum-native initial condition — measured, not asserted.
4. **The persistence is NOT quantum-specific:** the shuffled control A3S (t=0 I ≈ −0.004, correlation destroyed) ALSO excurses at t=64 — and it converges from ABOVE (overshooting to 0.069 at t=8 vs A1's 0.025) while A3 converges from BELOW. Both arms approach the same intrinsic correlation attractor (A1's own I grows 0.003 → 0.175 over 64 ticks — the kernel ORGANIZES space as it runs), and the approach is slow: initial spatial correlation is a SLOW MODE of qthe dynamics at 64×64. T* > 64 (the gap shrinks monotonically: 0.048/0.052 at t=32 → 0.038/0.034 at t=64 — convergence in flight, horizon too short).
5. **The boundary-map law this buys:** constructor BYTES are invisible past construction (H1, all metrics); constructor GEOMETRY (spatial correlation) is a slow mode whose memory outlives t=64 at this scale. Any consumer that needs correlation-equilibrium (e.g. the docket's tile statistics, twin-resonance overlap) should either pre-run a burn-in of T > 64 or treat early-tick spatial statistics as constructor-dependent. The burn-in length is now a measurable quantity, not folklore — extend the checkpoint ladder to price T* exactly (registered as the natural successor experiment, E-Q20b candidate: checkpoints to t=512, arms A1/A3/A3S only, zero moth credits — the journals replay).

**The scoreboard row:** C11 DIES (H1 LIVES, H3 LIVES, H2 DIES, F0 40/40) — with the two keepable laws: (a) certified-quantum byte provenance is behaviorally transparent under hash expansion; (b) spatial-correlation provenance persists past t=64 because correlation equilibration is a slow mode of the tick operator itself.
