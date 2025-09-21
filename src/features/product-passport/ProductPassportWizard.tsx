import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Controller, useForm, type Control, type UseFormReturn } from 'react-hook-form';

import {
  type DeviceAction,
  type InventoryDevice,
  type ProductPassportModel,
  useProductPassport,
} from './ProductPassportContext';

export interface ProductPassportForm {
  assetTag: string;
  model: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
  warrantyUntil?: string;
}

interface CreateDeviceForm {
  modelId: string;
  assetTag: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
  warrantyUntil: string;
  registeredBy: string;
}

interface CreateModelForm {
  name: string;
  vendor: string;
  formFactor: string;
  baseTemplate: 'switch' | 'server' | 'firewall';
  defaultOwner: string;
  defaultLocation: string;
  defaultWarranty: string;
  defaultIpAddress: string;
  description: string;
}

const steps = ['Поиск устройства', 'Проверка метаданных', 'Добавление сведений', 'Приложение документов'];

const baseTemplateOptions: Array<{
  value: CreateModelForm['baseTemplate'];
  label: string;
  description: string;
}> = [
  {
    value: 'switch',
    label: 'Коммутатор',
    description: 'Шаблон для магистральных и распределительных коммутаторов.',
  },
  {
    value: 'server',
    label: 'Сервер',
    description: 'Расширенный паспорт для серверов с контролем комплектации.',
  },
  {
    value: 'firewall',
    label: 'Межсетевой экран',
    description: 'Структура для устройств безопасности и проверки журналов.',
  },
];

const actionLabels: Record<DeviceAction, string> = {
  inspection: 'Входной контроль',
  testing: 'Тестирование',
  repair: 'Ремонт',
  deployment: 'Ввод в эксплуатацию',
  decommissioned: 'Вывод из эксплуатации',
  handover: 'Передача ответственности',
  rejected: 'Забраковано',
};

const formatDate = (value: string | undefined) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ru-RU');
};

interface WizardFieldConfig {
  name: keyof ProductPassportForm;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'date';
}

const WIZARD_FIELDS: WizardFieldConfig[] = [
  {
    name: 'assetTag',
    label: 'Инвентарный номер',
    placeholder: 'Например, AST-1001',
    required: true,
  },
  { name: 'model', label: 'Модель', placeholder: 'Cisco C9500', required: true },
  {
    name: 'serialNumber',
    label: 'Серийный номер',
    placeholder: 'SN123456789',
    required: true,
  },
  {
    name: 'ipAddress',
    label: 'IP-адрес',
    placeholder: '10.24.42.11',
  },
  {
    name: 'location',
    label: 'Расположение',
    placeholder: 'DC-West / Стойка 42',
    required: true,
  },
  {
    name: 'owner',
    label: 'Ответственный',
    placeholder: 'Команда сетей',
    required: true,
  },
  { name: 'warrantyUntil', label: 'Гарантия действует до', type: 'date' },
];

const WizardStepper: React.FC<{ steps: string[] }> = ({ steps }) => (
  <ol className="wizard-steps">
    {steps.map((step, index) => {
      const state = index < 1 ? 'completed' : index === 1 ? 'active' : 'upcoming';
      return (
        <li key={step} className="wizard-step" data-state={state}>
          <span className="wizard-step__index">{index + 1}</span>
          <span className="wizard-step__label">{step}</span>
        </li>
      );
    })}
  </ol>
);

