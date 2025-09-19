export interface ProductHistoryEntry {
  ts: string;
  action: 'install' | 'move' | 'replacePart' | 'updateFirmware' | 'audit';
  details: string;
  actor: string;
}

export interface ProductPassportAttachment {
  id: string;
  name: string;
  url: string;
}

export interface ProductPassport {
  id: string;
  assetTag: string;
  model: string;
  serialNumber: string;
  vendor: string;
  location: string;
  owner: string;
  firmware: string;
  macs: string[];
  ips: string[];
  warrantyUntil?: string;
  certificates?: string[];
  customFields?: Record<string, string>;
  history: ProductHistoryEntry[];
  attachments?: ProductPassportAttachment[];
}

export interface ProductPassportState {
  passports: ProductPassport[];
}
