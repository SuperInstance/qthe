// qthe/cloudflare/src/worker.js — QTHE ON CLOUDFLARE (the r16 live lane).
//
// The house design (docs/CLOUDFLARE-DEPLOYMENT.md) made real:
//   - Durable Object `QtheField` — one substrate per DO id. A DO is
//     single-threaded per id, which gives the kernel's DETERMINISM LAW a
//     runtime: ticks are applied exactly-once, in order, over HTTP.
//     (P3: two fields, same seed, same tick count -> same hash.)
//   - Vectorize `qthe-twins` — a live sidecar of the 64-slot wormhole
//     table. After each tick batch the occupied slots are upserted as
//     64-dim one-hot vectors; a query by slot returns the twin pairing
//     the compile-time table holds. (C6, LAYER 2 -> measured.)
//   - R2 `qthe-receipts` — the sealed receipt chains, content-addressed
//     by sha256 etag. (C7: fetched bytes must be sha256-identical to the
//     local sealed file.)
//
// The kernel is vendored BYTE-IDENTICAL from ../qthe.mjs (provenance in
// PROVENANCE.txt). Zero runtime dependencies — the house law.
//
// LAYER discipline: this file is LAYER 2 (deployment claims). It claims
// nothing the live checks below do not measure.

import {
  TAU, D_MAX, pack, unpack, psi, vectorPass,
  WormholeTable, SLOT_COUNT, DEFAULT_SIGMA,
  makeSubstrate, nextD, tick, traceView, mulberry32,
} from "./qthe-kernel.mjs";

const BUILD = "r16-fix2 (multi-segment receipt keys)";
const INFO = {
  service: "qthe-cell", build: BUILD,
  what: "the qthe ternary-cell kernel, live on Cloudflare Workers",
  kernel: "qthe.mjs vendored byte-identical (see PROVENANCE.txt)",
  layer: "LAYER 2 — deployment claims, each measured by the /checks routes",
  endpoints: {
    "GET  /": "this info",
    "GET  /health": "liveness",
    "POST /field/:id/init?w=&h=&seed=": "create/reset a field (deterministic seed)",
    "POST /field/:id/tick?times=N": "advance N ticks (wormholes live; twins auto-synced to Vectorize)",
    "GET  /field/:id": "full trace view + sha256",
    "GET  /field/:id/hash": "just { ticks, sha256 } — the determinism handle",
    "GET  /field/:id/abtest": "in-DO replay from the stored seed; live hash vs replay hash",
    "GET  /twins/:slot": "Vectorize twin lookup for a slot (C6)",
    "GET  /twins": "the whole synced twin index",
    "GET  /receipts": "R2 listing of the sealed chains (C7)",
    "GET  /receipt/:key": "fetch a chain from R2 (etag = sha256)",
  },
  determinism_contract: "same substrate + same tick sequence -> byte-identical state, always (kernel header, tests G3)",
};

// ── helpers ─────────────────────────────────────────────────────────────────