interface PassportFormProps {
  control: Control<ProductPassportForm>;
  fieldConfigs: WizardFieldConfig[];
  idPrefix: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const PassportForm: React.FC<PassportFormProps> = ({ control, fieldConfigs, idPrefix, onSubmit }) => (
  <form className="passport-wizard__form" onSubmit={onSubmit}>
    <div className="passport-wizard__grid">
      {fieldConfigs.map(config => {
        const inputId = `${idPrefix}-${config.name}`;
        return (
          <div key={config.name} className="form-field">
            <label htmlFor={inputId}>{config.label}</label>
            <Controller
              control={control}
              name={config.name}
              render={({ field }) => (
                <input
                  {...field}
                  id={inputId}
                  type={config.type ?? 'text'}
                  placeholder={config.placeholder}
                  required={config.required}
                />
              )}
            />
          </div>
        );
      })}
    </div>
    <footer className="passport-wizard__actions">
      <button type="submit" className="primary">
        Сформировать PDF-паспорт
      </button>
      <button type="button" className="secondary">
        Экспортировать реестр в CSV
      </button>
    </footer>
  </form>
);

interface InventoryTabProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  results: InventoryDevice[];
  selectedDeviceId: string | null;
  onSelectDevice: (device: InventoryDevice) => void;
  selectedDevice: InventoryDevice | null;
  models: ProductPassportModel[];
  idPrefix: string;
  createDeviceForm: UseFormReturn<CreateDeviceForm>;
  onCreateDevice: (event: React.FormEvent<HTMLFormElement>) => void;
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  results,
  selectedDeviceId,
  onSelectDevice,
  selectedDevice,
  models,
  idPrefix,
  createDeviceForm,
  onCreateDevice,
}) => (
  <div className="passport-wizard__inventory" role="tabpanel">
    <div className="passport-wizard__search">
      <input
        type="search"
        value={searchQuery}
        onChange={event => onSearchQueryChange(event.target.value)}
        placeholder="Введите инвентарный номер, IP или модель"
      />
      <button type="button" onClick={onSearch}>
        Найти устройство
      </button>
    </div>

    <ul className="passport-wizard__results">
      {results.length === 0 ? (
        <li className="empty">Ничего не найдено</li>
      ) : (
        results.map(device => (
          <li key={device.id} data-active={device.id === selectedDeviceId}>
            <button type="button" onClick={() => onSelectDevice(device)}>
              <span className="asset">{device.assetTag}</span>
              <span className="model">{device.modelName}</span>
              <span className="ip">{device.ipAddress}</span>
            </button>
          </li>
        ))
      )}
    </ul>

    {selectedDevice && (
      <div className="passport-wizard__device-details">
        <h3>Данные устройства</h3>
        <dl>
          <div>
            <dt>Инвентарный номер</dt>
            <dd>{selectedDevice.assetTag}</dd>
          </div>
          <div>
            <dt>IP-адрес</dt>
            <dd>{selectedDevice.ipAddress || '—'}</dd>
          </div>
          <div>
            <dt>Расположение</dt>
            <dd>{selectedDevice.location}</dd>
          </div>
          <div>
            <dt>Ответственный</dt>
            <dd>{selectedDevice.owner}</dd>
          </div>
          <div>
            <dt>Гарантия</dt>
            <dd>{formatDate(selectedDevice.warrantyUntil)}</dd>
          </div>
        </dl>

        <h4>Последние действия</h4>
        <ul>
          {selectedDevice.history.slice(0, 4).map(entry => (
            <li key={entry.id}>
              <span className="date">{formatDate(entry.date)}</span>
              <span className="action">{actionLabels[entry.action]}</span>
              <span className="employee">{entry.employee}</span>
              {entry.notes && <span className="notes">{entry.notes}</span>}
            </li>
          ))}
        </ul>
      </div>
    )}

    <form className="passport-wizard__create" onSubmit={onCreateDevice}>
      <h3>Создать изделие</h3>
      <p className="muted">
        Выберите модель и заполните ключевые поля, чтобы добавить новую позицию в инвентарь и сразу начать паспорт.
      </p>
      <div className="form-field">
        <label htmlFor={`${idPrefix}-create-model`}>Модель</label>
        <select id={`${idPrefix}-create-model`} {...createDeviceForm.register('modelId')}>
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field-grid">
        <label>
          Инвентарный номер
          <input {...createDeviceForm.register('assetTag')} placeholder="AST-1200" />
        </label>
        <label>
          Серийный номер
          <input {...createDeviceForm.register('serialNumber')} placeholder="SN987654321" />
        </label>
      </div>
      <div className="form-field-grid">
        <label>
          IP-адрес
          <input {...createDeviceForm.register('ipAddress')} placeholder="10.60.20.12" />
        </label>
        <label>
          Расположение
          <input {...createDeviceForm.register('location')} placeholder="DC-East / Rack 18" />
        </label>
      </div>
      <div className="form-field-grid">
        <label>
          Ответственный
          <input {...createDeviceForm.register('owner')} placeholder="Команда сетей" />
        </label>
        <label>
          Гарантия до
          <input type="date" {...createDeviceForm.register('warrantyUntil')} />
        </label>
      </div>
      <div className="form-field">
        <label>
          Сотрудник
          <input {...createDeviceForm.register('registeredBy')} placeholder="Фамилия и инициалы" />
        </label>
      </div>
      <button type="submit" className="secondary">
        Создать изделие
      </button>
    </form>
  </div>
);

