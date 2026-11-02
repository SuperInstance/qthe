#!/usr/bin/env node
// guild_corpus_gen.mjs — generates the Guild conformance corpus (g2-corpus-v1)
// from the REFERENCE kernel (qthe.mjs).
//
// WHY THIS EXISTS (thinking-marker, 2026-11-02): kernel-forge's G1-1 spec-only
// re-derivation diverged from the reference on 2 of 17 ambiguity decisions
// (A1 live-vs-snapshot wormhole reads; A10/A17 twin-term feedback into
// pressure) plus 1 subtle one (A4: rational-truncation sigma vs float
// sign-survival). This corpus pins those rulings EMPIRICALLY: any
// implementation that replays it byte-identically implements the reference's
// semantics, whatever the spec prose left open. The corpus is the oracle.
//
// INTERCONNECTS:
//   - seats/kernel-forge/work/G2-6/corpus_replay.c  (C harness replays it)
//   - spec/SPEC-v1.0-DRAFT.md  (normative sentences cite case IDs as receipts)
//   - tests/guild/ in the production repo branch (reproducibility: anyone can
//     regenerate from any kernel checkout: node guild_corpus_gen.mjs <kernel> <outdir>)
//
// DETERMINISM LAW: every case runs TWICE; byte-identical or the generator
// refuses to emit (the JS kernel's own law, applied to its oracle).

import { writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const KERNEL = process.argv[2] ?? '/home/z/my-project/qthe-repo/qthe.mjs'
const OUT = process.argv[3] ?? '/home/z/my-project/download/qthe-guild/corpus'
const q = await import(pathToFileURL(KERNEL).href)

let commit = 'unknown'
try { commit = execSync(`git -C ${KERNEL.replace('/qthe.mjs', '')} rev-parse HEAD`).toString().trim() } catch {}

const hex = a => Buffer.from(a).toString('hex')
const cases = []

// ── LAYER 0 cases ──────────────────────────────────────────────────────────
{
  let ok = 0
  for (let c = 0; c < 256; c++) { const { tau, d } = q.unpack(c); if (q.pack(tau, d) === c) ok++ }
  cases.push({ id: 'l0-codec-all256', kind: 'l0-codec', roundtrip_ok: ok, note: 'pins the byte layout bijection (SPEC L0 item 1)' })
}
const vp = (id, rows, xs, note) => cases.push({ id, kind: 'l0-vectorpass', rows, xs, out: q.vectorPass(rows, xs), note })
vp('l0-vectorpass-1',
  [[q.pack(1, 10), q.pack(2, 20), q.pack(3, 30), q.pack(0, 40)],
   [q.pack(3, 7), q.pack(3, 11), q.pack(1, 5), q.pack(2, 3)],
   [q.pack(2, 63), q.pack(0, 0), q.pack(1, 1), q.pack(3, 63)]],
  [3, -2, 5, 0], 'all four timbres, signed xs (SPEC L0 item 3: Ground contributes nothing)')
vp('l0-vectorpass-2', [[q.pack(3, 1), q.pack(3, 2), q.pack(3, 3)]], [-4, -5, -6], 'all-Abstain row: pure imaginary channel, negative result')
vp('l0-vectorpass-3',
  [[...Array(8)].map((_, k) => q.pack(k % 4, (k * 7 + 3) & 63))],
  [...Array(8)].map((_, k) => (k - 4) * 250), 'wide row, larger magnitudes, all timbres mixed')

// ── substrate helpers ──────────────────────────────────────────────────────
const runSub = (id, w, h, cells0, ticks, sigma, wormholes, note) => {
  // sigma: null = kernel default (Math.log2(3)); else an exact-decimal number.
  // wormholes: true (default) or false (paired-arm OFF).
  const opts = {}
  if (sigma !== null) opts.sigma = sigma
  if (wormholes === false) opts.wormholes = false
  const run = () => {
    const sub = q.makeSubstrate(w, h, (x, y) => cells0[y * w + x])
    const evtCounts = []
    for (let t = 0; t < ticks; t++) { q.tick(sub, opts); evtCounts.push(sub.lastEvents.length) }
    return { cellsN: Array.from(sub), evtCounts }
  }
  const r1 = run(); const r2 = run()
  const selfDet = r1.cellsN.every((b, i) => b === r2.cellsN[i]) && r1.evtCounts.every((c, i) => c === r2.evtCounts[i])
  if (!selfDet) throw new Error('JS self-determinism FAILED for ' + id)
  cases.push({
    id, kind: 'substrate', w, h, ticks,
    sigma: sigma === null ? q.DEFAULT_SIGMA : sigma, sigma_is_default: sigma === null,
    wormholes: wormholes !== false,
    cells0: hex(cells0), cellsN: hex(r1.cellsN),
    evtCounts: r1.evtCounts, twinTotal: r1.evtCounts.reduce((a, b) => a + b, 0),
    note,
  })
}
const noisePlane = (w, h, seed) => {
  const rnd = q.mulberry32(seed); const a = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) a[i] = q.pack(Math.floor(rnd() * 4), Math.floor(rnd() * 64))
  return a
}
const stamp = (cells, w, x, y, tau, d) => { cells[y * w + x] = q.pack(tau, d) }

