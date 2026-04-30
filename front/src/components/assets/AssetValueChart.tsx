import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney, formatDate, toDecimal } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import type { AssetSnapshot } from '@/lib/types';

interface Props {
  snapshots: AssetSnapshot[];
}

export function AssetValueChart({ snapshots }: Props) {
  const locale = useLocale();
  const currency = useCurrency();

  if (snapshots.length === 0) return null;

  const chartData = [...snapshots]
    .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime())
    .map((s) => ({
      date: formatDate(s.observedAt, { locale }),
      value: toDecimal(s.value)?.toNumber() ?? 0,
    }));

  return (
    <Card>
      <CardHeader><CardTitle>Value History</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem' }}
              formatter={(value: number) => [formatMoney(value, { currency, locale }), 'Value']}
            />
            <Area type="monotone" dataKey="value" stroke="var(--chart-2)" fillOpacity={1} fill="url(#assetGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
