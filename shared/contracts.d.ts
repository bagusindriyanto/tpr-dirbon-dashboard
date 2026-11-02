export type StyleHour = {
  hour: number;
  output: number;
  repair: number;
  reject: number;
};

export type StyleRun = {
  id: string;
  style: string;
  parts: string;
  operator: string;
  startHour: number;
  endHour: number;
  hourlyTarget: number;
  totalTarget: number;
  totalOutput: number;
  totalRepair: number;
  totalReject: number;
  manPower: number;
  workingHour: number;
  manHour: number;
  wip: number;
  performance: number;
  hours: StyleHour[];
};

export type Output = {
  line: string;
  shift: Shift;
  performance: number;
  data: StyleRun[];
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
export type Shift = '1' | '2';
export type ProblemPIC = 'MT' | 'Produksi' | 'Trainer' | 'QC';
export type ProblemStatus = 'Belum Proses' | 'Dalam Proses' | 'Finish Proses';

export type GasResult<TData> = Record<Section, TData[]>;

export type GasFunctions = {
  getData: () => {
    outputs: GasResult<Output>;
    problems: Problem[];
  };
};
