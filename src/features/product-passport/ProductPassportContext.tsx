import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { SerializableSection, createDefaultTemplate } from './passportSchema';

export type DeviceAction =
  | 'inspection'
  | 'testing'
  | 'repair'
  | 'deployment'
  | 'decommissioned'
  | 'handover'
  | 'rejected';

export interface DeviceHistoryItem {
  id: string;
  date: string;
  employee: string;
  action: DeviceAction;
  notes?: string;
}

export type InventoryStatus = 'in-use' | 'testing' | 'decommissioned';

export interface InventoryDevice {
  id: string;
  assetTag: string;
  modelId: string;
  modelName: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
  status: InventoryStatus;
  warrantyUntil?: string;
  lastUpdated: string;
  history: DeviceHistoryItem[];
}

export interface ProductPassportModel {
  id: string;
  name: string;
  vendor: string;
  formFactor: string;
  templateId: string;
  templateStructure: SerializableSection[];
  defaultPassportFields: Partial<Record<'assetTag' | 'model' | 'serialNumber' | 'location' | 'owner' | 'warrantyUntil' | 'ipAddress', string>>;
  description?: string;
}

export interface PendingTemplateRequest {
  templateId: string;
  templateName: string;
  structure: SerializableSection[];
  source: 'inventory' | 'model' | 'new-device';
  defaultFields?: Record<string, string>;
  meta?: {
    modelId?: string;
    assetTag?: string;
    ipAddress?: string;
    serialNumber?: string;
  };
}

interface CreateModelInput {
  name: string;
  vendor: string;
  formFactor: string;
  baseTemplate: 'server' | 'switch' | 'firewall';
  defaultOwner?: string;
  defaultLocation?: string;
  defaultWarranty?: string;
  defaultIpAddress?: string;
  description?: string;
}

interface CreateDeviceInput {
  modelId: string;
  assetTag?: string;
  serialNumber?: string;
  ipAddress?: string;
  location?: string;
  owner?: string;
  warrantyUntil?: string;
  status?: InventoryStatus;
  registeredBy?: string;
}

interface ProductPassportContextValue {
  inventory: InventoryDevice[];
  updateInventoryOwner: (id: string, owner: string, employee: string) => void;
  findDevices: (query: string) => InventoryDevice[];
  models: ProductPassportModel[];
  createModel: (input: CreateModelInput) => ProductPassportModel;
  createDevice: (input: CreateDeviceInput) => InventoryDevice | null;
  applyModelTemplate: (
    modelId: string,
    options?: {
      source?: PendingTemplateRequest['source'];
      defaultFields?: Record<string, string | undefined>;
      meta?: PendingTemplateRequest['meta'];
    },
  ) => PendingTemplateRequest | null;
  pendingTemplate: PendingTemplateRequest | null;
  clearPendingTemplate: () => void;
}

const ProductPassportContext = createContext<ProductPassportContextValue | null>(null);

const cloneStructure = (structure: SerializableSection[]): SerializableSection[] =>
  structure.map(section => ({
    title: section.title,
    rows: section.rows.map(row => ({
      name: row.name,
      entries: row.entries.map(entry => ({ label: entry.label, value: entry.value })),
    })),
  }));

const rackServerStructure = createDefaultTemplate().structure;

const networkSwitchStructure: SerializableSection[] = [
  {
    title: 'Основные сведения',
    rows: [
      {
        name: 'Коммутатор',
        entries: [
          { label: 'Модель', value: 'Cisco Catalyst C9500-24Y4C' },
          { label: 'Серийный номер', value: '' },
        ],
      },
      {
        name: 'Расположение',
        entries: [
          { label: 'Стойка', value: 'DC-West / Rack 42' },
          { label: 'IP-адрес управления', value: '10.24.42.10' },
        ],
      },
    ],
  },
  {
    title: 'Порты uplink',
    rows: [
      {
        name: 'QSFP28-1',
        entries: [
          { label: 'Назначение', value: 'Магистраль в Spine' },
          { label: 'Состояние', value: 'Активен' },
        ],
      },
      {
        name: 'QSFP28-2',
        entries: [
          { label: 'Назначение', value: 'Дублирующий uplink' },
          { label: 'Состояние', value: 'Резерв' },
        ],
      },
    ],
  },
  {
    title: 'ПО и лицензии',
    rows: [
      {
        name: 'Обновления',
        entries: [
          { label: 'Версия IOS-XE', value: '17.9.3a' },
          { label: 'Дата последнего обновления', value: '2024-04-12' },
        ],
      },
      {
        name: 'Лицензии',
        entries: [
          { label: 'DNA Advantage', value: 'Активно до 2026-05-01' },
          { label: 'Network Advantage', value: 'Активно до 2026-05-01' },
        ],
      },
    ],
  },
];

