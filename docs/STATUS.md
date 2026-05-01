# Session resume — merricstrough.com v2

> **Living doc.** Update on the way out of every session so the next session (Claude or human) can pick up cold without context loss.
> Last updated: 2026-05-01 by Claude (Shane operating)

---

## Where we are

v2 redesign **complete in repo, 22 commits on local `main`, push pending Shane's collaborator-invite acceptance** (see Section "Push blocker" below). Once push lands, GitHub Actions auto-deploys the new site within ~1-2 min and v1 → v2 cutover happens silently.

Build: `npm run build` produces 6 pages in ~2s (`/`, `/404`, `/minecraft`, `/art`, `/youtube`, `/twitch`) plus `sitemap-index.xml` + `sitemap-0.xml`.
Lint: `npm run lint` — 0 errors, 0 warnings.
Typecheck: `npm run check` — 0 errors, 0 warnings, 11 deprecation hints (non-blocking, from `astro:content`'s zod re-export).
Page weight on landing: ~180KB first paint (well under the 500KB budget per CLAUDE.md §11.1).

ADRs accepted and committed: `docs/decisions/0001-adopt-astro-typescript-stack.md`, `0002-visual-direction-and-design-system-v1.md`, `0003-cross-site-family-graph-implementation.md`.

---

## Push blocker — needs Shane action

The 22 local commits can't push because `shane-thomas-strough` doesn't have Write access on `MeteoricMetric/MeteoricMetric.github.io` yet. Two possible reasons:

**1. Collaborator invitation pending acceptance.** GitHub sends an email + in-app notification when a collaborator is added; the invitee must accept it before the access takes effect.
- Visit https://github.com/notifications OR check email from `noreply@github.com`
- OR go directly to https://github.com/MeteoricMetric/meteoricmetric.github.io/invitations and accept

**2. Stale cached credentials.** If you accepted the invite but push still fails:
- On Windows, open "Credential Manager" (search in Start menu) → Windows Credentials → look for `git:https://github.com` entries → remove them
- Next `git push` will re-prompt for auth and Git Credential Manager will mint fresh credentials

After either fix, retry: `git push origin main` from `C:\Users\shane\merricstrough-com`. Should succeed.

---

## To unblock the live deploy (Shane — UI-only, ~10 min total, AFTER push works)

1. **GitHub Pages source.** Repo → Settings → Pages → "Build and deployment" → Source: **GitHub Actions** (NOT "Deploy from a branch"). The `deploy.yml` workflow won't publish without this.
2. **Verify custom domain stays bound** after the first Actions deploy: Settings → Pages still shows `merricstrough.com`, "Enforce HTTPS" checked. (Should stick automatically because `public/CNAME` is in every build.)
3. **Dependabot alerts + security updates ON.** Settings → Code security → both toggles ON.
4. **Private vulnerability reporting ON.** Settings → Code security → enable. (This is what `.well-known/security.txt`'s contact URL points at.)
5. **Branch protection on `main`** (per CLAUDE.md §5.2 "when project matures"). Settings → Branches → Add rule for `main`: require PR before merging, require status checks `verify` (CI) + `analyze (javascript-typescript)` (CodeQL) + `audit` (Lighthouse), require branches up to date.
6. **Watch the first deploy.** Actions tab → first push triggers ci, codeql, deploy. Lighthouse runs only on PRs, not first push. Expect ~1-2 min to live.

After step 1 succeeds, every push to `main` deploys automatically.

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

## Phase 2 polish (any future session, no blockers)

- [ ] **Raster favicon fallbacks** for Safari iOS + very-old browsers: generate `apple-touch-icon.png` (180×180), `favicon.ico`, `icon-192.png`, `icon-512.png` (maskable) from the existing `favicon.svg`. Add a `npm run favicons` script using `sharp` (already a transitive dep via Astro). Re-add the corresponding `<link>` lines in `BaseHead.astro` (currently behind a TODO comment).
- [ ] **OG default image** at `public/og-default.png` (1200×630). Currently social cards work but show no preview image. Options: hand-make a branded one in any image editor, OR programmatic generation via `@vercel/og` / `astro-og-canvas`. Should match the dark canvas + Geist headline + accent.
- [ ] **Tighten CSP.** Currently no Content-Security-Policy meta tag at all. Astro 6 has `experimental.csp` with auto-hashed inline scripts/styles — try enabling it. Fallback: add a permissive meta tag with `'unsafe-inline'` for scripts/styles + `connect-src` allowlist for the Spotify Worker.
- [ ] **Delete `index.html` + `avatar.jpg` from repo root** once the first GitHub Actions deploy is verified working. They're v1 holdovers; Astro builds replacements into `dist/`. Defer until v2 is confirmed live to avoid taking the live site dark mid-cutover.
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
