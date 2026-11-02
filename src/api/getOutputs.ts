import { runGas } from '@/lib/gas';
import type { Tab } from '@/types/tab';
import { useQuery } from '@tanstack/react-query';

export const useGetOutputs = (section: Tab) => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => runGas('getData'),
    select: (data) => data.outputs[section],
  });
};
