type ActualOutput = {
  date: string;
  shift: Shift;
  line: string;
  style: string;
  parts: string;
  operator: string;
  hour: number;
  output: number;
  repair: number;
  reject: number;
  /** Apakah sel output benar-benar terisi (bukan kosong). */
  hasData: boolean;
  manPower: number;
  wip: number;
  hourlyTarget: number;
  targetWorkingHour: number;
  /** Key target yang dipakai untuk mencocokkan baris actual ini. */
  targetKey: string;
  /** Pasangan size/isi molding dari target yang cocok. */
  moldings: MoldingItem[];
};

type MoldingItem = {
  size: string;
  molding: string;
};

type StyleTarget = {
  date: string;
  line: string;
  shift: Shift;
  style: string;
  part: string;
  target: number;
  totalWorkingHour: number;
  operator: string;
  manPower: number;
  moldings: MoldingItem[];
};

type TargetReferences = {
  byPart: Map<string, StyleTarget>;
  byStyle: Map<string, StyleTarget>;
};
