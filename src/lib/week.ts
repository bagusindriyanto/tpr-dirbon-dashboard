const DATE_LABEL_FORMAT = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export type WeekDateOption = {
  value: string;
  label: string;
};

function toDateKey(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getWeekDateOptions(): WeekDateOption[] {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dates: Date[] = [];

  while (dates.length < 6) {
    if (date.getDay() !== 0) {
      dates.push(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    }

    date.setDate(date.getDate() - 1);
  }

  return dates.map((date) => ({
    value: toDateKey(date),
    label: DATE_LABEL_FORMAT.format(date),
  }));
}
