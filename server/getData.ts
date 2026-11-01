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

const ACTUAL_COLUMN_ALIASES = {
  date: ['tanggal'],
  shift: ['shift'],
  hour: ['jam ke'],
  line: ['line'],
  style: ['grup style'],
  output: ['actual output jam'],
  repair: ['repair'],
  reject: ['reject'],
} as const;

const WIP_COLUMN_ALIASES = {
  date: ['tanggal'],
  shift: ['shift'],
  line: ['line'],
  style: ['grup style'],
  wip: ['qty wip line'],
} as const;

const TARGET_COLUMN_ALIASES = {
  date: ['tanggal'],
  shift: ['shift'],
  line: ['line'],
  style: ['grup style'],
  target: ['target komitmen hari'],
  totalWorkingHour: ['jk'],
  operator: ['operator'],
  manPower: ['mp'],
} as const;

function normalizeSheetHeader(value: CellValue): string {
  return toString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findSheetColumn(
  headers: string[],
  aliases: readonly string[],
): number {
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index >= 0) return index;
  }

  return -1;
}

function buildColumnMap<T extends Record<string, readonly string[]>>(
  headers: string[],
  aliases: T,
): { [K in keyof T]: number } {
  const result = {} as { [K in keyof T]: number };

  for (const key of Object.keys(aliases) as (keyof T)[]) {
    result[key] = findSheetColumn(headers, aliases[key]);
  }

  return result;
}

function createStyleReferenceKey(
  date: string,
  line: string,
  shift: Shift,
  style: string,
): string {
  return JSON.stringify([date, line, shift, style]);
}

function toNumberOrZero(value: CellValue): number {
  const result = toNullableNumber(value);
  return result === '' ? 0 : result;
}

function getCurrentShift(): Shift {
  const hour = Number(
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'H'),
  );

  return hour >= 6 && hour < 19 ? '1' : '2';
}

function readActualOutputRows(data: CellValue[][]): ActualOutputRow[] {
  if (data.length < 2) return [];

  const headers = data[0].map(normalizeSheetHeader);
  const columns = buildColumnMap(headers, ACTUAL_COLUMN_ALIASES);
  const requiredColumns = [
    'date',
    'shift',
    'hour',
    'line',
    'style',
    'output',
    'repair',
    'reject',
  ] as const;
  const missingColumns = requiredColumns.filter((key) => columns[key] < 0);

  if (missingColumns.length > 0) {
    throw new Error(
      `Kolom output tidak ditemukan: ${missingColumns.join(', ')}. Periksa header sheet '${SPREADSHEET_CONFIG.tprDirbon.sheetNames.actual}'.`,
    );
  }

  const rows: ActualOutputRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = toString(row[columns.date]);
    const line = toString(row[columns.line]);
    const shift = toString(row[columns.shift]) as Shift;

    if (!date || !line || line === '-') continue;
    if (shift !== '1' && shift !== '2') continue;

    const hour = toNumberOrZero(row[columns.hour]);
    if (!Number.isInteger(hour) || hour < 1 || hour > 10) continue;

    const style = toString(row[columns.style]);
    if (!style || style === '-') continue;

    rows.push({
      date,
      shift,
      line,
      style,
      operator: '-',
      hour,
      output: toNumberOrZero(row[columns.output]),
      repair: toNumberOrZero(row[columns.repair]),
      reject: toNumberOrZero(row[columns.reject]),
      manPower: 0,
      wip: 0,
      hourlyTarget: 0,
    });
  }

  return rows;
}

function readWipReferences(data: CellValue[][]): Map<string, number> {
  const references = new Map<string, number>();

  if (data.length < 2) return references;

  const headers = data[0].map(normalizeSheetHeader);
  const columns = buildColumnMap(headers, WIP_COLUMN_ALIASES);
  const requiredColumns = ['date', 'shift', 'line', 'style', 'wip'] as const;
  const missingColumns = requiredColumns.filter((key) => columns[key] < 0);

  if (missingColumns.length > 0) {
    throw new Error(
      `Kolom WIP tidak ditemukan: ${missingColumns.join(', ')}. Periksa header sheet '${SPREADSHEET_CONFIG.tprDirbon.sheetNames.wip}'.`,
    );
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = toString(row[columns.date]);
    const line = toString(row[columns.line]);
    const shift = toString(row[columns.shift]) as Shift;
    const style = toString(row[columns.style]);

    if (!date || !line || !style) continue;
    if (shift !== '1' && shift !== '2') continue;

    references.set(
      createStyleReferenceKey(date, line, shift, style),
      toNumberOrZero(row[columns.wip]),
    );
  }

  return references;
}

