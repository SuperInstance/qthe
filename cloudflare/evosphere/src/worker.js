// cloudflare/evosphere/src/worker.js — ORCH-R26/T17-a (E-Q28): the
// EVOSPHERE — selection-as-infrastructure. A Durable Object that hosts the
// deterministic selection gate for latent-space evolution.
//
// LAWS BAKED IN (the pre_registration_e_q28.json contract):
//  - the DO NEVER calls a model. Providers measure; CODE decides (the
//    jev-lattice law, applied to evolution).
//  - every attempt — accepted or fossil — is appended to an append-only log
//    (proofs append; verdicts compute). Nothing is ever removed.
//  - the gate is a COORDINATED predicate: a mutant passes only if BOTH
//    JEV models' cosine to the frozen target-family centroid strictly
//    improve over the parent's (k=2 independent proofs across model
//    versions).
//  - the protocol (max generations, attempts per generation, the
//    stagnation escape rule) lives HERE as code, not in the driver.
//  - fail-closed auth: every request requires Bearer <EVOSPHERE_TOKEN>.
//  - transparency: GET / receipts exactly what this is.
//
// The frozen family centroids are installed at /init from the SEALED eq22N
// arm of the qthe-jev-embed index (the r24 E-Q22 chain) and never change.

export class Evosphere {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const auth = request.headers.get("Authorization") || "";
    if (auth !== `Bearer ${this.env.EVOSPHERE_TOKEN}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        what: "the evosphere — deterministic selection for latent-space evolution (E-Q28, ORCH-R26/T17-a)",
        claim: "C24 — code-side selection over typed-map embeddings steers generation",
        laws: [
          "this object never calls a model; verdicts are computed by code from measured vectors",
          "attempts append; nothing is removed",
          "coordinated gate: jev-latest AND jev-preview must both improve cosine to the target centroid",
        ],
        endpoints: ["GET /state", "GET /directive", "POST /init", "POST /attempt", "GET /attempts"],
      });
    }
    if (request.method === "POST" && url.pathname === "/init") return this.init(request);
    if (request.method === "GET" && url.pathname === "/state") return this.getState();
    if (request.method === "GET" && url.pathname === "/attempts") {
      return Response.json(await this.state.storage.get("attempts") || []);
    }
    if (request.method === "GET" && url.pathname === "/directive") return this.directive();
    if (request.method === "POST" && url.pathname === "/attempt") return this.attempt(request);
    return Response.json({ error: "not found" }, { status: 404 });
  }

  async init(request) {
    const existing = await this.state.storage.get("initialized");
    if (existing) return Response.json({ error: "already initialized (append-only world)" }, { status: 409 });
    const body = await request.json();
    const required = ["centroids", "config", "seed"];
    for (const k of required) if (!body[k]) return Response.json({ error: `missing ${k}` }, { status: 400 });
    const centroids = body.centroids; // {N: [8], P: [8], Q: [8], A: [8]}
    for (const f of ["N", "P", "Q", "A"]) {
      if (!Array.isArray(centroids[f]) || centroids[f].length !== 8) {
        return Response.json({ error: `centroid ${f} must be 8-dim` }, { status: 400 });
      }
    }
    await this.state.storage.put({
      initialized: true,
      centroids,
      config: body.config, // {max_gens, max_attempts, target_order, escape_after}
      seed: body.seed,     // {station, station_family, v_latest, v_preview}
      parent: {
        note: null, note_sha: null,
        v_latest: body.seed.v_latest, v_preview: body.seed.v_preview,
        station: body.seed.station, station_family: body.seed.station_family,
        gen: 0,
      },
      stations: [{ id: body.seed.station, family: body.seed.station_family, gen: 0 }],
      lineage: [],
      attempts: [],
      stagnation: 0,
      gen: 1,
      attempts_this_gen: 0,
      done: null,
    });
    return Response.json({ ok: true, state_version: 1 });
  }

  async world() {
    const keys = ["initialized", "centroids", "config", "seed", "parent", "stations",
      "lineage", "attempts", "stagnation", "gen", "attempts_this_gen", "done"];
    const vals = await this.state.storage.get(keys);
    const w = {};
    for (const k of keys) w[k] = vals.get(k);
    return w;
  }

  cos(a, b) {
    let d = 0, na = 0, nb = 0;
    for (let i = 0; i < 8; i++) {
      d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return d / (Math.sqrt(na) * Math.sqrt(nb));
  }

  counts(w) {
    const c = { N: 0, P: 0, Q: 0, A: 0 };
    for (const s of w.stations) c[s.family] += 1;
    return c;
  }

  // the registered target rule: least-visited family; ties in the fixed
  // registered order P,Q,A,N; after `escape_after` consecutive stagnated
  // generations, rotate to the second-least-visited (the pre-registered
  // escape rule).
  pickTarget(w) {
    const c = this.counts(w);
    const order = w.config.target_order; // ["P","Q","A","N"]
    const ranked = order.slice().sort((x, y) => (c[x] - c[y]) || (order.indexOf(x) - order.indexOf(y)));
    if (w.stagnation >= w.config.escape_after && ranked.length > 1) {
      return { target: ranked[1], escaped: true, counts: c };
    }
    return { target: ranked[0], escaped: false, counts: c };
  }

  async directive() {
    const w = await this.world();
    if (!w.initialized) return Response.json({ error: "not initialized" }, { status: 409 });
    const { target, escaped, counts } = this.pickTarget(w);
    const centroid = w.centroids[target];
    const gap = centroid.map((c, i) => c - w.parent.v_latest[i]);
    // top-2 axes by gap (largest positive first; if none positive, the
    // least-negative — receipted in the directive payload)
    const idx = gap.map((g, i) => ({ g, i })).sort((a, b) => b.g - a.g).slice(0, 2).map((x) => x.i);
    const any_positive = gap[idx[0]] > 0;
    return Response.json({
      gen: w.gen, attempts_used: w.attempts_this_gen, stagnation: w.stagnation,
      station: w.parent.station, station_family: w.parent.station_family,
      target_family: target, escaped, counts,
      directive_axes: idx, any_positive_gap: any_positive,
      gap: gap.map((g) => Math.round(g * 1e4) / 1e4),
      memory: w.lineage.map((l) => l.note),
      parent_note: w.parent.note,
      done: w.done,
    });
  }

  async attempt(request) {
    const w = await this.world();
    if (!w.initialized) return Response.json({ error: "not initialized" }, { status: 409 });
    if (w.done) return Response.json({ verdict: "stopped", reason: w.done, state: await this.publicState() });
    const a = await request.json();
    for (const k of ["note", "note_sha", "v_latest", "v_preview", "retrieval"]) {
      if (!a[k]) return Response.json({ error: `missing ${k}` }, { status: 400 });
    }
    if (a.v_latest.length !== 8 || a.v_preview.length !== 8) {
      return Response.json({ error: "vectors must be 8-dim" }, { status: 400 });
    }
    const { target } = this.pickTarget(w);
    const centroid = w.centroids[target];
    const fL = this.cos(a.v_latest, centroid);
    const fP = this.cos(a.v_preview, centroid);
    const pfL = this.cos(w.parent.v_latest, centroid);
    const pfP = this.cos(w.parent.v_preview, centroid);
    const accept = fL > pfL && fP > pfP;

    const row = {
      gen: w.gen, attempt: w.attempts_this_gen + 1, note_sha: a.note_sha,
      target_family: target, verdict: accept ? "accept" : "reject",
      fitness_latest: Math.round(fL * 1e6) / 1e6,
      fitness_preview: Math.round(fP * 1e6) / 1e6,
      parent_fitness_latest: Math.round(pfL * 1e6) / 1e6,
      parent_fitness_preview: Math.round(pfP * 1e6) / 1e6,
      retrieval: a.retrieval, directive_axes: a.directive_axes || null,
    };
    const attempts = w.attempts; attempts.push(row);

    let event = null;
    if (accept) {
      const lineage = w.lineage;
      lineage.push({
        gen: w.gen, note: a.note, note_sha: a.note_sha,
        v_latest: a.v_latest, v_preview: a.v_preview,
        station: a.retrieval.top1, station_family: a.retrieval.family,
        fitness_latest: row.fitness_latest, fitness_preview: row.fitness_preview,
        retrieval: a.retrieval, directive_axes: a.directive_axes || null,
      });
      const stations = w.stations;
      if (!stations.some((s) => s.id === a.retrieval.top1)) {
        stations.push({ id: a.retrieval.top1, family: a.retrieval.family, gen: w.gen });
      }
      w.parent = lineage[lineage.length - 1];
      w.stagnation = 0;
      w.gen += 1;
      w.attempts_this_gen = 0;
      const c = this.counts(w);
      const covered = ["N", "P", "Q", "A"].every((f) => c[f] > 0);
      if (covered) { w.done = `coverage-complete-at-gen-${w.gen - 1}`; event = w.done; }
      else if (w.gen > w.config.max_gens) { w.done = "max-generations"; event = w.done; }
    } else {
      w.attempts_this_gen += 1;
      if (w.attempts_this_gen >= w.config.max_attempts) {
        w.stagnation += 1;
        w.gen += 1;
        w.attempts_this_gen = 0;
        event = w.stagnation >= w.config.escape_after ? "stagnation-escape-armed" : "generation-stagnated";
        if (w.gen > w.config.max_gens) { w.done = "max-generations"; event = w.done; }
      }
    }

    await this.state.storage.put({
      attempts, lineage: w.lineage, stations: w.stations, parent: w.parent,
      stagnation: w.stagnation, gen: w.gen, attempts_this_gen: w.attempts_this_gen, done: w.done,
    });
    return Response.json({
      verdict: accept ? "accept" : "reject", event, fitness: {
        latest: row.fitness_latest, preview: row.fitness_preview,
        parent_latest: row.parent_fitness_latest, parent_preview: row.parent_fitness_preview,
      }, done: w.done,
    });
  }

  async publicState() {
    const w = await this.world();
    return {
      initialized: w.initialized, gen: w.gen, done: w.done, stagnation: w.stagnation,
      stations: w.stations, counts: this.counts(w),
      lineage: w.lineage.map((l) => ({
        gen: l.gen, note: l.note, note_sha: l.note_sha, station: l.station,
        station_family: l.station_family, fitness_latest: l.fitness_latest,
        fitness_preview: l.fitness_preview, directive_axes: l.directive_axes,
        retrieval: l.retrieval,
      })),
      attempts: w.attempts, config: w.config,
    };
  }

  async getState() {
    const w = await this.world();
    if (!w.initialized) return Response.json({ error: "not initialized" }, { status: 409 });
    return Response.json(await this.publicState());
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const auth = request.headers.get("Authorization") || "";
    if (auth !== `Bearer ${env.EVOSPHERE_TOKEN}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    if (url.pathname === "/healthz") return Response.json({ ok: true });
    const id = env.EVOSPHERE.idFromName("r26");
    return env.EVOSPHERE.get(id).fetch(request);
  },
};
