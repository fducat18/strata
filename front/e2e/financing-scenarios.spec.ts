import { expect, test, type Page } from '@playwright/test';

const API = 'http://localhost:3000/api/v1';
const asset = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Livret A',
  disposed: false,
  currentValue: '100000.00',
  assetType: { id: 'type-savings', code: 'SAVINGS_ACCOUNT', label: 'Savings Account', group: 'SAVINGS' },
};
const otherAssets = [
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Checking account',
    disposed: false,
    currentValue: '5000.00',
    assetType: { id: 'type-financial', code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Stocks',
    disposed: false,
    currentValue: '25000.00',
    assetType: { id: 'type-financial', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' },
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Closed savings account',
    disposed: true,
    currentValue: '0.00',
    assetType: { id: 'type-savings', code: 'SAVINGS_ACCOUNT', label: 'Savings Account', group: 'SAVINGS' },
  },
];

function makeScenario(body: any) {
  const assets = (body.assets ?? []).map((entry: any) => ({
    assetId: entry.assetId,
    name: asset.name,
    balance: asset.currentValue,
    available: entry.available,
    annualReturnPercent: entry.annualReturnPercent,
  }));
  const eligible = assets.filter((entry: any) => entry.available);
  const complete = eligible.length > 0;
  const optionTypes = ['CASH', 'CUSTOM_DOWN_PAYMENT', 'FULL'];
  const insuranceFee = Number(body.insuranceFeePercent ?? '0') * Number(body.purchasePrice) / 100;
  const insuranceFeeFixed = insuranceFee.toFixed(2);
  const options = complete ? optionTypes.map((type, index) => ({
    type,
    purchasePrice: body.purchasePrice,
    downPayment: index === 0 ? body.purchasePrice : index === 1 ? body.customDownPayment : '0.00',
    initialOutlay: index === 0
      ? body.purchasePrice
      : (index === 1
        ? (Number(body.customDownPayment) + Number(body.loanSetupFee) + insuranceFee).toFixed(2)
        : (Number(body.loanSetupFee) + insuranceFee).toFixed(2)),
    loanPrincipal: index === 0 ? '0.00' : index === 1 ? '5000.00' : body.purchasePrice,
    loanSetupFee: '0.00',
    insuranceFee: index === 0 ? '0.00' : insuranceFeeFixed,
    scheduledMonthlyPayment: index === 0 ? '0.00' : '434.94',
    financingCost: index === 0 ? '0.00' : index === 1 ? '269.31' : '488.62',
    savingsReturn: ['4883.44', '5017.94', '5152.48'][index],
    savingsReturnDifference: ['0.00', '134.50', '269.04'][index],
    finalScenarioSavingsBalance: ['106883.44', '106798.63', '106713.86'][index],
    reserveBreach: index === 0,
    firstReserveBreachMonth: index === 0 ? 'initial' : null,
    emergencyReserveAtRisk: index === 0,
    initialFundingShortfall: '0.00',
    monthlyFundingShortfall: '0.00',
    totalFundingShortfall: '0.00',
    status: 'COMPLETE',
    timeline: Array.from({ length: body.loanDurationMonths }, (_, idx) => ({
      month: idx + 1,
      savingsReturn: '416.67',
      loanInterest: '33.33',
      loanPrincipal: '401.61',
      loanPayment: '434.94',
      netMonthlyContribution: '565.06',
      monthlyFundingShortfall: '0.00',
      savingsBalance: '100000.00',
      remainingLoanBalance: idx === body.loanDurationMonths - 1 ? '0.00' : '4598.39',
      reserveBreach: index === 0,
      assets: eligible.map((entry: any) => ({
        assetId: entry.assetId,
        name: entry.name,
        openingBalance: entry.balance,
        savingsReturn: '416.67',
        contribution: '565.06',
        withdrawal: '0.00',
        endingBalance: '100000.00',
      })),
    })),
    yearlyCheckpoints: Array.from({ length: body.loanDurationMonths / 12 }, (_, idx) => ({
      year: idx + 1,
      fromMonth: idx * 12 + 1,
      toMonth: (idx + 1) * 12,
      savingsReturn: '4883.44',
      loanInterest: '219.31',
      loanPrincipal: '5000.00',
      loanPayments: '5219.31',
      netMonthlyContributions: '6780.69',
      fundingShortfall: '0.00',
      endingSavingsBalance: '106883.44',
      remainingLoanBalance: '0.00',
      reserveBreach: index === 0,
    })),
  })) : [];
  return {
    id: 'scenario-1',
    name: body.name,
    currency: 'EUR',
    inputs: {
      purchasePrice: body.purchasePrice,
      customDownPayment: body.customDownPayment,
      emergencyReserve: body.emergencyReserve,
      monthlyAvailableAmount: body.monthlyAvailableAmount,
      loanRatePercent: body.loanRatePercent,
      insuranceFeePercent: body.insuranceFeePercent ?? '0',
      loanDurationMonths: body.loanDurationMonths,
      loanSetupFee: body.loanSetupFee,
      assets,
    },
    calculation: {
      status: complete ? 'COMPLETE' : 'NO_ELIGIBLE_ASSETS',
      currency: 'EUR',
      startingSavings: complete ? '100000.00' : '0.00',
      emergencyReserve: body.emergencyReserve,
      monthlyAvailableAmount: body.monthlyAvailableAmount,
      financingHorizonMonths: body.loanDurationMonths,
      loanRatePercent: body.loanRatePercent,
      loanSetupFee: body.loanSetupFee,
      withdrawalRule: 'PROPORTIONAL_BY_CURRENT_BALANCE',
      positiveContributionRule: 'PROPORTIONAL_BY_CURRENT_BALANCE_THEN_STARTING_BALANCE_THEN_EQUAL',
      eligibleAssets: eligible.map((entry: any) => ({
        assetId: entry.assetId, name: entry.name, startingBalance: entry.balance, annualReturnPercent: entry.annualReturnPercent,
      })),
      options,
    },
    createdAt: '2026-09-28T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
  };
}

async function mockApis(page: Page) {
  let saved: ReturnType<typeof makeScenario> | null = null;
  let postedBody: any;
  await page.route(`${API}/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (path === '/api/v1/assets' && method === 'GET') {
      await route.fulfill({ json: [asset, ...otherAssets] });
      return;
    }
    if (path === '/api/v1/financing-scenarios' && method === 'GET') {
      await route.fulfill({ json: saved ? [saved] : [] });
      return;
    }
    if (path === '/api/v1/financing-scenarios' && method === 'POST') {
      postedBody = route.request().postDataJSON();
      saved = makeScenario(postedBody);
      await route.fulfill({ status: 201, json: saved });
      return;
    }
    if (path.endsWith('/recalculate') && method === 'POST') {
      await route.fulfill({ json: saved });
      return;
    }
    if (/\/api\/v1\/financing-scenarios\/[^/]+$/.test(path) && method === 'PUT') {
      postedBody = route.request().postDataJSON();
      saved = makeScenario(postedBody);
      await route.fulfill({ json: saved });
      return;
    }
    await route.fulfill({ json: [] });
  });
  return { getPostedBody: () => postedBody };
}

test('offers only active savings-group assets as financing sources', async ({ page }) => {
  await mockApis(page);
  await page.goto('/financing');
  await page.getByRole('button', { name: 'New Scenario' }).click();

  await expect(page.getByRole('row', { name: /livret a/i })).toBeVisible();
  await expect(page.getByRole('row', { name: /checking account/i })).toHaveCount(0);
  await expect(page.getByRole('row', { name: /^stocks/i })).toHaveCount(0);
  await expect(page.getByRole('row', { name: /closed savings account/i })).toHaveCount(0);
});

test('creates and reviews a financing comparison without applying it to portfolio data', async ({ page }) => {
  const api = await mockApis(page);
  await page.goto('/financing');
  await expect(page.getByRole('heading', { name: 'Financing Scenarios', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'New Scenario' }).click();
  await page.getByLabel('Scenario name').fill('Car purchase');
  await page.getByLabel('Purchase Price (EUR)').fill('10000.00');
  await page.getByLabel('Custom Down Payment (EUR)').fill('5000.00');
  await page.getByLabel('Emergency Reserve (EUR)').fill('95000.00');
  await page.getByLabel('Monthly Available Amount (EUR)').fill('1000.00');
  await page.getByLabel('Annual Loan Rate (%)').fill('8');
  await page.getByLabel('Available for this purchase: Livret A').check();
  await page.getByLabel('Livret A savings return assumption (%)').fill('5');
  await page.getByRole('button', { name: 'Save scenario' }).click();

  await expect(page.getByRole('heading', { name: 'Car purchase' })).toBeVisible();
  await expect(page.getByText('Cash Financing', { exact: true })).toBeVisible();
  await expect(page.getByText('Custom Down Payment Financing', { exact: true })).toBeVisible();
  await expect(page.getByText('Full Financing', { exact: true })).toBeVisible();
  await expect(page.getByText('Insurance Fee', { exact: true })).toBeVisible();
  await expect(page.getByText(/Emergency reserve is at risk\. First Reserve Breach: At the initial outlay/i)).toBeVisible();
  expect(api.getPostedBody().assets).toEqual([{
    assetId: asset.id,
    available: true,
    annualReturnPercent: '5',
  }]);
  expect(api.getPostedBody().insuranceFeePercent).toBe('0.5');

  const timelineHeadings = [
    { name: 'Cash Financing timeline', heading: page.getByRole('heading', { name: 'Cash Financing timeline' }) },
    { name: 'Custom Down Payment Financing timeline', heading: page.getByRole('heading', { name: 'Custom Down Payment Financing timeline' }) },
    { name: 'Full Financing timeline', heading: page.getByRole('heading', { name: 'Full Financing timeline' }) },
  ];
  await expect(page.getByRole('region', { name: 'Financing option timelines' })).toHaveCount(0);
  const timelineTopPositions = await page.getByRole('heading', { name: /timeline$/ }).evaluateAll((headings) => (
    headings.map((heading) => heading.getBoundingClientRect().top)
  ));
  expect(timelineTopPositions).toHaveLength(3);
  expect(timelineTopPositions[1]).toBeGreaterThan(timelineTopPositions[0]);
  expect(timelineTopPositions[2]).toBeGreaterThan(timelineTopPositions[1]);

  for (const { heading } of timelineHeadings) {
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
  }

  const pageHasHorizontalOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  ));
  expect(pageHasHorizontalOverflow).toBe(false);

  await page.getByText('Monthly detail (60 months)').first().click();
  await expect(page.getByRole('columnheader', { name: 'Scenario Savings' }).first()).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Reserve' }).first()).toBeVisible();
  await expect(page.getByText(/Monthly Available Amount \(EUR\):/i)).toBeVisible();
  await expect(page.getByText(/Funding Shortfall:/i)).toBeVisible();
});
