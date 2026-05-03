/**
 * Spotify integration — currently-playing + top-tracks.
 *
 * Architecture:
 *   - Refresh-token OAuth flow against accounts.spotify.com.
 *   - Access tokens (60-min lifetime) cached in Workers Cache API at the edge
 *     for ~50 minutes (ACCESS_TOKEN_TTL_SECONDS). Versioned cache key — bump
 *     ACCESS_TOKEN_CACHE_KEY's `-vN` suffix when the OAuth scope set changes
 *     so cached tokens with the old scopes get superseded immediately.
 *
 * Failure modes ALL return safe fallbacks — never 5xx — so widgets degrade
 * gracefully if Spotify is down.
 */

import { safeReadErrorBody } from './lib/responses';

// ---------------------------------------------------------------------------
// Public response contracts (consumed by Astro widgets)
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

export interface TopTrackResponse {
  title: string;
  artist: string;
  album: string;
  albumImageUrl?: string;
  songUrl?: string;
}

export interface TopTracksResponse {
  items: TopTrackResponse[];
  /** Spotify's "short_term" = ~4 weeks per docs. Surfaced for the widget label. */
  range: 'short_term';
  lastChecked: string;
}

// ---------------------------------------------------------------------------
// Env binding
// ---------------------------------------------------------------------------

export interface SpotifyEnv {
  readonly SPOTIFY_CLIENT_ID: string;
  readonly SPOTIFY_CLIENT_SECRET: string;
  readonly SPOTIFY_REFRESH_TOKEN: string;
}

// ---------------------------------------------------------------------------
// Spotify API response types (minimal — we model only what we read)
// ---------------------------------------------------------------------------

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
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

interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_NOW_PLAYING_URL =
  'https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode';
const SPOTIFY_TOP_TRACKS_URL =
  'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10';

const ACCESS_TOKEN_TTL_SECONDS = 3000;

/**
 * Versioned cache key for the access token. Bump the trailing `-vN` whenever
 * the OAuth scope set changes (auth-helper.ts REQUIRED_SCOPES) so cached
 * tokens issued with the old scope set get superseded immediately at the edge.
 *
 * History:
 *   v1 — initial deploy 2026-05-02
 *   v2 — bumped 2026-05-02 after diagnosing 403s from missing scopes
 *   v3 — bumped 2026-05-02 after adding `user-top-read` scope for top-tracks
 */
const ACCESS_TOKEN_CACHE_KEY = 'https://internal.merricstrough.com/spotify-access-token-v3';

const NOW_PLAYING_FALLBACK: NowPlayingResponse = { isPlaying: false };

// ---------------------------------------------------------------------------
// Now Playing
// ---------------------------------------------------------------------------

export async function getNowPlaying(env: SpotifyEnv): Promise<NowPlayingResponse> {
  const accessToken = await getAccessToken(env);
  if (!accessToken) return NOW_PLAYING_FALLBACK;

  const response = await fetch(SPOTIFY_NOW_PLAYING_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204) return NOW_PLAYING_FALLBACK;

  if (response.status === 401) {
    const body = await safeReadErrorBody(response);
    console.warn('spotify 401 on currently-playing — clearing cached token', body);
    await invalidateAccessToken();
    return NOW_PLAYING_FALLBACK;
  }

  if (response.status === 403) {
    const body = await safeReadErrorBody(response);
    console.warn('spotify 403 on currently-playing (likely scope or premium issue)', body);
    return NOW_PLAYING_FALLBACK;
  }

  if (response.status === 429) {
    console.warn('spotify 429 rate limited on currently-playing');
    return NOW_PLAYING_FALLBACK;
  }

  if (!response.ok) {
    const body = await safeReadErrorBody(response);
    console.warn(`spotify currently-playing returned ${response.status}`, body);
    return NOW_PLAYING_FALLBACK;
  }

  let data: SpotifyCurrentlyPlayingResponse;
  try {
    data = (await response.json()) as SpotifyCurrentlyPlayingResponse;
  } catch (err) {
    console.warn('spotify currently-playing JSON parse failed', err);
    return NOW_PLAYING_FALLBACK;
  }

  return normalizeNowPlaying(data);
}

