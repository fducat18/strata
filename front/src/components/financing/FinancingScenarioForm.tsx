import { useState, type FormEvent } from 'react';
import { Save, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import type { Asset, FinancingScenario, SaveFinancingScenarioRequest } from '@/lib/types';

interface FinancingScenarioFormProps {
  assets: Asset[];
  scenario?: FinancingScenario | null;
  isSaving: boolean;
  error?: string | null;
  onSave: (request: SaveFinancingScenarioRequest) => Promise<void>;
  onCancel?: () => void;
}

interface ScenarioFormValues {
  name: string;
  purchasePrice: string;
  customDownPayment: string;
  emergencyReserve: string;
  monthlyAvailableAmount: string;
  loanRatePercent: string;
  insuranceFeePercent: string;
  loanDurationYears: string;
  loanSetupFee: string;
}

const emptyValues: ScenarioFormValues = {
  name: '',
  purchasePrice: '',
  customDownPayment: '',
  emergencyReserve: '0.00',
  monthlyAvailableAmount: '0.00',
  loanRatePercent: '6',
  insuranceFeePercent: '0.5',
  loanDurationYears: '5',
  loanSetupFee: '0.00',
};

function initialValues(scenario?: FinancingScenario | null): ScenarioFormValues {
  if (!scenario) return emptyValues;
  return {
    name: scenario.name,
    purchasePrice: scenario.inputs.purchasePrice,
    customDownPayment: scenario.inputs.customDownPayment,
    emergencyReserve: scenario.inputs.emergencyReserve,
    monthlyAvailableAmount: scenario.inputs.monthlyAvailableAmount,
    loanRatePercent: scenario.inputs.loanRatePercent,
    insuranceFeePercent: scenario.inputs.insuranceFeePercent ?? '0',
    loanDurationYears: String(scenario.inputs.loanDurationMonths / 12),
    loanSetupFee: scenario.inputs.loanSetupFee,
  };
}

function formatMoney(value: string | null, currency = 'EUR'): string {
  if (value === null) return 'No balance recorded';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));
}

function validMoney(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value));
}

