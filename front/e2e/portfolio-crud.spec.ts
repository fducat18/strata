import { test, expect, type Page } from '@playwright/test';

/**
 * These tests exercise the portfolio CRUD flow and require the backend to be
 * reachable at the configured PUBLIC_API_URL (default http://localhost:3000).
 * The whole suite is skipped if the backend is unreachable — keep the spec
 * green in environments without a backend.
 */

let backendOk = false;
test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get('http://localhost:3000/api/v1/portfolios', { timeout: 2000 });
    backendOk = res.ok();
  } catch {
    backendOk = false;
  }
});

test.beforeEach(async ({}, testInfo) => {
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping CRUD');
  testInfo.setTimeout(30_000);
});

async function createPortfolio(page: Page, name: string): Promise<void> {
  await page.goto('/portfolios');
  await page.getByRole('button', { name: /New Portfolio/i }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible();
}

test('create, view, and delete a portfolio', async ({ page }) => {
  const name = `Test Portfolio ${Date.now()}`;
  await createPortfolio(page, name);

  // Visit detail
  await page.getByText(name).first().click();
  await expect(page.getByRole('heading', { name })).toBeVisible();

  // Delete
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete portfolio' }).click();
  await expect(page).toHaveURL(/\/portfolios\/?$/);
});
