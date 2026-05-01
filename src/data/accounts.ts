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
  // ── Verified by Shane on 2026-04-30 ────────────────────────────────────
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

  // ── Awaiting Merric's info (task #9 — due 2026-05-01) ──────────────────
  // TODO(merric-info): replace placeholder URLs with verified real URLs.
  // Per CLAUDE.md §5.3 — confirm display name on each platform does NOT
  // expose his real last name before flipping `verified: true`.
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@TODO',
    handle: 'TODO',
    verified: false,
  },
  {
    platform: 'Spotify',
    url: 'https://open.spotify.com/user/TODO',
    handle: 'TODO',
    verified: false,
  },
  {
    platform: 'Discord',
    url: 'https://discord.gg/TODO',
    handle: 'TODO',
    verified: false,
  },
  {
    platform: 'Steam',
    url: 'https://steamcommunity.com/id/TODO',
    handle: 'TODO',
    verified: false,
  },
];

// Convenience: filter once at module scope; consumers iterate this directly.
export const verifiedAccounts: readonly Account[] = accounts.filter(
  (a) => a.verified,
);
