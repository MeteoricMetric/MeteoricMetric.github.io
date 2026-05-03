/**
 * merricstrough-now-playing — Cloudflare Worker
 *
 * Single Worker, multiple endpoints. Each endpoint lives in its own module
 * under src/ for clean separation; this file is just the routing entry point.
 *
 * Endpoints:
 *   GET /api/now-playing      — Spotify currently-playing  (src/spotify.ts)
 *   GET /api/top-tracks       — Spotify top tracks (4-week) (src/spotify.ts)
 *   GET /api/twitch-status    — Twitch live-stream state    (src/twitch.ts)
 *   GET /api/minecraft-status — Minecraft server status     (src/minecraft.ts)
 *
 * Architecture rules (per CLAUDE.md §5):
 *   - Secrets only via `wrangler secret put` — never wrangler.toml vars.
 *   - CORS is an explicit allowlist (lib/cors.ts); no wildcards.
 *   - All failure paths return safe-fallback JSON, never 5xx.
 *   - Each endpoint logs to console.warn/error for live observability via
 *     `wrangler tail`; nothing sensitive is echoed to the client.
 */

import { buildCorsHeaders } from './lib/cors';
import { jsonResponse } from './lib/responses';
import { getMinecraftStatus, type MinecraftEnv } from './minecraft';
import { getNowPlaying, getTopTracks, type SpotifyEnv } from './spotify';
import { getTwitchStatus, type TwitchEnv } from './twitch';

// ---------------------------------------------------------------------------
// Combined environment binding — union of every per-service env interface
// ---------------------------------------------------------------------------

export interface Env extends SpotifyEnv, TwitchEnv, MinecraftEnv {}

// Per-endpoint Cache-Control headers chosen for upstream rate-limit safety:
//   - now-playing:     30s browser / 60s edge — Spotify changes per-track
//   - top-tracks:      6h edge — Spotify recomputes daily
//   - twitch-status:   20s edge / 60s SWR — live indicator, must feel fresh
//   - minecraft:       60s edge — mcstatus.io has 1-min upstream cache anyway
const CACHE_CONTROL = {
  nowPlaying: 'public, max-age=30, s-maxage=60',
  topTracks: 'public, s-maxage=21600, stale-while-revalidate=3600',
  twitchStatus: 'public, max-age=20, s-maxage=20, stale-while-revalidate=60',
  minecraftStatus: 'public, max-age=30, s-maxage=60',
} as const;

// ---------------------------------------------------------------------------
// Worker entrypoint (ES module format)
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const corsHeaders = buildCorsHeaders(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'method not allowed' }, 405, corsHeaders);
    }

    try {
      switch (url.pathname) {
        case '/api/now-playing': {
          const payload = await getNowPlaying(env);
          return jsonResponse(payload, 200, corsHeaders, {
            cacheControl: CACHE_CONTROL.nowPlaying,
          });
        }

        case '/api/top-tracks': {
          const payload = await getTopTracks(env);
          return jsonResponse(payload, 200, corsHeaders, {
            cacheControl: CACHE_CONTROL.topTracks,
          });
        }

        case '/api/twitch-status': {
          const payload = await getTwitchStatus(env);
          return jsonResponse(payload, 200, corsHeaders, {
            cacheControl: CACHE_CONTROL.twitchStatus,
          });
        }

        case '/api/minecraft-status': {
          const payload = await getMinecraftStatus(env);
          return jsonResponse(payload, 200, corsHeaders, {
            cacheControl: CACHE_CONTROL.minecraftStatus,
          });
        }

        default:
          return jsonResponse({ error: 'not found' }, 404, corsHeaders);
      }
    } catch (err) {
      // Defensive catch-all — any uncaught surprise still returns safe JSON.
      console.error(`unexpected error on ${url.pathname}`, err);
      return jsonResponse({ error: 'internal error' }, 500, corsHeaders);
    }
  },
} satisfies ExportedHandler<Env>;
