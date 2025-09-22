import type { ExportRow } from './passportExportRows';

type XlsxModule = typeof import('xlsx');
type JsPdfCtor = typeof import('jspdf').jsPDF;
type XlsxModuleWithUtils = XlsxModule & { utils: NonNullable<XlsxModule['utils']> };

let xlsxModulePromise: Promise<XlsxModuleWithUtils> | null = null;
let jsPdfCtorPromise: Promise<JsPdfCtor> | null = null;

const loadXlsxModule = async (): Promise<XlsxModuleWithUtils> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx').then(module => {
      const resolved = (module as { default?: XlsxModuleWithUtils }).default;
      const xlsx = (resolved ?? module) as XlsxModuleWithUtils;
      if (!xlsx.utils) {
        throw new Error('xlsx module is missing utils API');
      }
      return xlsx;
    });
  }
  return xlsxModulePromise;
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

const createExcelBlob = async (rows: ExportRow[]): Promise<Blob> => {
  const xlsx = await loadXlsxModule();
  const worksheet = xlsx.utils.aoa_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Паспорт');
  const arrayBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
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
