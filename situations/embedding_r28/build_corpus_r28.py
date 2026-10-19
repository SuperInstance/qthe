#!/usr/bin/env python3
# build_corpus_r28.py — E-Q36 T19-b: the AT-SCALE corpus (60 records = the sealed
# E-Q21 20 byte-identical + 40 new composed from the sealed record).
#
# THE LAW (F1 of the registration): every number in every new text appears in the
# sealed record (docs/CLAIM-VERDICTS.md, docs/FALSIFICATION-BUDGET.md, README.md
# rounds, the moth verdict, the e_q15/e_q17/e_q19 chains, MODEL-LEARNINGS.md).
# Family labels assigned at composition time from source material. Committed
# sha-frozen BEFORE the first embed call.
import hashlib, json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
OLD = HERE.parent / "embedding_r23" / "corpus.json"

FAMILIES = {
    "N": "the non-local channel — wormholes, twin resonance, the 64-slot table",
    "P": "the local rule's physics — neighborhood coupling, timbre, thresholds, cascades",
    "Q": "quantum construction & randomness provenance — certified entropy, blur, interference",
    "A": "allocation & economics — task arbitration, reward, batching, pricing, panels",
}

NEW_RECORDS = {
    # ---- N family: the non-local channel (N6..N15) ----
    "N6": "Claim C2's twin task class, the planting protocol: K=8 planted Abstain twin pairs with per-pair distinct d in 8..15, members at least 24 apart toroidal-Chebyshev, T=200, delivery threshold 8, twenty trials with paired ON/OFF arms on the same substrate. Bridging occurs at tick 1 and delivery completes by tick 8-9; the moire worms crawl to their twins only through the Abstain cells' remote reads.",
    "N7": "The compile-time table law, mechanism of claim C2: the 64-slot wormhole table is a compile-time static allocation with zero runtime discovery and O(1) cost per Abstain cell. Non-local alignment without a message bus, without a routing table, and without any per-pair state — the entire point of the channel. The table is the only causal path across Ground cells.",
    "N8": "Experiment E-Q1's honest null, the OFF arm: 0 of 20 trials delivered with wormholes OFF — the F2 mechanistic floor held without exception. Under SPEC L1 s5 local influence cannot propagate through Ground cells, which contribute nothing to their neighbors' accumulators, so two distant Abstain cells are causally disconnected without the table. The non-local channel is the exception, not the default.",
    "N9": "The live-read schedule behind twin resonance, pinned by gate G5: row-major live-read R2 lets the later writer hear the earlier writer's same-tick write from their second co-tick. The reader's imaginary channel receives resonance times sigma, rule R3 couples it into pressure, and d climbs one unit per tick toward delivery. The schedule is exact, deterministic, and the timing backbone of every twin event.",
    "N10": "Experiment E-Q6's total-collision regime: with all 64 cells writing the same slot, the table still fires — survival 0.984 with 64 of 64 distinct firers under S3 live-read last-writer-wins — but resonance becomes last-writer-dominated. Dense-Abstain regimes remain the E-Q14 frontier: the channel survives saturation, the pairing does not.",
    "N11": "The drift convoy mechanism of claim C9's death: under d-drift, pressure moves d plus or minus 1 per tick and the folded slot index d&7 cycles with period 8, so every writer sweeps the entire compressed regional space. 86 percent of clean-arm twin events were local hits on folded slots occupied by drifted cross-pair writers, and escalated events collapsed from 14.2 percent to 0.0 as the presence mask became a party line at one remove.",
    "N12": "The wormhole escalation receipt inside claim C10's docket: the escalation carried 1 claim in 12,000 tasks. The table is written at the deferred task's drifted d and read at the claimer's cargo slot — E-Q14's WHO-loss, consumer-side. A consumer needing deferred-task recovery must pin the defer band to the claimer band or accept eventual re-visibility by tau-flip as the only guarantee.",
    "N13": "The slot-saturation kernel fact kept from the C6 run: the 64-slot table saturates after ONE tick on random substrates. Seeds 7000-7002 at 32x32, roughly 256 Abstain writers cover all 64 slots and occupancy stays 64 of 64 through tick 40. Binary slot occupancy is degenerate as an overlap signal — a kernel fact about the non-local channel's capacity worth having before any retrieval claim.",
    "N14": "Experiment E-Q17's flat-arm calibration receipt: flatProvDirect equaled the sealed flat provFrac on all 120 flat runs — the E-Q14 log-order recovery is EXACT at 64x64 — with determinism confirmed on 120 of 120 configurations. The identity-tagged provenance question at scale was priced by the redirect into population, and the flat table's bookkeeping survived the audit intact.",
    "N15": "The twin sidecar at the edge, infrastructure receipt: a Vectorize index serving the wormhole table's pairing returns exact lookups at similarity 1.0 with a 64 of 64 census, convergence eventual at 10-20 seconds observed, the Durable Object authoritative. The remote-read channel gained an external mirror whose pricing claim died but whose exact-lookup utility stands.",
    # ---- P family: the local rule's physics (P6..P15) ----
    "P6": "Claim C1's mechanism, the byte as coupling: one packed-byte read yields both the operator tau = c>>6 and the operand d = c&63, so the Moore-8 gather in tick() costs 9 reads plus 1 write per cell per tick. A two-plane port must fetch timbre and amplitude from different planes at 18 reads plus 1 write. The gain is exactly the information density of the byte — 10/19, about 47.4 percent less semantic traffic, forever, at zero dynamics cost.",
    "P7": "The cached-port boundary of claim C1: a port holding the tau plane SRAM-resident — possible only because tau is frozen inside tick() — reaches per-tick parity at 10 versus 10 reads. The price is 4,096 standing bytes of residency and the assumption that timbre never changes mid-run; any injector breaks the cache. The removal of the timbre coupling from the memory system, not any dynamics advantage, is the gain of function.",
    "P8": "E-Q16 family B's completion scaling: completion ticks scale as roughly 1 over sigma — 38 down to 3 as sigma sweeps 0.25 to 4 on the dense phase table. Sigma is a gain knob the bridge-formation metric cannot see; the monotone-inert verdict must never be quoted without its formation scope. The local rule's delivery timing is set by the resonance amplitude, tick by tick.",
    "P9": "Claim C4's cascade physics, re-derivable from the kernel: on the situation-9 checkerboard every cell sits in a like-signed accumulator field, the seeded flip perturbs its 8 neighbors by minus 64 net, and the deviation field spreads at the toroidal light-cone — radius 64 means full wrap by tick 64, firstSpreadTick 1. Regime CASCADE in all four alpha pairs including wormhole-OFF: a genuine, deterministic, fast-spreading relaxation wave of the local rule.",
    "P10": "Claim C5's erosion mechanism: a Repel ring cell is surrounded by like-timbre Repel neighbors, each subtracting d into its real accumulator under SPEC L1 s5, so pressure is negative every tick and nextD walks d toward 0 one unit per tick by the rule table. No positive-pressure source exists anywhere near the ring — the Attract core at r<=8 is unreachable through Ground. The ring is not armor; it is a slowly dissolving battery, and even the pristine ring self-erodes, half-erosion at tick 28.",
    "P11": "Claim C5-prime, the injector semantics that stand: an external injector CAN restore d=55 and the substrate WILL re-erode it deterministically — the A2 arm re-erodes on the same curve, half-erosion at tick 25. The restore-then-re-erode curve is now specified, receipted behavior any downstream system can depend on: repair is a kernel change requiring a positive-pressure source or a tau-mutation rule, not a rescue of the original claim.",
    "P12": "The fixed-point plane's falsification: prediction P-B1, zero divergence at the fixed point, was falsified on the 1.6/0.7 parameter pair, with plane R8 conformance checked alongside — chain a7f7a552, 24 links. The local rule's fixed points are not the guaranteed attractors the algebra promised; the divergence is real, measured, and bounds every stability claim made about the update law.",
    "P13": "The closed-form artifact predicates: E-Q9, E-Q11, and E-Q12 discharged artifact family-bound predicates with content-hash receipts e146ed74 and 3306f390, E-Q9 chainless by registered decision. The E-Q9 primaries carried a comparison-shape defect caught in-run, and the full re-run was byte-identical — the float-plane's artifact families are closed-form predictable at exact-zero families, a receipt against the rule table's own arithmetic.",
    "P14": "Gate G3's determinism receipt: same seed produces a byte-identical 1000-tick trace — perTickMatch 1000 of 1000, the plane equation holds, randHits 0 because no Math.random exists in the kernel — while a different seed yields a different digest. The local update law is a pure function of its planes; this is the contract every later claim inherits and the outside rebuilder confirmed on 12 of 12 corpus cases.",
    "P15": "Claim C4's terminal-state receipt: at T=256 the checkerboard shows zero flip-attributable substrate-wide inversion anywhere — a wave that sweeps the whole board and inverts nothing, with terminal parity-dependence false in BOTH phases. Yet the twin channel is not sign-impotent: OFF-nu fired 0 times against ON-nu's 991 firings. The cascade is real, the firings are real, and the threshold semantics the gift attached to them do not exist.",
    # ---- Q family: quantum construction & randomness provenance (Q6..Q15) ----
    "Q6": "Claim C11's H1 receipt, behavioral transparency: the certified SP 800-90B quantum root, SHA-256-expanded, is statistically indistinguishable from mulberry32 at EVERY checkpoint and metric — byte provenance is invisible to the dynamics. The NIST 90B-to-90A pattern is behaviorally transparent on this substrate: certified entropy and a fast PRNG tick identically once expanded, each individually byte-deterministic.",
    "Q7": "The quantum blur's initial fingerprint: at t=0 the dW1 distance between blur-conditioned and clean planes is 12.06 against a floor of 0.51 — a huge measured separation that the tick operator then relaxes. The construction leaves its fingerprint exactly once, at the start, and the provenance question becomes how fast the dynamics wash it out.",
    "Q8": "The interference-shaped geometry: the exact blur circuit yields Moore-8 Moran's I of minus 0.068 — NEGATIVE — where a classical smoothing blur would be strongly positive. The measured correlation structure of the conditioned planes is quantum-native: interference, not diffusion, sets the initial geometry. This is the strongest single receipt that the construction is genuinely quantum, not pseudo-random smoothing.",
    "Q9": "Experiment E-Q20b's burn-in ladder at zero credits: the relaxation time T-star exceeds 512. The true shape is dip-at-8, re-excite, then a metastable plateau about 20 percent above floor through t=512 — the earlier converging-monotonically reading was a checkpoint-sampling artifact. The autocorrelation annotation is now part of claim C11's sealed verdict: initial spatial correlation is slow, persistent, and structurally real.",
    "Q10": "The slow-mode receipt of claim C11's H2 death: spatial autocorrelation had not equilibrated by t=64 — A3 at 0.038 and A3S at 0.034 against a floor of 0.021 — while dW1, tauTV, and twinRate DID wash out. Initial spatial correlation is a slow mode of the tick operator, and the A3S excursion proves the persistence is dynamical, not quantum-specific: the construction's fingerprint outlives its interpretation.",
    "Q11": "The moth-whitened deep trace's seed receipt, E-Q9-DT: job 2caa822b, engine graph-v1, backend aer, mode emu, 1024 shots in 4138 ms. The raw stream was 4,848 bits with 2,666 ones, balance 0.5499, 20 distinct outcomes; raw bits sha256 ebc8a43d archived OUTSIDE the repo, key-free, and never used raw — the raw-balance law makes debias mandatory before any draw.",
    "Q12": "The whitener recipe, exactly as registered: von Neumann debias of 2,424 pairs into 1,254 bits — emitting 1015 of 239, discarding 00 at 464 and 11 at 706 — then MSB-first byte packing to 157 bytes with pad 2, then a SHA-256 counter stream block_c = SHA256(u32be(c) or vn_bytes), then Fisher-Yates over the 1,134-family rat-D pool with 16-bit rejection-sampled draws. Every step sha-receipted; the moth order selected 16.",
    "Q13": "The moth deep-trace verdict: 9 of 11 registered events PASS; 2 FIRED — dt_b and dt_c, the registered falsifier branch 'a fixed-kernel move at rat or near DT-C' literally fired, honest FAIL standing per the registration's own commitment. Zero unexplained cells, zero D1 failures, zero holes, zero census-pin mismatches. The quantum-seeded trace priced its own expectations and honored the miss.",
    "Q14": "The dyadic-representability finding: 0 of 16 selected families showed a fixed-DOWN kernel-disagreement move — the 7/10-style fixed-DOWN class does not appear anywhere in the dyadic deep trace, exactly as the census arithmetic demands. Dyadic dd dividing 2^32 makes the fixed B pressure exactly representable; E-Q9's F-INV lives only at the NEAR arm, 379 of 1,134 families, all-dyadic.",
    "Q15": "The F-INV shape at the near arm: 3 of 16 census-pinned families — 1/4, 39/128, 97/32 — against a hypergeometric expectation of 5.3474 at modal k=5 (pmf-Brier 0.939633, the draw inside registered support). Every F-INV family: first divergence tick 1, exactly one cell at B(6,2), |dd|=1, fixed HELD at the divergence tick while float moved UP plus one — DIV1-FIN under the E-Q9 taxonomy.",
    # ---- A family: allocation & economics (A6..A15) ----
    "A6": "Claim C10's physics-bundle receipt: full-A stable starvation 0.3194 versus A-static's 0.4435 under 0.90 saturation. D-ties at 63 break by age, and the re-boost re-stamps the flapper's cell at 48..62, resetting its own aging — the gamer's boost is a self-inflicted FIFO penalty, the AM6(i) prediction confirmed. The arbitration physics cuts starvation without admission control, at a price measured separately.",
    "A7": "The tail-latency price of the docket: stable p99 of 845 against the heap's 633 — age-tie serving queues young stable work behind old. The starvation cut is real, and it is bought with tail latency: the same aging rule that penalizes the flapper taxes every young task in a saturated queue. Arbitration is a trade between whose wait counts, not a free lunch.",
    "A8": "The flood-cap economics of claim C10: jurisdiction tiles aligned with source homes cap the flooder at 0.339 of served at the pre-overflow checkpoint versus the heap's 0.75 — but once the flood backlog overflows its region, 7,113 overflows per run receipted, the cap erodes to 0.436. Plane capacity is flood insurance: bounded, structural, and priced by the backlog it can absorb.",
    "A9": "Experiment E-Q15's reward-reweighting verdict: across twenty seeds the probe's quality delta ran at or below the baseline — qProbe under qBase by as much as minus 33, median delta never clearing the plus-1 win band, the win-rate under the 55 percent floor. Quality-correlated reweighting of accepted rejections did not beat the plain accept: the reward channel is not a steering channel on this substrate.",
    "A10": "The falsification budget's ledger: 7 banked nulls and 9 caught defects against zero silent failures, across 18 stone-v1 chains and 673 rows. Every banked null is a mistake downstream systems will never make; every caught defect is a process that worked. The account pays for funerals with receipts — the cheap honest death of a claim is the house's cheapest purchase.",
    "A11": "The C6 pricing run's cost accounting: run 1 INVALID, receipted — a brand-new Vectorize index did not serve its first upserts within the 20-second settle, and the original ground truth was degenerate; run 2 VALID with the M3 sanity gate at 30 of 30, M1 precision@5 of 0.053 below the roughly 0.17 chance floor, M2 Spearman at minus 0.16. The claim died below chance at total API cost of zero dollars: cheap and honest is the law.",
    "A12": "The seat-capacity reallocation: the Groq seat re-probed HKG-geo-blocked both direct and through the relay — a pre-auth region 403 that no key rotation cures — so the rapid-cheap seat moved to DeepInfra. Capacity allocation across model providers follows reachability, not preference; the geo-pending receipt stands and the bench's provider mix is itself a priced decision.",
    "A13": "The round-budget discipline: four consecutive rounds ran under a 0.10-dollar ceiling each with actual spends of about 0.03, 0.008, 0.02, and 0.017 — zero silent failures. The ceiling is the allocation instrument; the seal-before-spend law is the enforcement; the AS-SAID row accounting is the audit. Cheap research is not small research: the constraint is what forced the zero-call experiments.",
    "A14": "The generated-question budget collapse, E-Q33: a one-shot DeepSeek battery retrieved at 0.25, exactly the majority baseline — an untrained generator proposes FEATURE probes, not CONCERN questions. Generated best-2 matched fixed best-2 at 0.60, but generated-4 collapsed to 0.25 while fixed-4 reached 0.90: the fixed battery's advantage is COMPLEMENTARITY among questions, not per-question quality.",
    "A15": "The question-budget curve, E-Q29: the best-4 subset P1+P2+P3+P4 retrieves at 0.90 LIVE, ABOVE the full 8-axis battery at 0.80 — the curve peaks at k=4 to 6 and declines to k=8, the last four questions being net noise dimensions for retrieval. Shapley's top-4 differs from the best-4: question selection is combinatorial, and marginal value is not complementarity.",
}

