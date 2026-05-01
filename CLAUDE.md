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

### 3.1 Current stack
- **Frontend:** Static HTML5, modern CSS (custom properties, grid, flexbox). No framework.
- **Hosting:** GitHub Pages (free, fast, version-controlled deploys via push)
- **Domain / DNS:** Porkbun (apex `merricstrough.com`)
- **TLS:** Let's Encrypt via GitHub Pages (auto-renewed)

### 3.2 Why no framework (yet)
React/Vue/Svelte are powerful but they're not the right tool for a personal site of <10 pages. They add build complexity, slow first-paint, and obscure how the web actually works. Merric should learn HTML/CSS/JS fundamentals first. We graduate to a framework when there's a real reason — not before.

### 3.3 Future architecture
Subdomains will live in their own repos to keep concerns separated and deploys independent:
- `merricstrough.com` ← this repo
- `minecraft.merricstrough.com` ← `merric-minecraft` repo
- `art.merricstrough.com` ← `merric-art` repo
- `youtube.merricstrough.com`, `twitch.merricstrough.com` ← may be DNS redirects, not full sites

### 3.4 The Minecraft subsystem (separate but related)
The Minecraft server runs on a home workstation under Docker (Paper + Geyser + Floodgate), exposed via a tunnel service (operational specifics in `CLAUDE.local.md`). The minecraft subdomain page is a static frontend; the server itself is operational infrastructure documented in its own repo. Don't conflate them.

---

## 4. Coding standards

### 4.1 HTML
- Semantic tags always. `<main>`, `<nav>`, `<article>`, `<section>`, `<header>`, `<footer>`. Never `<div>` when a real element exists.
- Every `<img>` has descriptive `alt` text. Decorative images get `alt=""`.
- Lang attribute on `<html>`. Viewport meta tag. Title and description on every page.
- Heading hierarchy is strict: one `<h1>` per page, no skipped levels.
- Forms (when added): proper labels, fieldsets, ARIA where needed.

### 4.2 CSS
- Mobile-first. Base styles target small screens; media queries scale up.
- Custom properties (CSS variables) for design tokens — colors, spacing, typography. No magic numbers.
- Logical properties where supported (`margin-block`, `padding-inline`).
- Avoid `!important`. If you need it, you've structured selectors wrong.
- Animations use `prefers-reduced-motion` to respect accessibility.
- No CSS-in-JS, no Tailwind in this project (yet) — keep it learnable.

### 4.3 JavaScript (when introduced)
- Vanilla JS until proven we need a framework
- ES modules, `const` by default, arrow functions where they read better
- No global state. No `var`. No `==` (only `===`).
- Strict null checking discipline — if it can be undefined, handle it.
- Comment intent, not implementation. Code says *what*, comments say *why*.

### 4.4 File organization
```
/
├── index.html              # main landing page
├── /pages/                 # additional top-level pages
├── /assets/
│   ├── /img/               # images, optimized
│   ├── /fonts/             # self-hosted fonts (privacy, perf)
│   └── /icons/             # SVG icons
├── /css/                   # stylesheets when externalized
├── /js/                    # scripts when needed
├── /docs/                  # project documentation
│   └── /decisions/         # architectural decision records
├── CNAME                   # GitHub Pages custom domain lock
├── robots.txt              # search engine directives
├── sitemap.xml             # SEO sitemap
├── README.md               # public-facing project description
└── CLAUDE.md               # this file (instructions for AI)
```

### 4.5 Naming conventions
- Files: `kebab-case.html`, `kebab-case.css`
- CSS classes: `kebab-case` (BEM if components grow complex)
- IDs: avoid for styling; use for anchors and form labels only
- JS: `camelCase` for variables/functions, `PascalCase` for classes/constructors, `SCREAMING_SNAKE` for true constants

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
- **Visual** — every change is loaded in a browser before commit. Mobile viewport (375px), tablet (768px), desktop (1280px).
- **Cross-browser** — Chrome, Firefox, Safari (or Webkit). Edge inherits from Chrome.
- **Accessibility** — keyboard navigation works on every interactive element. Screen reader announcement makes sense (test with VoiceOver or NVDA quarterly).
- **Performance** — Lighthouse score ≥ 95 on Performance, Accessibility, Best Practices, SEO for the production build.
- **Link integrity** — internal and external links verified after page changes.