// ── twin-path cases (pin A1 live-reads, A17 twin-into-pressure, A4 sigma) ──
{ // desert twins, sigma=0.5 — THE A4 edge: acc=0 → resonance=1 → term=0.5.
  // Float impl: pressure 0.5 > 0, d climbs. Truncating impl: term→0, d stalls forever.
  const w = 32, h = 32; const c = new Uint8Array(w * h)
  stamp(c, w, 4, 4, 3, 12); stamp(c, w, 20, 25, 3, 12)
  runSub('sub-twins-desert-sigma-half', w, h, c, 40, 0.5, true, 'PINS A4+A1+A17: isolated resonance=1 twins at sigma<1')
}
{ const w = 32, h = 32; const c = new Uint8Array(w * h)
  stamp(c, w, 4, 4, 3, 12); stamp(c, w, 20, 25, 3, 12)
  runSub('sub-twins-desert-default', w, h, c, 40, null, true, 'PINS A1+A17 at default sigma; term=1.5849... enters pressure')
}
{ // 4 planted pairs in mulberry noise (E-Q1 style)
  const w = 32, h = 32; const c = noisePlane(w, h, 42)
  stamp(c, w, 4, 4, 3, 8); stamp(c, w, 20, 25, 3, 8)
  stamp(c, w, 10, 30, 3, 10); stamp(c, w, 28, 8, 3, 10)
  stamp(c, w, 15, 15, 3, 12); stamp(c, w, 1, 26, 3, 12)
  stamp(c, w, 30, 30, 3, 14); stamp(c, w, 2, 2, 3, 14)
  runSub('sub-twins-noise-default', w, h, c, 40, null, true, 'general twin path in a mixed field')
  runSub('sub-twins-noise-off', w, h, c, 40, null, false, 'paired-arm OFF: no events, different final plane')
  runSub('sub-twins-noise-sigma-025', w, h, c, 40, 0.25, true, 'sigma=0.25: completion ~1/sigma; resonance>1 subtleties')
  runSub('sub-twins-noise-sigma-2', w, h, c, 40, 2, true, 'sigma=2')
  runSub('sub-twins-noise-sigma-4', w, h, c, 40, 4, true, 'sigma=4')
}
{ // adjacent same-d writers + distant reader — LWW + live-read row-major order
  const w = 32, h = 32; const c = new Uint8Array(w * h)
  stamp(c, w, 5, 5, 3, 20); stamp(c, w, 6, 5, 3, 20); stamp(c, w, 25, 12, 3, 20)
  runSub('sub-adjacent-lww-32x32', w, h, c, 20, null, true, 'PINS A3/R4 last-writer-wins + A1 live-read scan order')
}

