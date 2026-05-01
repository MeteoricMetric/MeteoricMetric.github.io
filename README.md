# merricstrough.com

The personal site of **Merric Strough** (handle: `MeteoricMetric`) — builder, gamer, creator.

🌐 **Live:** [merricstrough.com](https://merricstrough.com)

## Stack

- **[Astro 6](https://astro.build/)** — HTML-first, near-zero client JS, static output to GitHub Pages
- **TypeScript** (strict mode)
- **Vanilla CSS** with an OKLCH design-token layer
- **[Geist Sans + Geist Mono](https://vercel.com/font)** typography (with Newsreader for editorial moments)
- **[Pages CMS](https://pagescms.org/)** — git-backed admin for Merric to swap hero media, copy, and content
- **Cloudflare Worker** for the Spotify Now Playing widget
- **[Biome](https://biomejs.dev/)** for lint + format
- **[Playwright](https://playwright.dev/) + [axe-core](https://github.com/dequelabs/axe-core)** for visual + a11y testing
- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** for performance gates (≥95 on all four)
- **GitHub Actions** for build + deploy + CodeQL + Dependabot

The architectural decisions that drove these choices live in [`docs/decisions/`](docs/decisions/) as ADRs.

## Develop

Requires Node ≥ 22.18 (matches `.nvmrc`).

```bash
npm install         # install dependencies
npm run dev         # dev server at http://localhost:4321
npm run build       # production build to ./dist
npm run preview     # preview the production build locally
npm run check       # Astro type/diagnostic check
npm run typecheck   # full TypeScript check
npm run lint        # Biome lint
npm run lint:fix    # Biome lint + auto-fix
npm run format      # Biome format (write)
npm test            # Playwright test suite
npm run test:ui     # Playwright UI mode
```

## Project structure

```
.
├── docs/decisions/      # Architectural Decision Records (ADRs)
├── public/              # Static assets copied verbatim to build output
│   ├── CNAME            # GitHub Pages custom-domain binding
│   ├── robots.txt
│   ├── humans.txt
│   └── .well-known/
│       └── security.txt # RFC 9116 vulnerability-disclosure pointer
├── src/
│   ├── components/      # Astro components
│   ├── content/         # Pages-CMS-managed content (hero, identity, projects)
│   ├── data/            # Typed structural data (family graph, accounts)
│   ├── layouts/         # Page layouts (BaseLayout)
│   ├── pages/           # File-based routes
│   └── styles/          # Design tokens, reset, base CSS
├── tests/               # Playwright + axe tests
├── worker/              # Cloudflare Worker (Spotify Now Playing)
├── .github/workflows/   # CI / deploy / CodeQL / Lighthouse
├── astro.config.mjs
├── biome.json
├── playwright.config.ts
├── tsconfig.json
└── .pages.yml           # Pages CMS schema
```

## Repo conventions

See [`CLAUDE.md`](CLAUDE.md) for operating principles, design system rules, security standards, accessibility expectations, and AI-collaboration protocol.

For operational details (registrar, hardware, secret variable names, exact paths), see `CLAUDE.local.md` (gitignored — local clone only).

## Family graph

This site cross-links with [shanestrough.com](https://shanestrough.com) and (in the future) sibling sites for Tristan and Layne. Implementation lives in [`src/data/family.ts`](src/data/family.ts) and [`src/data/accounts.ts`](src/data/accounts.ts), surfaced via `<link rel="me">` and JSON-LD `Person` schema. See ADR-0003 for the full model.

## License

Personal site code — UNLICENSED. Content (writing, art, custom assets) © Merric Strough, all rights reserved.