### 6.2 What we automate (over time)
- HTML validation (`html-validate` or similar) in CI
- CSS lint (Stylelint)
- Lighthouse CI on PRs
- Dead link checker (Lychee) on a schedule
- Image optimization check (no images > 200KB without justification)

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
- **Time to First Byte:** < 200ms
- **Largest Contentful Paint:** < 1.5s on 4G
- **Total Blocking Time:** < 200ms
- **Cumulative Layout Shift:** < 0.05
- **Total page weight:** < 500KB for landing pages, < 1MB for content pages

### 11.2 Discipline
- Images: WebP/AVIF where supported, with fallbacks. Lazy-load below the fold.
- Fonts: `font-display: swap`, preload critical faces, subset where possible.
- CSS: critical inline, rest async.
- JavaScript: defer or async by default. Never block rendering.

---

## 12. Workflow

### 12.1 Day-to-day
1. Pull latest: `git pull`
2. Make change with Claude Code
3. Visual + Lighthouse smoke test in browser
4. Stage: `git status`, then `git add` (be selective — never `git add .` blindly)
5. Commit: clear message in conventional format
6. Push: `git push`
7. Verify live site updated (~30 sec on GitHub Pages)
8. Update sitemap if page count or content changed

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

**As of last update to this file:**
- ✅ Domain registered (WHOIS privacy on, auto-renew on)
- ✅ GitHub account created with 2FA, recovery codes stored offline
- ✅ Repo `meteoricmetric.github.io` exists
- ✅ Pages deployed at https://merricstrough.com (custom domain, HTTPS enforced)
- ✅ Initial `index.html` live with avatar and three nav links
- ✅ `CNAME` file present
- ✅ Local git config scoped to Merric's identity (commits attribute correctly)

**Next up:**
- [ ] `robots.txt`
- [ ] `sitemap.xml`
- [ ] Open Graph + Twitter card meta tags on index
- [ ] JSON-LD Person schema with family graph (per Section 10.3)
- [ ] Footer attribution to shanestrough.com with `rel="me"` (per Section 10.3)
- [ ] Inverse `rel="me"` and JSON-LD updates on shanestrough.com
- [ ] Validate via Google Rich Results Test + IndieWebify.me
- [ ] Favicon set (16, 32, 180 apple-touch, 192, 512)
- [ ] Lighthouse pass — confirm 95+ across all four
- [ ] Spin up `minecraft.merricstrough.com` repo and basic landing page
- [ ] Stand up Paper + Geyser + Floodgate Minecraft server in Docker
- [ ] Wire `mc.merricstrough.com` to playit.gg tunnel

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
- **v1.2** — Stack pivot to Astro 6 + TypeScript per ADR-0001 (`/docs/decisions/0001-adopt-astro-typescript-stack.md`). Visual direction & design system v1 per ADR-0002 (Geist Sans/Mono + Newsreader, OKLCH dark canvas with `#8b6bff` signature, View Transitions + scroll-driven CSS motion, three-plane CMS-driven hero). Family-graph implementation specifics per ADR-0003. Redaction pass for public-repo commit; operational details moved to `CLAUDE.local.md` (gitignored). CLAUDE.md §3-§4 / §6.2 / §11 / §12.1 will be updated in a follow-up commit to reflect the chosen stack — that diff is specified in ADR-0001's "Required CLAUDE.md updates" section.

---

*"Be quick, but don't hurry."* — John Wooden

*Built by Merric & Shane. AI-assisted by Claude. Made to last.*
