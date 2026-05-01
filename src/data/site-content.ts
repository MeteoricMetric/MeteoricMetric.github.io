// merricstrough.com — single-file site-content loaders.
//
// Hero, identity, and now-spinning are single-config JSON files Pages CMS
// edits in place. Astro's content-collection `file()` loader expects an
// array or keyed-records for these, which doesn't fit a single root object —
// so we read them directly here and validate with Zod at build time. This
// keeps the same level of type safety + schema enforcement that a content
// collection would give us.

import heroRaw from '@content/hero.json';
import identityRaw from '@content/identity.json';
import nowRaw from '@content/now.json';
import nowSpinningRaw from '@content/now-spinning.json';
import { z } from 'astro/zod';

// ── Hero ─────────────────────────────────────────────────────────────────

const heroSchema = z.object({
  backgroundMode: z.enum(['image', 'canvas', 'layered']).default('layered'),
  backgroundImage: z.string().optional(),
  canvasPreset: z.enum(['starfield', 'wireframe-planet']).default('starfield'),
  accentOverride: z.string().optional(),
  headline: z.string().min(1),
  subhead: z.string().optional(),
  ctas: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.url(),
        kind: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
      }),
    )
    .optional()
    .default([]),
});

export type Hero = z.infer<typeof heroSchema>;
export const hero: Hero = heroSchema.parse(heroRaw);

// ── Identity ─────────────────────────────────────────────────────────────

const identitySchema = z.object({
  tagline: z.string().min(1),
  blurb: z.string().min(1),
});

export type Identity = z.infer<typeof identitySchema>;
export const identity: Identity = identitySchema.parse(identityRaw);

// ── Now Spinning ─────────────────────────────────────────────────────────

const nowSpinningSchema = z.object({
  mode: z.enum(['live', 'manual', 'off']).default('off'),
  manualTrackUrl: z.url().optional(),
});

export type NowSpinning = z.infer<typeof nowSpinningSchema>;
export const nowSpinning: NowSpinning = nowSpinningSchema.parse(nowSpinningRaw);

// ── /now page (IndieWeb convention — what I'm doing right now) ──────────

const nowSchema = z.object({
  updated: z.coerce.date(),
  blurbs: z.array(z.string().min(1)).min(1),
});

export type Now = z.infer<typeof nowSchema>;
export const now: Now = nowSchema.parse(nowRaw);
