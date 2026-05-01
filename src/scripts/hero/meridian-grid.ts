/**
 * Meridian-grid preset — a flat perspective grid receding into a horizon line.
 * Tron-style ground plane: horizontal lines parallel to the viewer + vertical
 * lines converging toward the vanishing point. Lines fade with distance and
 * scroll slowly toward the viewer to suggest motion through space.
 *
 * Single accent-colored "leading edge" pulses occasionally to give the eye
 * a focal point without breaking the receding-grid mood.
 */

import type { HeroCanvasController, HeroCanvasOptions } from './types';

const HORIZON_RATIO = 0.55 as const; // horizon line at 55% from top
const VANISHING_POINT_X_RATIO = 0.5 as const; // centered vanishing point
const HORIZONTAL_LINE_COUNT = 14 as const;
const VERTICAL_LINE_COUNT = 21 as const;
const SCROLL_SPEED = 0.08 as const; // grid units per second
const PULSE_INTERVAL_MIN_MS = 6_000 as const;
const PULSE_INTERVAL_MAX_MS = 11_000 as const;
const PULSE_DURATION_MS = 1_400 as const;

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

const scheduleNextPulse = (): number =>
  performance.now() + rand(PULSE_INTERVAL_MIN_MS, PULSE_INTERVAL_MAX_MS);

export function createMeridianGrid(opts: HeroCanvasOptions): HeroCanvasController {
  const { canvas, accentColor, reducedMotion } = opts;
  const opacity = opts.opacity ?? 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('meridian-grid: 2D context unavailable');

  let cw = 0;
  let ch = 0;
  let dpr = 1;
  let rafId: number | null = null;
  let lastTs = 0;
  let running = false;
  let scrollOffset = 0; // 0..1, wraps; controls horizontal-line positions
  let pulseElapsed = 0; // ms since pulse start; -1 when no pulse active
  let nextPulseAt = 0;

  const sizeToCss = (): void => {
    const rect = canvas.getBoundingClientRect();
    cw = Math.max(1, Math.floor(rect.width));
    ch = Math.max(1, Math.floor(rect.height));
    dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /**
   * Project a "world-space" Z (0 = at viewer, 1 = at horizon) to canvas Y.
   * Quadratic curve gives the recession a believable foreshortening — lines
   * near the horizon compress quickly, lines near the viewer spread out.
   */
  const projectZ = (z: number): number => {
    const horizonY = ch * HORIZON_RATIO;
    const viewerY = ch + 8;
    const t = 1 - (1 - z) * (1 - z); // ease-out quadratic
    return viewerY + (horizonY - viewerY) * t;
  };

  const draw = (): void => {
    ctx.clearRect(0, 0, cw, ch);

    const horizonY = ch * HORIZON_RATIO;
    const vpX = cw * VANISHING_POINT_X_RATIO;
    const baseAlpha = opacity * 0.55;

    // Horizontal grid lines — parallel to the viewer, recede with z.
    for (let i = 0; i < HORIZONTAL_LINE_COUNT; i++) {
      const z = (i + scrollOffset) / HORIZONTAL_LINE_COUNT;
      if (z >= 1 || z <= 0) continue;
      const y = projectZ(z);
      // Fade lines as they approach the horizon.
      const fade = 1 - z * z;
      ctx.globalAlpha = baseAlpha * fade;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // Vertical grid lines — converge to the vanishing point.
    const groundY = ch + 8;
    for (let i = 0; i <= VERTICAL_LINE_COUNT; i++) {
      const xRatio = i / VERTICAL_LINE_COUNT;
      // Spread vertical anchors well outside the viewport so the perspective
      // converges visibly; near-edges sweep beyond the canvas.
      const groundX = (xRatio - 0.5) * cw * 3.5 + vpX;
      ctx.globalAlpha = baseAlpha * 0.85;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(groundX, groundY);
      ctx.lineTo(vpX, horizonY);
      ctx.stroke();
    }

    // Horizon edge — bright accent line at the horizon for the eye to lock on.
    ctx.globalAlpha = opacity * 0.7;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(cw, horizonY);
    ctx.stroke();

    // Pulse — bright leading-edge horizontal line scrolls toward viewer.
    if (pulseElapsed >= 0) {
      const t = pulseElapsed / PULSE_DURATION_MS;
      const z = 1 - t; // pulse starts at horizon (z=1) and travels toward viewer (z=0)
      if (z > 0 && z < 1) {
        const y = projectZ(z);
        const fade = Math.sin(t * Math.PI); // peak in the middle of the pulse
        ctx.globalAlpha = opacity * fade;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  };

  const step = (dt: number, nowMs: number): void => {
    scrollOffset = (scrollOffset + SCROLL_SPEED * dt) % 1;
    if (pulseElapsed >= 0) {
      pulseElapsed += dt * 1000;
      if (pulseElapsed >= PULSE_DURATION_MS) {
        pulseElapsed = -1;
        nextPulseAt = scheduleNextPulse();
      }
    } else if (nowMs >= nextPulseAt) {
      pulseElapsed = 0;
    }
  };

  const tick = (ts: number): void => {
    if (!running) return;
    const dt = lastTs === 0 ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    step(dt, ts);
    draw();
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
    if (reducedMotion) draw();
  }

  function destroy(): void {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  sizeToCss();
  document.addEventListener('visibilitychange', onVisibility);

  if (reducedMotion) draw();

  return { start, stop, resize, destroy };
}
