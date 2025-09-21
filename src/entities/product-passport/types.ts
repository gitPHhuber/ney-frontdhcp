export type DeviceStatus = 'in_service' | 'maintenance' | 'storage' | 'decommissioned';

export interface DeviceModel {
  id: string;
  vendor: string;
  name: string;
  description?: string;
}

export interface NetworkDevice {
  id: string;
  assetTag: string;
  deviceModelId: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
  status: DeviceStatus;
}

export interface DeviceHistoryEntry {
  id: string;
  deviceId: string;
  ts: string;
  action: string;
  details: string;
  actor: string;
}

export type TemplateFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'multiline';

export interface TemplateFieldOption {
  value: string;
  label: string;
}

export interface PassportTemplateField {
  id: string;
  key: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
  options?: TemplateFieldOption[];
  defaultValue?: string | number | boolean | string[];
}

export interface PassportTemplate {
  id: string;
  deviceModelId: string;
  name: string;
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  fields: PassportTemplateField[];
}

export interface PassportAttachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface PassportMetadata {
  assetTag: string;
  modelName: string;
  vendor?: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
}

export interface ProductPassportHistoryEntry {
  ts: string;
  action: string;
  details: string;
  actor: string;
}

export interface ProductPassport {
  id: string;
  deviceId: string;
  templateId: string | null;
  status: 'draft' | 'ready';
  version: number;
  createdAt: string;
  updatedAt: string;
  metadata: PassportMetadata;
  schema: PassportTemplateField[];
  fieldValues: Record<string, string | number | boolean | string[]>;
  attachments: PassportAttachment[];
  history: ProductPassportHistoryEntry[];
}

export interface ProductPassportState {
  devices: NetworkDevice[];
  deviceModels: DeviceModel[];
  templates: PassportTemplate[];
  passports: ProductPassport[];
  deviceHistory: Record<string, DeviceHistoryEntry[]>;
}
