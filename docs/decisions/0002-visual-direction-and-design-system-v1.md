# ADR-0002: Visual direction & design system v1

## Status
Accepted — 2026-04-30 (Shane)

## Context

Shane locked the visual direction on 2026-04-30: **deep dark canvas + ultra-clean typography + signature `#8b6bff` accent + deliberate motion + scientific/technical density.** Reference brands: SpaceX, NASA Genesis Mission, Cerebras, OpenAI, NVIDIA, Alphabet, MIT Labs, Awwwards SOTD. Plus Linear, Stripe, Vercel, Apple, Anthropic, Frame.io.

This ADR specifies the v1 design system that operationalizes that direction: typography stack, color tokens, motion vocabulary, layout primitives, hero composition system. It's "v1" because (a) we'll learn from real usage and (b) the constellation of family-domain properties will eventually share a `@strough/design` package extracted from this work (per ADR-0001 / CLAUDE.md §3.3).

## Decision

### Typography

| Role | Font | Notes |
|---|---|---|
| **Display + body sans** | **Geist Sans** (variable, weight 100–900) | Designed by Vercel + Basement Studio + Andrés Briganti. Free for commercial and personal. Available on Google Fonts and via `geist` npm. Inspired by Inter, Univers, SF Pro — sits in the exact tonal space of the brands we reference. Variable weight axis lets us pick precise display vs body weights without shipping multiple files. |
| **Mono** | **Geist Mono** (variable) | Native pair to Geist Sans. Used for technical-density moments: eyebrows, kickers, code snippets, "now spinning" track meta, technical-spec sections, marginalia labels. |
| **Editorial accent** | **Newsreader** (variable, italic axis) | Reserved for occasional pull quotes and editorial voice moments — the "MIT Labs research density" beat benefits from a serif palate cleanser. Used sparingly. |

All fonts self-hosted and subset to Latin + needed glyphs (per CLAUDE.md §11 perf). Loaded via Astro's font integration with `font-display: swap` and preloaded for the critical face only.

**Type scale — fluid via `clamp()`, modular ratio 1.25 (major third) → 1.333 (perfect fourth) across viewports:**

```css
--font-size-2xs:    clamp(0.75rem, 0.70rem + 0.25vw, 0.8125rem);
--font-size-xs:     clamp(0.8125rem, 0.78rem + 0.16vw, 0.875rem);
--font-size-sm:     clamp(0.875rem, 0.84rem + 0.18vw, 0.9375rem);
--font-size-base:   clamp(1rem, 0.96rem + 0.20vw, 1.0625rem);
--font-size-lg:     clamp(1.125rem, 1.07rem + 0.27vw, 1.25rem);
--font-size-xl:     clamp(1.375rem, 1.27rem + 0.50vw, 1.625rem);
--font-size-2xl:    clamp(1.75rem, 1.55rem + 1vw, 2.25rem);
--font-size-3xl:    clamp(2.5rem, 2rem + 2.5vw, 3.75rem);
--font-size-4xl:    clamp(3.5rem, 2.5rem + 5vw, 6rem);
--font-size-display: clamp(4.5rem, 3rem + 7.5vw, 9rem);
```

`text-wrap: balance` on headlines; `text-wrap: pretty` on paragraphs. Heading `letter-spacing: -0.02em` at display weights to tighten optical rhythm.

### Color (OKLCH primary, sRGB hex fallback via `@supports`)

```css
:root {
  /* Canvas (dark base) */
  --color-canvas:         oklch(14% 0.015 285);  /* near-black with subtle cool-purple cast */
  --color-surface-1:      oklch(18% 0.018 285);  /* raised surface — cards, panels */
  --color-surface-2:      oklch(22% 0.020 285);  /* elevated — modals, popovers */
  --color-surface-3:      oklch(26% 0.022 285);  /* highest elevation */
  --color-border:         oklch(30% 0.025 285 / 50%);
  --color-border-strong:  oklch(40% 0.030 285 / 70%);

  /* Text */
  --color-text-primary:   oklch(96% 0.010 285);  /* headline + body */
  --color-text-muted:     oklch(72% 0.015 285);  /* captions, eyebrows, supporting */
  --color-text-subtle:    oklch(55% 0.018 285);  /* tertiary, marginalia */

  /* Signature accent — Merric's purple, locked */
  --color-accent:         oklch(64% 0.22 285);   /* ≈ #8b6bff */
  --color-accent-hover:   oklch(70% 0.22 285);
  --color-accent-muted:   oklch(64% 0.22 285 / 12%);  /* tinted backgrounds, halos */
  --color-accent-glow:    oklch(64% 0.22 285 / 40%); /* shadow glows */

  /* Semantic */
  --color-focus-ring:     oklch(80% 0.18 285);
  --color-success:        oklch(72% 0.18 155);
  --color-warn:           oklch(80% 0.16 75);
  --color-danger:         oklch(65% 0.22 25);
}
```

