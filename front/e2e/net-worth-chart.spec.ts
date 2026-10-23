import { test, expect, type Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const snapshotDate = '2026-01-01T00:00:00.000Z';

const assets = [
  {
    id: 'asset-banking',
    name: 'Bank account',
    quantity: '1',
    disposed: false,
    assetTypeId: 'type-cash',
    assetType: { id: 'type-cash', code: 'CASH', label: 'Cash', group: 'FINANCIAL' },
    categories: [{ id: 'category-banking', name: 'Banking', parentId: null }],
    tags: [],
    transactions: [],
    snapshots: [{
      id: 'snapshot-banking',
      assetId: 'asset-banking',
      value: '1000',
      observedAt: snapshotDate,
      createdAt: snapshotDate,
    }],
    createdAt: snapshotDate,
    updatedAt: snapshotDate,
    currentValue: '1000',
  },
  {
    id: 'asset-financial',
    name: 'Brokerage account',
    quantity: '1',
    disposed: false,
    assetTypeId: 'type-stocks',
    assetType: { id: 'type-stocks', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' },
    categories: [{ id: 'category-financial', name: 'Financial', parentId: null }],
    tags: [],
    transactions: [],
    snapshots: [{
      id: 'snapshot-financial',
      assetId: 'asset-financial',
      value: '25000',
      observedAt: snapshotDate,
      createdAt: snapshotDate,
    }],
    createdAt: snapshotDate,
    updatedAt: snapshotDate,
    currentValue: '25000',
  },
  {
    id: 'asset-property',
    name: 'Property asset',
    quantity: '1',
    disposed: false,
    assetTypeId: 'type-real-estate',
    assetType: { id: 'type-real-estate', code: 'REAL_ESTATE', label: 'Real Estate', group: 'REAL_ESTATE' },
    categories: [{ id: 'category-property', name: 'Property', parentId: null }],
    tags: [],
    transactions: [],
    snapshots: [{
      id: 'snapshot-property',
      assetId: 'asset-property',
      value: '1000000',
      observedAt: snapshotDate,
      createdAt: snapshotDate,
    }],
    createdAt: snapshotDate,
    updatedAt: snapshotDate,
    currentValue: '1000000',
  },
];

async function maxVerticalAxisValue(page: Page): Promise<number> {
  const tickLabels = await page.locator('.recharts-cartesian-axis-tick-value').allTextContents();
  expect(tickLabels.length).toBeGreaterThan(0);
  return Math.max(...tickLabels.map((label) => Number(label.replace(/[^\d.-]/g, ''))));
}

test('dashboard allows multiple category series to be shown or hidden', async ({ page }) => {
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/assets') {
      await route.fulfill({ json: assets });
      return;
    }
    if (path === '/api/v1/portfolio-snapshots/current-value') {
      await route.fulfill({ json: { value: '1026000', currency: 'EUR' } });
      return;
    }
    await route.fulfill({ json: [] });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'By Category' }).click();

  const banking = page.getByRole('button', { name: 'Banking' });
  const financial = page.getByRole('button', { name: 'Financial' });
  const property = page.getByRole('button', { name: 'Property' });
  await expect(banking).toHaveAttribute('aria-pressed', 'true');
  await expect(financial).toHaveAttribute('aria-pressed', 'true');
  await expect(property).toHaveAttribute('aria-pressed', 'true');

  const initialAxisMaximum = await maxVerticalAxisValue(page);
  expect(initialAxisMaximum).toBeGreaterThan(500000);

  await property.click();
  await expect(property).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => maxVerticalAxisValue(page)).toBeLessThan(initialAxisMaximum);
  await expect(banking).toHaveAttribute('aria-pressed', 'true');
  await expect(financial).toHaveAttribute('aria-pressed', 'true');
});
