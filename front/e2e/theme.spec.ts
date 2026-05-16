import { test, expect } from '@playwright/test';

/**
 * Theme toggle does not require the backend.
 */
test.describe('Theme', () => {
  test('cycle and persist across reload', async ({ page }) => {
    await page.goto('/settings');
    // Ensure the theme island is fully hydrated before clicking — otherwise
    // the click can land on the SSR'd HTML before React attaches handlers.
    const darkBtn = page.getByRole('button', { name: /Use Dark theme/i });
    await expect(darkBtn).toBeVisible();
    await page.waitForLoadState('networkidle');
    await darkBtn.click();
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains('dark'));
    }).toBe(true);

    await page.reload();
    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains('dark'));
    }).toBe(true);

    // restore
    const lightBtn = page.getByRole('button', { name: /Use Light theme/i });
    await expect(lightBtn).toBeVisible();
    await page.waitForLoadState('networkidle');
    await lightBtn.click();
  });

  test('dark mode persists across route navigation', async ({ page }) => {
    await page.goto('/settings');
    const darkBtn = page.getByRole('button', { name: /Use Dark theme/i });
    await expect(darkBtn).toBeVisible();
    await page.waitForLoadState('networkidle');
    await darkBtn.click();
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('link', { name: 'Assets' }).click();
    await expect(page).toHaveURL(/\/assets$/);

    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains('dark'));
    }).toBe(true);
    await expect.poll(async () => {
      return await page.evaluate(
        () => window.getComputedStyle(document.documentElement).backgroundColor
      );
    }).toBe('rgb(15, 23, 42)');
  });
});
