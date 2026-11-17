import type { Output, ScheduleSnapshot, Shift } from '@/types/output';

export type MissingOutputSection = 'tpr' | 'dirbon';

export type MissingOutputHour = {
  hour: number;
  style: string;
  part: string;
};

export type MissingOutput = {
  section: MissingOutputSection;
  line: string;
  shift: Shift;
  hours: MissingOutputHour[];
};

/**
 * Kumpulkan jam produksi yang belum memiliki input. Jam harus sudah selesai
 * menurut sheet `Jam` (`hour < currentHour`). Jam dengan output 0 yang memang
 * diisi tidak dianggap hilang karena `hasData` bernilai true.
 */
export function findMissingOutputs(
  outputs: Output[],
  section: MissingOutputSection,
  schedule: Pick<ScheduleSnapshot, 'currentHour' | 'currentShift'> | null,
): MissingOutput[] {
  if (!schedule || schedule.currentHour <= 0) return [];

  const shift = schedule.currentShift;
  const currentHour = schedule.currentHour;

  return outputs
    .filter((output) => output.shift === shift)
    .map((output) => {
      const hours = output.data
        .flatMap((run) =>
          run.hours
            .filter(
              (entry) => entry.hasData === false && entry.hour < currentHour,
            )
            .map((entry) => ({
              hour: entry.hour,
              style: run.style,
              part: run.parts,
            })),
        )
        .sort((a, b) => a.hour - b.hour);

      return { section, line: output.line, shift, hours };
    })
    .filter((output) => output.hours.length > 0)
    .sort((a, b) => a.line.localeCompare(b.line, 'id', { numeric: true }));
}
