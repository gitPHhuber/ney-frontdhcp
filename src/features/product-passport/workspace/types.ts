import type {
  DeviceModel,
  DeviceStatus,
  PassportTemplate,
  PassportTemplateField,
  TemplatePrimitiveFieldType,
} from '../../../entities';

export type DeviceFormValues = {
  assetTag: string;
  deviceModelId: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
  status: DeviceStatus;
  historyNote?: string;
};

export type TemplateFieldDraft = {
  id: string;
  label: string;
  key: string;
  type: PassportTemplateField['type'];
  required: boolean;
  options: string;
  placeholder?: string;
  defaultValue?: string;
  columns: Array<{
    id: string;
    title: string;
    key: string;
    type: TemplatePrimitiveFieldType;
  }>;
  minRows?: number;
  maxRows?: number;
};

export type TemplateCreationPayload = {
  name: string;
  description?: string;
  deviceModelId: string;
  setActive: boolean;
  isActive: boolean;
  fields: PassportTemplateField[];
  layout?: PassportTemplate['layout'];
  status?: PassportTemplate['status'];
};

export type ModelLookup = Map<string, DeviceModel>;
