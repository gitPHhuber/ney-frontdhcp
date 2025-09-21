import * as XLSXModule from 'xlsx/xlsx.mjs';

const XLSX = XLSXModule as typeof import('xlsx');

export default XLSX;
export type * from 'xlsx';
