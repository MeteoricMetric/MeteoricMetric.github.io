/**
 * merricstrough-now-playing — Cloudflare Worker
 *
 * Endpoint: GET /api/now-playing
 * Powers the "Now Spinning" widget on the hero meta plane (ADR-0002).
 *
 * Architecture:
 *   1. Refresh-token OAuth flow against accounts.spotify.com.
 *   2. Access tokens (60-min lifetime) are cached in Workers Cache API at the
 *      edge for ~50 minutes — see ACCESS_TOKEN_TTL_SECONDS below.
 *   3. Currently-playing payload from api.spotify.com is normalized into a
 *      stable, minimal JSON shape (NowPlayingResponse) for the Astro client.
 *   4. ALL failure paths return `{ isPlaying: false }` — never a 5xx — so the
 *      widget gracefully degrades to "nothing playing" if Spotify is down.
 *
 * Why Cache API and not KV for the access token?
 *   - Cache API is per-edge (per-PoP). Tokens are tiny + safe to refetch on a
 *     cache miss in a new region; the marginal cost of N refresh calls per day
 *     across PoPs is negligible vs. the operational complexity of a global
 *     KV namespace + writes-per-second limits + eventual-consistency reads.
 *   - At a 30s public Cache-Control on the response itself, most requests
 *     never reach this Worker at all — Cloudflare's edge cache absorbs them.
 *   - KV would be the right call only if we needed strict global single-fetch
 *     semantics, which we don't: Spotify allows many refresh-token redemptions.
 *
 * Security notes (per CLAUDE.md §5):
 *   - Secrets only via `wrangler secret put` — never wrangler.toml `vars`.
 *   - CORS is an explicit allowlist; no wildcard origins.
 *   - No request body is parsed (GET-only); no user input reaches Spotify.
 *   - Errors are logged server-side via console.warn/error (Cloudflare ships
 *     these to observability) but never echoed to the client.
 */

// ---------------------------------------------------------------------------
// Environment binding (typed)
// ---------------------------------------------------------------------------

export interface Env {
  /** Spotify Developer App client ID. Set via `wrangler secret put`. */
  readonly SPOTIFY_CLIENT_ID: string;
  /** Spotify Developer App client secret. Set via `wrangler secret put`. */
  readonly SPOTIFY_CLIENT_SECRET: string;
  /** OAuth refresh token captured by src/auth-helper.ts. Set via `wrangler secret put`. */
  readonly SPOTIFY_REFRESH_TOKEN: string;
}

// ---------------------------------------------------------------------------
// Public response contract — what the Astro widget consumes
// ---------------------------------------------------------------------------

export interface NowPlayingResponse {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Spotify API response types (minimal — we only model what we read)
// ---------------------------------------------------------------------------

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  // refresh_token is sometimes rotated and returned; we ignore it — the
  // initial refresh token from the OAuth flow remains valid for our use case.
  refresh_token?: string;
}

interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

interface SpotifyArtist {
  name: string;
  external_urls?: { spotify?: string };
}

interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
}

interface SpotifyShow {
  name: string;
  images: SpotifyImage[];
}

interface SpotifyTrack {
  name: string;
  duration_ms: number;
  external_urls: { spotify?: string };
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

interface SpotifyEpisode {
  name: string;
  duration_ms: number;
  external_urls: { spotify?: string };
  show: SpotifyShow;
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing: boolean;
  progress_ms: number | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
  item: SpotifyTrack | SpotifyEpisode | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_NOW_PLAYING_URL =
  'https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode';

/** Spotify access tokens last 3600s; cache for 3000s to leave a safety margin. */
const ACCESS_TOKEN_TTL_SECONDS = 3000;

/**
 * Synthetic URL used as the Cache API key for the cached access token.
 *
 * Versioned suffix: bump the trailing `-vN` whenever the refresh token is
 * rotated AND the previous access token (cached at the edge for ~50min)
 * needs to be invalidated immediately. Without bumping, edge nodes keep
 * serving the stale access token until ACCESS_TOKEN_TTL_SECONDS elapses,
 * which means a scope-corrected new refresh token doesn't take effect for
 * up to 50 minutes after `wrangler secret put`.
 *
 * History:
 *   v1 — initial deploy 2026-05-02
 *   v2 — bumped 2026-05-02 after diagnosing 403s from missing scopes;
 *        re-issued refresh token with explicit consent had the right
 *        scopes but cached v1 access token was scope-incomplete.
 */
const ACCESS_TOKEN_CACHE_KEY = 'https://internal.merricstrough.com/spotify-access-token-v2';

/** Allowed origins for CORS — strict allowlist, no wildcards. */
const ALLOWED_ORIGINS = new Set<string>([
  'https://merricstrough.com',
  'https://www.merricstrough.com',
  'http://localhost:4321', // Astro dev server
  'http://127.0.0.1:4321',
]);

const SAFE_FALLBACK: NowPlayingResponse = { isPlaying: false };

// ---------------------------------------------------------------------------
// Worker entrypoint (ES module format — modern Workers, NOT service-worker)
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const corsHeaders = buildCorsHeaders(origin);

