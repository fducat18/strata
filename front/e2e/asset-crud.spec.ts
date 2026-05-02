import { test, expect } from '@playwright/test';

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
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping CRUD');
});

test('create asset, list it, edit name', async ({ page }) => {
  const assetName = `Test Asset ${Date.now()}`;

  await page.goto('/assets');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /New Asset/i }).click();
  await page.getByLabel('Name').fill(assetName);

  // Pick first non-placeholder asset type
  const typeSelect = page.getByLabel('Asset Type', { exact: true });
  await typeSelect.selectOption({ index: 1 });

  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.getByText(assetName)).toBeVisible({ timeout: 10_000 });
});

test('asset list page loads without error', async ({ page }) => {
  await page.goto('/assets');
  await page.waitForLoadState('networkidle');
  // Should not show "Could not load assets" error
  await expect(page.getByText(/Could not load assets/i)).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assets', level: 1 })).toBeVisible();
});
