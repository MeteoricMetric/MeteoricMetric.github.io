/**
 * Magnetic cursor — primary CTA pills "pull" toward the cursor when nearby.
 *
 * Applied to any element with `data-magnetic` (and optional `data-magnetic-strength`
 * to override the default pull factor). Uses pointer events filtered to mouse + pen
 * so touch devices don't get a phantom effect.
 *
 * Per ADR-0002 §Motion — magnetic cursor is the "premium feel" micro-interaction.
 * Disabled wholesale under prefers-reduced-motion (the listener never registers).
 *
 * Tuning notes:
 *   - DEFAULT_RADIUS = 120px:  the "field of attraction" around each element
 *   - DEFAULT_STRENGTH = 0.28: how far the element travels toward the cursor as
 *     a fraction of the displacement (0.28 = element moves 28% of the way)
 *   - Spring transition on transform = 220ms ease-out for a natural settle when
 *     the cursor leaves the field
 */

const DEFAULT_RADIUS = 120;
const DEFAULT_STRENGTH = 0.28;

interface TrackedElement {
  el: HTMLElement;
  radius: number;
  strength: number;
}

function readNumberAttr(el: HTMLElement, attr: string, fallback: number): number {
  const raw = el.getAttribute(attr);
  if (raw === null) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function init(): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elements: TrackedElement[] = Array.from(
    document.querySelectorAll<HTMLElement>('[data-magnetic]'),
  ).map((el) => {
    el.style.willChange = 'transform';
    el.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
    return {
      el,
      radius: readNumberAttr(el, 'data-magnetic-radius', DEFAULT_RADIUS),
      strength: readNumberAttr(el, 'data-magnetic-strength', DEFAULT_STRENGTH),
    };
  });

  if (elements.length === 0) return;

  const onPointerMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    for (const t of elements) {
      const rect = t.el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < t.radius) {
        // Linear falloff inside radius; element pulls TOWARD cursor by `strength`
        // of the displacement, scaled by how deep into the radius the cursor is.
        const factor = (1 - dist / t.radius) * t.strength;
        t.el.style.transform = `translate3d(${dx * factor}px, ${dy * factor}px, 0)`;
      } else {
        // Reset only when previously displaced — minor optimization to avoid
        // restamping the same transform string every frame.
        if (t.el.style.transform !== '') t.el.style.transform = '';
      }
    }
  };

  document.addEventListener('pointermove', onPointerMove, { passive: true });

  // Astro view-transition cleanup: drop listener + clear transforms before swap
  // so the next page doesn't inherit lingering offsets on still-mounted nodes.
  document.addEventListener(
    'astro:before-swap',
    () => {
      document.removeEventListener('pointermove', onPointerMove);
      for (const t of elements) t.el.style.transform = '';
    },
    { once: true },
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

// Re-init after Astro view transitions (the new page's [data-magnetic] elements
// need fresh attachment; the previous run's `elements` list referenced the
// old DOM nodes which were swapped out).
document.addEventListener('astro:page-load', init);

// Force module scope — without imports/exports this file is a script and its
// top-level `init` / `readNumberAttr` collide with the same names in card-tilt.ts.
export {};
