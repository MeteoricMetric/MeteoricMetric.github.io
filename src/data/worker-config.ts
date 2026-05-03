// merricstrough.com — single source of truth for the Cloudflare Worker URL.
//
// Originally inlined in NowSpinning.astro. Graduated to its own module on
// 2026-05-02 when three additional consumers landed (TopTracks, TwitchLive,
// MinecraftStatus) — meeting the "second consumer" graduation criterion noted
// in NowSpinning.astro.
//
// Worker source:    worker/src/index.ts (per-endpoint modules in worker/src/*.ts)
// Setup runbook:    worker/README.md
// Operational ref:  CLAUDE.local.md §6

const WORKER_BASE_URL = 'https://merricstrough-now-playing.meteoricmetric.workers.dev';

export const WORKER_ENDPOINTS = {
  nowPlaying: `${WORKER_BASE_URL}/api/now-playing`,
  topTracks: `${WORKER_BASE_URL}/api/top-tracks`,
  twitchStatus: `${WORKER_BASE_URL}/api/twitch-status`,
  minecraftStatus: `${WORKER_BASE_URL}/api/minecraft-status`,
} as const;
