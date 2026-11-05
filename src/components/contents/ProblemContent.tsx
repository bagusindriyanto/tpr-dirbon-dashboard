import { useGetProblems } from '@/api/getProblems';
import type { GetDataFilter } from '@/types/output';
import type { ProblemPIC, ProblemStatus } from '@/types/problem';
import { cn } from '@/lib/utils';
import {
  CircleCheckIcon,
  CircleDashedIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
  BadgeCheckIcon,
  PackageIcon,
  UserCog2Icon,
  WrenchIcon,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

const SKELETON_ROWS = 5;
const COLUMN_COUNT = 7;

const PIC_BADGE_CLASSES: Record<ProblemPIC, string> = {
  MT: 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  QC: 'border-orange-300 bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  Trainer:
    'border-pink-300 bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
  Produksi:
    'border-blue-300 bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
};

const STATUS_BADGE_CLASSES: Record<ProblemStatus, string> = {
  'Belum Proses': 'border-danger/40 bg-danger/15 text-red-700',
  'Dalam Proses':
    'border-warning/40 bg-warning/15 text-amber-700 dark:text-warning',
  'Finish Proses':
    'border-success/40 bg-success/15 text-emerald-700 dark:text-success',
};

function StatusBadge({ status }: { status: ProblemStatus }) {
  return (
    <Badge className={STATUS_BADGE_CLASSES[status]}>
      {status === 'Belum Proses' ? (
        <CircleDashedIcon data-icon="inline-start" />
      ) : status === 'Dalam Proses' ? (
        <LoaderCircleIcon data-icon="inline-start" />
      ) : (
        <CircleCheckIcon data-icon="inline-start" />
      )}
      {status}
    </Badge>
  );
}

function PicBadge({ pic }: { pic: ProblemPIC }) {
  return (
    <Badge className={PIC_BADGE_CLASSES[pic]}>
      {pic === 'Produksi' ? (
        <PackageIcon data-icon="inline-start" />
      ) : pic === 'MT' ? (
        <WrenchIcon data-icon="inline-start" />
      ) : pic === 'Trainer' ? (
        <UserCog2Icon data-icon="inline-start" />
      ) : (
        <BadgeCheckIcon data-icon="inline-start" />
      )}
      {pic}
    </Badge>
  );
}

type ProblemContentProps = {
  filter?: GetDataFilter;
};

export default function ProblemContent({ filter }: ProblemContentProps) {
  const {
    data: problemData = [],
    isPending,
    isFetching,
    error,
    refetch,
  } = useGetProblems(filter);
  const notStartedCount = problemData.filter(
    (problem) => problem.status === 'Belum Proses',
  ).length;
  const inProgressCount = problemData.filter(
    (problem) => problem.status === 'Dalam Proses',
  ).length;
  const finishedCount = problemData.filter(
    (problem) => problem.status === 'Finish Proses',
  ).length;

  return (
    <Card size="sm" className="shadow-lg">
      <CardHeader className="items-center">
        <CardTitle className="font-bold group-data-[size=sm]/card:text-xl">
          Daftar Problem
        </CardTitle>
        <CardAction className="flex flex-wrap items-center justify-end gap-1.5 self-center">
          <Badge className={STATUS_BADGE_CLASSES['Belum Proses']}>
            <CircleDashedIcon data-icon="inline-start" />
            Belum Proses:
            <span className="tabular-nums">{notStartedCount}</span>
          </Badge>
          <Badge className={STATUS_BADGE_CLASSES['Dalam Proses']}>
            <LoaderCircleIcon data-icon="inline-start" />
            Dalam Proses:
            <span className="tabular-nums">{inProgressCount}</span>
          </Badge>
          <Badge className={STATUS_BADGE_CLASSES['Finish Proses']}>
            <CircleCheckIcon data-icon="inline-start" />
            Finish Proses:
            <span className="tabular-nums">{finishedCount}</span>
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="max-h-120 w-full overflow-auto rounded-lg border **:data-[slot=table-container]:overflow-visible">
          <Table className="min-w-150">
            <TableHeader className="sticky top-0 z-10 bg-sky-100">
              <TableRow>
                <TableHead className="w-36 text-center font-bold">
                  Timestamp
                </TableHead>
                <TableHead className="w-16 text-center font-bold">
                  Line
                </TableHead>
                <TableHead className="min-w-48 text-center font-bold">
                  Problem
                </TableHead>
                <TableHead className="w-28 text-center font-bold">
                  PIC
                </TableHead>
                <TableHead className="w-36 text-center font-bold">
                  Status
                </TableHead>
                <TableHead className="w-36 text-center font-bold">
                  Start
                </TableHead>
                <TableHead className="w-36 text-center font-bold">
                  Finish
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isPending ? (
                Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-transparent">
                    {Array.from({ length: COLUMN_COUNT }, (_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMN_COUNT} className="p-0">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia
                          variant="icon"
                          className="bg-destructive/10 text-destructive"
                        >
                          <TriangleAlertIcon />
                        </EmptyMedia>
                        <EmptyTitle>Terjadi kesalahan!</EmptyTitle>
                        <EmptyDescription>{error.message}</EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                          disabled={isFetching}
                        >
                          <RefreshCwIcon
                            className={cn(isFetching && 'animate-spin')}
                            data-icon="inline-start"
                          />
                          Coba lagi
                        </Button>
                      </EmptyContent>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : problemData.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMN_COUNT} className="p-0">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia
                          variant="icon"
                          className="bg-success/10 text-emerald-600 dark:text-success"
                        >
                          <CircleCheckIcon />
                        </EmptyMedia>
                        <EmptyTitle>Tidak ada data problem</EmptyTitle>
                        <EmptyDescription>
                          Belum ada problem yang perlu ditangani.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                problemData.map((problem) => (
                  <TableRow key={problem.id} className="even:bg-muted/40">
                    <TableCell className="text-center tabular-nums">
                      {problem.timestamp}
                    </TableCell>
                    <TableCell className="font-semibold text-center">
                      {problem.line}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {problem.problem}
                    </TableCell>
                    <TableCell className="text-center">
                      <PicBadge pic={problem.pic} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={problem.status} />
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {problem.start}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {problem.finish}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
