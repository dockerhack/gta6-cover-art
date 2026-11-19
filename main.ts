// Vice City Cover Studio — entrypoint (Node 22, standard library only).
//
// Hands the app in: copies app/ and screenshots/ from this repository to the
// output directory and writes /output/dossier.json with the kit's library
// (vendor/makefun-app.ts). Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output. Running this twice writes the same bytes both times.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

// Replace the two handed-in trees wholesale so a stale file can never
// survive from an earlier run in the same output directory.
for (const name of ['app', 'screenshots']) {
  rmSync(join(outDir, name), { recursive: true, force: true });
  cpSync(join(repoDir, name), join(outDir, name), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
