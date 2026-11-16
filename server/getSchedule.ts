function getWeekdayNumber_(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

// Sel "Hari Ke-" pada sheet Jam sudah memperhitungkan shift 2 yang melewati
// tengah malam, sehingga tanggal produksi bisa jatuh pada hari berikutnya.
function getScheduleDateKey_(schedule: Schedule, now: Date): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rollsToTomorrow =
    schedule.currentShift === '2' &&
    schedule.currentDay === getWeekdayNumber_(tomorrow);

  return toDateKey(rollsToTomorrow ? tomorrow : today);
}

function readCurrentSchedule_(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
): Schedule {
  const data: CellValue[] = sheet.getRange(2, 2, 1, 3).getValues()[0];
  const currentHour = toNumber(data[0]);
  const currentDay = toNumber(data[1]);
  const currentShift = toNumber(data[2]);

  if (
    !Number.isInteger(currentHour) ||
    currentHour < 0 ||
    currentHour > PRODUCTION_HOURS
  ) {
    throw new Error(
      `Jam ke- pada sheet '${sheet.getName()}' tidak valid: ${currentHour}`,
    );
  }

  if (!Number.isInteger(currentDay) || currentDay < 1 || currentDay > 7) {
    throw new Error(
      `Hari ke- pada sheet '${sheet.getName()}' tidak valid: ${currentDay}`,
    );
  }

  if (currentShift !== 1 && currentShift !== 2) {
    throw new Error(
      `Shift pada sheet '${sheet.getName()}' tidak valid: ${currentShift}`,
    );
  }

  return {
    currentHour,
    currentDay,
    currentShift: currentShift === 1 ? '1' : '2',
  };
}

function getCurrentSchedule(): Schedule {
  const {
    tprDirbon: { spreadsheetId, sheetNames },
  } = SPREADSHEET_CONFIG;

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetNames.schedule);

  if (!sheet) {
    throw new Error(`Sheet '${sheetNames.schedule}' tidak tersedia.`);
  }

  return readCurrentSchedule_(sheet);
}
