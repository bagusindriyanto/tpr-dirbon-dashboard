const SPREADSHEET_CONFIG = {
  tprDirbon: {
    spreadsheetId: '1ky7rSxy20KQJ3zcZw0mVY4qE48G6CKAjAbb3zybEmKk',
    sheetNames: {
      plan: 'Plan',
      actual: 'Actual',
      wip: 'WIP',
      kanban: 'Kanban',
    },
  },
} as const satisfies Record<string, SpreadsheetConfig>;
