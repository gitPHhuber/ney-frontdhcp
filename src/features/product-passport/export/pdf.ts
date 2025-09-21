import type { ExportRow } from './exportRows';

type JsPdfCtor = typeof import('jspdf').jsPDF;

let cachedConstructor: JsPdfCtor | undefined;

const loadJsPdfConstructor = async () => {
  if (cachedConstructor) {
    return cachedConstructor;
  }

  const module = await import('jspdf');
  const ctor = module.jsPDF ?? (module.default as JsPdfCtor | undefined);

  if (!ctor) {
    throw new Error('jsPDF constructor is unavailable');
  }

  cachedConstructor = ctor;

  return ctor;
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
