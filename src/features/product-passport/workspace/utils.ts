import type {
  DeviceModel,
  PassportTemplateField,
  ProductPassport,
  TemplatePrimitiveFieldType,
} from '../../../entities';
import type { TemplateFieldValue } from '../types';
import type { DeviceFormValues, TemplateFieldDraft } from './types';

export const createSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-');

export const generateTempId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

export const createBlankFieldDraft = (): TemplateFieldDraft => ({
  id: generateTempId(),
  label: 'Наименование узла',
  key: 'nodeName',
  type: 'text',
  required: true,
  options: '',
  columns: [
    {
      id: generateTempId(),
      title: 'Столбец',
      key: 'columnKey',
      type: 'text',
    },
  ],
});

export const normalizeFieldDraft = (draft: TemplateFieldDraft): PassportTemplateField => {
  const key = draft.key || createSlug(draft.label) || draft.id;
  if (draft.type === 'table') {
    return {
      id: draft.id,
      key,
      label: draft.label,
      type: 'table',
      minRows: draft.minRows,
      maxRows: draft.maxRows,
          columns: draft.columns
            .filter(column => column.title.trim())
            .map(column => ({
              id: column.id,
              title: column.title,
              key: column.key || createSlug(column.title) || column.id,
              type: column.type ?? 'text',
            })),
    };
  }
  return {
    id: draft.id,
    key,
    label: draft.label,
    type: draft.type,
    required: draft.required,
    placeholder: draft.placeholder,
    defaultValue: draft.type === 'number' ? Number(draft.defaultValue) : draft.defaultValue,
    options:
      draft.type === 'select'
        ? draft.options
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
            .map(item => ({ label: item, value: createSlug(item) }))
        : undefined,
  };
};

export const createDefaultDeviceFormValues = (models: DeviceModel[]): DeviceFormValues => ({
  assetTag: '',
  deviceModelId: models[0]?.id ?? '',
  serialNumber: '',
  ipAddress: '',
  location: '',
  owner: '',
  status: 'in_service',
  historyNote: '',
});

export const getMissingRequired = (
  schema: PassportTemplateField[],
  values: Record<string, TemplateFieldValue>,
) =>
  schema
    .filter(field => field.required)
    .filter(field => {
      const value = values[field.key];
      if (field.type === 'checkbox') {
        return value !== true;
      }
      if (field.type === 'table') {
        return !Array.isArray(value) || value.length === 0;
      }
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === undefined || value === '';
    })
    .map(field => field.label);

export const buildDetailDefaults = (passport: ProductPassport): Record<string, TemplateFieldValue> => {
  const defaults: Record<string, TemplateFieldValue> = {};
  passport.schema.forEach(field => {
    const value = passport.fieldValues[field.key];
    if (value !== undefined) {
      defaults[field.key] = value;
      return;
    }
    if (field.defaultValue !== undefined) {
      defaults[field.key] = field.defaultValue;
      return;
    }
    if (field.type === 'checkbox') {
      defaults[field.key] = false;
      return;
    }
    if (field.type === 'table') {
      defaults[field.key] = [];
      return;
    }
    defaults[field.key] = '';
  });
  return defaults;
};

