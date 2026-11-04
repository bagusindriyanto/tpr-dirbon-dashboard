import { useGetOutputs } from '@/api/getOutputs';
import type { GetDataFilter } from '@/types/output';
import type { Tab } from '@/types/tab';
import { AlertTriangleIcon, InfoIcon, RefreshCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Spinner } from '../ui/spinner';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';
import OutputCard from './OutputCard';

type OutputContentProps = {
  section: Tab;
  filter?: GetDataFilter;
};

export default function OutputContent({ section, filter }: OutputContentProps) {
  const {
    data: outputData,
    isPending,
    isFetching,
    error,
    refetch,
  } = useGetOutputs(section, filter);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((value) => value + 1);
    }, 8_000);

    return () => clearInterval(interval);
  }, []);

  if (isPending)
    return (
      <div className="h-60 flex justify-center items-center">
        <Spinner className="size-10 text-primary" />
      </div>
    );

  return (
    <>
      {error && (
        <Alert className="bg-destructive/10 text-red-800 border-destructive">
          <AlertTriangleIcon />
          <AlertTitle>Gagal memuat data</AlertTitle>
          <AlertDescription className="text-zinc-900">
            {error.message}
          </AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-foreground"
            >
              <RefreshCwIcon
                className={isFetching ? 'animate-spin' : ''}
                data-icon="inline-start"
              />
              Refresh data
            </Button>
          </AlertAction>
        </Alert>
      )}

      {outputData ? (
        outputData.length === 0 ? (
          <Empty className="border-2 bg-background/40">
            <EmptyHeader>
              <EmptyMedia className="bg-info/10 text-info" variant="icon">
                <InfoIcon />
              </EmptyMedia>
              <EmptyTitle>Tidak ada data</EmptyTitle>
              <EmptyDescription>Tidak ada line yang aktif.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCwIcon
                  className={isFetching ? 'animate-spin' : ''}
                  data-icon="inline-start"
                />
                Refresh data
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="output-grid grid min-w-0 gap-2 sm:gap-3">
            {outputData.map((item) => (
              <OutputCard key={item.line} item={item} tick={tick} />
            ))}
          </div>
        )
      ) : null}
    </>
  );
}
