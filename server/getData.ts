function getOutputs(): ReturnType<GasFunctions['getOutputs']> {
  const {
    tprDirbon: { spreadsheetId, sheetNames },
  } = SPREADSHEET_CONFIG;
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const wipSheet = spreadsheet.getSheetByName(sheetNames.wip);
  const planSheet = spreadsheet.getSheetByName(sheetNames.plan);
  const actualSheet = spreadsheet.getSheetByName(sheetNames.actual);

  if (!wipSheet || !planSheet || !actualSheet) {
    throw new Error('Sheet tidak tersedia.');
  }

  const wipData: CellValue[][] = wipSheet.getDataRange().getValues();
  const planData: CellValue[][] = planSheet.getDataRange().getValues();
  const actualData: CellValue[][] = actualSheet.getDataRange().getValues();

  const wipResults: {
    [line: string]: number;
  } = {};

  for (let i = 1; i < wipData.length; i++) {
    const date = toString(wipData[i][0]);
    const line = toString(wipData[i][1]);
    const wip = toNumber(wipData[i][4]);
    if (!date || !line) continue;

    wipResults[line] = wip;
  }

  const tprData: Output[] = [];
  const dirbonData: Output[] = [];

  for (let i = 1; i < actualData.length; i++) {
    const date = toString(actualData[i][0]);
    const line = toString(actualData[i][1]);

    if (!date || !line || line === '-') continue;

    const entry: Output = {
      line,
      style: toString(actualData[i][8]),
      operator: toString(actualData[i][2]),
      wip: wipResults[line] || 0,
      hourlyTarget: toNumber(planData[i][7]),
      totalTarget: toNumber(actualData[i][5]),
      totalOutput: toNumber(actualData[i][6]),
      performance: toNumber(actualData[i][7]),
      repair: toNumber(actualData[i][13]),
      reject: toNumber(actualData[i][14]),
      outputs: actualData[i].slice(17, 27).map(toNumber),
      manPower: toNumber(actualData[i][28]),
      workingHour: toNumber(actualData[i][29]),
      manHour: toNumber(actualData[i][30]),
      produksi: toNumber(actualData[i][10]),
      mt: toNumber(actualData[i][9]),
      trainer: toNumber(actualData[i][11]),
      qc: toNumber(actualData[i][12]),
      problems: toString(actualData[i][27]).split(', '),
    };

    if (line.startsWith('T')) tprData.push(entry);
    if (line.startsWith('D')) dirbonData.push(entry);
  }

  return { tpr: tprData, dirbon: dirbonData };
}
