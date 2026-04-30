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

test('export downloads a JSON file (skipped if backend is down)', async ({ page }) => {
  test.skip(!backendOk, 'Backend not reachable — export needs API');
  await page.goto('/settings');
  const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export backup as JSON/i }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^strata-backup-\d{4}-\d{2}-\d{2}\.json$/);
});

test('import opens confirm dialog with parsed counts', async ({ page }) => {
  // No backend needed for parse/preview step.
  await page.goto('/settings');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Import backup from JSON/i }).click();
  const chooser = await fileChooserPromise;
  const payload = JSON.stringify({
    version: '1.0',
    data: { portfolios: [{}, {}], assets: [{}], categories: [], tags: [{}, {}, {}] },
  });
  await chooser.setFiles({
    name: 'fake-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(payload),
  });
  await expect(page.getByText(/2 portfolios/)).toBeVisible();
  await expect(page.getByText(/3 tags/)).toBeVisible();
});
