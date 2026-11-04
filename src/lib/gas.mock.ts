import type { GasFunctions, Output, Shift } from '../../shared/contracts';
import { createMockOutput } from '@/mocks/output';
import { createMockProblems } from '@/mocks/problem';

function getShiftFromTimestamp(timestampTime: number): Shift {
  const hour = new Date(timestampTime).getHours();
  return hour >= 6 && hour < 19 ? '1' : '2';
}

function getDateKeyFromTimestamp(timestampTime: number): string {
  const value = new Date(timestampTime);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export const gasMock: GasFunctions = {
  getData: (filter) => {
    const date = filter?.date;
    const shift = filter?.shift;
    const filterByShift = (items: Output[]) =>
      shift ? items.filter((item) => item.shift === shift) : items;

    // Mock output tidak menyimpan tanggal, jadi filter tanggal hanya
    // disimulasikan pada daftar problem.
    const problems = createMockProblems().filter((problem) => {
      if (date && getDateKeyFromTimestamp(problem.timestampTime) !== date) {
        return false;
      }
      if (shift && getShiftFromTimestamp(problem.timestampTime) !== shift) {
        return false;
      }
      return true;
    });

    return {
      outputs: {
        tpr: filterByShift(
          Array.from({ length: 20 }, (_, i) => createMockOutput(`T${i + 1}`)),
        ),
        dirbon: filterByShift(
          Array.from({ length: 5 }, (_, i) => createMockOutput(`D${i + 1}`)),
        ),
      },
      problems,
    };
  },
  getOutstandingData: () => ({
    tpr: [],
    dirbon: [],
  }),
};
