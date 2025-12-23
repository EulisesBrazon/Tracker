import { DateRange } from '../types';
import { useDateRange } from '../context/DateRangeContext';
import { cn } from '../../../lib/utils';

const ranges: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'ytd', label: 'Este año' },
];

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useDateRange();

  return (
    <div className="flex rounded-lg border border-border bg-muted/50 p-1">
      {ranges.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setDateRange(value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
            dateRange === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
