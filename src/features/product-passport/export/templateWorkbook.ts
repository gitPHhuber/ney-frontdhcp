import type {
  PassportTemplate,
  PassportTemplateField,
  PassportTemplateLayout,
  TemplateCellStyle,
  TemplateFieldBinding,
  TemplateFieldValue,
  TemplateStaticCell,
  TemplateTableSection,
  TemplateTableRow,
} from '../../../entities';
import type { ProductPassport } from '../../../entities/product-passport/types';

type ExcelCell = {
  value: unknown;
  font?: Record<string, unknown>;
  alignment?: Record<string, unknown>;
  border?: Record<string, unknown>;
  fill?: Record<string, unknown>;
  numFmt?: string;
};

type ExcelWorksheet = {
  getCell(row: number | string, col?: number): ExcelCell;
  mergeCells(startRow: number, startCol: number, endRow: number, endCol: number): void;
  getColumn(index: number): { width?: number };
  getRow(index: number): { height?: number };
};

type ExcelWorkbook = {
  worksheets: ExcelWorksheet[];
  addWorksheet(
    name: string,
    options?: { properties?: Record<string, unknown>; pageSetup?: Record<string, unknown> },
  ): ExcelWorksheet;
  getWorksheet(name: string): ExcelWorksheet | undefined;
  readonly xlsx: {
    writeBuffer(): Promise<ArrayBuffer>;
  };
};

type ExceljsModule = {
  Workbook: new () => ExcelWorkbook;
};

const isTableField = (field: PassportTemplateField): field is Extract<PassportTemplateField, { type: 'table' }> =>
  field.type === 'table';

const toExcelColor = (color?: string) => {
  if (!color) {
    return undefined;
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return hex.length === 6 ? `FF${hex.toUpperCase()}` : hex.toUpperCase();
  }
  if (color.length === 6) {
    return `FF${color.toUpperCase()}`;
  }
  if (color.length === 8) {
    return color.toUpperCase();
  }
  return undefined;
};

const applyCellStyle = (cell: ExcelCell, style?: TemplateCellStyle) => {
  if (!style) {
    return;
  }
  if (style.font) {
    cell.font = {
      name: style.font.name,
      size: style.font.size,
      bold: style.font.bold,
      italic: style.font.italic,
      underline: style.font.underline,
      color: style.font.color ? { argb: toExcelColor(style.font.color) } : undefined,
    };
  }
  if (style.alignment) {
    cell.alignment = {
      horizontal: style.alignment.horizontal,
      vertical: style.alignment.vertical,
      wrapText: style.alignment.wrapText,
    };
  }
  if (style.border) {
    const convertBorder = (border?: { style?: string; color?: string }) =>
      border
        ? {
            style: border.style,
            color: border.color ? { argb: toExcelColor(border.color) } : undefined,
          }
        : undefined;
    cell.border = {
      top: convertBorder(style.border.top),
      bottom: convertBorder(style.border.bottom),
      left: convertBorder(style.border.left),
      right: convertBorder(style.border.right),
    };
  }
  if (style.fillColor) {
    const color = toExcelColor(style.fillColor);
    if (color) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };
    }
  }
  if (style.numberFormat) {
    cell.numFmt = style.numberFormat;
  }
};

const mergeIfNeeded = (worksheet: ExcelWorksheet, cell: TemplateStaticCell | TemplateFieldBinding) => {
  if (!cell.merge) {
    return;
  }
  const rows = Math.max(1, cell.merge.rows ?? 1);
  const cols = Math.max(1, cell.merge.cols ?? 1);
  if (rows > 1 || cols > 1) {
    worksheet.mergeCells(cell.row, cell.col, cell.row + rows - 1, cell.col + cols - 1);
  }
};

const formatValue = (field: PassportTemplateField, value: TemplateFieldValue | undefined): string | number | Date | boolean => {
  if (value === undefined || value === null) {
    return '';
  }
  if (isTableField(field)) {
    return '';
  }
  if (field.type === 'date') {
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? value : new Date(parsed);
    }
    if (value instanceof Date) {
      return value;
    }
  }
  if (field.type === 'number') {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    }
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value as string | number | boolean;
};

const applyStaticCells = (worksheet: ExcelWorksheet, cells: TemplateStaticCell[] = []) => {
  cells.forEach(cell => {
    const excelCell = worksheet.getCell(cell.row, cell.col);
    excelCell.value = cell.value;
    applyCellStyle(excelCell, cell.style);
    mergeIfNeeded(worksheet, cell);
  });
};

const applyFieldBindings = (
  worksheet: ExcelWorksheet,
  fields: PassportTemplateField[],
  bindings: TemplateFieldBinding[] = [],
  values: Record<string, TemplateFieldValue>,
) => {
  bindings.forEach(binding => {
    const field = fields.find(item => item.key === binding.fieldKey);
    if (!field) {
      return;
    }
    const value = values[field.key];
    const excelCell = worksheet.getCell(binding.row, binding.col);
    const formatted = formatValue(field, value);
    excelCell.value = binding.prefix ? `${binding.prefix}${formatted ?? ''}` : formatted;
    applyCellStyle(excelCell, binding.style);
    mergeIfNeeded(worksheet, binding);
  });
};

