import DateTime from '@/components/contents/DateTime';
import FilterWidget from '@/components/contents/FilterWidget';
import type { GetDataFilter } from '@/types/output';

type AppFilterProps = {
  value: GetDataFilter;
  onChange: (value: GetDataFilter) => void;
};

export default function AppFilter({ value, onChange }: AppFilterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <DateTime />
      <FilterWidget value={value} onChange={onChange} />
    </div>
  );
}
