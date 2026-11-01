type ActualOutputRow = {
  date: string;
  shift: Shift;
  line: string;
  style: string;
  operator: string;
  hour: number;
  output: number;
  repair: number;
  reject: number;
  manPower: number;
  wip: number;
  hourlyTarget: number;
};

type StyleTarget = {
  target: number;
  totalWorkingHour: number;
  operator: string;
  manPower: number;
};
