# CLAUDE.md — merricstrough.com

> **Mission:** Build the personal digital headquarters of Merric Strough (handle: MeteoricMetric) with the engineering rigor of SpaceX, the design soul of Awwwards, the security posture of NSA, the documentation discipline of MIT Labs, and the AI-native fluency of an Anthropic / OpenAI / Cerebras team.
>
> This is a 13-year-old's site. It is also a real piece of software, deployed to the real internet, with his real name on it. Treat both truths with equal seriousness.

---

## 0. Identity & ownership

- **Owner / human in the loop:** Merric Strough (handle: `MeteoricMetric`), age 13
- **Co-pilot / accountable adult:** Shane Strough (handle: `ShaneS08`)
- **Repository:** `github.com/MeteoricMetric/meteoricmetric.github.io`
- **Production URL:** https://merricstrough.com
- **Hosting:** GitHub Pages, custom domain via DNS registrar (specific provider in `CLAUDE.local.md`)
- **Status:** Active development — this site grows with him for the next decade+

This project belongs to Merric. Shane assists. Claude Code is the third member of the team, not the lead. Decisions originate from the human owner; Claude executes, advises, and teaches.

---

## 1. Operating principles (non-negotiable)

These are the cultural DNA of how this codebase is built. Every action Claude takes should be checkable against these.

### 1.1 First-principles thinking
Don't copy patterns blindly. Before implementing something, ask: *what is this trying to accomplish, and what is the simplest possible solution that satisfies the constraint?* Reject cargo-culted complexity.

### 1.2 Ruthless prioritization
Ship the smallest valuable thing first. A working ugly page beats a beautiful unfinished one every time. We optimize after we ship, not before.

### 1.3 Design is a feature, not a finish
Every visible surface gets the same care as the code behind it. No "we'll style it later." Style and structure ship together. Reference quality bar: Awwwards Site of the Day, Linear, Stripe, Vercel.

### 1.4 Automation is identity
If something is done more than twice, automate it. Sitemap updates, image optimization, deploy verification, dead link checks — these are scripts, not chores.

### 1.5 Paranoid security by default
Assume every input is hostile. Assume every dependency is compromised. Assume every secret will leak unless engineered not to. The threat model is real: this is a minor's public website, and his safety is non-negotiable.

### 1.6 Documentation as a deliverable
Code without docs is half-shipped. README, inline comments where non-obvious, and decision records for anything architectural. If a future Merric (age 16, age 22) can't understand why we did something, we failed.

### 1.7 Reverence for craft
Pixel alignment, semantic HTML, accessible markup, optimized assets, thoughtful copy. The 1% details are the entire game. Sweat them.

### 1.8 Teach while building
Merric is learning. Every commit is a teaching moment. Narrate decisions. Show alternatives considered and rejected. Comment unusual choices. The codebase itself is curriculum.

---

## 2. Claude Code utilization protocol

Claude has powerful capabilities that go unused by default. This project uses all of them.

### 2.1 Extended thinking
For any task more complex than "edit this string," **think before acting**. Use extended reasoning to:
- Decompose the task
- Enumerate approaches
- Identify risks and edge cases
- Choose the highest-leverage path

A two-minute think saves a two-hour debug.

### 2.2 Research mode
For any technology, library, API, or pattern that's new in this conversation, **research it before implementing**. Read official docs. Verify current best practices (frameworks evolve fast — your training data is older than the answer). Cite sources in commit messages or comments when relevant.

### 2.3 Subagent delegation
For multi-step work, decompose into specialist subagents:
- **Researcher** — surveys current state of the art, gathers references
- **Architect** — proposes structure and tradeoffs before code is written
- **Implementer** — writes the code
- **Reviewer** — audits for security, accessibility, performance, style
- **Documenter** — updates README, CLAUDE.md, inline comments

Use the Task tool to spawn these as parallel or sequential subagents. Don't try to be all five roles at once in one stream of thought — quality degrades.

### 2.4 Subject matter expertise stance
When working in a domain, **adopt the stance of a senior practitioner in that domain**:
- Frontend → senior staff engineer at a top product company
- Security → application security engineer with web app expertise
- DevOps → SRE accustomed to zero-downtime deploys
- Design → senior product designer with motion / interaction chops
- Content / copy → editorial standards of a serious publication
- Accessibility → WCAG 2.2 AA as the floor, AAA where reasonable

If a task crosses domains, switch hats explicitly and announce the switch.

### 2.5 Proportionality of rigor
Match process to stakes. Three tiers:

| Tier | Examples | Process |
|------|----------|---------|
| **Trivial** | typo fix, color tweak, copy edit | Edit, commit, push |
| **Standard** | new page, new component, refactor | Plan → implement → self-review → commit |
| **Significant** | new subsystem, dependency add, build-system change, anything touching auth or external services | Research → design doc in `/docs/decisions/` → human approval → implement → tests → review → commit |

Don't overprocess trivial work. Don't underprocess significant work. Use judgment, and when in doubt, err one tier higher.

### 2.6 Confirm intent on ambiguity
If a request is ambiguous, ask before acting. Better one clarifying question than ten minutes of wrong work. But don't ask trivial questions to perform diligence — judgment matters.

---

## 3. Technical stack & architecture

### 3.1 Current stack — v2 (2026-05)

| Layer | Choice | Notes |
|---|---|---|
| **Meta-framework** | Astro 6 (latest stable) | HTML-first, near-zero client JS by default; multi-framework component islands when interactivity is genuinely needed; first-class Cloudflare Workers support; static output deploys to GitHub Pages |
| **Language** | TypeScript (strict mode) | Type safety with zero runtime cost in static builds; `tsconfig.json` extends `astro/tsconfigs/strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules` |
| **Styling** | Vanilla CSS with OKLCH design-token layer + Astro-scoped component styles | Tokens in `src/styles/tokens.css`; reset + base in `src/styles/`; component styles use Astro's scoped `<style>` blocks |
| **Content** | Astro content collections with Zod schemas | Markdown-first authoring; type-safe at build time; Pages CMS edits write directly into the content directory |
| **Lint + format** | Biome | Single tool; replaces ESLint + Prettier; `biome.json` at repo root |
| **Tests** | Playwright + axe-core (a11y) + Lighthouse CI (perf) | Cross-browser (Chromium / Firefox / Webkit); WCAG 2.2 AA floor; performance ≥ 95 |
| **Admin / CMS** | Pages CMS (hosted at `app.pagescms.org`) primary; github.dev power-user fallback; Sveltia self-host as Phase-4 graduation if needed | Schema in `.pages.yml` |
| **Spotify Now Playing** | Cloudflare Worker (`worker/`) | Refresh-token flow, edge-cached access tokens, CORS-restricted to merricstrough.com + dev origin |
| **CI/CD** | GitHub Actions: ci → codeql → lighthouse → deploy | All in `.github/workflows/` |
| **Security automation** | Dependabot + CodeQL + branch protection | Per §5.2 |
| **Hosting** | GitHub Pages (Actions-driven deploy, NOT branch-source) | Static output |
| **Domain / DNS** | Custom domain via DNS registrar (specifics in `CLAUDE.local.md`) | apex `merricstrough.com`; HTTPS via Let's Encrypt auto-provisioned by GitHub Pages |

Decided in [`docs/decisions/0001-adopt-astro-typescript-stack.md`](docs/decisions/0001-adopt-astro-typescript-stack.md).

### 3.2 Why Astro
Astro is HTML-first and ships zero client JS by default. An Astro component is essentially HTML/CSS with a TypeScript frontmatter — Merric reading the source still sees actual HTML, not React abstractions. We get the benefits of a real framework (typed content collections, image pipeline, view transitions, sitemap, MDX, motion primitives) without the ergonomic tax of an SPA. Multi-framework component islands let us drop in React/Solid/Svelte for a single interactive widget (e.g., the Now Spinning ticker) without site-wide JS overhead.

The v1 instinct ("vanilla until proven we need a framework") was the right philosophy at v1's scope. v2's scope (CMS-driven hero, Spotify Now Playing, family-graph cross-linking, Lighthouse-95 gates) crosses the threshold where Astro pays for itself. See ADR-0001 for the full alternatives analysis (Next.js, SvelteKit, Eleventy, continuing vanilla).

### 3.3 Future architecture
Subdomains will live in their own repos to keep concerns separated and deploys independent:
- `merricstrough.com` ← this repo
- `minecraft.merricstrough.com` ← `merric-minecraft` repo
- `art.merricstrough.com` ← `merric-art` repo
- `youtube.merricstrough.com`, `twitch.merricstrough.com` ← may be DNS redirects, not full sites

For v2 launch, sub-routes (`/minecraft/`, `/art/`, `/youtube/`, `/twitch/`) ship in this repo as Astro pages. Extraction to sibling subdomain repos happens in Phase 4 when each route's content depth justifies the split.

### 3.4 The Minecraft subsystem (separate but related)
The Minecraft server runs on a home workstation under Docker (Paper + Geyser + Floodgate), exposed via a tunnel service (operational specifics in `CLAUDE.local.md`). The minecraft subdomain page is a static frontend; the server itself is operational infrastructure documented in its own repo. Don't conflate them.