const firewallStructure: SerializableSection[] = [
  {
    title: 'Общее состояние',
    rows: [
      {
        name: 'Устройство',
        entries: [
          { label: 'Модель', value: 'Fortinet FortiGate 1800F' },
          { label: 'Серийный номер', value: '' },
        ],
      },
      {
        name: 'Сеть',
        entries: [
          { label: 'WAN IP', value: '203.0.113.18' },
          { label: 'LAN IP', value: '10.10.10.1' },
        ],
      },
    ],
  },
  {
    title: 'Модули и слоты',
    rows: [
      {
        name: 'Слот 1',
        entries: [
          { label: 'Тип', value: 'NP6XLite' },
          { label: 'Статус', value: 'Активен' },
        ],
      },
      {
        name: 'Слот 2',
        entries: [
          { label: 'Тип', value: 'NP7' },
          { label: 'Статус', value: 'Готов' },
        ],
      },
    ],
  },
  {
    title: 'Журналы и тесты',
    rows: [
      {
        name: 'Последнее тестирование',
        entries: [
          { label: 'Дата', value: '2024-03-18' },
          { label: 'Ответственный', value: 'Савельев Константин' },
        ],
      },
      {
        name: 'Примечания',
        entries: [
          { label: 'Результат', value: 'Ограничений не выявлено' },
          { label: 'Браковка', value: 'Нет' },
        ],
      },
    ],
  },
];

const initialModels: ProductPassportModel[] = [
  {
    id: 'model-neytech-rack-2u',
    name: 'Сервер NeyTech 2U',
    vendor: 'NeyTech',
    formFactor: 'Стоечный 2U',
    templateId: 'template-neytech-rack-2u',
    templateStructure: cloneStructure(rackServerStructure),
    defaultPassportFields: {
      model: 'NeyTech RackServer 2U',
      owner: 'Команда платформы',
      location: 'DC-East / Rack 18',
      warrantyUntil: '2025-12-31',
    },
    description: 'Предустановленный шаблон паспорта для серверных конфигураций NeyTech.',
  },
  {
    id: 'model-cisco-c9500',
    name: 'Коммутатор Cisco C9500',
    vendor: 'Cisco',
    formFactor: 'Стоечный 1U',
    templateId: 'template-cisco-c9500',
    templateStructure: cloneStructure(networkSwitchStructure),
    defaultPassportFields: {
      model: 'Cisco Catalyst C9500-24Y4C',
      owner: 'Команда сетей',
      location: 'DC-West / Rack 42',
      warrantyUntil: '2026-07-01',
      ipAddress: '10.24.42.10',
    },
    description: 'Шаблон паспорта для магистральных коммутаторов Cisco с учётом uplink-портов и лицензий.',
  },
  {
    id: 'model-fortinet-1800f',
    name: 'Межсетевой экран Fortinet 1800F',
    vendor: 'Fortinet',
    formFactor: 'Стоечный 2U',
    templateId: 'template-fortinet-1800f',
    templateStructure: cloneStructure(firewallStructure),
    defaultPassportFields: {
      model: 'Fortinet FortiGate 1800F',
      owner: 'Группа безопасности',
      location: 'DC-West / Сектор Security',
      warrantyUntil: '2025-11-15',
      ipAddress: '203.0.113.18',
    },
    description: 'Включает разделы по слотам, проверке логов и документированию тестов безопасности.',
  },
];

const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);

