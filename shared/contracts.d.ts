export type StyleHour = {
  hour: number;
  output: number;
  repair: number;
  reject: number;
  /** false = belum ada input untuk jam ini (beda dengan output 0). */
  hasData?: boolean;
};

export type MoldingItem = {
  size: string;
  molding: string;
};

export type StyleRun = {
  id: string;
  style: string;
  parts: string;
  operator: string;
  /** Pasangan size dan isi molding dari sheet target untuk style ini. */
  moldings: MoldingItem[];
  startHour: number;
  endHour: number;
  hourlyTarget: number;
  totalTarget: number;
  totalOutput: number;
  totalRepair: number;
  totalReject: number;
  manPower: number;
  /** JK dari target: jam kerja yang direncanakan untuk style ini. */
  targetWorkingHour: number;
  /** Jam kerja berjalan sampai jam produksi saat ini (dibatasi JK). */
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
  shift: Shift;
  line: string;
  problem: string;
  pic: ProblemPIC;
  status: ProblemStatus;
  start: string;
  finish: string;
  timestampTime: number;
  id: number;
};

export type Outstanding = {
  date: string;
  style: string;
  spo: string;
  qty: number;
};

export type Section = 'tpr' | 'dirbon';
export type Shift = '1' | '2';
export type ProblemPIC = 'MT' | 'Produksi' | 'Trainer' | 'QC';
export type ProblemStatus = 'Belum Proses' | 'Dalam Proses' | 'Finish Proses';

export type GetDataFilter = {
  /** Tanggal awal shift dalam format yyyy-MM-dd. */
  date?: string;
  shift?: Shift;
};

export type GasResult<TData> = Record<Section, TData[]>;

/** Snapshot sheet `Jam` yang dipakai saat mode otomatis. */
export type ScheduleSnapshot = {
  /** Tanggal produksi yang dipakai untuk membaca target dan actual. */
  date: string;
  /** 0 = belum/tidak masuk jam produksi, 1..10 = jam produksi. */
  currentHour: number;
  /** Hari produksi: 1=Senin ... 7=Minggu. */
  currentDay: number;
  currentShift: Shift;
};

export type GetDataResult = {
  outputs: GasResult<Output>;
  problems: Problem[];
  /** null jika request memakai filter tanggal/shift. */
  schedule: ScheduleSnapshot | null;
};

export type GasFunctions = {
  getData: (filter?: GetDataFilter) => GetDataResult;
  getOutstandingData: () => GasResult<Outstanding>;
};
