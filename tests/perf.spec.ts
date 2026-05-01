/**
 * Perf smoke — coarse safety net only. Lighthouse CI is the real perf gate
 * (see ADR-0001 / CLAUDE.md §11). The 3s budget here is intentionally generous
 * so transient noise doesn't flake the suite; tighten only if Lighthouse CI
 * is unavailable.
 */

import { statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const PAGE_LOAD_BUDGET_MS = 3_000;
const DIST_SIZE_BUDGET_BYTES = 25 * 1024 * 1024; // 25 MB — generous smoke budget

test.describe.parallel('perf smoke', () => {
  test(`landing page loads under ${PAGE_LOAD_BUDGET_MS}ms (loadEventEnd - navigationStart)`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    const elapsed = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (nav) return nav.loadEventEnd - nav.startTime;
      // Legacy fallback for environments without Navigation Timing L2.
      const t = performance.timing;
      return t.loadEventEnd - t.navigationStart;
    });
    expect(elapsed, `loadEventEnd - navigationStart was ${elapsed}ms`).toBeLessThan(
      PAGE_LOAD_BUDGET_MS,
    );
  });
});

test.describe('perf smoke — build artifact', () => {
  test.skip(!process.env.CI, 'dist/ size is checked only in CI');

  test(`dist/ total size <= ${DIST_SIZE_BUDGET_BYTES} bytes`, async () => {
    const distPath = fileURLToPath(new URL('../dist', import.meta.url));
    const total = await directorySize(distPath);
    expect(total, `dist/ totalled ${total} bytes`).toBeLessThanOrEqual(DIST_SIZE_BUDGET_BYTES);
  });
});

async function directorySize(dir: string): Promise<number> {
  let total = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await directorySize(full);
    } else if (entry.isFile()) {
      total += statSync(full).size;
    }
  }
  return total;
}
