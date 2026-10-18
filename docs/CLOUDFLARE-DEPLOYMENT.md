# CLOUDFLARE-DEPLOYMENT — qthe on Workers, Durable Objects, Vectorize, Pages

> **Status: design, ready to deploy when the operator's Cloudflare token
> arrives** (it was named in the r15 dispatch but not attached; nothing here
> requires it until the `wrangler` steps at the end). The design is learned
> from the fleet's live patterns, cited per section — not invented in a
> vacuum. Zero-dep law preserved throughout: the kernel (`qthe.mjs`) ships
> unchanged.

---

## 0. What qthe is on the edge (the one-paragraph thesis)

A QTHE substrate is a `Uint8Array` of packed cells (`[τ:2][d:6]`) plus a
64-slot `WormholeTable`, advanced by a pure, deterministic `tick()`. That is
a *single-threaded, strongly-consistent, stateful* computation — which is
exactly what a Cloudflare Durable Object is. The whole deployment is one
sentence: **one DO per substrate, the kernel verbatim inside it, Vectorize
for the twin-resonance index, Pages for the A2UI mirror, R2 for the sealed
receipt chains.**

## 1. The fleet's patterns this design borrows (cited)

| pattern | borrowed from | how qthe uses it |
|---|---|---|
| zero-dep single-file Worker, `wrangler.toml`, no build step | `gitpp-fold-edge` (src/worker.js + src/gitpp.js, "runs on Workers, Node 18+, Deno, Bun") | `qthe.mjs` is already pure ESM with zero deps — it ports verbatim, same two-file shape (`src/worker.js` + `src/qthe.mjs`) |
| D1 + Vectorize + KV + R2 bindings via `wrangler` provision | `quilt-cloudflare` (DEPLOY.md: `wrangler d1 create`, `wrangler vectorize create --dimensions=768`, `wrangler kv:namespace create`) | we use **Vectorize + KV + R2 only** — no D1 (the substrate is in-DO memory + DO storage, not SQL; see §3) |
| Durable Objects for vibe state + cron triggers | `quilt-elf` (src/worker.ts: `VIBE_STATE?: DurableObjectNamespace`, `[triggers] crons = ["*/15 * * * *"]`) | one `SubstrateDO` per substrate id; `alarm()` drives tick batches |
| Pages with `_worker.js` + `_redirects` | `AI-Writings` (root `_worker.js`, `_pagesignore`, served at ai-writings.pages.dev) | the A2UI mirror (public-demo.html) as a Pages project talking to the Worker |

## 2. The topology

```
                       ┌────────────────────────────────┐
   browser ──A2UI────▶ │  Pages  (the mirror, static)   │
        │              └───────────────┬────────────────┘
        │ fetch/SSE (twin events)      │
        ▼                              ▼
   ┌─────────────────────────────────────────────────────┐
   │  Worker  (router, zero-dep)                         │
   │   /substrate/:id/tick?n=K   → DO stub → tick K times│
   │   /substrate/:id/view       → traceView JSON        │
   │   /substrate/:id/events    → SSE of twin hits       │
   │   /substrate/:id/receipt   → seal + push to R2      │
   └──────┬──────────────┬──────────────┬────────────────┘
          │              │              │
   ┌──────▼─────┐ ┌──────▼──────┐ ┌─────▼──────────────┐
   │ Durable    │ │ Vectorize   │ │ R2                 │
   │ Objects    │ │ qthe-twins  │ │ qthe-receipts      │
   │ (per       │ │ (twin-event │ │ (append-only       │
   │  substrate)│ │  embeddings)│ │  chain JSONL,      │
   │ kernel +   │ │             │ │  content-addressed)│
   │ table in   │ │             │ │                    │
   │ memory     │ │             │ │                    │
   └────────────┘ └─────────────┘ └────────────────────┘
          │
   ┌──────▼─────────────┐
   │ KV  qthe-hud       │  ephemeral HUD snapshots (the A2UI
   │ (cache, TTL 60s)   │  reads this, not the DO — cheap fan-out)
   └────────────────────┘
```

## 3. Why a Durable Object per substrate (the honest reasoning)

- **The determinism law is the constraint.** SPEC LAYER 0 item 6: same
  substrate + same tick count → byte-identical planes. A DO is
  single-threaded with strongly-consistent storage — there is no interleaving
  that can violate tick order. On a plain Worker + KV/D1, two concurrent
  `tick` requests could interleave reads/writes and the law would need a
  compare-and-swap dance the kernel never promised. We do not buy that risk.
- **The state is small.** A 64×64 substrate is 4 KiB + a 64-slot table
  (~1 KiB). It lives in DO memory; `storage.put("plane", …)` per checkpoint
  is trivially inside DO limits. D1 was considered and rejected: SQL buys
  queryability we do not need — the query surface is Vectorize's job.
- **`alarm()` is the tick scheduler.** `setAlarm()` for the next batch
  (the quilt-elf cron pattern, but per-substrate and precise): the DO wakes,
  ticks N times, emits twin events, writes the checkpoint, re-arms. Cron
  Triggers (worker-level) are used only for the *fleet* heartbeat — e.g.
  a daily receipt-chain verification sweep (`verify_all_chains` logic).

