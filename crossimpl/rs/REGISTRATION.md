# crossimpl/rs — REGISTRATION (ORCH-R20, lane T11-a — the fourth language)

**Law (inherited from the C lane, `crossimpl/c/REGISTRATION.md`):** the Rust
port must be BYTE-EXACT against the reference kernels on the sealed fixture
battery, or it does not ship as a port. The round registration (commit
`a4109c9`, `docs/discussions/2026-10-18-orch-r20-registration.md`) froze this
lane before any work: byte-exact vs the sealed fixtures on both planes,
σ-as-bits (never libm — the C lane's law), conformance harness, sealed
receipts, this file, a findings row, a PORTING.md runtimes row. The
pre-declared scope cut (toolchain unobtainable → code-delivered but honestly
marked unexecuted) was NOT needed: the toolchain installed cleanly.

## The port contract

- **Scope:** LAYER 0 complete (pack/unpack/tau_of/d_of, Ψ channel
  coefficients, split-channel `vector_pass` in exact `i64`) + LAYER 1
  complete (64-slot wormhole table, toroidal Moore-8 tick with pre-tick
  snapshot [R2], live row-major LWW reads [R2/R4], τ frozen, `next_d` rule
  table with saturation cap `min(d+1, 63)`, caller-side mulberry32) + the
  canonical plane hash (sha256 over `WxH@t=T:<hex>`, matching
  `experiments/_harness.mjs`).
- **Two planes:** float mode (σ as `f64` from IEEE754 bits, byte-identical
  to `qthe.mjs`) and fixed mode (σ_q as `u64`, byte-identical to
  `fixedpoint/qthe_fixed.mjs`, R8: `pressure = acc·S + term_q`, S = 2³²).
- **σ never comes from a transcendental.** It travels as IEEE754 bit
  patterns (16 hex chars) in the fixtures; the lazy float default is
  `f64::from_bits(0x3FF95C01A39FBD68)` (log₂(3), receipted from the JS
  reference by the C lane); the fixed default is the baked integer literal
  `6_807_362_106` (round(log₂(3)·2³²)). Rust `f64` multiply/add are
  IEEE754 correctly-rounded on every platform, so term bits agree; no
  `log2()` is ever called (there is none to call — the port uses no float
  functions at all).
- **Zero dependencies:** std only, `#![forbid(unsafe_code)]`, edition 2021.
  `Cargo.lock` is committed (it pins nothing but this package — the
  reproducible-resolution receipt).
- **The 64-slot wormhole table is derived, not transcribed from a list:**
  `qthe.mjs` ships no table of constants — the table starts EMPTY (sx/sy
  filled with −1, sr zero, occupied zero, totalWrites 0) and is populated
  at tick time by Abstain writers. The port mirrors that derivation
  verbatim (same 64 slots, same −1/0 initial state, same live-read/LWW
  mechanics, same totalWrites counter).

## The battery (the C lane's sealed fixtures, shared verbatim)

`crossimpl/c/fixtures.txt` — sha256
`dd86674875f9878c69597cac00aebb3d3f4880f400944411a4e49c496a7ccd82` (equals
the sha sealed in the cimpl chain's `rules.cimpl` row). **Not regenerated
for this port.** A regeneration-determinism check was run once in this
worktree before any port code existed: `node crossimpl/c/gen_fixtures.mjs`
re-executed the JS reference kernels and rewrote the file byte-identically
(same sha; `git status` clean after) — the fixtures are reproducible from
the reference kernels, and this port replays the committed bytes.

- 4 vectorPass cases (4×6, 8×3, 1×1, 5×5, seeded weights + signed xs).
- 12 substrate cases, float plane: E-Q1 twin-delivery ON/OFF (200 ticks),
  P-B3-style random at σ=2/3 and default, checkerboard cascade, σ ∈
  {0.5, 4} arms, 8×8 all-Abstain cooker, the E-Q8 same-slot boards at σ=2/3
  and 8/5, a fresh twin family, a handcrafted mixed board.
- 3 fixed-plane cases: random at σ_q=2863311531 (2/3) and default
  σ_q=6807362106, plus the E-Q8 board at 2/3 (the fixed side of the R8
  engineered one-S-unit divergence family).

## Floors (frozen by the round registration, sealed as `rules.rs`)

- **RS1-ALL:** every case PASS — final plane hash equal, event count equal,
  every event tuple equal (tick, x, y, slot, resonance — the tick field is
  compared too, ONE FIELD STRICTER than the C runner, which deliberately
  skipped it), every term bit-pattern (float) or integer (fixed) equal.
  Zero mismatches. Any single mismatch = NOT byte-exact: honest FAIL,
  autopsy, no partial credit.
- **RS2-ZERO-DEPS:** no external crates; `cargo build` resolves nothing.
- **RS3-NO-TRANSCENDENTAL:** σ only ever from bits / baked integers.

## How to run (exact commands)

```bash
# toolchain (sandbox had no cargo; installed once via rustup minimal):
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
. "$HOME/.cargo/env"                     # rustc 1.99.1 (58cf8f9c3 2026-10-13)

cd crossimpl/rs
cargo test --release                     # LAYER-0/LAYER-1 unit tests
cargo build --release                    # target/release/conformance
./target/release/conformance ../c/fixtures.txt
node seal_rs.mjs                         # build + test + conform TWICE + seal + verify from disk
cd ../.. && node scripts/verify_all_chains.mjs
```

`seal_rs.mjs` prepends `~/.cargo/bin` to PATH when present (sandbox
convenience; the run.config row receipts the actual versions used).

## Sealed results (observed in this sandbox, this worktree, branch r20-rust)

**Conformance — 19/19 cases PASS, 0 FAIL, exit 0** (4 VEC + 12 float CASE
+ 3 fixed CASE; both planes byte-exact):

```
$ ./target/release/conformance ../c/fixtures.txt
VEC v4x6 PASS
VEC v8x3 PASS
VEC v1x1 PASS
VEC v5x5 PASS
CASE c1_twin_on_default PASS
CASE c2_twin_off PASS
CASE c3_rand23 PASS
CASE c4_rand_default PASS
CASE c5_checker PASS
CASE c6_rand_sigma05 PASS
CASE c11_rand_sigma4 PASS
CASE c7_cooker PASS
CASE c8_eq8_23 PASS
CASE c9_eq8_85 PASS
CASE c10_twin66001 PASS
CASE c12_mixed PASS
CASE f1_rand23_fixed PASS
CASE f2_rand_default_fixed PASS
CASE f3_eq8_23_fixed PASS

conformance: 19/19 cases PASS, 0 FAIL
$ echo $?
0
```

First observed run was already 19/19 — the port was written against the
receipts (R1–R8) and the C lane's methodology, and the battery's known trap
sites (the R8 S-scaling that caught the C port's run-1 defect; the E-Q8
artifact boards; the cooker) all passed on the first attempt. No defects
were found in the Rust port; the honest-defect receipt for THIS lane is the
sealer's design (below), not a port bug.

**Unit tests — 13/13 (`cargo test --release`, parsed live by the sealer):**

```
running 13 tests
test tests::mulberry32_kat_vs_js_kernel ... ok
test tests::pack_unpack_bijection_exhaustive ... ok
test tests::plane_hash_shape ... ok
test tests::fixed_plane_scaled_domain ... ok
test tests::psi_i_to_the_fourth_is_one ... ok
test tests::psi_i_times_i_is_minus_one ... ok
test tests::psi_zero_absorbing ... ok
test tests::saturation_cap_min_d_plus_one_63 ... ok
test tests::saturation_floor_zero ... ok
test tests::sha256_kat ... ok
test tests::torus_wraparound ... ok
test tests::vector_pass_channels_and_cancellation ... ok
test tests::wormhole_live_read_and_never_self ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

The LAYER-0 algebra is covered as registered: pack/unpack bijection
EXHAUSTIVE over all 256 bytes (distinct pairs, full 4×64 product);
i·i = −1 and i⁴ = +1 as channel-coefficient compositions landing exactly on
the REPEL and ATTRACT operators; Ψ(0) absorbing (coefficient level AND
end-to-end through `vector_pass`); torus wraparound (a seam neighbor presses
through the boundary, a non-neighbor holds); saturation cap `min(d+1,63)`
and floor 0; plus the R2/R4 wormhole receipts (same-tick live read,
never-self, LWW), the R8 scaled domain (twin_pressure_q(−2, 2/3) = +1 vs
the float plane's exact-zero hold), a mulberry32 KAT against values
generated by the JS kernel itself, and FIPS sha256 / plane-hash KATs
computed via node crypto.

**Determinism:** the sealer runs the conformance TWICE per seal and refuses
on any difference; the two runs were byte-identical, output sha256
`6899aa2447e8a4fbf9777a239644ac8c0511814e378bfa8b4e1d0ed6798ba2b8`.
A single battery run measures ~35 ms wall (release build).

**Negative controls (pre-seal, on temp fixture copies — the comparison is
live, not vacuous):**

| control | tamper | detected | exit |
|---|---|---|---|
| NC-rs1 | one nibble flipped in the c12_mixed init PLANE | YES (`event-count 536 != 496` — the corrupted dynamics diverged; the hash clause would also fire) | 1 |
| NC-rs2 | one hex digit flipped in c1's first event term BITS (`3ff9…` → `0ff9…`) | YES (`event[0] term bits … != …`) | 1 |
| NC-rs3 | f1's event count tampered 1842 → 1841 | YES (`event-count 1842 != 1841`) | 1 |

(True exit codes re-checked WITHOUT a pipe — the R11 pipe-masking gotcha is
a banked ops law here.)

## Sealer design (the honest defect receipt of this lane)

`seal_rs.mjs` counts ANCHORED per-line results only
(`/^(VEC|CASE) \S+ PASS$/` on trimmed lines) AND cross-checks the counts
against the runner's own summary line, refusing to seal on any disagreement.
This designs out both counting-defect classes the C lane's sealer hit
(receipted in `cimpl_chain.jsonl` rows 4–10: run 1 counted the summary's
literal "0 FAIL" via substring match; the correction run's regex demanded a
leading space the runner never emits and counted 0 passed / 0 failed). The
cimpl chain's final verdict-row STRING ("NOT BYTE-EXACT" alongside
`C1_ALL:true`) is that second defect's residue; the correction row (row 6)
supersedes it on the record. Nothing was edited in the cimpl chain by this
lane — append-only law.

## Receipt discipline

One stone-v1 chain: `crossimpl/receipts/rs_chain.jsonl` (append-only,
verify-from-disk, refuse-if-broken), sealed by `crossimpl/rs/seal_rs.mjs`
through THE STONE (`experiments/_stone_link.mjs`, read-only link) and
`appendAndVerify` (`experiments/_harness.mjs`), which enforces the ORCH-R11
seal-time registration law — the chain is registered in
`scripts/chain_registry.mjs` in the SAME commit that seals it (commit
`1c3271d`). Chain state: **6 links, tip
`29cc74c39c244c919470bcbc3e7c23ffcaab9b30901d797725126a4ace05288d`**, tip
file `crossimpl/receipts/rs_tip.txt`. Rows: `rules.rs` (floors + battery +
fixtures sha) / `run.config` (rustc 1.99.1, cargo 1.99.1, σ policy, unit
tests) / `result.rs` (19/19 + negative controls + stricter-by-tick note) /
`determinism.rs` (double-run byte-identity + output sha) / `verdict.rs`
(**RUST PORT BYTE-EXACT — 19/19, float plane AND R8 fixed plane, the fourth
language**).

`node scripts/verify_all_chains.mjs` from this worktree:
**ALL CLEAN 35/35** receipts of record verified from disk (19 chains incl.
`crossimpl/receipts/rs_chain.jsonl :: links=6`, 2 content tips, 14 tip-file
agreements).

## Honest limits

- The `rs_tip.txt` file is NOT yet in `verify_all_chains.mjs`'s
  `STONE_TIP_FILES` map (that file is outside this lane's writable surface;
  the cimpl tip needed the same follow-up). The chain itself IS registered
  and verified; adding the tip-agreement entry is a one-line follow-up for
  the orchestrator's sweep (T11-d).
- Editing `scripts/chain_registry.mjs` makes the committed
  `experiments/outputs/fleet_seeds_entry.json`'s pinned registry sha stale
  (the dashboard's drift check exists precisely for this); re-running
  `scripts/emit_fleet_seeds.mjs` + `scripts/build_dashboard.mjs` is the
  sweep's standing close-out step (experiments/ is orchestrator-owned).
- The battery's rng coverage is implicit (the fixtures carry recorded
  planes; the C lane's C2-RNG floor applies verbatim here) — the port's
  mulberry32 is additionally pinned by a KAT against the JS kernel in the
  unit tests.
- One sandbox, one toolchain (rustc 1.99.1); the σ-as-bits law is what
  makes cross-platform agreement structural rather than tested — no claim
  is made about other rustc versions beyond that law.
- `no_std` compatibility was NOT pursued (it would cost the `Vec`/`String`
  surface the conformance runner needs; declared a non-goal, not a gap).

## Reproduce

```
cd crossimpl/rs
cargo test --release          # 13/13
cargo build --release
./target/release/conformance ../c/fixtures.txt   # 19/19, exit 0
node seal_rs.mjs              # re-seals + verifies from disk (append-only)
```
