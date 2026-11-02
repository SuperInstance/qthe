# PITCHES — qthe, one line per stranger

> Seat: stranger-experience · Round G1-3. Beachhead order: **Pixel → Locke →
> Arden → Rex** (creative coders adopt on a weekend; the other three follow
> the artifacts they publish). Every hook below either exists in the repo
> today (✅ real path) or is explicitly marked **(proposed)**. Numbers are
> sealed values from `docs/CLAIM-VERDICTS.md` — nothing here resurrects a
> dead claim (no "emergent intelligence," no self-repair, no phase
> thresholds, no "embeddings" as a feature).

---

## Pixel — creative coder (p5.js / Processing / exhibitionist JavaScript)

**Why this beachhead first:** Pixel ships visible artifacts. One Pixel piece
in a gallery means a hundred strangers staring at the substrate, and the
pitch is literally on the wall next to it. Pixel also forgives a young
ecosystem in exchange for two things qthe already has *provably*: exact
reproducibility and a canvas that looks alive.

**The pitch (23 words):**

> Same seed, same art, forever — an 8-bit cellular substrate that hashes
> its own pixels, and wormholes that blink purple across the plane.

**The hook artifact:** ✅ `public-demo.html` — one portable file, zero
install, zero network, zero build: open it and the substrate ticks live with
a sha256 HUD pinned to the byte plane (the same hash strangers can verify
with the quickstart). This is the artifact to hand a Pixel at a demo table:
"your medium is one HTML file, and it proves itself."
Companion for the second touch: **QUICKSTART.md** (this seat's deliverable) —
10 minutes to their *own* canvas sketch, not ours.

**Honest boundary to respect in the pitch:** the mirror demos well, but
there is no `npm install` story yet and no p5-friendly wrapper. Pitch the
file, not a package. (See QUICKSTART §6.)

---

## Locke — game / sim engineer (lockstep, rollback, replay)

**Why second:** Locke's whole job is making simulations that replay
byte-identically across machines, and qthe's determinism contract is
stronger than what most engines ship: no `Math.random` anywhere in the
kernel, sealed cross-language byte-identity, and a hash the HUD computes
every frame. Locke won't believe marketing — Locke believes a rerun.

**The pitch (20 words):**

> A deterministic 8-bit sim core that is byte-identical across JS, C, Python
> and Rust — replay is just the seed.

**The hook artifact:** ✅ `demos/agent-coordination.mjs` — non-local
signaling *without a message bus*: two agents separated by inert Ground
resonate through the 64-slot wormhole table (ON arm: 8/8 delivered;
OFF arm: 0/20 — printed honestly, live). For Locke this reframes the
wormhole table as a deterministic, cheap (13 B per table-write vs
2,304 B/tick full-plane broadcast on a 48×48 board) non-local channel —
the seed of a netcode gimmick, not a physics claim.
Second touch: ✅ `scripts/replay.mjs` — rebuilds a sealed trace, re-ticks,
verifies the plane hash at every checkpoint ("a trace that cannot replay
byte-identically is not sealed evidence" — that sentence *is* the Locke
pitch, and it's already written).

**Honest boundary:** no ECS, no engine integration, no lockstep
sample with two processes yet — **(proposed)**: `demos/lockstep-pair.mjs`,
two node processes sharing only seeds + input, verifying identical plane
hashes. Cheap to build from `qthe-core/`.

---

## Arden — embedded engineer (Cortex-M class)

**Why third:** Arden is the slowest to adopt and the hardest to lose. qthe's
spec is Arden-shaped end to end: one byte per cell, no floats on the fixed
plane, no heap, no stdlib beyond the language, and a C99 port that builds
with one `cc -O2 -std=c99` line, no libm. The 47.4% byte-traffic result
(C1, sealed) is a *RAM/traffic-budget* number, which is exactly Arden's
language.

**The pitch (25 words):**

> 64×64 world state in 4 KB: a byte-per-cell C99 automaton, no floats, no
> heap, no libm — and it still hashes identical to the JS.

**The hook artifact:** ✅ `qthe-core/c/qthe_core.{h,c}` — the C99 port,
byte-exact against both JS kernels on a 19-case battery (plane hashes,
event tuples, IEEE-754 term bits); plus ✅ `crossimpl/c/esp32_demo.c`, an
ESP32 demo that says "this already ran on your class of chip." One build
line, `-std=c99`, zero dependencies. That folder is the entire pitch.

**Honest boundary:** there is no HAL, no tick-per-second budget sealed on a
specific Cortex-M part, and the fixed-point plane (`kernel/qthe_fixed.mjs`,
R8) is the faithful one on adversarial rational sigmas — pitch *that* plane
for MCU work, not the float default. **(proposed)**: a
`qthe-core/c/README-MCU.md` with measured ticks/s on one named board.

---

## Rex — researcher (ALife / digital philosophy / reproducibility)

**Why fourth, not first:** Rex is the most sympathetic to qthe's *method* and
the least convertible by any pitch that smells like hype. Rex converts on
the scoreboard, not the promise: three of the founder's five original claims
died honestly and the bodies are kept on display, sealed, with chain tips.
Rex's trust is won by the nulls.

**The pitch (18 words):**

> Claims are pre-registered, paired-armed, and hash-sealed — including the
> ones that died. Honest nulls kept beside the bodies.

**The hook artifact:** ✅ `docs/CLAIM-VERDICTS.md` — the scoreboard of
record: C1 **LIVES** (47.40% byte-traffic gain, chain `d852e6ac…`), C2
**LIVES** (wormhole is the only non-local channel, 8/8 ON vs 0/20 OFF,
`addc22f9…`), C3/C4/C5 **DIED** — each falsification kept standing with its
mechanism and its chain tip; C10's flood-capping and C11's 512+ tick
spatial-correlation persistence priced with their partials. Pair it with
✅ `scripts/verify_all_chains.mjs` (Rex doesn't trust our summary — Rex
reruns it: `ALL CLEAN :: 13/13 receipts of record verified from disk`).

**Honest boundary:** this is a solo-corpus project, not a lab; "gifted
corpus," "house law," and the fleet idiom are internal culture and *must* be
translated for Rex (see JARGON.md) or the method looks like a cult instead
of a discipline.

---

## Why this order (one paragraph, for the guild)

Pixel converts cheap and broadcasts; Locke converts on determinism once
Pixel's artifacts make the repo legible; Arden converts on the C99 folder
and never churns; Rex converts last and slowest, on the nulls — and then
writes the thing that makes qthe citable. Every hook above is an artifact a
stranger can open *today* without reading a single internal-culture document
first — which is precisely the fix this round's audit (JARGON.md) is for.