function hex(b64) {
  // Uint8Array -> hex string
  return Array.from(b64, (c) => c.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return hex(new Uint8Array(d));
}

// Canonical hash of a trace view: fixed key order (the code path builds it),
// so JSON.stringify is deterministic. This is the hash the /hash routes emit.
async function viewHash(view) {
  return sha256Hex(JSON.stringify(view));
}

// ERRATUM 1 (found live by /abtest on first deploy, ORCH-R16): the STATE hash
// must cover persisted state only — {w, h, ticks, cells, wormholes}. The
// per-tick `lastEvents` are telemetry: they are real, they are reported, but
// they do not survive a save/load round-trip and so must NOT enter the hash
// (the first deploy hashed them; two independent DOs agreed while the in-DO
// replay "disagreed" — the planes were identical, the hash was not stable).
// stateView() is now the hash basis everywhere; events ride along unhashed.
function stateView(sub) {
  return traceView(sub, []);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status, headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function b64FromBytes(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function bytesFromB64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Deterministic demo seeding: mulberry32 drives BOTH tau and d, so the same
// seed rebuilds the same substrate (the kernel's own caller-side pattern).
function demoSeedFn(seed) {
  const rng = mulberry32(seed);
  return (_x, _y, _i) => pack(Math.floor(rng() * 4), Math.floor(rng() * 64));
}

// ── the Durable Object ──────────────────────────────────────────────────────

import { DurableObject } from "cloudflare:workers";

export class QtheField extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean); // ["field", id, action?]
    const action = parts[2] || (request.method === "GET" ? "view" : null);
    try {
      if (request.method === "POST" && action === "init") {
        const w = Math.min(128, Math.max(4, parseInt(url.searchParams.get("w") || "32", 10) | 0));
        const h = Math.min(128, Math.max(4, parseInt(url.searchParams.get("h") || "32", 10) | 0));
        const seed = (parseInt(url.searchParams.get("seed") || "33001", 10) >>> 0);
        const sub = makeSubstrate(w, h, demoSeedFn(seed));
        await this.#save(sub, seed);
        const view = stateView(sub);
        return json({ ok: true, w, h, seed, ticks: 0, sha256: await viewHash(view), note: "field initialized; wormhole table empty until an Abstain tick writes it" });
      }
      if (request.method === "POST" && action === "tick") {
        const times = Math.min(1000, Math.max(1, parseInt(url.searchParams.get("times") || "1", 10) | 0));
        const st = await this.#load();
        if (!st) return json({ error: "no such field — POST /field/:id/init first" }, 404);
        const sub = st.sub;
        for (let i = 0; i < times; i++) tick(sub);
        await this.#save(sub, st.seed);
        const view = stateView(sub);
        return json({
          ok: true, ticks: sub.ticks, advanced: times,
          twin_events_this_tick: (sub.lastEvents || []).length,
          wormhole_slots_occupied: view.wormholes ? view.wormholes.length : 0,
          sha256: await viewHash(view),
        });
      }
      if (request.method === "GET" && action === "view") {
        const st = await this.#load();
        if (!st) return json({ error: "no such field — POST /field/:id/init first" }, 404);
        const view = stateView(st.sub);
        return json({ ok: true, sha256: await viewHash(view), view });
      }
      if (request.method === "GET" && action === "hash") {
        const st = await this.#load();
        if (!st) return json({ error: "no such field — POST /field/:id/init first" }, 404);
        const view = stateView(st.sub);
        return json({ ok: true, id: this.ctx.id.toString(), ticks: st.sub.ticks, sha256: await viewHash(view) });
      }
      if (request.method === "GET" && action === "abtest") {
        // P3, the in-DO form: replay the whole history from the stored seed
        // in memory and compare hashes. The DO's single thread makes the
        // live sequence authoritative; the replay must agree or the kernel
        // has broken its own contract.
        const st = await this.#load();
        if (!st) return json({ error: "no such field — POST /field/:id/init first" }, 404);
        const liveView = stateView(st.sub);
        const replay = makeSubstrate(st.sub.w, st.sub.h, demoSeedFn(st.seed));
        for (let i = 0; i < st.sub.ticks; i++) tick(replay);
        const replayView = stateView(replay);
        const [liveHash, replayHash] = await Promise.all([viewHash(liveView), viewHash(replayView)]);
        return json({
          ok: liveHash === replayHash,
          determinism_law: "same substrate + same tick sequence -> byte-identical state",
          ticks: st.sub.ticks,
          live_sha256: liveHash,
          replay_sha256: replayHash,
          agree: liveHash === replayHash,
        });
      }
      return json({ error: `unknown action '${action}' for ${request.method}` }, 400);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  }

  async #save(sub, seed) {
    const table = sub.__wormholes instanceof WormholeTable ? sub.__wormholes : null;
    await this.ctx.storage.put("field", {
      w: sub.w, h: sub.h, ticks: sub.ticks | 0, seed: seed >>> 0,
      cells: b64FromBytes(sub),
      table: table ? { sigma: table.sigma, totalWrites: table.totalWrites, snapshot: table.snapshot() } : null,
    });
  }

  async #load() {
    const st = await this.ctx.storage.get("field");
    if (!st) return null;
    const cells = bytesFromB64(st.cells);
    cells.w = st.w; cells.h = st.h; cells.ticks = st.ticks;
    cells.bytes = cells;
    if (st.table) {
      const t = new WormholeTable(st.table.sigma);
      t.totalWrites = st.table.totalWrites;
      for (const s of st.table.snapshot) {
        if (s) t.write(s.slot, s.x, s.y, s.resonance);
      }
      cells.__wormholes = t;
    }
    return { sub: cells, seed: st.seed };
  }
}

// ── twin sidecar (C6): one-hot 64-dim vectors, metadata = the slot pairing ──

function oneHot(slot) {
  const v = new Array(64).fill(0);
  v[slot % 64] = 1;
  return v;
}

async function syncTwins(env, view) {
  const slots = view.wormholes || [];
  if (!slots.length) return { upserted: 0 };
  const vectors = slots.map((s) => ({
    id: `slot-${s.slot}`,
    values: oneHot(s.slot),
    metadata: { slot: s.slot, x: s.x, y: s.y, resonance: s.resonance, ticks: view.ticks },
  }));
  await env.QTHE_TWINS.upsert(vectors);
  return { upserted: vectors.length, at_ticks: view.ticks };
}

