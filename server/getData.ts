const ACTUAL_COLUMN_ALIASES = {
  date: ['tanggal'],
  shift: ['shift'],
  hour: ['jam ke'],
  line: ['line'],
  style: ['grup style'],
  parts: ['part'],
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
  operator: ['helper line'],
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
    'parts',
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
    const date = toDateKey(row[columns.date]);
    const line = toString(row[columns.line]);
    const shift = toString(row[columns.shift]) as Shift;

    if (!date || !line || line === '-') continue;
    if (shift !== '1' && shift !== '2') continue;

    const hour = toNumberOrZero(row[columns.hour]);
    if (!Number.isInteger(hour) || hour < 1 || hour > 10) continue;

    const style = toString(row[columns.style]);
    if (!style || style === '-') continue;

    const parts = toString(row[columns.parts]);
    if (!parts || parts === '-') continue;

    rows.push({
      date,
      shift,
      line,
      style,
      parts,
      operator: '-',
      hour,
      output: toNumberOrZero(row[columns.output]),
      repair: toNumberOrZero(row[columns.repair]),
      reject: toNumberOrZero(row[columns.reject]),
      hasData: toNullableNumber(row[columns.output]) !== '',
      manPower: 0,
      wip: 0,
      hourlyTarget: 0,
      targetWorkingHour: 0,
    });
  }

  return rows;
}

