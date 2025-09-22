import type { ProductPassportState } from '../product-passport/types';
import { seedReferenceTime } from './common';

const now = seedReferenceTime;


const ciscoTemplateFields = [
  {
    id: 'tpl-field-role',
    key: 'role',
    label: 'Роль устройства',
    type: 'text' as const,
    required: true,
    defaultValue: 'Distribution switch',
  },
  {
    id: 'tpl-field-install-date',
    key: 'installDate',
    label: 'Дата ввода в эксплуатацию',
    type: 'date' as const,
    required: true,
  },
  {
    id: 'tpl-field-firmware',
    key: 'firmware',
    label: 'Текущая версия прошивки',
    type: 'text' as const,
    required: true,
    defaultValue: '17.12.4',
  },
  {
    id: 'tpl-field-power',
    key: 'powerProfile',
    label: 'Профиль питания',
    type: 'select' as const,
    options: [
      { label: 'AC (2 блока)', value: 'ac_dual' },
      { label: 'DC', value: 'dc' },
      { label: 'PoE+', value: 'poe_plus' },
    ],
    required: true,
  },
  {
    id: 'tpl-field-notes',
    key: 'notes',
    label: 'Примечания',
    type: 'multiline' as const,
  },
];

const dellTemplateFields = [
  {
    id: 'tpl-dell-os',
    key: 'osVersion',
    label: 'Операционная система',
    type: 'text' as const,
    required: true,
    defaultValue: 'ESXi 8.0',
  },
  {
    id: 'tpl-dell-cpu',
    key: 'cpuModel',
    label: 'Модель CPU',
    type: 'text' as const,
    required: true,
    defaultValue: 'Intel Xeon Gold 6430',
  },
  {
    id: 'tpl-dell-ram',
    key: 'ramGb',
    label: 'ОЗУ (ГБ)',
    type: 'number' as const,
    required: true,
    defaultValue: 256,
  },
  {
    id: 'tpl-dell-hypervisor',
    key: 'hypervisorCluster',
    label: 'Кластер гипервизора',
    type: 'text' as const,
  },
];

export const passportsSeed: ProductPassportState = {
  devices: [
    {
      id: 'device-ast-1001',
      assetTag: 'AST-1001',
      deviceModelId: 'model-cisco-c9500',
      serialNumber: 'SN123456789',
      ipAddress: '10.10.10.5',
      location: 'DC-West / Стойка 42',
      owner: 'Команда сетей',
      status: 'in_service',
    },
    {
      id: 'device-ast-1042',
      assetTag: 'AST-1042',
      deviceModelId: 'model-dell-r650',
      serialNumber: 'R650-2404-1042',
      ipAddress: '10.20.2.15',
      location: 'DC-East / Подрядчик зона 3',
      owner: 'Команда виртуализации',
      status: 'maintenance',
    },
    {
      id: 'device-ast-1100',
      assetTag: 'AST-1100',
      deviceModelId: 'model-juniper-srx',
      serialNumber: 'SRX-1100-99',
      ipAddress: '172.16.5.1',
      location: 'DC-West / Пограничный сегмент',
      owner: 'Команда безопасности',
      status: 'in_service',
    },
  ],
  deviceModels: [
    {
      id: 'model-cisco-c9500',
      vendor: 'Cisco',
      name: 'Cisco Catalyst 9500',
      description: 'Модульное ядро сети корпоративного датацентра.',
    },
    {
      id: 'model-dell-r650',
      vendor: 'Dell',
      name: 'Dell PowerEdge R650',
      description: 'Высокоплотный сервер виртуализации.',
    },
    {
      id: 'model-juniper-srx',
      vendor: 'Juniper',
      name: 'Juniper SRX340',
      description: 'Пограничный межсетевой экран и VPN-шлюз.',
    },
  ],
  templates: [
    {
      id: 'tpl-cisco-base-v1',
      deviceModelId: 'model-cisco-c9500',
      name: 'Cisco C9500 — базовый паспорт',
      description: 'Рекомендуемый комплект полей для паспорта ядрового коммутатора.',
      version: 1,
      isActive: true,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      fields: ciscoTemplateFields.map(field => ({ ...field })),
    },
    {
      id: 'tpl-dell-base-v1',
      deviceModelId: 'model-dell-r650',
      name: 'Dell R650 — стандарт',
      description: 'Основные сведения для серверов виртуализации.',
      version: 1,
      isActive: true,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(),
      fields: dellTemplateFields.map(field => ({ ...field })),
    },
  ],
  passports: [
    {
      id: 'passport-ast-1001-v1',
      deviceId: 'device-ast-1001',
      templateId: 'tpl-cisco-base-v1',
      status: 'ready',
      version: 1,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 28).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      metadata: {
        assetTag: 'AST-1001',
        modelName: 'Cisco Catalyst 9500',
        vendor: 'Cisco',
        serialNumber: 'SN123456789',
        ipAddress: '10.10.10.5',
        location: 'DC-West / Стойка 42',
        owner: 'Команда сетей',
      },
      schema: ciscoTemplateFields.map(field => ({ ...field })),
      fieldValues: {
        role: 'Distribution switch',
        installDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
        firmware: '17.12.4',
        powerProfile: 'ac_dual',
        notes: 'Паспорт сформирован автоматически после модернизации ядра.',
      },
      attachments: [
        {
          id: 'attachment-ast-1001-acceptance',
          name: 'Акт ввода в эксплуатацию.pdf',
          url: '/static/demo/router-datasheet.pdf',
          uploadedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 27).toISOString(),
        },
      ],
      history: [
        {
          ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 28).toISOString(),
          action: 'draft',
          details: 'Черновик создан на основе активного шаблона.',
          actor: 'dev-admin',
        },
        {
          ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          action: 'finalize',
          details: 'Паспорт утверждён техническим директором.',
          actor: 'cto-office',
        },
      ],
    },
  ],
  deviceHistory: {
    'device-ast-1001': [
      {
        id: 'hist-ast-1001-1',
        deviceId: 'device-ast-1001',
        ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 400).toISOString(),
        action: 'Получено на склад',
        details: 'Принято по заказу PO-4587 в количестве 1 шт.',
        actor: 'Складской отдел',
      },
      {
        id: 'hist-ast-1001-2',
        deviceId: 'device-ast-1001',
        ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365).toISOString(),
        action: 'Ввод в эксплуатацию',
        details: 'Установлено в стойку 42, порт uplink — DC-CORE-01.',
        actor: 'Команда сетей',
      },
      {
        id: 'hist-ast-1001-3',
        deviceId: 'device-ast-1001',
        ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        action: 'Обслуживание',
        details: 'Заменён вентилятор FAN2 после предупреждения датчика.',
        actor: 'Сервисный центр',
      },
    ],
    'device-ast-1042': [
      {
        id: 'hist-ast-1042-1',
        deviceId: 'device-ast-1042',
        ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        action: 'Перемещение',
        details: 'Отправлено в зону подрядчика для планового апгрейда.',
        actor: 'Команда виртуализации',
      },
    ],
    'device-ast-1100': [
      {
        id: 'hist-ast-1100-1',
        deviceId: 'device-ast-1100',
        ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120).toISOString(),
        action: 'Тестирование',
        details: 'Пройдено нагрузочное тестирование IPS.',
        actor: 'SOC',
      },
      {
        id: 'hist-ast-1100-2',
        deviceId: 'device-ast-1100',
        ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        action: 'Инцидент',
        details: 'Зафиксирован всплеск CPU при анализе DDoS, включена защита.',
        actor: 'SOC',
      },
    ],
  },
};
