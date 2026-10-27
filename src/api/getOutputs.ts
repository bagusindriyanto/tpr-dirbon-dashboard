import { runGas } from '@/lib/gas';
import type { Tab } from '@/types/tab';
import { useQuery } from '@tanstack/react-query';

export const useGetOutput = (section: Tab) => {
  return useQuery({
    queryKey: ['output'],
    queryFn: () => runGas('getOutputs'),
    select: (outputData) => outputData[section],
  });
};
