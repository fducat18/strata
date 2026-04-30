import { test, expect } from '@playwright/test';

test.describe('Strata Smoke Tests', () => {
  test('homepage loads dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('navigation links exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/portfolios"]')).toBeVisible();
    await expect(page.locator('a[href="/assets"]')).toBeVisible();
    await expect(page.locator('a[href="/categories"]')).toBeVisible();
    await expect(page.locator('a[href="/tags"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });

  test('can navigate to portfolios page', async ({ page }) => {
    await page.goto('/portfolios');
    await expect(page.locator('text=Portfolios')).toBeVisible();
  });

  test('can navigate to assets page', async ({ page }) => {
    await page.goto('/assets');
    await expect(page.locator('text=Assets')).toBeVisible();
  });

  test('can navigate to categories page', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.locator('text=Categories')).toBeVisible();
  });

  test('can navigate to tags page', async ({ page }) => {
    await page.goto('/tags');
    await expect(page.locator('text=Tags')).toBeVisible();
  });

  test('can navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=Settings')).toBeVisible();
  });
});
