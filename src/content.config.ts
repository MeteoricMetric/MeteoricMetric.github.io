// merricstrough.com — content collections (per ADR-0001).
//
// Only the multi-entry `projects` collection lives here — Astro 6's `file()`
// loader expects an array or keyed-records, not a single root object, so
// single-file configs (hero, identity, now-spinning) live in
// src/data/site-content.ts as direct typed JSON imports with Zod validation.

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projectsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    status: z.enum(['active', 'paused', 'shipped', 'exploring']).default('active'),
    summary: z.string().min(1),
    url: z.url().optional(),
    image: z.string().optional(),
    updated: z.coerce.date(),
    tags: z.array(z.string()).optional().default([]),
  }),
});

export const collections = {
  projects: projectsCollection,
};
