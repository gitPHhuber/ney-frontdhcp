import { enterpriseState } from '../state';
import { deepClone, generateId } from '../utils';
import type {
  DeviceHistoryEntry,
  DeviceModel,
  NetworkDevice,
  PassportAttachment,
  PassportTemplate,
  PassportTemplateField,
  ProductPassport,
  TemplateFieldValue,
  TemplateTableRow,
} from './types';

const getState = () => enterpriseState.passports;

const cloneFields = (fields: PassportTemplateField[]): PassportTemplateField[] =>
  fields.map(field => {
    if (field.type === 'table') {
      return {
        ...field,
        columns: field.columns.map(column => ({ ...column })),
      };
    }
    return {
      ...field,
      options: field.options ? field.options.map(option => ({ ...option })) : undefined,
    };
  });

const cloneLayout = (layout: PassportTemplate['layout']): PassportTemplate['layout'] => {
  if (!layout) {
    return undefined;
  }
  return {
    sheetName: layout.sheetName,
    columnWidths: layout.columnWidths ? { ...layout.columnWidths } : undefined,
    rowHeights: layout.rowHeights ? { ...layout.rowHeights } : undefined,
    staticCells: layout.staticCells?.map(cell => ({
      ...cell,
      merge: cell.merge ? { ...cell.merge } : undefined,
      style: cell.style
        ? {
            ...cell.style,
            font: cell.style.font ? { ...cell.style.font } : undefined,
            alignment: cell.style.alignment ? { ...cell.style.alignment } : undefined,
            border: cell.style.border
              ? {
                  top: cell.style.border.top ? { ...cell.style.border.top } : undefined,
                  bottom: cell.style.border.bottom ? { ...cell.style.border.bottom } : undefined,
                  left: cell.style.border.left ? { ...cell.style.border.left } : undefined,
                  right: cell.style.border.right ? { ...cell.style.border.right } : undefined,
                }
              : undefined,
            numberFormat: cell.style.numberFormat,
          }
        : undefined,
    })),
    bindings: layout.bindings?.map(binding => ({
      ...binding,
      merge: binding.merge ? { ...binding.merge } : undefined,
      style: binding.style
        ? {
            ...binding.style,
            font: binding.style.font ? { ...binding.style.font } : undefined,
            alignment: binding.style.alignment ? { ...binding.style.alignment } : undefined,
            border: binding.style.border
              ? {
                  top: binding.style.border.top ? { ...binding.style.border.top } : undefined,
                  bottom: binding.style.border.bottom ? { ...binding.style.border.bottom } : undefined,
                  left: binding.style.border.left ? { ...binding.style.border.left } : undefined,
                  right: binding.style.border.right ? { ...binding.style.border.right } : undefined,
                }
              : undefined,
            numberFormat: binding.style.numberFormat,
          }
        : undefined,
    })),
    tables: layout.tables?.map(table => ({
      ...table,
      fillEmptyRowsWithGrid: table.fillEmptyRowsWithGrid,
      columns: table.columns.map(column => ({
        ...column,
        style: column.style
          ? {
              ...column.style,
              font: column.style.font ? { ...column.style.font } : undefined,
              alignment: column.style.alignment ? { ...column.style.alignment } : undefined,
              border: column.style.border
                ? {
                    top: column.style.border.top ? { ...column.style.border.top } : undefined,
                    bottom: column.style.border.bottom ? { ...column.style.border.bottom } : undefined,
                    left: column.style.border.left ? { ...column.style.border.left } : undefined,
                    right: column.style.border.right ? { ...column.style.border.right } : undefined,
                  }
                : undefined,
              numberFormat: column.style.numberFormat,
            }
          : undefined,
        headerStyle: column.headerStyle
          ? {
              ...column.headerStyle,
              font: column.headerStyle.font ? { ...column.headerStyle.font } : undefined,
              alignment: column.headerStyle.alignment ? { ...column.headerStyle.alignment } : undefined,
              border: column.headerStyle.border
                ? {
                    top: column.headerStyle.border.top ? { ...column.headerStyle.border.top } : undefined,
                    bottom: column.headerStyle.border.bottom ? { ...column.headerStyle.border.bottom } : undefined,
                    left: column.headerStyle.border.left ? { ...column.headerStyle.border.left } : undefined,
                    right: column.headerStyle.border.right ? { ...column.headerStyle.border.right } : undefined,
                  }
                : undefined,
              numberFormat: column.headerStyle.numberFormat,
            }
          : undefined,
      })),
      headerStyle: table.headerStyle
        ? {
            ...table.headerStyle,
            font: table.headerStyle.font ? { ...table.headerStyle.font } : undefined,
            alignment: table.headerStyle.alignment ? { ...table.headerStyle.alignment } : undefined,
            border: table.headerStyle.border
              ? {
                  top: table.headerStyle.border.top ? { ...table.headerStyle.border.top } : undefined,
                  bottom: table.headerStyle.border.bottom ? { ...table.headerStyle.border.bottom } : undefined,
                  left: table.headerStyle.border.left ? { ...table.headerStyle.border.left } : undefined,
                  right: table.headerStyle.border.right ? { ...table.headerStyle.border.right } : undefined,
                }
              : undefined,
            numberFormat: table.headerStyle.numberFormat,
          }
        : undefined,
      rowStyle: table.rowStyle
        ? {
            ...table.rowStyle,
            font: table.rowStyle.font ? { ...table.rowStyle.font } : undefined,
            alignment: table.rowStyle.alignment ? { ...table.rowStyle.alignment } : undefined,
            border: table.rowStyle.border
              ? {
                  top: table.rowStyle.border.top ? { ...table.rowStyle.border.top } : undefined,
                  bottom: table.rowStyle.border.bottom ? { ...table.rowStyle.border.bottom } : undefined,
                  left: table.rowStyle.border.left ? { ...table.rowStyle.border.left } : undefined,
                  right: table.rowStyle.border.right ? { ...table.rowStyle.border.right } : undefined,
                }
              : undefined,
            numberFormat: table.rowStyle.numberFormat,
          }
        : undefined,
      gridStyle: table.gridStyle ? { ...table.gridStyle } : undefined,
    })),
  };
};