---

## 4. Coding standards

### 4.1 HTML / Astro components (`.astro`)
- Semantic tags always. `<main>`, `<nav>`, `<article>`, `<section>`, `<header>`, `<footer>`. Never `<div>` when a real element exists.
- Every `<img>` has descriptive `alt` text. Decorative images get `alt=""`. Prefer Astro's `<Image>` component for any non-hero raster image — it handles AVIF/WebP/responsive srcset/lazy automatically.
- Lang attribute on `<html>` (set by `BaseLayout.astro`). Viewport meta tag, title, description on every page (set by `BaseHead.astro`).
- Heading hierarchy is strict: one `<h1>` per page, no skipped levels.
- Forms (when added): proper labels, fieldsets, ARIA where needed.
- Astro components live in `src/components/` (consumable across pages) or `src/layouts/` (page wrappers). Use the path aliases `@components/`, `@layouts/`, `@data/`, `@styles/`, `@content/` defined in `tsconfig.json`.

### 4.2 CSS
- All design values consumed through tokens in `src/styles/tokens.css` — colors, typography, spacing, radius, shadow, motion, z-index. Never hard-code values; if a token doesn't exist, add it and reference it.
- Color tokens are OKLCH-first with sRGB hex fallback via `@supports`. Document the hex value in a comment when adding a new color token.
- Mobile-first. Base styles target small screens; container queries (`@container`) preferred over media queries for component-scoped responsiveness.
- Logical properties throughout (`margin-block`, `padding-inline`, `inset-block-end`, etc.).
- Avoid `!important`. If you need it, you've structured selectors wrong.
- Animations respect `prefers-reduced-motion` via the duration tokens (the reduced-motion media query collapses durations to 0.01ms in `tokens.css`).
- Component styles use Astro's scoped `<style>` blocks. Global rules go in `src/styles/base.css` or a dedicated stylesheet imported by `BaseLayout.astro`.
- No Tailwind, no CSS-in-JS — keep the source legible and the token discipline first-class. (Tailwind shines at multi-author scale; not the right tool here.)