function normalizeNowPlaying(data: SpotifyCurrentlyPlayingResponse): NowPlayingResponse {
  if (!data.is_playing || !data.item) return NOW_PLAYING_FALLBACK;

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

  // Ads / unknown — treat as not playing for widget purposes.
  return NOW_PLAYING_FALLBACK;
}

// ---------------------------------------------------------------------------
// Top Tracks
// ---------------------------------------------------------------------------

const TOP_TRACKS_FALLBACK: TopTracksResponse = {
  items: [],
  range: 'short_term',
  lastChecked: new Date(0).toISOString(),
};

export async function getTopTracks(env: SpotifyEnv): Promise<TopTracksResponse> {
  const accessToken = await getAccessToken(env);
  if (!accessToken) return { ...TOP_TRACKS_FALLBACK, lastChecked: new Date().toISOString() };

  const response = await fetch(SPOTIFY_TOP_TRACKS_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    const body = await safeReadErrorBody(response);
    console.warn('spotify 401 on top-tracks — clearing cached token', body);
    await invalidateAccessToken();
    return { ...TOP_TRACKS_FALLBACK, lastChecked: new Date().toISOString() };
  }

  if (response.status === 403) {
    const body = await safeReadErrorBody(response);
    console.warn('spotify 403 on top-tracks (likely missing user-top-read scope)', body);
    return { ...TOP_TRACKS_FALLBACK, lastChecked: new Date().toISOString() };
  }

  if (!response.ok) {
    const body = await safeReadErrorBody(response);
    console.warn(`spotify top-tracks returned ${response.status}`, body);
    return { ...TOP_TRACKS_FALLBACK, lastChecked: new Date().toISOString() };
  }

  let data: SpotifyTopTracksResponse;
  try {
    data = (await response.json()) as SpotifyTopTracksResponse;
  } catch (err) {
    console.warn('spotify top-tracks JSON parse failed', err);
    return { ...TOP_TRACKS_FALLBACK, lastChecked: new Date().toISOString() };
  }

  const items: TopTrackResponse[] = data.items.map((track) => {
    const image = pickBestImage(track.album.images);
    return {
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      ...(image ? { albumImageUrl: image } : {}),
      ...(track.external_urls.spotify ? { songUrl: track.external_urls.spotify } : {}),
    };
  });

  return {
    items,
    range: 'short_term',
    lastChecked: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Image picker — prefer the 300x300 album image (good balance of quality/payload)
// ---------------------------------------------------------------------------

function pickBestImage(images: SpotifyImage[]): string | undefined {
  if (images.length === 0) return undefined;
  // Prefer the largest <= 640 — covers ~290KB album-art-led top-tracks strip
  // without serving 4MB worth of images for a hero pill.
  const preferred = images.find((img) => (img.width ?? 0) > 0 && (img.width ?? 0) <= 640);
  return preferred?.url ?? images[0]?.url;
}

// ---------------------------------------------------------------------------
// Access token — cached in Workers Cache API
// ---------------------------------------------------------------------------

async function getAccessToken(env: SpotifyEnv): Promise<string | null> {
  const cache = caches.default;
  const cacheKey = new Request(ACCESS_TOKEN_CACHE_KEY, { method: 'GET' });

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

  const fresh = await refreshAccessToken(env);
  if (!fresh) return null;

  const cachePayload = new Response(JSON.stringify({ token: fresh }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${ACCESS_TOKEN_TTL_SECONDS}`,
    },
  });
  await cache.put(cacheKey, cachePayload);

  return fresh;
}

async function invalidateAccessToken(): Promise<void> {
  const cache = caches.default;
  const cacheKey = new Request(ACCESS_TOKEN_CACHE_KEY, { method: 'GET' });
  await cache.delete(cacheKey);
}

async function refreshAccessToken(env: SpotifyEnv): Promise<string | null> {
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
