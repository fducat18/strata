// front/src/components/shared/TimeRangeToggle.tsx

import { TIME_RANGES, type TimeRange } from '@/lib/utils/timeRange.js';

interface Props {
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
}

export function TimeRangeToggle({ range, onRangeChange }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TIME_RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onRangeChange(r)}
          className={`px-2.5 py-0.5 text-xs rounded border transition-colors ${
            range === r
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
