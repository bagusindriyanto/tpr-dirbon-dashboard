export default function AppLegend() {
  return (
    <div className="flex flex-wrap p-2 gap-y-1 gap-x-2 justify-around xl:justify-between">
      <div className="flex flex-col xl:flex-row gap-x-5">
        <div className="flex items-center">
          <span className="font-semibold text-xl">Downtime:</span>
        </div>
        <div className="flex flex-col xl:flex-row gap-x-4">
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-produksi rounded-sm"></span>
            <span>Produksi</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-mt rounded-sm"></span>
            <span>MT</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-trainer rounded-sm"></span>
            <span>Trainer</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-qc rounded-sm"></span>
            <span>QC</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-x-5">
        <div className="flex items-center">
          <span className="font-semibold text-xl">Performance:</span>
        </div>
        <div className="flex flex-col xl:flex-row gap-x-4">
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-danger rounded-sm"></span>
            <span>under 80%</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-warning rounded-sm"></span>
            <span>80%-90%</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-success rounded-sm"></span>
            <span>90%-100%</span>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="inline-block size-4 md:size-5 shrink-0 bg-info rounded-sm"></span>
            <span>over 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
