import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getAssetTypeIcon } from '@/lib/format';

interface AllocationItem {
  code: string;
  label: string;
  count: number;
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
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No assets yet.</p>;
  }

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
          dataKey="count"
          nameKey="label"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem' }}
          formatter={(value, name) => [`${value} asset${value !== 1 ? 's' : ''}`, name]}
        />
        <Legend formatter={(value) => <span style={{ color: 'var(--fg)' }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
