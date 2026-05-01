import { expect, test } from '@playwright/test';

/**
 * Smoke tests — landing page must load, structural metadata must be present,
 * and family-graph cross-links (CLAUDE.md §10.3) must be wired.
 */

test.describe
  .parallel('landing page smoke', () => {
    test('loads with 200, correct <title>, and an <h1>', async ({ page }) => {
      const response = await page.goto('/');
      expect.soft(response?.status(), 'HTTP status').toBe(200);
      await expect.soft(page).toHaveTitle(/Merric|MeteoricMetric/i);
      await expect.soft(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
    });

    test('rel=me links point to expected family-graph + social URLs', async ({ page }) => {
      await page.goto('/');
      // Per CLAUDE.md §10.3 + ADR-0003. rel=me may appear in <head> as <link>
      // or in <body> as <a rel="me">. Accept either; assert href substrings only.
      const relMeHrefs = await page.$$eval('[rel~="me"]', (nodes) =>
        nodes.map((n) => n.getAttribute('href') ?? ''),
      );
      const joined = relMeHrefs.join('\n');
      expect.soft(joined, 'shanestrough.com rel=me').toMatch(/shanestrough\.com/i);
      expect.soft(joined, 'github MeteoricMetric rel=me').toMatch(/github\.com\/MeteoricMetric/i);
      expect.soft(joined, 'twitch meteoricmetric rel=me').toMatch(/twitch\.tv\/meteoricmetric/i);
    });

    test('JSON-LD Person schema is present and parses as valid JSON', async ({ page }) => {
      await page.goto('/');
      const blocks = await page.$$eval('script[type="application/ld+json"]', (nodes) =>
        nodes.map((n) => n.textContent ?? ''),
      );
      expect(blocks.length, 'at least one JSON-LD block').toBeGreaterThan(0);

      const person = blocks
        .map((raw) => {
          try {
            return JSON.parse(raw) as Record<string, unknown>;
          } catch {
            return null;
          }
        })
        .find((doc) => doc && doc['@type'] === 'Person');

      expect(person, 'a Person-typed JSON-LD block exists').toBeTruthy();
      expect.soft(person?.['@context']).toBe('https://schema.org');
      expect.soft(person?.name).toMatch(/Merric/i);
    });
  });

// TODO(deps): unblock once src/pages/404.astro lands. Tracked alongside the
// landing-page wiring being done in the parallel typescript-pro session.
test.fixme('404 page renders for an unknown route', async ({ page }) => {
  const response = await page.goto('/this-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toBeVisible();
});
