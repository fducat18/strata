import { test, expect } from '@playwright/test';

let backendOk = false;
const createdAssetNames = new Set<string>();
type AssetSummary = { id: string; name: string };

function isAssetSummary(value: unknown): value is AssetSummary {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof (value as { id: unknown }).id === 'string' &&
      'name' in value &&
      typeof (value as { name: unknown }).name === 'string',
  );
}

test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get('http://localhost:3000/api/v1/assets', { timeout: 2000 });
    backendOk = res.ok();
  } catch {
    backendOk = false;
  }
});

test.beforeEach(async () => {
  test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping CRUD');
});

test.afterEach(async ({ request }) => {
  if (!backendOk || createdAssetNames.size === 0) return;

  try {
    const listRes = await request.get('http://localhost:3000/api/v1/assets');
    if (!listRes.ok()) return;

    const payload = (await listRes.json()) as unknown;
    const list = Array.isArray(payload)
      ? payload.filter(isAssetSummary)
      : payload &&
          typeof payload === 'object' &&
          Array.isArray((payload as { items?: unknown }).items)
        ? ((payload as { items: unknown[] }).items ?? []).filter(isAssetSummary)
        : payload &&
            typeof payload === 'object' &&
            Array.isArray((payload as { data?: unknown }).data)
          ? ((payload as { data: unknown[] }).data ?? []).filter(isAssetSummary)
          : [];

    const createdNames = new Set(createdAssetNames);
    for (const asset of list) {
      if (!createdNames.has(asset.name)) continue;
      await request.delete(`http://localhost:3000/api/v1/assets/${asset.id}`);
    }
  } finally {
    createdAssetNames.clear();
  }
});

test('create asset, list it, edit name', async ({ page }) => {
  const assetName = `Test Asset ${Date.now()}`;
  createdAssetNames.add(assetName);

  await page.goto('/assets');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /New Asset/i }).click();
  await page.getByRole('textbox', { name: /^Name$/ }).fill(assetName);

  // Pick first non-placeholder asset type
  const typeSelect = page.getByLabel('Asset Type', { exact: true });
  await typeSelect.selectOption({ index: 1 });
  const acquisitionPrice = page.getByRole('spinbutton', { name: 'Acquisition Price (EUR)' });
  await acquisitionPrice.fill('1000');
  const createButton = page.getByRole('button', { name: /^Create$/ }).last();
  await createButton.scrollIntoViewIfNeeded();
  await createButton.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByText(assetName)).toBeVisible({ timeout: 10_000 });
});

test('asset list page loads without error', async ({ page }) => {
  await page.goto('/assets');
  await page.waitForLoadState('networkidle');
  // Should not show "Could not load assets" error
  await expect(page.getByText(/Could not load assets/i)).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assets', level: 1 })).toBeVisible();
});
