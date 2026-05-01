# shanestrough.com — inverse cross-link kit

> **What this is.** Copy-paste-ready snippets to add to the `shanestrough.com` repo so the family-graph cross-link validates in both directions. Source of truth: `docs/decisions/0003-cross-site-family-graph-implementation.md` §"What is NOT in v2."
>
> **Why it exists.** Doing this in the `shanestrough.com` repo (a separate Claude session) is slightly faster if the snippets are pre-derived. This doc is the one-pager handoff.

---

## What needs to land

Two additions on every page of `shanestrough.com`, plus a one-time JSON-LD on the landing.

### 1. `<link rel="me">` chain in `<head>`

Lives in shanestrough.com's equivalent of `BaseHead`. Add inside the `<head>` block (near your other identity-related links):

```html
<!-- IndieWeb identity — outgoing rel=me to children + verified accounts. -->
<link rel="me" href="https://merricstrough.com" />
<!-- Add as each goes live: -->
<!-- <link rel="me" href="https://tristanstrough.com" /> -->
<!-- <link rel="me" href="https://laynestrough.com" /> -->
```

Comment-out the brothers' lines until those sites are live with consenting presence per CLAUDE.md §10.5.

### 2. JSON-LD Person schema with `children` array

Lives on the landing page only (per Schema.org best practice — Person belongs on the entity's primary URL). Add inside `<head>` or just before `</body>`:

```html
<script type="application/ld+json">
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
</script>
```

Brothers are name-only (no `url` field) per §10.5 — until they have their own consenting presence with live URLs.

---

## Verification once both sides ship

Run these from any browser (no auth needed):

1. **Google Rich Results Test** — paste `https://shanestrough.com/` at https://search.google.com/test/rich-results. Should detect `Person` schema with the `children` array.
2. **IndieWebify.me** — paste `https://shanestrough.com/` at https://indiewebify.me. The "rel=me identity" check should resolve and show `merricstrough.com` (and back) as a verified two-way link.
3. Same two checks against `merricstrough.com` should also pass.

---

## Privacy guardrails (restated from CLAUDE.md §10.5)

- ✅ Surnames in JSON-LD are OK because the domains themselves already publicly tie each property to the surnames
- ✅ Brothers' surnames in JSON-LD are OK
- ❌ Brothers' first name + identifying-detail combinations (school, hobbies, ages, photos, locations) are NOT until they have their own consenting presence
- ❌ No photos of family members on either site without explicit consent
- ❌ No real addresses, even loosely

---

## Update this doc when

- A new sibling site goes live (uncomment their `rel=me` line, add their `url` field to children)
- A future family domain (e.g. `clandestinmedia.com`) joins the constellation
- The Schema.org Person spec changes the family-graph fields (unlikely)

When done in the shanestrough.com repo, mark task #8 in `docs/STATUS.md` as ✓ and update the verification status in CLAUDE.md §10.6.
