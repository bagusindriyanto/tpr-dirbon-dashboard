function createLookupKey({ line, shift, spo }: OutputKey): string {
  return JSON.stringify([line, shift, spo]);
}
