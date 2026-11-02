import type { GasFunctions } from '../../shared/contracts';
import { createMockOutput } from '@/mocks/output';
import { createMockProblems } from '@/mocks/problem';

export const gasMock: GasFunctions = {
  getData: () => ({
    outputs: {
      tpr: Array.from({ length: 20 }, (_, i) =>
        createMockOutput(`T${i + 1}`),
      ),
      dirbon: Array.from({ length: 5 }, (_, i) =>
        createMockOutput(`D${i + 1}`),
      ),
    },
    problems: createMockProblems(),
  }),
};