// Satu style/jam bisa terdiri dari beberapa baris size/part. Jumlahkan
// output, repair, dan reject sebelum membentuk style run.
function aggregateActualOutputRows(rows: ActualOutputRow[]): ActualOutputRow[] {
  const aggregated = new Map<string, ActualOutputRow>();

  for (const row of rows) {
    const key = JSON.stringify([
      row.date,
      row.line,
      row.shift,
      row.style,
      row.hour,
    ]);
    const current = aggregated.get(key);

    if (!current) {
      aggregated.set(key, { ...row });
      continue;
    }

    current.output += row.output;
    current.repair += row.repair;
    current.reject += row.reject;
    current.hasData = current.hasData || row.hasData;
  }

  return [...aggregated.values()];
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
    const date = toDateKey(row[columns.date]);
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
    const date = toDateKey(row[columns.date]);
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
  const now = new Date();
  const currentShift = getShiftByTimestamp(now);
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

function buildStyleRuns(
  rows: ActualOutputRow[],
  currentHour: number,
): StyleRun[] {
  const sorted = [...rows].sort((a, b) => a.hour - b.hour);
  const groups: ActualOutputRow[][] = [];

  for (const row of sorted) {
    const current = groups[groups.length - 1];
    const previous = current?.[current.length - 1];

    if (!current || !previous || previous.style !== row.style) {
      groups.push([row]);
      continue;
    }

    current.push(row);
  }

  return groups.map((runRows, runIndex) => {
    const first = runRows[0];
    const last = runRows[runRows.length - 1];
    const startHour = first.hour;
    const actualEndHour = last.hour;
    const nextStartHour = groups[runIndex + 1]?.[0].hour;

    // Run terakhir masih dianggap berjalan sampai jam produksi saat ini,
    // sehingga target tetap bertambah walaupun belum ada output baru.
    // Run sebelumnya dibatasi sampai jam sebelum style berikutnya mulai.
    const displayEndHour = nextStartHour
      ? nextStartHour - 1
      : Math.max(currentHour, actualEndHour);
    const elapsedHour = Math.max(
      0,
      Math.min(displayEndHour, currentHour) - startHour + 1,
    );

    // JK dari target menentukan berapa jam target untuk style tersebut.
    // Shift 2 bisa lebih pendek dari 10 jam, jadi target tidak boleh
    // melewati target komitmen harian.
    const targetWorkingHour =
      first.targetWorkingHour > 0 ? first.targetWorkingHour : elapsedHour;
    const workingHour = Math.min(elapsedHour, targetWorkingHour);

    const rowsByHour = new Map(runRows.map((row) => [row.hour, row]));

    // Gap jam di tengah run tetap dianggap jam produksi, sehingga jam yang
    // tidak memiliki baris diisi dengan output/repair/reject 0.
    const hours: StyleHour[] = Array.from(
      { length: Math.max(0, displayEndHour - startHour + 1) },
      (_, index) => {
        const hour = startHour + index;
        const row = rowsByHour.get(hour);

        return {
          hour,
          output: row?.output ?? 0,
          repair: row?.repair ?? 0,
          reject: row?.reject ?? 0,
          hasData: row?.hasData ?? false,
        };
      },
    );

    const totalOutput = hours.reduce((sum, hour) => sum + hour.output, 0);
    const totalRepair = hours.reduce((sum, hour) => sum + hour.repair, 0);
    const totalReject = hours.reduce((sum, hour) => sum + hour.reject, 0);
    const hourlyTarget = first.hourlyTarget;
    const totalTarget = hourlyTarget * workingHour;
    const manPower = last.manPower;

    return {
      id: `${first.line}-${first.date}-${first.shift}-${first.style}-${first.hour}`,
      style: first.style,
      parts: first.parts,
      operator: first.operator,
      startHour,
      endHour: displayEndHour,
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

function getProblems(date = '', shift?: Shift): Problem[] {
  const now = new Date();
  const isHistorical = Boolean(date);
  const {
    tprDirbon: { spreadsheetId, sheetNames },
  } = SPREADSHEET_CONFIG;
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetNames.kanban);

  if (!sheet) {
    throw new Error(`Sheet '${sheetNames.kanban}' tidak tersedia.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data: CellValue[][] = sheet.getRange(2, 1, lastRow - 1, 12).getValues();

  const problems = data.reduce<Problem[]>((acc, row) => {
    const timestamp = toDate(row[0]);
    const problemDate = toDateKey(row[6]);
    const line = toString(row[1]);
    const problem = toString(row[2]);
    const pic = toString(row[3]) as ProblemPIC;
    const start = row[4] instanceof Date ? toDate(row[4]) : null;
    const finish = row[5] instanceof Date ? toDate(row[5]) : null;
    const id = toNumber(row[7]);
    const problemShift = toString(row[11]) as Shift;
    const status = !start
      ? 'Belum Proses'
      : !finish
        ? 'Dalam Proses'
        : 'Finish Proses';
    const elapsedTime = !finish ? 0 : now.getTime() - finish.getTime();

    if (date && problemDate !== date) return acc;
    if (shift && problemShift !== shift) return acc;

    if (
      !isHistorical &&
      status === 'Finish Proses' &&
      elapsedTime > 24 * 60 * 60 * 1000
    )
      return acc;

    acc.push({
      timestamp: toDateTimeString(timestamp),
      shift: problemShift,
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

function getData(
  filter: GetDataFilter = {},
): ReturnType<GasFunctions['getData']> {
  const date = filter.date ? toDateKey(filter.date) : '';
  const shift = filter.shift;

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Format tanggal filter harus yyyy-MM-dd: ${date}`);
  }

  if (shift && shift !== '1' && shift !== '2') {
    throw new Error(`Shift filter tidak valid: ${shift}`);
  }

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
  const problems = getProblems(date, shift);
  const rows = aggregateActualOutputRows(readActualOutputRows(actualData))
    .filter(
      (row) => (!date || row.date === date) && (!shift || row.shift === shift),
    )
    .map((row) => {
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
        targetWorkingHour: totalWorkingHour,
      };
    });
  const currentHourByGroup = new Map<string, number>();

  for (const row of rows) {
    const key = `${row.date}|${row.shift}`;
    const currentHour = currentHourByGroup.get(key) ?? 0;
    if (row.hour > currentHour) {
      currentHourByGroup.set(key, row.hour);
    }
  }

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
    const groupKey = `${selectedRows[0].date}|${selectedRows[0].shift}`;
    const currentHour = currentHourByGroup.get(groupKey) ?? 0;
    const runs = buildStyleRuns(selectedRows, currentHour);

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

  return {
    outputs: { tpr: tprData, dirbon: dirbonData },
    problems,
  };
}

function getOutstandingData(): ReturnType<GasFunctions['getOutstandingData']> {
  const {
    distribusi: { spreadsheetId, sheetNames },
  } = SPREADSHEET_CONFIG;
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetNames.supply);

  if (!sheet) {
    throw new Error(`Sheet '${sheetNames.supply}' tidak tersedia.`);
  }

  const [, , ...data]: CellValue[][] = sheet
    .getDataRange()
    .getValues()
    .filter((row) => !!row[0]);

  const getOutstanding = (
    balance: number,
    finish: number,
    cummSupply: number,
  ) => {
    if (finish < cummSupply) {
      return balance * -1;
    }
    return balance * -1 - (finish - cummSupply);
  };

  const tprOutstandings: Outstanding[] = [];
  const dirbonOutstandings: Outstanding[] = [];

  data.forEach((row) => {
    const date = toDateString(row[1]);
    const spo = toString(row[2]);
    const style = toString(row[3]);

    const cummSupply = toNumber(row[5]);
    const balance = toNumber(row[6]);
    const finishTpr = toNullableNumber(row[15]);
    const finishDirbon = toNullableNumber(row[14]);

    if (finishTpr === '' || finishDirbon === '' || balance >= 0) return;

    const tprOutstanding = getOutstanding(balance, finishTpr, cummSupply);
    const dirbonOutstanding = getOutstanding(balance, finishDirbon, cummSupply);

    if (tprOutstanding > 0) {
      tprOutstandings.push({
        date,
        spo: spo === '#N/A' ? 'Loading...' : spo,
        style: style === '#N/A' ? 'Loading...' : style,
        qty: tprOutstanding,
      });
    }

    if (dirbonOutstanding > 0) {
      dirbonOutstandings.push({
        date,
        spo: spo === '#N/A' ? 'Loading...' : spo,
        style: style === '#N/A' ? 'Loading...' : style,
        qty: dirbonOutstanding,
      });
    }
  });

  const result = {
    tpr: tprOutstandings.sort((a, b) => b.qty - a.qty),
    dirbon: dirbonOutstandings.sort((a, b) => b.qty - a.qty),
  };

  return result;
}
