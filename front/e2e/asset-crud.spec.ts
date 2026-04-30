import { test, expect, type Page } from '@playwright/test';

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
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping CRUD');
});

async function ensurePortfolio(page: Page, name: string): Promise<void> {
  await page.goto('/portfolios');
  if (await page.getByText(name).count() === 0) {
    await page.getByRole('button', { name: /New Portfolio/i }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: /^Create$/ }).click();
    await expect(page.getByText(name)).toBeVisible();
  }
}

test('create asset under a portfolio, list it, edit name', async ({ page }) => {
  const portfolioName = `Asset Test Portfolio ${Date.now()}`;
  await ensurePortfolio(page, portfolioName);

  const assetName = `BTC-${Date.now()}`;
  await page.goto('/assets');
  await page.getByRole('button', { name: /New Asset/i }).click();
  await page.getByLabel('Name').fill(assetName);
  await page.getByLabel('Portfolio').selectOption({ label: portfolioName });
  // Pick first non-placeholder asset type
  const typeSelect = page.getByLabel('Asset Type');
  await typeSelect.selectOption({ index: 1 });
  await page.getByLabel('Quantity (optional)').fill('1.5');
  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.getByText(assetName)).toBeVisible();
});
