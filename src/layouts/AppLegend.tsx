export default function AppLegend() {
  return (
    <div className="flex flex-wrap p-2 gap-y-1 gap-x-2 justify-around xl:justify-between mb-3">
      <div className="flex flex-col xl:flex-row gap-x-5">
        <div className="flex items-center">
          <span className="font-semibold md:text-xl">Downtime:</span>
        </div>
        <div className="flex flex-col xl:flex-row gap-x-4">
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-produksi rounded-sm"></span>
            <span className="text-sm md:text-base">Produksi</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-mt rounded-sm"></span>
            <span className="text-sm md:text-base">MT</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-trainer rounded-sm"></span>
            <span className="text-sm md:text-base">Trainer</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-qc rounded-sm"></span>
            <span className="text-sm md:text-base">QC</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-x-5">
        <div className="flex items-center">
          <span className="font-semibold md:text-xl">Performance:</span>
        </div>
        <div className="flex flex-col xl:flex-row gap-x-4">
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-danger rounded-sm"></span>
            <span className="text-sm md:text-base">under 80%</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-warning rounded-sm"></span>
            <span className="text-sm md:text-base">80%-90%</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-success rounded-sm"></span>
            <span className="text-sm md:text-base">90%-100%</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-info rounded-sm"></span>
            <span className="text-sm md:text-base">over 100%</span>
          </div>
        </div>
      </div>
      {/* <div className="flex flex-col xl:flex-row gap-x-5">
        <div className="flex items-center">
          <span className="font-semibold text-xl">Style:</span>
        </div>
        <div className="flex flex-col xl:flex-row gap-x-4">
          <div className="flex items-center gap-x-2">
            <span
              className="inline-block size-4 md:size-5 shrink-0 rounded-sm"
              style={{
                background:
                  'linear-gradient(135deg, var(--danger), var(--warning), var(--success), var(--info))',
              }}
            ></span>
            <span>Aktif</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-muted-foreground/30 rounded-sm grayscale"></span>
            <span>Nonaktif</span>
          </div>
        </div>
      </div> */}
    </div>
  );
}
