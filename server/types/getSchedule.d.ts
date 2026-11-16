type Schedule = {
  /** 0 = belum masuk jam produksi/tidak dijadwalkan, 1..10 = jam produksi. */
  currentHour: number;
  /** Hari produksi: 1=Senin ... 7=Minggu. */
  currentDay: number;
  currentShift: Shift;
};
