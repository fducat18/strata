import { useState } from 'react';
import { Calculator, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, EmptyState, Loading } from '@/components/ui';
import {
  useAssets,
  useCreateFinancingScenario,
  useDeleteFinancingScenario,
  useFinancingScenarios,
  useRecalculateFinancingScenario,
  useUpdateFinancingScenario,
} from '@/lib/hooks';
import type { FinancingScenario, SaveFinancingScenarioRequest } from '@/lib/types';
import { FinancingScenarioComparison } from './FinancingScenarioComparison';
import { FinancingScenarioForm } from './FinancingScenarioForm';

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Could not save the financing scenario. Please try again.';
}

function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));
}

export function FinancingScenariosPage() {
  const scenariosQuery = useFinancingScenarios();
  const assetsQuery = useAssets();
  const createMutation = useCreateFinancingScenario();
  const updateMutation = useUpdateFinancingScenario();
  const deleteMutation = useDeleteFinancingScenario();
  const recalculateMutation = useRecalculateFinancingScenario();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOverride, setSelectedOverride] = useState<FinancingScenario | null>(null);
  const [editor, setEditor] = useState<'new' | 'edit' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const scenarios = scenariosQuery.data ?? [];
  const selectedScenario = selectedOverride ?? scenarios.find((scenario) => scenario.id === selectedId) ?? null;
  const activeAssets = (assetsQuery.data ?? []).filter(
    (asset) => !asset.disposed && asset.assetType?.group === 'SAVINGS',
  );

  const saveScenario = async (request: SaveFinancingScenarioRequest) => {
    setSaveError(null);
    try {
      const scenario = editor === 'edit' && selectedId
        ? await updateMutation.mutateAsync({ id: selectedId, data: request })
        : await createMutation.mutateAsync(request);
      setSelectedId(scenario.id);
      setSelectedOverride(scenario);
      setEditor(null);
    } catch (error) {
      setSaveError(errorMessage(error));
    }
  };

  const deleteScenario = async (scenario: FinancingScenario) => {
    if (!window.confirm(`Delete “${scenario.name}”?`)) return;
    try {
      await deleteMutation.mutateAsync(scenario.id);
      if (selectedId === scenario.id) {
        setSelectedId(null);
        setSelectedOverride(null);
        setEditor(null);
      }
    } catch (error) {
      setSaveError(errorMessage(error));
    }
  };

  const recalculate = async () => {
    if (!selectedId) return;
    setSaveError(null);
    try {
      const scenario = await recalculateMutation.mutateAsync(selectedId);
      setSelectedOverride(scenario);
    } catch (error) {
      setSaveError(errorMessage(error));
    }
  };

  if (scenariosQuery.isLoading || assetsQuery.isLoading) return <Loading />;

  if (scenariosQuery.isError || assetsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Calculator className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Could not load financing scenarios or portfolio assets.</p>
        <Button variant="outline" onClick={() => { void scenariosQuery.refetch(); void assetsQuery.refetch(); }}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financing Scenarios</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Compare cash and loan options using saved assumptions. Scenarios are hypothetical and never change your portfolio records.
          </p>
        </div>
        {editor !== 'new' && (
          <Button onClick={() => { setSaveError(null); setEditor('new'); }}>
            <Plus className="h-4 w-4" /> New Scenario
          </Button>
        )}
      </header>

      {saveError && editor === null && <p role="alert" className="text-sm text-destructive">{saveError}</p>}

      {editor && (
        <FinancingScenarioForm
          key={editor === 'edit' ? selectedScenario?.id ?? 'edit' : 'new'}
          assets={activeAssets}
          scenario={editor === 'edit' ? selectedScenario : null}
          isSaving={createMutation.isPending || updateMutation.isPending}
          error={saveError}
          onSave={saveScenario}
          onCancel={() => { setEditor(null); setSaveError(null); }}
        />
      )}

      {scenarios.length === 0 ? (
        <EmptyState
          icon={<Calculator className="h-12 w-12" />}
          title="No financing scenarios yet"
          description="Create one to compare financing costs, savings returns, and reserve safety before a purchase."
          action={editor === 'new' ? undefined : <Button onClick={() => setEditor('new')}><Plus className="h-4 w-4" /> Create scenario</Button>}
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  onClick={() => { setSelectedId(scenario.id); setSelectedOverride(null); setEditor(null); setSaveError(null); }}
                  aria-current={selectedId === scenario.id ? 'true' : undefined}
                  className="min-w-0 flex-1 text-left hover:text-primary"
                >
                  <span className="block truncate font-medium">{scenario.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {formatMoney(scenario.inputs.purchasePrice, scenario.currency)} · {scenario.calculation.financingHorizonMonths} months · {scenario.calculation.status === 'COMPLETE' ? '3 options calculated' : 'Draft: no eligible assets'}
                  </span>
                </button>
                <Button variant="ghost" size="icon" aria-label={`Delete ${scenario.name}`} onClick={() => void deleteScenario(scenario)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedScenario && !editor && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => void recalculate()} disabled={recalculateMutation.isPending}>
              <RefreshCw className="h-4 w-4" /> {recalculateMutation.isPending ? 'Recalculating…' : 'Recalculate'}
            </Button>
            <Button variant="outline" onClick={() => { setSaveError(null); setEditor('edit'); }}>Edit assumptions</Button>
          </div>
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
          <FinancingScenarioComparison scenario={selectedScenario} />
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <h2 className="font-semibold">Glossary</h2>
          <p>
            <span className="font-medium">Monthly Available Amount (EUR):</span>{' '}
            fixed amount left each month after regular income and expenses that can support loan payments or rebuild savings.
          </p>
          <p>
            <span className="font-medium">Funding Shortfall:</span>{' '}
            amount that cannot be covered by available savings (initially or during monthly repayments), even after proportional withdrawals.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
