import { getCurrentShift, isPastTolerance } from '@/lib/shift';
import type { Output, Shift } from '@/types/output';

export type MissingOutputSection = 'tpr' | 'dirbon';

export type MissingOutputHour = {
  hour: number;
  style: string;
};

export type MissingOutput = {
  section: MissingOutputSection;
  line: string;
  shift: Shift;
  hours: MissingOutputHour[];
};

/**
 * Kumpulkan jam produksi yang belum memiliki input dan sudah melewati
 * toleransi 15 menit. Jam dengan output 0 yang memang diisi tidak dianggap
 * hilang karena `hasData` bernilai true.
 */
export function findMissingOutputs(
  outputs: Output[],
  section: MissingOutputSection,
  now = new Date(),
  shift: Shift = getCurrentShift(now),
): MissingOutput[] {
  return outputs
    .filter((output) => output.shift === shift)
    .map((output) => {
      const hours = output.data
        .flatMap((run) =>
          run.hours
            .filter(
              (entry) =>
                entry.hasData === false && isPastTolerance(now, shift, entry.hour),
            )
            .map((entry) => ({ hour: entry.hour, style: run.style })),
        )
        .sort((a, b) => a.hour - b.hour);

      return { section, line: output.line, shift, hours };
    })
    .filter((output) => output.hours.length > 0)
    .sort((a, b) => a.line.localeCompare(b.line, 'id', { numeric: true }));
}
