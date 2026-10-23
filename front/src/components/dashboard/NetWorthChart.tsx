import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  const [hiddenKeysByMode, setHiddenKeysByMode] = useState<Partial<Record<FilterMode, string[]>>>({});
  const locale = useLocale();
  const currency = useCurrency();
  const since = useMemo(() => getSinceDate(timeRange), [timeRange]);
  const { data, keys, keyColors } = useNetWorthBreakdown(mode, since);
  const hiddenKeys = hiddenKeysByMode[mode] ?? [];
  const visibleKeys = keys.filter((key) => !hiddenKeys.includes(key));

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

  const chartData = data.map((d) => {
    const point: Record<string, number | string> = {
      date: formatDate(d.date, { locale }),
    };
    for (const key of visibleKeys) {
      const value = d[key];
      if (typeof value === 'number') point[key] = value;
    }
    return point;
  });

  const toggleKey = (key: string) => {
    setHiddenKeysByMode((current) => {
      const hiddenKeys = current[mode] ?? [];
      const nextHiddenKeys = hiddenKeys.includes(key)
        ? hiddenKeys.filter((hiddenKey) => hiddenKey !== key)
        : [...hiddenKeys, key];
      return { ...current, [mode]: nextHiddenKeys };
    });
  };

  return (
    <div className="space-y-3">
      <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
      <FilterToggle mode={mode} onModeChange={setMode} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Chart series visibility">
        {keys.map((key) => {
          const visible = !hiddenKeys.includes(key);
          const color = keyColors[key] ?? '#6b7280';
          return (
            <button
              key={key}
              type="button"
              aria-pressed={visible}
              onClick={() => toggleKey(key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                visible ? 'border-border text-foreground' : 'border-border text-muted-foreground opacity-60'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm border"
                style={{ backgroundColor: visible ? color : 'transparent', borderColor: color }}
              />
              {key}
            </button>
          );
        })}
      </div>
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
          <ReferenceLine y={0} stroke="var(--muted-fg)" />
          {visibleKeys.map((key) => (
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
