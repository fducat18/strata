import { test, expect } from '@playwright/test';

/**
 * Categories page e2e tests.
 * Verifies seeded data is visible, CRUD works.
 */

let backendOk = false;
test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get('http://localhost:3000/api/v1/categories', { timeout: 2000 });
    backendOk = res.ok();
  } catch {
    backendOk = false;
  }
});

test.beforeEach(async ({}, testInfo) => {
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping categories tests');
  testInfo.setTimeout(30_000);
});

test('categories page loads without error', async ({ page }) => {
  await page.goto('/categories');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Categories', level: 1 })).toBeVisible();
  await expect(page.getByText(/Could not load/i)).not.toBeVisible();
});

test('seeded categories are visible', async ({ page }) => {
  await page.goto('/categories');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Real Estate')).toBeVisible({ timeout: 10_000 });
});

test('create a new category and verify it appears', async ({ page }) => {
  const name = `E2E Category ${Date.now()}`;
  await page.goto('/categories');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /New Category/i }).click();
  await page.getByRole('textbox', { name: /^Name$/ }).fill(name);
  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

  // Cleanup: delete the created category
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: `Delete category ${name}` }).click();
  await expect(page.getByText(name)).not.toBeVisible({ timeout: 10_000 });
});
