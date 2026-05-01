# ADR-0003: Cross-site family-graph implementation for v2

## Status
Accepted — 2026-04-30 (Shane)

## Context

CLAUDE.md §10 establishes the cross-site identity protocol between merricstrough.com, shanestrough.com, and future Strough-family domains. §10.3 prescribes the implementation conventions (footer attribution, `<link rel="me">` in `<head>`, JSON-LD Person schema with parent / sibling relationships).

This ADR locks in the specific v2 implementation: which files contain which markup, what data lives where (code vs CMS), what's deferred to Phase 4 / cross-repo follow-up, and how privacy guardrails (§10.5) are enforced in code.

## Decision

### What ships in merricstrough.com v2

**1. Footer attribution on every page** (component: `src/components/Footer.astro`)

```html
<footer>
  <p>Built with my dad — <a href="https://shanestrough.com" rel="me">shanestrough.com</a></p>
  <!-- additional small copy: © Merric Strough — handle, year — and minimal nav -->
</footer>
```

**2. `<link rel="me">` entries in document `<head>`** (component: `src/components/BaseHead.astro`, sourced from `src/data/accounts.ts`)

```html
<link rel="me" href="https://shanestrough.com">
<link rel="me" href="https://github.com/MeteoricMetric">
<link rel="me" href="https://www.twitch.tv/meteoricmetric">
<!-- additional rel=me entries added as Merric provides verified URLs (per task #9) -->
```

Each verified external account gets a `rel="me"` entry per IndieWeb convention. Unverified placeholders (`@TODO`) do NOT ship as live `rel="me"` — they're commented out in the data file with a `// TODO(merric-info)` marker until verified.

**3. JSON-LD Person schema** (component: `src/components/PersonSchema.astro`, included on the landing page only — not on every page, to keep secondary pages focused on their own subject per Schema.org best practice)

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Merric Strough",
  "givenName": "Merric",
  "familyName": "Strough",
  "url": "https://merricstrough.com",
  "image": "https://merricstrough.com/avatar.jpg",
  "description": "13-year-old builder, gamer, and creator. Working on Minecraft, art, and code.",
  "alternateName": "MeteoricMetric",
  "sameAs": [
    "https://github.com/MeteoricMetric",
    "https://www.twitch.tv/meteoricmetric"
  ],
  "parent": {
    "@type": "Person",
    "name": "Shane Strough",
    "url": "https://shanestrough.com"
  },
  "sibling": [
    { "@type": "Person", "name": "Tristan Strough" },
    { "@type": "Person", "name": "Layne Strough" }
  ]
}
```

The `sameAs` array starts with verified accounts (GitHub, Twitch) and expands as Merric provides more URLs (per task #9).

### Data sourcing — code vs CMS

| Data | Lives in | Why |
|---|---|---|
| Family graph (parent, siblings) | `src/data/family.ts` (typed, code-managed) | Family identity is a stable structural fact, not a content edit. Belongs in versioned code with review, not a CMS form Merric could accidentally break. |
| External accounts (`sameAs` / `rel=me`) | `src/data/accounts.ts` (typed, code-managed) | Single source of truth consumed by both `BaseHead.astro` and `PersonSchema.astro`. Adding/removing accounts is a code change with PR review. |
| Footer attribution copy | `src/components/Footer.astro` (inline) | Small enough to not warrant a data file. |
| Hero content (background, headline, song, CTAs) | Pages CMS → `src/content/hero.json` | This is content; Merric edits it. Specced separately in ADR for Pages CMS schema. |

### What is NOT in v2 (deferred to Phase 4 / cross-repo follow-up)

**Inverse cross-link on shanestrough.com.** Per §10.3, the inverse `rel="me"` and JSON-LD with `children: [...]` array must exist on shanestrough.com for cross-site identity verification to fully validate. That work happens in the `shanestrough-com` repo (separate session, separate ADR). This ADR documents the dependency for the shanestrough-com session to consume; tracked as task #8.

Required additions on shanestrough.com:

```html
<link rel="me" href="https://merricstrough.com">
<!-- when each goes live: -->
<!-- <link rel="me" href="https://tristanstrough.com"> -->
<!-- <link rel="me" href="https://laynestrough.com"> -->
```

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Shane Strough",
  "url": "https://shanestrough.com",
  "children": [
    { "@type": "Person", "name": "Merric Strough", "url": "https://merricstrough.com" },
    { "@type": "Person", "name": "Tristan Strough" },
    { "@type": "Person", "name": "Layne Strough" }
  ]
}
```

**Brothers' subdomain entries.** `tristanstrough.com` and `laynestrough.com` URLs are not yet live, and the brothers haven't consented to per-site presence (per §10.5 — until they have their own consenting presence, names appear in JSON-LD only, no per-site URLs). Sibling entries in this ADR's JSON-LD are name-only.

### Privacy rules (restated from §10.5 — non-negotiable)

- ✅ Surnames in structured data (Strough family) are OK because the domain itself already publicly ties the property to Merric Strough
- ✅ Brothers' surnames in JSON-LD are OK
- ❌ Brothers' first-name + identifying-detail combinations (school, hobbies, exact ages, photos, locations) are NOT until they have their own consenting presence
- ❌ No photos of family members on Merric's site without explicit consent (and per §5.3, no face photos at all currently — avatar is custom illustration)
- ❌ No real addresses, even loosely
- ❌ No real-time location data, ever

### Verification (Phase 3 quality gate)

1. Validate JSON-LD via Google's Rich Results Test (https://search.google.com/test/rich-results) — requires production URL, Shane runs after deploy
2. Confirm `rel="me"` resolves both directions via IndieWebify.me — requires shanestrough.com inverse to be in place; Shane runs after both sides deploy
3. Submit both sitemaps to Google Search Console under both properties
4. Re-check quarterly that all cross-references still resolve (link rot is real) — schedule a recurring agent for this in Phase 4

## Alternatives considered

| Option | Why not |
|---|---|
| **Put family graph data in Pages CMS** | Family relationships aren't content edits; structural facts belong in versioned code, not in a form Merric could accidentally break |
| **Include JSON-LD Person schema on every page** | Per Schema.org best practice, the Person entity belongs on the entity's "main" URL (homepage); secondary pages should describe their own subject (e.g., a CreativeWork). Including everywhere would dilute the signal |
| **Use FOAF instead of Schema.org Person** | Schema.org has overwhelmingly more tooling support in 2026. FOAF is academically respected but practically dead for SEO / rich-results purposes |
| **Skip `sameAs` and rely only on `rel="me"`** | Both serve different consumers (search engines parse `sameAs`; IndieWeb tooling and federated identity parse `rel="me"`). Including both is the modern personal-site convention |
| **Add brothers' future domains in JSON-LD now (placeholder URLs)** | Violates §10.5 privacy rules — until they have their own consenting presence with live URLs, no URL is correct. Name-only is the right call |

## Consequences

**Positive:**
- Cross-site identity is machine-readable from day one of v2 launch
- Adding new accounts later is a one-line change in `src/data/accounts.ts`
- When brothers' sites launch, adding `rel="me"` and updating JSON-LD `sibling` array with URLs is mechanical
- v2 pre-validates the §10 standard in production before extending to other family properties

**Negative / costs:**
- Cross-site identity verification is partial until shanestrough.com inverse ships (cross-repo dependency tracked as task #8)
- Placeholder external account URLs will exist in `src/data/accounts.ts` (commented out, with `// TODO(merric-info)` markers) until task #9 closes
