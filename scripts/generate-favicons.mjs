// merricstrough.com — favicon raster generator.
//
// Reads public/favicon.svg and emits PNG raster fallbacks at the sizes
// modern browsers / Apple devices / installable PWAs expect.
// Run via `npm run favicons` (idempotent — safe to re-run).
//
// favicon.svg is the canonical source; modern browsers use it directly.
// These rasters exist for: Safari iOS Add-to-Home-Screen, Android home
// screen, web app manifest icon variants, and very-old browser fallback.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SRC_SVG = join(REPO_ROOT, 'public', 'favicon.svg');
const OUT_DIR = join(REPO_ROOT, 'public');

const SIZES = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

async function main() {
  const svg = await readFile(SRC_SVG);

  for (const { name, size } of SIZES) {
    const out = join(OUT_DIR, name);
    await sharp(svg, { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile(out);
    console.log(`  ✓ ${name} (${size}×${size})`);
  }
}

main().catch((err) => {
  console.error('favicon generation failed:', err);
  process.exit(1);
});
