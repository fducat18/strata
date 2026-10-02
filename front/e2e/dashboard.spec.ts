import { test, expect } from '@playwright/test';

/**
 * Dashboard tests — verifies KPI cards, history controls, and basic interactions.
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

test('dashboard shows net worth history controls', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('button', { name: 'ALL' })).toBeVisible();
  await expect(page.getByRole('button', { name: '1M' })).toBeVisible();
});

test('dashboard time range controls are clickable', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const oneMonth = page.getByRole('button', { name: '1M' });
  const all = page.getByRole('button', { name: 'ALL' });
  await expect(all).toHaveClass(/bg-primary/);
  await oneMonth.click();
  await expect(oneMonth).toHaveClass(/bg-primary/);
  await expect(all).not.toHaveClass(/bg-primary/);
});

test('dashboard shows asset count summary cards', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // At least one stat card should be rendered (Total Assets or Active Assets)
  const statCards = page.locator('[class*="card"], [class*="stat"], [class*="kpi"]');
  await expect(statCards.first()).toBeVisible({ timeout: 10_000 });
});