`prefers-color-scheme: light` variant deferred to v1.5 (post-launch). v1 ships **dark-only** with a documented light-mode TODO. Per 2026 web design trends research: dark mode is now usability standard, but a single well-executed mode beats two half-baked modes for v1.

**Accent treatment principle:** the accent is a *signature*, not a *system*. It appears in: focus rings, primary CTA backgrounds, link underlines on hover, the canvas hero glow, the "now spinning" pulse. NOT in: body text, secondary buttons, decorative dividers, large fills. Discipline preserves its impact.

### Motion

| Layer | Treatment |
|---|---|
| **Page transitions** | View Transitions API via Astro's `<ClientRouter />`. Cross-fade default. `view-transition-name: hero` on the hero composition so it morphs across page navigations. |
| **Scroll-linked** | CSS `animation-timeline: scroll()` and `animation-timeline: view()` for hero parallax depth and marginalia reveals. **No** JavaScript scrolljacking. |
| **Micro-interactions** | CSS-only on `:hover` / `:focus-visible`. Magnetic cursor effect on primary CTAs only (vanilla JS, ~30 lines, opt-out for reduced-motion). |
| **Loading / state** | Skeleton shimmers (CSS) for async data (Spotify Now Playing). Avoid spinners. |
| **Hero canvas** | Lazy-loaded module (~5KB target). Pulls accent color from CSS variable. Idle-detection pauses animation when tab is backgrounded (Page Visibility API). |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` — hero canvas renders a single static representative frame (not blank), all transitions become `0.01ms`, scroll-linked animations snap to end state, magnetic cursor disabled. |

**Motion vocabulary to avoid:** GSAP showreels, page-load entrance animations on every element, parallax-everything, scrolljacking, character-by-character text reveals on long copy, "splash screen" intros.

### Layout primitives

- **Grid:** CSS Grid with `subgrid` where supported. Container queries (`@container`) for component-level responsiveness.
- **Container widths:** `--width-prose: 65ch`, `--width-content: 72rem`, `--width-bleed: 96rem`.
- **Spacing scale (8pt grid):** `--space-1: 0.25rem` through `--space-16: 4rem`, plus `--space-section: clamp(4rem, 6vw, 8rem)` for major rhythms.
- **Logical properties** throughout (`margin-block`, `padding-inline`, etc.).
- **Density patterns:** eyebrows + kickers + trailing meta in Geist Mono `text-transform: uppercase` `letter-spacing: 0.08em`. Marginalia use `position: sticky` + grid columns for the MIT Labs / Stripe Press feel without being precious.

### Hero composition system (the swappable layer Shane specified)

Hero is a layered system with three planes, all CMS-managed:

1. **Background plane (Pages-CMS-managed)** — choose ONE of:
   - `image` — full-bleed image (uploaded via Pages CMS, processed by Astro `<Image>` to AVIF / WebP / fallback with responsive srcset)
   - `canvas` — generative preset (CMS-selected from a library: `starfield`, `wireframe-planet`, `particle-drift`, `meridian-grid`)
   - `layered` — image as base + canvas overlay at 40% opacity for ambient motion + depth (**recommended default** per Shane)
2. **Type plane** — Geist Sans display weight, headline + subhead, `text-wrap: balance`. Editable via Pages CMS.
3. **Meta plane** — Now Spinning widget (positioned per design), CTA links, social handles. All editable via Pages CMS.

`view-transition-name: hero` on the background plane so it morphs across page nav. Optional per-hero accent override (Pages CMS field) — defaults to `#8b6bff` if unset.

### Iconography

- **Lucide** for system icons (open source, consistent line weight, variable stroke). Used sparingly.
- **Custom SVG** for brand marks (avatar reuse, logomark if/when needed).

### Reference URLs to study during implementation

