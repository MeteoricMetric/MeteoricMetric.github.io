/**
 * Hero canvas orchestrator (per ADR-0002 §Hero composition system).
 * Mounts a named preset against a canvas element and returns a controller that
 * the caller (Astro island) is responsible for tearing down on unmount.
 */

import { createMeridianGrid } from './meridian-grid';
import { createParticleDrift } from './particle-drift';
import { createStarfield } from './starfield';
import type { HeroCanvasController, HeroCanvasOptions, HeroCanvasPreset } from './types';
import { createWireframePlanet } from './wireframe-planet';

export type { HeroCanvasController, HeroCanvasOptions, HeroCanvasPreset };

export function mountHeroCanvas(
  preset: HeroCanvasPreset,
  opts: HeroCanvasOptions,
): HeroCanvasController {
  switch (preset) {
    case 'starfield':
      return createStarfield(opts);
    case 'wireframe-planet':
      return createWireframePlanet(opts);
    case 'particle-drift':
      return createParticleDrift(opts);
    case 'meridian-grid':
      return createMeridianGrid(opts);
  }
}

/** Read the design-token accent color off any element (typically the canvas itself). */
export function readAccentColor(el: HTMLElement): string {
  const v = getComputedStyle(el).getPropertyValue('--color-accent').trim();
  return v || '#8b6bff';
}

/** Read the user's reduced-motion preference at call time. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
