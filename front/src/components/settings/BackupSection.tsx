import {
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui';
import { Download, Upload, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useBackupExport } from './useBackupExport';
import { useBackupImport } from './useBackupImport';

export function BackupSection() {
  const exporter = useBackupExport();
  const importer = useBackupImport();
  const { store } = importer;
  const { step, counts, errors } = store;

  const reviewing = step === 'review' || step === 'confirming';
  const importBusy = step === 'parsing' || step === 'confirming';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data Backup</CardTitle>
          <CardDescription>Export or import your financial data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={() => exporter.exportNow('json')}
              disabled={exporter.jsonStatus === 'loading'}
              variant="outline"
              aria-label="Export backup as JSON"
            >
              <ExportButtonContent status={exporter.jsonStatus} format="json" />
            </Button>

            <Button
              onClick={() => exporter.exportNow('db')}
              disabled={exporter.dbStatus === 'loading'}
              variant="outline"
              aria-label="Export backup as SQLite DB"
            >
              <ExportButtonContent status={exporter.dbStatus} format="db" />
            </Button>

            <input
              ref={importer.fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={importer.onFileChange}
              className="sr-only"
              id="import-file"
              aria-label="Choose backup file to import"
            />
            <Button
              variant="outline"
              onClick={importer.openPicker}
              disabled={importBusy}
              aria-label="Import backup from JSON"
            >
              <ImportButtonLabel busy={importBusy} step={step} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Export JSON for portable backups or migration.
            Export .db to inspect data in a SQLite viewer (e.g. VSCode SQLite extension).
          </p>
          {step === 'error' && errors.length > 0 && (
            <div role="alert" className="text-sm text-destructive">
              {errors[errors.length - 1]}
            </div>
          )}
          {step === 'done' && (
            <div role="status" className="text-sm text-green-600">
              Backup restored successfully.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={reviewing} onClose={store.reset}>
        <DialogHeader>
          <DialogTitle>Confirm Restore</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>This will restore the following from the selected file:</p>
          {counts && (
            <ul className="list-disc pl-5">
              <li>{counts.assets} assets</li>
              <li>{counts.categories} categories</li>
              <li>{counts.tags} tags</li>
            </ul>
          )}
          <p className="text-muted-foreground">Existing data may be overwritten.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={store.reset} disabled={step === 'confirming'}>
            Cancel
          </Button>
          <Button onClick={importer.confirmRestore} disabled={step === 'confirming'}>
            {step === 'confirming' ? 'Restoring…' : 'Confirm restore'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

function ExportButtonContent({
  status,
  format,
}: {
  status: ReturnType<typeof useBackupExport>['jsonStatus'];
  format: 'json' | 'db';
}) {
  if (status === 'loading') return <>{format === 'db' ? 'Exporting…' : 'Exporting…'}</>;
  if (status === 'success') return <><CheckCircle className="h-4 w-4 text-green-500" /> Exported!</>;
  if (status === 'error') return <><AlertCircle className="h-4 w-4 text-destructive" /> Failed</>;
  if (format === 'db') return <><Database className="h-4 w-4" /> Export .db</>;
  return <><Download className="h-4 w-4" /> Export JSON</>;
}

function ImportButtonLabel({ busy, step }: { busy: boolean; step: string }) {
  if (step === 'parsing') return <>Reading…</>;
  if (step === 'confirming') return <>Restoring…</>;
  if (busy) return <>Working…</>;
  return <><Upload className="h-4 w-4" /> Import Backup</>;
}
