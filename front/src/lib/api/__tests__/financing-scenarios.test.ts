import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../client';
import { financingScenarioApi } from '../financing-scenarios';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

describe('financingScenarioApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists saved scenarios', async () => {
    mockGet.mockResolvedValue({ data: [] } as never);
    await financingScenarioApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/financing-scenarios');
  });

  it('loads one saved scenario', async () => {
    const scenario = { id: 's1' };
    mockGet.mockResolvedValue({ data: scenario } as never);
    await expect(financingScenarioApi.getById('s1')).resolves.toEqual(scenario);
    expect(mockGet).toHaveBeenCalledWith('/financing-scenarios/s1');
  });

  it('creates and updates scenarios with the complete input snapshot', async () => {
    const data = {
      name: 'Car',
      purchasePrice: '10000.00',
      customDownPayment: '5000.00',
      emergencyReserve: '10000.00',
      monthlyAvailableAmount: '1000.00',
      loanRatePercent: '8',
      insuranceFeePercent: '0.5',
      loanDurationMonths: 60,
      loanSetupFee: '0.00',
      assets: [],
    };
    mockPost.mockResolvedValue({ data: { id: 's1' } } as never);
    mockPut.mockResolvedValue({ data: { id: 's1' } } as never);

    await financingScenarioApi.create(data);
    await financingScenarioApi.update('s1', data);

    expect(mockPost).toHaveBeenCalledWith('/financing-scenarios', data);
    expect(mockPut).toHaveBeenCalledWith('/financing-scenarios/s1', data);
  });

  it('recalculates and deletes a saved scenario', async () => {
    mockPost.mockResolvedValue({ data: { id: 's1' } } as never);
    mockDelete.mockResolvedValue({ data: undefined } as never);

    await financingScenarioApi.recalculate('s1');
    await financingScenarioApi.delete('s1');

    expect(mockPost).toHaveBeenCalledWith('/financing-scenarios/s1/recalculate');
    expect(mockDelete).toHaveBeenCalledWith('/financing-scenarios/s1');
  });
});
