import { fakerID_ID as faker } from '@faker-js/faker';
import type { GasResult, Output } from '../../shared/contracts';

export const createMockOutput = (
  line: string,
  overrides?: Partial<Output>,
): Output => {
  const operator = faker.person.firstName();
  const hourlyTarget = overrides?.hourlyTarget ?? 60;
  const outputs = overrides?.outputs ?? [
    55, 58, 60, 62, 59, 61, 58, 60, 57, 50,
  ];
  const totalOutput =
    overrides?.totalOutput ?? outputs.reduce((sum, val) => sum + val, 0);
  const totalTarget = overrides?.totalTarget ?? hourlyTarget * 10;
  const performance =
    overrides?.performance ?? totalOutput / (totalTarget || 1);

  return {
    line,
    operator,
    style: 'STYLE-' + line,
    wip: 120,
    hourlyTarget,
    totalTarget,
    totalOutput,
    performance,
    repair: 5,
    reject: 2,
    outputs,
    manPower: 24,
    workingHour: 8,
    manHour: 2,
    produksi: 1,
    mt: 1,
    trainer: 1,
    qc: 2,
    problems: ['Thread break', 'Needle change'],
    ...overrides,
  };
};

export const mockOutputsData: GasResult<Output> = {
  tpr: [
    createMockOutput('T01', {
      style: 'POLO SHIRT A',
      wip: 180,
      repair: 4,
      reject: 1,
      problems: ['Skipped stitch'],
    }),
    createMockOutput('T02', {
      style: 'CREWNECK TEE',
      wip: 140,
      repair: 6,
      reject: 2,
      problems: ['Fabric crease'],
    }),
    createMockOutput('T03', {
      style: 'HOODIE ZIP',
      wip: 210,
      repair: 2,
      reject: 0,
      problems: [],
    }),
    createMockOutput('T04', {
      style: 'JOGGER PANTS',
      wip: 95,
      repair: 8,
      reject: 3,
      problems: ['Machine jam', 'Needle break'],
    }),
    createMockOutput('T05', {
      style: 'CARGO SHORTS',
      wip: 160,
      repair: 5,
      reject: 1,
      problems: [],
    }),
  ],
  dirbon: [
    createMockOutput('D01', {
      style: 'SLIM CHINO',
      wip: 110,
      repair: 3,
      reject: 1,
      problems: [],
    }),
    createMockOutput('D02', {
      style: 'DENIM JACKET',
      wip: 190,
      repair: 9,
      reject: 4,
      problems: ['Thread tension'],
    }),
    createMockOutput('D03', {
      style: 'OXFORD SHIRT',
      wip: 130,
      repair: 4,
      reject: 2,
      problems: [],
    }),
    createMockOutput('D04', {
      style: 'FLANNEL OVERSHIRT',
      wip: 175,
      repair: 7,
      reject: 1,
      problems: ['Button attach delay'],
    }),
  ],
};
