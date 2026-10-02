import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/hooks', () => ({
  useAssets: vi.fn(),
  useFinancingScenarios: vi.fn(),
  useCreateFinancingScenario: vi.fn(),
  useUpdateFinancingScenario: vi.fn(),
  useDeleteFinancingScenario: vi.fn(),
  useRecalculateFinancingScenario: vi.fn(),
}));

import {
  useAssets,
  useCreateFinancingScenario,
  useDeleteFinancingScenario,
  useFinancingScenarios,
  useRecalculateFinancingScenario,
  useUpdateFinancingScenario,
} from '@/lib/hooks';
import { FinancingScenariosPage } from '../FinancingScenariosPage';
import type { FinancingScenario } from '@/lib/types';

const mockAssets = [{
  id: 'asset-1', name: 'Savings Account', disposed: false, currentValue: '100000.00',
  assetType: { id: 'type-1', code: 'SAVINGS_ACCOUNT', label: 'Savings Account', group: 'SAVINGS' },
}] as any;

const mockScenario: FinancingScenario = {
  id: 'scenario-1',
  name: 'Car financing',
  currency: 'EUR',
  inputs: {
    purchasePrice: '10000.00',
    customDownPayment: '5000.00',
    emergencyReserve: '20000.00',
    monthlyAvailableAmount: '1000.00',
    loanRatePercent: '8',
    insuranceFeePercent: '0.5',
    loanDurationMonths: 12,
    loanSetupFee: '0.00',
    assets: [{ assetId: 'asset-1', name: 'Savings Account', balance: '100000.00', available: true, annualReturnPercent: '5' }],
  },
  calculation: {
    status: 'COMPLETE',
    currency: 'EUR',
    startingSavings: '100000.00',
    emergencyReserve: '20000.00',
    monthlyAvailableAmount: '1000.00',
    financingHorizonMonths: 12,
    loanRatePercent: '8',
    loanSetupFee: '0.00',
    withdrawalRule: 'PROPORTIONAL_BY_CURRENT_BALANCE',
    positiveContributionRule: 'PROPORTIONAL_BY_CURRENT_BALANCE_THEN_STARTING_BALANCE_THEN_EQUAL',
    eligibleAssets: [{ assetId: 'asset-1', name: 'Savings Account', startingBalance: '100000.00', annualReturnPercent: '5' }],
    options: [],
  },
  createdAt: '2026-09-28T00:00:00.000Z',
  updatedAt: '2026-09-28T00:00:00.000Z',
};

const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });
const mutation = { mutateAsync: vi.fn(), isPending: false };

describe('FinancingScenariosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAssets).mockReturnValue(query(mockAssets) as any);
    vi.mocked(useFinancingScenarios).mockReturnValue(query([mockScenario]) as any);
    vi.mocked(useCreateFinancingScenario).mockReturnValue(mutation as any);
    vi.mocked(useUpdateFinancingScenario).mockReturnValue(mutation as any);
    vi.mocked(useDeleteFinancingScenario).mockReturnValue(mutation as any);
    vi.mocked(useRecalculateFinancingScenario).mockReturnValue(mutation as any);
  });

  it('shows a retry state when assets or scenarios fail to load', () => {
    vi.mocked(useAssets).mockReturnValue({ ...query(undefined), isError: true } as any);
    render(<FinancingScenariosPage />);
    expect(screen.getByText(/could not load financing scenarios or portfolio assets/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('opens a saved scenario, recalculates it, and exposes the comparison view', async () => {
    mutation.mutateAsync.mockResolvedValue(mockScenario);
    render(<FinancingScenariosPage />);

    fireEvent.click(screen.getByRole('button', { name: /^car financing/i }));
    expect(screen.getByRole('heading', { name: 'Car financing' })).toBeInTheDocument();
    expect(screen.getByText(/scenarios are hypothetical/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Recalculate' }));
    await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledWith('scenario-1'));
    expect(screen.getByRole('heading', { name: /scenario assumptions/i })).toBeInTheDocument();
  });

  it('opens the editor for a saved scenario and sends the updated assumptions', async () => {
    mutation.mutateAsync.mockResolvedValue(mockScenario);
    render(<FinancingScenariosPage />);
    fireEvent.click(screen.getByRole('button', { name: /^car financing/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit assumptions' }));
    expect(screen.getByRole('heading', { name: 'Edit Financing Scenario' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Purchase Price (EUR)'), { target: { value: '12000.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledWith({
      id: 'scenario-1',
      data: expect.objectContaining({ purchasePrice: '12000.00', loanDurationMonths: 12 }),
    }));
  });

  it('opens a new draft form from the empty state', () => {
    vi.mocked(useFinancingScenarios).mockReturnValue(query([]) as any);
    render(<FinancingScenariosPage />);

    expect(screen.getByText('No financing scenarios yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /create scenario/i }));
    expect(screen.getByRole('heading', { name: 'New Financing Scenario' })).toBeInTheDocument();
  });

  it('only offers active savings account assets as financing sources', () => {
    vi.mocked(useFinancingScenarios).mockReturnValue(query([]) as any);
    vi.mocked(useAssets).mockReturnValue(query([
      mockAssets[0],
      {
        id: 'checking-1', name: 'Checking account', disposed: false, currentValue: '5000.00',
        assetType: { id: 'type-2', code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
      },
      {
        id: 'stocks-1', name: 'Stocks', disposed: false, currentValue: '25000.00',
        assetType: { id: 'type-3', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' },
      },
      {
        id: 'disposed-savings', name: 'Closed Livret A', disposed: true, currentValue: '0.00',
        assetType: { id: 'type-1', code: 'SAVINGS_ACCOUNT', label: 'Savings Account', group: 'SAVINGS' },
      },
    ]) as any);
    render(<FinancingScenariosPage />);

    fireEvent.click(screen.getByRole('button', { name: /create scenario/i }));

    expect(screen.getByRole('row', { name: /savings account/i })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /checking account/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /stocks/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /closed livret a/i })).not.toBeInTheDocument();
  });

  it('shows glossary definitions for monthly available amount and funding shortfall', () => {
    render(<FinancingScenariosPage />);
    expect(screen.getByRole('heading', { name: 'Glossary' })).toBeInTheDocument();
    expect(screen.getByText(/Monthly Available Amount \(EUR\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Funding Shortfall:/i)).toBeInTheDocument();
  });
});