const applyTableSection = (
  worksheet: ExcelWorksheet,
  section: TemplateTableSection,
  field: Extract<PassportTemplateField, { type: 'table' }>,
  rowsValue: TemplateFieldValue | undefined,
) => {
  if (!Array.isArray(rowsValue)) {
    return;
  }
  const rows = rowsValue as TemplateTableRow[];
  const minRows = section.minRows ?? field.minRows ?? 0;
  const maxRows = section.maxRows ?? field.maxRows ?? undefined;
  const headerRowIndex = section.row;
  const startRow = section.drawHeader ? headerRowIndex + 1 : headerRowIndex;
  const shouldFillEmpty = (section.fillEmptyRowsWithGrid ?? true) && section.showGrid;
  const gridBorder =
    section.showGrid && section.gridStyle
      ? {
          style: section.gridStyle.style,
          color: section.gridStyle.color ? { argb: toExcelColor(section.gridStyle.color) } : undefined,
        }
      : null;

  if (section.drawHeader) {
    section.columns.forEach((column, index) => {
      if (column.width) {
        worksheet.getColumn(section.col + index).width = column.width;
      }
      const cell = worksheet.getCell(headerRowIndex, section.col + index);
      cell.value = column.title;
      applyCellStyle(cell, column.headerStyle ?? section.headerStyle);
      if (gridBorder) {
        cell.border = {
          top: gridBorder,
          bottom: gridBorder,
          left: gridBorder,
          right: gridBorder,
        };
      }
    });
  }

  const effectiveRows = Math.max(rows.length, minRows);
  const limitedRows = maxRows ? Math.min(effectiveRows, maxRows) : effectiveRows;
  const totalRows = shouldFillEmpty && maxRows ? maxRows : limitedRows;

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    const rowValue = rows[rowIndex] ?? {};
    section.columns.forEach((column, columnIndex) => {
      if (column.width) {
        worksheet.getColumn(section.col + columnIndex).width = column.width;
      }
      const cell = worksheet.getCell(startRow + rowIndex, section.col + columnIndex);
      const raw = rowValue[column.key];
      if (Array.isArray(raw)) {
        cell.value = raw.join(', ');
      } else {
        cell.value = raw ?? '';
      }
      applyCellStyle(cell, column.style ?? section.rowStyle);
      if (gridBorder) {
        cell.border = {
          top: gridBorder,
          bottom: gridBorder,
          left: gridBorder,
          right: gridBorder,
        };
      }
    });
  }
};

const applyTables = (
  worksheet: ExcelWorksheet,
  fields: PassportTemplateField[],
  tables: TemplateTableSection[] = [],
  values: Record<string, TemplateFieldValue>,
) => {
  tables.forEach(section => {
    const field = fields.find(item => item.key === section.fieldKey);
    if (!field || !isTableField(field)) {
      return;
    }
    applyTableSection(worksheet, section, field, values[field.key]);
  });
};

const configureDimensions = (worksheet: ExcelWorksheet, layout: PassportTemplateLayout) => {
  if (layout.columnWidths) {
    Object.entries(layout.columnWidths).forEach(([index, width]) => {
      const numericIndex = Number(index);
      if (!Number.isNaN(numericIndex)) {
        worksheet.getColumn(numericIndex).width = width;
      }
    });
  }
  if (layout.rowHeights) {
    Object.entries(layout.rowHeights).forEach(([index, height]) => {
      const numericIndex = Number(index);
      if (!Number.isNaN(numericIndex)) {
        worksheet.getRow(numericIndex).height = height;
      }
    });
  }
};

export const populateWorksheetFromLayout = (
  worksheet: ExcelWorksheet,
  template: PassportTemplate,
  passport: ProductPassport,
) => {
  const layout = template.layout;
  if (!layout) {
    throw new Error('Template layout is not defined');
  }
  configureDimensions(worksheet, layout);
  applyStaticCells(worksheet, layout.staticCells);
  applyFieldBindings(worksheet, template.fields, layout.bindings, passport.fieldValues);
  applyTables(worksheet, template.fields, layout.tables, passport.fieldValues);
};

let excelModulePromise: Promise<ExceljsModule> | null = null;

const loadExcelModule = async () => {
  if (!excelModulePromise) {
    excelModulePromise = import('exceljs').then(mod => {
      const candidate = ((mod as unknown) as { default?: ExceljsModule }).default ?? (mod as unknown as ExceljsModule);
      if (!candidate || !candidate.Workbook) {
        throw new Error('exceljs module missing Workbook export');
      }
      return candidate;
    });
  }
  return excelModulePromise;
};

export const createWorkbookFromTemplate = async (
  template: PassportTemplate,
  passport: ProductPassport,
): Promise<ExcelWorkbook> => {
  if (!template.layout) {
    throw new Error('Template layout is required to build workbook');
  }
  const ExcelJS = await loadExcelModule();
  const workbook = new ExcelJS.Workbook();
  const sheetName = template.layout.sheetName || 'Паспорт';
  const worksheet = workbook.addWorksheet(sheetName, {
    properties: { defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  });
  populateWorksheetFromLayout(worksheet, template, passport);
  return workbook;
};

