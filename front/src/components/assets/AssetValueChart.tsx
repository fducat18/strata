import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney, formatDate, toDecimal } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import { TimeRangeToggle } from '@/components/shared/TimeRangeToggle.js';
import { getSinceDate, type TimeRange } from '@/lib/utils/timeRange.js';
import { useAssetValueHistory } from '@/lib/hooks/useAssetValueHistory.js';

interface Props {
  assetId: string;
}

export function AssetValueChart({ assetId }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const locale = useLocale();
  const currency = useCurrency();
  
  const since = useMemo(() => getSinceDate(timeRange), [timeRange]);
  const { data: snapshots, isLoading, isError } = useAssetValueHistory(assetId, since);

  if (isLoading) return null;
  if (isError) return null;
  
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Value History</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
          <p className="py-8 text-center text-sm text-muted-foreground">
            No snapshots in this time range. Add snapshots to track value over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = useMemo(() => 
    [...snapshots]
      .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime())
      .map((s) => ({
        date: formatDate(s.observedAt, { locale }),
        value: toDecimal(s.value)?.toNumber() ?? 0,
      })),
    [snapshots, locale]
  );

  return (
    <Card>
      <CardHeader><CardTitle>Value History</CardTitle></CardHeader>
      <CardContent>
        <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
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
              formatter={(value) => [formatMoney(Number(value ?? 0), { currency, locale }), 'Value']}
            />
            <Area type="monotone" dataKey="value" stroke="var(--chart-2)" fillOpacity={1} fill="url(#assetGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
