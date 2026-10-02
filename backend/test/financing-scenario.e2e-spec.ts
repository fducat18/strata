import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service.js';
import { createIsolatedE2EApp } from './helpers/e2e-setup.js';

describe('Financing scenarios (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cleanup: () => Promise<void>;
  let availableAssetId: string;
  let unavailableAssetId: string;
  let liabilityAssetId: string;

  const requestBody = () => ({
    name: 'Car purchase comparison',
    purchasePrice: '10000.00',
    customDownPayment: '5000.00',
    emergencyReserve: '10000.00',
    monthlyAvailableAmount: '1000.00',
    loanRatePercent: '8',
    insuranceFeePercent: '0.5',
    loanDurationMonths: 12,
    loanSetupFee: '0.00',
    assets: [
      { assetId: availableAssetId, available: true, annualReturnPercent: '5' },
      { assetId: unavailableAssetId, available: false, annualReturnPercent: '6' },
    ],
  });

  async function accountingSnapshot() {
    const [assets, assetSnapshots, transactions, portfolioSnapshots] = await Promise.all([
      prisma.asset.findMany({ orderBy: { id: 'asc' } }),
      prisma.assetSnapshot.findMany({ orderBy: { id: 'asc' } }),
      prisma.transaction.findMany({ orderBy: { id: 'asc' } }),
      prisma.portfolioSnapshot.findMany({ orderBy: { id: 'asc' } }),
    ]);
    return { assets, assetSnapshots, transactions, portfolioSnapshots };
  }

  beforeAll(async () => {
    const context = await createIsolatedE2EApp({ seed: false });
    app = context.app as INestApplication<App>;
    cleanup = context.cleanup;
    prisma = app.get(PrismaService);

    const savingsType = await prisma.assetType.create({
      data: { code: 'TEST_SAVINGS', label: 'Test Savings', group: 'SAVINGS' },
    });
    const liabilityType = await prisma.assetType.create({
      data: { code: 'TEST_LIABILITY', label: 'Test Liability', group: 'LIABILITIES' },
    });
    const available = await prisma.asset.create({
      data: { name: 'Available Savings', assetTypeId: savingsType.id },
    });
    availableAssetId = available.id;
    const unavailable = await prisma.asset.create({
      data: { name: 'Blocked Savings', assetTypeId: savingsType.id },
    });
    unavailableAssetId = unavailable.id;
    const liability = await prisma.asset.create({
      data: { name: 'Recorded Loan', assetTypeId: liabilityType.id },
    });
    liabilityAssetId = liability.id;
    const observedAt = new Date('2026-01-01T00:00:00.000Z');
    await Promise.all([
      prisma.assetSnapshot.create({ data: { assetId: available.id, value: '100000.00', observedAt } }),
      prisma.assetSnapshot.create({ data: { assetId: unavailable.id, value: '90000.00', observedAt } }),
      prisma.assetSnapshot.create({ data: { assetId: liability.id, value: '-50000.00', observedAt } }),
      prisma.transaction.create({ data: { assetId: available.id, type: 'ACQUIRE', unitPrice: '100000', quantity: '1', currency: 'EUR', occurredAt: observedAt } }),
      prisma.transaction.create({ data: { assetId: unavailable.id, type: 'ACQUIRE', unitPrice: '90000', quantity: '1', currency: 'EUR', occurredAt: observedAt } }),
      prisma.transaction.create({ data: { assetId: liability.id, type: 'ACQUIRE', unitPrice: '50000', quantity: '1', currency: 'EUR', occurredAt: observedAt } }),
      prisma.portfolioSnapshot.create({ data: { value: '140000.00', currency: 'EUR', observedAt } }),
    ]);
  }, 60_000);

  afterAll(async () => {
    await cleanup();
  });

  it('saves and recalculates every option without changing accounting records', async () => {
    const baseline = await accountingSnapshot();
    const createdResponse = await request(app.getHttpServer())
      .post('/api/v1/financing-scenarios')
      .send(requestBody())
      .expect(201);

    const created = createdResponse.body;
    expect(created.calculation.status).toBe('COMPLETE');
    expect(created.calculation.startingSavings).toBe('100000.00');
    expect(created.calculation.options.map((option: { type: string }) => option.type)).toEqual([
      'CASH', 'CUSTOM_DOWN_PAYMENT', 'FULL',
    ]);
    expect(created.calculation.options[1].insuranceFee).toBe('50.00');
    expect(created.calculation.options[2].insuranceFee).toBe('50.00');
    expect(created.calculation.options[2].financingCost).toBe('488.62');
    expect(created.inputs.assets.find((asset: { assetId: string }) => asset.assetId === unavailableAssetId).balance).toBe('90000.00');
    expect(await accountingSnapshot()).toEqual(baseline);

    const scenarioId = created.id as string;
    const listed = await request(app.getHttpServer())
      .get('/api/v1/financing-scenarios')
      .expect(200);
    expect(listed.body).toHaveLength(1);

    const read = await request(app.getHttpServer())
      .get(`/api/v1/financing-scenarios/${scenarioId}`)
      .expect(200);
    expect(read.body.calculation.options[0].finalScenarioSavingsBalance).toBe('106883.44');

    const recalculated = await request(app.getHttpServer())
      .post(`/api/v1/financing-scenarios/${scenarioId}/recalculate`)
      .expect(200);
    expect(recalculated.body.calculation.options[2].insuranceFee).toBe('50.00');
    expect(await accountingSnapshot()).toEqual(baseline);

    const laterBalance = new Date('2026-02-01T00:00:00.000Z');
    await prisma.assetSnapshot.create({
      data: { assetId: availableAssetId, value: '110000.00', observedAt: laterBalance },
    });
    const beforeUpdate = await accountingSnapshot();
    const updated = await request(app.getHttpServer())
      .put(`/api/v1/financing-scenarios/${scenarioId}`)
      .send({ ...requestBody(), purchasePrice: '12000.00' })
      .expect(200);
    expect(updated.body.inputs.assets.find((asset: { assetId: string }) => asset.assetId === availableAssetId).balance).toBe('110000.00');
    expect(await accountingSnapshot()).toEqual(beforeUpdate);

    await request(app.getHttpServer())
      .delete(`/api/v1/financing-scenarios/${scenarioId}`)
      .expect(204);
    expect(await accountingSnapshot()).toEqual(beforeUpdate);
    await request(app.getHttpServer())
      .get(`/api/v1/financing-scenarios/${scenarioId}`)
      .expect(404);
  });

  it('allows a saved draft without eligible assets and rejects invalid input', async () => {
    const draft = await request(app.getHttpServer())
      .post('/api/v1/financing-scenarios')
      .send({ ...requestBody(), assets: [] })
      .expect(201);
    expect(draft.body.calculation.status).toBe('NO_ELIGIBLE_ASSETS');
    expect(draft.body.calculation.options).toEqual([]);

    await request(app.getHttpServer())
      .post('/api/v1/financing-scenarios')
      .send({ ...requestBody(), customDownPayment: '0.00' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/financing-scenarios')
      .send({ ...requestBody(), assets: [{ assetId: '00000000-0000-4000-8000-000000000099', available: true, annualReturnPercent: '5' }] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/financing-scenarios')
      .send({ ...requestBody(), assets: [{ assetId: liabilityAssetId, available: false, annualReturnPercent: '0' }] })
      .expect(400);
  });
});
