import { runGas } from '@/lib/gas';
import type { GetDataFilter } from '@/types/output';
import type { Tab } from '@/types/tab';
import { useQuery } from '@tanstack/react-query';

type GetOutputsOptions = {
  refetchInterval?: number;
};

export const useGetOutputs = (
  section: Tab,
  filter?: GetDataFilter,
  options?: GetOutputsOptions,
) => {
  return useQuery({
    queryKey: ['dashboard', filter],
    queryFn: () => runGas('getData', filter),
    select: (data) => data.outputs[section],
    refetchInterval: options?.refetchInterval,
  });
};
