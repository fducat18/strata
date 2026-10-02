import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { FinancingScenarioForm } from '../FinancingScenarioForm';

const assets = [
  { id: 'asset-1', name: 'Savings Account', disposed: false, currentValue: '100000.00' },
] as any;

describe('FinancingScenarioForm', () => {
  it('requires explicit availability and saves the full scenario input', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<FinancingScenarioForm assets={assets} isSaving={false} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Scenario name'), { target: { value: 'Car purchase' } });
    fireEvent.change(screen.getByLabelText('Purchase Price (EUR)'), { target: { value: '10000.00' } });
    fireEvent.change(screen.getByLabelText('Custom Down Payment (EUR)'), { target: { value: '5000.00' } });
    fireEvent.change(screen.getByLabelText('Monthly Available Amount (EUR)'), { target: { value: '1000.00' } });
    fireEvent.change(screen.getByLabelText('Annual Loan Rate (%)'), { target: { value: '8' } });
    fireEvent.click(screen.getByLabelText('Available for this purchase: Savings Account'));
    fireEvent.change(screen.getByLabelText('Savings Account savings return assumption (%)'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save scenario' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      name: 'Car purchase',
      purchasePrice: '10000.00',
      customDownPayment: '5000.00',
      emergencyReserve: '0.00',
      monthlyAvailableAmount: '1000.00',
      loanRatePercent: '8',
      insuranceFeePercent: '0.5',
      loanDurationMonths: 60,
      loanSetupFee: '0.00',
      assets: [{ assetId: 'asset-1', available: true, annualReturnPercent: '5' }],
    }));
  });

  it('rejects a full purchase amount as Custom Down Payment', async () => {
    const onSave = vi.fn();
    render(<FinancingScenarioForm assets={assets} isSaving={false} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Scenario name'), { target: { value: 'Car purchase' } });
    fireEvent.change(screen.getByLabelText('Purchase Price (EUR)'), { target: { value: '10000.00' } });
    fireEvent.change(screen.getByLabelText('Custom Down Payment (EUR)'), { target: { value: '10000.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save scenario' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/must be greater than zero and less than the purchase price/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('rejects a savings rate that would make the monthly balance negative', async () => {
    const onSave = vi.fn();
    render(<FinancingScenarioForm assets={assets} isSaving={false} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Scenario name'), { target: { value: 'Car purchase' } });
    fireEvent.change(screen.getByLabelText('Purchase Price (EUR)'), { target: { value: '10000.00' } });
    fireEvent.change(screen.getByLabelText('Custom Down Payment (EUR)'), { target: { value: '5000.00' } });
    fireEvent.click(screen.getByLabelText('Available for this purchase: Savings Account'));
    fireEvent.change(screen.getByLabelText('Savings Account savings return assumption (%)'), { target: { value: '-1201' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save scenario' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/below -1200%/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('disables the return assumption until the user marks an asset available', () => {
    render(<FinancingScenarioForm assets={assets} isSaving={false} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Savings Account savings return assumption (%)')).toBeDisabled();
  });

  it('uses the new default annual loan rate, insurance fee, and loan duration for new scenarios', () => {
    render(<FinancingScenarioForm assets={assets} isSaving={false} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Annual Loan Rate (%)')).toHaveValue(6);
    expect(screen.getByLabelText('Insurance Fee (% of Purchase Price)')).toHaveValue(0.5);
    expect(screen.getByLabelText('Standard Loan Duration (years)')).toHaveValue(5);
  });
});
