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
};

type TargetReferences = {
  byStyle: Map<string, StyleTarget>;
};
