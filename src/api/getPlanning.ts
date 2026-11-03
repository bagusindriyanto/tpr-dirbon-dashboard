import { runGas } from '@/lib/gas';
import type { GasResult, PlanningDistribution } from '../../shared/contracts';
import { useQuery } from '@tanstack/react-query';

const EMPTY_PLANNING: GasResult<PlanningDistribution> = {
  tpr: [],
  dirbon: [],
};

export const useGetPlanning = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => runGas('getData'),
    select: (data) => data.planning ?? EMPTY_PLANNING,
  });
};

export { EMPTY_PLANNING };
