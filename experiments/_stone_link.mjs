// experiments/_stone_link.mjs — READ-ONLY link to THE STONE for lane 33-b
// (field-smith). qthe consumes the fleet's canonical receipt-chain module,
// quilt-stone/stone.mjs (Task 26-b canonical); it NEVER forks it.
//
// Resolution: dynamic-import fallback chain, first candidate that loads wins;
// the resolved path is returned so run.config rows can receipt it.
//   1. ../../../quilt-stone/stone.mjs   (per fleet push protocol note)
//   2. ../../quilt-stone/stone.mjs      (download/-relative — the real layout)
//   3. quilt-stone/stone.mjs            (bare specifier, if ever installed)
//   4. absolute /home/z/my-project/download/quilt-stone/stone.mjs (last resort)
import { pathToFileURL } from 'node:url';

const CANDIDATES = [
  '../../../quilt-stone/stone.mjs',
  '../../quilt-stone/stone.mjs',
  'quilt-stone/stone.mjs',
  '/home/z/my-project/download/quilt-stone/stone.mjs',
];

export async function linkStone() {
  const errs = [];
  for (const c of CANDIDATES) {
    try {
      const mod = await import(c.startsWith('/') ? pathToFileURL(c).href : c);
      if (typeof mod.sealChain !== 'function' || typeof mod.verifyChainFile !== 'function') {
        throw new Error('module loaded but stone API missing (sealChain/verifyChainFile)');
      }
      return { stone: mod, stonePath: c };
    } catch (e) {
      errs.push(`${c}: ${e.message}`);
    }
  }
  throw new Error(`_stone_link: THE STONE could not be resolved READ-ONLY:\n${errs.join('\n')}`);
}
