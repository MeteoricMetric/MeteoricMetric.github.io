// merricstrough.com — image format pipeline.
//
// Generates AVIF + WebP sibling variants for raster images so <picture>
// elements can serve modern formats with the original as fallback. Run via
// `npm run images` (idempotent — skips files whose .avif + .webp siblings
// already exist and are newer than the source).
//
// Two scopes:
//   1. EXPLICIT_SOURCES — fixed assets the build always needs (the avatar).
//   2. SCAN_DIRS — directories where Pages CMS / future authoring drops
//      raster images (public/hero/ is the canonical hero-bg destination
//      per .pages.yml). Scanned at build time so newly-uploaded images
//      pick up modern-format siblings without a manual re-run.
//
// Wired into npm run build via the `prebuild` script in package.json,
// so deploy.yml automatically runs this on every Actions deploy.

import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const RASTER_EXTS = new Set(['.jpg', '.jpeg', '.png']);

const EXPLICIT_SOURCES = ['public/avatar.jpg'];
const SCAN_DIRS = ['public/hero'];

/** Returns true if .avif + .webp siblings exist AND are newer than the source. */
async function siblingsAreFresh(srcPath, baseName, outDir) {
  const avif = join(outDir, `${baseName}.avif`);
  const webp = join(outDir, `${baseName}.webp`);
  try {
    const [srcStat, avifStat, webpStat] = await Promise.all([
      stat(srcPath),
      stat(avif),
      stat(webp),
    ]);
    return avifStat.mtimeMs >= srcStat.mtimeMs && webpStat.mtimeMs >= srcStat.mtimeMs;
  } catch {
    return false; // any sibling missing = not fresh
  }
}

async function processOne(relativeInput) {
  const absInput = join(REPO_ROOT, relativeInput);
  const ext = extname(absInput);
  const baseName = basename(absInput, ext);
  const outDir = dirname(absInput);

  if (await siblingsAreFresh(absInput, baseName, outDir)) {
    console.log(`  ⏭  ${baseName}${ext} (siblings up to date)`);
    return;
  }

  const src = await readFile(absInput);
  await sharp(src)
    .avif({ quality: 60, effort: 6 })
    .toFile(join(outDir, `${baseName}.avif`));
  await sharp(src)
    .webp({ quality: 78, effort: 6 })
    .toFile(join(outDir, `${baseName}.webp`));
  console.log(`  ✓ ${baseName}.{avif,webp}`);
}

async function scanDir(relDir) {
  const absDir = join(REPO_ROOT, relDir);
  let entries;
  try {
    entries = await readdir(absDir);
  } catch {
    // Directory doesn't exist yet (e.g. no hero uploads from CMS) — skip silently.
    return [];
  }
  return entries
    .filter((name) => RASTER_EXTS.has(extname(name).toLowerCase()))
    .map((name) => join(relDir, name));
}

async function main() {
  const fromScans = (await Promise.all(SCAN_DIRS.map(scanDir))).flat();
  const all = [...EXPLICIT_SOURCES, ...fromScans];
  for (const input of all) await processOne(input);
  if (all.length === 0) {
    console.log('  (no raster sources found — nothing to optimize)');
  }
}

main().catch((err) => {
  console.error('image optimization failed:', err);
  process.exit(1);
});
