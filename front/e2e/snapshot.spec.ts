import { test, expect } from '@playwright/test';

/**
 * Dashboard snapshot visualization tests.
 * Snapshot creation now lives outside this page, so this suite validates
 * dashboard behavior around existing snapshot history.
 */

let backendOk = false;
test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get('http://localhost:3000/api/v1/assets', { timeout: 2000 });
    backendOk = res.ok();
  } catch {
    backendOk = false;
  }
});

test.beforeEach(async () => {
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping');
});

test('dashboard shows net worth KPI and history section', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Net Worth', exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole('heading', { name: 'Net Worth History' })).toBeVisible({
    timeout: 10_000,
  });
});

test('dashboard shows net worth chart when snapshots exist', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // The NetWorthChart should be present (either with data or the empty-state prompt)
  const chart = page.locator('[class*="chart"], canvas, .recharts-responsive-container').first();
  // Accept either a rendered chart OR the "no portfolio history" empty state
  const emptyState = page.getByText(/No portfolio history yet/i);
  const hasChart = await chart.isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);
  expect(hasChart || hasEmpty).toBe(true);
});
