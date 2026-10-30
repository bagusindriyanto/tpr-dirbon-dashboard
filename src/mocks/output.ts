import { fakerID_ID as faker } from '@faker-js/faker';
import type { Output } from '../../shared/contracts';

export const createMockOutput = (line: string): Output => {
  const style = faker.lorem.sentence({ min: 8, max: 10 });
  const operator = faker.person.firstName();
  const hourlyTarget = faker.number.int({ min: 30, max: 60 });
  const outputs = faker.helpers.multiple(
    () => faker.number.int({ min: hourlyTarget - 5, max: hourlyTarget + 5 }),
    { count: 10 },
  );
  const totalOutput = outputs.reduce((sum, val) => sum + val, 0);

  const workingHour = 10;
  const wip = faker.number.int({ min: 0, max: hourlyTarget });
  const manPower = faker.number.int({ min: 1, max: 10 });
  const repair = faker.number.int({ min: 0, max: wip });
  const reject = faker.number.int({ min: 0, max: wip });
  const manHour = manPower * workingHour;
  const totalTarget = hourlyTarget * workingHour;
  const performance = totalOutput / (totalTarget || 1);
  const produksi = faker.number.int({ min: 0, max: 1 });
  const mt = faker.number.int({ min: 0, max: 1 });
  const trainer = faker.number.int({ min: 0, max: 1 });
  const qc = faker.number.int({ min: 0, max: 1 });
  const problems = faker.helpers.multiple(() => faker.lorem.words(3), {
    count: faker.number.int({ min: 0, max: 5 }),
  });

  return {
    line,
    operator,
    style,
    wip,
    hourlyTarget,
    totalTarget,
    totalOutput,
    performance,
    repair,
    reject,
    outputs,
    manPower,
    workingHour,
    manHour,
    produksi,
    mt,
    trainer,
    qc,
    problems,
  };
};
