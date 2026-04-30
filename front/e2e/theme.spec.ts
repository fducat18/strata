import { test, expect } from '@playwright/test';

/**
 * Theme toggle does not require the backend.
 */
test.describe('Theme', () => {
  test('cycle and persist across reload', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /Use Dark theme/i }).click();
    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains('dark'));
    }).toBe(true);

    await page.reload();
    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains('dark'));
    }).toBe(true);

    // restore
    await page.getByRole('button', { name: /Use Light theme/i }).click();
  });
});
