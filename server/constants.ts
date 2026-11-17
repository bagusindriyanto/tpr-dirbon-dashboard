// Script Properties memungkinkan project development dan production memakai
// spreadsheet berbeda tanpa mengubah kode. Nilai fallback di bawah ini hanya
// jaring pengaman; isi ketiga property di masing-masing project Apps Script
// (Project Settings > Script Properties) agar environment tidak ambigu.
const SPREADSHEET_ID_PROPERTIES = {
  tprDirbon: 'TPR_DIRBON_SPREADSHEET_ID',
  distribusi: 'DISTRIBUSI_SPREADSHEET_ID',
} as const;

type SpreadsheetArea = keyof typeof SPREADSHEET_ID_PROPERTIES;

function getSpreadsheetId(area: SpreadsheetArea, fallback: string): string {
  const value = PropertiesService.getScriptProperties()
    .getProperty(SPREADSHEET_ID_PROPERTIES[area])
    ?.trim();
  return value || fallback;
}

const PRODUCTION_HOURS = 10;

const SPREADSHEET_CONFIG = {
  tprDirbon: {
    spreadsheetId: getSpreadsheetId(
      'tprDirbon',
      '1ky7rSxy20KQJ3zcZw0mVY4qE48G6CKAjAbb3zybEmKk',
    ),
    sheetNames: {
      target: 'Target (DEV)',
      actual: 'Actual/Jam (DEV)',
      wip: 'WIP Data (DEV)',
      kanban: 'Kanban',
      schedule: 'Jam',
    },
  },
  distribusi: {
    spreadsheetId: getSpreadsheetId(
      'distribusi',
      '1cuvYoqjCdgSOBNAO_bGDlkNOcbi_a0FemqtvFqYrtCE',
    ),
    sheetNames: {
      supply: 'Sheet1',
    },
  },
} as const satisfies Record<SpreadsheetArea, SpreadsheetConfig>;

/**
 * Jalankan manual dari editor Apps Script untuk memastikan project yang aktif
 * membaca spreadsheet yang benar sebelum testing atau deploy.
 */
function checkSpreadsheetEnvironment(): void {
  const areas: SpreadsheetArea[] = ['tprDirbon', 'distribusi'];
  const properties = PropertiesService.getScriptProperties();

  for (const area of areas) {
    const property = SPREADSHEET_ID_PROPERTIES[area];
    const source = properties.getProperty(property) ? property : 'fallback';
    Logger.log(
      `${area}: ${SPREADSHEET_CONFIG[area].spreadsheetId} (${source})`,
    );

    try {
      const spreadsheet = SpreadsheetApp.openById(
        SPREADSHEET_CONFIG[area].spreadsheetId,
      );
      const sheetNames: string[] = Object.values(
        SPREADSHEET_CONFIG[area].sheetNames,
      );
      const missingSheets = sheetNames.filter(
        (name) => !spreadsheet.getSheetByName(name),
      );

      Logger.log(`  nama file: ${spreadsheet.getName()}`);
      if (missingSheets.length)
        Logger.log(`  sheet tidak ditemukan: ${missingSheets.join(', ')}`);
    } catch (error) {
      Logger.log(`  gagal dibuka: ${errorMessage(error)}`);
    }
  }
}
