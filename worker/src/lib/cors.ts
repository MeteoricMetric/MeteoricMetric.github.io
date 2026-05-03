/**
 * CORS allowlist + headers shared across all Worker endpoints.
 * Strict allowlist — no wildcards. Adding a new origin requires touching this file.
 */

const ALLOWED_ORIGINS = new Set<string>([
  'https://merricstrough.com',
  'https://www.merricstrough.com',
  'http://localhost:4321', // Astro dev server
  'http://127.0.0.1:4321',
]);

export function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  // No origin or disallowed origin: omit the ACAO header. Browsers block
  // cross-origin reads from non-allowlisted hosts; same-origin + curl still work.

  return headers;
}
