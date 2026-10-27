export type Output = {
  line: string;
  style: string;
  operator: string;
  wip: number;
  hourlyTarget: number;
  totalTarget: number;
  totalOutput: number;
  repair: number;
  reject: number;
  mp: number;
  jk: number;
  jo: number;
  perf: number;
  outputs: number[];
  produksi: number;
  mt: number;
  trainer: number;
  qc: number;
  problems: string[];
};

export type Section = 'tpr' | 'dirbon';

export type GasResult<TData> = Record<Section, TData[]>;

export type GasFunctions = {
  getOutputs: () => GasResult<Output>;
};
