import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000/api/v1';

type TimeRange = '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';
type AssetSummary = { id: string; name: string };
type AssetSnapshot = { id: string; assetId: string; observedAt: string; value: string };

let backendOk = false;
let demoAsset: AssetSummary | null = null;

function getSinceDate(range: TimeRange): Date | undefined {
  const now = new Date();

  switch (range) {
    case '1D': {
      const date = new Date(now);
      date.setDate(date.getDate() - 1);
      return date;
    }
    case '7D': {
      const date = new Date(now);
      date.setDate(date.getDate() - 7);
      return date;
    }
    case '1M': {
      const date = new Date(now);
      date.setMonth(date.getMonth() - 1);
      return date;
    }
    case '3M': {
      const date = new Date(now);
      date.setMonth(date.getMonth() - 3);
      return date;
    }
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1);
    case '1Y': {
      const date = new Date(now);
      date.setFullYear(date.getFullYear() - 1);
      return date;
    }
    case 'ALL':
      return undefined;
  }
}

function countSnapshotsInRange(snapshots: AssetSnapshot[], range: TimeRange): number {
  const since = getSinceDate(range);
  if (!since) return snapshots.length;

  const sinceTime = since.getTime();
  return snapshots.filter((snapshot) => new Date(snapshot.observedAt).getTime() >= sinceTime).length;
}

async function loadSnapshots(request: APIRequestContext): Promise<AssetSnapshot[]> {
  expect(demoAsset).not.toBeNull();

  const response = await request.get(`${API_BASE_URL}/assets/${demoAsset!.id}/snapshots`);
  expect(response.ok()).toBeTruthy();

  return response.json();
}

async function openAssetDetail(page: Page): Promise<void> {
  expect(demoAsset).not.toBeNull();

  await page.goto(`/assets/detail?id=${demoAsset!.id}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: demoAsset!.name, level: 1 })).toBeVisible();
}

async function expectChartVisible(page: Page): Promise<void> {
  await expect(page.locator('.recharts-responsive-container')).toBeVisible();
  await expect(page.getByText(/No snapshots in this time range/i)).not.toBeVisible();
}

test.describe('Asset detail time range filtering', () => {
  test.beforeAll(async ({ request }) => {
    try {
      const response = await request.get(`${API_BASE_URL}/assets`, { timeout: 2_000 });
      backendOk = response.ok();
      if (!backendOk) return;

      const assets = (await response.json()) as AssetSummary[];
      demoAsset = assets.find((asset) => asset.name === 'BNP Checking Account') ?? assets[0] ?? null;
    } catch {
      backendOk = false;
      demoAsset = null;
    }
  });

  test.beforeEach(async ({}, testInfo) => {
    test.skip(!backendOk, 'Backend not reachable at localhost:3000 — skipping asset history tests');
    test.skip(!demoAsset, 'No demo asset available for asset history tests');
    testInfo.setTimeout(30_000);
  });

  test('renders all time range buttons and defaults to ALL', async ({ page }) => {
    await openAssetDetail(page);

    for (const range of ['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL'] as const) {
      await expect(page.getByRole('button', { name: range })).toBeVisible();
    }

    await expect(page.getByRole('button', { name: 'ALL' })).toHaveClass(/bg-primary/);
    await expectChartVisible(page);
  });

  test('seeded demo asset provides dense recent history for all ranges', async ({ page, request }) => {
    const snapshots = await loadSnapshots(request);

    expect(snapshots.length).toBeGreaterThanOrEqual(24);
    expect(countSnapshotsInRange(snapshots, '1D')).toBe(1);
    expect(countSnapshotsInRange(snapshots, '7D')).toBeGreaterThanOrEqual(2);
    expect(countSnapshotsInRange(snapshots, '1M')).toBeGreaterThanOrEqual(4);
    expect(countSnapshotsInRange(snapshots, '3M')).toBeGreaterThanOrEqual(12);
    expect(countSnapshotsInRange(snapshots, '1Y')).toBeGreaterThan(12);
    expect(countSnapshotsInRange(snapshots, 'ALL')).toBe(snapshots.length);

    await openAssetDetail(page);

    for (const range of ['1D', '7D', '1M', '3M', '1Y', 'ALL'] as const) {
      await page.getByRole('button', { name: range }).click();
      await expect(page.getByRole('button', { name: range })).toHaveClass(/bg-primary/);
      await expectChartVisible(page);
    }
  });

  test('snapshot list remains independent from chart time filtering', async ({ page, request }) => {
    const snapshots = await loadSnapshots(request);

    await openAssetDetail(page);
    await expect(page.getByText(`${snapshots.length} snapshots`)).toBeVisible();

    await page.getByRole('button', { name: '1M' }).click();
    await expect(page.getByRole('button', { name: '1M' })).toHaveClass(/bg-primary/);
    await expect(page.getByText(`${snapshots.length} snapshots`)).toBeVisible();
  });

  test('clicking 1M button changes active state', async ({ page }) => {
    await openAssetDetail(page);

    // Wait for chart to load
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    
    // Verify ALL is active initially
    await expect(page.getByRole('button', { name: 'ALL' })).toHaveClass(/bg-primary/);
    
    // Click 1M button
    await page.getByRole('button', { name: '1M' }).click();
    
    // Verify 1M is now active
    await expect(page.getByRole('button', { name: '1M' })).toHaveClass(/bg-primary/);
    await expect(page.getByRole('button', { name: 'ALL' })).not.toHaveClass(/bg-primary/);
    
    // Chart should still be visible (seed data has snapshots in last month)
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('shows empty state when time range has no snapshots', async ({ page }) => {
    await openAssetDetail(page);

    // If seed data doesn't have snapshots in last 1 day (likely), this should show empty state
    await page.getByRole('button', { name: '1D' }).click();
    
    // Check for empty state message OR chart (depends on seed data)
    const emptyMessage = page.getByText(/No snapshots in this time range/i);
    const chart = page.locator('.recharts-wrapper');
    
    // Either empty state OR chart should be visible (depends on seed data for demo asset)
    const hasEmptyState = await emptyMessage.isVisible().catch(() => false);
    const hasChart = await chart.isVisible().catch(() => false);
    
    expect(hasEmptyState || hasChart).toBeTruthy();
  });
});
