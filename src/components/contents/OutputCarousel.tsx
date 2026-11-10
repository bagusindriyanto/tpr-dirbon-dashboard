import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Output } from '@/types/output';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import OutputCard from './OutputCard';

const AUTO_ROTATE_MS = 20_000;
const LARGE_PAGE_SIZE = 12;
const LARGE_AUTO_ROTATE_MS = 25_000;
const DEFAULT_PAGE_SIZE = 8;

// Plafon lebar grid saat line yang tampil sedikit, agar card tidak melar.
const SPARSE_WIDTH: Record<number, string> = {
  1: 'max-w-md',
  2: 'max-w-3xl',
  3: 'max-w-5xl',
};

function getPageSize(): number {
  if (typeof window === 'undefined') return DEFAULT_PAGE_SIZE;

  // Prioritaskan tinggi layar agar card tidak perlu di-scroll di TV.
  if (window.innerHeight >= 1200) return LARGE_PAGE_SIZE;
  if (window.innerHeight >= 900 && window.innerWidth >= 1280) {
    return DEFAULT_PAGE_SIZE;
  }
  if (window.innerWidth >= 768) return 6;
  return 4;
}

function usePageSize(): number {
  const [pageSize, setPageSize] = useState(getPageSize);

  useEffect(() => {
    const updatePageSize = () => setPageSize(getPageSize());

    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  return pageSize;
}

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }

  return pages;
}

type OutputCarouselProps = {
  items: Output[];
  label: string;
  tick?: number;
};

export default function OutputCarousel({
  items,
  label,
  tick = 0,
}: OutputCarouselProps) {
  const pageSize = usePageSize();
  const pages = useMemo(() => chunk(items, pageSize), [items, pageSize]);
  const pageCount = pages.length;
  const [page, setPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const pageItems = pages[safePage] ?? [];
  const sparseWidth = SPARSE_WIDTH[pageItems.length] ?? '';

  useEffect(() => {
    if (pageCount <= 1 || isPaused) return;

    const interval = window.setInterval(
      () => {
        if (document.visibilityState !== 'visible') return;
        setPage((current) => (current + 1) % pageCount);
      },
      pageSize >= LARGE_PAGE_SIZE ? LARGE_AUTO_ROTATE_MS : AUTO_ROTATE_MS,
    );

    return () => window.clearInterval(interval);
  }, [isPaused, pageCount, pageSize, safePage]);

  const goToPage = (nextPage: number) => {
    if (pageCount <= 1) return;
    setPage((nextPage + pageCount) % pageCount);
  };

  return (
    <section
      aria-label={`${label} carousel`}
      aria-roledescription="carousel"
      className="min-w-0 border rounded-lg p-1 bg-zinc-50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => goToPage(safePage - 1)}
              aria-label={`Halaman ${label} sebelumnya`}
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
              aria-label={`Halaman ${label} berikutnya`}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToPage(index)}
                aria-label={`Ke halaman ${index + 1} ${label}`}
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

      <div
        key={safePage}
        className={cn(
          'output-grid grid min-w-0 gap-2 animate-in fade-in duration-300 sm:gap-3',
          sparseWidth && `mx-auto w-full ${sparseWidth}`,
        )}
      >
        {pageItems.map((item) => (
          <OutputCard key={item.line} item={item} tick={tick} />
        ))}
      </div>
    </section>
  );
}
