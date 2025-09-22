import type { Worksheet } from 'exceljs';
import type { ExportRow } from './passportExportRows';

type ExceljsModule = typeof import('exceljs');
type JsPdfCtor = typeof import('jspdf').jsPDF;

let exceljsModulePromise: Promise<ExceljsModule> | null = null;
let jsPdfCtorPromise: Promise<JsPdfCtor> | null = null;

const loadExceljsModule = async (): Promise<ExceljsModule> => {
  if (!exceljsModulePromise) {
    exceljsModulePromise = import('exceljs').then(module => {
      const resolved = (module as { default?: ExceljsModule }).default;
      const exceljs = (resolved ?? module) as ExceljsModule;
      if (!exceljs.Workbook) {
        throw new Error('exceljs module is missing Workbook constructor');
      }
      return exceljs;
    });
  }
  return exceljsModulePromise;
};

const loadJsPdfConstructor = async (): Promise<JsPdfCtor> => {
  if (!jsPdfCtorPromise) {
    jsPdfCtorPromise = import('jspdf').then(module => {
      const ctor = module.jsPDF ?? (module.default as JsPdfCtor | undefined);
      if (!ctor) {
        throw new Error('jsPDF constructor is unavailable');
      }
      return ctor;
    });
  }

  return jsPdfCtorPromise;
};

const resolveTemplateUrl = () => {
  const templateUrl = import.meta.env.VITE_VEGMAN_PASSPORT_TEMPLATE_URL;
  if (!templateUrl) {
    throw new Error(
      'Vegman passport template URL is not configured. Set VITE_VEGMAN_PASSPORT_TEMPLATE_URL to a reachable .xlsx template.',
    );
  }
  return templateUrl;
};
const DATA_START_ROW = 6;
const TEMPLATE_LAST_ROW = 150;
const LABEL_COLUMN = 'B';
const VALUE_COLUMN = 'D';

const fetchTemplateWorkbook = async (ExcelJS: ExceljsModule) => {
  const templateUrl = resolveTemplateUrl();
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Template is unavailable (${response.status})`);
  }
  const templateBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  return workbook;
};

const updateTimestamp = (worksheet: Worksheet) => {
  const labelCell = worksheet.getCell('E4');
  if (!labelCell.value) {
    labelCell.value = 'Дата выгрузки:';
  }
  labelCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF4F81BD' } };
  labelCell.alignment = { vertical: 'middle', horizontal: 'right' };

  const dateCell = worksheet.getCell('F4');
  dateCell.value = new Date();
  dateCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF4F81BD' } };
  dateCell.alignment = { vertical: 'middle', horizontal: 'left' };
  dateCell.numFmt = 'dd.mm.yyyy hh:mm';
};

const clearRemainingRows = (worksheet: Worksheet, fromRow: number) => {
  for (let rowIndex = fromRow; rowIndex <= TEMPLATE_LAST_ROW; rowIndex += 1) {
    const labelCell = worksheet.getCell(`${LABEL_COLUMN}${rowIndex}`);
    const valueCell = worksheet.getCell(`${VALUE_COLUMN}${rowIndex}`);
    if (labelCell.value || valueCell.value) {
      labelCell.value = '';
      valueCell.value = '';
    }
  }
};

const fillWorksheetWithRows = (worksheet: Worksheet, rows: ExportRow[]) => {
  rows.forEach(([label, value], index) => {
    const rowNumber = DATA_START_ROW + index;
    const labelCell = worksheet.getCell(`${LABEL_COLUMN}${rowNumber}`);
    const valueCell = worksheet.getCell(`${VALUE_COLUMN}${rowNumber}`);
    labelCell.value = label ?? '';
    valueCell.value = value ?? '';
  });

  const nextRow = DATA_START_ROW + rows.length;
  clearRemainingRows(worksheet, nextRow);
};

const createExcelBlob = async (rows: ExportRow[]): Promise<Blob> => {
  const ExcelJS = await loadExceljsModule();
  const workbook = await fetchTemplateWorkbook(ExcelJS);
  const worksheet = workbook.getWorksheet('Паспорт') ?? workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Template sheet is missing');
  }
  updateTimestamp(worksheet);
  fillWorksheetWithRows(worksheet, rows);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
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

export const downloadPassportWorkbook = async (rows: ExportRow[], filename: string) => {
  const blob = await createExcelBlob(rows);
  triggerFileDownload(blob, `${filename}.xlsx`);
};

export const downloadPassportPdf = async (rows: ExportRow[], filename: string) => {
  const JsPdfConstructor = await loadJsPdfConstructor();
  const doc = new JsPdfConstructor({ unit: 'pt', format: 'a4' });
  const marginLeft = 48;
  const marginTop = 56;
  let cursorY = marginTop;

  doc.setFontSize(16);
  doc.text(`Паспорт изделия ${filename}`, marginLeft, cursorY);
  cursorY += 24;

  const writeRow = (left: string, right: string) => {
    const text = right ? `${left}: ${right}` : left;
    const splitted = doc.splitTextToSize(text, 500);
    if (cursorY + splitted.length * 14 > 780) {
      doc.addPage();
      cursorY = marginTop;
    }
    doc.text(splitted, marginLeft, cursorY);
    cursorY += splitted.length * 14;
  };

  const addSpacing = (value: number) => {
    cursorY += value;
  };

  doc.setFontSize(11);
  rows.forEach(([left, right]) => {
    if (!left && !right) {
      addSpacing(12);
      return;
    }
    writeRow(left, right);
  });

  doc.save(`${filename}.pdf`);
};
