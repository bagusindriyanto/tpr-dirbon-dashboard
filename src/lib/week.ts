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

export function getWeekDateOptions(now = new Date()): WeekDateOption[] {
  const day = now.getDay();
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysSinceMonday,
  );

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      value: toDateKey(date),
      label: DATE_LABEL_FORMAT.format(date),
    };
  });
}
