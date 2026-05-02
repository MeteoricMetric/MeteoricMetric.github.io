/**
 * One-time-use script: obtain a Spotify refresh token for the Worker.
 *
 * Run locally (NOT inside the Worker runtime):
 *
 *   cd worker
 *   export SPOTIFY_CLIENT_ID=...                # from Spotify Developer Dashboard
 *   export SPOTIFY_CLIENT_SECRET=...            # from Spotify Developer Dashboard
 *   npx tsx src/auth-helper.ts
 *
 * (PowerShell:  $env:SPOTIFY_CLIENT_ID = '...'  etc.)
 *
 * The script will:
 *   1. Open your browser to Spotify's authorize URL.
 *   2. Spin up a tiny localhost callback server on http://127.0.0.1:8888/callback.
 *   3. Receive the auth code, exchange it for an access + refresh token.
 *   4. Print the refresh token to your terminal with instructions to store it
 *      via:  wrangler secret put SPOTIFY_REFRESH_TOKEN
 *
 * Required Spotify Developer App settings:
 *   - Redirect URI EXACTLY: http://127.0.0.1:8888/callback
 *     (Spotify deprecated http://localhost — use the loopback IP.)
 *
 * Required scopes (passed in the authorize URL below):
 *   - user-read-currently-playing
 *   - user-read-playback-state
 *
 * This file is intentionally a Node script — it imports `node:http` and
 * `node:crypto`. It is NEVER bundled into the Worker. Wrangler's build only
 * picks up src/index.ts (per wrangler.toml `main`).
 */

import { exec } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { platform } from 'node:os';

const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const CALLBACK_PORT = 8888;
const REQUIRED_SCOPES = ['user-read-currently-playing', 'user-read-playback-state'];

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('ERROR: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in env.');
  console.error('PowerShell:  $env:SPOTIFY_CLIENT_ID = "..."');
  console.error('Bash:        export SPOTIFY_CLIENT_ID=...');
  process.exit(1);
}

// CSRF protection — Spotify echoes `state` back; we verify it matches.
const state = randomBytes(16).toString('hex');

const authorizeUrl = new URL('https://accounts.spotify.com/authorize');
authorizeUrl.searchParams.set('response_type', 'code');
authorizeUrl.searchParams.set('client_id', clientId);
authorizeUrl.searchParams.set('scope', REQUIRED_SCOPES.join(' '));
authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authorizeUrl.searchParams.set('state', state);
authorizeUrl.searchParams.set('show_dialog', 'true');

console.log('');
console.log('--- merricstrough Spotify auth helper ---');
console.log('');
console.log('Authorize URL (also opening in your browser):');
console.log(authorizeUrl.toString());
console.log('');
console.log(`Listening for callback at ${REDIRECT_URI} ...`);
console.log('');

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    res.writeHead(400).end('No URL');
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${CALLBACK_PORT}`);

  if (url.pathname !== '/callback') {
    res.writeHead(404).end('Not found');
    return;
  }

  const returnedState = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error(`Spotify returned error: ${error}`);
    res.writeHead(400).end(`Spotify error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (returnedState !== state) {
    console.error('State mismatch — possible CSRF. Aborting.');
    res.writeHead(400).end('State mismatch');
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400).end('No code in callback');
    server.close();
    process.exit(1);
  }

  try {
    const tokenRes = await exchangeCodeForTokens(code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(
      `<!doctype html><meta charset="utf-8"><title>Spotify auth complete</title>
       <body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 32rem;">
         <h1>Done.</h1>
         <p>You can close this tab and return to your terminal.</p>
       </body>`,
    );

    console.log('');
    console.log('SUCCESS — refresh token captured.');
    console.log('');
    console.log(`Granted scopes: ${tokenRes.scope || '<none>'}`);
    console.log('');
    if (!tokenRes.scope?.includes('user-read-currently-playing')) {
      console.warn('WARNING: granted scopes do NOT include user-read-currently-playing.');
      console.warn('The Worker will return 403 on /api/now-playing. Possible causes:');
      console.warn('  (a) The Spotify Developer App is in Development Mode and the');
      console.warn('      logged-in user is not in its "User Management" allowlist.');
      console.warn('      Fix: Spotify Dev Dashboard -> app -> User Management -> add the');
      console.warn(`      user${"'"}s Spotify email + display name.`);
      console.warn('  (b) The user clicked through the consent screen without granting');
      console.warn('      all requested scopes. Re-run with show_dialog=true (already on).');
      console.warn('  (c) The Spotify app definition no longer matches what we requested.');
      console.warn('');
    }
    console.log('---------- COPY BELOW ----------');
    console.log(tokenRes.refresh_token);
    console.log('---------- COPY ABOVE ----------');
    console.log('');
    console.log('Store it as a Wrangler secret (paste the token when prompted):');
    console.log('');
    console.log('  wrangler secret put SPOTIFY_REFRESH_TOKEN');
    console.log('');
    console.log('Also store the client id / secret if you have not already:');
    console.log('');
    console.log('  wrangler secret put SPOTIFY_CLIENT_ID');
    console.log('  wrangler secret put SPOTIFY_CLIENT_SECRET');
    console.log('');
    console.log('Per CLAUDE.md §5.2: the refresh token is a credential. Do NOT');
    console.log('paste it into commit messages, public chats, or screenshots.');
    console.log('');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Token exchange failed:', err);
    res.writeHead(500).end('Token exchange failed — see terminal.');
    server.close();
    process.exit(1);
  }
});

interface TokenExchangeResponse {
  access_token: string;
  refresh_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
}

async function exchangeCodeForTokens(code: string): Promise<TokenExchangeResponse> {
  // Non-null asserted: validated at script entry above.
  const basicAuth = Buffer.from(`${clientId!}:${clientSecret!}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token exchange ${response.status}: ${text}`);
  }

  return (await response.json()) as TokenExchangeResponse;
}

server.listen(CALLBACK_PORT, '127.0.0.1', () => {
  openBrowser(authorizeUrl.toString());
});

function openBrowser(target: string): void {
  const os = platform();
  const cmd =
    os === 'win32'
      ? `start "" "${target}"`
      : os === 'darwin'
        ? `open "${target}"`
        : `xdg-open "${target}"`;
  exec(cmd, (err) => {
    if (err) {
      console.warn('Could not auto-open browser. Open the URL above manually.');
    }
  });
}
