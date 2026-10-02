import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { FinancingOptionResult, FinancingScenario } from '@/lib/types';

const optionLabels: Record<FinancingOptionResult['type'], string> = {
  CASH: 'Cash Financing',
  CUSTOM_DOWN_PAYMENT: 'Custom Down Payment Financing',
  FULL: 'Full Financing',
};

function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));
}

function breachLabel(point: 'initial' | number | null): string {
  if (point === 'initial') return 'At the initial outlay';
  if (typeof point === 'number') return `Month ${point}`;
  return 'No reserve breach';
}

function ReturnDifference({ value, currency }: { value: string; currency: string }) {
  const difference = Number(value);
  if (difference === 0) return <span>Same as Cash Financing</span>;
  const action = difference > 0 ? 'retained' : 'less';
  return <span>{formatMoney(Math.abs(difference).toFixed(2), currency)} {action}</span>;
}

const optionOrder: FinancingOptionResult['type'][] = ['CASH', 'CUSTOM_DOWN_PAYMENT', 'FULL'];

export function FinancingScenarioComparison({ scenario }: { scenario: FinancingScenario }) {
  const { calculation, inputs } = scenario;
  const options = [...calculation.options].sort(
    (a, b) => optionOrder.indexOf(a.type) - optionOrder.indexOf(b.type),
  );
  return (
    <section aria-labelledby="scenario-results-heading" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="scenario-results-heading" className="text-xl font-semibold">{scenario.name}</h2>
          <p className="text-sm text-muted-foreground">
            Balances captured {new Date(scenario.updatedAt).toLocaleDateString()} · {calculation.financingHorizonMonths} month Financing Horizon
          </p>
        </div>
        <p className="max-w-lg text-sm text-muted-foreground">
          Cheapest Financing is the lowest interest plus Loan Setup Fee. It is a cost comparison, not a universal recommendation.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Scenario assumptions</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Assumption label="Purchase Price" value={formatMoney(inputs.purchasePrice, scenario.currency)} />
          <Assumption label="Custom Down Payment" value={formatMoney(inputs.customDownPayment, scenario.currency)} />
          <Assumption label="Monthly Available Amount" value={formatMoney(inputs.monthlyAvailableAmount, scenario.currency)} />
          <Assumption label="Emergency Reserve" value={formatMoney(inputs.emergencyReserve, scenario.currency)} />
          <Assumption label="Loan Rate Assumption" value={`${inputs.loanRatePercent}% annual`} />
          <Assumption label="Insurance Fee Assumption" value={`${inputs.insuranceFeePercent ?? '0'}% of purchase price`} />
          <Assumption label="Loan Setup Fee" value={formatMoney(inputs.loanSetupFee, scenario.currency)} />
          <Assumption label="Financing Horizon" value={`${inputs.loanDurationMonths} months`} />
          <Assumption label="Initial withdrawal" value="Proportional by current eligible balance" />
          <Assumption label="Monthly contribution" value="Proportional; original weights, then equal split if needed" />
        </CardContent>
        <div className="border-t border-border px-6 py-4">
          <h3 className="mb-2 text-sm font-semibold">Asset availability and Savings Return Assumptions</h3>
          {inputs.assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No portfolio assets were included when this scenario was saved.</p>
          ) : (
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {inputs.assets.map((asset) => (
                <li key={asset.assetId} className="flex flex-wrap justify-between gap-x-3 rounded-md bg-muted/40 px-3 py-2">
                  <span>{asset.name} <span className="text-muted-foreground">({asset.available ? 'available' : 'unavailable'})</span></span>
                  <span className="text-right tabular-nums">
                    {formatMoney(asset.balance, scenario.currency)} · {asset.annualReturnPercent}% annual
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {calculation.status === 'NO_ELIGIBLE_ASSETS' ? (
        <div role="status" className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5">
          <h3 className="font-semibold">No eligible savings assets</h3>
          <p className="mt-1 text-sm">This saved draft has no asset confirmed as available. Edit the scenario and select at least one asset to calculate a comparison.</p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Scenario comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Metric</th>
                      {options.map((option) => (
                        <th key={option.type} className="p-3 text-right">{optionLabels[option.type]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <ComparisonRow
                      label="Financing Cost"
                      options={options}
                      render={(option) => formatMoney(option.financingCost, scenario.currency)}
                    />
                    <ComparisonRow
                      label="Savings Return vs Cash"
                      options={options}
                      render={(option) => <ReturnDifference value={option.savingsReturnDifference} currency={scenario.currency} />}
                    />
                    <ComparisonRow
                      label="Final Scenario Savings Balance"
                      options={options}
                      render={(option) => formatMoney(option.finalScenarioSavingsBalance, scenario.currency)}
                    />
                    <ComparisonRow
                      label="Monthly Loan Payment"
                      options={options}
                      render={(option) => formatMoney(option.scheduledMonthlyPayment, scenario.currency)}
                    />
                    <ComparisonRow
                      label="Loan Principal"
                      options={options}
                      render={(option) => formatMoney(option.loanPrincipal, scenario.currency)}
                    />
                    <ComparisonRow
                      label="Initial Funding Shortfall"
                      options={options}
                      render={(option) => formatMoney(option.initialFundingShortfall, scenario.currency)}
                    />
                    <ComparisonRow
                      label="Monthly Funding Shortfall"
                      options={options}
                      render={(option) => formatMoney(option.monthlyFundingShortfall, scenario.currency)}
                    />
                    <ComparisonRow
                      label="Total Funding Shortfall"
                      options={options}
                      render={(option) => formatMoney(option.totalFundingShortfall, scenario.currency)}
                    />
                    <ComparisonRow
                      label="Insurance Fee"
                      options={options}
                      render={(option) => formatMoney(option.insuranceFee, scenario.currency)}
                    />
                    <ComparisonRow
                      label="Reserve warning"
                      options={options}
                      render={(option) => option.emergencyReserveAtRisk
                        ? `Emergency reserve is at risk. First Reserve Breach: ${breachLabel(option.firstReserveBreachMonth)}.`
                        : 'Reserve stays at or above the Emergency Reserve.'}
                      warning
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {options.map((option) => (
              <OptionTimeline key={option.type} option={option} currency={scenario.currency} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Assumption({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>;
}

function ComparisonRow({
  label,
  options,
  render,
  warning = false,
}: {
  label: string;
  options: FinancingOptionResult[];
  render: (option: FinancingOptionResult) => ReactNode;
  warning?: boolean;
}) {
  return (
    <tr>
      <th scope="row" className="p-3 text-left font-medium">{label}</th>
      {options.map((option) => (
        <td
          key={`${label}-${option.type}`}
          className={`p-3 ${warning ? 'text-left align-top' : 'text-right tabular-nums'}`}
        >
          {render(option)}
        </td>
      ))}
    </tr>
  );
}

function OptionTimeline({ option, currency }: { option: FinancingOptionResult; currency: string }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">{optionLabels[option.type]} timeline</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <details>
          <summary className="cursor-pointer text-sm font-medium">Yearly checkpoints ({option.yearlyCheckpoints.length})</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-2">Period</th><th className="p-2 text-right">Savings Return</th><th className="p-2 text-right">Loan Interest</th><th className="p-2 text-right">Loan Principal</th><th className="p-2 text-right">Ending Savings</th><th className="p-2 text-right">Loan Balance</th></tr>
              </thead>
              <tbody className="divide-y">
                {option.yearlyCheckpoints.map((checkpoint) => (
                  <tr key={checkpoint.year}>
                    <th scope="row" className="p-2 text-left font-medium">Year {checkpoint.year} · months {checkpoint.fromMonth}–{checkpoint.toMonth}</th>
                    <td className="p-2 text-right tabular-nums">{formatMoney(checkpoint.savingsReturn, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(checkpoint.loanInterest, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(checkpoint.loanPrincipal, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(checkpoint.endingSavingsBalance, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(checkpoint.remainingLoanBalance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <details>
          <summary className="cursor-pointer text-sm font-medium">Monthly detail ({option.timeline.length} months)</summary>
          <div className="mt-3 max-h-[32rem] overflow-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 bg-muted text-left">
                <tr><th className="p-2">Month</th><th className="p-2 text-right">Savings Return</th><th className="p-2 text-right">Loan Payment</th><th className="p-2 text-right">Interest / Principal</th><th className="p-2 text-right">Scenario Savings</th><th className="p-2 text-right">Loan Balance</th><th className="p-2 text-right">Funding Shortfall</th><th className="p-2">Reserve</th><th className="p-2">Assets</th></tr>
              </thead>
              <tbody className="divide-y">
                {option.timeline.map((month) => (
                  <tr key={month.month}>
                    <th scope="row" className="p-2 text-left font-medium">{month.month}</th>
                    <td className="p-2 text-right tabular-nums">{formatMoney(month.savingsReturn, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(month.loanPayment, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(month.loanInterest, currency)} / {formatMoney(month.loanPrincipal, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(month.savingsBalance, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(month.remainingLoanBalance, currency)}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(month.monthlyFundingShortfall, currency)}</td>
                    <td className="p-2">{month.reserveBreach ? <span className="text-amber-700 dark:text-amber-300">At risk</span> : 'Safe'}</td>
                    <td className="p-2">
                      <details>
                        <summary className="cursor-pointer">{month.assets.length} balances</summary>
                        <ul className="mt-1 space-y-1">
                          {month.assets.map((asset) => (
                            <li key={asset.assetId} className="min-w-48 text-xs">
                              {asset.name}: return {formatMoney(asset.savingsReturn, currency)}, +{formatMoney(asset.contribution, currency)}, −{formatMoney(asset.withdrawal, currency)}, end {formatMoney(asset.endingBalance, currency)}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
