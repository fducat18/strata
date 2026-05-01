import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatMoney } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';

interface AllocationItem {
  code: string;
  label: string;
  value: number;
}

interface Props {
  data: AllocationItem[];
}

const COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', '#06b6d4', '#ec4899',
  '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#e11d48', '#0891b2',
];

export function AllocationChart({ data }: Props) {
  const locale = useLocale();
  const currency = useCurrency();

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No assets yet.</p>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="label"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            if (percent < 0.05) return null;
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            return (
              <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem' }}
          formatter={(value: number, name: string) => [
            formatMoney(value, { currency, locale }),
            name,
          ]}
        />
        <Legend formatter={(value) => <span style={{ color: 'var(--fg)' }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
