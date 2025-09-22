import type { PassportTemplate } from '../../../entities';
import type { ProductPassport } from '../../../entities/product-passport/types';
import type { ExportRow } from './passportExportRows';
import { createWorkbookFromTemplate } from './templateWorkbook';

type JsPdfCtor = typeof import('jspdf').jsPDF;

let jsPdfCtorPromise: Promise<JsPdfCtor> | null = null;

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]+/g;

const normalizeFilenameSegment = (value: string) =>
  value
    .trim()
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, '_');

const ensureSafeFilename = (value: string, fallback = 'passport') => {
  const normalized = normalizeFilenameSegment(value);
  return normalized || fallback;
};

const extractSerialValue = (passport: ProductPassport) => {
  const candidates = ['serial', 'serialNumber'];
  for (const key of candidates) {
    const raw = passport.fieldValues[key];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
    if (typeof raw === 'number') {
      return String(raw);
    }
  }
  return passport.metadata.serialNumber?.trim() ?? '';
};

export const buildPassportFilename = (
  template: PassportTemplate | null,
  passport: ProductPassport,
) => {
  if (template?.fileNamePattern) {
    const serialRaw = extractSerialValue(passport);
    const safeSerial = ensureSafeFilename(serialRaw, 'без_серийника');
    const patternResult = template.fileNamePattern.replace('{serial}', safeSerial);
    return ensureSafeFilename(patternResult, `passport_${passport.version}`);
  }
  const base = `${passport.metadata.assetTag || 'passport'}-паспорт-v${passport.version}`;
  return ensureSafeFilename(base);
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

const triggerFileDownload = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};

export const downloadPassportWorkbook = async (
  template: PassportTemplate,
  passport: ProductPassport,
  filename: string,
) => {
  const workbook = await createWorkbookFromTemplate(template, passport);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeName = ensureSafeFilename(filename);
  triggerFileDownload(blob, `${safeName}.xlsx`);
};

export const downloadPassportPdf = async (rows: ExportRow[], filename: string) => {
  const JsPdfConstructor = await loadJsPdfConstructor();
  const doc = new JsPdfConstructor({ unit: 'pt', format: 'a4' });
  const marginLeft = 48;
  const marginTop = 56;
  let cursorY = marginTop;

  const safeName = ensureSafeFilename(filename);

  doc.setFontSize(16);
  doc.text(`Паспорт изделия ${safeName}`, marginLeft, cursorY);
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

  doc.save(`${safeName}.pdf`);
};
