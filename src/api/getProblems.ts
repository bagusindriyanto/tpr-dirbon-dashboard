import { runGas } from '@/lib/gas';
import { useQuery } from '@tanstack/react-query';

export const useGetProblems = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => runGas('getData'),
    select: (data) => data.problems,
  });
};