### 4.3 TypeScript / JavaScript
- TypeScript strict mode everywhere — `tsconfig.json` extends `astro/tsconfigs/strict` with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules` on top.
- Astro's "islands" principle: components ship as static HTML by default. Only opt into client-side hydration when the feature genuinely requires it (e.g., the Now Spinning live update, the hero canvas). Never reach for client JS to do something CSS or server-rendered HTML can do.
- ES modules, `const` by default, arrow functions where they read better. No `var`. No `==` (only `===`).
- Strict null checking — if it can be undefined, handle it. With `exactOptionalPropertyTypes` on, optional props are spread-forwarded conditionally rather than passed as `undefined`.
- Comment intent, not implementation. Default to no comments unless the *why* is non-obvious. Code says *what*; comments say *why* (constraint, invariant, workaround, surprise).

### 4.4 File organization
```
/
├── src/
│   ├── components/         # Astro components (BaseHead, Footer, PersonSchema, FontLoader, …)
│   ├── content/            # Pages-CMS-managed content (hero.json, identity.json, projects/*.md)
│   ├── data/               # Typed structural data (family.ts, accounts.ts)
│   ├── layouts/            # Page layouts (BaseLayout)
│   ├── pages/              # File-based routes (index.astro, 404.astro, …)
│   └── styles/             # Design tokens, reset, base CSS
├── public/                 # Static assets — copied verbatim to dist/
│   ├── CNAME               # GitHub Pages custom-domain binding
│   ├── avatar.jpg
│   ├── fonts/              # Self-hosted Geist Sans + Mono variable woff2
│   ├── robots.txt
│   ├── humans.txt
│   └── .well-known/security.txt
├── tests/                  # Playwright + axe specs
├── worker/                 # Cloudflare Worker (Spotify Now Playing)
├── docs/decisions/         # Architectural Decision Records (ADRs)
├── .github/workflows/      # CI / deploy / CodeQL / Lighthouse
├── .pages.yml              # Pages CMS schema
├── astro.config.mjs
├── biome.json
├── playwright.config.ts
├── tsconfig.json
├── package.json
├── README.md               # public-facing project description
├── CLAUDE.md               # this file (instructions for AI)
└── CLAUDE.local.md         # gitignored — operational details (registrar, hardware, secrets)
```

### 4.5 Naming conventions
- Files: `kebab-case.html`, `kebab-case.css`, `PascalCase.astro` for components, `camelCase.ts` for data/utilities
- CSS classes: `kebab-case` (BEM if components grow complex)
- IDs: avoid for styling; use for anchors and form labels only
- TS: `camelCase` for variables/functions, `PascalCase` for types/interfaces/classes/components, `SCREAMING_SNAKE` for true constants

---

## 5. Security standards

### 5.1 Threat model
The site hosts a minor's public-facing identity. Specific threats we care about:
- **Doxxing** — leaked PII (real address, school, full birthday) via the site or commit history
- **Account takeover** — GitHub, domain registrar, deployment chain
- **Supply chain** — compromised dependencies or scripts
- **Stalker / harassment** — info on the site enabling real-world targeting
- **Defacement** — unauthorized commits to main

### 5.2 Mandatory controls
- **2FA on all platform accounts** (GitHub, DNS registrar, Anthropic, email; full inventory in `CLAUDE.local.md`) — TOTP, not SMS
- **Recovery codes stored securely offline** (procedure detail in `CLAUDE.local.md`)
- **No secrets in repo, ever** — API keys, tokens, private URLs all live in environment variables or secret managers, never in tracked files
- **`.gitignore` audit** — before any commit, confirm no `.env`, `.key`, `.pem`, or credential files are staged
- **Branch protection on `main`** — when project matures, require PR review even for the owner
- **Dependabot / GitHub security alerts on** — patch advisories within 7 days for high-severity, immediately for critical

### 5.3 Privacy rules — NEVER violate
- Display name on site: "Merric S." or "Merric" — **never full last name on visible page content**
- No street address, school, or specific city
- No face photos — custom avatar only
- No real birthday or age beyond "13"
- No real-time location data, ever
- No comment systems with public profiles tied to real identities

### 5.4 External resources
- Self-host fonts and assets where reasonable (faster + privacy-respecting)
- Any third-party embed (YouTube, Twitch, Spotify, etc.) gets reviewed for tracking
- Subresource Integrity (`integrity` attribute) on any CDN-loaded script
- Content Security Policy header configured once we have anything dynamic

### 5.5 Pre-commit security gate
Before any `git commit`, mentally run this checklist:
- [ ] No credentials, tokens, or keys in changed files
- [ ] No PII added that violates 5.3
- [ ] No new external dependencies without review
- [ ] No accidentally-public test data

---

## 6. Testing standards

### 6.1 What we test
- **Visual** — every change is loaded in a browser before commit. Mobile viewport (375px), tablet (768px), desktop (1280px), large desktop (1920px).
- **Cross-browser** — Chrome, Firefox, Safari (or Webkit). Edge inherits from Chrome.
- **Accessibility** — keyboard navigation works on every interactive element. Screen reader announcement makes sense (test with VoiceOver or NVDA quarterly).
- **Performance** — Lighthouse score ≥ 95 on Performance, Accessibility, Best Practices, SEO for the production build.
- **Link integrity** — internal and external links verified after page changes.

### 6.2 What we automate (active in CI)
- **Lint + format:** Biome (`npm run lint`) — runs in `.github/workflows/ci.yml` on every PR + push to main
- **Type check:** `npm run check` (Astro check) + `npm run typecheck` (full TS) — same CI workflow
- **Build:** `npm run build` — fail-fast on any compile error
- **Cross-browser smoke + a11y + visual + perf:** Playwright (`npm run test`) — config at `playwright.config.ts`, specs in `tests/`. axe-core via `@axe-core/playwright` enforces WCAG 2.2 AA on landing
- **Lighthouse CI:** `.github/workflows/lighthouse.yml` on PRs — asserts Performance / Accessibility / Best Practices / SEO ≥ 95
- **Security scanning:** CodeQL weekly + on push (`.github/workflows/codeql.yml`); Dependabot weekly grouped patches (`.github/dependabot.yml`); private vulnerability reporting via `.well-known/security.txt`
- **Image optimization:** Astro's `<Image>` component handles AVIF/WebP/responsive srcset/lazy automatically — no separate check needed unless we ship a non-`<Image>` asset

### 6.3 Manual smoke test before deploy
For any non-trivial change, before pushing to main:
1. Open the page in a fresh incognito window
2. Resize from 320px to 1920px and verify layout
3. Tab through every interactive element
4. Run Lighthouse in the browser
5. Verify no console errors

---

## 7. Documentation standards

### 7.1 README.md (public-facing)
The repo's public face. Should explain:
- What the project is
- Tech stack at a glance
- How to run locally
- Where the live site is
- License (TBD)

### 7.2 CLAUDE.md (this file)
Living instruction set for AI assistants. Updated whenever conventions change. Treat changes to this file with the same care as code changes.

### 7.3 Architectural Decision Records (ADRs)
For any significant decision (framework choice, hosting change, major refactor), write an ADR in `/docs/decisions/NNNN-short-title.md`:

```markdown
# ADR-0001: Stay vanilla, no framework yet