const initialInventory: InventoryDevice[] = [
  {
    id: 'asset-0001',
    assetTag: 'AST-1001',
    modelId: 'model-cisco-c9500',
    modelName: 'Коммутатор Cisco C9500',
    serialNumber: 'SN123456789',
    ipAddress: '10.24.42.11',
    location: 'DC-West / Rack 42',
    owner: 'Команда сетей',
    status: 'in-use',
    warrantyUntil: '2026-07-01',
    lastUpdated: '2024-04-22',
    history: [
      {
        id: 'hist-0001',
        date: '2024-04-12',
        employee: 'Иванов Сергей',
        action: 'testing',
        notes: 'Проверка новой версии IOS-XE',
      },
      {
        id: 'hist-0002',
        date: '2024-03-02',
        employee: 'Петров Антон',
        action: 'inspection',
        notes: 'Ввод в эксплуатацию',
      },
    ],
  },
  {
    id: 'asset-0002',
    assetTag: 'AST-1058',
    modelId: 'model-cisco-c9500',
    modelName: 'Коммутатор Cisco C9500',
    serialNumber: 'SN123456995',
    ipAddress: '10.24.42.58',
    location: 'DC-West / Rack 40',
    owner: 'Команда сетей',
    status: 'testing',
    warrantyUntil: '2026-05-21',
    lastUpdated: '2024-04-18',
    history: [
      {
        id: 'hist-0003',
        date: '2024-04-18',
        employee: 'Смирнова Лидия',
        action: 'testing',
        notes: 'Тестирование резервного канала',
      },
      {
        id: 'hist-0004',
        date: '2024-02-11',
        employee: 'Кузнецов Олег',
        action: 'inspection',
        notes: 'Диагностика перед развертыванием',
      },
    ],
  },
  {
    id: 'asset-0003',
    assetTag: 'AST-2010',
    modelId: 'model-neytech-rack-2u',
    modelName: 'Сервер NeyTech 2U',
    serialNumber: 'NT-020524027B',
    ipAddress: '10.60.20.5',
    location: 'DC-East / Rack 18',
    owner: 'Команда платформы',
    status: 'in-use',
    warrantyUntil: '2025-12-31',
    lastUpdated: '2024-02-15',
    history: [
      {
        id: 'hist-0005',
        date: '2024-02-05',
        employee: 'Честнов Алексей',
        action: 'inspection',
        notes: 'Входной контроль, проверка комплектации',
      },
      {
        id: 'hist-0006',
        date: '2024-02-06',
        employee: 'Болышев Никита',
        action: 'deployment',
        notes: 'Сборка и ввод в эксплуатацию',
      },
    ],
  },
  {
    id: 'asset-0004',
    assetTag: 'AST-3301',
    modelId: 'model-fortinet-1800f',
    modelName: 'Межсетевой экран Fortinet 1800F',
    serialNumber: 'FG1K4D3A21000001',
    ipAddress: '203.0.113.18',
    location: 'DC-West / Сектор Security',
    owner: 'Группа безопасности',
    status: 'in-use',
    warrantyUntil: '2025-11-15',
    lastUpdated: '2024-03-18',
    history: [
      {
        id: 'hist-0007',
        date: '2024-03-18',
        employee: 'Савельев Константин',
        action: 'testing',
        notes: 'Проверка пропускной способности под нагрузкой',
      },
      {
        id: 'hist-0008',
        date: '2024-01-28',
        employee: 'Исаева Наталья',
        action: 'inspection',
        notes: 'Контроль после сервисного окна',
      },
    ],
  },
];

