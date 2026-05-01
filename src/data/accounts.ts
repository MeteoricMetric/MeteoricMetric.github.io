// merricstrough.com — external account data (per ADR-0003 / CLAUDE.md §10).
//
// Single source of truth, consumed by:
//   - src/components/BaseHead.astro → <link rel="me"> entries
//   - src/components/PersonSchema.astro → JSON-LD `sameAs` array
//   - src/components/FollowGrid.astro → "follow me on …" CTA cluster
//
// Verified URLs ship live. Unverified placeholders carry a TODO marker
// and `verified: false` — emitters filter on `verified === true`.

export type Account = Readonly<{
  platform: string;
  url: string;
  handle: string;
  verified: boolean;
  // Surface in the public "follow me" CTA cluster when true.
  showInFollow?: boolean;
}>;

export const accounts: readonly Account[] = [
  // ── Verified ─────────────────────────────────────────────────────────────
  {
    platform: 'GitHub',
    url: 'https://github.com/MeteoricMetric',
    handle: 'MeteoricMetric',
    verified: true,
    showInFollow: true,
  },
  {
    platform: 'Twitch',
    url: 'https://www.twitch.tv/meteoricmetric',
    handle: 'meteoricmetric',
    verified: true,
    showInFollow: true,
  },
  {
    platform: 'Spotify',
    url: 'https://open.spotify.com/user/metric1720',
    handle: 'metric1720',
    verified: true,
    showInFollow: true,
  },
  {
    // Discord community server — "Meteoric metric maze". Invite URL goes
    // straight to the server join page (the handle is a slug of the server
    // name, not a Discord user-handle, since Discord usernames aren't
    // public-profile URLs).
    platform: 'Discord',
    url: 'https://discord.gg/j9QrCRvyks',
    handle: 'meteoricmetricmaze',
    verified: true,
    showInFollow: true,
  },
  {
    // Steam — the custom URL slug `merricstrough` is Merric's full first +
    // last name concatenated, which on a strict reading of CLAUDE.md §5.3
    // would qualify as "full last name on visible page content" (FollowGrid
    // pill + JSON-LD sameAs + search-engine indexing).
    //
    // EXPLICIT §5.3 OVERRIDE: Shane (parent, accountable adult per §0)
    // exercised his §13.4 final call on 2026-05-01 and chose to keep
    // the surname slug rather than rename the Steam custom URL. Future
    // sessions: do NOT "fix" this back to a placeholder. The override is
    // intentional. If the threat model shifts (e.g. specific harassment
    // surfaces), revisit by talking to Shane.
    platform: 'Steam',
    url: 'https://steamcommunity.com/id/merricstrough',
    handle: 'merricstrough',
    verified: true,
    showInFollow: true,
  },

  // ── Pending — see notes ──────────────────────────────────────────────────

  // YouTube — channel URL still pending (Merric is working on it). When
  // received, confirm the @handle does NOT expose his real last name
  // (per §5.3, unless Shane chooses to override per the Steam pattern),
  // then flip verified: true + add showInFollow: true.
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@TODO',
    handle: 'TODO',
    verified: false,
  },
];

// ── Notes (not consumed by code) ─────────────────────────────────────────
//
// Alt Twitch (metric724) — Shane mentioned a second Twitch account exists.
// Single Twitch link in the FollowGrid is cleaner UX (avoids "which one do
// I follow?" confusion). Keeping `meteoricmetric` as the public-facing one
// here. If the alt is the actively-streamed one, swap them and demote
// meteoricmetric to a private alt.

// Convenience: filter once at module scope; consumers iterate this directly.
export const verifiedAccounts: readonly Account[] = accounts.filter((a) => a.verified);