- **vercel.com** — Geist deployment in production, dark canvas + accent treatment
- **linear.app** — type scale rhythm, motion restraint, subtle gradients
- **anthropic.com** — editorial density, serif/sans contrast in marketing pages
- **openai.com** — minimal hero compositions, technical density without clutter
- **spacex.com** — cinematic full-bleed media + sparse type overlays
- **nvidia.com** developer pages — technical density patterns, marginalia, code-aesthetic
- **cerebras.ai** — dark canvas + accent + technical-spec layout
- **nasa.gov** mission pages (incl. Genesis-class missions) — scientific density, image-led narrative
- **media.mit.edu** project pages — quirky/experimental + research density
- **press.stripe.com** — editorial typography, marginalia
- **frame.io** — dark canvas + motion + media-led
- **rauno.me** — personal site reference (motion, type, density)
- **leerob.io** — personal site reference (Now Playing widget, content collections)
- **landonorris.com** — Awwwards SOTY 2025: bold typography + cinematic scroll + 3D + Rive motion (cited for *technique* — our color/density direction is different)
- Recent Awwwards SOTD winners to be added as collected during implementation

## Alternatives considered

| Option | Why not |
|---|---|
| **Inter as primary sans** | Excellent font; Geist edges it for our brief because Geist's geometric Swiss roots match SpaceX / Cerebras / Vercel tonal space more precisely. Inter is a great fallback if Geist hits a deal-breaker. |
| **Berkeley Mono as the mono** | Beautiful but paid (Berkeley Graphics commercial license). Geist Mono is a free peer in the same aesthetic family. |
| **IBM Plex Sans + Mono** | Strong technical-research feel but reads as more "IBM" than "modern AI lab." Reasonable alternative. |
| **Tailwind colors palette as base** | Generic; fights our signature-accent discipline. Custom OKLCH tokens cost ~30 minutes and pay off in coherence. |
| **HSL color tokens** | OKLCH is perceptually uniform — lightness changes feel consistent across hues. HSL is legacy. |
| **GSAP for motion** | Powerful but ~50KB+ baseline. CSS scroll-driven animations + View Transitions API cover 90% of what we need at zero JS cost. Reach for GSAP only if a specific island demands it. |
| **Three.js / WebGL hero** | Overkill — the layered image + 2D canvas approach delivers the visual richness without the bundle cost or device thermal load. Reach for Three.js only when the interaction model is genuinely 3D. |
| **Dark + light dual-theme at v1 launch** | Doubles design / test surface. Ship dark-only at v1; light-mode tokens documented + added in v1.5. |
| **Bold lime-green Lando-Norris-style accent** | Consciously rejected — our brief is "scientific / technical density," not "racing-driver bombast." `#8b6bff` is locked. |

## Consequences

**Positive:**
- Geist + Geist Mono is a free, modern, single-foundry pair that places us tonally with our reference brands at zero licensing complexity
- OKLCH tokens give perceptually-uniform color manipulation; lightness changes feel right across hues
- Motion vocabulary defaults to CSS-only, View Transitions, scroll-driven — Awwwards-tier motion at near-zero JS cost
- Hero composition system is CMS-driven, so Merric can re-skin the site in 30 seconds without code
- Dark-only v1 keeps test surface manageable; light-mode TODO documented

**Negative / costs:**
- Self-hosting variable fonts requires subsetting work in Phase 0 (~30 min with `glyphhanger` or `fonttools`)
- OKLCH still needs sRGB fallbacks for ~3% of browsers in 2026; `@supports` handles gracefully
- View Transitions API has good Chromium + Safari support in 2026; Firefox lagging — graceful fallback to no-transition
- Three-plane hero composition adds Pages CMS schema complexity; offset by the swap-it-yourself power Shane wanted

## Open items for Phase 0 implementation

- [ ] Confirm Geist Mono variable build is available via `geist` npm at the version we install (Geist Pixel shipped Feb 2026 per Vercel blog; verify standard Geist + Geist Mono variable axes unchanged)
- [ ] Newsreader self-host vs Google Fonts CDN — likely self-host per privacy + perf
- [ ] Confirm `view-transition-name` morph behavior across the layered hero composition (no compositor flicker)
- [ ] Canvas preset library: ship 2 at v1 (`starfield`, `wireframe-planet`); add `particle-drift` and `meridian-grid` post-launch based on Merric's actual usage
- [ ] Reduced-motion canvas: render single representative frame, not blank — verify visually
- [ ] Verify Geist Pixel availability if we want to use it for retro/8-bit moments tied to Minecraft theming on `/minecraft/` route
