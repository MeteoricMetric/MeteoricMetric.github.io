// merricstrough.com — Open Graph default image generator.
//
// Emits public/og-default.png at 1200×630, the standard OG card size.
// Composes the dark canvas + signature accent + brand "M" + headline +
// tagline. Run via `npm run og` (idempotent).
//
// Used as the og:image / twitter:image fallback in BaseHead.astro when
// a page doesn't override with its own ogImage prop.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT = join(REPO_ROOT, 'public', 'og-default.png');

const W = 1200;
const H = 630;

// Hand-authored SVG that renders the OG card. font-family stays generic
// (system sans) so we don't need to embed Geist's woff2 inline — at OG
// thumbnail size the difference is imperceptible.
const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="100%" r="80%" fx="50%" fy="100%">
      <stop offset="0%" stop-color="#8b6bff" stop-opacity="0.45" />
      <stop offset="60%" stop-color="#8b6bff" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#8b6bff" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="text-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5f3f7" />
      <stop offset="100%" stop-color="#b4afbb" />
    </linearGradient>
  </defs>

  <!-- Dark canvas -->
  <rect width="${W}" height="${H}" fill="#1a1820" />

  <!-- Bottom radial accent glow -->
  <rect width="${W}" height="${H}" fill="url(#glow)" />

  <!-- Brand mark — same M letterform as favicon, top-left -->
  <g transform="translate(72 72)">
    <rect width="84" height="84" rx="18" fill="#221f29" stroke="#36313f" stroke-width="1" />
    <path
      d="M22 62 L22 22 L36 22 L42 38 L48 22 L62 22 L62 62"
      fill="none"
      stroke="#8b6bff"
      stroke-width="6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>

  <!-- Eyebrow -->
  <text
    x="72" y="290"
    fill="#8b6bff"
    font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    font-size="22"
    font-weight="500"
    letter-spacing="3.5"
    text-transform="uppercase"
  >MERRICSTROUGH.COM · METEORICMETRIC</text>

  <!-- Headline -->
  <text
    x="72" y="380"
    fill="url(#text-fade)"
    font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="92"
    font-weight="600"
    letter-spacing="-1.5"
  >Building, breaking, making.</text>

  <!-- Subline -->
  <text
    x="72" y="448"
    fill="#b4afbb"
    font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="34"
    font-weight="400"
  >13. Worlds in Minecraft. Marks in art. Hours in games.</text>

  <!-- Bottom band — small meta line + subtle accent line -->
  <line x1="72" y1="550" x2="${W - 72}" y2="550" stroke="#36313f" stroke-width="1" />
  <text
    x="72" y="585"
    fill="#807a87"
    font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    font-size="20"
    letter-spacing="2"
  >built with my dad — shanestrough.com</text>
  <circle cx="${W - 88}" cy="578" r="6" fill="#8b6bff" />
  <text
    x="${W - 72}" y="585"
    fill="#b4afbb"
    font-family="ui-sans-serif, system-ui, -apple-system, sans-serif"
    font-size="22"
    font-weight="500"
    text-anchor="end"
    transform="translate(-20 0)"
  >LIVE</text>
</svg>
`;

async function main() {
  await sharp(Buffer.from(SVG)).png({ compressionLevel: 9 }).toFile(OUT);
  console.log(`  ✓ og-default.png (${W}×${H})`);
}

main().catch((err) => {
  console.error('OG image generation failed:', err);
  process.exit(1);
});
