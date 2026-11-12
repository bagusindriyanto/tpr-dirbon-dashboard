type ActualOutputRow = {
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
  target: number;
  totalWorkingHour: number;
  operator: string;
  manPower: number;
};
