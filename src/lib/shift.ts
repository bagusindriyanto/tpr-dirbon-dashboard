import type { Shift } from '@/types/output';

export const PRODUCTION_HOURS = 10;

export const SHIFT_WINDOW: Record<Shift, { start: number; end: number }> = {
  '1': { start: 6, end: 19 },
  '2': { start: 19, end: 6 },
};

export const SHIFT_LABEL: Record<Shift, string> = {
  '1': '06.00–19.00',
  '2': '19.00–06.00',
};

export function isWithinShift(shift: Shift, now = new Date()): boolean {
  const hour = now.getHours();
  const window = SHIFT_WINDOW[shift];

  if (window.start < window.end) {
    return hour >= window.start && hour < window.end;
  }

  return hour >= window.start || hour < window.end;
}
