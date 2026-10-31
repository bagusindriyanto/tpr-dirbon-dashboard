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
  manPower: number;
  workingHour: number;
  manHour: number;
  performance: number;
  outputs: number[];
  produksi: number;
  mt: number;
  trainer: number;
  qc: number;
  problems: string[];
};

export type Problem = {
  timestamp: string;
  line: string;
  problem: string;
  pic: ProblemPIC;
  status: ProblemStatus;
  start: string;
  finish: string;
  timestampTime: number;
  id: number;
};

export type Section = 'tpr' | 'dirbon';
export type ProblemPIC = 'MT' | 'Produksi' | 'Trainer' | 'QC';
export type ProblemStatus = 'Belum Proses' | 'Dalam Proses' | 'Finish Proses';

export type GasResult<TData> = Record<Section, TData[]>;

export type GasFunctions = {
  getOutputs: () => GasResult<Output>;
  getProblems: () => Problem[];
};
