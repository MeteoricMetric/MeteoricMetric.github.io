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

  // ── Pending — see notes ──────────────────────────────────────────────────

  // YouTube — channel URL not yet provided. When Merric creates / shares it,
  // confirm the @handle does NOT include his real last name (per §5.3),
  // then flip verified: true + add showInFollow: true.
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@TODO',
    handle: 'TODO',
    verified: false,
  },

  // Discord — Merric's current handle is `roblox_1720`, but Shane flagged it
  // as a possible rename ("we could make a new one or change it"). Discord
  // usernames don't have a public-profile URL pattern (only numeric IDs do),
  // so even when verified, this is more useful as a friend-add hint than a
  // FollowGrid pill. Hold off until either (a) a brand-aligned handle is
  // chosen, or (b) we set up a Discord community server with an invite URL.
  {
    platform: 'Discord',
    url: 'https://discord.com/users/TODO',
    handle: 'roblox_1720',
    verified: false,
  },

  // Steam — Merric's current Steam custom URL is `steamcommunity.com/id/merricstrough`.
  // The custom slug is his FULL LAST NAME, which trips CLAUDE.md §5.3
  // (no full last name on visible page content; the URL would expose it
  // either in the FollowGrid label or in JSON-LD sameAs and search results).
  // Suggested fix: change the Steam custom URL to `meteoricmetric` or
  // `metric1720` via Profile → Edit Profile → Custom URL on steamcommunity.com.
  // Account + items + friends are preserved across the rename. Once renamed,
  // update the URL + handle below + flip verified: true.
  {
    platform: 'Steam',
    url: 'https://steamcommunity.com/id/TODO',
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
