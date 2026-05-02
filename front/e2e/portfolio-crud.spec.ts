import { test, expect } from '@playwright/test';

/**
 * Category and Tag CRUD — replaces the old portfolio-crud tests.
 * Portfolios were removed in ADR-002; categories and tags are now the primary
 * grouping mechanism for assets.
 *
 * Requires backend to be reachable at localhost:3000.
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
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping CRUD');
  testInfo.setTimeout(30_000);
});

test('create and delete a category', async ({ page }) => {
  const name = `Test Category ${Date.now()}`;

  await page.goto('/categories');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /New Category/i }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

  // Delete the created category
  const row = page.locator('li, tr').filter({ hasText: name });
  await row.getByRole('button', { name: /delete/i }).click();

  // Confirm deletion dialog if present
  const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
  if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmBtn.click();
  }

  await expect(page.getByText(name)).not.toBeVisible({ timeout: 10_000 });
});

test('create and delete a tag', async ({ page }) => {
  const name = `test-tag-${Date.now()}`;

  await page.goto('/tags');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /New Tag/i }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

  // Delete the created tag
  const row = page.locator('li, tr').filter({ hasText: name });
  await row.getByRole('button', { name: /delete/i }).click();

  const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
  if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmBtn.click();
  }

  await expect(page.getByText(name)).not.toBeVisible({ timeout: 10_000 });
});
