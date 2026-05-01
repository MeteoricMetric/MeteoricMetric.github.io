// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Per ADR-0001 — Astro 6 + TypeScript, static output to GitHub Pages
export default defineConfig({
  site: 'https://merricstrough.com',

  integrations: [sitemap(), mdx()],

  // Astro 6 Sharp image service — AVIF + WebP + responsive srcset
  // wired automatically via the <Image /> component in src/.
  image: {
    // Defaults are sensible for v1; customize per-image at usage site.
  },

  // View Transitions API: first-class in Astro 6, wired via the
  // <ClientRouter /> component in BaseLayout.astro (not a config flag).

  // Vite Environment API is the Astro 6 dev-server default; no extra
  // vite config needed at scaffold time.

  build: {
    // Inline critical CSS for above-the-fold rendering performance.
    inlineStylesheets: 'auto',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
