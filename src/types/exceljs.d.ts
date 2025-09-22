declare module 'exceljs' {
  export class Cell {
    value: unknown;
    font?: Record<string, unknown>;
    alignment?: Record<string, unknown>;
    border?: Record<string, unknown>;
    fill?: Record<string, unknown>;
  }

  export class Worksheet {
    name: string;
    getCell(row: number | string, col?: number): Cell;
    getColumn(index: number): { width?: number };
    getRow(index: number): { height?: number };
    mergeCells(startRow: number, startCol: number, endRow: number, endCol: number): void;
  }

  export class Workbook {
    worksheets: Worksheet[];
    addWorksheet(name: string, options?: { properties?: Record<string, unknown>; pageSetup?: Record<string, unknown> }): Worksheet;
    getWorksheet(name: string): Worksheet | undefined;
    readonly xlsx: {
      writeBuffer(): Promise<ArrayBuffer>;
    };
  }

  const exceljs: {
    Workbook: typeof Workbook;
  };

  export default exceljs;
}
