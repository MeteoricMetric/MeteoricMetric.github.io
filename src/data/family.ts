// merricstrough.com — family graph data (per ADR-0003 / CLAUDE.md §10).
// Family relationships are stable structural facts; they live in versioned
// code, not the CMS.

export type Person = Readonly<{
  name: string;
  givenName?: string;
  familyName?: string;
  url?: string;
  alternateName?: string;
}>;

export const merric: Person = {
  name: 'Merric Strough',
  givenName: 'Merric',
  familyName: 'Strough',
  url: 'https://merricstrough.com',
  alternateName: 'MeteoricMetric',
};

// Per CLAUDE.md §10.5 — parent name + URL is OK (Shane consents, his site exists).
// Brothers' first names + surnames in JSON-LD are OK; per-site URLs are NOT until
// they have their own consenting presence with live URLs.
export const parent: Person = {
  name: 'Shane Strough',
  url: 'https://shanestrough.com',
};

export const siblings: readonly Person[] = [
  { name: 'Tristan Strough' },
  { name: 'Layne Strough' },
];
