/**
 * Wireframe planet preset — a slowly rotating gridded sphere anchored to the
 * lower edge so it reads as a horizon. Latitude rings and longitude meridians
 * are drawn as 2D parametric projections of a unit sphere (no Three.js, no WebGL).
 *
 * Projection model: rotate sphere points by `rotY` around the Y axis, then
 * orthographically project (x, y, z) → (x * R, y * R) onto the canvas. A point's
 * z-sign decides whether it's on the hemisphere facing the camera (drawn at
 * higher alpha) or the back (drawn dim).
 */

import type { HeroCanvasController, HeroCanvasOptions } from './types';

const LAT_LINES = 7 as const; // horizontal rings (excluding poles, evenly spaced in latitude)
const LON_LINES = 12 as const; // vertical meridians, evenly spaced in longitude
const SEGMENTS = 64 as const; // points per ring/meridian — enough for smooth ellipses at hero scale
const ROTATION_PERIOD_MS = 60_000 as const; // one full revolution
const PULSE_INTERVAL_MIN_MS = 8_000 as const;
const PULSE_INTERVAL_MAX_MS = 12_000 as const;
const PULSE_DURATION_MS = 800 as const;

const BASE_ALPHA = 0.25 as const;
const EQUATOR_ALPHA = 0.4 as const;
const HIDDEN_ALPHA_SCALE = 0.35 as const; // back-hemisphere multiplier

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;

interface Point2D {
  x: number;
  y: number;
  /** Signed depth — positive = facing camera, negative = back. */
  z: number;
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

const scheduleNextPulse = (): number =>
  performance.now() + rand(PULSE_INTERVAL_MIN_MS, PULSE_INTERVAL_MAX_MS);

export function createWireframePlanet(opts: HeroCanvasOptions): HeroCanvasController {
  const { canvas, accentColor, reducedMotion } = opts;
  const opacity = opts.opacity ?? 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('wireframe-planet: 2D context unavailable');

  let cw = 0;
  let ch = 0;
  let dpr = 1;
  let cx = 0;
  let cy = 0;
  let radius = 0;
  let rafId: number | null = null;
  let lastTs = 0;
  let running = false;
  let rotY = 0;
  let pulseStartedAt: number | null = null;
  let nextPulseAt = 0;

  const sizeToCss = (): void => {
    const rect = canvas.getBoundingClientRect();
    cw = Math.max(1, Math.floor(rect.width));
    ch = Math.max(1, Math.floor(rect.height));
    dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = cw / 2;
    cy = ch * 0.85;
    radius = ch * 0.45;
  };

  /**
   * Project a unit-sphere point (lat, lon) under current rotY.
   * Standard spherical → Cartesian then a Y-axis rotation, then orthographic to canvas.
   */
  const project = (lat: number, lon: number): Point2D => {
    const cosLat = Math.cos(lat);
    const x0 = cosLat * Math.cos(lon);
    const y0 = Math.sin(lat);
    const z0 = cosLat * Math.sin(lon);
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    const x = x0 * cosR + z0 * sinR;
    const z = -x0 * sinR + z0 * cosR;
    // Canvas y grows downward; sphere y grows upward → invert.
    return { x: cx + x * radius, y: cy - y0 * radius, z };
  };

  /**
   * Draw a polyline of projected points. Each segment's alpha is a function of
   * the average z of its endpoints, so a meridian crossing the limb dims smoothly
   * as it wraps to the back hemisphere.
   */
  const strokeArc = (pts: readonly Point2D[], baseAlpha: number, color: string): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (!a || !b) continue;
      const avgZ = (a.z + b.z) / 2;
      const facing = avgZ >= 0;
      const alpha = baseAlpha * (facing ? 1 : HIDDEN_ALPHA_SCALE);
      ctx.globalAlpha = alpha * opacity;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  };

  const buildLatRing = (lat: number): Point2D[] => {
    const pts: Point2D[] = new Array(SEGMENTS + 1);
    for (let i = 0; i <= SEGMENTS; i++) {
      const lon = (i / SEGMENTS) * TWO_PI;
      pts[i] = project(lat, lon);
    }
    return pts;
  };

  const buildLonArc = (lon: number): Point2D[] => {
    const pts: Point2D[] = new Array(SEGMENTS + 1);
    for (let i = 0; i <= SEGMENTS; i++) {
      const lat = -HALF_PI + (i / SEGMENTS) * Math.PI;
      pts[i] = project(lat, lon);
    }
    return pts;
  };

  const draw = (nowMs: number): void => {
    ctx.clearRect(0, 0, cw, ch);

    // Latitudes (excluding the two poles which would degenerate to single points).
    for (let i = 1; i < LAT_LINES + 1; i++) {
      const lat = -HALF_PI + (i / (LAT_LINES + 1)) * Math.PI;
      strokeArc(buildLatRing(lat), BASE_ALPHA, accentColor);
    }

    // Equator — drawn separately so we can pulse it without re-walking everything.
    let equatorAlpha = EQUATOR_ALPHA;
    if (pulseStartedAt !== null) {
      const elapsed = nowMs - pulseStartedAt;
      if (elapsed >= PULSE_DURATION_MS) {
        pulseStartedAt = null;
        nextPulseAt = scheduleNextPulse();
      } else {
        // Ease-out cubic: spike to full alpha instantly, then decay back to base.
        const t = elapsed / PULSE_DURATION_MS;
        const decay = 1 - t * t * t;
        equatorAlpha = EQUATOR_ALPHA + (1 - EQUATOR_ALPHA) * decay;
      }
    } else if (!reducedMotion && nowMs >= nextPulseAt) {
      pulseStartedAt = nowMs;
    }
    strokeArc(buildLatRing(0), equatorAlpha, accentColor);

    // Longitudes — half-meridian arcs from south pole to north pole.
    for (let i = 0; i < LON_LINES; i++) {
      const lon = (i / LON_LINES) * TWO_PI;
      strokeArc(buildLonArc(lon), BASE_ALPHA, accentColor);
    }

    ctx.globalAlpha = 1;
  };

  const tick = (ts: number): void => {
    if (!running) return;
    const dt = lastTs === 0 ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    rotY = (rotY + (TWO_PI * dt) / (ROTATION_PERIOD_MS / 1000)) % TWO_PI;
    draw(ts);
    rafId = requestAnimationFrame(tick);
  };

  const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') stop();
    else if (!reducedMotion) start();
  };

  function start(): void {
    if (running || reducedMotion) return;
    running = true;
    lastTs = 0;
    nextPulseAt = scheduleNextPulse();
    rafId = requestAnimationFrame(tick);
  }

  function stop(): void {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function resize(): void {
    sizeToCss();
    if (reducedMotion) draw(performance.now());
  }

  function destroy(): void {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  sizeToCss();
  document.addEventListener('visibilitychange', onVisibility);

  if (reducedMotion) {
    // Static frame: fix rotation at a quarter-turn so the equator's curve is visible.
    rotY = Math.PI / 4;
    draw(performance.now());
  }

  return { start, stop, resize, destroy };
}
