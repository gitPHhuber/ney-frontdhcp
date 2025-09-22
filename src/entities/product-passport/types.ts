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

export type TemplateFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'multiline'
  | 'table';

export type TemplatePrimitiveFieldType = Exclude<TemplateFieldType, 'table'>;

export interface TemplateFontStyle {
  name?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
}

export interface TemplateAlignmentStyle {
  horizontal?: 'left' | 'center' | 'right';
  vertical?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;
}

export interface TemplateBorderStyle {
  style?: 'thin' | 'dashed' | 'dotted' | 'medium' | 'thick';
  color?: string;
}

export interface TemplateCellStyle {
  font?: TemplateFontStyle;
  alignment?: TemplateAlignmentStyle;
  border?: {
    top?: TemplateBorderStyle;
    left?: TemplateBorderStyle;
    bottom?: TemplateBorderStyle;
    right?: TemplateBorderStyle;
  };
  fillColor?: string;
  numberFormat?: string;
}

export interface TemplateMergeConfig {
  rows?: number;
  cols?: number;
}

export interface TemplateStaticCell {
  id: string;
  row: number;
  col: number;
  value: string;
  merge?: TemplateMergeConfig;
  style?: TemplateCellStyle;
}

export interface TemplateFieldBinding {
  fieldKey: string;
  row: number;
  col: number;
  prefix?: string;
  merge?: TemplateMergeConfig;
  style?: TemplateCellStyle;
}

export interface TemplateTableColumn {
  id: string;
  key: string;
  title: string;
  type?: TemplatePrimitiveFieldType;
  width?: number;
  style?: TemplateCellStyle;
  headerStyle?: TemplateCellStyle;
}

export interface TemplateTableSection {
  fieldKey: string;
  row: number;
  col: number;
  drawHeader?: boolean;
  showGrid?: boolean;
  minRows?: number;
  maxRows?: number;
  fillEmptyRowsWithGrid?: boolean;
  columns: TemplateTableColumn[];
  headerStyle?: TemplateCellStyle;
  rowStyle?: TemplateCellStyle;
  gridStyle?: TemplateBorderStyle;
}

export interface PassportTemplateLayout {
  sheetName: string;
  columnWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
  staticCells?: TemplateStaticCell[];
  bindings?: TemplateFieldBinding[];
  tables?: TemplateTableSection[];
}

export interface TemplateFieldOption {
  value: string;
  label: string;
}

export type TemplatePrimitiveValue = string | number | boolean | string[] | null;
export type TemplateTableRow = Record<string, TemplatePrimitiveValue>;
export type TemplateFieldValue = TemplatePrimitiveValue | TemplateTableRow[];

export interface PassportTemplatePrimitiveField {
  id: string;
  key: string;
  label: string;
  type: TemplatePrimitiveFieldType;
  required?: boolean;
  placeholder?: string;
  options?: TemplateFieldOption[];
  defaultValue?: string | number | boolean | string[];
}

export interface PassportTemplateTableField {
  id: string;
  key: string;
  label: string;
  type: 'table';
  columns: Array<{
    id: string;
    key: string;
    title: string;
    type?: TemplatePrimitiveFieldType;
  }>;
  minRows?: number;
  maxRows?: number;
  required?: boolean;
  defaultValue?: TemplateTableRow[];
}

export type PassportTemplateField = PassportTemplatePrimitiveField | PassportTemplateTableField;

export interface PassportTemplate {
  id: string;
  deviceModelId: string;
  name: string;
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  fields: PassportTemplateField[];
  layout?: PassportTemplateLayout;
  status?: 'draft' | 'published' | 'archived';
  fileNamePattern?: string;
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
  fieldValues: Record<string, TemplateFieldValue>;
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
