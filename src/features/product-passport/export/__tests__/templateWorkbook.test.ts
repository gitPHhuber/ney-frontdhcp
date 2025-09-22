import { describe, expect, it, vi } from 'vitest';

import type { PassportTemplate, ProductPassport } from '../../../../entities';
import { createWorkbookFromTemplate } from '../templateWorkbook';

const buildTemplate = (): PassportTemplate => ({
  id: 'tpl-test',
  deviceModelId: 'model-test',
  name: 'Тестовый шаблон',
  version: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
  fields: [
    {
      id: 'field-date',
      key: 'manufacturedAt',
      label: 'Дата производства',
      type: 'date',
      required: true,
    },
    {
      id: 'field-components',
      key: 'components',
      label: 'Комплектующие',
      type: 'table',
      minRows: 1,
      maxRows: 3,
      columns: [
        {
          id: 'col-name',
          key: 'name',
          title: 'Наименование',
          type: 'text',
        },
        {
          id: 'col-qty',
          key: 'qty',
          title: 'Кол-во',
          type: 'number',
        },
      ],
    },
  ],
  layout: {
    sheetName: 'Документ',
    columnWidths: { 2: 30, 3: 12 },
    rowHeights: { 5: 20 },
    staticCells: [
      {
        id: 'label-date',
        row: 4,
        col: 2,
        value: 'Дата произв.:',
        style: { font: { bold: true }, alignment: { horizontal: 'right', vertical: 'middle' } },
      },
    ],
    bindings: [
      {
        fieldKey: 'manufacturedAt',
        row: 4,
        col: 3,
        merge: { cols: 2 },
        style: { alignment: { horizontal: 'left', vertical: 'middle' }, numberFormat: 'dd.mm.yyyy' },
      },
    ],
    tables: [
      {
        fieldKey: 'components',
        row: 6,
        col: 2,
        drawHeader: true,
        showGrid: true,
        minRows: 1,
        maxRows: 3,
        fillEmptyRowsWithGrid: true,
        columns: [
          {
            id: 'col-name',
            key: 'name',
            title: 'Наименование',
            type: 'text',
            width: 30,
            style: { alignment: { horizontal: 'left', vertical: 'top', wrapText: true } },
            headerStyle: {
              font: { bold: true },
              alignment: { horizontal: 'center', vertical: 'middle' },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
              },
            },
          },
          {
            id: 'col-qty',
            key: 'qty',
            title: 'Кол-во',
            type: 'number',
            width: 10,
            style: { alignment: { horizontal: 'center', vertical: 'middle' }, numberFormat: '0' },
            headerStyle: {
              font: { bold: true },
              alignment: { horizontal: 'center', vertical: 'middle' },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
              },
            },
          },
        ],
        headerStyle: { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'middle' } },
        rowStyle: { alignment: { horizontal: 'left', vertical: 'top', wrapText: true } },
        gridStyle: { style: 'thin', color: '#000000' },
      },
    ],
  },
});

const buildPassport = (): ProductPassport => ({
  id: 'passport-test',
  deviceId: 'device-test',
  templateId: 'tpl-test',
  status: 'draft',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    assetTag: 'VG-01',
    modelName: 'Vegman Test',
    vendor: 'Vegman',
    serialNumber: 'SER-1',
    ipAddress: '10.0.0.1',
    location: 'Линия 1',
    owner: 'Команда QA',
  },
  schema: [],
  fieldValues: {
    manufacturedAt: '2024-05-01',
    components: [
      { name: 'Контроллер', qty: 1 },
      { name: 'Адаптер питания', qty: 2 },
    ],
  },
  attachments: [],
  history: [],
});

describe('createWorkbookFromTemplate', () => {
  it('renders styled cells, date formats and grid-aligned tables', async () => {
    const template = buildTemplate();
    const passport = buildPassport();

    const workbook = await createWorkbookFromTemplate(template, passport);
    const worksheet = workbook.getWorksheet('Документ');

    expect(worksheet).toBeDefined();
    const dateCell = worksheet!.getCell('C4') as MockCell;
    expect(dateCell.value).toBeInstanceOf(Date);
    expect(dateCell.numFmt).toBe('dd.mm.yyyy');

    const headerCell = worksheet!.getCell('B6') as MockCell;
    expect(headerCell.value).toBe('Наименование');
    expect((headerCell.border?.top as { style?: string })?.style).toBe('thin');

    const firstRowName = worksheet!.getCell('B7') as MockCell;
    const firstRowQty = worksheet!.getCell('C7') as MockCell;
    expect(firstRowName.value).toBe('Контроллер');
    expect(firstRowQty.value).toBe(1);
    expect(firstRowQty.numFmt).toBe('0');

    const emptyRow = worksheet!.getCell('B9') as MockCell;
    expect(emptyRow.value).toBe('');
    expect((emptyRow.border?.left as { style?: string })?.style).toBe('thin');
  });
});

class MockCell {
  value: unknown = '';
  font?: Record<string, unknown>;
  alignment?: Record<string, unknown>;
  border?: Record<string, unknown>;
  fill?: Record<string, unknown>;
  numFmt?: string;
}

class MockWorksheet {
  name: string;
  private cells = new Map<string, MockCell>();
  private columns = new Map<number, { width?: number }>();
  private rows = new Map<number, { height?: number }>();

  constructor(name: string) {
    this.name = name;
  }

  private resolveAddress(row: number | string, col?: number) {
    if (typeof row === 'string') {
      return row;
    }
    const columnLetter = String.fromCharCode(64 + (col ?? 1));
    return `${columnLetter}${row}`;
  }

  getCell(row: number | string, col?: number) {
    const address = this.resolveAddress(row, col);
    if (!this.cells.has(address)) {
      this.cells.set(address, new MockCell());
    }
    return this.cells.get(address)!;
  }

  getColumn(index: number) {
    if (!this.columns.has(index)) {
      this.columns.set(index, {});
    }
    return this.columns.get(index)!;
  }

  getRow(index: number) {
    if (!this.rows.has(index)) {
      this.rows.set(index, {});
    }
    return this.rows.get(index)!;
  }

  mergeCells() {
    // no-op for tests
  }
}

class MockWorkbook {
  worksheets: MockWorksheet[] = [];
  xlsx = {
    async writeBuffer() {
      return new ArrayBuffer(0);
    },
  };

  addWorksheet(name: string) {
    const worksheet = new MockWorksheet(name);
    this.worksheets.push(worksheet);
    return worksheet;
  }

  getWorksheet(name: string) {
    return this.worksheets.find(sheet => sheet.name === name);
  }
}

vi.mock('exceljs', () => ({
  Workbook: MockWorkbook,
  default: { Workbook: MockWorkbook },
}));