const findDeviceModel = (deviceModelId: string): DeviceModel | undefined =>
  getState().deviceModels.find(model => model.id === deviceModelId);

const findDevice = (deviceId: string): NetworkDevice | undefined =>
  getState().devices.find(device => device.id === deviceId);

const deriveMetadataFromDevice = (device: NetworkDevice) => {
  const model = findDeviceModel(device.deviceModelId);
  return {
    assetTag: device.assetTag,
    modelName: model?.name ?? 'Неизвестная модель',
    vendor: model?.vendor,
    serialNumber: device.serialNumber,
    ipAddress: device.ipAddress,
    location: device.location,
    owner: device.owner,
  };
};

const ensureHistoryMap = (deviceId: string) => {
  const state = getState();
  if (!state.deviceHistory[deviceId]) {
    state.deviceHistory[deviceId] = [];
  }
  return state.deviceHistory[deviceId];
};

const resolveAutofillValue = (
  fieldKey: string,
  device: NetworkDevice,
  metadata: ProductPassport['metadata'],
): TemplateFieldValue | undefined => {
  switch (fieldKey) {
    case 'assetTag':
    case 'inventoryNumber':
      return metadata.assetTag;
    case 'productName':
    case 'model':
    case 'modelName':
      return metadata.modelName;
    case 'serialNumber':
    case 'serial':
      return metadata.serialNumber;
    case 'sku':
    case 'article':
      return device.assetTag;
    case 'location':
      return metadata.location;
    case 'ipAddress':
      return metadata.ipAddress;
    case 'owner':
    case 'responsible':
      return metadata.owner;
    default:
      return undefined;
  }
};

const applyAutofill = (
  schema: PassportTemplateField[],
  device: NetworkDevice,
  metadata: ProductPassport['metadata'],
  values: Record<string, TemplateFieldValue>,
) => {
  schema.forEach(field => {
    if (field.type === 'table') {
      return;
    }
    if (values[field.key] !== undefined) {
      return;
    }
    const autofilled = resolveAutofillValue(field.key, device, metadata);
    if (autofilled !== undefined) {
      values[field.key] = autofilled;
    }
  });
  return values;
};

const nextTemplateVersion = (deviceModelId: string): number => {
  const state = getState();
  const versions = state.templates
    .filter(template => template.deviceModelId === deviceModelId)
    .map(template => template.version);
  return versions.length > 0 ? Math.max(...versions) + 1 : 1;
};

