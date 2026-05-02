# merricstrough.com — product snapshot

> **What this doc is.** A comprehensive top-to-bottom snapshot of what merricstrough.com is, what it can do today, what it's wired for, and where it's going. Sits between the philosophy in [`CLAUDE.md`](../CLAUDE.md) and the operational punch list in [`STATUS.md`](STATUS.md): this is the "what we built and where it's going" document.
>
> **When to update.** When a major feature ships, when a new sub-route launches, when the family constellation grows, when scope shifts. Not on every commit (that's git history). Not on every operational change (that's `STATUS.md`).
>
> **Last updated:** 2026-05-01 (v2 launch)

---

## TL;DR

A static personal site for Merric Strough (handle: MeteoricMetric), age 13. Built like real software — Astro 6 + TypeScript strict, full design system, CI/CD with quality gates, scheduled maintenance routines, security posture appropriate for a minor's public-facing identity. v2 just shipped after a vanilla v1.

**Live:** https://merricstrough.com

---

## What's live right now

Astro 6 static site, deployed via GitHub Actions to GitHub Pages. Custom domain bound, HTTPS enforced. Built and re-deployed in ~1-2 min on every push to `main`.

### Pages serving

| Route | What it is |
|---|---|
| `/` | Landing — hero composition + identity + projects + follow grid + footer |
| `/now` | IndieWeb-convention "what I'm into right now" snapshot |
| `/minecraft` | Stub showcase page → primary CTA out to Twitch |
| `/art` | Stub showcase page → primary CTA out to Twitch |
| `/youtube` | Stub showcase page → primary CTA (YouTube link pending) |
| `/twitch` | Stub showcase page → follow on Twitch |
| `/404` | Custom 404 — same design language, "Wrong orbit" gradient headline |

Plus: `sitemap-index.xml`, `sitemap-0.xml`, `robots.txt`, `humans.txt`, `.well-known/security.txt`, web app manifest, full favicon set (SVG + 5 raster fallbacks), OG default card image.

### What a visitor sees on the landing

Top to bottom:

1. **Hero** (~92vh, full-bleed)
   - **Background plane:** Merric's avatar full-bleed with brightness/saturation mask + radial accent glow + linear fade — overlaid with a generative starfield canvas at 40% opacity (300 depth-bucketed stars drifting downward + occasional accent-purple meteor streaks every 4-7s)
   - **Type plane:** "MERRICSTROUGH" eyebrow → "Building, breaking, making." gradient-faded display headline → subhead → two CTAs ("Join the server" → /minecraft, "Watch live →" → twitch.tv)
   - **Meta plane:** Now Spinning widget slot (currently hidden — `mode: 'off'` until the Spotify Worker is deployed)
2. **Identity section** — avatar circle, eyebrow "ABOUT", tagline ("Builder. Gamer. 13. Figuring it out."), about-Merric blurb
3. **Projects section** — eyebrow "WHAT I'M WORKING ON" + "Things in flight." → grid of 3 project cards (MeteoricCraft, Twitch streams, Art) with status dots, summaries, "Updated" dates, "Visit →" pills
4. **FollowGrid** — eyebrow "FIND ME ELSEWHERE" → 6 platform pills (GitHub, Twitch, Spotify, Discord, Steam, TikTok)
5. **Footer** — "Built with my dad — shanestrough.com" attribution + © Merric Strough — MeteoricMetric — 2026 + theme toggle pill (system / light / dark cycle)

### How it looks + behaves

- **Dark canvas by default** (oklch 14% deep purple-tinted near-black) with **`#8b6bff` as the locked signature accent** — purple appears in CTA primaries, hover lifts, focus rings, the canvas glow
- **Light mode auto-flips** based on system preference (or manual toggle in the footer); brighter accent shade for legibility on light backgrounds
- **Theme toggle** persists in localStorage; no flash of wrong theme on reload (inline init script runs before first paint)
- **Geist Sans** body + **Geist Mono** for technical-density moments (eyebrows, "now spinning" track meta, captions). Self-hosted, ~290KB total
- **View Transitions** between pages (Astro 6 `<ClientRouter />`) — hero morphs across navigation
- **Reduced motion respected** — durations collapse to 0.01ms, canvas renders single static frame
- **Keyboard navigation** works — every interactive element has a visible accent focus ring at 3px offset
- **Mobile to 1920px** — fluid type via `clamp()`, container queries on cards, logical properties throughout
- **WCAG 2.2 AA** — all text colors clear 4.5:1 contrast, link underlines (no color-alone), skip-link, lang attribute, semantic HTML

---

## The systems behind it

### Stack
*(per [ADR-0001](decisions/0001-adopt-astro-typescript-stack.md))*

