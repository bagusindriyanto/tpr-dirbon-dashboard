import { fakerID_ID as faker } from '@faker-js/faker';
import type {
  Output,
  ProblemPIC,
  Shift,
  StyleHour,
  StyleRun,
} from '../../shared/contracts';

const PRODUCTION_HOURS = 10;

const STYLE_POOL = [
  'TR-1G1415-POTONG KOTAK',
  'TR-2B2201-ASSY FRAME',
  'TR-3C1102-SEAL RING',
  'TR-4D3310-BRACKET',
  'TR-5E4420-COVER VALVE',
] as const;

const PARTS_POOL = [
  'DRN/ DIRBON ON BODY BACK, DRN/ DIRBON ON THUMB BACK',
  'DRN/ DIRBON ON THUMB BACK',
  'TPR ON BODY BACK',
  'TPR "HEAVY" ON TAB',
] as const;

const PIC_POOL = [
  'MT',
  'Produksi',
  'Trainer',
  'QC',
] as const satisfies readonly ProblemPIC[];

function createMockRun(
  line: string,
  shift: Shift,
  style: string,
  parts: string,
  startHour: number,
  workingHour: number,
): StyleRun {
  const hourlyTarget = faker.number.int({ min: 30, max: 60 });
  const manPower = faker.number.int({ min: 1, max: 10 });
  const wip = faker.number.int({ min: 0, max: hourlyTarget });
  const operator = faker.person.firstName();

  const hours: StyleHour[] = Array.from(
    { length: workingHour },
    (_, index) => ({
      hour: startHour + index,
      output: faker.datatype.boolean({ probability: 0.08 })
        ? 0
        : faker.number.int({
            min: Math.max(0, hourlyTarget - 8),
            max: hourlyTarget + 6,
          }),
      repair: faker.number.int({ min: 0, max: 4 }),
      reject: faker.number.int({ min: 0, max: 4 }),
    }),
  );

  const totalOutput = hours.reduce((sum, hour) => sum + hour.output, 0);
  const totalRepair = hours.reduce((sum, hour) => sum + hour.repair, 0);
  const totalReject = hours.reduce((sum, hour) => sum + hour.reject, 0);
  const totalTarget = hourlyTarget * workingHour;

  return {
    id: `${line}-${shift}-${style}-${startHour}`,
    style,
    parts,
    operator,
    startHour,
    endHour: startHour + workingHour - 1,
    hourlyTarget,
    totalTarget,
    totalOutput,
    totalRepair,
    totalReject,
    manPower,
    workingHour,
    manHour: manPower * workingHour,
    wip,
    performance: totalTarget > 0 ? totalOutput / totalTarget : 0,
    hours,
  };
}

export const createMockOutput = (line: string): Output => {
  const shift = faker.helpers.arrayElement(['1', '2'] as const);
  const runCount = faker.number.int({ min: 1, max: 3 });
  const repeatFirstStyle = runCount >= 3 && faker.datatype.boolean();
  const runs: StyleRun[] = [];
  let nextHour = 1;

  for (let index = 0; index < runCount; index++) {
    const remainingRuns = runCount - index;
    const remainingHours = PRODUCTION_HOURS - nextHour + 1;

    if (remainingHours < remainingRuns) break;

    const maxLength = remainingHours - (remainingRuns - 1);
    const workingHour =
      index === runCount - 1
        ? remainingHours
        : faker.number.int({ min: 1, max: maxLength });
    const previousStyle = runs[runs.length - 1]?.style;
    const style =
      index === runCount - 1 && repeatFirstStyle && runs.length > 0
        ? runs[0].style
        : faker.helpers.arrayElement(
            STYLE_POOL.filter((candidate) => candidate !== previousStyle),
          );
    const previousParts = runs[runs.length - 1]?.parts;
    const parts =
      index === runCount - 1 && repeatFirstStyle && runs.length > 0
        ? runs[0].parts
        : faker.helpers.arrayElement(
            PARTS_POOL.filter((candidate) => candidate !== previousParts),
          );

    runs.push(createMockRun(line, shift, style, parts, nextHour, workingHour));
    nextHour += workingHour;

    if (
      index < runCount - 1 &&
      nextHour <= PRODUCTION_HOURS &&
      faker.datatype.boolean({ probability: 0.18 })
    ) {
      nextHour += 1;
    }
  }

  const totalOutput = runs.reduce((sum, run) => sum + run.totalOutput, 0);
  const totalTarget = runs.reduce((sum, run) => sum + run.totalTarget, 0);
  const activePics = faker.helpers.arrayElements(
    PIC_POOL,
    faker.number.int({ min: 0, max: 2 }),
  );
  const problems = activePics.map(
    (pic) =>
      `${faker.lorem.words(faker.number.int({ min: 2, max: 4 }))} (${pic})`,
  );

  return {
    line,
    shift,
    performance: totalTarget > 0 ? totalOutput / totalTarget : 0,
    data: runs,
    produksi: activePics.includes('Produksi') ? 1 : 0,
    mt: activePics.includes('MT') ? 1 : 0,
    trainer: activePics.includes('Trainer') ? 1 : 0,
    qc: activePics.includes('QC') ? 1 : 0,
    problems,
  };
};
