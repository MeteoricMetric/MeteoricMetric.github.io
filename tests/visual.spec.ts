/**
 * Visual smoke — captures screenshots and checks for runtime hygiene.
 *
 * Pixel-match visual regression (toHaveScreenshot baselines, threshold tuning,
 * masked dynamic regions like Now Playing) is deferred to Phase 2. This file
 * exists to: (a) seed a screenshot trail for human review during build-out,
 * and (b) catch silent-failure modes (console errors, broken images).
 */

import { expect, test } from '@playwright/test';

test.describe.parallel('visual smoke', () => {
  test('captures landing page screenshot', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Per ADR-0002 motion is restrained; still, kill animations to avoid
    // mid-frame screenshots when later baselines land.
    await page.addStyleTag({
      content: `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`,
    });
    const safeName = testInfo.project.name.replace(/[^a-z0-9]+/gi, '-');
    await page.screenshot({
      path: `tests/__screenshots__/landing-${safeName}.png`,
      fullPage: true,
    });
  });

  test('emits no console.error or console.warn during landing load', async ({ page }) => {
    const messages: Array<{ type: string; text: string }> = [];
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        messages.push({ type, text: msg.text() });
      }
    });
    page.on('pageerror', (err) => {
      messages.push({ type: 'pageerror', text: err.message });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(
      messages,
      `unexpected console output:\n${messages.map((m) => `  [${m.type}] ${m.text}`).join('\n')}`,
    ).toEqual([]);
  });

  test('every <img> resolves (naturalWidth > 0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const broken = await page.$$eval('img', (imgs) =>
      imgs
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src || '(no src)'),
    );
    expect(broken, `broken images:\n${broken.join('\n')}`).toEqual([]);
  });
});
