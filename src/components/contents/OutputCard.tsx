import type { Output } from '@/types/output';
import { cn } from '@/lib/utils';
import { isWithinShift, PRODUCTION_HOURS, SHIFT_LABEL } from '@/lib/shift';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  PackageIcon,
  ShieldXIcon,
  UsersIcon,
  WrenchIcon,
  type LucideIcon,
} from 'lucide-react';

const percentFormat = new Intl.NumberFormat('id', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const numberFormat = new Intl.NumberFormat('id', {
  maximumFractionDigits: 2,
});

const TONES = {
  none: {
    accent: 'bg-muted-foreground/30',
    solid: 'bg-muted text-muted-foreground',
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

  const ratio = output / target;

  if (ratio < 0.8) return TONES.danger;
  if (ratio < 0.9) return TONES.warning;
  if (ratio <= 1) return TONES.success;
  return TONES.info;
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
    <div className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn('text-sm font-bold leading-none tabular-nums', className)}
      >
        {value}
      </dd>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5">
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-xs font-bold leading-none tabular-nums">{value}</dd>
    </div>
  );
}

export default function OutputCard({ item, tick = 0 }: OutputCardProps) {
  const hasPerformance = Number.isFinite(item.performance);
  const tone = performanceTone(item.performance);
  const latestHour = item.data.reduce(
    (max, run) => Math.max(max, run.endHour),
    0,
  );
  const latestRunIndex = item.data.findIndex(
    (run) => latestHour >= run.startHour && latestHour <= run.endHour,
  );
  const activeIndex = isWithinShift(item.shift)
    ? latestRunIndex
    : item.data.length > 0
      ? tick % item.data.length
      : -1;
  const activeRun = activeIndex >= 0 ? item.data[activeIndex] : undefined;
  const balance = (activeRun?.totalOutput ?? 0) - (activeRun?.totalTarget ?? 0);
  const runByHour = new Map<number, number>();

  item.data.forEach((run, index) => {
    for (let hour = run.startHour; hour <= run.endHour; hour++) {
      runByHour.set(hour, index);
    }
  });

  const hours = Array.from(
    { length: PRODUCTION_HOURS },
    (_, index) => index + 1,
  );

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <div
        className={cn('h-1 w-full shrink-0', tone.accent)}
        aria-hidden="true"
      />

      <header className="flex items-start gap-3 px-3 pb-2 pt-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-2xl font-black leading-none tracking-tight">
              {item.line}
            </h2>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
              S{item.shift} · {SHIFT_LABEL[item.shift]}
            </span>
            {activeRun?.operator && (
              <span className="max-w-28 truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {activeRun.operator}
              </span>
            )}
          </div>
          <p
            className="mt-1.5 truncate text-sm font-semibold leading-tight"
            title={activeRun?.style ?? 'Tidak ada style aktif'}
          >
            {activeRun?.style ?? 'Tidak ada style aktif'}
          </p>
        </div>

        <div
          className={cn(
            'flex w-24 shrink-0 flex-col items-center justify-center rounded-lg px-2 py-1.5',
            tone.solid,
          )}
          title="Performance seluruh style di line ini"
        >
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-75">
            Performance
          </span>
          <span className="text-2xl font-black leading-none tabular-nums">
            {hasPerformance ? percentFormat.format(item.performance) : '–'}
          </span>
        </div>
      </header>

      <section
        className="px-3 pb-2"
        aria-label={`Output per jam line ${item.line}`}
      >
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Output / Jam
          </h3>
          <p className="truncate text-[10px] font-medium text-muted-foreground">
            {activeRun
              ? `Target ${numberFormat.format(activeRun.hourlyTarget)} pcs/jam`
              : 'Tidak ada style aktif'}
          </p>
        </div>

        <div className="mb-1 flex flex-wrap gap-0.5 sm:gap-1">
          {item.data.map((run, index) => {
            const isActive = index === activeIndex;

            return (
              <span
                key={run.id}
                className={cn(
                  'inline-flex min-w-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                  isActive
                    ? cn('border-transparent', performanceTone(run.performance).solid)
                    : 'border-border bg-muted text-muted-foreground grayscale opacity-70',
                )}
                title={`${run.style} · Jam ${run.startHour}–${run.endHour} · ${percentFormat.format(run.performance)}`}
              >
                <span className="max-w-24 truncate">{run.style}</span>
                <span className="shrink-0 tabular-nums opacity-75">
                  {run.startHour}–{run.endHour}
                </span>
              </span>
            );
          })}
        </div>

        <div
          className="mb-1 grid grid-cols-10 gap-0.5 sm:gap-1"
          aria-hidden="true"
        >
          {item.data.map((run, index) => (
            <div
              key={run.id}
              style={{ gridColumn: `${run.startHour} / ${run.endHour + 1}` }}
              className={cn(
                'h-1 rounded-full',
                index === activeIndex
                  ? performanceTone(run.performance).accent
                  : 'bg-muted-foreground/20',
              )}
            />
          ))}
        </div>

        <ol className="grid grid-cols-10 gap-0.5 sm:gap-1">
          {hours.map((hour) => {
            const runIndex = runByHour.get(hour);
            const run = runIndex !== undefined ? item.data[runIndex] : undefined;
            const isActive = runIndex === activeIndex;
            const output = run?.hours.find((entry) => entry.hour === hour)?.output ?? 0;
            const hourTone = run ? outputTone(output, run.hourlyTarget) : TONES.none;
            const ratio =
              run && run.hourlyTarget > 0
                ? Math.min(output / run.hourlyTarget, 1)
                : 0;

            return (
              <li
                key={hour}
                className={cn(
                  'relative flex min-w-0 flex-col items-center justify-end gap-1 overflow-hidden rounded-md border px-0.5 pb-1 pt-1.5',
                  hourTone.cell,
                  run && !isActive && 'grayscale opacity-60',
                )}
                title={
                  run
                    ? `Jam ke-${hour}: ${numberFormat.format(output)} pcs · ${run.style}`
                    : `Jam ke-${hour}: tidak ada style`
                }
              >
                <span
                  className={cn(
                    'text-xs font-bold leading-none tabular-nums sm:text-sm',
                    hourTone.text,
                  )}
                >
                  {run ? numberFormat.format(output) : '–'}
                </span>
                <span className="h-1 w-full overflow-hidden rounded-full bg-border">
                  <span
                    className={cn('block h-full rounded-full', hourTone.bar)}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </span>
                <span className="text-[9px] font-semibold leading-none text-muted-foreground">
                  {hour}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <dl className="grid grid-cols-3 divide-x divide-border border-y bg-muted/20">
        <Kpi
          label="Target"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.totalTarget)} pcs`
              : '–'
          }
        />
        <Kpi
          label="Actual"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.totalOutput)} pcs`
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

      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-1.5">
        <span className="mr-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Downtime
        </span>
        {DOWNTIME_FLAGS.map((flag) => {
          const active = item[flag.key] > 0;

          return (
            <span
              key={flag.key}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                active
                  ? cn(flag.background, flag.foreground)
                  : 'bg-muted text-muted-foreground/60',
              )}
            >
              {active && (
                <span
                  className="size-1.5 shrink-0 animate-blink rounded-full bg-current"
                  aria-hidden="true"
                />
              )}
              <span>{flag.label}</span>
            </span>
          );
        })}
      </div>

      <dl className="mt-auto grid grid-cols-4 divide-x divide-border">
        <Meta
          icon={UsersIcon}
          label="Man Power"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.manPower)} org`
              : '–'
          }
        />
        <Meta
          icon={PackageIcon}
          label="WIP"
          value={activeRun ? `${numberFormat.format(activeRun.wip)} pcs` : '–'}
        />
        <Meta
          icon={WrenchIcon}
          label="Repair"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.totalRepair)} pcs`
              : '–'
          }
        />
        <Meta
          icon={ShieldXIcon}
          label="Reject"
          value={
            activeRun
              ? `${numberFormat.format(activeRun.totalReject)} pcs`
              : '–'
          }
        />
      </dl>

      <div className="flex min-h-8 items-start gap-1.5 border-t bg-muted/30 px-3 py-1.5">
        {item.problems?.length > 0 ? (
          <>
            <AlertTriangleIcon
              className="mt-px size-3 shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <p className="line-clamp-2 text-[11px] font-medium leading-tight text-muted-foreground">
              {item.problems.join(' · ')}
            </p>
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
