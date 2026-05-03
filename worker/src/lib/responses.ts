/**
 * JSON response helpers shared across all Worker endpoints.
 * Centralizes Cache-Control + security headers so every endpoint gets them.
 */

export interface JsonResponseOptions {
  /** Cache-Control value. Default: brief edge cache (30s browser, 60s edge). */
  cacheControl?: string;
}

const DEFAULT_CACHE_CONTROL = 'public, max-age=30, s-maxage=60';

export function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string>,
  opts: JsonResponseOptions = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': opts.cacheControl ?? DEFAULT_CACHE_CONTROL,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...extraHeaders,
    },
  });
}

/**
 * Best-effort read of an error response body for log diagnostics.
 * Caps at 512 chars so a misbehaving upstream can't blow up logs.
 */
export async function safeReadErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.length > 512 ? `${text.slice(0, 512)}…` : text;
  } catch {
    return '<body unreadable>';
  }
}
