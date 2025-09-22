
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { productPassportRepository } from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';
import { DeviceModelsTab } from './workspace/tabs/DeviceModelsTab';
import { InventoryTab } from './workspace/tabs/InventoryTab';
import { PassportWizardTab } from './workspace/tabs/PassportWizardTab';
import { TemplatesTab } from './workspace/tabs/TemplatesTab';


const deviceStatusLabels: Record<DeviceStatus, string> = {
  in_service: 'В эксплуатации',
  maintenance: 'На обслуживании',
  storage: 'Склад',
  decommissioned: 'Списано',
};

// helper and modal components will be appended below

type TemplateFieldValue = string | number | boolean | string[];

type DeviceFormValues = {
  assetTag: string;
  deviceModelId: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
  status: DeviceStatus;
  historyNote?: string;
};

type TemplateFieldDraft = {
  id: string;
  label: string;
  key: string;
  type: PassportTemplateField['type'];
  required: boolean;
  options: string;
  placeholder?: string;
  defaultValue?: string;
};

type TemplateCreationPayload = {
  name: string;
  description?: string;
  deviceModelId: string;
  setActive: boolean;
  isActive?: boolean;
  fields: PassportTemplateField[];
};

const createSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-');

const formatDateTime = (value: string) => new Date(value).toLocaleString('ru-RU', { hour12: false });

const formatFieldValue = (value: TemplateFieldValue | undefined) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет';
  }
  if (value === undefined || value === '') {
    return '—';
  }
  return String(value);
};

const buildExportRows = (passport: ProductPassport, history: DeviceHistoryEntry[]) => {
  const rows: Array<[string, string]> = [];
  rows.push(['Паспорт изделия', `${passport.metadata.assetTag} (версия ${passport.version})`]);
  rows.push(['Статус', passport.status === 'ready' ? 'Готов' : 'Черновик']);
  rows.push(['Дата обновления', formatDateTime(passport.updatedAt)]);
  rows.push(['', '']);
  rows.push(['Инвентарный номер', passport.metadata.assetTag]);
  rows.push(['Модель', passport.metadata.modelName]);
  rows.push(['Производитель', passport.metadata.vendor ?? '—']);
  rows.push(['Серийный номер', passport.metadata.serialNumber]);
  rows.push(['IP-адрес', passport.metadata.ipAddress]);
  rows.push(['Расположение', passport.metadata.location]);
  rows.push(['Ответственный', passport.metadata.owner]);
  rows.push(['', '']);
  rows.push(['Поля шаблона', '']);
  passport.schema.forEach(field => {
    rows.push([field.label, formatFieldValue(passport.fieldValues[field.key])]);
  });
  rows.push(['', '']);
  rows.push(['История устройства', '']);
  history.forEach(entry => {
    rows.push([formatDateTime(entry.ts), `${entry.action}: ${entry.details} (${entry.actor})`]);
  });
  return rows;
};

const downloadWorkbook = (rows: Array<[string, string]>, filename: string) => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Паспорт');
  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};

const downloadPdf = (rows: Array<[string, string]>, filename: string) => {
  const doc = new JsPdfConstructor({ unit: 'pt', format: 'a4' });
  const marginLeft = 48;
  const marginTop = 56;
  let cursorY = marginTop;
  doc.setFontSize(16);
  doc.text(`Паспорт изделия ${filename}`, marginLeft, cursorY);
  cursorY += 24;
  doc.setFontSize(11);
  rows.forEach(([left, right]) => {
    if (!left && !right) {
      cursorY += 12;
      return;
    }
    const text = right ? `${left}: ${right}` : left;
    const splitted = doc.splitTextToSize(text, 500);
    if (cursorY + splitted.length * 14 > 780) {
      doc.addPage();
      cursorY = marginTop;
    }
    doc.text(splitted, marginLeft, cursorY);
    cursorY += splitted.length * 14;
  });
  doc.save(`${filename}.pdf`);
};

const getMissingRequired = (schema: PassportTemplateField[], values: Record<string, TemplateFieldValue>) =>
  schema
    .filter(field => field.required)
    .filter(field => {
      const value = values[field.key];
      if (field.type === 'checkbox') {
        return value !== true;
      }
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === undefined || value === '';
    })
    .map(field => field.label);

