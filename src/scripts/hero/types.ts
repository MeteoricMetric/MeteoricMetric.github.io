/**
 * Shared types for the hero canvas preset system (per ADR-0002 §Hero composition).
 * Each preset module exports a factory that returns a HeroCanvasController so the
 * caller (an Astro island) owns the lifecycle and can swap presets without leaking
 * rAF handles or event listeners.
 */

export type HeroCanvasPreset =
  | 'starfield'
  | 'wireframe-planet'
  | 'particle-drift'
  | 'meridian-grid';

export interface HeroCanvasOptions {
  canvas: HTMLCanvasElement;
  /** CSS color string (oklch or hex) — pulled from getComputedStyle on a tokens-aware element. */
  accentColor: string;
  /** Honor prefers-reduced-motion at mount time. true → render a single static frame, no rAF loop. */
  reducedMotion: boolean;
  /** 0..1, default 1. The layered hero composition uses ~0.4 to sit beneath an image. */
  opacity?: number;
}

export interface HeroCanvasController {
  start(): void;
  stop(): void;
  resize(): void;
  destroy(): void;
}
