import { runGas } from '@/lib/gas';
import type { GetDataFilter } from '@/types/output';
import { useQuery } from '@tanstack/react-query';

type GetDashboardDataOptions = {
  refetchInterval?: number;
};

/**
 * Response lengkap `getData`, termasuk snapshot sheet `Jam`. Query key-nya
 * sama dengan `useGetOutputs`/`useGetProblems`, jadi request tetap digabung.
 */
export const useGetDashboardData = (
  filter?: GetDataFilter,
  options?: GetDashboardDataOptions,
) => {
  return useQuery({
    queryKey: ['dashboard', filter],
    queryFn: () => runGas('getData', filter),
    refetchInterval: options?.refetchInterval,
  });
};