const generateSerial = () => `SN${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const generateIp = (seed: number) => {
  const thirdOctet = 40 + (seed % 40);
  const fourthOctet = 10 + ((seed * 7) % 200);
  return `10.${thirdOctet}.${fourthOctet}.${(seed % 180) + 5}`;
};

export const ProductPassportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<ProductPassportModel[]>(initialModels);
  const [inventory, setInventory] = useState<InventoryDevice[]>(initialInventory);
  const [pendingTemplate, setPendingTemplate] = useState<PendingTemplateRequest | null>(null);

  const assetCounter = useRef(initialInventory.length + 1000);
  const serialCounter = useRef(initialInventory.length + 5000);

  const updateInventoryOwner = useCallback((id: string, owner: string, employee: string) => {
    setInventory(current =>
      current.map(device => {
        if (device.id !== id) {
          return device;
        }

        const historyEntry: DeviceHistoryItem = {
          id: `hist-${id}-${device.history.length + 1}`,
          date: today(),
          employee,
          action: 'handover',
          notes: `Назначен новый ответственный: ${owner}`,
        };

        return {
          ...device,
          owner,
          lastUpdated: today(),
          history: [historyEntry, ...device.history],
        };
      }),
    );
  }, []);

  const findDevices = useCallback(
    (query: string) => {
      const value = query.trim().toLowerCase();
      if (!value) {
        return [];
      }

      return inventory.filter(device => {
        const haystack = [
          device.assetTag,
          device.serialNumber,
          device.modelName,
          device.ipAddress,
          device.owner,
        ]
          .filter(Boolean)
          .map(item => item.toLowerCase());

        return haystack.some(item => item.includes(value));
      });
    },
    [inventory],
  );

  const createModel = useCallback(
    (input: CreateModelInput): ProductPassportModel => {
      const structure =
        input.baseTemplate === 'server'
          ? cloneStructure(rackServerStructure)
          : input.baseTemplate === 'switch'
          ? cloneStructure(networkSwitchStructure)
          : cloneStructure(firewallStructure);

      const id = `model-${Math.random().toString(36).slice(2, 10)}`;
      const templateId = `template-${id}`;

      const model: ProductPassportModel = {
        id,
        name: input.name,
        vendor: input.vendor,
        formFactor: input.formFactor,
        templateId,
        templateStructure: structure,
        defaultPassportFields: {
          model: input.name,
          owner: input.defaultOwner,
          location: input.defaultLocation,
          warrantyUntil: input.defaultWarranty,
          ipAddress: input.defaultIpAddress,
        },
        description: input.description,
      };

      setModels(current => [...current, model]);
      return model;
    },
    [],
  );

  const createDevice = useCallback(
    (input: CreateDeviceInput): InventoryDevice | null => {
      const model = models.find(item => item.id === input.modelId);
      if (!model) {
        return null;
      }

      assetCounter.current += 1;
      serialCounter.current += 1;

      const generatedAssetTag = `AST-${assetCounter.current}`;
      const assetTag = input.assetTag?.trim() || generatedAssetTag;
      const serialNumber = input.serialNumber?.trim() || generateSerial();
      const ipAddress = input.ipAddress?.trim() || generateIp(serialCounter.current);
      const location = input.location?.trim() || model.defaultPassportFields.location || 'DC-West / Резерв';
      const owner = input.owner?.trim() || model.defaultPassportFields.owner || 'Команда сетей';
      const warrantyUntil = input.warrantyUntil || model.defaultPassportFields.warrantyUntil;
      const status = input.status ?? 'testing';

      const newDevice: InventoryDevice = {
        id: `asset-${assetCounter.current}`,
        assetTag,
        modelId: model.id,
        modelName: model.name,
        serialNumber,
        ipAddress,
        location,
        owner,
        status,
        warrantyUntil,
        lastUpdated: today(),
        history: [
          {
            id: `hist-${assetCounter.current}-0`,
            date: today(),
            employee: input.registeredBy || 'Система',
            action: 'inspection',
            notes: 'Изделие создано через мастер паспорта',
          },
        ],
      };

      setInventory(current => [newDevice, ...current]);
      return newDevice;
    },
    [models],
  );

  const applyModelTemplate = useCallback(
    (
      modelId: string,
      options?: {
        source?: PendingTemplateRequest['source'];
        defaultFields?: Record<string, string | undefined>;
        meta?: PendingTemplateRequest['meta'];
      },
    ): PendingTemplateRequest | null => {
      const model = models.find(item => item.id === modelId);
      if (!model) {
        return null;
      }

      const defaultFieldsEntries = {
        model: model.name,
        ...model.defaultPassportFields,
        ...(options?.defaultFields ?? {}),
      };

      const normalizedFields = Object.entries(defaultFieldsEntries)
        .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
        .reduce<Record<string, string>>((accumulator, [key, value]) => {
          accumulator[key] = value as string;
          return accumulator;
        }, {});

      const request: PendingTemplateRequest = {
        templateId: model.templateId,
        templateName: model.name,
        structure: cloneStructure(model.templateStructure),
        source: options?.source ?? 'model',
        defaultFields: normalizedFields,
        meta: {
          modelId: model.id,
          ...options?.meta,
        },
      };

      setPendingTemplate(request);
      return request;
    },
    [models],
  );

  const clearPendingTemplate = useCallback(() => setPendingTemplate(null), []);

  const contextValue = useMemo<ProductPassportContextValue>(
    () => ({
      inventory,
      updateInventoryOwner,
      findDevices,
      models,
      createModel,
      createDevice,
      applyModelTemplate,
      pendingTemplate,
      clearPendingTemplate,
    }),
    [
      inventory,
      updateInventoryOwner,
      findDevices,
      models,
      createModel,
      createDevice,
      applyModelTemplate,
      pendingTemplate,
      clearPendingTemplate,
    ],
  );

  return <ProductPassportContext.Provider value={contextValue}>{children}</ProductPassportContext.Provider>;
};

export const useProductPassport = (): ProductPassportContextValue => {
  const context = useContext(ProductPassportContext);
  if (!context) {
    throw new Error('useProductPassport должен использоваться внутри ProductPassportProvider');
  }

  return context;
};
