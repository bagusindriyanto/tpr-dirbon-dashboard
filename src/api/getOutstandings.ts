import { runGas } from '@/lib/gas';
import { useQuery } from '@tanstack/react-query';

export const useGetOutstandings = () => {
  return useQuery({
    queryKey: ['outstandings'],
    queryFn: () => runGas('getOutstandingData'),
  });
};