function readTargetReferences(data: CellValue[][]): Map<string, StyleTarget> {
  const references = new Map<string, StyleTarget>();

  if (data.length < 2) return references;

  const headers = data[0].map(normalizeSheetHeader);
  const columns = buildColumnMap(headers, TARGET_COLUMN_ALIASES);
  const requiredColumns = [
    'date',
    'shift',
    'line',
    'style',
    'target',
    'totalWorkingHour',
    'operator',
    'manPower',
  ] as const;
  const missingColumns = requiredColumns.filter((key) => columns[key] < 0);

  if (missingColumns.length > 0) {
    throw new Error(
      `Kolom target tidak ditemukan: ${missingColumns.join(', ')}. Periksa header sheet '${SPREADSHEET_CONFIG.tprDirbon.sheetNames.target}'.`,
    );
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = toString(row[columns.date]);
    const line = toString(row[columns.line]);
    const shift = toString(row[columns.shift]) as Shift;
    const style = toString(row[columns.style]);

    if (!date || !line || !style) continue;
    if (shift !== '1' && shift !== '2') continue;

    references.set(createStyleReferenceKey(date, line, shift, style), {
      target: toNumberOrZero(row[columns.target]),
      totalWorkingHour: toNumberOrZero(row[columns.totalWorkingHour]),
      operator: toString(row[columns.operator]) || '-',
      manPower: toNumberOrZero(row[columns.manPower]),
    });
  }

  return references;
}

function selectLatestOutputGroup(
  groups: ActualOutputRow[][],
): ActualOutputRow[] {
  const currentShift = getCurrentShift();
  const sorted = [...groups].sort((a, b) => {
    const dateOrder = b[0].date.localeCompare(a[0].date);
    if (dateOrder !== 0) return dateOrder;
    return b[0].shift.localeCompare(a[0].shift);
  });
  const latestDate = sorted[0][0].date;
  const latestDateGroups = sorted.filter(
    (group) => group[0].date === latestDate,
  );

  return (
    latestDateGroups.find((group) => group[0].shift === currentShift) ??
    latestDateGroups[0]
  );
}

function buildStyleRuns(rows: ActualOutputRow[]): StyleRun[] {
  const sorted = [...rows].sort((a, b) => a.hour - b.hour);
  const groups: ActualOutputRow[][] = [];

  for (const row of sorted) {
    const current = groups[groups.length - 1];
    const previous = current?.[current.length - 1];

    if (
      !current ||
      !previous ||
      previous.style !== row.style ||
      row.hour !== previous.hour + 1
    ) {
      groups.push([row]);
      continue;
    }

    current.push(row);
  }

  return groups.map((runRows) => {
    const first = runRows[0];
    const last = runRows[runRows.length - 1];
    const hours: StyleHour[] = runRows.map((row) => ({
      hour: row.hour,
      output: row.output,
      repair: row.repair,
      reject: row.reject,
    }));
    const totalOutput = hours.reduce((sum, hour) => sum + hour.output, 0);
    const totalRepair = hours.reduce((sum, hour) => sum + hour.repair, 0);
    const totalReject = hours.reduce((sum, hour) => sum + hour.reject, 0);
    const workingHour = hours.length;
    const hourlyTarget = first.hourlyTarget;
    const totalTarget = hourlyTarget * workingHour;
    const manPower = last.manPower;

    return {
      id: `${first.line}-${first.date}-${first.shift}-${first.style}-${first.hour}`,
      style: first.style,
      operator: first.operator,
      startHour: first.hour,
      endHour: last.hour,
      hourlyTarget,
      totalTarget,
      totalOutput,
      totalRepair,
      totalReject,
      manPower,
      workingHour,
      manHour: manPower * workingHour,
      wip: last.wip,
      performance: totalTarget > 0 ? totalOutput / totalTarget : 0,
      hours,
    };
  });
}

