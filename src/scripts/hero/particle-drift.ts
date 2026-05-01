/**
 * Particle drift preset — atmospheric, slower than starfield, sparser, more
 * directional ambiguity. Particles move in randomized vectors (not all downward)
 * so the field feels like dust suspended in air rather than a meteor shower.
 *
 * A small subset of particles get an accent-colored halo — the "highlighted"
 * dust grains. Same lifecycle contract as starfield + wireframe-planet.
 */

import type { HeroCanvasController, HeroCanvasOptions } from './types';

const PARTICLE_COUNT = 120 as const;
const HIGHLIGHT_RATIO = 0.08 as const;
const PARTICLE_MIN_SIZE = 0.6 as const;
const PARTICLE_MAX_SIZE = 1.8 as const;

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  /** Velocity in px/s — randomized vector, not gravity-aligned. */
  vx: number;
  vy: number;
  highlighted: boolean;
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

const createParticle = (cw: number, ch: number): Particle => {
  const speed = rand(3, 12);
  const angle = Math.random() * Math.PI * 2;
  const highlighted = Math.random() < HIGHLIGHT_RATIO;
  return {
    x: Math.random() * cw,
    y: Math.random() * ch,
    size: rand(PARTICLE_MIN_SIZE, PARTICLE_MAX_SIZE) * (highlighted ? 1.6 : 1),
    alpha: rand(0.25, 0.7) * (highlighted ? 1.2 : 1),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    highlighted,
  };
};

const seedParticles = (cw: number, ch: number): Particle[] =>
  Array.from({ length: PARTICLE_COUNT }, () => createParticle(cw, ch));

export function createParticleDrift(opts: HeroCanvasOptions): HeroCanvasController {
  const { canvas, accentColor, reducedMotion } = opts;
  const opacity = opts.opacity ?? 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('particle-drift: 2D context unavailable');

  let cw = 0;
  let ch = 0;
  let dpr = 1;
  let particles: Particle[] = [];
  let rafId: number | null = null;
  let lastTs = 0;
  let running = false;

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

    for (const p of particles) {
      ctx.globalAlpha = p.alpha * opacity;
      if (p.highlighted) {
        // Halo — soft accent-tinted disk under the particle.
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        grad.addColorStop(0, accentColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = p.alpha * 0.4 * opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = p.alpha * opacity;
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  const step = (dt: number): void => {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Wrap on all four edges so the field stays full.
      if (p.x < -2) p.x = cw + 2;
      else if (p.x > cw + 2) p.x = -2;
      if (p.y < -2) p.y = ch + 2;
      else if (p.y > ch + 2) p.y = -2;
    }
  };

  const tick = (ts: number): void => {
    if (!running) return;
    const dt = lastTs === 0 ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    step(dt);
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
    particles = seedParticles(cw, ch);
    if (reducedMotion) draw();
  }

  function destroy(): void {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  sizeToCss();
  particles = seedParticles(cw, ch);
  document.addEventListener('visibilitychange', onVisibility);

  if (reducedMotion) draw();

  return { start, stop, resize, destroy };
}
