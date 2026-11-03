// _verify/usage-minimal.ts — the stranger's first five minutes against the
// surface (same role as G1-2's minimal usage file). Must compile --strict.
import { Substrate } from "@qthe/core/engine";

const sub = Substrate.create({ w: 8, h: 8, seed: { kind: "mulberry32", seed: 42, tauFromRng: true, dFromRng: true } });
const events = sub.tick();
sub.run(9);
const h: string = sub.hash();
const trace = sub.trace();
const restored = Substrate.restore(sub.snapshot());
if (restored.hash() !== h) throw new Error("round-trip law broken");
if (trace.tickCount !== 10) throw new Error("tickCount");
if (events.length < 0) throw new Error("events");