## Status
Accepted — 2026-04-XX

## Context
[What problem prompted this decision]

## Decision
[What we decided]

## Alternatives considered
[What else we looked at and why we didn't pick them]

## Consequences
[What this means for the project going forward]
```

ADRs are append-only. Don't edit old ones — supersede them with new ones.

### 7.4 Inline comments
- Comment **why**, not **what**. The code shows what.
- Comment any non-obvious choice, performance trick, or browser workaround.
- Don't comment self-explanatory code — it's noise.

### 7.5 Commit messages
Conventional Commits format, lightly enforced:
- `feat: add minecraft server status widget`
- `fix: correct apex DNS for github pages`
- `docs: update CLAUDE.md with security gate`
- `style: tighten button hover transition`
- `refactor: extract avatar component`
- `chore: update gitignore`

Body of the commit (if needed) explains *why* in 1-3 sentences.

**Co-attribution trailer.** Every commit ends with a `Co-Authored-By` trailer block listing the real contributors so the GitHub Insights → Contributors graph reflects the collaboration. Local `git config user.name` stays as `MeteoricMetric` (so the commit author is Merric — this is his site), but the trailer surfaces Shane and Claude. Use this exact block at the bottom of every commit body:

```
Co-Authored-By: Merric Strough <277578502+MeteoricMetric@users.noreply.github.com>
Co-Authored-By: Shane Strough <196983413+shane-thomas-strough@users.noreply.github.com>
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

The emails are GitHub's noreply addresses — they expose nothing private and make the avatars render. If a commit is genuinely solo (e.g. a Pages-CMS edit by Merric himself with no Shane/Claude involvement), drop the relevant trailers. Default for AI-collaborated commits = all three.

---

## 8. Design system

### 8.1 Current tokens
```css
:root {
  /* Colors */
  --color-bg: #8b6bff;          /* purple primary */
  --color-surface: #ffffff;     /* card */
  --color-text: #1a1a1a;        /* near-black */
  --color-text-muted: #666666;
  --color-border: #f4f4f8;

  /* Typography */
  --font-stack-sans: system-ui, -apple-system, sans-serif;

  /* Spacing (8pt grid) */
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-6: 3rem;
  --space-8: 4rem;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 24px;

  /* Shadows */
  --shadow-card: 0 20px 60px rgba(0,0,0,0.3);
  --shadow-button: 0 8px 24px rgba(0,0,0,0.15);
}
```

### 8.2 Design principles
- **Type-first.** Beautiful typography solves 80% of design.
- **Whitespace is content.** Don't fear empty space.
- **One focal point per screen.** Hierarchy must be obvious in 2 seconds.
- **Motion has meaning.** Animations communicate state changes; never decorative-only.
- **Mobile equals desktop in priority.** Both are first-class.
- **Dark mode considered from day one** (even if not yet implemented).

### 8.3 Reference bar
When designing or refining, ask: *would this make Awwwards SOTD?* Reference sites: Linear.app, Stripe.com, Vercel.com, Apple.com, Anthropic.com, Frame.io. Study them, don't copy them.

---

## 9. SEO & discoverability

### 9.1 Mandatory on every page
- Unique `<title>` (50-60 chars)
- Unique `<meta name="description">` (140-160 chars)
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter card tags
- Canonical URL
- Structured data (JSON-LD) where applicable (Person, WebSite schemas)

### 9.2 Site-level
- `sitemap.xml` — kept current, every page included, `lastmod` accurate
- `robots.txt` — explicitly allow indexing, point to sitemap
- `humans.txt` — credits and tech stack (optional but classy)

### 9.3 Post-deploy automation
After every deploy that adds or modifies a page:
1. Update `sitemap.xml` `<lastmod>`
2. Commit + push
3. Ping Google Search Console (manual for now, scripted later)
4. Ping Bing Webmaster Tools

---

## 10. Cross-site identity & family graph

### 10.1 Context
Merric's site is part of a small but growing constellation of family-owned web properties. The Strough family's online presence currently includes:

- `shanestrough.com` — Shane's personal site (poetry, podcast, professional profile)
- `merricstrough.com` — this site
- *(future)* `tristanstrough.com`, `laynestrough.com` — Merric's brothers, when they're ready
- *(future)* `clandestinmedia.com` and related project domains

These are independent properties with independent purposes. They are **also** related — by family, by collaboration, and by shared origin. Search engines, knowledge graphs, and IndieWeb tooling should be able to understand both truths.

### 10.2 Guiding principle: authentic, never extractive
Cross-linking exists to express **real relationships** in machine-readable form — not to game search rankings. The integrity of each site as a standalone identity always wins. Specifically:

- **Merric's site is Merric's.** Cross-references to Shane or other family members are supplementary, never structural. The site is about Merric, by Merric, for Merric's audience.
- **Cross-links are natural and minimal.** A footer attribution, a family/about page, structured data — that's the surface area. Not paragraph mentions, not keyword stuffing, not navigation prominence.
- **Both directions, always.** If Merric's site links to Shane's, Shane's links back. Asymmetric linking patterns are a red flag for both algorithms and humans.
- **Truth-only.** Don't claim relationships, projects, or affiliations that aren't real. The family graph is verifiable; lying makes both sites lose authority when discovered.

### 10.3 Implementation conventions

#### Footer attribution (subtle, present on every page)
Every page on `merricstrough.com` includes a small footer line:

```html
<footer>
  <p>Built with my dad —
     <a href="https://shanestrough.com" rel="me">shanestrough.com</a>
  </p>
</footer>
```

The `rel="me"` attribute is the IndieWeb convention for "this URL represents an identity related to mine." Search engines and federated identity tooling (Mastodon, etc.) consume this.

#### `rel="me"` in `<head>` for both sites
On `merricstrough.com`:
```html
<link rel="me" href="https://shanestrough.com">
```

On `shanestrough.com` (when adding the family page):
```html
<link rel="me" href="https://merricstrough.com">
<link rel="me" href="https://tristanstrough.com">  <!-- when live -->
<link rel="me" href="https://laynestrough.com">    <!-- when live -->
```

#### JSON-LD Person schema with family relationships
On `merricstrough.com`'s landing page, in `<head>` or just before `</body>`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Merric Strough",
  "givenName": "Merric",
  "familyName": "Strough",
  "url": "https://merricstrough.com",
  "image": "https://merricstrough.com/avatar.jpg",
  "description": "13-year-old builder, gamer, and creator. Working on Minecraft, art, and code.",
  "parent": {
    "@type": "Person",
    "name": "Shane Strough",
    "url": "https://shanestrough.com"
  },
  "sibling": [
    { "@type": "Person", "name": "Tristan Strough" },
    { "@type": "Person", "name": "Layne Strough" }
  ],
  "alternateName": "MeteoricMetric"
}
```

The inverse (for Shane to add on shanestrough.com):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Shane Strough",
  "url": "https://shanestrough.com",
  "children": [
    { "@type": "Person", "name": "Merric Strough", "url": "https://merricstrough.com" },
    { "@type": "Person", "name": "Tristan Strough" },
    { "@type": "Person", "name": "Layne Strough" }
  ]
}
```

