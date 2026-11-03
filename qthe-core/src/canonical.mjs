// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────────
// Canonical JSON per OLOG-SPEC §7.1 (RFC 8785 / JCS subset). The hash recipe
// seals state and provenance through THIS serialization, so two
// implementations that disagree by one byte of whitespace disagree about
// every trace ever recorded. A dedicated file because the rules are negative
// as much as positive — what must THROW (undefined, functions, symbols,
// non-finite numbers, non-plain objects) is the determinism guarantee, and
// it deserves its own receipted surface.
//
// ── RECEIPTS ──────────────────────────────────────────────────────────────────
//   OLOG-SPEC §7.1 — normative: keys sorted by UTF-16 code unit; no
//     insignificant whitespace; arrays keep order; strings per JSON
//     escaping; numbers per ECMAScript Number::toString (σ = log2(3)
//     serializes as 1.584962500721156 in every conforming engine); floats
//     permitted only where the spec names them (σ).
//   api-surface-v0.1.d.ts "@qthe/core/engine" canonicalJson — the contract.
//   ONBOARDING F1–F3 — the cross-language seam (other languages must follow
//     RFC 8785 §3.2.2.3); this file is the JS reference behavior.
//
// ── INTERCONNECTS ─────────────────────────────────────────────────────────────
//   src/engine.mjs — canonicalJson(ops) → opsHash; canonicalJson(D) → the
//     stateHash seal; exported to callers via engine re-export
//   src/sha256.mjs — sha256Hex consumes this module's output
//   tests/core/run_core_tests.mjs C-JCS — key order, float form, and the
//     throw-on-unclean cases (undefined/NaN/function/Uint8Array)
//   OLOG-SPEC §7.3 Appendix A — the exact canonical string of the canary
//     digest input; this module must reproduce it byte-for-byte

/**
 * Canonical JSON per OLOG-SPEC §7.1 (RFC 8785 / JCS subset): recursively
 * key-sorted (UTF-16 code units), no insignificant whitespace, numbers via
 * ECMAScript Number::toString, and NOTHING else — no undefined, functions,
 * symbols, or non-finite numbers (throws). Integers are exact within ±2^53.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalJson(value) {
  return serialize(value);
}

/** @param {unknown} v @returns {string} */
function serialize(v) {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'boolean':
      return v ? 'true' : 'false';
    case 'number': {
      if (!Number.isFinite(v)) {
        throw new TypeError(`canonicalJson: non-finite number (${v}) — determinism artifacts only`);
      }
      // ECMAScript Number::toString — RFC 8785 §3.2.2.3; String(-0) === "0"
      // matches the JCS -0 rule. Identical to JSON.stringify for all finite
      // numbers, but written explicitly because THIS line is the spec.
      return String(v);
    }
    case 'string':
      return JSON.stringify(v); // minimal ECMAScript escaping — JCS-conformant
    case 'object': {
      if (Array.isArray(v)) {
        return '[' + v.map(serialize).join(',') + ']';
      }
      const proto = Object.getPrototypeOf(v);
      if (proto === Object.prototype || proto === null) {
        // Default Array#sort compares UTF-16 code units — exactly the JCS
        // ordering rule. No locale collation, ever.
        const keys = Object.keys(v).sort();
        return '{' + keys.map((k) => JSON.stringify(k) + ':' + serialize(v[k])).join(',') + '}';
      }
      // [2026-11-03][library-craft] decision: typed arrays / Map / Set /
      // class instances throw (INV-1: traces are plain data; snapshots may
      // carry Uint8Array but snapshots are NOT canonical-JSON'd — their
      // cellsHex view is). Silent structuralClone-vs-JSON divergence here
      // would fork the digest; revisit only if a future op field needs a
      // container type, which would be an OLOG major bump by §2.
      throw new TypeError(
        `canonicalJson: unsupported object ${Object.prototype.toString.call(v)} — plain data only (OLOG-SPEC INV-1)`,
      );
    }
    default:
      // undefined, function, symbol, bigint
      throw new TypeError(`canonicalJson: ${typeof v} is not serializable (OLOG-SPEC INV-1)`);
  }
}