const normalizeFieldDraft = (draft: TemplateFieldDraft): PassportTemplateField => ({
  id: draft.id,
  key: draft.key || createSlug(draft.label) || draft.id,
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
});

const generateTempId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

const DeviceFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: DeviceFormValues) => Promise<void>;
  models: DeviceModel[];
  title: string;
  submitLabel: string;
}> = ({ isOpen, onClose, onSubmit, models, title, submitLabel }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<DeviceFormValues>({
    defaultValues: {
      assetTag: '',
      deviceModelId: models[0]?.id ?? '',
      serialNumber: '',
      ipAddress: '',
      location: '',
      owner: '',
      status: 'in_service',
      historyNote: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    reset({
      assetTag: '',
      deviceModelId: models[0]?.id ?? '',
      serialNumber: '',
      ipAddress: '',
      location: '',
      owner: '',
      status: 'in_service',
      historyNote: '',
    });
  }, [isOpen, models, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form
        className="stacked-form"
        onSubmit={handleSubmit(async values => {
          await onSubmit(values);
          reset({
            assetTag: '',
            deviceModelId: models[0]?.id ?? '',
            serialNumber: '',
            ipAddress: '',
            location: '',
            owner: '',
            status: 'in_service',
            historyNote: '',
          });
        })}
      >
        <label>
          Инвентарный номер
          <input {...register('assetTag', { required: true })} placeholder="AST-1001" />
        </label>
        <label>
          Модель
          <select {...register('deviceModelId', { required: true })}>
            <option value="">Выберите модель</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.vendor} {model.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Серийный номер
          <input {...register('serialNumber', { required: true })} placeholder="SN123456789" />
        </label>
        <label>
          IP-адрес
          <input {...register('ipAddress', { required: true })} placeholder="10.10.10.5" />
        </label>
        <label>
          Расположение
          <input {...register('location', { required: true })} placeholder="DC-West / Стойка 42" />
        </label>
        <label>
          Ответственная команда
          <input {...register('owner', { required: true })} placeholder="Команда сетей" />
        </label>
        <label>
          Статус
          <select {...register('status', { required: true })}>
            {Object.entries(deviceStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Примечание к истории
          <textarea {...register('historyNote')} placeholder="Например, получено со склада" rows={2} />
        </label>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const TemplateEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  models: DeviceModel[];
  defaultModelId?: string;
  onSubmit: (payload: TemplateCreationPayload) => Promise<void>;
}> = ({ isOpen, onClose, models, defaultModelId, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deviceModelId, setDeviceModelId] = useState(defaultModelId ?? models[0]?.id ?? '');
  const [setActive, setSetActive] = useState(true);
  const [fields, setFields] = useState<TemplateFieldDraft[]>([
    {
      id: generateTempId(),
      label: 'Наименование узла',
      key: 'nodeName',
      type: 'text',
      required: true,
      options: '',
    },
  ]);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setDeviceModelId(defaultModelId ?? models[0]?.id ?? '');
  }, [defaultModelId, models, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Укажите название шаблона.');
      return;
    }
    if (!deviceModelId) {
      toast.error('Выберите модель изделия.');
      return;
    }
    const normalizedFields = fields
      .filter(field => field.label.trim())
      .map(field => {
        const key = field.key.trim() || createSlug(field.label) || field.id;
        return normalizeFieldDraft({ ...field, key });
      });
    if (normalizedFields.length === 0) {
      toast.error('Добавьте хотя бы одно поле.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description,
        deviceModelId,
        setActive,
        isActive: setActive,
        fields: normalizedFields,
      });
      setName('');
      setDescription('');
      setFields([
        {
          id: generateTempId(),
          label: 'Наименование узла',
          key: 'nodeName',
          type: 'text',
          required: true,
          options: '',
        },
      ]);
      toast.success('Шаблон сохранён.');
      onClose();
    } catch {
      toast.error('Не удалось сохранить шаблон.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новый шаблон паспорта">
      <form className="stacked-form" onSubmit={handleSubmit}>
        <label>
          Название шаблона
          <input value={name} onChange={event => setName(event.target.value)} placeholder="Паспорт ядрового коммутатора" />
        </label>
        <label>
          Описание
          <textarea value={description} onChange={event => setDescription(event.target.value)} rows={2} />
        </label>
        <label>
          Модель изделия
          <select value={deviceModelId} onChange={event => setDeviceModelId(event.target.value)}>
            <option value="">Выберите модель</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.vendor} {model.name}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={setActive} onChange={event => setSetActive(event.target.checked)} />
          Сделать шаблон активным по умолчанию
        </label>
        <div className="passport-section">
          <div className="passport-section__header">
            <h3 className="passport-section__title">Поля</h3>
            <div className="passport-section__controls">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setFields(current => [
                    ...current,
                    {
                      id: generateTempId(),
                      label: '',
                      key: '',
                      type: 'text',
                      required: false,
                      options: '',
                    },
                  ])
                }
              >
                Добавить поле
              </button>
            </div>
          </div>
          {fields.map(field => (
            <div key={field.id} className="passport-row-editor">
              <div className="passport-row-editor__name">
                <label>
                  Название поля
                  <input
                    value={field.label}
                    onChange={event =>
                      setFields(current =>
                        current.map(item =>
                          item.id === field.id ? { ...item, label: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Например, Зона размещения"
                  />
                </label>
              </div>
              <div className="passport-row-editor__entries">
                <label>
                  Ключ
                  <input
                    value={field.key}
                    onChange={event =>
                      setFields(current =>
                        current.map(item => (item.id === field.id ? { ...item, key: event.target.value } : item)),
                      )
                    }
                    placeholder="zone"
                  />
                </label>
                <label>
                  Тип
                  <select
                    value={field.type}
                    onChange={event =>
                      setFields(current =>
                        current.map(item =>
                          item.id === field.id
                            ? { ...item, type: event.target.value as PassportTemplateField['type'] }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="text">Текст</option>
                    <option value="number">Число</option>
                    <option value="date">Дата</option>
                    <option value="select">Список</option>
                    <option value="checkbox">Флажок</option>
                    <option value="multiline">Многострочный текст</option>
                  </select>
                </label>
                {field.type === 'select' ? (
                  <label>
                    Варианты (через запятую)
                    <input
                      value={field.options}
                      onChange={event =>
                        setFields(current =>
                          current.map(item =>
                            item.id === field.id ? { ...item, options: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </label>
                ) : null}
                <label>
                  Значение по умолчанию
                  <input
                    value={field.defaultValue ?? ''}
                    onChange={event =>
                      setFields(current =>
                        current.map(item =>
                          item.id === field.id ? { ...item, defaultValue: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Например, Готов"
                  />
                </label>
              </div>
              <div className="passport-row-editor__controls">
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={event =>
                      setFields(current =>
                        current.map(item =>
                          item.id === field.id ? { ...item, required: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  Обязательное поле
                </label>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setFields(current => current.filter(item => item.id !== field.id))}
                  disabled={fields.length === 1}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            Сохранить шаблон
          </button>
        </div>
      </form>
    </Modal>
  );
};

const TemplateSaveModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; description?: string; setActive: boolean }) => Promise<void>;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [setActive, setSetActive] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Укажите название шаблона.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined, setActive });
      toast.success('Шаблон сохранён.');
      setName('');
      setDescription('');
      setSetActive(true);
      onClose();
    } catch {
      toast.error('Не удалось сохранить шаблон.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Сохранить как шаблон">
      <form className="stacked-form" onSubmit={handleSubmit}>
        <label>
          Название шаблона
          <input value={name} onChange={event => setName(event.target.value)} />
        </label>
        <label>
          Описание
          <textarea value={description} onChange={event => setDescription(event.target.value)} rows={2} />
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={setActive} onChange={event => setSetActive(event.target.checked)} />
          Сделать активным для модели
        </label>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  );
};

const DeviceSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  devices: NetworkDevice[];
  models: DeviceModel[];
  onSelect: (device: NetworkDevice) => void;
}> = ({ isOpen, onClose, devices, models, onSelect }) => {
  const [assetTag, setAssetTag] = useState('');
  const [modelId, setModelId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<NetworkDevice[]>(devices);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setResults(devices);
  }, [devices, isOpen]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = await productPassportRepository.searchDevices({
      assetTag: assetTag || undefined,
      deviceModelId: modelId || undefined,
      serialNumber: serialNumber || undefined,
      ipAddress: ipAddress || undefined,
      status: status || undefined,
    });
    setResults(found);
  };

  if (!isOpen) {
    return null;
  }

  const modelMap = new Map<string, DeviceModel>(models.map(model => [model.id, model]));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Поиск устройства">
      <form className="stacked-form" onSubmit={handleSearch}>
        <div className="form-grid">
          <label>
            Инвентарный номер
            <input value={assetTag} onChange={event => setAssetTag(event.target.value)} placeholder="AST-1001" />
          </label>
          <label>
            Модель
            <select value={modelId} onChange={event => setModelId(event.target.value)}>
              <option value="">Все</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.vendor} {model.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Серийный номер
            <input value={serialNumber} onChange={event => setSerialNumber(event.target.value)} />
          </label>
          <label>
            IP-адрес
            <input value={ipAddress} onChange={event => setIpAddress(event.target.value)} />
          </label>
          <label>
            Статус
            <select value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">Все</option>
              {Object.entries(deviceStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Закрыть
          </button>
          <button type="submit" className="primary">
            Найти
          </button>
        </div>
      </form>
      <div className="inventory-table__viewport" style={{ maxHeight: 280 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Инв. №</th>
              <th>Модель</th>
              <th>Серийный</th>
              <th>IP</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6}>Ничего не найдено</td>
              </tr>
            ) : (
              results.map(device => {
                const model = modelMap.get(device.deviceModelId);
                return (
                  <tr key={device.id}>
                    <td>{device.assetTag}</td>
                    <td>{model ? `${model.vendor} ${model.name}` : '—'}</td>
                    <td>{device.serialNumber}</td>
                    <td>{device.ipAddress}</td>
                    <td>{deviceStatusLabels[device.status]}</td>
                    <td>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          onSelect(device);
                          onClose();
                        }}
                      >
                        Выбрать
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

const InventoryTab: React.FC<{ devices: NetworkDevice[]; models: DeviceModel[] }> = ({ devices, models }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const createDevice = useMutation({
    mutationFn: (values: DeviceFormValues) => productPassportRepository.createDevice(values),
    onSuccess: device => {
      queryClient.setQueryData<NetworkDevice[] | undefined>(queryKeys.productPassports.devices, previous =>
        previous ? [...previous, device] : [device],
      );
      toast.success('Изделие добавлено в инвентарь.');
      setModalOpen(false);
    },
    onError: () => toast.error('Не удалось создать изделие.'),
  });

  const modelMap = useMemo(() => new Map<string, DeviceModel>(models.map(model => [model.id, model])), [models]);



export const ProductPassportWorkspace = () => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'inventory' | 'models' | 'templates'>('wizard');

  const devicesQuery = useQuery({
    queryKey: queryKeys.productPassports.devices,
    queryFn: () => productPassportRepository.listDevices(),
  });
  const modelsQuery = useQuery({
    queryKey: queryKeys.productPassports.deviceModels,
    queryFn: () => productPassportRepository.listDeviceModels(),
  });
  const templatesQuery = useQuery({
    queryKey: queryKeys.productPassports.templates(),
    queryFn: () => productPassportRepository.listTemplates(),
  });

  if (devicesQuery.isLoading || modelsQuery.isLoading || templatesQuery.isLoading) {
    return (
      <section className="passport-wizard">
        <p className="muted">Загрузка данных мастера…</p>
      </section>
    );
  }

  const devices = devicesQuery.data ?? [];
  const models = modelsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  return (
    <div className="passport-workspace">
      <div className="tab-strip">
        <button
          type="button"
          className={activeTab === 'wizard' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('wizard')}
        >
          Мастер паспорта
        </button>
        <button
          type="button"
          className={activeTab === 'inventory' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('inventory')}
        >
          Инвентарь
        </button>
        <button
          type="button"
          className={activeTab === 'models' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('models')}
        >
          Модели изделий
        </button>
        <button
          type="button"
          className={activeTab === 'templates' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('templates')}
        >
          Шаблоны паспортов
        </button>
      </div>
      {activeTab === 'wizard' ? (
        <PassportWizardTab devices={devices} models={models} templates={templates} />
      ) : null}
      {activeTab === 'inventory' ? <InventoryTab devices={devices} models={models} /> : null}
      {activeTab === 'models' ? <DeviceModelsTab models={models} /> : null}
      {activeTab === 'templates' ? <TemplatesTab templates={templates} models={models} /> : null}
    </div>
  );
};
