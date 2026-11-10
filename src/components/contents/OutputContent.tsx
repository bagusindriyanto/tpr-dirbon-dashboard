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
import OutputCarousel from './OutputCarousel';

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
      {error ? (
        !outputData || outputData.length === 0 ? (
          <Empty className="border-2 bg-red-50 border-destructive">
            <EmptyHeader>
              <EmptyMedia
                className="bg-destructive/10 text-destructive"
                variant="icon"
              >
                <AlertTriangleIcon />
              </EmptyMedia>
              <EmptyTitle>Gagal memuat data</EmptyTitle>
              <EmptyDescription>{error.message}</EmptyDescription>
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
          <Alert className="bg-red-50 text-destructive border-destructive">
            <AlertTriangleIcon />
            <AlertTitle>Gagal memuat data</AlertTitle>
            <AlertDescription className="text-foreground">
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
        )
      ) : null}

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
          <OutputCarousel
            key={`${section}|${filter?.date ?? ''}|${filter?.shift ?? ''}`}
            items={outputData}
            tick={tick}
            label={section === 'tpr' ? 'TPR' : 'Dirbon'}
          />
        )
      ) : null}
    </>
  );
}
