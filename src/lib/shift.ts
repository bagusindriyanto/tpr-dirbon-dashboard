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

const HOUR_MS = 60 * 60 * 1000;

/** Toleransi sebelum jam yang kosong dianggap terlambat. */
export const PRODUCTION_HOUR_TOLERANCE_MINUTES = 15;

export function getCurrentShift(now = new Date()): Shift {
  return isWithinShift('1', now) ? '1' : '2';
}

/**
 * Waktu mulai shift yang sedang berjalan. Shift 2 yang melewati tengah malam
 * akan menghasilkan tanggal kemarin.
 */
export function getShiftStart(
  now = new Date(),
  shift: Shift = getCurrentShift(now),
): Date {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);

  if (shift === '1') {
    start.setHours(SHIFT_WINDOW['1'].start);
    return start;
  }

  start.setHours(SHIFT_WINDOW['2'].start);

  if (now.getHours() < SHIFT_WINDOW['1'].start) {
    start.setDate(start.getDate() - 1);
  }

  return start;
}

/** Jam produksi ke-1..10 yang sedang berjalan saat ini. */
export function getProductionHour(
  now = new Date(),
  shift: Shift = getCurrentShift(now),
): number {
  const start = getShiftStart(now, shift);
  const elapsed = Math.floor((now.getTime() - start.getTime()) / HOUR_MS) + 1;

  return Math.min(Math.max(elapsed, 1), PRODUCTION_HOURS);
}

export function getProductionHourStart(
  now: Date,
  shift: Shift,
  hour: number,
): Date {
  return new Date(
    getShiftStart(now, shift).getTime() + (hour - 1) * HOUR_MS,
  );
}

/**
 * Jam dianggap terlambat jika sekarang sudah melewati akhir jam tersebut
 * ditambah toleransi.
 */
export function isPastTolerance(
  now: Date,
  shift: Shift,
  hour: number,
): boolean {
  const hourEnd = new Date(
    getProductionHourStart(now, shift, hour).getTime() + HOUR_MS,
  );

  return (
    now.getTime() >=
    hourEnd.getTime() + PRODUCTION_HOUR_TOLERANCE_MINUTES * 60 * 1000
  );
}
