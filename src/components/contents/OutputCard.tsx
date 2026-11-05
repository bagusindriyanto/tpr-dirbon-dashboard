import type { Output } from '@/types/output';
import { cn } from '@/lib/utils';
import { PRODUCTION_HOURS } from '@/lib/shift';
import { AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react';
import { useMemo } from 'react';

const percentFormat = new Intl.NumberFormat('id', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const numberFormat = new Intl.NumberFormat('id', {
  maximumFractionDigits: 2,
});

const HOURS = Array.from({ length: PRODUCTION_HOURS }, (_, index) => index + 1);

const TONES = {
  none: {
    accent: 'bg-muted-foreground/30',
    solid: 'bg-muted text-muted',
    text: 'text-muted-foreground',
    bar: 'bg-muted-foreground/40',
    cell: 'border-border bg-muted/40',
  },
  danger: {
    accent: 'bg-danger',
    solid: 'bg-danger text-danger-foreground',
    text: 'text-red-600 dark:text-danger',
    bar: 'bg-danger',
    cell: 'border-danger/30 bg-danger/10',
  },
  warning: {
    accent: 'bg-warning',
    solid: 'bg-warning text-zinc-950',
    text: 'text-amber-600 dark:text-warning',
    bar: 'bg-warning',
    cell: 'border-warning/40 bg-warning/15',
  },
  success: {
    accent: 'bg-success',
    solid: 'bg-success text-success-foreground',
    text: 'text-emerald-600 dark:text-success',
    bar: 'bg-success',
    cell: 'border-success/30 bg-success/10',
  },
  info: {
    accent: 'bg-info',
    solid: 'bg-info text-info-foreground',
    text: 'text-sky-600 dark:text-info',
    bar: 'bg-info',
    cell: 'border-info/30 bg-info/10',
  },
} as const;

type Tone = (typeof TONES)[keyof typeof TONES];

function performanceTone(performance: number): Tone {
  if (!Number.isFinite(performance)) return TONES.none;
  if (performance < 0.8) return TONES.danger;
  if (performance < 0.9) return TONES.warning;
  if (performance <= 1) return TONES.success;
  return TONES.info;
}

function outputTone(output: number, target: number): Tone {
  if (!Number.isFinite(output) || output <= 0 || target <= 0) {
    return output <= 0 ? TONES.danger : TONES.none;
  }

  if (output < target) return TONES.danger;
  return TONES.success;
}

type DowntimeKey = 'mt' | 'qc' | 'trainer' | 'produksi';

const DOWNTIME_FLAGS: {
  key: DowntimeKey;
  label: string;
  background: string;
  foreground: string;
}[] = [
  { key: 'mt', label: 'MT', background: 'bg-mt', foreground: 'text-white' },
  { key: 'qc', label: 'QC', background: 'bg-qc', foreground: 'text-zinc-950' },
  {
    key: 'trainer',
    label: 'Trainer',
    background: 'bg-trainer',
    foreground: 'text-zinc-950',
  },
  {
    key: 'produksi',
    label: 'Produksi',
    background: 'bg-produksi',
    foreground: 'text-white',
  },
];

type OutputCardProps = {
  item: Output;
  tick?: number;
};

function Kpi({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 bg-card">
      <dt className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd
        key={value}
        className={cn(
          'text-xs font-bold leading-none tabular-nums animate-in fade-in duration-300 ease-in-out',
          className,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default function OutputCard({ item, tick = 0 }: OutputCardProps) {
  const hasPerformance = Number.isFinite(item.performance);
  const tone = performanceTone(item.performance);

  const activeIndex = item.data.length > 0 ? tick % item.data.length : -1;
  const activeRun = activeIndex >= 0 ? item.data[activeIndex] : undefined;
  const balance = (activeRun?.totalOutput ?? 0) - (activeRun?.totalTarget ?? 0);

  const runByHour = useMemo(() => {
    const map = new Map<number, number>();
    item.data.forEach((run, index) => {
      for (let hour = run.startHour; hour <= run.endHour; hour++) {
        map.set(hour, index);
      }
    });
    return map;
  }, [item.data]);

  return (
    <article className="grid h-full w-full min-w-0 overflow-hidden rounded-lg border border-border bg-border text-card-foreground shadow-sm grid-rows-subgrid row-span-7 grid-cols-10 gap-px">
      <header className="contents">
        <div className="bg-card col-span-2 p-2 flex flex-col items-center justify-center gap-1">
          <h2 className="text-2xl font-black leading-none tracking-tight">
            {item.line}
          </h2>
          {activeRun?.operator && (
            <span
              key={activeRun.operator}
              className="max-w-full truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground animate-in fade-in duration-300"
              title={activeRun.operator}
            >
              {activeRun.operator}
            </span>
          )}
        </div>

        <div className="flex flex-col bg-card col-span-6 items-center justify-center p-2 min-w-0">
          <div
            key={activeRun?.style ?? activeIndex}
            className="flex flex-col items-center justify-center w-full animate-in fade-in duration-300"
          >
            <p
              className="line-clamp-2 text-center font-bold leading-tight max-w-full"
              title={activeRun?.style ?? 'Tidak ada style aktif'}
            >
              {activeRun?.style ?? 'Tidak ada style aktif'}
            </p>
            <p
              className="text-xs text-center text-muted-foreground truncate max-w-full"
              title={activeRun?.parts ?? 'Tidak ada part'}
            >
              {activeRun?.parts ? `(${activeRun.parts})` : 'Tidak ada part'}
            </p>
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-2 grid-rows-[auto_1fr_1fr] gap-px min-h-14">
          <div className="bg-card col-span-2 text-center p-0.5">
            <p className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">
              Downtime
            </p>
          </div>
          {DOWNTIME_FLAGS.map((flag) => {
            const active = item[flag.key] > 0;
            return (
              <div key={flag.key} className="bg-card relative">
                {active && (
                  <div
                    className={cn(
                      'absolute inset-0 animate-blink',
                      flag.background,
                      flag.foreground,
                    )}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </header>

      <section
        className="contents"
        title="Performance seluruh style di line ini"
      >
        <div className={cn('col-span-2 dashboard-cell', tone.solid)}>
          <span className="font-bold leading-none tabular-nums">
            {hasPerformance ? percentFormat.format(item.performance) : '–'}
          </span>
        </div>
        <div className={cn('col-span-8 dashboard-cell', tone.solid)}>
          <span
            key={
              activeRun ? `${activeRun.style}-${activeRun.totalOutput}` : 'none'
            }
            className="text-2xl font-black leading-none tabular-nums animate-in fade-in zoom-in-95 duration-300"
          >
            {activeRun ? numberFormat.format(activeRun.totalOutput) : '–'}
          </span>
        </div>

        <dl
          className="contents"
          aria-label={`Output per jam line ${item.line}`}
        >
          {HOURS.map((hour) => {
            const runIndex = runByHour.get(hour);
            const run =
              runIndex !== undefined ? item.data[runIndex] : undefined;
            const isActive = runIndex === activeIndex;
            const output =
              run?.hours.find((entry) => entry.hour === hour)?.output ?? 0;
            const hourTone = run
              ? outputTone(output, run.hourlyTarget)
              : TONES.none;

            return (
              <dd
                key={hour}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-end gap-1 px-0.5 pb-1 pt-1.5 transition-all duration-500 ease-in-out',
                  hourTone.solid,
                  run && !isActive && 'grayscale opacity-40',
                )}
                title={
                  run
                    ? `Jam ke-${hour}: ${numberFormat.format(output)} pcs · ${run.style}`
                    : `Jam ke-${hour}: tidak ada style`
                }
              >
                <span className="text-xs font-semibold leading-none tabular-nums sm:text-sm">
                  {run ? numberFormat.format(output) : '–'}
                </span>
              </dd>
            );
          })}
        </dl>
      </section>

      <dl className="col-span-10 grid grid-cols-3 bg-border gap-px">
        <Kpi
          label="Target/jam"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.hourlyTarget)} pcs`
              : '–'
          }
        />
        <Kpi
          label="Target"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.totalTarget)} pcs`
              : '–'
          }
        />
        <Kpi
          label="Balance"
          value={
            activeRun
              ? `${balance > 0 ? '+' : ''}${numberFormat.format(balance)} pcs`
              : '–'
          }
          className={
            activeRun
              ? balance >= 0
                ? 'text-emerald-600 dark:text-success'
                : 'text-red-600 dark:text-danger'
              : 'text-muted-foreground'
          }
        />
      </dl>

      <dl className="col-span-10 grid grid-cols-3 bg-border gap-px">
        <Kpi
          label="Man Power"
          value={
            activeRun ? `${numberFormat.format(activeRun.manPower)} org` : '–'
          }
        />
        <Kpi
          label="Jam Kerja"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.workingHour)} jam`
              : '–'
          }
        />
        <Kpi
          label="Jam Orang"
          value={
            activeRun ? `${numberFormat.format(activeRun.manHour)} jam` : '–'
          }
        />
      </dl>

      <dl className="col-span-10 grid grid-cols-3 bg-border gap-px">
        <Kpi
          label="WIP"
          value={activeRun ? `${numberFormat.format(activeRun.wip)} pcs` : '–'}
        />
        <Kpi
          label="Repair"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.totalRepair)} pcs`
              : '–'
          }
        />
        <Kpi
          label="Reject"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.totalReject)} pcs`
              : '–'
          }
        />
      </dl>

      <div className="col-span-10 flex min-h-8 items-start gap-1.5 bg-card px-3 py-1.5">
        {item.problems?.length > 0 ? (
          <>
            <AlertTriangleIcon
              className="mt-px size-3 shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <ul className="list-disc list-inside">
              {item.problems.map((problem) => (
                <li
                  key={problem}
                  className="line-clamp-2 text-[11px] font-medium leading-tight text-muted-foreground"
                >
                  - {problem}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <CheckCircle2Icon
              className="mt-px size-3 shrink-0 text-emerald-500"
              aria-hidden="true"
            />
            <p className="text-[11px] font-medium leading-tight text-muted-foreground">
              Tidak ada kendala
            </p>
          </>
        )}
      </div>
    </article>
  );
}