    // CORS preflight — answered without touching Spotify
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return jsonResponse(SAFE_FALLBACK, 405, corsHeaders);
    }

    if (url.pathname !== '/api/now-playing') {
      return jsonResponse(SAFE_FALLBACK, 404, corsHeaders);
    }

    try {
      const payload = await getNowPlaying(env);
      return jsonResponse(payload, 200, corsHeaders);
    } catch (err) {
      // Defensive catch-all: any uncaught surprise still returns safe JSON.
      console.error('now-playing handler unexpected error', err);
      return jsonResponse(SAFE_FALLBACK, 200, corsHeaders);
    }
  },
} satisfies ExportedHandler<Env>;

// ---------------------------------------------------------------------------
// Core flow
// ---------------------------------------------------------------------------

async function getNowPlaying(env: Env): Promise<NowPlayingResponse> {
  const accessToken = await getAccessToken(env);
  if (!accessToken) {
    return SAFE_FALLBACK;
  }

  const response = await fetch(SPOTIFY_NOW_PLAYING_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    // cf.cacheTtl is intentionally NOT set here — we want fresh data on each
    // upstream call; outer Cache-Control on the Worker response handles edge.
  });

  // 204 = nothing currently playing (or private session). Not an error.
  if (response.status === 204) {
    return SAFE_FALLBACK;
  }

  if (response.status === 401) {
    // Token rejected. Bust the cached token so the next request re-refreshes.
    const body = await safeReadErrorBody(response);
    console.warn('spotify 401 on currently-playing — clearing cached token', body);
    await invalidateAccessToken();
    return SAFE_FALLBACK;
  }

  if (response.status === 403) {
    // 403 on this endpoint almost always means the OAuth grant lacks the
    // user-read-currently-playing scope (or the app isn't authorized for
    // this user in dev mode). Re-run auth-helper.ts and re-issue the
    // refresh token via `wrangler secret put SPOTIFY_REFRESH_TOKEN`, then
    // bump ACCESS_TOKEN_CACHE_KEY's `-vN` suffix to force fresh access
    // token issuance at the edge. Body usually contains a useful message.
    const body = await safeReadErrorBody(response);
    console.warn('spotify 403 on currently-playing (likely scope issue)', body);
    return SAFE_FALLBACK;
  }

  if (response.status === 429) {
    // Rate limited. Don't retry inside the request — degrade gracefully.
    console.warn('spotify 429 rate limited');
    return SAFE_FALLBACK;
  }

  if (!response.ok) {
    const body = await safeReadErrorBody(response);
    console.warn(`spotify currently-playing returned ${response.status}`, body);
    return SAFE_FALLBACK;
  }

  let data: SpotifyCurrentlyPlayingResponse;
  try {
    data = (await response.json()) as SpotifyCurrentlyPlayingResponse;
  } catch (err) {
    console.warn('spotify currently-playing JSON parse failed', err);
    return SAFE_FALLBACK;
  }

  return normalizeNowPlaying(data);
}

