/**
 * Minecraft server status — proxies api.mcstatus.io v2 with edge caching.
 *
 * Why a proxy (not direct browser fetch to mcstatus.io):
 *   - We control CORS deterministically (matches the rest of our endpoints).
 *   - Edge cache absorbs concurrent visitors → mcstatus.io sees ~1 req/min
 *     regardless of audience (well under its 5 req/sec/IP limit).
 *   - Graceful degradation — if mcstatus.io is down or slow, we return
 *     `{ online: false, lastChecked }` instead of breaking the widget.
 *
 * Server address comes from MINECRAFT_SERVER_ADDRESS in wrangler.toml [vars]
 * (PUBLIC config, not a secret — the address is publicly resolvable as the
 * Minecraft join address). Format: `host[:port]`. playit.gg-tunneled servers
 * use hostnames like `*.gl.joinmc.link` or `*.ip.gl.ply.gg:PORT` — both work.
 */

import { safeReadErrorBody } from './lib/responses';

// ---------------------------------------------------------------------------
// Public response contract
// ---------------------------------------------------------------------------

export interface MinecraftStatusResponse {
  online: boolean;
  players?: { current: number; max: number };
  motd?: string;
  version?: string;
  /** Base64 server icon (favicon-style) when available — fun visual touch. */
  faviconDataUrl?: string;
  lastChecked: string;
}

// ---------------------------------------------------------------------------
// Env binding
// ---------------------------------------------------------------------------

export interface MinecraftEnv {
  /**
   * The Minecraft server's public address (hostname[:port]). PUBLIC config —
   * not a secret. Lives in wrangler.toml [vars] section so deploys can vary
   * it across staging/prod without re-issuing secrets.
   */
  readonly MINECRAFT_SERVER_ADDRESS: string;
}

// ---------------------------------------------------------------------------
// Mcstatus.io v2 response types (minimal — we model only what we read)
// ---------------------------------------------------------------------------

interface McstatusResponse {
  online: boolean;
  host: string;
  port: number;
  ip_address?: string | null;
  version?: { name_clean?: string; protocol?: number };
  players?: { online: number; max: number };
  motd?: { clean?: string };
  icon?: string | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const OFFLINE_FALLBACK = (): MinecraftStatusResponse => ({
  online: false,
  lastChecked: new Date().toISOString(),
});

export async function getMinecraftStatus(env: MinecraftEnv): Promise<MinecraftStatusResponse> {
  const address = env.MINECRAFT_SERVER_ADDRESS?.trim();
  if (!address) {
    console.warn('MINECRAFT_SERVER_ADDRESS not configured');
    return OFFLINE_FALLBACK();
  }

  // mcstatus.io v2: GET /v2/status/java/{address}
  const apiUrl = `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(address)}`;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      // Be polite — descriptive UA per their fair-use guidance.
      headers: { 'User-Agent': 'merricstrough.com-worker/1.0 (+https://merricstrough.com)' },
    });
  } catch (err) {
    console.warn('mcstatus.io network error', err);
    return OFFLINE_FALLBACK();
  }

  if (!response.ok) {
    const body = await safeReadErrorBody(response);
    console.warn(`mcstatus.io returned ${response.status}`, body);
    return OFFLINE_FALLBACK();
  }

  let data: McstatusResponse;
  try {
    data = (await response.json()) as McstatusResponse;
  } catch (err) {
    console.warn('mcstatus.io JSON parse failed', err);
    return OFFLINE_FALLBACK();
  }

  if (!data.online) return OFFLINE_FALLBACK();

  return {
    online: true,
    ...(data.players ? { players: { current: data.players.online, max: data.players.max } } : {}),
    ...(data.motd?.clean ? { motd: data.motd.clean } : {}),
    ...(data.version?.name_clean ? { version: data.version.name_clean } : {}),
    ...(data.icon ? { faviconDataUrl: data.icon } : {}),
    lastChecked: new Date().toISOString(),
  };
}
