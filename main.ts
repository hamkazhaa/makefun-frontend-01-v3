// main.ts — hands "make.fun lite" in (Node 22, standard library only).
// It copies app/ and screenshots/ from beside this file into the output
// directory and writes /output/dossier.json with the kit's vendored library,
// which the scorer re-runs and compares byte for byte — so the dossier is
// never hand-written here. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name: string): void {
  const from = join(repoRoot, name);
  if (!existsSync(from)) throw new Error(`missing ${name}/ beside main.ts`);
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

// The caps below are the scorer's own (reference/gate.json): only
// text_max_bytes shapes the bytes; the others refuse an entry the scorer
// would refuse (more than 3 screenshots or one over 256 KiB; more than 993
// files and directories in app/ or 16 MiB of app files).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