function normalizeNowPlaying(data: SpotifyCurrentlyPlayingResponse): NowPlayingResponse {
  if (!data.is_playing || !data.item) {
    return SAFE_FALLBACK;
  }

  if (data.currently_playing_type === 'track') {
    const track = data.item as SpotifyTrack;
    const albumImage = pickBestImage(track.album.images);
    return {
      isPlaying: true,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      ...(albumImage ? { albumImageUrl: albumImage } : {}),
      ...(track.external_urls.spotify ? { songUrl: track.external_urls.spotify } : {}),
      ...(data.progress_ms !== null ? { progressMs: data.progress_ms } : {}),
      durationMs: track.duration_ms,
    };
  }

  if (data.currently_playing_type === 'episode') {
    const episode = data.item as SpotifyEpisode;
    const showImage = pickBestImage(episode.show.images);
    return {
      isPlaying: true,
      title: episode.name,
      artist: episode.show.name,
      album: episode.show.name,
      ...(showImage ? { albumImageUrl: showImage } : {}),
      ...(episode.external_urls.spotify ? { songUrl: episode.external_urls.spotify } : {}),
      ...(data.progress_ms !== null ? { progressMs: data.progress_ms } : {}),
      durationMs: episode.duration_ms,
    };
  }

  // Ads or unknown — treat as not playing for widget purposes.
  return SAFE_FALLBACK;
}

/**
 * Best-effort read of an error response body for log diagnostics.
 * Spotify error bodies are small JSON like {"error":{"status":403,"message":"..."}}.
 * Caps at 512 chars so a misbehaving upstream can't blow up logs.
 */
async function safeReadErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.length > 512 ? `${text.slice(0, 512)}…` : text;
  } catch {
    return '<body unreadable>';
  }
}

/** Pick the largest image whose width is <= 640 (good for hero meta widget). */
function pickBestImage(images: SpotifyImage[]): string | undefined {
  if (images.length === 0) return undefined;
  // Spotify returns images sorted largest-first. Prefer the largest <= 640px.
  const preferred = images.find((img) => (img.width ?? 0) > 0 && (img.width ?? 0) <= 640);
  return preferred?.url ?? images[0]?.url;
}

// ---------------------------------------------------------------------------
// Access token — cached in Workers Cache API
// ---------------------------------------------------------------------------

async function getAccessToken(env: Env): Promise<string | null> {
  const cache = caches.default;
  const cacheKey = new Request(ACCESS_TOKEN_CACHE_KEY, { method: 'GET' });

  // Try cache first.
  const cached = await cache.match(cacheKey);
  if (cached) {
    try {
      const cachedJson = (await cached.json()) as { token: string };
      if (typeof cachedJson.token === 'string' && cachedJson.token.length > 0) {
        return cachedJson.token;
      }
    } catch (err) {
      console.warn('cached spotify token parse failed; refreshing', err);
    }
  }

  // Cache miss — refresh.
  const fresh = await refreshAccessToken(env);
  if (!fresh) return null;

  // Store in cache with explicit max-age so Cache API honors TTL.
  const cachePayload = new Response(JSON.stringify({ token: fresh }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${ACCESS_TOKEN_TTL_SECONDS}`,
    },
  });
  // Fire-and-forget put — don't block response on cache write.
  await cache.put(cacheKey, cachePayload);

  return fresh;
}

async function invalidateAccessToken(): Promise<void> {
  const cache = caches.default;
  const cacheKey = new Request(ACCESS_TOKEN_CACHE_KEY, { method: 'GET' });
  await cache.delete(cacheKey);
}

async function refreshAccessToken(env: Env): Promise<string | null> {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REFRESH_TOKEN) {
    console.error('spotify secrets missing — cannot refresh access token');
    return null;
  }

  const basicAuth = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: env.SPOTIFY_REFRESH_TOKEN,
  });

  let response: Response;
  try {
    response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
  } catch (err) {
    console.error('spotify token endpoint network error', err);
    return null;
  }

  if (!response.ok) {
    // Don't log the body wholesale — could include error_description with
    // sensitive info. Status alone is enough to triage in observability.
    console.error(`spotify token endpoint returned ${response.status}`);
    return null;
  }

  let json: SpotifyTokenResponse;
  try {
    json = (await response.json()) as SpotifyTokenResponse;
  } catch (err) {
    console.error('spotify token JSON parse failed', err);
    return null;
  }

  if (!json.access_token) {
    console.error('spotify token response missing access_token');
    return null;
  }

  return json.access_token;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    // No origin or disallowed origin: omit the ACAO header.
    // (Browsers will block the cross-origin read; same-origin & curl still work.)
  }

  return headers;
}

function jsonResponse(
  body: NowPlayingResponse,
  status: number,
  extraHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Brief edge cache reduces Spotify rate-limit pressure dramatically:
      // a single PoP serves ~30s of identical responses from cache.
      'Cache-Control': 'public, max-age=30, s-maxage=60',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...extraHeaders,
    },
  });
}
