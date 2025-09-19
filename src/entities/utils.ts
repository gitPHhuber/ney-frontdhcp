export const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

let counter = 0;

export const generateId = (prefix: string) => {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter.toString(16)}`;
};
