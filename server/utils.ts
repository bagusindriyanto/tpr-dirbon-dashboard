function toNumber(value: CellValue): number {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new Error('Nilai sel harus berupa angka');
  }
  const result = Number(value);
  if (!Number.isFinite(result)) {
    throw new Error(`Nilai angka tidak valid: ${value}`);
  }
  return result;
}

function toNullableNumber(value: CellValue): number | '' {
  if (typeof value === 'string' && value.trim() === '') {
    return '';
  }
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new Error('Nilai sel harus berupa angka');
  }
  const result = Number(value);
  if (!Number.isFinite(result)) {
    throw new Error(`Nilai angka tidak valid: ${value}`);
  }
  return result;
}

function toString(value: CellValue): string {
  const result = String(value);
  return result.trim();
}

function toDate(value: CellValue): Date {
  if (!(value instanceof Date)) {
    throw new Error('Nilai sel harus berupa tanggal');
  }

  return value;
}

const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';
const DATE_FORMAT = 'dd/MM/yyyy';
const DATE_KEY_FORMAT = 'yyyy-MM-dd';

function toDateTimeString(value: CellValue): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Nilai tanggal tidak valid');
    }
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      DATE_TIME_FORMAT,
    );
  }

  if (!value) {
    return '';
  }

  return String(value).trim();
}

function toDateString(value: CellValue): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Nilai tanggal tidak valid');
    }
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      DATE_FORMAT,
    );
  }

  if (!value) {
    return '';
  }

  return String(value).trim();
}

function toNumberOrZero(value: CellValue): number {
  const result = toNullableNumber(value);
  return result === '' ? 0 : result;
}

function toDateKey(value: CellValue): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Nilai tanggal tidak valid');
    }

    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      DATE_KEY_FORMAT,
    );
  }

  return toString(value);
}

function getShiftByTimestamp(timestamp: Date): Shift {
  const minute = timestamp.getMinutes();
  const hour = timestamp.getHours();
  const currentMinute = hour * 60 + minute;

  const lowerLimit = 6 * 60;
  const upperLimit = 19 * 60;

  return currentMinute >= lowerLimit && currentMinute < upperLimit ? '1' : '2';
}
