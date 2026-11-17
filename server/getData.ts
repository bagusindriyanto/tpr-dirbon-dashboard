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
  part: ['part'],
  target: ['target komitmen hari'],
  totalWorkingHour: ['jk'],
  operator: ['helper line'],
  manPower: ['mp'],
  size: ['size'],
  molding: ['isi molding'],
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

function createPartReferenceKey(
  date: string,
  line: string,
  shift: Shift,
  style: string,
  part: string,
): string {
  return JSON.stringify([date, line, shift, style, part]);
}

function normalizePart(value: CellValue): string {
  const part = toString(value);
  return part === '-' ? '' : part;
}

/** JK/MP pada beberapa baris target yang sama harus konsisten. */
function mergeUniqueNumber(current: number, next: number): number {
  if (!current) return next;
  if (!next) return current;
  return Math.max(current, next);
}

function mergeMoldings(
  current: MoldingItem[],
  next: MoldingItem[],
): MoldingItem[] {
  const result = [...current];

  for (const item of next) {
    if (
      !result.some(
        (existing) =>
          existing.size === item.size && existing.molding === item.molding,
      )
    ) {
      result.push({ ...item });
    }
  }

  return result;
}

function mergePartName(current: string, next: string): string {
  if (!current) return next;
  if (!next || current === next) return current;

  const parts = new Set(current.split(' / ').filter(Boolean));
  parts.add(next);
  return [...parts].join(' / ');
}

function readActualOutputs(data: CellValue[][]): ActualOutput[] {
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

  const rows: ActualOutput[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = toDateKey(row[columns.date]);
    const line = toString(row[columns.line]);
    const shift = toString(row[columns.shift]) as Shift;

    if (!date || !line || line === '-') continue;
    if (shift !== '1' && shift !== '2') continue;

    const hour = toNumberOrZero(row[columns.hour]);
    if (!Number.isInteger(hour) || hour < 1 || hour > PRODUCTION_HOURS)
      continue;

    const style = toString(row[columns.style]);
    if (!style || style === '-') continue;

    // Part adalah bagian identity target/actual. Kolomnya opsional agar sheet
    // lama tetap bisa dibaca.
    const parts = columns.parts >= 0 ? normalizePart(row[columns.parts]) : '';

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
      targetKey: '',
      moldings: [],
    });
  }

  return rows;
}

