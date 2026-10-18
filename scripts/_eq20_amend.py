#!/usr/bin/env python3
# scripts/_eq20_amend.py — fold the Seed design-attack dispositions into the
# E-Q20 registration as PRE-RUN amendments (the pricing-first law: no
# amendment after the first data row; none exists yet).
import json, hashlib, sys

REG = 'experiments/pre_registration_e_q20.json'
with open(REG) as f:
    raw = f.read()
    reg = json.loads(raw)

reg_sha_before = hashlib.sha256(raw.encode()).hexdigest()

# AM2: A1 n=10 -> n=20 (free local compute; floor stability) — design field
# updated WITH the amendment receipt inside amendments_pre_run.
reg['design_frozen']['arms']['A1_prng'] = reg['design_frozen']['arms']['A1_prng'].replace(
    'n=10 planes (seeds k=0..9)', 'n=20 planes (seeds k=0..19; AM2: raised from 10 for floor stability — free local compute)')
reg['design_frozen']['populations'] = ('A1 n=20 (AM2), A2 n=10, A3 n=5, A3S n=5. Cross-arm comparisons use '
    'population statistics (median of per-plane distances vs the A1 LOO reference); every plane individually hash-journaled.')

# AM3: Moran's I on rook-4 AND Moore-8 (Moore-8 primary — the kernel's own coupling).
reg['metrics']['morans_i'] = ("per plane per checkpoint: Moran's I computed on BOTH rook-4 and Moore-8 lag-1 "
    "(torus wrap) on the d-field. MOORE-8 IS PRIMARY (AM3 — the kernel's tick couples Moore-8; the instrument "
    "must measure the structure the operator actually modifies); rook-4 kept as the conventional reference. "
    "The correlation-structure instrument: A3 should start HIGH (blur = smooth), A3S starts ~ A1's level (shuffled), "
    "and the question is whether A3's I decays to the A1 floor and when.")

# AM4: twin rate normalized per cell per tick.
reg['metrics']['twin_event_rate'] = ("kernel twin events per tick per CELL at each checkpoint window (AM4: "
    "normalized by cell count for cross-grid comparability under the 32x32 fallback), from the event stream the "
    "kernel itself emits — no re-implementation.")

# AM1: byte-splitting discipline frozen into the A2 arm.
reg['design_frozen']['arms']['A2_qrng'] = reg['design_frozen']['arms']['A2_qrng'].replace(
    'n=10. The certified-constructor arm.',
    "n=10. The certified-constructor arm. AM1 (byte-splitting law, from attack A1): the FIRST 40960 of the 49152 "
    "conditioned bytes are split into 10 CONTIGUOUS 4096-byte blocks, one per A2 plane, each block consumed "
    "row-major (x ascending, then y ascending) as that plane's seedFn journal; the trailing 8192 bytes are "
    "receipted UNUSED (consumption window explicit, reproducible).")

# The dispositions block.
reg['amendments_pre_run'] = {
    'consult': 'situations/e_q20_design_attack.jsonl (ByteDance/Seed-2.0-mini, ATTACK-briefed, 6 attacks, $0.005061, 58.9s, AS-SAID, sealed pre-run — no data row existed)',
    'AM1_from_A1_ACCEPTED': 'The byte-consumption window was genuinely unspecified. FROZEN: first 40960 of 49152 conditioned bytes, 10 contiguous 4096-byte blocks, row-major within each plane, trailing 8192 bytes receipted unused. H1 death-candidate (b) is now testable by construction.',
    'AM2_from_A3_ACCEPTED_IN_PART': 'A1 raised to n=20 (free local compute) to stabilize the LOO floor; the population statistic is precisely defined as the MEDIAN of per-plane distances. A3/A3S remain n=5 — credit-capped at the registered 10-credit ceiling, the power limitation receipted here and carried into the verdict as a caveat. No bootstrap substitution: the corpus law prefers the direct LOO floor ("no threshold you had to fit"); a resampled threshold would be a threshold we tuned. Multiplicity receipted: H1 is the strict every-checkpoint claim; H2 decides at t=64 only; earlier-tick excursions are H3\u2019s expected fingerprint, not H2 failures.',
    'AM3_from_A4_ACCEPTED': "Moran's I now computed on rook-4 AND Moore-8 lag-1, Moore-8 PRIMARY — the kernel's tick couples Moore-8 and the instrument must measure the structure the operator actually modifies. Rook-4 kept as the conventional reference. The runner reports both.",
    'AM4_from_A5_ACCEPTED': 'twinRate normalized per cell per tick (events/tick/cells) — cross-grid comparability under the pre-registered 32x32 fallback.',
    'A2_REFUTED_AS_STATED_receipted': "The tau-from-A2 design is deliberate chain attribution, not a confound: A3 = A2 + blur-only-on-d isolates the blur in A3-vs-A2; H1 (A2-vs-A1) is the standing tau/d control; any A3-vs-A1 excursion with H1 clean attributes to the d-field blur by elimination. The proposed fix (tau from PRNG) would make A3-vs-A2 differ in TWO variables (tau source AND d blur) — strictly worse for attribution. Receipted, design unchanged.",
    'A6_REFUTED_on_facts_receipted': 'There is no truncation anywhere: for A1/A2 the seed byte IS the packed cell (tau = byte>>6, d = byte&0x3F — a direct 6-bit field, uniform over 0..63, no floor division). The requantization tie rule is receipted explicitly: round-half-up on the blur-rescaled floats (ties toward larger d; expected tie frequency ~0 for float outputs). A3\u2019s d-marginal differing from uniform is H3\u2019s expected t=0 fingerprint, and F5 pins A3S to A3 exactly.',
    'law': 'registered sha256 before amendment: ' + reg_sha_before,
}

out = json.dumps(reg, indent=1, ensure_ascii=False) + '\n'
with open(REG, 'w') as f:
    f.write(out)
print('amended:', REG)
print('sha256 after amendment:', hashlib.sha256(out.encode()).hexdigest())
for k in ['AM1_from_A1_ACCEPTED', 'AM2_from_A3_ACCEPTED_IN_PART', 'AM3_from_A4_ACCEPTED', 'AM4_from_A5_ACCEPTED', 'A2_REFUTED_AS_STATED_receipted', 'A6_REFUTED_on_facts_receipted']:
    print(' -', k)
