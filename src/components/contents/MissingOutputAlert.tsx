import { useGetOutputs } from '@/api/getOutputs';
import { findMissingOutputs } from '@/lib/missingOutput';
import { cn } from '@/lib/utils';
import type { GetDataFilter, Shift } from '@/types/output';
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const CLOCK_TICK_MS = 15_000;
const AUTO_ROTATE_MS = 15_000;
const LIVE_REFETCH_MS = 30_000;

const SHIFT_NAME = {
  '1': 'Pagi',
  '2': 'Malam',
} as const;

type MissingOutputAlertProps = {
  filter?: GetDataFilter;
};

type AlertItem = {
  section: 'tpr' | 'dirbon';
  line: string;
  shift: Shift;
  style: string;
  hours: number[];
};

type AlertGroup = {
  key: string;
  section: AlertItem['section'];
  line: string;
  shift: Shift;
  styles: { style: string; hours: number[] }[];
};

function itemKey(item: Pick<AlertItem, 'section' | 'line' | 'shift'>) {
  return `${item.section}|${item.line}|${item.shift}`;
}

function getDialogPageSize(): number {
  if (typeof window === 'undefined') return 4;

  if (window.innerHeight >= 1200) return 6;
  if (window.innerHeight >= 900) return 4;
  if (window.innerHeight >= 700) return 3;
  return 2;
}

function useDialogPageSize(): number {
  const [pageSize, setPageSize] = useState(getDialogPageSize);

  useEffect(() => {
    const updatePageSize = () => setPageSize(getDialogPageSize());

    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  return pageSize;
}

function groupItems(items: AlertItem[]): AlertGroup[] {
  const groups: AlertGroup[] = [];

  for (const item of items) {
    const key = itemKey(item);
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.styles.push({ style: item.style, hours: item.hours });
      continue;
    }

    groups.push({
      key,
      section: item.section,
      line: item.line,
      shift: item.shift,
      styles: [{ style: item.style, hours: item.hours }],
    });
  }

  return groups;
}

export default function MissingOutputAlert({
  filter,
}: MissingOutputAlertProps) {
  const isLive = !filter?.date && !filter?.shift;
  const refetchInterval = isLive ? LIVE_REFETCH_MS : undefined;
  const tpr = useGetOutputs('tpr', filter, { refetchInterval });
  const dirbon = useGetOutputs('dirbon', filter, { refetchInterval });
  const [now, setNow] = useState(() => new Date());
  const pageSize = useDialogPageSize();
  const [page, setPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, CLOCK_TICK_MS);

    return () => window.clearInterval(interval);
  }, []);

  // Satu item = satu style pada satu line. Line dengan banyak style dipecah
  // agar tidak memaksa dialog memanjang ke bawah.
  const items = useMemo(() => {
    if (!isLive) return [];

    const missing = [
      ...findMissingOutputs(tpr.data ?? [], 'tpr', now),
      ...findMissingOutputs(dirbon.data ?? [], 'dirbon', now),
    ];

    return missing.flatMap((entry) => {
      const byStyle = new Map<string, number[]>();

      for (const { hour, style } of entry.hours) {
        const hours = byStyle.get(style) ?? [];
        hours.push(hour);
        byStyle.set(style, hours);
      }

      return [...byStyle.entries()].map(
        ([style, hours]): AlertItem => ({
          section: entry.section,
          line: entry.line,
          shift: entry.shift,
          style,
          hours,
        }),
      );
    });
  }, [dirbon.data, isLive, now, tpr.data]);

  const isUnavailable = tpr.isPending || dirbon.isPending;
  const hasError = tpr.isError || dirbon.isError;
  const open = isLive && !isUnavailable && !hasError && items.length > 0;
  const isFetching = tpr.isFetching || dirbon.isFetching;

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = items.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );
  const groups = groupItems(pageItems);
  const continuedKey =
    safePage > 0 && items[safePage * pageSize - 1]
      ? itemKey(items[safePage * pageSize - 1])
      : null;

  const lineCount = new Set(items.map(itemKey)).size;
  const hourCount = items.reduce((sum, item) => sum + item.hours.length, 0);

  useEffect(() => {
    if (!open || pageCount <= 1 || isPaused) return;

    const interval = window.setInterval(() => {
      setPage((value) => (value + 1) % pageCount);
    }, AUTO_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [isPaused, open, pageCount]);

  const goToPage = (nextPage: number) => {
    if (pageCount <= 1) return;
    setPage((nextPage + pageCount) % pageCount);
  };

  const refresh = () => {
    void tpr.refetch();
    void dirbon.refetch();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={() => {
        // Sengaja diabaikan: dialog hanya boleh tertutup saat data sudah diisi.
      }}
    >
      {items.length > 0 && (
        <AlertDialogContent
          className="border-destructive/40"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <AlertTriangleIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Output belum diinput</AlertDialogTitle>
            <AlertDialogDescription>
              {lineCount} line · {hourCount} jam kosong
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto pr-1">
            {groups.map((group) => {
              const isContinued = continuedKey === group.key;

              return (
                <section
                  key={group.key}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5"
                >
                  <header className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-bold leading-none">
                      {group.line}
                    </span>
                    <Badge variant="outline" className="bg-background/60">
                      {group.section.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Shift {SHIFT_NAME[group.shift]}
                    </span>
                    {isContinued && (
                      <span className="text-xs italic text-muted-foreground">
                        (lanjutan)
                      </span>
                    )}
                  </header>

                  <div className="flex flex-col gap-1.5">
                    {group.styles.map((entry) => (
                      <div
                        key={entry.style}
                        className="flex flex-wrap items-center gap-1.5"
                      >
                        <span
                          className="max-w-full truncate text-xs font-semibold"
                          title={entry.style}
                        >
                          {entry.style}
                        </span>
                        {entry.hours.map((hour) => (
                          <Badge key={hour} variant="destructive">
                            Jam ke-{hour}
                          </Badge>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => goToPage(safePage - 1)}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeftIcon />
                </Button>
                <span className="min-w-14 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                  {safePage + 1} / {pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => goToPage(safePage + 1)}
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRightIcon />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {Array.from({ length: pageCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToPage(index)}
                    aria-label={`Ke halaman ${index + 1}`}
                    aria-current={index === safePage ? 'page' : undefined}
                    className="flex size-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={cn(
                        'size-2 rounded-full transition-colors',
                        index === safePage
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/60',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Jam di atas sudah melewati toleransi 15 menit. Popup akan tertutup
            otomatis setelah output diisi.
          </p>

          <AlertDialogFooter>
            <Button variant="outline" onClick={refresh} disabled={isFetching}>
              <RefreshCwIcon
                className={isFetching ? 'animate-spin' : ''}
                data-icon="inline-start"
              />
              Refresh data
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
