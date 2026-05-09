import { test, expect } from '@playwright/test';

// Mock all API calls so pages can render their headings without a running backend
const API = 'http://localhost:3000/api/v1';

function mockApis(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  return page.route(`${API}/**`, (route) => {
    const url = route.request().url();
    if (url.includes('/portfolio-snapshots/current-value')) {
      return route.fulfill({ json: { value: '0', currency: 'EUR' } });
    }
    // All other endpoints return empty arrays
    return route.fulfill({ json: [] });
  });
}

async function expectHeading(page: Parameters<Parameters<typeof test>[1]>[0]['page'], text: string) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1', { hasText: text }).first()).toBeVisible({
    timeout: 10_000,
  });
}

test.describe('Strata Smoke Tests', () => {
  test('homepage loads dashboard', async ({ page }) => {
    await mockApis(page);
    await page.goto('/');
    await expectHeading(page, 'Dashboard');
  });

  test('navigation links exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/assets"]')).toBeVisible();
    await expect(page.locator('a[href="/categories"]')).toBeVisible();
    await expect(page.locator('a[href="/tags"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });

  test('can navigate to assets page', async ({ page }) => {
    await mockApis(page);
    await page.goto('/assets');
    await expectHeading(page, 'Assets');
  });

  test('can navigate to categories page', async ({ page }) => {
    await mockApis(page);
    await page.goto('/categories');
    await expectHeading(page, 'Categories');
  });

  test('can navigate to tags page', async ({ page }) => {
    await mockApis(page);
    await page.goto('/tags');
    await expectHeading(page, 'Tags');
  });

  test('can navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expectHeading(page, 'Settings');
  });
});
