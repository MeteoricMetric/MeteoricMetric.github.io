// merricstrough.com — image format pipeline.
//
// Generates AVIF + WebP variants of public/avatar.jpg so <picture>
// elements can serve modern formats with JPEG fallback. Run via
// `npm run images` (idempotent).
//
// Lighthouse "modern-image-formats" + "image-delivery-insight" fail
// on the JPEG-only avatar; this closes that gap without changing the
// canonical /avatar.jpg URL (the JSON-LD Person.image field still
// resolves stably).

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const SOURCES = [{ input: 'public/avatar.jpg', baseName: 'avatar' }];

async function process(input, baseName) {
  const src = await readFile(join(REPO_ROOT, input));
  const outDir = join(REPO_ROOT, dirname(input));

  await sharp(src)
    .avif({ quality: 60, effort: 6 })
    .toFile(join(outDir, `${baseName}.avif`));
  console.log(`  ✓ ${baseName}.avif`);

  await sharp(src)
    .webp({ quality: 78, effort: 6 })
    .toFile(join(outDir, `${baseName}.webp`));
  console.log(`  ✓ ${baseName}.webp`);
}

async function main() {
  for (const s of SOURCES) {
    await process(s.input, s.baseName);
  }
}

main().catch((err) => {
  console.error('image optimization failed:', err);
  process.exit(1);
});
