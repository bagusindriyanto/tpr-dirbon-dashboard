import { fakerID_ID as faker } from '@faker-js/faker';
import type {
  Problem,
  ProblemPIC,
  ProblemStatus,
  Shift,
} from '../../shared/contracts';

const SHIFT_POOL = ['1', '2'] as const satisfies readonly Shift[];

const STATUS_POOL = [
  'Dalam Proses',
  'Belum Proses',
  'Finish Proses',
] as const satisfies readonly ProblemStatus[];

const PIC_POOL = [
  'MT',
  'Produksi',
  'Trainer',
  'QC',
] as const satisfies readonly ProblemPIC[];

const LINE_POOL = [
  ...Array.from({ length: 20 }, (_, index) => `T${index + 1}`),
  ...Array.from({ length: 5 }, (_, index) => `D${index + 1}`),
] as const;

const PROBLEM_POOL: Record<ProblemPIC, readonly string[]> = {
  MT: [
    'Mesin jahit macet saat proses produksi',
    'Setting mesin tidak stabil',
    'Spare part mesin aus dan perlu diganti',
    'Sensor mesin sering error',
    'Tekanan angin mesin press menurun',
  ],
  Produksi: [
    'Metode kerja belum sesuai SOP',
    'Operator kurang teliti saat pengecekan',
    'Alur material antar line terhambat',
    'Target output tidak tercapai',
    'Waktu pergantian style terlalu lama',
  ],
  Trainer: [
    'Operator baru perlu pendampingan',
    'Sosialisasi standar kerja belum merata',
    'Training refreshment belum terlaksana',
    'Kesalahan operator baru saat setup',
    'Instruksi kerja belum dipahami operator',
  ],
  QC: [
    'Material tidak sesuai spesifikasi',
    'Temuan cacat pada hasil produksi',
    'Hasil pengecekan belum sesuai standar',
    'Reject meningkat pada proses akhir',
    'Sample approval material terlambat',
  ],
};

function formatDateTime(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');

  return [
    `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`,
    `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`,
  ].join(' ');
}

function createMockProblem(id: number): Problem {
  const pic = PIC_POOL[(id - 1) % PIC_POOL.length];
  const status = STATUS_POOL[(id - 1) % STATUS_POOL.length];
  const now = Date.now();
  const reportedAt = faker.date.recent({ days: 1, refDate: now });
  const minute = 60 * 1000;
  const start =
    status === 'Belum Proses'
      ? null
      : new Date(
          Math.min(
            now - 5 * minute,
            reportedAt.getTime() +
              faker.number.int({ min: 5, max: 90 }) * minute,
          ),
        );
  const finish =
    status === 'Finish Proses' && start
      ? new Date(
          Math.min(
            now - minute,
            start.getTime() + faker.number.int({ min: 15, max: 180 }) * minute,
          ),
        )
      : null;

  return {
    timestamp: formatDateTime(reportedAt),
    shift: faker.helpers.arrayElement(SHIFT_POOL),
    line: faker.helpers.arrayElement(LINE_POOL),
    problem: faker.helpers.arrayElement(PROBLEM_POOL[pic]),
    pic,
    status,
    start: start ? formatDateTime(start) : '-',
    finish: finish ? formatDateTime(finish) : '-',
    timestampTime: reportedAt.getTime(),
    id,
  };
}

export const createMockProblems = (count = 10): Problem[] => {
  const problems = Array.from({ length: count }, (_, index) =>
    createMockProblem(index + 1),
  );

  return problems.sort((a, b) => {
    const aFinish = a.status === 'Finish Proses';
    const bFinish = b.status === 'Finish Proses';

    if (aFinish !== bFinish) return aFinish ? 1 : -1;
    if (a.status !== b.status) return a.status.localeCompare(b.status);

    return a.timestampTime - b.timestampTime;
  });
};
