import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export function AboutSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About Strata</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <Row label="Version" value="1.0.0" />
          <Row label="Backend" value="NestJS + Prisma + SQLite" />
          <Row label="Frontend" value="Astro + React + Tailwind CSS" />
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Documentation</dt>
            <dd>
              <a
                href="https://strata.ducatillon.net/docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                strata.ducatillon.net/docs
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
