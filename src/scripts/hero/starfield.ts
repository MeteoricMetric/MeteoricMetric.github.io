/**
 * Starfield preset — a nod to Merric's "MeteoricMetric" handle.
 * Depth-bucketed stars drift downward with parallax sway; occasional accent-colored
 * meteor streaks cut top-right → bottom-left. Pure 2D canvas, zero deps.
 *
 * Cursor reactivity (per Enhancement 1, 2026-05): each star carries a transient
 * (offsetX, offsetY) displacement that gets pushed AWAY from the cursor when the
 * cursor enters a ~140px radius around it. The offset decays exponentially back
 * to zero each frame so stars "dodge and settle" as the pointer passes — fluid
 * and ambient, not chaotic. Touch devices ignored (no cursor; no harm). Reduced
 * motion path stays static (animation loop never starts → no offset ever applied).
 *
 * Lifecycle is owned by the returned controller. The factory does not mount any
 * listeners until start() is called — except the resize-safe sizeToCss() and the
 * pointer/visibility document listeners which are attached at construction so
 * they're available before/after start/stop cycles.
 */

import type { HeroCanvasController, HeroCanvasOptions } from './types';

const STAR_COUNT = 300 as const;
const DEPTH_BUCKETS = 5 as const;
const METEOR_INTERVAL_MIN_MS = 4_000 as const;
const METEOR_INTERVAL_MAX_MS = 7_000 as const;
const METEOR_DURATION_MS = 600 as const;

// Cursor repulsion tuning — chosen so the effect is felt within ~one cursor
// width but never knocks stars off-screen or makes the field feel chaotic.
const REPULSION_RADIUS_PX = 140 as const;
const REPULSION_STRENGTH = 600 as const; // px/s² at zero distance, falls off with squared factor
const OFFSET_DECAY_PER_SEC = 4 as const; // exponential decay rate of offset back to 0

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  /** 1 = nearest (fastest, brightest, biggest); DEPTH_BUCKETS = farthest. */
  depth: number;
  /** Cached vertical speed in px/s, derived from depth. */
  vy: number;
  /** Sway amplitude (px) and phase offset (radians) for horizontal drift. */
  swayAmp: number;
  swayPhase: number;
  /** Transient cursor-repulsion offset; decays toward 0 each frame. */
  offsetX: number;
  offsetY: number;
}