## 4. The kernel integration (verbatim, zero-dep law)

`src/worker.js` — the whole adapter is import + call; **qthe.mjs is not
modified**:

```js
import { makeSubstrate, tick, traceView, WormholeTable } from "./qthe.mjs";

export class SubstrateDO {
  constructor(state, env) { this.state = state; this.env = env; }
  async load() {
    const buf = await this.state.storage.get("plane");
    if (buf) {
      const cells = new Uint8Array(buf);
      Object.assign(cells, { w: 64, h: 64 });          // expando restore
      cells.__wormholes = new WormholeTable();          // rebuilt from storage
      // (table slots persisted alongside; see receipt below)
      return cells;
    }
    return makeSubstrate(64, 64, seedFn);               // first boot
  }
  async doTicks(n) {
    const cells = await this.load();
    for (let i = 0; i < n; i++) tick(cells);            // the law: serial, in-DO
    await this.state.storage.put("plane", cells.buffer);
    return traceView(cells);                            // deterministic view
  }
  async alarm() { /* tick batch + twin-event emission + re-arm */ }
}
```

**Honest caveat (receipted, not hidden):** the kernel carries substrate
metadata as JS expando properties (`cells.w`, `cells.__wormholes`) — a
`Uint8Array` survives DO storage as its buffer, expandos do not. The adapter
re-derives them on load. This is exactly the AMBIGUITY.md class of
porting note; it belongs in the adapter, never patched into the kernel.

## 5. Vectorize — the twin-resonance index

- Index: `wrangler vectorize create qthe-twins --dimensions=64`.
- **What is embedded:** the twin-hit event stream, not the raw plane. Each
  `{kind:'twin', x, y, slot, resonance, term}` event becomes one vector:
  64 dims = the slot histogram of that substrate's last tick window
  (dim i = normalized write-count of slot i), metadata = `{substrate,
  tick, resonance}`. (Workers AI `@cf/baai/bge-base-en-v1.5` — the same
  embedder `superinstance-advisor` uses for the canon — generates a
  *semantic* side-index over trace summaries; the slot histogram is the
  *mechanical* index. Two indexes, two questions.)
- **The query the index answers:** "which other substrates are resonating
  in the same slots right now?" — the wormhole table's cross-substrate
  analogue. This is the only place the design extends past the SPEC, and it
  is LAYER 2 by house law: an empirical claim (C6 candidate: *cross-substrate
  slot-histogram similarity predicts useful twin overlap*), priced by
  experiment when deployed, never assumed.

## 6. R2 — the receipt chains

Sealed chains (`receipts/*.jsonl`, the stone-v1 format) are append-only
blobs: R2 with content-addressed keys (`sha256-first-16.jsonl`), exactly the
`quilt-organ-workers` content-addressing pattern. KV holds chain tips
(`{chain: tip}`) for cheap verification fan-out; the Cron Trigger runs the
`verify_all_chains` logic daily against R2 and reports mismatches to the
tavern ledger.

## 7. Pages — the A2UI mirror

- Project: `qthe-a2ui` — `demo/public-demo.html` + `docs/dashboard.html`
  built by the existing `scripts/build_public_demo.mjs`, deployed as static
  assets. `_worker.js` optional (only if the HUD needs server-side shaping).
- The HUD reads KV (60s TTL snapshots) for cheap polling; the *live* twin
  events come from the Worker's SSE endpoint. Pixel = cell stays true: the
  mirror renders exactly `traceView()` output, never a server-side
  reinterpretation.

## 8. The deploy runbook (when the token arrives)

```bash
npm install -g wrangler
wrangler login                       # or: CLOUDFLARE_API_TOKEN=<token>
wrangler vectorize create qthe-twins --dimensions=64
wrangler kv:namespace create HUD
wrangler r2 bucket create qthe-receipts
# wrangler.toml: main=src/worker.js, DO binding SubstrateDO,
#   [[vectorize]] qthe-twins, [[kv_namespaces]] HUD, [[r2_buckets]]
wrangler deploy                      # the Worker + DOs
wrangler pages deploy dist/a2ui --project-name qthe-a2ui
```

Durable Objects require a paid Workers plan (or the free-tier single-DO
allowance — verify at deploy time; if absent, the fallback is ONE DO for the
demo substrate and the honest note in the README).

## 9. What this deployment would earn (the LAYER 2 menu)

| id | claim | test |
|---|---|---|
| C6 | cross-substrate slot-histogram similarity predicts useful twin overlap (Vectorize) | plant known-overlapping substrate pairs; measure retrieval precision |
| C7 | DO-serial ticks preserve the F0 determinism law at the edge (40/40 replays byte-identical through the DO path) | the E-Q1 F0 protocol re-run through the Worker API |
| C8 | the A2UI mirror over KV/SSE stays pixel-faithful to traceView under fan-out | hash the rendered canvas vs the view hash, N concurrent viewers |

All three are OPEN until priced. House law travels: a claim that dies, dies
cheap and honest, with the receipt kept beside the body.
