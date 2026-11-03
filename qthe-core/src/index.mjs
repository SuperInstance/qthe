// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────────
// @qthe/core root: the strict surface, assembled. codec + engine + errors,
// and NOTHING else — compat is opt-in by path (@qthe/core/compat), never a
// default import (the .d.ts root law). A dedicated index (not "engine
// re-exports everything") keeps the boundary load-bearing: a stray export
// here is a public API promise, and this file is where that promise is
// either made or refused.
//
// ── RECEIPTS ──────────────────────────────────────────────────────────────────
//   api-surface-v0.1.d.ts "@qthe/core" — `export * from codec, engine,
//     errors` is the entire contract of this module.
//
// ── INTERCONNECTS ─────────────────────────────────────────────────────────────
//   src/codec.mjs — the checked LAYER-0 algebra
//   src/engine.mjs — Substrate, ops, replay, hash (re-exports canonicalJson)
//   src/errors.mjs — the taxonomy every module throws
//   src/compat.mjs — deliberately NOT here; opt-in by path only
//   package.json exports map — "." resolves to this file; the subpaths
//     resolve to the same modules individually

export * from './errors.mjs';
export * from './codec.mjs';
export * from './engine.mjs';
