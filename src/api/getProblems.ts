import { runGas } from '@/lib/gas';
import type { GetDataFilter } from '@/types/output';
import { useQuery } from '@tanstack/react-query';

export const useGetProblems = (filter?: GetDataFilter) => {
  return useQuery({
    queryKey: ['dashboard', filter],
    queryFn: () => runGas('getData', filter),
    select: (data) => data.problems,
  });
};
