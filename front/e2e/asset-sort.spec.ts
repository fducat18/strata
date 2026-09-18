import { test, expect, type Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const assets = [
  {
    id: 'a-zeta',
    name: 'Zeta Asset',
    quantity: '1',
    disposed: false,
    assetTypeId: 'at-bonds',
    assetType: { id: 'at-bonds', code: 'BONDS', label: 'Bonds', group: 'Investments' },
    categories: [{ id: 'c-travel', name: 'Travel', parentId: null }],
    tags: [{ id: 't-zulu', name: 'Zulu' }],
    transactions: [],
    snapshots: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    currentValue: '2.50',
  },
  {
    id: 'a-alpha',
    name: 'Alpha Asset',
    quantity: '1',
    disposed: false,
    assetTypeId: 'at-stocks',
    assetType: { id: 'at-stocks', code: 'STOCKS', label: 'Stocks', group: 'Investments' },
    categories: [
      { id: 'c-zeta', name: 'Zeta', parentId: null },
      { id: 'c-alpha', name: 'Alpha', parentId: null },
    ],
    tags: [{ id: 't-beta', name: 'Beta' }],
    transactions: [],
    snapshots: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    currentValue: '100.00',
  },
  {
    id: 'a-middle',
    name: 'Middle Asset',
    quantity: '1',
    disposed: false,
    assetTypeId: 'at-cash',
    assetType: { id: 'at-cash', code: 'CASH', label: 'Cash', group: 'Liquid' },
    categories: [],
    tags: [],
    transactions: [],
    snapshots: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    currentValue: null,
  },
  {
    id: 'a-disposed',
    name: 'Disposed Asset',
    quantity: '1',
    disposed: true,
    assetTypeId: 'at-cash',
    assetType: { id: 'at-cash', code: 'CASH', label: 'Cash', group: 'Liquid' },
    categories: [],
    tags: [],
    transactions: [],
    snapshots: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    currentValue: '5.00',
  },
];

async function mockAssetApis(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/assets') {
      await route.fulfill({ json: assets });
      return;
    }
    if (path === '/api/v1/asset-types') {
      await route.fulfill({ json: assets.map(asset => asset.assetType).filter((type, index, all) => all.findIndex(item => item.id === type.id) === index) });
      return;
    }
    await route.fulfill({ json: [] });
  });
}

async function assetNames(page: Page): Promise<string[]> {
  return page.getByRole('table').getByRole('link').allTextContents();
}

test('sorts asset list rows from sortable column headers', async ({ page }) => {
  await mockAssetApis(page);
  await page.goto('/assets');
  await page.waitForLoadState('networkidle');

  await expect.poll(() => assetNames(page)).toEqual(['Alpha Asset', 'Middle Asset', 'Zeta Asset']);

  await page.getByRole('button', { name: 'Sort by Current Value ascending' }).click();
  await expect.poll(() => assetNames(page)).toEqual(['Zeta Asset', 'Alpha Asset', 'Middle Asset']);

  await page.getByRole('button', { name: 'Sort by Current Value descending' }).click();
  await expect.poll(() => assetNames(page)).toEqual(['Alpha Asset', 'Zeta Asset', 'Middle Asset']);

  await page.getByRole('button', { name: 'Sort by Type ascending' }).click();
  await expect.poll(() => assetNames(page)).toEqual(['Zeta Asset', 'Middle Asset', 'Alpha Asset']);

  await page.getByRole('button', { name: 'Sort by Categories ascending' }).click();
  await expect.poll(() => assetNames(page)).toEqual(['Alpha Asset', 'Zeta Asset', 'Middle Asset']);

  await page.getByRole('button', { name: 'Sort by Tags ascending' }).click();
  await expect.poll(() => assetNames(page)).toEqual(['Alpha Asset', 'Zeta Asset', 'Middle Asset']);

  await page.getByRole('checkbox', { name: 'Show disposed' }).check();
  await page.getByRole('button', { name: 'Sort by Status ascending' }).click();
  await expect(page.getByRole('button', { name: 'Sort by Status descending' })).toBeVisible();
});
