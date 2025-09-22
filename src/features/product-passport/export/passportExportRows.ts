import type {
  DeviceHistoryEntry,
  ProductPassport,
} from '../../../entities';
import type { TemplateFieldValue, TemplateTableRow } from '../types';
import { formatPassportDateTime } from '../utils/date';

export type ExportRow = [string, string];

const formatFieldValue = (value: TemplateFieldValue | undefined) => {
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const rows = value as TemplateTableRow[];
      return rows
        .map((row, index) => {
          const entries = Object.values(row ?? {}).filter(cell => cell !== undefined && cell !== '');
          return `${index + 1}. ${entries.length > 0 ? entries.join(', ') : '—'}`;
        })
        .join('\n');
    }
    return (value as Array<string | number | boolean | string[]>).join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет';
  }
  if (value === undefined || value === '') {
    return '—';
  }
  return String(value);
};

const createPassportSummary = (passport: ProductPassport): ExportRow[] => [
  ['Паспорт изделия', `${passport.metadata.assetTag} (версия ${passport.version})`],
  ['Статус', passport.status === 'ready' ? 'Готов' : 'Черновик'],
  ['Дата обновления', formatPassportDateTime(passport.updatedAt)],
];

const createDeviceMetadataRows = (passport: ProductPassport): ExportRow[] => [
  ['Инвентарный номер', passport.metadata.assetTag],
  ['Модель', passport.metadata.modelName],
  ['Производитель', passport.metadata.vendor ?? '—'],
  ['Серийный номер', passport.metadata.serialNumber],
  ['IP-адрес', passport.metadata.ipAddress],
  ['Расположение', passport.metadata.location],
  ['Ответственный', passport.metadata.owner],
];

const createSchemaRows = (passport: ProductPassport): ExportRow[] =>
  passport.schema.map(field => [
    field.label,
    formatFieldValue(passport.fieldValues[field.key]),
  ]);

const createHistoryRows = (history: DeviceHistoryEntry[]): ExportRow[] =>
  history.map(entry => [
    formatPassportDateTime(entry.ts),
    `${entry.action}: ${entry.details} (${entry.actor})`,
  ]);

export const buildPassportExportRows = (
  passport: ProductPassport,
  history: DeviceHistoryEntry[],
): ExportRow[] => {
  const rows: ExportRow[] = [
    ...createPassportSummary(passport),
    ['', ''],
    ...createDeviceMetadataRows(passport),
    ['', ''],
    ['Поля шаблона', ''],
    ...createSchemaRows(passport),
    ['', ''],
    ['История устройства', ''],
    ...createHistoryRows(history),
  ];

  return rows;
};
