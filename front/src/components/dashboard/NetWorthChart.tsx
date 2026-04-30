import { usePortfolioSnapshots } from '@/lib/hooks';
import type { Portfolio } from '@/lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toDecimal } from '@/lib/format';

interface Props {
  portfolios: Portfolio[];
}

export function NetWorthChart({ portfolios }: Props) {
  // For now, show the first portfolio's snapshots as an example
  const firstPortfolio = portfolios[0];
  const { data: snapshots } = usePortfolioSnapshots(firstPortfolio?.id || '');

  if (!snapshots || snapshots.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No snapshots yet. Take a portfolio snapshot to see the chart.</p>;
  }

  const chartData = snapshots
    .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime())
    .map(s => ({
      date: formatDate(s.observedAt),
      value: toDecimal(s.value)?.toNumber() ?? 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-fg)" tickFormatter={(v) => formatCurrency(v)} />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem' }}
          labelStyle={{ color: 'var(--fg)' }}
          formatter={(value) => [formatCurrency(value as number), 'Value']}
        />
        <Area type="monotone" dataKey="value" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorValue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
