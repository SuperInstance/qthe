# PORTING qthe in 30 minutes (ORCH-17/18)

The worked example is the C99 port (crossimpl/c/) — byte-exact 19/19 in under
300 lines. The recipe it proved:

1. **Read the canon only**: SPEC.md LAYER 0+1 + qthe.mjs header receipts
   R1–R7. Do NOT read other implementations first (the crossimpl lane's
   A1–A10 ambiguity ledger exists because SPEC-first porting surfaces real
   ambiguities — decide yours pre-peek and receipt them).
2. **Transcribe LAYER 0 exactly**: pack/unpack/tauOf/dOf, split-channel
   vectorPass in the widest exact integer type you have.
3. **Transcribe LAYER 1 with the receipts**: toroidal Moore-8 (R1), pre-tick
   snapshot + LIVE row-major wormhole reads (R2), twin term into pressure
   sign only (R3), LWW never-self (R4), tau frozen.
4. **σ travels as BITS, never libm** (the C port's law): log2(3) =
   0x3FF95C01A39FBD68, 2/3 = 0x3FE5555555555555. libm log2 is not
   correctly-rounded-guaranteed; memcpy'd bit patterns are identical on
   every IEEE754 platform.
5. **Fixtures from the reference only**: generate a battery from the JS
   kernels (initial planes + expected hashes + event tuples + term BITS);
   your port replays and compares. Include the E-Q8 artifact sites and the
   cooker; they catch semantics bugs the happy path misses (the C port's
   S-scaling bug was caught exactly there).
6. **The fixed plane**: pressure = acc·S + term, S = 2³² (R8) — do not
   "simplify" it to acc + term; the S-domain is the whole point.

## Runtimes with NO build step (ORCH-18)

| target | build | artifact |
|--------|-------|----------|
| Node/browsers ≥ ESM | none | qthe-core/kernel/qthe.mjs (import) |
| Python 3 | none | qthe-core/py/qthe_layer0.py (LAYER 0) |
| Any C99 host | `cc -O2 -std=c99 -c qthe_core.c` | qthe-core/c/ (library object; one main of your own) |
| Rust (cargo, std only) | `cd crossimpl/rs && cargo build --release` | `target/release/conformance` (byte-exact 19/19 both planes vs `../c/fixtures.txt`; `cargo test` for the unit battery) |
| Single file, no server | none | public-demo.html (kernel inlined) |

Conformance duty per REPRESENTATION-LAW.md: state which plane you implement,
run the battery, seal the result. 30 minutes is the honest budget for the
float plane; the fixed plane adds the S-domain discipline above.
