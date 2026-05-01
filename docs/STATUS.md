# Session resume — merricstrough.com v2

> **Living doc.** Update on the way out of every session so the next session (Claude or human) can pick up cold without context loss.
> Last updated: 2026-05-01 by Claude (Shane operating, post-power-cycle)

---

## Where we are

**🚀 v2 IS LIVE at https://merricstrough.com.** Verified via curl — landing renders the Astro hero, Identity, Projects, FollowGrid, Footer. Last-Modified timestamps confirm fresh deploy.

26 commits on `origin/main`. All three core workflows green on the latest commit:
- ✅ CI (Lint + Astro check + build)
- ✅ CodeQL (security scan)
- ✅ Deploy to GitHub Pages (publishes dist/ via deploy-pages action)

⚠️ The legacy `pages build and deployment` workflow keeps failing on every push — see "Pages source still on legacy" below for the one-click fix.

Build: `npm run build` produces 6 pages in ~2s (`/`, `/404`, `/minecraft`, `/art`, `/youtube`, `/twitch`) plus `sitemap-index.xml` + `sitemap-0.xml`.
Lint: `npm run lint` — 0 errors, 0 warnings.
Typecheck: `npm run check` — 0 errors, 0 warnings, 11 deprecation hints (non-blocking, from `astro:content`'s zod re-export).
Page weight on landing: ~180KB first paint (well under the 500KB budget per CLAUDE.md §11.1).

ADRs accepted and committed: `docs/decisions/0001-adopt-astro-typescript-stack.md`, `0002-visual-direction-and-design-system-v1.md`, `0003-cross-site-family-graph-implementation.md`.

---

## Pages source still on legacy — Shane UI flip (~30 seconds)

GitHub Pages still has source = "branch: main, path: /" (the v1 default). The Actions deploy workflow publishes correctly anyway because `deploy-pages@v4` overrides the source via the artifact API. But the LEGACY `pages build and deployment` workflow auto-runs on every push, tries to Jekyll-parse the `.astro` files, fails noisily, and clutters the Actions tab with red badges.

**One-click fix:** Settings → Pages → "Build and deployment" → Source: **GitHub Actions** (not "Deploy from a branch"). Save. Done. Legacy workflow stops, Actions deploy is now the canonical publisher.

While in Settings → Pages, also flip:
- **"Enforce HTTPS"** to ON. Currently `https_enforced: false` per the Pages API; cert is approved through 2026-07-18 so HTTPS works, just not enforced.

I tried to do these via the GitHub API (`gh api -X PUT repos/.../pages -f build_type=workflow`) but got 404 — my OAuth token doesn't have the Pages-admin scope. UI is the simplest path.

---

## Other Shane UI tasks (~5 min total)

3. **Dependabot alerts + security updates ON.** Settings → Code security → both toggles ON.
4. **Private vulnerability reporting ON.** Settings → Code security → enable. (`.well-known/security.txt` contact URL routes here.)
5. **Branch protection on `main`** (per CLAUDE.md §5.2 "when project matures"). Settings → Branches → Add rule for `main`: require PR before merging, require status checks `verify` (CI) + `analyze (javascript-typescript)` (CodeQL) + `audit` (Lighthouse), require branches up to date.

---

## Merric's homework (whenever ready, ~20 min)

External account URLs to drop into `src/data/accounts.ts` (replace the `// TODO(merric-info)` placeholders + flip `verified: true` after confirming the platform display name doesn't expose his real last name per CLAUDE.md §5.3):

- [ ] **YouTube** channel URL — currently `https://www.youtube.com/@TODO`
- [ ] **Spotify profile** URL (separate from the Now Playing OAuth) — currently `https://open.spotify.com/user/TODO`
- [ ] **Discord** invite — currently `https://discord.gg/TODO` (skip if no community server yet)
- [ ] **Steam profile** — currently `https://steamcommunity.com/id/TODO` (skip if you don't want to surface gaming)
- [ ] Any others to surface (TikTok / Instagram / Bluesky / Mastodon / itch.io)?

When verified URLs land:
- They auto-flow into `<link rel="me">` chain in `<head>` and JSON-LD `sameAs` array (via the `verifiedAccounts` filter)
- Anything with `showInFollow: true` shows up in the FollowGrid pill cluster on the landing
- Update `src/components/PersonSchema.astro` if the canonical avatar / description copy changes

---

## Spotify Now Playing — deploy the Worker (~30 min, needs Cloudflare + Spotify accounts)

Code is fully written in `worker/` and ready to deploy. Steps (full runbook in `worker/README.md`):

1. **Create Cloudflare account** at dash.cloudflare.com if Shane doesn't have one. Free tier covers Workers forever for our usage. Enable TOTP 2FA per CLAUDE.md §5.2.
2. **Create Spotify Developer App** at https://developer.spotify.com/dashboard logged in as Merric. Name: "merricstrough.com Now Playing". Required scopes: `user-read-currently-playing user-read-playback-state`. Redirect URI: **`http://127.0.0.1:8888/callback`** (Spotify deprecated `http://localhost`). Save the Client ID + Client Secret.
3. **One-time OAuth capture.** From `worker/`: `npx tsx src/auth-helper.ts` (after `npm install` in `worker/`). Browser opens, log in with Merric's Spotify, capture the refresh_token printed to the console.
4. **Wrangler login + secrets.** From `worker/`: `npx wrangler login`, then `npx wrangler secret put SPOTIFY_CLIENT_ID`, `npx wrangler secret put SPOTIFY_CLIENT_SECRET`, `npx wrangler secret put SPOTIFY_REFRESH_TOKEN` (paste each when prompted).
5. **Deploy.** `npx wrangler deploy`. Worker URL prints — looks like `https://merricstrough-now-playing.<account>.workers.dev`.
6. **Wire it in.** Edit `src/components/NowSpinning.astro` line ~22: change `const SPOTIFY_WORKER_URL: string | undefined = undefined;` to `const SPOTIFY_WORKER_URL = 'https://merricstrough-now-playing.<account>.workers.dev/api/now-playing';`. Then edit `src/content/now-spinning.json` and flip `"mode": "off"` to `"mode": "live"`. Commit + push. Live in ~1-2 min.

After this lands, the hero meta plane shows what Merric is actually listening to (auto-updates every 30s). Update `CLAUDE.local.md` §6 with the actual Worker URL once deployed.

---

## Pages CMS hookup (~10 min, needs Merric's GitHub login)

1. Go to https://app.pagescms.org and log in as Merric (GitHub OAuth).
2. **Connect repo** `MeteoricMetric/MeteoricMetric.github.io`.
3. Pages CMS auto-detects `.pages.yml` at the repo root and renders the form UI. Verify all fields appear:
   - Hero (background mode, image, canvas preset, accent override, headline, subhead, CTAs)
   - Now Spinning (mode, manual track URL)
   - Identity (tagline, blurb)
   - Projects (collection of markdown entries)
4. Test the cycle: Merric edits hero headline → Save → check git history shows the commit on `main` → GitHub Actions builds and deploys → live in ~1-2 min.
5. **Document the admin URL** in `CLAUDE.local.md` §8 (already has placeholder).

If something doesn't work, fall back to **github.dev** — press `.` while viewing the repo on github.com to get a full VSCode in the browser, edit any file directly, commit, push.

---

## Cross-repo follow-up — shanestrough.com inverse (separate session)

Per CLAUDE.md §10.3 + ADR-0003, `shanestrough.com` needs the inverse cross-link to fully validate the family graph:

1. Add `<link rel="me" href="https://merricstrough.com">` to `shanestrough.com`'s `<head>`.
2. Add JSON-LD Person schema with a `children: [...]` array (Merric, Tristan, Layne — name only for the brothers per §10.5).
3. Submit `shanestrough.com`'s sitemap to Google Search Console under that property too.
4. Validate both directions via https://indiewebify.me — should resolve cleanly once both sides ship.

Do this in the `shanestrough-com` repo (separate Claude session). The exact JSON-LD body is specified in ADR-0003 §What is NOT in v2.

---

## Post-launch verification (Shane runs after first deploy)

1. **Open https://merricstrough.com** in fresh incognito. Should be the new dark-canvas landing with the starfield over the avatar.
2. **Lighthouse in Chrome DevTools.** Performance / Accessibility / Best Practices / SEO should all be ≥ 95. If any miss, check the Lighthouse CI report in the latest GitHub Actions run for specifics.
3. **Google Rich Results Test:** https://search.google.com/test/rich-results — paste merricstrough.com. Should detect Person schema with parent + sibling fields.
4. **IndieWebify.me:** https://indiewebify.me — paste merricstrough.com. `rel="me"` checks pass for the verified accounts. Inverse will only pass after the shanestrough.com follow-up above.
5. **Submit sitemap to Google Search Console** under the `merricstrough.com` property: `https://merricstrough.com/sitemap-index.xml`.
6. **Cross-browser check.** Open in Firefox, Safari (or Webkit via Playwright). Verify hero canvas + view transitions + fonts load. Resize from 320px → 1920px to verify layout.

---

## Open Dependabot PRs (rebase queued, awaiting CI)

Six action-version major bumps opened immediately after first push. All commented `@dependabot rebase` to pick up the typecheck + lint fixes that landed on main after the PRs were created. Once Dependabot rebases (~5-10 min), CI re-runs. Expected outcome:

| PR | Bump | Risk | Action |
|----|------|------|--------|
| #1 | `actions/setup-node` 4 → 6 | Low | Merge if green |
| #2 | `github/codeql-action` 3 → 4 | Low | Merge if green |
| #3 | `actions/checkout` 4 → 6 | Low | Merge if green |
| #4 | `actions/upload-pages-artifact` 3 → 5 | Med (2-major jump; works as a set with #5/#6) | Merge as a trio if all green |
| #5 | `actions/configure-pages` 5 → 6 | Med | Merge as part of trio |
| #6 | `actions/deploy-pages` 4 → 5 | Med | Merge as part of trio |
| ~~#7~~ | ~~typescript 5.9.3 → 6.0.3~~ | High (major; Astro 6 tsconfig presets target TS 5.x) | Closed via `@dependabot ignore this major version` |

To merge once green: `gh pr merge <num> -R MeteoricMetric/MeteoricMetric.github.io --merge` (or `--squash` if you prefer flatter history).

---

## Phase 2 polish (any future session, no blockers)

Items marked ✓ landed during this session.

- ✓ **Raster favicon fallbacks** — `npm run favicons` generates apple-touch-icon (180), favicon-16, favicon-32, icon-192, icon-512 PNGs from `public/favicon.svg` via sharp. BaseHead wires them all.
- ✓ **OG default image** — `npm run og` composes a 1200×630 PNG with brand mark + headline + tagline. ~93KB. BaseHead references `/og-default.png`.
- ✓ **Baseline CSP** via `<meta http-equiv>` — restricts default-src to self, fonts to self+Google Fonts, connect-src to self + workers.dev (for Spotify), upgrades insecure requests.
- [ ] **Tighten CSP further.** Current CSP allows `'unsafe-inline'` for scripts + styles because Astro 6 ships scoped `<style>` + view-transition `<script>` inline. Astro 6 has `experimental.csp` with auto-hashed inline assets — try enabling it to drop unsafe-inline.
- [ ] **Delete `index.html` + `avatar.jpg` from repo root** — v1 holdovers, no longer served (Actions deploy wins). Safe to remove now that v2 is verified live.
- [ ] **Light mode tokens** per ADR-0002 §Open items. Add `prefers-color-scheme: light` overrides to `tokens.css`, expand `data-theme` toggle.
- [ ] **Visual regression baselines** — Playwright `tests/visual.spec.ts` currently saves screenshots but doesn't pixel-match. Lock in baselines once the design is confirmed; turn on `expect(page).toHaveScreenshot()` assertions.
- [ ] **Hero canvas third + fourth presets** — `particle-drift` and `meridian-grid` per ADR-0002 §Hero composition. Currently shipping just `starfield` + `wireframe-planet`.
- [ ] **Spotify Now Playing — `manual` mode visual polish** — currently shows "Pinned track on Spotify →" with no track metadata. Could parse the Spotify URL → fetch oembed at build time → render real title/artist for pinned tracks.
- [ ] **Quarterly link-rot check** for the family graph (CLAUDE.md §10.6 step 4) — schedule a recurring `/loop` agent or GitHub Action.

---

## Open architectural questions parked for later

- **Monorepo extraction** — once `tristanstrough.com`, `laynestrough.com`, or a sibling subdomain repo lands, extract `@strough/design` package with the token layer, components, and rel=me/JSON-LD primitives. Premature now; meaningful when the second property ships.
- **Subdomain promotion** — Phase 4 work per CLAUDE.md §3.3. When `/minecraft` content depth justifies, extract to its own repo + `minecraft.merricstrough.com` subdomain. Same for art / youtube / twitch.
- **Server Islands** for personalization — Astro 6 supports them. No use case yet; revisit when there's a "logged-in friends-of-the-server" experience or similar.
- **AI-native chat surface** — the brand mission references AI-native fluency. Could surface a Claude-powered "ask Merric anything" or project Q&A widget in v1.5+.

---

## Important file locations

- ADRs: `docs/decisions/`
- Operating doc (public): `CLAUDE.md`
- Operational details (gitignored, local only): `CLAUDE.local.md`
- Pages CMS schema: `.pages.yml`
- Design tokens: `src/styles/tokens.css`
- Family graph data: `src/data/family.ts`
- External accounts: `src/data/accounts.ts` (← Merric's homework lands here)
- Hero composition content: `src/content/hero.json`
- Spotify Worker: `worker/`
- Tests: `tests/` + `playwright.config.ts`
- CI workflows: `.github/workflows/`
- This file: `docs/STATUS.md`

---

## How to update this file

When you finish a chunk of work, update the relevant section here AND bump the "Last updated" line at the top. The goal is that anyone (Claude or human) can read this doc and know exactly what's done, what's next, and what's blocked, without spelunking through git log.
