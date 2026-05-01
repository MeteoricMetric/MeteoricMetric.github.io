import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility tests — operationalizes CLAUDE.md §6.1 + ADR-0002 reduced-motion
 * treatment. WCAG 2.2 AA is the floor; 0 violations is the gate.
 *
 * Note on viewport sweep: playwright.config.ts already runs every project at
 * 4 viewports x 3 browsers. We don't re-loop viewports here — the project matrix
 * does it for us. Each test runs 12 times.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  helpUrl: string;
  nodes: Array<{ target: string[]; failureSummary?: string }>;
}

function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map((v) => {
      const targets = v.nodes
        .map((n) => `      - ${n.target.join(' ')}`)
        .join('\n');
      return [
        `  [${v.impact ?? 'unknown'}] ${v.id} — ${v.help}`,
        `    ${v.helpUrl}`,
        targets,
      ].join('\n');
    })
    .join('\n\n');
}

async function runAxe(page: Page): Promise<AxeViolation[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations as unknown as AxeViolation[];
}

test.describe.parallel('a11y — landing page', () => {
  test('has zero axe violations against WCAG 2.2 AA', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const violations = await runAxe(page);
    expect(
      violations.length,
      `${violations.length} axe violation(s) at ${testInfo.project.name}:\n${formatViolations(violations)}`,
    ).toBe(0);
  });
});

test.describe.parallel('a11y — keyboard', () => {
  test('every interactive element is reachable and shows a focus indicator', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const interactiveCount = await page
      .locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .count();
    expect(interactiveCount, 'at least one interactive element').toBeGreaterThan(0);

    // Tab through and assert the active element shows a visible outline / ring.
    // Per ADR-0002 the focus ring is a signature use of --color-accent — any
    // styling that produces a non-`none` outline OR a non-`none` box-shadow
    // counts as a visible focus indicator.
    for (let i = 0; i < interactiveCount; i += 1) {
      await page.keyboard.press('Tab');
      const indicator = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          boxShadow: cs.boxShadow,
        };
      });
      expect.soft(indicator, `focus landed on element at Tab #${i + 1}`).not.toBeNull();
      if (!indicator) continue;
      const hasOutline =
        indicator.outlineStyle !== 'none' && indicator.outlineWidth !== '0px';
      const hasShadow = indicator.boxShadow !== 'none';
      expect
        .soft(
          hasOutline || hasShadow,
          `${indicator.tag} at Tab #${i + 1} must have outline or box-shadow focus indicator`,
        )
        .toBe(true);
    }
  });
});