// Satu style/part/jam bisa terdiri dari beberapa baris size. Jumlahkan
// output, repair, dan reject sebelum membentuk style run.
function aggregateActualOutputs(rows: ActualOutput[]): ActualOutput[] {
  const aggregated = new Map<string, ActualOutput>();

  for (const row of rows) {
    const key = JSON.stringify([
      row.date,
      row.line,
      row.shift,
      row.style,
      row.parts,
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

function readTargetReferences(data: CellValue[][]): TargetReferences {
  const byPart = new Map<string, StyleTarget>();
  const byStyle = new Map<string, StyleTarget>();

  if (data.length < 2) return { byPart, byStyle };

  const headers = data[0].map(normalizeSheetHeader);
  const columns = buildColumnMap(headers, TARGET_COLUMN_ALIASES);
  const requiredColumns = [
    'date',
    'shift',
    'line',
    'style',
    'part',
    'target',
    'totalWorkingHour',
    'operator',
    'manPower',
    'size',
    'molding',
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

    const part = normalizePart(row[columns.part]);
    const key = createPartReferenceKey(date, line, shift, style, part);
    const current = byPart.get(key);
    const size = toString(row[columns.size]);
    const molding = toString(row[columns.molding]);
    const rowMoldings =
      size && size !== '-' && molding && molding !== '-'
        ? [{ size, molding }]
        : [];
    const moldings = mergeMoldings(current?.moldings ?? [], rowMoldings);
    const target = toNumberOrZero(row[columns.target]);
    const totalWorkingHour = toNumberOrZero(row[columns.totalWorkingHour]);
    const operator = toString(row[columns.operator]) || '-';
    const manPower = toNumberOrZero(row[columns.manPower]);

    if (current) {
      // Satu part bisa terdiri dari beberapa size/molding. Target dijumlahkan,
      // sedangkan JK/MP dianggap nilai yang sama untuk part tersebut.
      current.target += target;
      current.totalWorkingHour = mergeUniqueNumber(
        current.totalWorkingHour,
        totalWorkingHour,
      );
      current.manPower = mergeUniqueNumber(current.manPower, manPower);
      current.operator =
        current.operator === '-' && operator !== '-' ? operator : current.operator;
      current.moldings = moldings;
      continue;
    }

    byPart.set(key, {
      date,
      line,
      shift,
      style,
      part,
      target,
      totalWorkingHour,
      operator,
      manPower,
      moldings,
    });
  }

  // Fallback untuk actual lama yang kolom part-nya kosong. Target semua part
  // pada style yang sama digabung agar tetap ada target pembanding.
  for (const target of byPart.values()) {
    const key = createStyleReferenceKey(
      target.date,
      target.line,
      target.shift,
      target.style,
    );
    const current = byStyle.get(key);

    if (!current) {
      byStyle.set(key, { ...target, moldings: [...target.moldings] });
      continue;
    }

    current.target += target.target;
    current.totalWorkingHour = mergeUniqueNumber(
      current.totalWorkingHour,
      target.totalWorkingHour,
    );
    current.manPower += target.manPower;
    current.operator =
      current.operator === '-' && target.operator !== '-'
        ? target.operator
        : current.operator;
    current.part = mergePartName(current.part, target.part);
    current.moldings = mergeMoldings(current.moldings, target.moldings);
  }

  return { byPart, byStyle };
}

function selectLatestTargetGroup(
  groups: StyleTarget[][],
): StyleTarget[] | null {
  if (groups.length === 0) return null;

  const currentShift = getShiftByTimestamp(new Date());
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
  rows: ActualOutput[],
  currentHour: number,
): StyleRun[] {
  const sorted = [...rows].sort(
    (a, b) =>
      a.hour - b.hour ||
      a.style.localeCompare(b.style, 'id') ||
      a.parts.localeCompare(b.parts, 'id'),
  );
  const segments: {
    key: string;
    rows: ActualOutput[];
    firstHour: number;
  }[] = [];

  for (const row of sorted) {
    const key = JSON.stringify([row.style, row.parts]);
    const current = segments[segments.length - 1];
    const previous = current?.rows[current.rows.length - 1];

    if (
      !current ||
      !previous ||
      previous.style !== row.style ||
      previous.parts !== row.parts
    ) {
      segments.push({ key, rows: [row], firstHour: row.hour });
      continue;
    }

    current.rows.push(row);
  }

  const segmentData = segments.map((segment, index) => {
    const first = segment.rows[0];
    const last = segment.rows[segment.rows.length - 1];
    // Segmen pertama dimulai dari jam 1 agar jam kosong sebelum actual
    // pertama tetap terdeteksi sebagai output yang belum diinput.
    const startHour = index === 0 ? 1 : first.hour;
    // Segmen yang mulai di jam yang sama (mis. beberapa part pada satu jam)
    // tidak boleh saling memotong. Cari jam berikutnya yang lebih besar.
    const nextStartHour = segments
      .slice(index + 1)
      .find((candidate) => candidate.firstHour > first.hour)?.firstHour;
    const displayEndHour =
      nextStartHour !== undefined
        ? nextStartHour - 1
        : Math.max(currentHour, last.hour);
    const elapsedHour = Math.max(
      0,
      Math.min(displayEndHour, currentHour) - startHour + 1,
    );
    const rowsByHour = new Map(
      segment.rows.map((row) => [row.hour, row]),
    );

    // Gap jam di tengah segmen tetap dianggap jam produksi, sehingga jam yang
    // tidak memiliki baris diisi dengan output/repair/reject 0.
    const hours: StyleHour[] = Array.from(
      { length: Math.max(0, displayEndHour - startHour + 1) },
      (_, hourIndex) => {
        const hour = startHour + hourIndex;
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

    return {
      key: segment.key,
      rows: segment.rows,
      startHour,
      endHour: displayEndHour,
      elapsedHour,
      hours,
    };
  });

  // Style+part yang muncul lagi setelah style/part lain digabung menjadi satu
  // run. Jam milik run lain tidak ikut dimasukkan ke run ini.
  const groupedSegments = new Map<
    string,
    (typeof segmentData)[number][]
  >();

  for (const segment of segmentData) {
    const grouped = groupedSegments.get(segment.key) ?? [];
    grouped.push(segment);
    groupedSegments.set(segment.key, grouped);
  }

  return [...groupedSegments.values()].map((runSegments) => {
    const firstSegment = runSegments[0];
    const lastSegment = runSegments[runSegments.length - 1];
    const first = firstSegment.rows[0];
    const last = lastSegment.rows[lastSegment.rows.length - 1];
    const elapsedHour = runSegments.reduce(
      (sum, segment) => sum + segment.elapsedHour,
      0,
    );
    const targetWorkingHour =
      first.targetWorkingHour > 0 ? first.targetWorkingHour : elapsedHour;
    const workingHour = Math.min(elapsedHour, targetWorkingHour);
    const hoursByHour = new Map<number, StyleHour>();

    for (const segment of runSegments) {
      for (const entry of segment.hours) {
        const current = hoursByHour.get(entry.hour);

        if (!current) {
          hoursByHour.set(entry.hour, { ...entry });
          continue;
        }

        current.output += entry.output;
        current.repair += entry.repair;
        current.reject += entry.reject;
        current.hasData = Boolean(current.hasData || entry.hasData);
      }
    }

    const hours = [...hoursByHour.values()].sort((a, b) => a.hour - b.hour);
    const totalOutput = hours.reduce((sum, hour) => sum + hour.output, 0);
    const totalRepair = hours.reduce((sum, hour) => sum + hour.repair, 0);
    const totalReject = hours.reduce((sum, hour) => sum + hour.reject, 0);
    const hourlyTarget = first.hourlyTarget;
    const totalTarget = hourlyTarget * workingHour;
    const manPower = last.manPower;

    return {
      id: `${first.line}-${first.date}-${first.shift}-${first.style}-${first.parts || 'no-part'}`,
      style: first.style,
      parts: first.parts,
      operator: first.operator,
      moldings: first.moldings,
      startHour: Math.min(...runSegments.map((segment) => segment.startHour)),
      endHour: Math.max(...runSegments.map((segment) => segment.endHour)),
      hourlyTarget,
      totalTarget,
      totalOutput,
      totalRepair,
      totalReject,
      manPower,
      targetWorkingHour,
      workingHour,
      manHour: manPower * targetWorkingHour,
      wip: last.wip,
      performance: totalTarget > 0 ? totalOutput / totalTarget : 0,
      hours,
    };
  });
}

// Target ada tetapi actual untuk style tersebut belum ada. Tampilkan card
// dengan target penuh dan seluruh jam produksi berstatus belum ada data.
function buildTargetOnlyRuns(
  targets: StyleTarget[],
  wipByStyle: Map<string, number>,
): StyleRun[] {
  return targets.map((target) => {
    const hourlyTarget =
      target.totalWorkingHour > 0 ? target.target / target.totalWorkingHour : 0;
    const targetWorkingHour =
      target.totalWorkingHour > 0 ? target.totalWorkingHour : PRODUCTION_HOURS;
    const workingHour = Math.min(PRODUCTION_HOURS, targetWorkingHour);
    const hours: StyleHour[] = Array.from(
      { length: PRODUCTION_HOURS },
      (_, index) => ({
        hour: index + 1,
        output: 0,
        repair: 0,
        reject: 0,
        hasData: false,
      }),
    );

    return {
      id: `${target.line}-${target.date}-${target.shift}-${target.style}-${target.part || 'no-part'}`,
      style: target.style,
      parts: target.part,
      operator: target.operator,
      moldings: target.moldings,
      startHour: 1,
      endHour: PRODUCTION_HOURS,
      hourlyTarget,
      totalTarget: hourlyTarget * workingHour,
      totalOutput: 0,
      totalRepair: 0,
      totalReject: 0,
      manPower: target.manPower,
      targetWorkingHour,
      workingHour,
      manHour: target.manPower * targetWorkingHour,
      wip:
        wipByStyle.get(
          createStyleReferenceKey(
            target.date,
            target.line,
            target.shift,
            target.style,
          ),
        ) ?? 0,
      performance: 0,
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
  const isAuto = !date && !shift;

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
  const scheduleSheet = isAuto
    ? spreadsheet.getSheetByName(sheetNames.schedule)
    : null;

  if (
    !wipSheet ||
    !targetsSheet ||
    !actualSheet ||
    (isAuto && !scheduleSheet)
  ) {
    throw new Error(`Sheet tidak tersedia.`);
  }

  // Jadwal hanya dipakai saat tanggal dan shift sama-sama otomatis.
  const schedule = scheduleSheet ? readCurrentSchedule_(scheduleSheet) : null;
  const autoDate = schedule ? getScheduleDateKey_(schedule, new Date()) : '';
  // Kirim snapshot yang sama ke frontend agar alert tidak menghitung ulang
  // tanggal/shift dari jam browser.
  const scheduleSnapshot = schedule ? { ...schedule, date: autoDate } : null;

  const wipData: CellValue[][] = wipSheet.getDataRange().getValues();
  const targetsData: CellValue[][] = targetsSheet.getDataRange().getValues();
  const actualData: CellValue[][] = actualSheet.getDataRange().getValues();
  const wipByStyle = readWipReferences(wipData);
  const { byPart: targetByPart, byStyle: targetByStyle } =
    readTargetReferences(targetsData);
  const problems = getProblems(date, shift);

  // Mode otomatis memakai tanggal/shift dari sheet Jam. Mode filter memakai
  // filter apa adanya; jika hanya tanggal, group shift dipilih nanti.
  const outputDate = schedule ? autoDate : date;
  const outputShift = schedule ? schedule.currentShift : shift;

  const rows = aggregateActualOutputs(readActualOutputs(actualData))
    .filter(
      (row) =>
        (!outputDate || row.date === outputDate) &&
        (!outputShift || row.shift === outputShift),
    )
    .map((row) => {
      const styleKey = createStyleReferenceKey(
        row.date,
        row.line,
        row.shift,
        row.style,
      );
      const partKey = createPartReferenceKey(
        row.date,
        row.line,
        row.shift,
        row.style,
        row.parts,
      );
      // Actual yang punya part harus cocok persis. Fallback ke level style
      // hanya dipakai untuk actual lama yang kolom part-nya kosong.
      const target = row.parts
        ? targetByPart.get(partKey)
        : targetByStyle.get(styleKey);
      const targetKey = row.parts
        ? target
          ? partKey
          : ''
        : target
          ? styleKey
          : '';
      const totalWorkingHour = target?.totalWorkingHour ?? 0;

      return {
        ...row,
        parts: target?.part ?? row.parts,
        operator: target?.operator ?? '-',
        manPower: target?.manPower ?? 0,
        wip: wipByStyle.get(styleKey) ?? 0,
        hourlyTarget:
          target && totalWorkingHour > 0 ? target.target / totalWorkingHour : 0,
        targetWorkingHour: totalWorkingHour,
        targetKey,
        moldings: target?.moldings ?? [],
      };
    });

  const actualGroupsByLine = new Map<string, Map<string, ActualOutput[]>>();

  for (const row of rows) {
    const lineGroups =
      actualGroupsByLine.get(row.line) ?? new Map<string, ActualOutput[]>();
    const groupKey = `${row.date}|${row.shift}`;
    const group = lineGroups.get(groupKey) ?? [];

    group.push(row);
    lineGroups.set(groupKey, group);
    actualGroupsByLine.set(row.line, lineGroups);
  }

  const targetGroupsByLine = new Map<string, Map<string, StyleTarget[]>>();

  for (const target of targetByPart.values()) {
    if (outputDate && target.date !== outputDate) continue;
    if (outputShift && target.shift !== outputShift) continue;

    const lineGroups =
      targetGroupsByLine.get(target.line) ?? new Map<string, StyleTarget[]>();
    const groupKey = `${target.date}|${target.shift}`;
    const group = lineGroups.get(groupKey) ?? [];

    group.push(target);
    lineGroups.set(groupKey, group);
    targetGroupsByLine.set(target.line, lineGroups);
  }

  const activeProblemsByLine = new Map<string, Problem[]>();

  for (const problem of problems) {
    if (problem.status === 'Finish Proses') continue;

    const lineProblems = activeProblemsByLine.get(problem.line) ?? [];
    lineProblems.push(problem);
    activeProblemsByLine.set(problem.line, lineProblems);
  }

  const tprData: Output[] = [];
  const dirbonData: Output[] = [];

  // Target menentukan line yang tampil. Actual hanya mengisi output per jam.
  for (const [line, lineGroups] of targetGroupsByLine) {
    const targets = selectLatestTargetGroup([...lineGroups.values()]);

    if (!targets) continue;

    const groupKey = `${targets[0].date}|${targets[0].shift}`;
    const actualRows = actualGroupsByLine.get(line)?.get(groupKey) ?? [];
    const targetPartKeys = new Set(
      targets.map((target) =>
        createPartReferenceKey(
          target.date,
          target.line,
          target.shift,
          target.style,
          target.part,
        ),
      ),
    );
    const targetStyleKeys = new Set(
      targets.map((target) =>
        createStyleReferenceKey(
          target.date,
          target.line,
          target.shift,
          target.style,
        ),
      ),
    );
    const targetActualRows = actualRows.filter(
      (row) =>
        row.targetKey !== '' &&
        (targetPartKeys.has(row.targetKey) ||
          targetStyleKeys.has(row.targetKey)),
    );
    const currentHour = schedule
      ? schedule.currentHour
      : targetActualRows.reduce((max, row) => Math.max(max, row.hour), 0);
    const actualRuns =
      targetActualRows.length > 0
        ? buildStyleRuns(targetActualRows, currentHour)
        : [];
    const coveredTargetKeys = new Set<string>();

    for (const row of targetActualRows) {
      if (targetPartKeys.has(row.targetKey)) {
        coveredTargetKeys.add(row.targetKey);
        continue;
      }

      // Fallback style mencakup seluruh part pada style tersebut.
      for (const target of targets) {
        if (
          createStyleReferenceKey(
            target.date,
            target.line,
            target.shift,
            target.style,
          ) === row.targetKey
        ) {
          coveredTargetKeys.add(
            createPartReferenceKey(
              target.date,
              target.line,
              target.shift,
              target.style,
              target.part,
            ),
          );
        }
      }
    }

    const targetOnlyTargets = targets.filter(
      (target) =>
        !coveredTargetKeys.has(
          createPartReferenceKey(
            target.date,
            target.line,
            target.shift,
            target.style,
            target.part,
          ),
        ),
    );
    const runs = [
      ...actualRuns,
      ...buildTargetOnlyRuns(targetOnlyTargets, wipByStyle),
    ].sort(
      (a, b) =>
        a.startHour - b.startHour ||
        a.style.localeCompare(b.style, 'id') ||
        a.parts.localeCompare(b.parts, 'id'),
    );

    if (runs.length === 0) continue;

    const totalOutput = runs.reduce((sum, run) => sum + run.totalOutput, 0);
    const totalTarget = runs.reduce((sum, run) => sum + run.totalTarget, 0);
    const lineProblems = activeProblemsByLine.get(line) ?? [];

    const entry: Output = {
      line,
      shift: targets[0].shift,
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
    schedule: scheduleSnapshot,
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
