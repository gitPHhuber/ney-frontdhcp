import * as XLSX from 'xlsx';

import type { ExportRow } from './exportRows';

const createExcelBlob = (rows: ExportRow[]) => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Паспорт');

  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const triggerFileDownload = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};

export const downloadPassportWorkbook = (rows: ExportRow[], filename: string) => {
  const blob = createExcelBlob(rows);
  triggerFileDownload(blob, `${filename}.xlsx`);
};
