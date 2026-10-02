import { PrismaService } from '../prisma/prisma.service.js';
import { PrismaFinancingScenarioRepository } from './prisma-financing-scenario.repository.js';

const inputSnapshot = {
  purchasePrice: '10000.00',
  customDownPayment: '5000.00',
  emergencyReserve: '10000.00',
  monthlyAvailableAmount: '1000.00',
  loanRatePercent: '8',
  insuranceFeePercent: '0.5',
  loanDurationMonths: 12,
  loanSetupFee: '0.00',
  assets: [],
};
const record = {
  id: 'scenario-1',
  name: 'Car',
  currency: 'EUR',
  inputsJson: JSON.stringify(inputSnapshot),
  createdAt: new Date('2026-09-28T00:00:00.000Z'),
  updatedAt: new Date('2026-09-28T00:00:00.000Z'),
};

describe('PrismaFinancingScenarioRepository', () => {
  let repository: PrismaFinancingScenarioRepository;
  let prisma: { financingScenario: Record<string, jest.Mock> };

  beforeEach(() => {
    prisma = {
      financingScenario: {
        findMany: jest.fn().mockResolvedValue([record]),
        findUnique: jest.fn().mockResolvedValue(record),
        create: jest.fn().mockResolvedValue(record),
        update: jest.fn().mockResolvedValue(record),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };
    repository = new PrismaFinancingScenarioRepository(prisma as unknown as PrismaService);
  });

  it('lists records newest-updated first and parses the detached inputs', async () => {
    const result = await repository.findAll();
    expect(prisma.financingScenario.findMany).toHaveBeenCalledWith({ orderBy: { updatedAt: 'desc' } });
    expect(result[0].inputs).toEqual(inputSnapshot);
  });

  it('maps existing and absent ids', async () => {
    await expect(repository.findById('scenario-1')).resolves.toMatchObject({ id: 'scenario-1', name: 'Car' });
    prisma.financingScenario.findUnique.mockResolvedValue(null);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('defaults legacy snapshots without insurance fee percent to zero', async () => {
    prisma.financingScenario.findUnique.mockResolvedValue({
      ...record,
      inputsJson: JSON.stringify({
        purchasePrice: '10000.00',
        customDownPayment: '5000.00',
        emergencyReserve: '10000.00',
        monthlyAvailableAmount: '1000.00',
        loanRatePercent: '8',
        loanDurationMonths: 12,
        loanSetupFee: '0.00',
        assets: [],
      }),
    });

    await expect(repository.findById('scenario-1')).resolves.toMatchObject({
      inputs: expect.objectContaining({ insuranceFeePercent: '0' }),
    });
  });

  it('serializes inputs when creating and updating scenario records', async () => {
    const data = { name: 'Car', currency: 'EUR', inputs: inputSnapshot };
    await repository.create(data);
    await repository.update('scenario-1', data);
    expect(prisma.financingScenario.create).toHaveBeenCalledWith({
      data: { name: 'Car', currency: 'EUR', inputsJson: JSON.stringify(inputSnapshot) },
    });
    expect(prisma.financingScenario.update).toHaveBeenCalledWith({
      where: { id: 'scenario-1' },
      data: { name: 'Car', currency: 'EUR', inputsJson: JSON.stringify(inputSnapshot) },
    });
  });

  it('deletes a saved scenario by id', async () => {
    await repository.delete('scenario-1');
    expect(prisma.financingScenario.delete).toHaveBeenCalledWith({ where: { id: 'scenario-1' } });
  });
});
