import type { GasFunctions } from '../../shared/contracts';
import { mockOutputsData } from '@/mocks/output';

export const gasMock: GasFunctions = {
  getOutputs: () => mockOutputsData,
};
