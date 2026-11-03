const SPREADSHEET_CONFIG = {
  tprDirbon: {
    spreadsheetId: '1t7IGaII6O-uvGXXZImQE8gxnXgXq2i0flef4YPuLxo8',
    sheetNames: {
      target: 'Target (DEV)',
      actual: 'Actual/Jam (DEV)',
      wip: 'WIP Data (DEV)',
      kanban: 'Kanban',
    },
  },
} as const satisfies Record<string, SpreadsheetConfig>;
