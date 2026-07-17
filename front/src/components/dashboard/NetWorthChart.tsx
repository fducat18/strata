import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatMoney, formatDate } from '@/lib/format';
import { TimeRangeToggle } from '@/components/shared/TimeRangeToggle.js';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import { getSinceDate, type TimeRange } from '@/lib/utils/timeRange.js';
import { FILTER_MODES, type FilterMode, useNetWorthBreakdown } from '@/lib/hooks';

const MODE_LABELS: Record<FilterMode, string> = {
  total: 'Net Worth',
  'by-group': 'By Group',
  'by-type': 'By Type',
  'by-category': 'By Category',
};

export function NetWorthChart() {
  const [mode, setMode] = useState<FilterMode>('total');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const locale = useLocale();
  const currency = useCurrency();
  const since = useMemo(() => getSinceDate(timeRange), [timeRange]);
  const { data, keys, keyColors } = useNetWorthBreakdown(mode, since);

  const fmtOpts = { currency, locale };

  if (!data || data.length === 0) {
    return (
      <div>
        <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
        <FilterToggle mode={mode} onModeChange={setMode} />
        <p className="py-8 text-center text-sm text-muted-foreground">
          No portfolio history yet. Add assets with acquisition dates to start tracking your net worth.
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    date: formatDate(d.date as string, { locale }),
  }));

  return (
    <div className="space-y-3">
      <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
      <FilterToggle mode={mode} onModeChange={setMode} />
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} stackOffset={mode === 'total' ? 'none' : 'sign'}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="var(--muted-fg)"
            tickFormatter={(v) => formatMoney(v as number, { ...fmtOpts, minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            domain={['auto', 'auto']}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
            }}
            labelStyle={{ color: 'var(--fg)' }}
            formatter={(value) => [formatMoney(value as number, fmtOpts), undefined]}
          />
          <Legend />
          <ReferenceLine y={0} stroke="var(--muted-fg)" />
          {keys.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId={mode === 'total' ? undefined : 'stack'}
              stroke={keyColors[key] ?? '#6b7280'}
              fill={keyColors[key] ?? '#6b7280'}
              fillOpacity={0.4}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FilterToggle({
  mode,
  onModeChange,
}: {
  mode: FilterMode;
  onModeChange: (m: FilterMode) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {FILTER_MODES.map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            mode === m
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
