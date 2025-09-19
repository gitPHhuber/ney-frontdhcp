const activeMarks = new Set<string>();

export const startMeasure = (label: string) => {
  if (typeof performance === 'undefined') return;
  const mark = `${label}-start`;
  activeMarks.add(label);
  performance.mark(mark);
};

export const endMeasure = (label: string) => {
  if (typeof performance === 'undefined') return;
  if (!activeMarks.has(label)) return;
  performance.mark(`${label}-end`);
  performance.measure(label, `${label}-start`, `${label}-end`);
  activeMarks.delete(label);
};

export const clearMeasures = () => {
  if (typeof performance === 'undefined') return;
  performance.clearMarks();
  performance.clearMeasures();
  activeMarks.clear();
};