interface ModelsTabProps {
  models: ProductPassportModel[];
  getLatestDeviceForModel: (modelId: string) => InventoryDevice | null;
  onApplyModel: (model: ProductPassportModel) => void;
  createModelForm: UseFormReturn<CreateModelForm>;
  onCreateModel: (event: React.FormEvent<HTMLFormElement>) => void;
}

const ModelsTab: React.FC<ModelsTabProps> = ({
  models,
  getLatestDeviceForModel,
  onApplyModel,
  createModelForm,
  onCreateModel,
}) => (
  <div className="passport-wizard__models" role="tabpanel">
    <div className="passport-wizard__model-list">
      {models.map(model => {
        const latest = getLatestDeviceForModel(model.id);
        return (
          <article key={model.id} className="passport-wizard__model-card">
            <header>
              <h3>{model.name}</h3>
              <p className="muted">{model.vendor} · {model.formFactor}</p>
            </header>
            {model.description && <p>{model.description}</p>}
            <dl>
              <div>
                <dt>Ответственный</dt>
                <dd>{model.defaultPassportFields.owner ?? '—'}</dd>
              </div>
              <div>
                <dt>Расположение</dt>
                <dd>{model.defaultPassportFields.location ?? '—'}</dd>
              </div>
              <div>
                <dt>IP по умолчанию</dt>
                <dd>{model.defaultPassportFields.ipAddress ?? '—'}</dd>
              </div>
            </dl>
            {latest && (
              <p className="muted">Последняя работа: {latest.assetTag} · {formatDate(latest.lastUpdated)}</p>
            )}
            <footer>
              <button type="button" onClick={() => onApplyModel(model)}>
                Выбрать модель
              </button>
            </footer>
          </article>
        );
      })}
    </div>

    <form className="passport-wizard__create-model" onSubmit={onCreateModel}>
      <h3>Новый шаблон модели</h3>
      <div className="form-field-grid">
        <label>
          Название
          <input {...createModelForm.register('name', { required: true })} placeholder="Коммутатор доступа" />
        </label>
        <label>
          Производитель
          <input {...createModelForm.register('vendor')} placeholder="Cisco" />
        </label>
      </div>
      <div className="form-field-grid">
        <label>
          Форм-фактор
          <input {...createModelForm.register('formFactor')} placeholder="Стоечный 1U" />
        </label>
        <label>
          Базовый шаблон
          <select {...createModelForm.register('baseTemplate')}>
            {baseTemplateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-field-grid">
        <label>
          Ответственный
          <input {...createModelForm.register('defaultOwner')} placeholder="Команда сетей" />
        </label>
        <label>
          Расположение
          <input {...createModelForm.register('defaultLocation')} placeholder="DC-West / Rack 42" />
        </label>
      </div>
      <div className="form-field-grid">
        <label>
          IP по умолчанию
          <input {...createModelForm.register('defaultIpAddress')} placeholder="10.24.42.10" />
        </label>
        <label>
          Гарантия до
          <input type="date" {...createModelForm.register('defaultWarranty')} />
        </label>
      </div>
      <div className="form-field">
        <label>
          Описание
          <textarea {...createModelForm.register('description')} rows={3} placeholder="Примечания и область применения" />
        </label>
      </div>
      <button type="submit" className="secondary">
        Сохранить модель
      </button>
    </form>
  </div>
);

export const ProductPassportWizard: React.FC = () => {
  const idPrefix = useId();
  const {
    inventory,
    models,
    findDevices,
    createDevice,
    createModel,
    applyModelTemplate,
  } = useProductPassport();

  const { control, handleSubmit, setValue } = useForm<ProductPassportForm>({
    defaultValues: {
      assetTag: '',
      model: '',
      serialNumber: '',
      ipAddress: '',
      location: '',
      owner: '',
      warrantyUntil: '',
    },
  });

  const createDeviceForm = useForm<CreateDeviceForm>({
    defaultValues: {
      modelId: models[0]?.id ?? '',
      assetTag: '',
      serialNumber: '',
      ipAddress: '',
      location: '',
      owner: '',
      warrantyUntil: '',
      registeredBy: '',
    },
  });

  const createModelForm = useForm<CreateModelForm>({
    defaultValues: {
      name: '',
      vendor: '',
      formFactor: '',
      baseTemplate: 'switch',
      defaultOwner: '',
      defaultLocation: '',
      defaultWarranty: '',
      defaultIpAddress: '',
      description: '',
    },
  });

  useEffect(() => {
    if (models.length === 0) {
      return;
    }

    const currentModelId = createDeviceForm.getValues('modelId');
    if (!currentModelId) {
      createDeviceForm.setValue('modelId', models[0].id);
    }
  }, [models, createDeviceForm]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'models'>('inventory');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setSearchResults(inventory.slice(0, 6));
  }, [inventory]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setStatusMessage(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const selectedDevice = useMemo<InventoryDevice | null>(() => {
    if (!selectedDeviceId) {
      return null;
    }

    return inventory.find(device => device.id === selectedDeviceId) ?? null;
  }, [inventory, selectedDeviceId]);

  const setFormValues = useCallback(
    (values: Partial<ProductPassportForm>) => {
      (Object.entries(values) as Array<[keyof ProductPassportForm, string | undefined]>).forEach(
        ([field, value]) => {
          if (typeof value === 'string') {
            setValue(field, value);
          }
        },
      );
    },
    [setValue],
  );

  const handleDeviceSelect = useCallback(
    (device: InventoryDevice) => {
      setSelectedDeviceId(device.id);
      const defaults: Partial<ProductPassportForm> = {
        assetTag: device.assetTag,
        model: device.modelName,
        serialNumber: device.serialNumber,
        ipAddress: device.ipAddress,
        location: device.location,
        owner: device.owner,
        warrantyUntil: device.warrantyUntil ?? '',
      };

      setFormValues(defaults);

      applyModelTemplate(device.modelId, {
        source: 'inventory',
        defaultFields: defaults,
        meta: {
          assetTag: device.assetTag,
          serialNumber: device.serialNumber,
          ipAddress: device.ipAddress,
          modelId: device.modelId,
        },
      });

      setStatusMessage(`Устройство ${device.assetTag} подставлено из инвентаря.`);
    },
    [applyModelTemplate, setFormValues],
  );

  const handleSearchDevices = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults(inventory.slice(0, 6));
      return;
    }

    const results = findDevices(searchQuery);
    setSearchResults(results);
    if (results.length === 0) {
      setStatusMessage('Подходящих устройств не найдено.');
    }
  }, [findDevices, inventory, searchQuery]);

  const getLatestDeviceForModel = useCallback(
    (modelId: string) =>
      inventory
        .filter(device => device.modelId === modelId)
        .sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''))[0] ?? null,
    [inventory],
  );

  const handleModelApply = useCallback(
    (model: ProductPassportModel) => {
      const latest = getLatestDeviceForModel(model.id);
      const defaults: Partial<ProductPassportForm> = {
        model: model.name,
        owner: model.defaultPassportFields.owner ?? '',
        location: model.defaultPassportFields.location ?? '',
        warrantyUntil: model.defaultPassportFields.warrantyUntil ?? '',
        ipAddress: model.defaultPassportFields.ipAddress ?? '',
      };

      if (latest) {
        defaults.assetTag = latest.assetTag;
        defaults.serialNumber = latest.serialNumber;
        defaults.location = latest.location;
        defaults.owner = latest.owner;
        defaults.ipAddress = latest.ipAddress;
        defaults.warrantyUntil = latest.warrantyUntil ?? defaults.warrantyUntil;
      }

      setFormValues(defaults);
      if (latest) {
        setSelectedDeviceId(latest.id);
      }

      applyModelTemplate(model.id, {
        source: 'model',
        defaultFields: defaults,
        meta: {
          modelId: model.id,
          assetTag: defaults.assetTag,
          serialNumber: defaults.serialNumber,
          ipAddress: defaults.ipAddress,
        },
      });

      setActiveTab('inventory');
      setStatusMessage(
        latest
          ? `Шаблон модели «${model.name}» применён. Использовано устройство ${latest.assetTag}.`
          : `Шаблон модели «${model.name}» применён.`,
      );
    },
    [applyModelTemplate, getLatestDeviceForModel, setFormValues],
  );

  const onCreateDevice = createDeviceForm.handleSubmit(values => {
    const device = createDevice({
      modelId: values.modelId,
      assetTag: values.assetTag,
      serialNumber: values.serialNumber,
      ipAddress: values.ipAddress,
      location: values.location,
      owner: values.owner,
      warrantyUntil: values.warrantyUntil,
      registeredBy: values.registeredBy,
    });

    if (!device) {
      setStatusMessage('Не удалось создать изделие. Проверьте выбранную модель.');
      return;
    }

    handleDeviceSelect(device);
    setSearchResults(current => [device, ...current.filter(item => item.id !== device.id)].slice(0, 6));
    setStatusMessage(`Изделие ${device.assetTag} создано и готово к заполнению паспорта.`);
    setActiveTab('inventory');

    createDeviceForm.reset({
      modelId: values.modelId,
      assetTag: '',
      serialNumber: '',
      ipAddress: '',
      location: '',
      owner: '',
      warrantyUntil: '',
      registeredBy: '',
    });
  });

  const onCreateModel = createModelForm.handleSubmit(values => {
    const model = createModel({
      name: values.name,
      vendor: values.vendor,
      formFactor: values.formFactor,
      baseTemplate: values.baseTemplate,
      defaultOwner: values.defaultOwner,
      defaultLocation: values.defaultLocation,
      defaultWarranty: values.defaultWarranty,
      defaultIpAddress: values.defaultIpAddress,
      description: values.description,
    });

    setStatusMessage(`Модель «${model.name}» сохранена и доступна для подстановки.`);
    createModelForm.reset({
      name: '',
      vendor: '',
      formFactor: '',
      baseTemplate: values.baseTemplate,
      defaultOwner: '',
      defaultLocation: '',
      defaultWarranty: '',
      defaultIpAddress: '',
      description: '',
    });
  });

  const onSubmit = handleSubmit(data => {
    console.log('Generating product passport', data);
    setStatusMessage('Черновик паспорта подготовлен.');
  });

  return (
    <section className="passport-wizard">
      <header className="passport-wizard__header">
        <div>
          <h2>Мастер создания паспорта изделия</h2>
          <p className="muted">Автоматически заполните данные из инвентаря и сформируйте PDF-паспорт.</p>
        </div>
        <span className="status-badge status-online">Подключено</span>
      </header>

      {statusMessage && <div className="passport-wizard__status">{statusMessage}</div>}

      <WizardStepper steps={steps} />

      <div className="passport-wizard__layout">
        <PassportForm
          control={control}
          fieldConfigs={WIZARD_FIELDS}
          idPrefix={idPrefix}
          onSubmit={onSubmit}
        />

        <aside className="passport-wizard__sidebar">
          <div className="passport-wizard__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={activeTab === 'inventory' ? 'active' : ''}
              aria-selected={activeTab === 'inventory'}
              onClick={() => setActiveTab('inventory')}
            >
              Инвентарь
            </button>
            <button
              type="button"
              role="tab"
              className={activeTab === 'models' ? 'active' : ''}
              aria-selected={activeTab === 'models'}
              onClick={() => setActiveTab('models')}
            >
              Модели изделий
            </button>
          </div>

          {activeTab === 'inventory' ? (
            <InventoryTab
              searchQuery={searchQuery}
              onSearchQueryChange={value => setSearchQuery(value)}
              onSearch={handleSearchDevices}
              results={searchResults}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={handleDeviceSelect}
              selectedDevice={selectedDevice}
              models={models}
              idPrefix={idPrefix}
              createDeviceForm={createDeviceForm}
              onCreateDevice={onCreateDevice}
            />
          ) : (
            <ModelsTab
              models={models}
              getLatestDeviceForModel={getLatestDeviceForModel}
              onApplyModel={handleModelApply}
              createModelForm={createModelForm}
              onCreateModel={onCreateModel}
            />
          )}
        </aside>
      </div>
    </section>
  );
};