const nextPassportVersion = (deviceId: string): number => {
  const state = getState();
  const versions = state.passports.filter(passport => passport.deviceId === deviceId).map(p => p.version);
  return versions.length > 0 ? Math.max(...versions) + 1 : 1;
};

const markTemplateActive = (deviceModelId: string, templateId: string) => {
  const state = getState();
  state.templates.forEach(template => {
    if (template.deviceModelId === deviceModelId) {
      template.isActive = template.id === templateId;
      template.status = template.isActive ? 'published' : template.status ?? 'draft';
    }
  });
};

const hydratePassport = (passport: ProductPassport): ProductPassport => ({
  ...passport,
  schema: cloneFields(passport.schema),
  attachments: passport.attachments.map(attachment => ({ ...attachment })),
  history: passport.history.map(entry => ({ ...entry })),
});

export const productPassportRepository = {
  async listDevices(query?: string): Promise<NetworkDevice[]> {
    const state = getState();
    const normalizedQuery = query?.trim().toLowerCase();
    const devices = normalizedQuery
      ? state.devices.filter(device => {
          const haystack = [
            device.assetTag,
            device.serialNumber,
            device.ipAddress,
            device.owner,
            device.location,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        })
      : state.devices;
    return deepClone(devices);
  },
  async searchDevices(filters: {
    assetTag?: string;
    deviceModelId?: string;
    serialNumber?: string;
    ipAddress?: string;
    status?: string;
  }): Promise<NetworkDevice[]> {
    const state = getState();
    const results = state.devices.filter(device => {
      if (filters.assetTag && !device.assetTag.toLowerCase().includes(filters.assetTag.toLowerCase())) {
        return false;
      }
      if (filters.deviceModelId && device.deviceModelId !== filters.deviceModelId) {
        return false;
      }
      if (filters.serialNumber && !device.serialNumber.toLowerCase().includes(filters.serialNumber.toLowerCase())) {
        return false;
      }
      if (filters.ipAddress && !device.ipAddress.toLowerCase().includes(filters.ipAddress.toLowerCase())) {
        return false;
      }
      if (filters.status && device.status !== filters.status) {
        return false;
      }
      return true;
    });
    return deepClone(results);
  },
  async createDevice(payload: Omit<NetworkDevice, 'id'> & { historyNote?: string }): Promise<NetworkDevice> {
    const state = getState();
    const newDevice: NetworkDevice = { ...payload, id: generateId('device') };
    state.devices.push(newDevice);
    ensureHistoryMap(newDevice.id).push({
      id: generateId('history'),
      deviceId: newDevice.id,
      ts: new Date().toISOString(),
      action: 'Создано изделие',
      details: payload.historyNote ?? 'Запись добавлена через мастер паспортов.',
      actor: 'dev-admin',
    });
    return deepClone(newDevice);
  },
  async updateDevice(deviceId: string, patch: Partial<NetworkDevice>): Promise<NetworkDevice> {
    const state = getState();
    const device = state.devices.find(entry => entry.id === deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    Object.assign(device, patch);
    return deepClone(device);
  },
  async listDeviceModels(): Promise<DeviceModel[]> {
    return deepClone(getState().deviceModels);
  },
  async createDeviceModel(model: Omit<DeviceModel, 'id'>): Promise<DeviceModel> {
    const state = getState();
    const newModel: DeviceModel = { ...model, id: generateId('device-model') };
    state.deviceModels.push(newModel);
    return deepClone(newModel);
  },
  async listTemplates(deviceModelId?: string): Promise<PassportTemplate[]> {
    const state = getState();
    const templates = deviceModelId
      ? state.templates.filter(template => template.deviceModelId === deviceModelId)
      : state.templates;
    return templates.map(template => ({
      ...template,
      fields: cloneFields(template.fields),
      layout: cloneLayout(template.layout),
    }));
  },
  async createTemplate({
    setActive = false,
    ...template
  }: Omit<PassportTemplate, 'id' | 'version' | 'createdAt'> & { setActive?: boolean }): Promise<PassportTemplate> {
    const state = getState();
    const record: PassportTemplate = {
      ...template,
      id: generateId('template'),
      version: nextTemplateVersion(template.deviceModelId),
      isActive: Boolean(setActive),
      createdAt: new Date().toISOString(),
      fields: cloneFields(template.fields),
      layout: cloneLayout(template.layout),
      status: template.status ?? (setActive ? 'published' : 'draft'),
    };
    state.templates.push(record);
    if (record.isActive) {
      markTemplateActive(record.deviceModelId, record.id);
    }
    return {
      ...record,
      fields: cloneFields(record.fields),
      layout: cloneLayout(record.layout),
    };
  },
  async setTemplateActive(templateId: string): Promise<void> {
    const state = getState();
    const template = state.templates.find(entry => entry.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    markTemplateActive(template.deviceModelId, templateId);
  },
  async getTemplateById(templateId: string): Promise<PassportTemplate | undefined> {
    const state = getState();
    const template = state.templates.find(entry => entry.id === templateId);
    return template
      ? {
          ...template,
          fields: cloneFields(template.fields),
          layout: cloneLayout(template.layout),
        }
      : undefined;
  },
  async getActiveTemplate(deviceModelId: string): Promise<PassportTemplate | undefined> {
    const state = getState();
    const template = state.templates.find(entry => entry.deviceModelId === deviceModelId && entry.isActive);
    return template
      ? {
          ...template,
          fields: cloneFields(template.fields),
          layout: cloneLayout(template.layout),
        }
      : undefined;
  },
  async getDeviceHistory(deviceId: string): Promise<DeviceHistoryEntry[]> {
    return deepClone(ensureHistoryMap(deviceId));
  },
  async appendDeviceHistory(deviceId: string, entry: Omit<DeviceHistoryEntry, 'id'>): Promise<DeviceHistoryEntry> {
    const list = ensureHistoryMap(deviceId);
    const record: DeviceHistoryEntry = { ...entry, id: generateId('history'), deviceId };
    list.unshift(record);
    return deepClone(record);
  },
  async listPassports(): Promise<ProductPassport[]> {
    return getState().passports.map(passport => hydratePassport(passport));
  },
  async getPassportById(id: string): Promise<ProductPassport | undefined> {
    const passport = getState().passports.find(entry => entry.id === id);
    return passport ? hydratePassport(passport) : undefined;
  },
  async getDraftPassport(deviceId: string): Promise<ProductPassport | undefined> {
    const passport = getState().passports.find(entry => entry.deviceId === deviceId && entry.status === 'draft');
    return passport ? hydratePassport(passport) : undefined;
  },
  async createDraftPassport(deviceId: string, template?: PassportTemplate | null): Promise<ProductPassport> {
    const state = getState();
    const device = findDevice(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    const schema = template ? cloneFields(template.fields) : [];
    const metadata = deriveMetadataFromDevice(device);
    const record: ProductPassport = {
      id: generateId('passport'),
      deviceId,
      templateId: template?.id ?? null,
      status: 'draft',
      version: nextPassportVersion(deviceId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
      schema,
      fieldValues: applyAutofill(
        schema,
        device,
        metadata,
        schema.reduce<Record<string, TemplateFieldValue>>((acc, field) => {
          if (field.type === 'table') {
            acc[field.key] = Array.isArray(field.defaultValue) ? (field.defaultValue as TemplateTableRow[]) : [];
            return acc;
          }
          if (field.defaultValue !== undefined) {
            acc[field.key] = field.defaultValue;
          }
          return acc;
        }, {}),
      ),
      attachments: [],
      history: [
        {
          ts: new Date().toISOString(),
          action: 'draft',
          details: 'Черновик паспорта создан.',
          actor: 'dev-admin',
        },
      ],
    };
    state.passports.push(record);
    return hydratePassport(record);
  },
  async applyTemplate(passportId: string, template: PassportTemplate): Promise<ProductPassport> {
    const state = getState();
    const passport = state.passports.find(entry => entry.id === passportId);
    if (!passport) {
      throw new Error(`Passport ${passportId} not found`);
    }
    const device = findDevice(passport.deviceId);
    if (!device) {
      throw new Error(`Device ${passport.deviceId} not found`);
    }
    passport.templateId = template.id;
    passport.schema = cloneFields(template.fields);
    passport.fieldValues = applyAutofill(
      template.fields,
      device,
      passport.metadata,
      template.fields.reduce<Record<string, TemplateFieldValue>>((acc, field) => {
        if (field.type === 'table') {
          acc[field.key] = Array.isArray(field.defaultValue) ? (field.defaultValue as TemplateTableRow[]) : [];
          return acc;
        }
        if (field.defaultValue !== undefined) {
          acc[field.key] = field.defaultValue;
        }
        return acc;
      }, {}),
    );
    passport.updatedAt = new Date().toISOString();
    passport.history.push({
      ts: passport.updatedAt,
      action: 'template',
      details: `Применён шаблон ${template.name} v${template.version}.`,
      actor: 'dev-admin',
    });
    return hydratePassport(passport);
  },
  async updatePassportMetadata(passportId: string, metadata: Partial<ProductPassport['metadata']>): Promise<ProductPassport> {
    const state = getState();
    const passport = state.passports.find(entry => entry.id === passportId);
    if (!passport) {
      throw new Error(`Passport ${passportId} not found`);
    }
    passport.metadata = { ...passport.metadata, ...metadata };
    passport.updatedAt = new Date().toISOString();
    return hydratePassport(passport);
  },
  async updatePassportValues(
    passportId: string,
    values: Record<string, TemplateFieldValue>,
  ): Promise<ProductPassport> {
    const state = getState();
    const passport = state.passports.find(entry => entry.id === passportId);
    if (!passport) {
      throw new Error(`Passport ${passportId} not found`);
    }
    passport.fieldValues = { ...passport.fieldValues, ...values };
    passport.updatedAt = new Date().toISOString();
    return hydratePassport(passport);
  },
  async saveTemplateFromPassport(passportId: string, name: string, description?: string, setActive = false): Promise<PassportTemplate> {
    const state = getState();
    const passport = state.passports.find(entry => entry.id === passportId);
    if (!passport) {
      throw new Error(`Passport ${passportId} not found`);
    }
    const device = findDevice(passport.deviceId);
    if (!device) {
      throw new Error(`Device ${passport.deviceId} not found`);
    }
    const sourceTemplate = passport.templateId
      ? state.templates.find(entry => entry.id === passport.templateId)
      : undefined;
    const template: PassportTemplate = {
      id: generateId('template'),
      deviceModelId: device.deviceModelId,
      name,
      description,
      version: nextTemplateVersion(device.deviceModelId),
      isActive: Boolean(setActive),
      createdAt: new Date().toISOString(),
      fields: cloneFields(passport.schema),
      layout: cloneLayout(sourceTemplate?.layout),
      status: setActive ? 'published' : 'draft',
      fileNamePattern: sourceTemplate?.fileNamePattern,
    };
    state.templates.push(template);
    if (template.isActive) {
      markTemplateActive(template.deviceModelId, template.id);
    }
    return { ...template, fields: cloneFields(template.fields) };
  },
  async addAttachment(passportId: string, attachment: { name: string; url: string }): Promise<PassportAttachment> {
    const state = getState();
    const passport = state.passports.find(entry => entry.id === passportId);
    if (!passport) {
      throw new Error(`Passport ${passportId} not found`);
    }
    const record: PassportAttachment = {
      id: generateId('attachment'),
      name: attachment.name,
      url: attachment.url,
      uploadedAt: new Date().toISOString(),
    };
    passport.attachments.push(record);
    passport.updatedAt = new Date().toISOString();
    passport.history.push({
      ts: passport.updatedAt,
      action: 'attachment',
      details: `Добавлен документ ${attachment.name}.`,
      actor: 'dev-admin',
    });
    return { ...record };
  },
  async finalizePassport(passportId: string, actor = 'dev-admin'): Promise<ProductPassport> {
    const state = getState();
    const passport = state.passports.find(entry => entry.id === passportId);
    if (!passport) {
      throw new Error(`Passport ${passportId} not found`);
    }
    passport.status = 'ready';
    passport.updatedAt = new Date().toISOString();
    passport.history.push({
      ts: passport.updatedAt,
      action: 'finalize',
      details: 'Паспорт утверждён и переведён в статус "Готов".',
      actor,
    });
    return hydratePassport(passport);
  },
};

export type ProductPassportRepository = typeof productPassportRepository;