- **Astro 6.2.1** + **TypeScript strict mode**
- **Vanilla CSS with OKLCH design-token layer** (`src/styles/tokens.css`) — single source of truth for color, typography, spacing, radius, shadow, motion, z-index. Sub-3% browsers without OKLCH get sRGB hex fallbacks via `@supports`
- **Astro content collections** + typed JSON config files for CMS-managed content
- **Biome 2.4** for lint + format
- **Playwright + axe-core** for cross-browser + a11y tests (12-project matrix: 3 browsers × 4 viewports)
- **Lighthouse CI** gating Performance / Accessibility / Best Practices / SEO ≥ 95 on every PR

### CI/CD
- `.github/workflows/ci.yml` — lint + Astro check + build, on every push and PR
- `.github/workflows/codeql.yml` — security scan, weekly + on push (security-extended queries)
- `.github/workflows/lighthouse.yml` — perf/a11y/SEO gates on PRs
- `.github/workflows/deploy.yml` — builds dist/, uploads as Pages artifact, deploys via `actions/deploy-pages@v5`
- `.github/dependabot.yml` — weekly grouped patches, monthly major-version PRs

### Build pipeline
- `npm run build` → 7 pages built in ~2s
- Prebuild step (`scripts/optimize-images.mjs`) auto-generates AVIF + WebP siblings for any raster image in `public/hero/` (Pages CMS uploads land there)
- All CSS inlined into HTML (no render-blocking external request)
- AVIF avatar preloaded with `fetchpriority: high` (LCP optimization)

### Cross-site identity
*(per [ADR-0003](decisions/0003-cross-site-family-graph-implementation.md) + [`CLAUDE.md`](../CLAUDE.md) §10)*

- `<link rel="me">` chain in `<head>` linking 7 places (parent + 6 verified accounts)
- JSON-LD Person schema on landing only — `parent` (Shane), `sibling` (Tristan, Layne — name-only per §10.5), `sameAs` (verified accounts)
- Once `shanestrough.com` ships its inverse (snippets in [`SHANESTROUGH-INVERSE.md`](SHANESTROUGH-INVERSE.md)), the family graph validates bidirectionally via Google Rich Results + IndieWebify

### Security posture
*(per [`CLAUDE.md`](../CLAUDE.md) §5)*

- CSP via `<meta http-equiv>` (default-src self, fonts self, connect-src self + workers.dev, img-src https/data, etc.)
- 2FA TOTP on every account (account inventory in gitignored `CLAUDE.local.md`)
- CodeQL + Dependabot active
- `security.txt` for vulnerability reporting
- Branch protection rulesets ready to upload — see [`docs/rulesets/`](rulesets/) (light + strict variants)

---

## What Merric can do as the owner

### Via Pages CMS
*(once hooked up at app.pagescms.org — schema is `.pages.yml`)*

- Swap hero background mode: image only / canvas only / layered (image + canvas overlay — recommended default)
- Upload new hero image — auto-optimized to AVIF/WebP, no code change
- Pick from 4 canvas presets:
  - **starfield** (default) — meteor field nodding to the "MeteoricMetric" handle
  - **wireframe-planet** — rotating sphere with equator pulse
  - **particle-drift** — atmospheric dust with accent halos
  - **meridian-grid** — Tron-style perspective horizon
- Override hero accent color per-composition
- Edit hero headline + subhead + CTA list
- Toggle "Now Spinning" mode: live (auto from Spotify) / manual (pinned track) / off
- Edit identity tagline + blurb
- Edit /now page blurbs + updated date
- Add / edit / archive projects (markdown frontmatter — title, slug, status, summary, url, image, updated, tags, body)

### Via direct git or github.dev
*(press `.` on the repo for VSCode in the browser)*

- Add accounts to `src/data/accounts.ts` (with §5.3 review for any new platform that exposes a real name)
- Adjust design tokens
- Add new pages
- Anything else

### Via the live site as a visitor (or Merric showing it off)

- Toggle theme manually (system / light / dark cycle in the footer)
- Navigate via View Transitions (smooth cross-fade between pages, hero morphs)
- Click follow pills (rel=me identity links + traditional follows)

---

## What's wired but waiting on a human action

| Capability | Code state | Blocker |
|---|---|---|
| **Spotify Now Spinning live widget** | Worker fully written in `worker/` | Cloudflare account + Spotify dev app + OAuth capture + 3 wrangler secrets + `wrangler deploy` (~30 min). Runbook in `worker/README.md` |
| **Pages CMS form-based editing** | `.pages.yml` schema complete | Merric logs in at app.pagescms.org with GitHub, connects repo (~10 min) |
| **Branch protection on `main`** | Two ruleset JSONs in `docs/rulesets/` | Merric (admin) uploads via Settings → Rules → Rulesets (~30 sec) |
| **Family graph bidirectional validation** | Snippets ready in `docs/SHANESTROUGH-INVERSE.md` | Drop them into shanestrough.com repo (separate session) |
| **YouTube pill in FollowGrid** | Placeholder slot in `accounts.ts` | Merric provides channel URL |
| **Hero CMS image AVIF/WebP** | Build script auto-runs | Merric uploads via CMS (no manual step needed once uploaded) |

