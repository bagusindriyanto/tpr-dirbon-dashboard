import { getWeekDateOptions } from '@/lib/week';
import type { GetDataFilter } from '@/types/output';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { XCircleIcon } from 'lucide-react';

type FilterBarProps = {
  value: GetDataFilter;
  onChange: (value: GetDataFilter) => void;
};

const AUTO_VALUE = 'auto';

const DATE_OPTIONS = [
  { value: AUTO_VALUE, label: 'Otomatis' },
  ...getWeekDateOptions(),
] as const;

const SHIFT_OPTIONS = [
  { value: AUTO_VALUE, label: 'Otomatis' },
  { value: '1', label: 'Shift 1' },
  { value: '2', label: 'Shift 2' },
] as const;

export default function FilterWidget({ value, onChange }: FilterBarProps) {
  const hasFilter = Boolean(value.date || value.shift);

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          Tanggal
        </span>
        <Select
          items={DATE_OPTIONS}
          value={value.date ?? AUTO_VALUE}
          onValueChange={(next) => {
            onChange({
              ...value,
              date: next && next !== AUTO_VALUE ? next : undefined,
            });
          }}
        >
          <SelectTrigger size="sm" className="w-full sm:w-44">
            <SelectValue placeholder="Pilih tanggal" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Tanggal</SelectLabel>
              {DATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Shift</span>
        <Select
          items={SHIFT_OPTIONS}
          value={value.shift ?? AUTO_VALUE}
          onValueChange={(next) => {
            onChange({
              ...value,
              shift: next === '1' || next === '2' ? next : undefined,
            });
          }}
        >
          <SelectTrigger size="sm" className="w-full sm:w-36">
            <SelectValue placeholder="Pilih shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Shift</SelectLabel>
              {SHIFT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <Button
          variant="destructive"
          size="sm"
          className="self-start sm:self-auto"
          onClick={() => onChange({})}
        >
          <XCircleIcon data-icon="inline-start" />
          Reset Filter
        </Button>
      )}
    </div>
  );
}