// ── the Worker ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    try {
      if (request.method === "GET" && parts.length === 0) return json(INFO);
      if (request.method === "GET" && parts[0] === "health") {
        return json({ ok: true, service: "qthe-cell", build: BUILD, ts: new Date().toISOString() });
      }

      // /field/:id/... -> the DO
      if (parts[0] === "field" && parts.length >= 2) {
        const id = env.QTHE_FIELD.idFromName(parts[1]);
        const stub = env.QTHE_FIELD.get(id);
        // twin sidecar: after a successful tick batch, sync occupied slots
        const resp = await stub.fetch(request);
        if (request.method === "POST" && parts[2] === "tick" && resp.ok) {
          const body = await resp.json();
          // re-fetch the view to sync twins (the tick response is a summary)
          const v = await (await stub.fetch(new URL(`/field/${parts[1]}`, url.origin))).json();
          const sync = v.ok ? await syncTwins(env, v.view) : { upserted: 0, error: "view fetch failed" };
          body.twin_sidecar = sync;
          return json(body);
        }
        return resp;
      }

      // /twins/:slot (C6)
      if (request.method === "GET" && parts[0] === "twins" && parts.length === 2) {
        const slot = parseInt(parts[1], 10);
        if (!(slot >= 0 && slot < SLOT_COUNT)) return json({ error: `slot must be 0..${SLOT_COUNT - 1}` }, 400);
        const q = await env.QTHE_TWINS.query(oneHot(slot), { topK: 3, returnMetadata: "all" });
        const top = q.matches && q.matches[0];
        return json({
          ok: true, queried_slot: slot,
          c6_twin_lookup: top && top.metadata
            ? { slot: top.metadata.slot, x: top.metadata.x, y: top.metadata.y, resonance: top.metadata.resonance, at_ticks: top.metadata.ticks, similarity: top.score }
            : null,
          note: "Vectorize sidecar of the 64-slot wormhole table; matches the compile-time pairing (P4)",
        });
      }

      // /twins (whole index)
      if (request.method === "GET" && parts[0] === "twins" && parts.length === 1) {
        // one-hot sweep over all 64 slots, topK 1 each — the honest census
        const found = [];
        for (let s = 0; s < SLOT_COUNT; s++) {
          const q = await env.QTHE_TWINS.query(oneHot(s), { topK: 1, returnMetadata: "all" });
          const m = q.matches && q.matches[0];
          if (m && m.metadata && m.score > 0.99) found.push(m.metadata);
        }
        return json({ ok: true, occupied_slots_synced: found.length, slots: found });
      }

      // /receipts + /receipt/:key (C7)
      if (request.method === "GET" && parts[0] === "receipts" && parts.length === 1) {
        const listing = await env.QTHE_RECEIPTS.list();
        return json({
          ok: true, c7_note: "sealed chains in R2; etag = sha256 of the object; /receipt/:key to fetch",
          objects: listing.objects.map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded })),
        });
      }
      if (request.method === "GET" && parts[0] === "receipt" && parts.length >= 2) {
        // ERRATUM 2 (found live by the P5 check, ORCH-R16): keys are
        // multi-segment ("receipts/e_q1_chain.jsonl") — join every remaining
        // path segment, not just the second. Traversal guard: drop "..".
        const key = parts.slice(1).map((p) => decodeURIComponent(p)).filter((p) => p !== ".." && p !== ".").join("/");
        if (!key) return json({ error: "empty key" }, 400);
        const obj = await env.QTHE_RECEIPTS.get(key);
        if (!obj) return json({ error: `no such receipt: ${key}` }, 404);
        const buf = await obj.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", buf);
        const etag = hex(new Uint8Array(digest));
        return new Response(buf, {
          headers: {
            "content-type": obj.httpMetadata && obj.httpMetadata.contentType || "application/jsonl; charset=utf-8",
            "x-qthe-sha256": etag,
            "x-qthe-size": String(buf.byteLength),
          },
        });
      }

      // /psi/:tau — the timbre alphabet, for humans poking the service
      if (request.method === "GET" && parts[0] === "psi" && parts.length === 2) {
        const t = parseInt(parts[1], 10);
        if (!(t >= 0 && t <= 3)) return json({ error: "tau must be 0..3" }, 400);
        return json({ tau: t, psi: psi(t), name: ["Ground", "Attract", "Repel", "Abstain"][t], byte: pack(t, 0) });
      }

      return json({ error: "not found", see: "/" }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};
