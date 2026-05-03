/**
 * 3D card tilt — cards lean toward the cursor like they're floating slightly
 * above the page. Subtle (max ~6° each axis) so it reads as polish, not a
 * theme-park ride. Vanilla JS + CSS perspective.
 *
 * Applied to any element with `data-tilt` (with optional `data-tilt-max` for
 * per-element override of the maximum rotation in degrees).
 *
 * Per ADR-0002 §Motion — pairs with magnetic-cursor.ts; the two effects are
 * complementary (small interactive pills get magnetic pull, larger cards get
 * the parallax tilt). Disabled wholesale under prefers-reduced-motion.
 *
 * Tuning notes:
 *   - DEFAULT_MAX_DEG = 6: rotation cap, in degrees, on each axis
 *   - perspective = 800px: how dramatic the foreshortening reads (lower = more)
 *   - Transition timing matches magnetic-cursor.ts for visual cohesion
 */

const DEFAULT_MAX_DEG = 6;
const PERSPECTIVE_PX = 800;

function readNumberAttr(el: HTMLElement, attr: string, fallback: number): number {
  const raw = el.getAttribute(attr);
  if (raw === null) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function init(): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
  if (elements.length === 0) return;

  for (const el of elements) {
    el.style.willChange = 'transform';
    el.style.transformStyle = 'preserve-3d';
    el.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
  }

  // Cleanup helper — used on pointer leave AND view-transition swap.
  const reset = (el: HTMLElement): void => {
    el.style.transform = '';
  };

  for (const el of elements) {
    const maxDeg = readNumberAttr(el, 'data-tilt-max', DEFAULT_MAX_DEG);

    const onMove = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const rect = el.getBoundingClientRect();
      // Normalize cursor position to [-1, 1] across each axis of the card.
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const nx = px * 2 - 1;
      const ny = py * 2 - 1;
      // rotateX is inverted vs y-axis (cursor at TOP → tilt FORWARD = negative rotateX)
      const rotateY = nx * maxDeg;
      const rotateX = -ny * maxDeg;
      el.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const onLeave = (): void => reset(el);

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    // Astro view-transition cleanup — drop listeners + reset transforms.
    document.addEventListener(
      'astro:before-swap',
      () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
        reset(el);
      },
      { once: true },
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

document.addEventListener('astro:page-load', init);

// Force module scope — without imports/exports this file is a script and its
// top-level `init` / `readNumberAttr` collide with the same names in magnetic-cursor.ts.
export {};