The active punch list is always in [`STATUS.md`](STATUS.md) — that's the doc to read when you're picking up where someone left off.

---

## What runs on a schedule

Three remote agents on the calendar — they run cold against the repo, report back, optionally open PRs. Manage URLs in [`STATUS.md`](STATUS.md) under "Scheduled maintenance routines."

| Routine | Cadence | Next |
|---|---|---|
| **Identity health check** | Quarterly (1st of Jan/Apr/Jul/Oct, 09:00 UTC) | 2026-07-01 |
| **Content freshness audit** | Quarterly (15th of Feb/May/Aug/Nov, 09:00 UTC) | 2026-05-15 |
| **Annual security posture review** | Yearly (May 1, v2 anniversary, 09:00 UTC) | 2027-05-01 |

---

## The future vision (deferred deliberately)

### Phase 4 — subdomain promotion
*(per [`CLAUDE.md`](../CLAUDE.md) §3.3)*

When each sub-route has enough content to justify it, extract to its own repo + subdomain.

- `minecraft.merricstrough.com` ← `merric-minecraft` repo (server status widget, build galleries, whitelist info)
- `art.merricstrough.com` ← `merric-art` repo (proper gallery, process posts, commission info if relevant)
- `youtube.merricstrough.com` / `twitch.merricstrough.com` ← may stay as DNS redirects, or graduate to richer pages

### v1.5+ polish
*(in [`STATUS.md`](STATUS.md) Phase 2 list)*

- Tighter CSP via Astro's `experimental.csp` (drops `'unsafe-inline'` once the flag stabilizes in Astro 6.x)
- Visual regression baselines locked in Playwright (currently saves screenshots, doesn't pixel-match)
- Spotify manual-mode oEmbed enrichment (parse pinned track URL → fetch real title/artist for richer display)
- A real photo gallery component for `/art` when Merric picks pieces
- Search across content (probably Pagefind — works with static sites)
- Real RSS feed for `/now` updates

### The Strough family constellation
*(per [`CLAUDE.md`](../CLAUDE.md) §10)*

- `shanestrough.com` — live, needs inverse cross-link
- `merricstrough.com` — **this site, v2 just shipped**
- `tristanstrough.com` — when Tristan is ready (currently name-only in JSON-LD)
- `laynestrough.com` — when Layne is ready (currently name-only)
- `clandestinmedia.com` + future project domains

Once 2-3 family properties exist with duplicated tokens, extract a `@strough/design` package as a shared design system across the constellation (per ADR-0001 — premature now, meaningful at scale).

### The decade-long vision
*([`CLAUDE.md`](../CLAUDE.md) mission statement)*

> Build the personal digital headquarters of Merric Strough... with the engineering rigor of SpaceX, the design soul of Awwwards, the security posture of NSA, the documentation discipline of MIT Labs, and the AI-native fluency of an Anthropic / OpenAI / Cerebras team... This is a 13-year-old's site. It is also a real piece of software, deployed to the real internet, with his real name on it. Treat both truths with equal seriousness.

The site grows with him for the next decade+. v2 is the foundation: a real design system, real CI/CD, real security posture, real cross-site identity, room for him to add features as he learns. When he's 16, he can swap the hero, add a writing section, ship a real Minecraft mod showcase. When he's 22, the design tokens still hold, the pipeline still deploys, the family graph still resolves.

---

## Numbers as of v2 launch

- **54 commits** on main (4 v1 + 50 v2)
- **7 pages** rendered, **~30KB** HTML/CSS for landing, **~290KB** font baseline, **~16KB** AVIF avatar
- **First Contentful Paint** target: < 1.5s on 4G
- **Lighthouse**: ≥ 0.95 on Performance / Accessibility / Best Practices / SEO (gated in CI)
- **Page weight on landing**: ~180KB first paint (well under the 500KB CLAUDE.md §11.1 budget)
- **3 ADRs** documenting the architectural decisions
- **3 scheduled routines** doing maintenance forever
- **2 explicit §5.3 overrides** (Steam + TikTok) documented for future sessions

---

## Doc map

| Doc | Purpose | Update cadence |
|---|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | Operating principles, design rules, AI collaboration protocol | When conventions change |
| [`docs/decisions/`](decisions/) | Architectural Decision Records (ADRs) | Append-only, when significant decisions land |
| [`docs/STATUS.md`](STATUS.md) | Living "where we left off" + active punch list | Every session that touches the repo |
| [`docs/PRODUCT.md`](PRODUCT.md) | This file — what we built + where it's going | When a major feature ships |
| [`docs/SHANESTROUGH-INVERSE.md`](SHANESTROUGH-INVERSE.md) | Handoff snippets for the cross-repo session | When the cross-link spec changes |
| [`docs/rulesets/`](rulesets/) | Branch protection ruleset JSONs + README | When required-status-check workflow names change |
| `CLAUDE.local.md` (gitignored) | Operational details — registrar, hardware, secret variable names | When operational reality changes |
