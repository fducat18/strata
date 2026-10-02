import { fireEvent, render, screen } from '@testing-library/react';
import { FinancingScenarioComparison } from '../FinancingScenarioComparison';
import type { FinancingOptionResult, FinancingScenario } from '@/lib/types';

function option(type: FinancingOptionResult['type'], breach = false): FinancingOptionResult {
  return {
    type,
    purchasePrice: '10000.00',
    downPayment: type === 'CASH' ? '10000.00' : type === 'FULL' ? '0.00' : '5000.00',
    initialOutlay: type === 'CASH' ? '10000.00' : '5000.00',
    loanPrincipal: type === 'CASH' ? '0.00' : '5000.00',
    loanSetupFee: '0.00',
    insuranceFee: type === 'CASH' ? '0.00' : '50.00',
    scheduledMonthlyPayment: type === 'CASH' ? '0.00' : '434.94',
    financingCost: type === 'CASH' ? '0.00' : '219.31',
    savingsReturn: '5017.94',
    savingsReturnDifference: type === 'CASH' ? '0.00' : '134.50',
    finalScenarioSavingsBalance: '106798.63',
    reserveBreach: breach,
    firstReserveBreachMonth: breach ? 'initial' : null,
    emergencyReserveAtRisk: breach,
    initialFundingShortfall: '0.00',
    monthlyFundingShortfall: '0.00',
    totalFundingShortfall: '0.00',
    status: 'COMPLETE',
    timeline: [{
      month: 1,
      savingsReturn: '416.67',
      loanInterest: '33.33',
      loanPrincipal: '401.61',
      loanPayment: '434.94',
      netMonthlyContribution: '565.06',
      monthlyFundingShortfall: '0.00',
      savingsBalance: '96000.00',
      remainingLoanBalance: '4598.39',
      reserveBreach: breach,
      assets: [{
        assetId: 'asset-1',
        name: 'Savings Account',
        openingBalance: '95000.00',
        savingsReturn: '395.83',
        contribution: '565.06',
        withdrawal: '0.00',
        endingBalance: '95960.89',
      }],
    }],
    yearlyCheckpoints: [{
      year: 1,
      fromMonth: 1,
      toMonth: 1,
      savingsReturn: '416.67',
      loanInterest: '33.33',
      loanPrincipal: '401.61',
      loanPayments: '434.94',
      netMonthlyContributions: '565.06',
      fundingShortfall: '0.00',
      endingSavingsBalance: '106798.63',
      remainingLoanBalance: '4598.39',
      reserveBreach: breach,
    }],
  };
}

function scenario(status: 'COMPLETE' | 'NO_ELIGIBLE_ASSETS' = 'COMPLETE'): FinancingScenario {
  return {
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
      assets: [{
        assetId: 'asset-1', name: 'Savings Account', balance: '100000.00', available: true, annualReturnPercent: '5',
      }],
    },
    calculation: {
      status,
      currency: 'EUR',
      startingSavings: status === 'COMPLETE' ? '100000.00' : '0.00',
      emergencyReserve: '20000.00',
      monthlyAvailableAmount: '1000.00',
      financingHorizonMonths: 12,
      loanRatePercent: '8',
      loanSetupFee: '0.00',
      withdrawalRule: 'PROPORTIONAL_BY_CURRENT_BALANCE',
      positiveContributionRule: 'PROPORTIONAL_BY_CURRENT_BALANCE_THEN_STARTING_BALANCE_THEN_EQUAL',
      eligibleAssets: status === 'COMPLETE' ? [{ assetId: 'asset-1', name: 'Savings Account', startingBalance: '100000.00', annualReturnPercent: '5' }] : [],
      options: status === 'COMPLETE' ? [option('CASH', true), option('CUSTOM_DOWN_PAYMENT'), option('FULL')] : [],
    },
    createdAt: '2026-09-28T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
  };
}

describe('FinancingScenarioComparison', () => {
  it('keeps financing cost, retained returns, ending savings, and reserve warning distinct', () => {
    render(<FinancingScenarioComparison scenario={scenario()} />);

    expect(screen.getByRole('heading', { name: 'Scenario comparison' })).toBeInTheDocument();
    expect(screen.getByText('Insurance Fee', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Cash Financing')).toBeInTheDocument();
    expect(screen.getByText('Custom Down Payment Financing')).toBeInTheDocument();
    expect(screen.getByText('Full Financing')).toBeInTheDocument();
    expect(screen.getByText(/Emergency reserve is at risk\. First Reserve Breach: At the initial outlay/i)).toBeInTheDocument();
    expect(screen.getAllByText(/retained/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Savings Account').length).toBeGreaterThan(0);
  });

  it('stacks all three full-width timelines vertically in financing option order', () => {
    render(<FinancingScenarioComparison scenario={scenario()} />);

    expect(screen.queryByRole('region', { name: 'Financing option timelines' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /timeline$/ }).map((heading) => heading.textContent)).toEqual([
      'Cash Financing timeline',
      'Custom Down Payment Financing timeline',
      'Full Financing timeline',
    ]);
  });

  it('shows yearly checkpoints and every monthly field on demand', () => {
    render(<FinancingScenarioComparison scenario={scenario()} />);
    fireEvent.click(screen.getAllByText(/Yearly checkpoints/)[0]);
    fireEvent.click(screen.getAllByText(/Monthly detail/)[0]);

    expect(screen.getAllByText(/Year 1 · months 1–1/)[0]).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader', { name: 'Funding Shortfall' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: 'Reserve' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1 balances/).length).toBeGreaterThan(0);
  });

  it('explains why a draft without eligible assets has no comparison yet', () => {
    render(<FinancingScenarioComparison scenario={scenario('NO_ELIGIBLE_ASSETS')} />);
    expect(screen.getByRole('status')).toHaveTextContent(/no eligible savings assets/i);
    expect(screen.getByText(/select at least one asset/i)).toBeInTheDocument();
    expect(screen.queryByText('Cash Financing')).not.toBeInTheDocument();
  });
});
