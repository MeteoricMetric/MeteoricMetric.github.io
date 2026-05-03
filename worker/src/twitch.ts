/**
 * Twitch integration — live-status badge for the hero meta plane.
 *
 * Auth: App Access Token via OAuth client_credentials grant. NO user OAuth.
 * Scopes: NONE required for /helix/streams with an app token.
 * Token TTL: ~60 days. Cached at the edge in Workers Cache API for 24h
 * (fresh enough for token-rotation events; far shorter than the actual TTL).
 *
 * Endpoint: GET /helix/streams?user_login=meteoricmetric
 *   - Empty `data` array  = offline
 *   - Non-empty `data`    = live; one stream object per channel
 *
 * Setup steps documented in worker/README.md.
 *
 * Failure modes return { isLive: false, lastChecked } so the badge gracefully
 * hides itself if Twitch is down.
 */

import { safeReadErrorBody } from './lib/responses';

// ---------------------------------------------------------------------------
// Public response contract
// ---------------------------------------------------------------------------

export interface TwitchStatusResponse {
  isLive: boolean;
  startedAt?: string;
  viewerCount?: number;
  title?: string;
  game?: string;
  thumbnailUrl?: string;
  streamUrl?: string;
  /** Twitch's `display_name` field — preferred for visible labels. */
  displayName?: string;
  lastChecked: string;
}

// ---------------------------------------------------------------------------
// Env binding
// ---------------------------------------------------------------------------

export interface TwitchEnv {
  readonly TWITCH_CLIENT_ID: string;
  readonly TWITCH_CLIENT_SECRET: string;
}

// ---------------------------------------------------------------------------
// Twitch API response types
// ---------------------------------------------------------------------------

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStream {
  id: string;
  user_login: string;
  /** Twitch quirk: this field actually carries the DISPLAY name (e.g. "MeteoricMetric"). */
  user_name: string;
  game_id: string;
  game_name: string;
  type: 'live' | '';
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string; // template with {width} and {height} literals
}

interface TwitchStreamsResponse {
  data: TwitchStream[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TWITCH_USER_LOGIN = 'meteoricmetric';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_STREAMS_URL = `https://api.twitch.tv/helix/streams?user_login=${TWITCH_USER_LOGIN}`;
const TWITCH_CHANNEL_URL = `https://www.twitch.tv/${TWITCH_USER_LOGIN}`;

/** App access tokens last ~60 days; cache for 24h to give margin for rotation. */
const APP_TOKEN_TTL_SECONDS = 86_400;
const APP_TOKEN_CACHE_KEY = 'https://internal.merricstrough.com/twitch-app-token-v1';

const OFFLINE_FALLBACK = (): TwitchStatusResponse => ({
  isLive: false,
  streamUrl: TWITCH_CHANNEL_URL,
  lastChecked: new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getTwitchStatus(env: TwitchEnv): Promise<TwitchStatusResponse> {
  const token = await getAppToken(env);
  if (!token) return OFFLINE_FALLBACK();

  const response = await fetch(TWITCH_STREAMS_URL, {
    headers: {
      'Client-Id': env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // App token rejected — bust cache, force fresh on next call.
    const body = await safeReadErrorBody(response);
    console.warn('twitch 401 on streams — clearing cached app token', body);
    await invalidateAppToken();
    return OFFLINE_FALLBACK();
  }

  if (response.status === 429) {
    console.warn('twitch 429 rate limited on streams');
    return OFFLINE_FALLBACK();
  }

  if (!response.ok) {
    const body = await safeReadErrorBody(response);
    console.warn(`twitch streams returned ${response.status}`, body);
    return OFFLINE_FALLBACK();
  }

  let data: TwitchStreamsResponse;
  try {
    data = (await response.json()) as TwitchStreamsResponse;
  } catch (err) {
    console.warn('twitch streams JSON parse failed', err);
    return OFFLINE_FALLBACK();
  }

  const stream = data.data[0];
  if (!stream || stream.type !== 'live') return OFFLINE_FALLBACK();

  // Substitute thumbnail template (defensive — channel may not always have one).
  const thumbnailUrl = stream.thumbnail_url
    ? stream.thumbnail_url.replace('{width}', '440').replace('{height}', '248')
    : undefined;

  return {
    isLive: true,
    startedAt: stream.started_at,
    viewerCount: stream.viewer_count,
    title: stream.title,
    ...(stream.game_name ? { game: stream.game_name } : {}),
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    streamUrl: TWITCH_CHANNEL_URL,
    displayName: stream.user_name,
    lastChecked: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// App access token — cached in Workers Cache API
// ---------------------------------------------------------------------------

async function getAppToken(env: TwitchEnv): Promise<string | null> {
  const cache = caches.default;
  const cacheKey = new Request(APP_TOKEN_CACHE_KEY, { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) {
    try {
      const cachedJson = (await cached.json()) as { token: string };
      if (typeof cachedJson.token === 'string' && cachedJson.token.length > 0) {
        return cachedJson.token;
      }
    } catch (err) {
      console.warn('cached twitch token parse failed; refreshing', err);
    }
  }

  const fresh = await mintAppToken(env);
  if (!fresh) return null;

  const cachePayload = new Response(JSON.stringify({ token: fresh }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${APP_TOKEN_TTL_SECONDS}`,
    },
  });
  await cache.put(cacheKey, cachePayload);

  return fresh;
}

async function invalidateAppToken(): Promise<void> {
  const cache = caches.default;
  const cacheKey = new Request(APP_TOKEN_CACHE_KEY, { method: 'GET' });
  await cache.delete(cacheKey);
}

async function mintAppToken(env: TwitchEnv): Promise<string | null> {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    console.error('twitch secrets missing — cannot mint app access token');
    return null;
  }

  const body = new URLSearchParams({
    client_id: env.TWITCH_CLIENT_ID,
    client_secret: env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  let response: Response;
  try {
    response = await fetch(TWITCH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    console.error('twitch token endpoint network error', err);
    return null;
  }

  if (!response.ok) {
    console.error(`twitch token endpoint returned ${response.status}`);
    return null;
  }

  let json: TwitchTokenResponse;
  try {
    json = (await response.json()) as TwitchTokenResponse;
  } catch (err) {
    console.error('twitch token JSON parse failed', err);
    return null;
  }

  if (!json.access_token) {
    console.error('twitch token response missing access_token');
    return null;
  }

  return json.access_token;
}
