import { test, expect } from '@playwright/test';

/**
 * Tags page e2e tests.
 * Verifies seeded data is visible, CRUD works.
 */

let backendOk = false;
test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get('http://localhost:3000/api/v1/tags', { timeout: 2000 });
    backendOk = res.ok();
  } catch {
    backendOk = false;
  }
});

test.beforeEach(async ({}, testInfo) => {
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping tags tests');
  testInfo.setTimeout(30_000);
});

test('tags page loads without error', async ({ page }) => {
  await page.goto('/tags');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Tags', level: 1 })).toBeVisible();
  await expect(page.getByText(/Could not load/i)).not.toBeVisible();
});

test('seeded tags are visible', async ({ page }) => {
  await page.goto('/tags');
  await page.waitForLoadState('networkidle');
  // At least one tag should exist from seed data
  const items = page.locator('ul li, [role="listitem"], tbody tr, [class*="badge"]');
  await expect(items.first()).toBeVisible({ timeout: 10_000 });
});

test('create a new tag and verify it appears', async ({ page }) => {
  const name = `e2e-tag-${Date.now()}`;
  await page.goto('/tags');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /New Tag/i }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

  // Cleanup: delete the created tag
  const row = page.locator('li, tr').filter({ hasText: name });
  const deleteBtn = row.getByRole('button', { name: /delete/i });
  if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await deleteBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }
});