def main():
    old = json.loads(OLD.read_text())
    old_records = old["records"]
    assert len(old_records) == 20, "the sealed 20 must be present"
    records = list(old_records)  # byte-identical copies, order preserved
    seen_ids = {r["id"] for r in records}
    for rid, text in NEW_RECORDS.items():
        fam = rid[0]
        assert rid not in seen_ids
        assert 300 <= len(text) <= 600, f"{rid} length {len(text)} outside band"
        records.append({"id": rid, "family": fam, "text": text})
    assert len(records) == 60
    fams = {}
    for r in records:
        fams.setdefault(r["family"], []).append(r["id"])
    assert all(len(v) == 15 for v in fams.values()), fams
    corpus = {
        "law": ("E-Q36 at-scale corpus — sealed BEFORE any embed call (ORCH-R28/T19-b). "
                 "60 records, 4 families x 15: the sealed E-Q21 20 byte-identical (IDs 1-5 per family) "
                 "+ 40 new (IDs 6-15 per family) composed from the sealed record (CLAIM-VERDICTS.md, "
                 "FALSIFICATION-BUDGET.md, README rounds, the moth verdict, the sealed chains). "
                 "Every number appears in the sealed record. Family labels are the retrieval ground truth."),
        "families": FAMILIES,
        "records": records,
    }
    out = HERE / "corpus_at_scale.json"
    out.write_text(json.dumps(corpus, indent=1, ensure_ascii=False) + "\n")
    sha = hashlib.sha256(out.read_bytes()).hexdigest()
    print("wrote", out)
    print("records:", len(records), "| per family:", {k: len(v) for k, v in fams.items()})
    print("corpus sha256:", sha)
    lens = [len(r["text"]) for r in records]
    print("text length min/median/max:", min(lens), sorted(lens)[len(lens)//2], max(lens))

if __name__ == "__main__":
    main()
