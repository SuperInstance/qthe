// scripts/build_qthe_core.mjs — ORCH-8: assemble the standalone qthe-core
// package from the repo's canonical sources. COPIES ARE BYTE-EXACT (sha256
// pinned in qthe-core/PROVENANCE.txt); nothing is transpiled or adapted.
// Re-run any time the canonical sources change; the PROVENANCE shas are the
// audit trail. Zero-dependency contract: the core imports nothing outside
// the language stdlib, and the README says exactly what each file is.
import { mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const CORE = join(ROOT, 'qthe-core');
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const FILES = [
  ['qthe.mjs', 'kernel/qthe.mjs', 'the reference kernel (float plane, LAYER 0+1)'],
  ['fixedpoint/qthe_fixed.mjs', 'kernel/qthe_fixed.mjs', 'the no-floats plane (R8, sigma_q int64)'],
  ['crossimpl/c/qthe_core.h', 'c/qthe_core.h', 'C99 port header (byte-exact, both planes)'],
  ['crossimpl/c/qthe_core.c', 'c/qthe_core.c', 'C99 port implementation'],
  ['crossimpl/py/qthe_layer0.py', 'py/qthe_layer0.py', 'python LAYER 0 re-derivation (strict)'],
  // ORCH-R11 (hy4p's missed attack, adopted): a FRESH extraction must carry
  // the grant — LICENSE is copied from the repo root, and the build REFUSES
  // if the two copies ever disagree.
  ['LICENSE', 'LICENSE', 'the MIT grant (copied from the repo root; the package carries its own)'],
];

mkdirSync(join(CORE, 'kernel'), { recursive: true });
mkdirSync(join(CORE, 'c'), { recursive: true });
mkdirSync(join(CORE, 'py'), { recursive: true });

const provenance = ['# qthe-core PROVENANCE', '', 'Every file is a BYTE-EXACT copy of the canonical source in SuperInstance/qthe.', 'Rebuild: `node scripts/build_qthe_core.mjs` from the repo root.', ''];
for (const [src, dst, what] of FILES) {
  copyFileSync(join(ROOT, src), join(CORE, dst));
  provenance.push(`- \`${dst}\` = \`${src}\` (${what}) :: sha256 \`${sha(join(CORE, dst))}\``);
}
writeFileSync(join(CORE, 'PROVENANCE.txt'), provenance.join('\n') + '\n');

writeFileSync(join(CORE, 'package.json'), JSON.stringify({
  name: 'qthe-core',
  version: '0.1.0',
  description: 'The qthe 8-bit substrate primitive: 2-bit timbre + 6-bit amplitude, 64-slot wormhole table, deterministic Moore-8 tick. Byte-exact JS (float + fixed planes), C99, and Python(L0).',
  type: 'module',
  main: 'kernel/qthe.mjs',
  exports: {
    '.': './kernel/qthe.mjs',
    './fixed': './kernel/qthe_fixed.mjs',
  },
  files: ['kernel/', 'c/', 'py/', 'README.md', 'PROVENANCE.txt', 'LICENSE', 'LICENSE-NOTE.md'],
  keywords: ['cellular-automata', 'substrate', 'deterministic', 'ternary', 'wormhole-table', 'quilt'],
  license: 'MIT',
}, null, 2) + '\n');

console.log('qthe-core assembled:');
for (const [, dst] of FILES) console.log(`  ${dst} :: ${sha(join(CORE, dst)).slice(0, 16)}…`);
console.log('PROVENANCE.txt + package.json written');
