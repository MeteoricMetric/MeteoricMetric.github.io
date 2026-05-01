# merricstrough-now-playing

Cloudflare Worker that powers the **Now Spinning** widget on the hero meta plane of [merricstrough.com](https://merricstrough.com) (per ADR-0001 stack table; ADR-0002 hero composition).

Single endpoint: `GET /api/now-playing` -> JSON describing what Merric is currently playing on Spotify.

## Architecture

```
Astro client (merricstrough.com)
    |
    | GET /api/now-playing  (cached at Cloudflare edge for ~30s)
    v
Cloudflare Worker  ---  caches.default  (Spotify access token, ~50min TTL per PoP)
    |
    | refresh_token grant + Bearer-auth GET /me/player/currently-playing
    v
Spotify Web API
```

**Why pure-fetch (no Hono):** one route, no middleware, no router needed. Zero runtime dependencies = smaller supply-chain surface (CLAUDE.md S5.1). Hono is excellent when you have 5+ routes or need middleware composition; we have neither.

**Why Workers Cache API (not KV) for the access token:** Cache API is per-edge, but tokens are tiny + cheap to refresh on miss. Spotify tolerates many refresh-token redemptions, and a 30s `Cache-Control` on the response itself means most requests never touch this Worker at all. KV would add a global namespace + writes-per-second limits + eventual-consistency reads for no real benefit. (See `src/index.ts` doc comment for the full rationale.)

**Why ES module format (`export default { fetch }`):** modern Workers standard since 2022. Service-worker format is legacy.

## One-time setup

### 1. Spotify Developer App

1. Sign in to <https://developer.spotify.com/dashboard> with **Merric's Spotify account** (this is whose listening data we'll be reading).
2. **Create app**:
   - Name: `merricstrough.com Now Playing`
   - Redirect URI: `http://127.0.0.1:8888/callback`  (loopback IP, not `localhost` -- Spotify deprecated `http://localhost`)
   - Which API: **Web API**
3. Copy the **Client ID** and **Client Secret**.

### 2. Cloudflare account

1. Sign up at <https://dash.cloudflare.com/sign-up> (free tier covers this Worker forever).
2. Enable 2FA (per CLAUDE.md S5.2 -- TOTP, not SMS).
3. Install the Wrangler CLI: handled via `npm install` in this directory.

### 3. Install deps + auth to Cloudflare

```powershell
cd C:\Users\shane\merricstrough-com\worker
npm install
npx wrangler login   # opens browser to authenticate Wrangler against your Cloudflare account
```

### 4. Capture the refresh token (one-time OAuth flow)

```powershell
cd C:\Users\shane\merricstrough-com\worker
$env:SPOTIFY_CLIENT_ID = "<paste from Spotify dashboard>"
$env:SPOTIFY_CLIENT_SECRET = "<paste from Spotify dashboard>"
npm run auth
```

This will:
- Open your browser to Spotify's authorize page (scopes: `user-read-currently-playing`, `user-read-playback-state`)
- Receive the callback at `http://127.0.0.1:8888/callback`
- Print the refresh token to your terminal

**Copy that refresh token immediately** -- the next step needs it.

### 5. Store the three secrets in Wrangler

```powershell
cd C:\Users\shane\merricstrough-com\worker
npx wrangler secret put SPOTIFY_CLIENT_ID
# (paste the client id when prompted)

npx wrangler secret put SPOTIFY_CLIENT_SECRET
# (paste the client secret when prompted)

npx wrangler secret put SPOTIFY_REFRESH_TOKEN
# (paste the refresh token from step 4 when prompted)
```

Secrets live in Cloudflare's secret store -- never in `wrangler.toml`, never in this repo (CLAUDE.md S5.2).

### 6. Deploy

```powershell
cd C:\Users\shane\merricstrough-com\worker
npx wrangler deploy
```

Deploys to `https://merricstrough-now-playing.<your-account-subdomain>.workers.dev`.

### 7. Test

```powershell
curl https://merricstrough-now-playing.<your-account-subdomain>.workers.dev/api/now-playing
```

Expected shapes:
- Nothing playing: `{"isPlaying":false}`
- Track playing:
  ```json
  {
    "isPlaying": true,
    "title": "...",
    "artist": "...",
    "album": "...",
    "albumImageUrl": "https://i.scdn.co/...",
    "songUrl": "https://open.spotify.com/track/...",
    "progressMs": 12345,
    "durationMs": 234000
  }
  ```

The Worker URL goes into `src/data/spotify-config.ts` in the main Astro project (you don't need to create that file -- the main project will add it).

## Local development

```powershell
cd C:\Users\shane\merricstrough-com\worker
npx wrangler dev
```

Serves at `http://localhost:8787`. Wrangler will prompt to bind your local secrets -- you can either:
- Use `.dev.vars` (gitignored) with `SPOTIFY_CLIENT_ID=...` etc., OR
- Pull the production secrets via `npx wrangler secret list` and `wrangler secret bulk` (advanced).

## Operations

- **Live logs:** `npm run tail` (or `npx wrangler tail`).
- **Observability dashboard:** Cloudflare Dashboard -> Workers & Pages -> `merricstrough-now-playing` -> Observability tab.
- **Rotating Spotify secrets:** repeat steps 4 + 5 with a new app or the same app's regenerated client secret. Re-deploy is automatic -- secrets propagate within ~30 seconds.

## Custom domain (later)

Currently the Worker is reachable at its `*.workers.dev` URL. To bind it to e.g. `api.merricstrough.com`, the `merricstrough.com` zone would need to live on this Cloudflare account (it's currently on Porkbun -> GitHub Pages per `CLAUDE.local.md` S1). Two paths when we want a custom hostname:

1. **Move DNS to Cloudflare** and uncomment the `[[routes]]` block in `wrangler.toml`.
2. **Keep the workers.dev URL** and reference it directly from the Astro site config.

Path 2 is the v1 plan -- re-evaluate at v1.5.

## Files

| File | Purpose |
|---|---|
| `package.json` | Pinned Wrangler + TS + types |
| `wrangler.toml` | Worker config (no secrets) |
| `tsconfig.json` | Strict TS, ES2022, Workers types |
| `src/index.ts` | The Worker -- single `/api/now-playing` route |
| `src/auth-helper.ts` | One-time Node script to capture refresh token |
| `.gitignore` | `node_modules`, `.wrangler`, `.dev.vars`, `.env*` |

## Caveats / things to verify at deploy time

- **Wrangler version:** `package.json` pins `wrangler ^4.20.0`. If a newer Wrangler ships with a breaking config change before deploy, bump explicitly and re-test.
- **`compatibility_date`:** set to `2026-04-01`. Review the [compatibility-date changelog](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) before bumping.
- **Spotify API stability:** the `/me/player/currently-playing` endpoint and refresh-token grant are stable as of the training cutoff, but verify status at <https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track> before first deploy.
- **Redirect URI strictness:** Spotify enforces an EXACT match between the redirect URI registered in the dashboard and the one passed in the OAuth flow. `http://127.0.0.1:8888/callback` -- character-perfect, no trailing slash.

## References

- ADR-0001: stack table -- Cloudflare Worker row, "Lee Robinson canonical pattern (or 2026 equivalent)"
- ADR-0002: hero composition meta plane houses the Now Spinning widget
- CLAUDE.md S5: threat model + secret discipline applies to this Worker
- CLAUDE.local.md S6: Spotify setup operational details (gitignored)
- Reference repos: <https://github.com/denizcdemirci/worker-spotify>, <https://github.com/akellbl4/spotify-playback-worker>