interface Meteor {
  /** Elapsed ms since the streak began; null when no meteor in flight. */
  elapsed: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

const createStar = (cw: number, ch: number): Star => {
  const depth = 1 + Math.floor(Math.random() * DEPTH_BUCKETS);
  const depthNorm = (DEPTH_BUCKETS - depth + 1) / DEPTH_BUCKETS; // 1 (near) … 1/N (far)
  return {
    x: Math.random() * cw,
    y: Math.random() * ch,
    size: rand(1, 3) * depthNorm,
    alpha: rand(0.3, 1.0) * depthNorm,
    depth,
    vy: rand(5, 15) * depthNorm,
    swayAmp: rand(2, 6) * depthNorm,
    swayPhase: Math.random() * Math.PI * 2,
    offsetX: 0,
    offsetY: 0,
  };
};

const seedStars = (cw: number, ch: number): Star[] =>
  Array.from({ length: STAR_COUNT }, () => createStar(cw, ch));

const scheduleNextMeteor = (): number =>
  performance.now() + rand(METEOR_INTERVAL_MIN_MS, METEOR_INTERVAL_MAX_MS);

const spawnMeteor = (cw: number, ch: number): Meteor => {
  // Top-right region → bottom-left region; randomized within a generous band.
  const startX = rand(cw * 0.55, cw * 1.05);
  const startY = rand(-ch * 0.1, ch * 0.35);
  const endX = rand(-cw * 0.05, cw * 0.45);
  const endY = rand(ch * 0.65, ch * 1.1);
  return { elapsed: 0, startX, startY, endX, endY };
};

export function createStarfield(opts: HeroCanvasOptions): HeroCanvasController {
  const { canvas, accentColor, reducedMotion } = opts;
  const opacity = opts.opacity ?? 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('starfield: 2D context unavailable');

  let cw = 0;
  let ch = 0;
  let dpr = 1;
  let stars: Star[] = [];
  let meteor: Meteor | null = null;
  let nextMeteorAt = 0;
  let rafId: number | null = null;
  let lastTs = 0;
  let running = false;
  // Cursor position in canvas-local coordinates; null when no mouse/pen is tracked.
  // Used by the per-star repulsion in step(). Touch points never set this.
  let cursorX: number | null = null;
  let cursorY: number | null = null;

  const sizeToCss = (): void => {
    const rect = canvas.getBoundingClientRect();
    cw = Math.max(1, Math.floor(rect.width));
    ch = Math.max(1, Math.floor(rect.height));
    dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (): void => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.globalAlpha = 1;

    for (const s of stars) {
      ctx.globalAlpha = s.alpha * opacity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x + s.offsetX, s.y + s.offsetY, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (meteor) {
      const t = Math.min(1, meteor.elapsed / METEOR_DURATION_MS);
      const headX = meteor.startX + (meteor.endX - meteor.startX) * t;
      const headY = meteor.startY + (meteor.endY - meteor.startY) * t;
      // Tail trails behind by ~25% of the path; alpha fades over the second half.
      const tailT = Math.max(0, t - 0.25);
      const tailX = meteor.startX + (meteor.endX - meteor.startX) * tailT;
      const tailY = meteor.startY + (meteor.endY - meteor.startY) * tailT;
      const fade = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5;

      const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, accentColor);
      ctx.globalAlpha = fade * opacity;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  const step = (dt: number, nowMs: number): void => {
    // Pre-compute the per-frame decay multiplier once (independent of star).
    const decay = Math.exp(-OFFSET_DECAY_PER_SEC * dt);
    const haveCursor = cursorX !== null && cursorY !== null;

    for (const s of stars) {
      // Natural drift — gravity downward + horizontal sway.
      s.y += s.vy * dt;
      // Sway: tiny horizontal oscillation independent of vy keeps motion alive when looked at directly.
      s.x += Math.sin(nowMs / 1000 + s.swayPhase) * s.swayAmp * dt * 0.1;

      // Cursor repulsion — push away with squared falloff inside REPULSION_RADIUS.
      // Applied to the transient offset, not the natural position, so the star
      // returns to its trajectory once the cursor passes.
      if (haveCursor) {
        // Compare cursor against rendered position (natural + current offset) so
        // a star already partially displaced doesn't get double-pushed at the same
        // spot — keeps the field from feeling unstable when cursor lingers.
        const dx = s.x + s.offsetX - (cursorX as number);
        const dy = s.y + s.offsetY - (cursorY as number);
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < REPULSION_RADIUS_PX) {
          const factor = 1 - dist / REPULSION_RADIUS_PX; // 1 at cursor, 0 at edge
          const force = REPULSION_STRENGTH * factor * factor; // squared = snappier feel
          const ux = dx / dist;
          const uy = dy / dist;
          s.offsetX += ux * force * dt;
          s.offsetY += uy * force * dt;
        }
      }

      // Spring-decay the offset back toward 0 so stars settle when the cursor leaves.
      s.offsetX *= decay;
      s.offsetY *= decay;

      if (s.y > ch + 2) {
        s.y = -2;
        s.x = Math.random() * cw;
        s.offsetX = 0;
        s.offsetY = 0;
      }
      if (s.x < -2) s.x = cw + 2;
      else if (s.x > cw + 2) s.x = -2;
    }

    if (meteor) {
      meteor.elapsed += dt * 1000;
      if (meteor.elapsed >= METEOR_DURATION_MS) {
        meteor = null;
        nextMeteorAt = scheduleNextMeteor();
      }
    } else if (nowMs >= nextMeteorAt) {
      meteor = spawnMeteor(cw, ch);
    }
  };

  const tick = (ts: number): void => {
    if (!running) return;
    const dt = lastTs === 0 ? 0 : Math.min(0.05, (ts - lastTs) / 1000); // clamp dt to avoid jumps after pause
    lastTs = ts;
    step(dt, ts);
    draw();
    rafId = requestAnimationFrame(tick);
  };

  const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') stop();
    else if (!reducedMotion) start();
  };

  // Pointer tracking — mouse + pen only, never touch. Listening on document
  // (not canvas) because the canvas is pointer-events:none so anything above
  // it stays clickable; we just translate the global coords into canvas-local.
  const onPointerMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const rect = canvas.getBoundingClientRect();
    cursorX = e.clientX - rect.left;
    cursorY = e.clientY - rect.top;
  };

  const onPointerLeave = (): void => {
    cursorX = null;
    cursorY = null;
  };

  function start(): void {
    if (running || reducedMotion) return;
    running = true;
    lastTs = 0;
    nextMeteorAt = scheduleNextMeteor();
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
    stars = seedStars(cw, ch);
    if (reducedMotion) draw();
  }

  function destroy(): void {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerleave', onPointerLeave);
  }

  // Initial sizing + seeding so the first frame (or static frame) is correct.
  sizeToCss();
  stars = seedStars(cw, ch);
  document.addEventListener('visibilitychange', onVisibility);
  // Cursor listeners only matter when the animation is running, but attach them
  // here so we don't have to manage subscription lifecycle inside start/stop.
  // They're cheap (read-only on a single state pair) and ignored at draw time
  // when reducedMotion holds the loop static.
  if (!reducedMotion) {
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
  }

  if (reducedMotion) draw();

  return { start, stop, resize, destroy };
}
