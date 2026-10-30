// import { useGetOutput } from '@/api/getOutput';
import { useGetOutput } from '@/api/getOutputs';
import type { Tab } from '@/types/tab';
// import OutputCard from './OutputCard';
import { AlertTriangleIcon, InfoIcon, RefreshCwIcon } from 'lucide-react';
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
};

export default function OutputContent({ section }: OutputContentProps) {
  const {
    data: outputData,
    isPending,
    isFetching,
    error,
    refetch,
  } = useGetOutput(section);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {outputData.map((item) => (
              <OutputCard key={item.line} item={item} />
            ))}
          </div>
        )
      ) : null}
    </>
  );
}
