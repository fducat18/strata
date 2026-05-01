import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { VERSION } from '@/lib/version';

export function AboutSection() {
  const envBadge =
    VERSION.env === 'production' ? null : (
      <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        DEV
      </span>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Strata</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-medium">
              {VERSION.version}
              {envBadge}
            </dd>
          </div>
          <Row label="Build" value={`${VERSION.gitSha} · ${VERSION.buildTime}`} />
          <Row label="Backend" value="NestJS + Prisma + SQLite" />
          <Row label="Frontend" value="Astro + React + Tailwind CSS" />
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Documentation</dt>
            <dd>
              <a
                href={import.meta.env.PUBLIC_DOCS_URL || 'http://localhost:8001/docs/'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open Documentation →
              </a>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
