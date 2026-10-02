import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi } from 'vitest';

vi.mock('../../api', () => ({
  financingScenarioApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    recalculate: vi.fn(),
    delete: vi.fn(),
  },
}));

import { financingScenarioApi } from '../../api';
import {
  useCreateFinancingScenario,
  useDeleteFinancingScenario,
  useFinancingScenarios,
  useRecalculateFinancingScenario,
  useUpdateFinancingScenario,
} from '../financing-scenarios';

const requestData = {
  name: 'Car', purchasePrice: '10000.00', customDownPayment: '5000.00',
  emergencyReserve: '0.00', monthlyAvailableAmount: '1000.00', loanRatePercent: '8',
  insuranceFeePercent: '0.5', loanDurationMonths: 12, loanSetupFee: '0.00', assets: [],
};

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe('financing scenario hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the saved scenario list', async () => {
    vi.mocked(financingScenarioApi.getAll).mockResolvedValue([] as any);
    const { result } = renderHook(() => useFinancingScenarios(), { wrapper: wrapper() });
    await waitFor(() => expect(financingScenarioApi.getAll).toHaveBeenCalled());
  });

  it('creates and updates scenarios through the API', async () => {
    vi.mocked(financingScenarioApi.create).mockResolvedValue({ id: 's1' } as any);
    vi.mocked(financingScenarioApi.update).mockResolvedValue({ id: 's1' } as any);
    const { result: create } = renderHook(() => useCreateFinancingScenario(), { wrapper: wrapper() });
    const { result: update } = renderHook(() => useUpdateFinancingScenario(), { wrapper: wrapper() });

    await act(async () => { await create.current.mutateAsync(requestData); });
    await act(async () => { await update.current.mutateAsync({ id: 's1', data: requestData }); });

    expect(financingScenarioApi.create).toHaveBeenCalledWith(requestData);
    expect(financingScenarioApi.update).toHaveBeenCalledWith('s1', requestData);
  });

  it('recalculates and deletes saved scenarios', async () => {
    vi.mocked(financingScenarioApi.recalculate).mockResolvedValue({ id: 's1' } as any);
    vi.mocked(financingScenarioApi.delete).mockResolvedValue(undefined as any);
    const { result: recalculate } = renderHook(() => useRecalculateFinancingScenario(), { wrapper: wrapper() });
    const { result: remove } = renderHook(() => useDeleteFinancingScenario(), { wrapper: wrapper() });

    await act(async () => { await recalculate.current.mutateAsync('s1'); });
    await act(async () => { await remove.current.mutateAsync('s1'); });

    expect(financingScenarioApi.recalculate).toHaveBeenCalledWith('s1');
    expect(financingScenarioApi.delete).toHaveBeenCalledWith('s1');
  });
});