function getProblems(
  spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
): Problem[] {
  const now = new Date();
  const {
    tprDirbon: { spreadsheetId, sheetNames },
  } = SPREADSHEET_CONFIG;
  const targetSpreadsheet =
    spreadsheet ?? SpreadsheetApp.openById(spreadsheetId);
  const sheet = targetSpreadsheet.getSheetByName(sheetNames.kanban);

  if (!sheet) {
    throw new Error(`Sheet '${sheetNames.kanban}' tidak tersedia.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data: CellValue[][] = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

  const problems = data.reduce<Problem[]>((acc, row) => {
    const timestamp = toDate(row[0]);
    const line = toString(row[1]);
    const problem = toString(row[2]);
    const pic = toString(row[3]) as ProblemPIC;
    const start = row[4] instanceof Date ? toDate(row[4]) : null;
    const finish = row[5] instanceof Date ? toDate(row[5]) : null;
    const id = toNumber(row[7]);
    const status = !start
      ? 'Belum Proses'
      : !finish
        ? 'Dalam Proses'
        : 'Finish Proses';
    const elapsedTime = !finish ? 0 : now.getTime() - finish.getTime();

    if (status === 'Finish Proses' && elapsedTime > 24 * 60 * 60 * 1000)
      return acc;

    acc.push({
      timestamp: toDateTimeString(timestamp),
      line,
      problem,
      pic,
      status,
      start: start ? toDateTimeString(start) : '-',
      finish: finish ? toDateTimeString(finish) : '-',
      timestampTime: timestamp.getTime(),
      id,
    });

    return acc;
  }, []);

  problems.sort((a, b) => {
    const aFinish = a.status === 'Finish Proses';
    const bFinish = b.status === 'Finish Proses';

    if (aFinish !== bFinish) return aFinish ? 1 : -1;

    if (a.status !== b.status) return a.status.localeCompare(b.status);

    return a.timestampTime - b.timestampTime;
  });

  return problems;
}

function getOutputs(): ReturnType<GasFunctions['getOutputs']> {
  const {
    tprDirbon: { spreadsheetId, sheetNames },
  } = SPREADSHEET_CONFIG;
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const wipSheet = spreadsheet.getSheetByName(sheetNames.wip);
  const targetsSheet = spreadsheet.getSheetByName(sheetNames.target);
  const actualSheet = spreadsheet.getSheetByName(sheetNames.actual);

  if (!wipSheet || !targetsSheet || !actualSheet) {
    throw new Error(`Sheet tidak tersedia.`);
  }

  const wipData: CellValue[][] = wipSheet.getDataRange().getValues();
  const targetsData: CellValue[][] = targetsSheet.getDataRange().getValues();
  const actualData: CellValue[][] = actualSheet.getDataRange().getValues();
  const wipByStyle = readWipReferences(wipData);
  const targetByStyle = readTargetReferences(targetsData);
  const problems = getProblems(spreadsheet);
  const rows = readActualOutputRows(actualData).map((row) => {
    const key = createStyleReferenceKey(
      row.date,
      row.line,
      row.shift,
      row.style,
    );
    const target = targetByStyle.get(key);
    const totalWorkingHour = target?.totalWorkingHour ?? 0;

    return {
      ...row,
      operator: target?.operator ?? '-',
      manPower: target?.manPower ?? 0,
      wip: wipByStyle.get(key) ?? 0,
      hourlyTarget:
        target && totalWorkingHour > 0 ? target.target / totalWorkingHour : 0,
    };
  });
  const activeProblemsByLine = new Map<string, Problem[]>();

  for (const problem of problems) {
    if (problem.status === 'Finish Proses') continue;

    const lineProblems = activeProblemsByLine.get(problem.line) ?? [];
    lineProblems.push(problem);
    activeProblemsByLine.set(problem.line, lineProblems);
  }

  // Tanggal sudah merupakan tanggal awal shift; gunakan apa adanya.
  const groupsByLine = new Map<string, Map<string, ActualOutputRow[]>>();

  for (const row of rows) {
    const lineGroups = groupsByLine.get(row.line) ?? new Map();
    const key = `${row.date}|${row.shift}`;
    const group = lineGroups.get(key) ?? [];

    group.push(row);
    lineGroups.set(key, group);
    groupsByLine.set(row.line, lineGroups);
  }

  const tprData: Output[] = [];
  const dirbonData: Output[] = [];

  for (const [line, lineGroups] of groupsByLine) {
    const selectedRows = selectLatestOutputGroup([...lineGroups.values()]);
    const runs = buildStyleRuns(selectedRows);

    if (runs.length === 0) continue;

    const totalOutput = runs.reduce((sum, run) => sum + run.totalOutput, 0);
    const totalTarget = runs.reduce((sum, run) => sum + run.totalTarget, 0);
    const lineProblems = activeProblemsByLine.get(line) ?? [];

    const entry: Output = {
      line,
      shift: selectedRows[0].shift,
      performance: totalTarget > 0 ? totalOutput / totalTarget : 0,
      data: runs,
      produksi: lineProblems.some((problem) => problem.pic === 'Produksi')
        ? 1
        : 0,
      mt: lineProblems.some((problem) => problem.pic === 'MT') ? 1 : 0,
      trainer: lineProblems.some((problem) => problem.pic === 'Trainer')
        ? 1
        : 0,
      qc: lineProblems.some((problem) => problem.pic === 'QC') ? 1 : 0,
      problems: lineProblems.map((problem) => problem.problem),
    };

    if (line.startsWith('T')) tprData.push(entry);
    if (line.startsWith('D')) dirbonData.push(entry);
  }

  tprData.sort((a, b) => a.line.localeCompare(b.line));
  dirbonData.sort((a, b) => a.line.localeCompare(b.line));

  return { tpr: tprData, dirbon: dirbonData };
}
