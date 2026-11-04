const SPREADSHEET_CONFIG = {
  tprDirbon: {
    spreadsheetId: '1ky7rSxy20KQJ3zcZw0mVY4qE48G6CKAjAbb3zybEmKk',
    sheetNames: {
      target: 'Target (DEV)',
      actual: 'Actual/Jam (DEV)',
      wip: 'WIP Data (DEV)',
      kanban: 'Kanban',
    },
  },
  distribusi: {
    spreadsheetId: '1cuvYoqjCdgSOBNAO_bGDlkNOcbi_a0FemqtvFqYrtCE',
    sheetNames: {
      supply: 'Sheet1',
    },
  },
} as const satisfies Record<string, SpreadsheetConfig>;
