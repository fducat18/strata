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
  await expect(page.getByText('primary-residence')).toBeVisible({ timeout: 10_000 });
});

test('create a new tag and verify it appears', async ({ page }) => {
  const name = `e2e-tag-${Date.now()}`;
  await page.goto('/tags');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /New Tag/i }).click();
  await page.getByRole('textbox', { name: /^Name$/ }).fill(name);
  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

  // Cleanup: delete the created tag
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: `Delete tag ${name}` }).click();
  await expect(page.getByText(name)).not.toBeVisible({ timeout: 10_000 });
});
