import { test, expect } from '@playwright/test';

let backendOk = false;
test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get('http://localhost:3000/api/v1/portfolios', { timeout: 2000 });
    backendOk = res.ok();
  } catch {
    backendOk = false;
  }
});

test.beforeEach(async () => {
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping');
});

test('take a portfolio snapshot and see it appear', async ({ page }) => {
  // Pick first portfolio in the list (or create one)
  await page.goto('/portfolios');
  const firstCard = page.locator('a[href^="/portfolios/"]').first();
  if (await firstCard.count() === 0) {
    await page.getByRole('button', { name: /New Portfolio/i }).click();
    await page.getByLabel('Name').fill(`Snap ${Date.now()}`);
    await page.getByRole('button', { name: /^Create$/ }).click();
  }
  await page.locator('a[href^="/portfolios/"]').first().click();
  await page.getByRole('button', { name: /Snapshot/i }).first().click();
  // Chart heading appears once we have ≥1 snapshot
  await expect(page.getByText(/Portfolio Value History/i)).toBeVisible({ timeout: 5_000 });
});
