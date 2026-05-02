import { test, expect } from '@playwright/test';

/**
 * Dashboard tests — verifies the main KPI view, snapshot button,
 * and net worth chart.
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
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping dashboard tests');
});

test('dashboard loads without error', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  await expect(page.getByText(/Could not load/i)).not.toBeVisible();
});

test('dashboard shows Take Snapshot button', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('button', { name: /Take Snapshot/i })).toBeVisible();
});

test('dashboard Take Snapshot button is clickable and re-enables', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const snapshotBtn = page.getByRole('button', { name: /Take Snapshot/i });
  await expect(snapshotBtn).toBeEnabled();
  await snapshotBtn.click();
  // Button should re-enable after the mutation resolves (success or error)
  await expect(snapshotBtn).toBeEnabled({ timeout: 15_000 });
});

test('dashboard shows asset count summary cards', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // At least one stat card should be rendered (Total Assets or Active Assets)
  const statCards = page.locator('[class*="card"], [class*="stat"], [class*="kpi"]');
  await expect(statCards.first()).toBeVisible({ timeout: 10_000 });
});