export function FinancingScenarioForm({
  assets,
  scenario,
  isSaving,
  error,
  onSave,
  onCancel,
}: FinancingScenarioFormProps) {
  const [values, setValues] = useState(() => initialValues(scenario));
  const savedAssets = new Map((scenario?.inputs.assets ?? []).map((asset) => [asset.assetId, asset] as const));
  const [assetSettings, setAssetSettings] = useState<Record<string, { available: boolean; rate: string }>>(
    () => Object.fromEntries(assets.map((asset) => {
      const saved = savedAssets.get(asset.id);
      return [asset.id, {
        available: saved?.available ?? false,
        rate: saved?.annualReturnPercent ?? '',
      }];
    })),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const setField = (field: keyof ScenarioFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const setAsset = (id: string, change: Partial<{ available: boolean; rate: string }>) => {
    setAssetSettings((previous) => ({
      ...previous,
      [id]: { ...(previous[id] ?? { available: false, rate: '' }), ...change },
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    const moneyFields = [
      values.purchasePrice,
      values.customDownPayment,
      values.emergencyReserve,
      values.monthlyAvailableAmount,
      values.loanSetupFee,
    ];
    if (!values.name.trim()) {
      setValidationError('Enter a scenario name.');
      return;
    }
    if (!moneyFields.every(validMoney)) {
      setValidationError('Enter monetary values with at most two decimal places.');
      return;
    }
    const purchasePrice = Number(values.purchasePrice);
    const downPayment = Number(values.customDownPayment);
    if (!(purchasePrice > 0) || !(downPayment > 0 && downPayment < purchasePrice)) {
      setValidationError('The custom down payment must be greater than zero and less than the purchase price.');
      return;
    }
    const years = Number(values.loanDurationYears);
    if (!Number.isFinite(years) || years <= 0 || years > 100 || !Number.isInteger(years)) {
      setValidationError('Loan duration must be a whole number from 1 to 100 years.');
      return;
    }
    if (!/^\d+(\.\d{1,6})?$/.test(values.loanRatePercent)) {
      setValidationError('Enter a non-negative annual loan rate.');
      return;
    }
    if (!/^\d+(\.\d{1,6})?$/.test(values.insuranceFeePercent)) {
      setValidationError('Enter a non-negative insurance fee percentage.');
      return;
    }
    const selectedRates = Object.values(assetSettings).filter((asset) => asset.available);
    if (selectedRates.some((asset) => !/^-?\d+(\.\d{1,6})?$/.test(asset.rate))) {
      setValidationError('Enter a valid annual savings return for each available asset.');
      return;
    }
    if (selectedRates.some((asset) => Number(asset.rate) < -1200)) {
      setValidationError('A savings return below -1200% would produce a negative monthly balance.');
      return;
    }

    await onSave({
      name: values.name.trim(),
      purchasePrice: values.purchasePrice,
      customDownPayment: values.customDownPayment,
      emergencyReserve: values.emergencyReserve,
      monthlyAvailableAmount: values.monthlyAvailableAmount,
      loanRatePercent: values.loanRatePercent,
      insuranceFeePercent: values.insuranceFeePercent,
      loanDurationMonths: years * 12,
      loanSetupFee: values.loanSetupFee,
      assets: assets.map((asset) => ({
        assetId: asset.id,
        available: assetSettings[asset.id]?.available ?? false,
        annualReturnPercent: assetSettings[asset.id]?.rate || '0',
      })),
    });
  };

  const field = (
    name: keyof ScenarioFormValues,
    label: string,
    props: { type?: string; step?: string; min?: string; max?: string; suffix?: string } = {},
  ) => (
    <label className="block space-y-1 text-sm" key={name}>
      <span className="font-medium">{label}</span>
      <span className="relative block">
        <Input
          aria-label={label}
          type={props.type ?? 'number'}
          step={props.step ?? '0.01'}
          min={props.min ?? '0'}
          max={props.max}
          value={values[name]}
          onChange={(event) => setField(name, event.target.value)}
          required
          className={props.suffix ? 'pr-12' : undefined}
        />
        {props.suffix && <span className="absolute right-3 top-2 text-xs text-muted-foreground">{props.suffix}</span>}
      </span>
    </label>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{scenario ? 'Edit Financing Scenario' : 'New Financing Scenario'}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Balances are captured from the portfolio when you save. Re-saving refreshes them.
            </p>
          </div>
          {onCancel && <Button variant="outline" onClick={onCancel}><X className="h-4 w-4" /> Cancel</Button>}
        </div>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-1 text-sm sm:col-span-2 lg:col-span-3">
              <span className="font-medium">Scenario name</span>
              <Input aria-label="Scenario name" value={values.name} maxLength={120} onChange={(event) => setField('name', event.target.value)} required />
            </label>
            {field('purchasePrice', 'Purchase Price (EUR)')}
            {field('customDownPayment', 'Custom Down Payment (EUR)')}
            {field('emergencyReserve', 'Emergency Reserve (EUR)')}
            {field('monthlyAvailableAmount', 'Monthly Available Amount (EUR)')}
            {field('loanRatePercent', 'Annual Loan Rate (%)', { step: '0.000001', suffix: '%' })}
            {field('insuranceFeePercent', 'Insurance Fee (% of Purchase Price)', { step: '0.000001', suffix: '%' })}
            {field('loanDurationYears', 'Standard Loan Duration (years)', { step: '1', min: '1', max: '100' })}
            {field('loanSetupFee', 'Loan Setup Fee (EUR)')}
          </div>

          <section aria-labelledby="financing-assets-heading" className="space-y-3">
            <div>
              <h3 id="financing-assets-heading" className="font-semibold">Savings assets</h3>
              <p className="text-sm text-muted-foreground">
                Only assets in the SAVINGS group are listed. Confirm whether each balance is available for this purchase.
              </p>
            </div>
            {assets.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No active savings assets are available to select. You can save this as a draft and add one later.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Available for this purchase</th>
                      <th className="p-3">Asset</th>
                      <th className="p-3 text-right">Current balance</th>
                      <th className="p-3">Savings return assumption</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assets.map((asset) => {
                      const setting = assetSettings[asset.id] ?? { available: false, rate: '' };
                      return (
                        <tr key={asset.id}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              aria-label={`Available for this purchase: ${asset.name}`}
                              checked={setting.available}
                              onChange={(event) => setAsset(asset.id, { available: event.target.checked })}
                              className="h-4 w-4 accent-primary"
                            />
                          </td>
                          <th scope="row" className="p-3 text-left font-medium">{asset.name}</th>
                          <td className="p-3 text-right tabular-nums">{formatMoney(asset.currentValue)}</td>
                          <td className="p-3">
                            <span className="relative block max-w-40">
                              <Input
                                aria-label={`${asset.name} savings return assumption (%)`}
                                type="number"
                                min="-1200"
                                step="0.000001"
                                value={setting.rate}
                                disabled={!setting.available}
                                onChange={(event) => setAsset(asset.id, { rate: event.target.value })}
                                className="pr-8"
                              />
                              <span className="absolute right-3 top-2 text-xs text-muted-foreground">%</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {(validationError || error) && <p role="alert" className="text-sm text-destructive">{validationError ?? error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4" /> {isSaving ? 'Saving…' : scenario ? 'Save changes' : 'Save scenario'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
