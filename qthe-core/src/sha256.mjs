// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────────
// Pure-JS SHA-256 (FIPS 180-4), synchronous, zero dependencies. The engine's
// hash() is a SYNC API by contract (api-surface-v0.1.d.ts), and the library
// must run where node:crypto does not exist (Cloudflare Workers, browsers —
// the deployed lanes) — subtle.digest is Promise-only there, so it cannot
// back a synchronous hash(). ~40 lines of arithmetic is the price of one
// deterministic seal everywhere; correctness is pinned by NIST vectors +
// node:crypto agreement in tests/core/run_core_tests.mjs (gate C-SHA).
//
// ── RECEIPTS ──────────────────────────────────────────────────────────────────
//   OLOG-SPEC §7 — HASH_ALGORITHM "sha256"; the digest primitive of stateHash.
//   demo/sha256.mjs — the published NIST vectors this implementation is
//     pinned against (the same three the kernel gate G0 uses).
//
// ── INTERCONNECTS ─────────────────────────────────────────────────────────────
//   src/engine.mjs — sha256Hex feeds opsHash and the stateHash seal
//   tests/core/run_core_tests.mjs C-SHA — NIST vectors + node:crypto
//     differential on pseudo-random buffers (both directions)
//   tests/run_tests.mjs G0 — the kernel-lane sha256 gate this one mirrors;
//     agreement between the two lanes is what makes cross-lane seals legible

// @ts-check

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

/**
 * SHA-256 over bytes or a UTF-8 string. Deterministic everywhere JS runs.
 * @param {Uint8Array|string} input
 * @returns {Uint8Array} 32 raw digest bytes
 */
export function sha256Bytes(input) {
  const msg = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const len = msg.length;
  // Pad: 0x80, zeros to ≡56 (mod 64), then the 64-bit big-endian bit length.
  const paddedLen = (Math.ceil((len + 9) / 64)) * 64;
  const buf = new Uint8Array(paddedLen);
  buf.set(msg);
  buf[len] = 0x80;
  const bitLen = len * 8; // exact while len < 2^53 — a 1-exabyte input is not our problem
  const dv = new DataView(buf.buffer);
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 4294967296));
  dv.setUint32(paddedLen - 4, bitLen % 4294967296);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let off = 0; off < paddedLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15], y = w[i - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, hh = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e;
      e = (d + t1) >>> 0;
      d = c; c = b; b = a;
      a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + hh) >>> 0;
  }

  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, h0); odv.setUint32(4, h1); odv.setUint32(8, h2); odv.setUint32(12, h3);
  odv.setUint32(16, h4); odv.setUint32(20, h5); odv.setUint32(24, h6); odv.setUint32(28, h7);
  return out;
}

/**
 * SHA-256 as lowercase hex — the form every digest in the op-log spec uses.
 * @param {Uint8Array|string} input
 * @returns {string} 64 hex chars
 */
export function sha256Hex(input) {
  const bytes = sha256Bytes(input);
  let s = '';
  for (let i = 0; i < 32; i++) s += HEX[bytes[i]];
  return s;
}