// ── neighborhood-dynamics cases (no wormhole dependence) ──────────────────
runSub('sub-noise-8x8-t1', 8, 8, noisePlane(8, 8, 1), 1, null, true, 'single tick, random plane')
runSub('sub-noise-8x8-t8', 8, 8, noisePlane(8, 8, 1), 8, null, true, 'same seed, 8 ticks (multi-tick accumulation)')
runSub('sub-noise-13x7-t40', 13, 7, noisePlane(13, 7, 2), 40, null, true, 'non-square torus')
runSub('sub-noise-32x32-t40', 32, 32, noisePlane(32, 32, 3), 40, null, true, 'random Abstain present: incidental twins')
runSub('sub-mixed-64x64-t50', 64, 64, noisePlane(64, 64, 5), 50, null, true, 'soak case')
{ const w = 16, h = 16; const c = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) stamp(c, w, x, y, (x + y) % 2 ? 2 : 1, (x + y) % 2 ? 31 : 63)
  runSub('sub-checkers-16x16', w, h, c, 40, null, true, 'pure Moore-8 neighborhood dynamics, no Abstain')
}
{ const w = 16, h = 16; const c = new Uint8Array(w * h) // C5 armor-ring mini
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - 8, dy = y - 8; const r = Math.sqrt(dx * dx + dy * dy)
    if (r <= 2) stamp(c, w, x, y, 1, 63)
    else if (r >= 5 && r <= 6) stamp(c, w, x, y, 2, 55)
  }
  runSub('sub-ring-erode-16x16', w, h, c, 30, null, true, 'C5 mechanism: Repel ring self-erodes monotonically')
}
{ const w = 8, h = 8; const c = new Uint8Array(w * h).fill(q.pack(0, 47))
  runSub('sub-all-ground-8x8', w, h, c, 5, null, true, 'invariant: all-Ground plane is a no-op') }
{ const w = 2, h = 2 // degenerate torus: offsets revisit cells
  const c = new Uint8Array([q.pack(1, 63), q.pack(2, 1), q.pack(2, 31), q.pack(1, 7)])
  runSub('sub-degenerate-2x2', w, h, c, 8, null, true, 'PINS A14: 2x2 torus, neighbors counted per-offset with wrap')
}
{ const w = 4, h = 1 // degenerate: h=1 → self appears among the 8 offsets
  const c = new Uint8Array([q.pack(3, 9), q.pack(1, 40), q.pack(2, 20), q.pack(0, 5)])
  runSub('sub-degenerate-1x4', w, h, c, 8, null, true, 'PINS A14 hard: h=1 self-neighbor double-count + wormhole path')
}
{ const w = 16, h = 16; const rnd = q.mulberry32(7); const c = new Uint8Array(w * h) // flood
  for (let i = 0; i < w * h; i++) c[i] = q.pack(3, Math.floor(rnd() * 64))
  runSub('sub-flood-abstain-16x16', w, h, c, 10, null, true, 'PINS saturation + LWW under 256 same-tick writers (C6 finding)')
}
{ const w = 32, h = 32; const rnd = q.mulberry32(11); const c = new Uint8Array(w * h) // 25% Abstain
  for (let i = 0; i < w * h; i++) {
    const r = rnd(); const tau = r < 0.25 ? 3 : r < 0.5 ? 1 : r < 0.75 ? 2 : 0
    c[i] = q.pack(tau, Math.floor(rnd() * 64))
  }
  runSub('sub-quarter-abstain-32x32', w, h, c, 40, null, true, 'dense-Abstain regime (E-Q14 frontier class)')
}

// ── emit ────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true })
const header = {
  corpus: 'g2-corpus-v1', generated: new Date().toISOString().slice(0, 10),
  kernel_source: `qthe.mjs @ ${commit}`,
  self_determinism: 'PASS (every case run twice, byte-identical)',
  law: 'the corpus is the oracle: replay byte-identical or divergent, no third option',
}
writeFileSync(`${OUT}/g2-corpus-v1.json`, JSON.stringify({ ...header, cases }, null, 1))

let flat = `CORPUS g2-corpus-v1\nKERNEL ${commit}\n`
for (const c of cases) {
  flat += `CASE ${c.id}\nKIND ${c.kind}\n`
  if (c.kind === 'l0-codec') {
    flat += `ROUNDTRIP ${c.roundtrip_ok}\n`
  } else if (c.kind === 'l0-vectorpass') {
    const r = c.rows.length, k = c.rows[0].length
    flat += `ROWS ${r} ${k} ${hex(c.rows.flat())}\nXS ${k} ${c.xs.join(' ')}\n`
    flat += `EXPECTED ${r} ${c.out.flatMap(o => [o.re, o.im]).join(' ')}\n`
  } else {
    const sig = c.sigma_is_default ? `${c.sigma} DEFAULT` : `${c.sigma}`
    flat += `DIMS ${c.w} ${c.h}\nTICKS ${c.ticks}\nSIGMA ${sig}\nWORMHOLES ${c.wormholes ? 1 : 0}\n`
    flat += `CELLS0 ${c.cells0}\nCELLSN ${c.cellsN}\nEVTCNT ${c.evtCounts.join(' ')}\n`
  }
  flat += `END\n`
}
writeFileSync(`${OUT}/g2-corpus-v1.flat`, flat)

// summary receipt
const subs = cases.filter(c => c.kind === 'substrate')
const twinCases = subs.filter(c => c.twinTotal > 0)
console.log(`corpus g2-corpus-v1: ${cases.length} cases (${cases.length - subs.length} L0 + ${subs.length} substrate)`)
console.log(`kernel: qthe.mjs @ ${commit.slice(0, 10)}`)
console.log(`twin-active cases: ${twinCases.length}/${subs.length} -> ${twinCases.map(c => c.id + '(' + c.twinTotal + 'ev)').join(', ')}`)
console.log(`self-determinism: PASS (all cases double-run byte-identical)`)
