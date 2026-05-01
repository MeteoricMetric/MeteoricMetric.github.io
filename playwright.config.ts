import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for merricstrough.com.
 *
 * Operationalizes CLAUDE.md §6.1:
 *  - Cross-browser: Chromium, Firefox, WebKit
 *  - Viewports: 375 (mobile), 768 (tablet), 1280 (desktop), 1920 (large desktop)
 *  - WCAG 2.2 AA floor (enforced in tests/a11y.spec.ts)
 *
 * Project-matrix design choice:
 *   We declare 12 projects (3 browsers x 4 viewports). Rationale:
 *     - Each project gets a stable, greppable name in reports (e.g. "chromium @ 1280")
 *     - Failures in CI are easier to triage than a single project iterating viewports internally
 *     - `fullyParallel: true` plus per-project sharding scales horizontally
 *   Tradeoff: more spec-runs total, but Playwright reuses the dev server, and tests are fast.
 *
 * Reference: https://playwright.dev/docs/test-configuration
 */

const VIEWPORTS = [
  { label: '375', width: 375, height: 812 }, // mobile (iPhone X-ish)
  { label: '768', width: 768, height: 1024 }, // tablet (iPad-ish)
  { label: '1280', width: 1280, height: 800 }, // desktop
  { label: '1920', width: 1920, height: 1080 }, // large desktop
] as const;

const BROWSERS = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
] as const;

const projects = BROWSERS.flatMap(({ name, device }) =>
  VIEWPORTS.map((vp) => ({
    name: `${name} @ ${vp.label}`,
    use: {
      ...device,
      viewport: { width: vp.width, height: vp.height },
    },
  })),
);

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects,
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
