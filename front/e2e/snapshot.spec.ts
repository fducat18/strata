import { test, expect } from '@playwright/test';

/**
 * Portfolio snapshot tests via the Dashboard page.
 * The "Take Snapshot" button on the dashboard computes net worth
 * across all non-disposed assets and records a PortfolioSnapshot.
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

test('take a portfolio snapshot from the dashboard', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // The Take Snapshot button should be visible on the dashboard
  const snapshotBtn = page.getByRole('button', { name: /Take Snapshot/i });
  await expect(snapshotBtn).toBeVisible({ timeout: 10_000 });

  await snapshotBtn.click();

  // After a successful snapshot, a toast or confirmation appears
  // The button re-enables after the mutation resolves
  await expect(snapshotBtn).toBeEnabled({ timeout: 10_000 });
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
