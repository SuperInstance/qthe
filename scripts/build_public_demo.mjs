// scripts/build_public_demo.mjs — ORCH-43: build a SINGLE-FILE public demo
// (public-demo.html): the live mirror + the real kernel + sha256 inlined,
// zero network, zero server, zero build. Open it from anywhere (even
// file://) — it is the whole substrate in one portable page.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const kernel = readFileSync(join(ROOT, 'qthe.mjs'), 'utf8');
const shaMod = readFileSync(join(ROOT, 'demo', 'sha256.mjs'), 'utf8');
const driver = readFileSync(join(ROOT, 'demo', 'a2ui.mjs'), 'utf8');
let html = readFileSync(join(ROOT, 'index.html'), 'utf8');

// strip the module imports; inline the three modules in dependency order
const stripImports = (src) => src.replace(/^import\s+.*?;\s*$/gm, '');
const body = `<script type="module">
/* ── inlined: qthe.mjs (the reference kernel, unmodified) ── */
${stripImports(kernel).replace(/^export /gm, 'const ')}
/* re-export shim for the driver's import shape */
const __exports = { pack, tauOf, dOf, makeSubstrate, tick, traceView, mulberry32, WormholeTable };
/* ── inlined: demo/sha256.mjs ── */
${stripImports(shaMod).replace(/^export /gm, 'const ')}
/* ── inlined: demo/a2ui.mjs (the mirror driver, unmodified) ── */
${stripImports(driver)}
</script>`;
html = html.replace('<script type="module" src="demo/a2ui.mjs"></script>', body)
  .replace('<title>qthe — the Looking Glass, live</title>',
    '<title>qthe — the Looking Glass, live (single-file public demo)</title>');
writeFileSync(join(ROOT, 'public-demo.html'), html);
console.log(`public-demo.html written: ${(html.length / 1024).toFixed(1)} KB, zero external references`,
  html.includes('src="demo/') ? 'WARNING: external ref remains!' : '(fully self-contained)');
