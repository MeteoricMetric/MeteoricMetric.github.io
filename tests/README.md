# tests/

Playwright + axe-core test suite for merricstrough.com. Operationalizes
CLAUDE.md §6.1 (manual standards) and §6.2 (automation list).

## Run

```bash
npm test          # headless, all browsers + viewports (12 projects)
npm run test:ui   # Playwright UI mode — pick tests interactively
```

The `webServer` block in `playwright.config.ts` runs `npm run preview` on
`http://localhost:4321` automatically. Locally, an existing preview server is
reused (`reuseExistingServer: !process.env.CI`). In CI, a fresh server boots.

### Run a subset

```bash
npx playwright test smoke               # one file
npx playwright test --project=chromium  # one browser/viewport project
npx playwright test --grep a11y         # by title regex
npx playwright test --headed            # see the browser
npx playwright test --debug             # step through with inspector
```

## Files

| File | Purpose |
|---|---|
| `smoke.spec.ts` | Landing loads, title + h1 present, `rel=me` family-graph links, JSON-LD Person schema |
| `a11y.spec.ts` | axe-core against WCAG 2.2 AA + keyboard reachability + visible focus indicators |
| `visual.spec.ts` | Screenshot capture + console-clean assertion + image-resolution check (pixel-match deferred to Phase 2) |
| `perf.spec.ts` | Page-load smoke budget (3 s) + CI-only `dist/` size budget |

Each spec is `<= 100` lines and uses `test.describe.parallel` so independent
tests can run concurrently within a single project.

## Project matrix

12 projects = **3 browsers** (Chromium, Firefox, WebKit) x
**4 viewports** (375, 768, 1280, 1920). Each test runs 12 times. Project names
are formatted `<browser> @ <width>` for greppable failure reports.

## Writing new tests

- **Naming:** `it('should <expected behavior>', ...)` style — name what the
  user observes, not how the code achieves it.
- **AAA:** Arrange (navigate / set up), Act (interact), Assert.
- **One concept per test.** Use `expect.soft()` if multiple assertions in one
  test should all run before failing the test.
- **No hardcoded copy** beyond what's structural (titles, headings as patterns).
  Brittle string literals belong in a content collection, not a test.
- **No order dependencies.** Tests must pass in any order.
- **Selectors:** prefer `data-testid` for elements that exist solely to be
  testable; otherwise prefer role-based locators (`page.getByRole`).
- **Waits:** `page.waitForLoadState('networkidle')` or explicit `expect()`
  retries — never `page.waitForTimeout(<ms>)`.

## Marking tests as deferred

When a test depends on a yet-unbuilt component, use `test.fixme` with a
`TODO(deps): ...` comment naming what unblocks it. Example:

```ts
// TODO(deps): unblock once src/pages/404.astro lands.
test.fixme('404 page renders for an unknown route', async ({ page }) => { ... });
```

`fixme` tests are reported as expected-skip — they do not flake CI but they
do remind us they exist.

## Updating screenshot baselines

Pixel-match baselines are **not** asserted in Phase 1 — `visual.spec.ts` only
captures images for human review. When Phase 2 adds `toHaveScreenshot()`
assertions:

```bash
npx playwright test visual --update-snapshots
```

Review the diff in `tests/__screenshots__/` before committing. Intentional UI
changes get baseline updates committed alongside the change; unintentional
diffs are bugs.

## Accessibility

- Floor: **WCAG 2.2 AA**, zero violations (CLAUDE.md §6.1).
- `a11y.spec.ts` uses `@axe-core/playwright` with tags
  `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`.
- Keyboard test verifies every interactive element shows a visible focus
  indicator (outline or box-shadow) — per ADR-0002 the focus ring is the
  signature use of `--color-accent`.

## References

- Playwright docs: https://playwright.dev/docs/intro
- Playwright API: https://playwright.dev/docs/api/class-test
- @axe-core/playwright: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
- axe rules: https://dequeuniversity.com/rules/axe/
- WCAG 2.2 quick reference: https://www.w3.org/WAI/WCAG22/quickref/

## Phase 2 follow-ups (deferred)

- `toHaveScreenshot()` baselines after design system stabilizes
- Lighthouse CI as the real perf gate (replaces `perf.spec.ts` budget)
- Visual diffs on PRs via Playwright trace + screenshot artifacts
- Spotify Now Playing widget — masked dynamic region in screenshots
- View Transitions assertions (cross-page hero morph, per ADR-0002)
