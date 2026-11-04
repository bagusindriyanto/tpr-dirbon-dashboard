import { useGetOutstandings } from '@/api/getOutstandings';
import type { Outstanding } from '@/types/outstanding';
import type { Tab } from '@/types/tab';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import type { GasResult } from '../../../shared/contracts';
import { cn } from '@/lib/utils';

const EMPTY_OUTSTANDING: GasResult<Outstanding> = {
  tpr: [],
  dirbon: [],
};

const SECTIONS = [
  { value: 'tpr', label: 'TPR' },
  { value: 'dirbon', label: 'Dirbon' },
] as const satisfies { value: Tab; label: string }[];

const SKELETON_ROWS = 2;
const COLUMN_COUNT = 4;

const numberFormat = new Intl.NumberFormat('id');

function OutstandingTable({
  label,
  items,
  isPending,
}: {
  label: string;
  items: Outstanding[];
  isPending: boolean;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-px flex-1 bg-border" />
        <h3 className="text-[11px] font-bold uppercase tracking-wide">
          {label}
        </h3>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-7 w-20 px-2 text-[11px] font-semibold">
                Tanggal
              </TableHead>
              <TableHead className="h-7 px-2 text-[11px] font-semibold">
                Style
              </TableHead>
              <TableHead className="h-7 w-14 px-2 text-center text-[11px] font-semibold">
                SPO
              </TableHead>
              <TableHead className="h-7 w-10 px-2 text-right text-[11px] font-semibold">
                Qty
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
              Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                  {Array.from({ length: COLUMN_COUNT }, (_, cellIndex) => (
                    <TableCell key={cellIndex} className="px-2 py-1.5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="h-10 text-center text-xs text-muted-foreground"
                >
                  Tidak ada outstanding.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.spo} className="even:bg-muted/40">
                  <TableCell className="px-2 py-1.5 text-xs tabular-nums">
                    {item.date}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'truncate px-2 py-1.5 text-xs',
                      item.style === 'Loading...' && 'shimmer',
                    )}
                    title={item.style}
                  >
                    {item.style}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'px-2 py-1.5 text-center text-xs',
                      item.spo === 'Loading...' && 'shimmer',
                    )}
                  >
                    {item.spo}
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right text-xs font-semibold tabular-nums">
                    {numberFormat.format(item.qty)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default function KanbanAside() {
  const { data = EMPTY_OUTSTANDING, isPending } = useGetOutstandings();
  const totalOutstanding = SECTIONS.reduce(
    (total, section) =>
      total + data[section.value].reduce((sum, item) => sum + item.qty, 0),
    0,
  );

  return (
    <aside aria-label="Kanban System" className="min-w-0 xl:sticky xl:top-6">
      <Card size="sm" className="gap-0 shadow-sm">
        <CardHeader className="border-b pb-2">
          <CardTitle className="font-bold group-data-[size=sm]/card:text-base">
            Kanban System
          </CardTitle>
        </CardHeader>

        <CardContent className="gap-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">
              Outstanding Planning Distribusi
            </p>
            <Badge variant="outline" className="shrink-0 whitespace-nowrap">
              Total Outstanding: {numberFormat.format(totalOutstanding)} pcs
            </Badge>
          </div>

          {SECTIONS.map((section) => (
            <OutstandingTable
              key={section.value}
              label={section.label}
              items={data[section.value]}
              isPending={isPending}
            />
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
