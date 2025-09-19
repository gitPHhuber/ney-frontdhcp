import { enterpriseState } from '../state';
import { deepClone, generateId } from '../utils';
import { inventoryRepository } from '../inventory/mockRepository';
import type { ProductPassport, ProductPassportState } from './types';

const getState = (): ProductPassportState => enterpriseState.passports;

const inferOwnerFromItem = (itemId: string) => {
  if (itemId.includes('router')) {
    return 'core-network-team';
  }
  if (itemId.includes('switch')) {
    return 'distribution-team';
  }
  return 'operations';
};

export const productPassportRepository = {
  async list(): Promise<ProductPassport[]> {
    return deepClone(getState().passports);
  },
  async getById(id: string): Promise<ProductPassport | undefined> {
    return deepClone(getState().passports.find(passport => passport.id === id));
  },
  async create(passport: Omit<ProductPassport, 'id'>): Promise<ProductPassport> {
    const state = getState();
    const record: ProductPassport = { ...passport, id: generateId('passport') };
    state.passports.push(record);
    return deepClone(record);
  },
  async update(id: string, patch: Partial<ProductPassport>): Promise<ProductPassport> {
    const state = getState();
    const passport = state.passports.find(entry => entry.id === id);
    if (!passport) {
      throw new Error(`Passport ${id} not found`);
    }
    Object.assign(passport, patch);
    return deepClone(passport);
  },
  async generateFromInventory(itemId: string): Promise<Omit<ProductPassport, 'id'>> {
    const [items, locations] = await Promise.all([
      inventoryRepository.listItems(),
      inventoryRepository.listLocations(),
    ]);
    const item = items.find(entry => entry.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }
    const defaultLocation = locations.find(location => location.path.toLowerCase().includes('fg')) ?? locations[0];
    return {
      assetTag: generateId('asset'),
      model: item.name,
      serialNumber: `${item.sku}-${Math.floor(Math.random() * 9000 + 1000)}`,
      vendor: 'NetGrip Manufacturing',
      location: defaultLocation?.path ?? 'Unknown',
      owner: inferOwnerFromItem(itemId),
      firmware: 'v1.0.0',
      macs: [],
      ips: [],
      certificates: ['ISO27001'],
      history: [
        {
          ts: new Date().toISOString(),
          action: 'install',
          details: `Auto-generated passport for ${item.name}`,
          actor: 'auto-generator',
        },
      ],
      attachments: [],
      customFields: {},
    };
  },
};

export type ProductPassportRepository = typeof productPassportRepository;
