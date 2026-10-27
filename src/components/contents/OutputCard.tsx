import type { Output } from '@/types/output';
// import { cn } from '@/lib/utils';

const percentFormat = (value: number) => {
  return new Intl.NumberFormat('id', {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(value);
};

// const decimalFormat = (value: number) => {
//   return new Intl.NumberFormat('id', {
//     maximumFractionDigits: 2,
//   }).format(value);
// };

// const performanceClass = (item: Output) => {
//   const eff = item.eff === '' ? null : item.eff;
//   return {
//     'bg-white text-white': eff === null || !item.style,
//     'bg-red-600 text-white': eff !== null && eff < 0.75 && item.style,
//     'bg-yellow-400 text-black':
//       eff !== null && eff >= 0.75 && eff < 0.9 && item.style,
//     'bg-green-600 text-white':
//       eff !== null && eff >= 0.9 && eff <= 1 && item.style,
//     'bg-blue-600 text-white': eff !== null && eff > 1 && item.style,
//   };
// };

// const outputClass = (
//   output: Output['outputs'][number],
//   targetPA: Output['targetPA'],
//   style: Output['style'],
// ) => {
//   const eff = output === '' ? null : (output / targetPA) * 100;
//   return cn('flex justify-center items-center text-xs min-h-4', {
//     'bg-white text-white': eff === null || !style,
//     'bg-red-600 text-white': eff !== null && eff < 75 && style,
//     'bg-yellow-400 text-black': eff !== null && eff >= 75 && eff < 90 && style,
//     'bg-green-600 text-white': eff !== null && eff >= 90 && eff <= 100 && style,
//     'bg-blue-600 text-white': eff !== null && eff > 100 && style,
//   });
// };

// const balanceClass = (item: Output) => {
//   return cn('p-1 flex items-center', {
//     'bg-white text-white': !item.style,
//     'bg-white': (item.balance === 0 || item.balance === '') && item.style,
//     'bg-rose-600 text-white':
//       item.balance !== '' && item.balance < 0 && item.style,
//     'bg-emerald-600 text-white':
//       item.balance !== '' && item.balance > 0 && item.style,
//   });
// };

type OutputCardProps = {
  item: Output;
};

export default function OutputCard({ item }: OutputCardProps) {
  return (
    <article className="bg-card relative grid grid-cols-10 grid-rows-subgrid border shadow-sm text-center align-middle row-span-6">
      <header className="contents">
        <div className="col-span-4 flex justify-center items-center gap-1">
          <h2>{item.line}</h2>
          {item.operator && <p>({item.operator})</p>}
        </div>
        <div className="col-span-4 dashboard-cell">
          <p>{percentFormat(item.performance)}</p>
        </div>
        <div className="col-span-2 dashboard-cell">
          <p>Downtime</p>
        </div>
      </header>

      <section className="contents">
        <div className="col-span-8 row-span-2 dashboard-cell">
          <p>{item.style}</p>
        </div>
        <div className="col-span-2 row-span-2 grid grid-cols-2 gap-px 2xl:gap-0.5">
          <div className="bg-card relative">
            {item.mt > 0 && (
              <div className="bg-mt absolute inset-0 animate-blink"></div>
            )}
          </div>
          <div className="bg-card relative">
            {item.qc > 0 && (
              <div className="bg-qc absolute inset-0 animate-blink"></div>
            )}
          </div>
          <div className="bg-card relative">
            {item.trainer > 0 && (
              <div className="bg-trainer absolute inset-0 animate-blink"></div>
            )}
          </div>
          <div className="bg-card relative">
            {item.produksi > 0 && (
              <div className="bg-produksi absolute inset-0 animate-blink"></div>
            )}
          </div>
        </div>
      </section>

      <dl className="contents">
        {item.outputs.map((output, hour) => (
          <dd
            className="dashboard-output text-sm font-medium"
            // x-text="$format.valueFormat(output)"
          >
            {output}
          </dd>
        ))}
      </dl>

      <footer className="contents">
        <div className="col-span-5 dashboard-cell">Target</div>
        <div className="col-span-5 dashboard-cell">Man Power</div>
        <div className="col-span-5 dashboard-cell">Repair</div>
        <div className="col-span-5 dashboard-cell">Note</div>
      </footer>
    </article>
  );
}