> **Note on privacy:** Tristan's and Layne's surnames appear in structured data only because they're already public via family connection — but no per-site URL is exposed until they have their own sites and consent. Their full names are not displayed in visible page content on Merric's site without their (and Shane's) explicit OK.

#### Site-level cross-references
- **Family / about page** (future): when Merric adds an `/about` or `/family` page, it can mention his dad and brothers naturally, with links. Treat it like a yearbook entry — short, real, respectful.
- **Project provenance**: when a project on Merric's site involves Shane's infrastructure (e.g., the Minecraft server hosted on Shane's workstation), say so plainly. *"Hosted on my dad's home server."* That's both honest and good cross-domain signal.

### 10.4 What NOT to do

- ❌ Don't repeat "Shane Strough" or "shanestrough.com" multiple times on a single page
- ❌ Don't put Shane's name in `<title>`, `<h1>`, or meta description of any page
- ❌ Don't add hidden text, footer link farms, or stuffed keywords
- ❌ Don't make Merric's site visually feel like a Shane-branded property
- ❌ Don't link to unrelated commercial sites or affiliate links under the guise of "family"
- ❌ Don't claim co-authorship or co-ownership of content that's solely Merric's

### 10.5 Privacy guardrails specific to cross-linking
- Surnames in structured data are OK because they're already public via the domain itself
- Brothers' surnames in JSON-LD are OK; their **first names plus identifying details** (school, hobbies, etc.) are not, until they have their own consenting presence
- No photos of family members on Merric's site without explicit consent (and per Section 5.3, no face photos at all currently)
- No real addresses, even of the family home, even loosely

### 10.6 Verification & monitoring
After cross-linking goes live:
1. Validate JSON-LD via Google's Rich Results Test (search.google.com/test/rich-results)
2. Confirm `rel="me"` resolves both directions via IndieWebify.me
3. Submit both sitemaps to Google Search Console under both properties
4. Re-check quarterly that all cross-references still resolve (link rot is real)

---

## 11. Performance standards

### 11.1 Budgets
- **Time to First Byte:** < 200ms (GitHub Pages CDN should give us this for free)
- **Largest Contentful Paint:** < 1.5s on 4G (Astro's static output + critical-CSS inlining + font preload should comfortably hit)
- **Total Blocking Time:** < 200ms (zero client JS by default; only hydrate islands that need it)
- **Cumulative Layout Shift:** < 0.05 (`font-display: swap` with `size-adjust` where needed)
- **Total page weight:** < 500KB for landing pages, < 1MB for content pages (current font baseline: ~290KB Geist sans+mono+italics; budget allocation tracked in `.lighthouserc.json`)
- **Lighthouse CI gates** in CI assert all four ≥ 95 — see `.lighthouserc.json` and `.github/workflows/lighthouse.yml`

### 11.2 Discipline
- Images: WebP/AVIF where supported, with fallbacks. Lazy-load below the fold. Use Astro's `<Image>` component — it handles all of this.
- Fonts: `font-display: swap`, preload critical faces, subset where possible. Geist self-hosted in `public/fonts/`.
- CSS: critical inline (`build.inlineStylesheets: 'auto'` in `astro.config.mjs`), rest async.
- JavaScript: defer or async by default. Astro's islands hydrate only when needed (`client:load`, `client:idle`, `client:visible`, `client:media`).

---

## 12. Workflow

### 12.1 Day-to-day
1. Pull latest: `git pull`
2. `npm install` if `package.json` or `package-lock.json` changed since last pull
3. `npm run dev` — local dev server at http://localhost:4321 with hot reload
4. Make change with Claude Code
5. Verify locally: `npm run check` (Astro + TS check), `npm run lint` (Biome), `npm test` (Playwright if UI changed)
6. Visual smoke in browser (mobile / tablet / desktop / large)
7. `npm run build` — confirm production build succeeds
8. Stage: `git status`, then `git add <specific files>` (never `git add .` — see §5.5)
9. Commit: conventional-commits format, one logical change per commit
10. Push: `git push` — GitHub Actions runs CI + CodeQL + Lighthouse + deploys to Pages on merge to main
11. Verify live site updated (~1-2 min for the Actions deploy)
12. Sitemap is auto-generated by `@astrojs/sitemap` on each build — no manual update needed

### 12.2 When stuck
1. Ask Claude Code (read docs, attempt fix)
2. Read official docs for the tool/library
3. Ask Shane
4. Search GitHub issues / Stack Overflow / Discord communities

This order matters. Self-sufficiency before dependence.

### 12.3 Weekly rhythm
- **Sunday 30-min review:** What shipped this week. What's next. What's blocked.
- **At least one push per week** to keep the GitHub contribution graph alive and momentum compounding.

---

## 13. Working with Merric — interaction protocol

### 13.1 Tone
- Treat him as intelligent. He is.
- Don't dumb down. Explain in real terms with real words; provide a 1-line gloss for jargon when first introduced.
- Don't condescend. He'll notice.
- Don't moralize unprompted. He has a dad for that.

### 13.2 Process
- When he asks for a feature, walk through the plan first (1-3 sentences). Get his nod, then implement.
- Narrate what you're doing as you do it.
- Show alternatives you considered when the choice matters.
- Celebrate wins concretely ("that's a clean solution because…") — not generically ("great job!").

### 13.3 Teaching moments
- When introducing a new concept (DNS, semantic HTML, CSS specificity), explain it once, briefly, then move on. Don't lecture.
- Leave a comment in code marking learning concepts: `<!-- learning: media queries scale CSS to screen size -->`
- Suggest him doing the next similar thing himself, with you reviewing.

### 13.4 When he disagrees
- He's the owner. His call wins on style, content, and direction.
- On technical correctness or security: explain the issue clearly, recommend, but don't override. Document the disagreement if it matters.

---

## 14. Current project state

> **For the active punch list** (manual GH UI steps, Spotify Worker deploy, Pages CMS connection, Merric's account URLs, etc.) see `docs/STATUS.md`. This section captures durable project state.

### v2 (Astro 6) — landed 2026-05-01

**Shipped:**
- Astro 6.2.1 + TypeScript strict, deployed to GitHub Pages via Actions
- Six pages: `/`, `/404`, `/minecraft`, `/art`, `/youtube`, `/twitch`
- Full design system per ADR-0002 (OKLCH tokens, dark canvas, signature accent, fluid type, motion vocab, prefers-reduced-motion)
- Three-plane CMS-driven hero (image | canvas | layered) with starfield + wireframe-planet canvas presets, View Transitions, gradient veil, accent-aware glow
- Identity / Projects / FollowGrid / Footer landing sections
- Cross-site identity per ADR-0003: `<link rel="me">` chain, JSON-LD Person schema with family graph
- Self-hosted Geist Sans + Mono variable fonts (~290KB), Newsreader serif accent from Google Fonts
- SVG favicon + Web App Manifest (raster fallbacks deferred to Phase 2)
- Pages CMS schema at `.pages.yml`
- Cloudflare Worker for Spotify Now Playing in `worker/` (deployment pending — see STATUS.md)
- GitHub Actions: ci → codeql → lighthouse → deploy
- Dependabot weekly grouped patches, branch protection (when enabled by Shane)
- Playwright + axe-core 12-project test matrix (3 browsers × 4 viewports)
- Lighthouse CI gating Performance / Accessibility / Best Practices / SEO ≥ 95
- robots.txt, humans.txt, security.txt (RFC 9116), sitemap auto-generation

**Page weight on landing:** ~180KB first paint (HTML + critical CSS + JS + 1 preloaded font + avatar).

### Pending external/manual work
Tracked in detail in `docs/STATUS.md`. High-level:
- Shane: GitHub UI configuration (Pages source = Actions, Dependabot/security toggles, branch protection)
- Shane / Merric: Cloudflare account + Spotify Developer App + Worker deploy
- Merric: Pages CMS account hookup + log in at app.pagescms.org
- Merric: provide YouTube / Spotify / Discord / Steam URLs to replace placeholders in `src/data/accounts.ts`
- Future session: shanestrough.com inverse `rel="me"` + JSON-LD `children` array
- Phase 2 polish: raster favicon fallbacks, OG default image, tighter CSP, light mode tokens

### v1 → v2 cutover status
Old v1 `index.html` at repo root preserved during v2 buildout — GitHub Pages keeps serving it from the `main` branch root until the Actions-driven deploy from `dist/` takes over. Once first deploy is verified working, delete root `index.html` + root `avatar.jpg` (the v2 versions live in `public/`).

---

## 15. Versioning of this file

This file is alive. When conventions change:
1. Update the relevant section
2. Add a changelog entry below
3. Commit with `docs(claude): <what changed>`

### Public-repo redaction discipline
This file is committed to the public repo. Operational details — registrar names, hardware models, exact filesystem paths, account specifics, secret variable names, recovery procedure specifics — belong in `CLAUDE.local.md` (gitignored), not here. Re-check this list before any commit. When in doubt, move detail into `CLAUDE.local.md` and reference it from public CLAUDE.md by name only.

### Changelog
- **v1.0** — initial creation. Comprehensive standards across security, design, testing, docs, and AI utilization.
- **v1.1** — added Section 10 (Cross-site identity & family graph): authentic cross-linking conventions between merricstrough.com, shanestrough.com, and future family domains. JSON-LD Person schema with parent/sibling relationships, `rel="me"` IndieWeb conventions, footer attribution rules, anti-patterns to avoid. Renumbered subsequent sections.
- **v1.2** — Stack pivot to Astro 6 + TypeScript per ADR-0001 (`/docs/decisions/0001-adopt-astro-typescript-stack.md`). Visual direction & design system v1 per ADR-0002 (Geist Sans/Mono + Newsreader, OKLCH dark canvas with `#8b6bff` signature, View Transitions + scroll-driven CSS motion, three-plane CMS-driven hero). Family-graph implementation specifics per ADR-0003. Redaction pass for public-repo commit; operational details moved to `CLAUDE.local.md` (gitignored).
- **v1.3** — Apply ADR-0001's required CLAUDE.md updates: §3.1 stack table replaces vanilla-only description, §3.2 rewritten as "Why Astro", §3.3 v2-launch sub-route plan added, §4.1/§4.2/§4.3 reflect Astro components + token discipline + TS-strict + islands principle, §4.4 file tree updated for src/components/layouts/data/styles + public/fonts + tests + worker + .pages.yml, §6.2 lists active CI tooling (Biome / Astro check / Playwright + axe / Lighthouse CI / CodeQL / Dependabot), §11.1 budgets annotated with how Astro hits them and pointer to .lighthouserc.json, §12.1 workflow steps reflect npm dev/check/lint/test/build commands and Actions-driven deploy. §14 marked as v1-state pending a v2 rewrite.

---

*"Be quick, but don't hurry."* — John Wooden

*Built by Merric & Shane. AI-assisted by Claude. Made to last.*
