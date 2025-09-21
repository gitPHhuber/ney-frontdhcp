import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import JsPdfConstructor from 'jspdf';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Modal from '../../components/ui/Modal';
import {
  productPassportRepository,
  type DeviceHistoryEntry,
  type DeviceModel,
  type DeviceStatus,
  type NetworkDevice,
  type PassportTemplate,
  type PassportTemplateField,
  type ProductPassport,
} from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';
import {
  buildExportRows,
  downloadPassportPdf,
  downloadPassportWorkbook,
} from './export';
import { formatDateTime } from './utils/formatDateTime';
import type {
  DeviceFormValues,
  TemplateCreationPayload,
  TemplateFieldDraft,
  TemplateFieldValue,
} from './workspace/types';

const deviceStatusLabels: Record<DeviceStatus, string> = {
  in_service: 'В эксплуатации',
  maintenance: 'На обслуживании',
  storage: 'Склад',
  decommissioned: 'Списано',
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

type ExportRow = [string, string];

const createPassportSummary = (passport: ProductPassport): ExportRow[] => [
  ['Паспорт изделия', `${passport.metadata.assetTag} (версия ${passport.version})`],
  ['Статус', passport.status === 'ready' ? 'Готов' : 'Черновик'],
  ['Дата обновления', formatDateTime(passport.updatedAt)],
];

const createDeviceMetadataRows = (passport: ProductPassport): ExportRow[] => [
  ['Инвентарный номер', passport.metadata.assetTag],
  ['Модель', passport.metadata.modelName],
  ['Производитель', passport.metadata.vendor ?? '—'],
  ['Серийный номер', passport.metadata.serialNumber],
  ['IP-адрес', passport.metadata.ipAddress],
  ['Расположение', passport.metadata.location],
  ['Ответственный', passport.metadata.owner],
];

const createSchemaRows = (passport: ProductPassport): ExportRow[] =>
  passport.schema.map(field => [field.label, formatFieldValue(passport.fieldValues[field.key])]);

const createHistoryRows = (history: DeviceHistoryEntry[]): ExportRow[] =>
  history.map(entry => [formatDateTime(entry.ts), `${entry.action}: ${entry.details} (${entry.actor})`]);

const buildExportRows = (passport: ProductPassport, history: DeviceHistoryEntry[]) => {
  const rows: ExportRow[] = [
    ...createPassportSummary(passport),
    ['', ''],
    ...createDeviceMetadataRows(passport),
    ['', ''],
    ['Поля шаблона', ''],
    ...createSchemaRows(passport),
    ['', ''],
    ['История устройства', ''],
    ...createHistoryRows(history),
  ];
  return rows;
};



const createExcelBlob = (rows: ExportRow[]) => {

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Паспорт');
  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const triggerFileDownload = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};




const exportRowsToPdf = (rows: ExportRow[], filename: string) => {

  const doc = new JsPdfConstructor({ unit: 'pt', format: 'a4' });
  const marginLeft = 48;
  const marginTop = 56;
  let cursorY = marginTop;

  doc.setFontSize(16);
  doc.text(`Паспорт изделия ${filename}`, marginLeft, cursorY);
  cursorY += 24;

  const writeRow = (left: string, right: string) => {
    const text = right ? `${left}: ${right}` : left;
    const splitted = doc.splitTextToSize(text, 500);
    if (cursorY + splitted.length * 14 > 780) {
      doc.addPage();
      cursorY = marginTop;
    }
    doc.text(splitted, marginLeft, cursorY);
    cursorY += splitted.length * 14;
  };

  const addSpacing = (value: number) => {
    cursorY += value;
  };

  doc.setFontSize(11);
  rows.forEach(([left, right]) => {
    if (!left && !right) {
      addSpacing(12);
      return;
    }
    writeRow(left, right);
  });

  doc.save(`${filename}.pdf`);
};


const downloadWorkbook = (rows: ExportRow[], filename: string) => {
  const blob = createExcelBlob(rows);
  triggerFileDownload(blob, `${filename}.xlsx`);
};

const downloadPdf = (rows: ExportRow[], filename: string) => {
  exportRowsToPdf(rows, filename);
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

const createBlankFieldDraft = (): TemplateFieldDraft => ({
  id: generateTempId(),
  label: 'Наименование узла',
  key: 'nodeName',
  type: 'text',
  required: true,
  options: '',
});

const createDefaultDeviceFormValues = (models: DeviceModel[]): DeviceFormValues => ({
  assetTag: '',
  deviceModelId: models[0]?.id ?? '',
  serialNumber: '',
  ipAddress: '',
  location: '',
  owner: '',
  status: 'in_service',
  historyNote: '',
});

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
    defaultValues: createDefaultDeviceFormValues(models),
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    reset(createDefaultDeviceFormValues(models));
  }, [isOpen, models, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form
        className="stacked-form"
        onSubmit={handleSubmit(async values => {
          await onSubmit(values);
          reset(createDefaultDeviceFormValues(models));
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
  const [fields, setFields] = useState<TemplateFieldDraft[]>([createBlankFieldDraft()]);
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
      setFields([createBlankFieldDraft()]);
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
                      ...createBlankFieldDraft(),
                      label: '',
                      key: '',
                      required: false,
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

  const filteredDevices = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return devices;
    }
    return devices.filter(device =>
      [
        device.assetTag,
        device.serialNumber,
        device.ipAddress,
        device.location,
        device.owner,
        modelMap.get(device.deviceModelId)?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [devices, search, modelMap]);

  return (
    <section className="passport-constructor">
      <header className="passport-constructor__header">
        <div>
          <h2>Инвентарь сетевых устройств</h2>
          <p className="muted">Отсюда можно создать запись и использовать её в мастере паспорта.</p>
        </div>
        <div className="passport-constructor__actions">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Быстрый поиск по таблице"
          />
          <button type="button" className="primary" onClick={() => setModalOpen(true)}>
            Создать изделие
          </button>
        </div>
      </header>
      <div className="passport-constructor__content">
        <div className="passport-constructor__editor">
          <table className="data-table">
            <thead>
              <tr>
                <th>Инв. №</th>
                <th>Модель</th>
                <th>Серийный</th>
                <th>IP</th>
                <th>Расположение</th>
                <th>Ответственный</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map(device => {
                const model = modelMap.get(device.deviceModelId);
                return (
                  <tr key={device.id}>
                    <td>{device.assetTag}</td>
                    <td>{model ? `${model.vendor} ${model.name}` : '—'}</td>
                    <td>{device.serialNumber}</td>
                    <td>{device.ipAddress}</td>
                    <td>{device.location}</td>
                    <td>{device.owner}</td>
                    <td>{deviceStatusLabels[device.status]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <DeviceFormModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        models={models}
        title="Новое сетевое устройство"
        submitLabel="Создать"
        onSubmit={async values => {
          await createDevice.mutateAsync(values);
        }}
      />
    </section>
  );
};

const DeviceModelsTab: React.FC<{ models: DeviceModel[] }> = ({ models }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Omit<DeviceModel, 'id'>>({ defaultValues: { vendor: '', name: '', description: '' } });
  const createModel = useMutation({
    mutationFn: (values: Omit<DeviceModel, 'id'>) => productPassportRepository.createDeviceModel(values),
    onSuccess: model => {
      queryClient.setQueryData<DeviceModel[] | undefined>(queryKeys.productPassports.deviceModels, previous =>
        previous ? [...previous, model] : [model],
      );
      toast.success('Модель добавлена.');
      reset();
    },
    onError: () => toast.error('Не удалось добавить модель.'),
  });

  return (
    <section className="passport-constructor">
      <header className="passport-constructor__header">
        <div>
          <h2>Модели изделий</h2>
          <p className="muted">Справочник доступных моделей для шаблонов и паспортов.</p>
        </div>
      </header>
      <div className="passport-constructor__content">
        <div className="passport-constructor__editor">
          <table className="data-table">
            <thead>
              <tr>
                <th>Вендор</th>
                <th>Модель</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.id}>
                  <td>{model.vendor}</td>
                  <td>{model.name}</td>
                  <td>{model.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="passport-constructor__preview">
          <form className="stacked-form" onSubmit={handleSubmit(values => createModel.mutateAsync(values))}>
            <h3>Добавить модель</h3>
            <label>
              Вендор
              <input {...register('vendor', { required: true })} placeholder="Cisco" />
            </label>
            <label>
              Название модели
              <input {...register('name', { required: true })} placeholder="Catalyst 9500" />
            </label>
            <label>
              Описание
              <textarea {...register('description')} rows={3} />
            </label>
            <button type="submit" className="primary" disabled={isSubmitting}>
              Сохранить модель
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
};

const TemplatesTab: React.FC<{
  templates: PassportTemplate[];
  models: DeviceModel[];
}> = ({ templates, models }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const createTemplate = useMutation({
    mutationFn: (payload: TemplateCreationPayload) =>
      productPassportRepository.createTemplate({
        deviceModelId: payload.deviceModelId,
        name: payload.name,
        description: payload.description,
        fields: payload.fields,
        isActive: payload.setActive,
        setActive: payload.setActive,
      }),
    onSuccess: template => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates(template.deviceModelId) });
      toast.success('Шаблон сохранён.');
      setModalOpen(false);
    },
    onError: () => toast.error('Не удалось сохранить шаблон.'),
  });

  const setActiveMutation = useMutation({
    mutationFn: (templateId: string) => productPassportRepository.setTemplateActive(templateId),
    onSuccess: (_, templateId) => {
      const template = templates.find(item => item.id === templateId);
      if (template) {
        queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates(template.deviceModelId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates() });
      toast.success('Шаблон активирован.');
    },
    onError: () => toast.error('Не удалось обновить шаблон.'),
  });

  const modelMap = useMemo(() => new Map<string, DeviceModel>(models.map(model => [model.id, model])), [models]);

  return (
    <section className="passport-constructor">
      <header className="passport-constructor__header">
        <div>
          <h2>Шаблоны паспортов</h2>
          <p className="muted">Создавайте и версионируйте шаблоны для моделей устройств.</p>
        </div>
        <div className="passport-constructor__actions">
          <button type="button" className="primary" onClick={() => setModalOpen(true)}>
            Новый шаблон
          </button>
        </div>
      </header>
      <div className="passport-constructor__content">
        <div className="passport-constructor__editor">
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Модель</th>
                <th>Версия</th>
                <th>Поля</th>
                <th>Создан</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => {
                const model = modelMap.get(template.deviceModelId);
                return (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>{model ? `${model.vendor} ${model.name}` : '—'}</td>
                    <td>v{template.version}</td>
                    <td>{template.fields.length}</td>
                    <td>{new Date(template.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td>{template.isActive ? 'Активен' : 'Черновик'}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => setActiveMutation.mutate(template.id)}
                        disabled={template.isActive}
                      >
                        Сделать активным
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <TemplateEditorModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        models={models}
        onSubmit={async payload => {
          await createTemplate.mutateAsync(payload);
        }}
      />
    </section>
  );
};

const buildDetailDefaults = (passport: ProductPassport): Record<string, TemplateFieldValue> => {
  const defaults: Record<string, TemplateFieldValue> = {};
  passport.schema.forEach(field => {
    const value = passport.fieldValues[field.key];
    if (value !== undefined) {
      defaults[field.key] = value;
      return;
    }
    if (field.defaultValue !== undefined) {
      defaults[field.key] = field.defaultValue;
      return;
    }
    defaults[field.key] = field.type === 'checkbox' ? false : '';
  });
  return defaults;
};

interface StepOneForm {
  assetTag: string;
  deviceModelId: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
}

interface MetadataForm {
  assetTag: string;
  deviceModelId: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  owner: string;
}

const wizardSteps = [
  'Поиск устройства',
  'Проверка метаданных',
  'Добавление сведений',
  'Приложения и экспорт',
];

const PassportWizardTab: React.FC<{
  devices: NetworkDevice[];
  models: DeviceModel[];
  templates: PassportTemplate[];
}> = ({ devices, models, templates }) => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [deviceHistory, setDeviceHistory] = useState<DeviceHistoryEntry[]>([]);
  const [passport, setPassport] = useState<ProductPassport | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PassportTemplate | null>(null);
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [isCreateDeviceOpen, setCreateDeviceOpen] = useState(false);
  const [isSaveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [isHistoryLoading, setHistoryLoading] = useState(false);
  const [isExporting, setExporting] = useState(false);
  const [isFinalizing, setFinalizing] = useState(false);

  const stepOneForm = useForm<StepOneForm>({
    defaultValues: {
      assetTag: '',
      deviceModelId: '',
      serialNumber: '',
      ipAddress: '',
      location: '',
      owner: '',
    },
  });

  const metadataForm = useForm<MetadataForm>({
    defaultValues: {
      assetTag: '',
      deviceModelId: '',
      serialNumber: '',
      ipAddress: '',
      location: '',
      owner: '',
    },
  });

  const detailsForm = useForm<Record<string, TemplateFieldValue>>({ defaultValues: {} });

  const assetTagWatch = stepOneForm.watch('assetTag');
  const metadataModelId = metadataForm.watch('deviceModelId');

  const availableTemplates = useMemo(
    () =>
      metadataModelId
        ? templates.filter(template => template.deviceModelId === metadataModelId)
        : selectedDevice
        ? templates.filter(template => template.deviceModelId === selectedDevice.deviceModelId)
        : [],
    [metadataModelId, selectedDevice, templates],
  );

  const modelMap = useMemo(() => new Map<string, DeviceModel>(models.map(model => [model.id, model])), [models]);

  const loadDeviceHistory = useCallback(async (deviceId: string) => {
    setHistoryLoading(true);
    try {
      const history = await productPassportRepository.getDeviceHistory(deviceId);
      setDeviceHistory(history);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const resolveTemplateById = useCallback(
    async (templateId: string | null | undefined) => {
      if (!templateId) {
        return null;
      }
      const fromCache = templates.find(template => template.id === templateId);
      if (fromCache) {
        return fromCache;
      }
      return productPassportRepository.getTemplateById(templateId);
    },
    [templates],
  );

  const loadPassport = useCallback(
    async (device: NetworkDevice, templateOverride?: PassportTemplate | null) => {
      let draft = await productPassportRepository.getDraftPassport(device.id);
      let templateToUse = templateOverride ?? null;
      if (!draft) {
        if (!templateToUse) {
          templateToUse = await productPassportRepository.getActiveTemplate(device.deviceModelId);
        }
        draft = await productPassportRepository.createDraftPassport(device.id, templateToUse ?? undefined);
      } else if (!templateToUse) {
        templateToUse = await resolveTemplateById(draft.templateId);
      }
      setPassport(draft);
      setSelectedTemplate(templateToUse ?? null);
      detailsForm.reset(buildDetailDefaults(draft));
    },
    [detailsForm, resolveTemplateById],
  );

  const handleDeviceSelected = useCallback(
    async (device: NetworkDevice) => {
      setSelectedDevice(device);
      stepOneForm.reset({
        assetTag: device.assetTag,
        deviceModelId: device.deviceModelId,
        serialNumber: device.serialNumber,
        ipAddress: device.ipAddress,
        location: device.location,
        owner: device.owner,
      });
      metadataForm.reset({
        assetTag: device.assetTag,
        deviceModelId: device.deviceModelId,
        serialNumber: device.serialNumber,
        ipAddress: device.ipAddress,
        location: device.location,
        owner: device.owner,
      });
      setActiveStep(1);
      await Promise.all([loadDeviceHistory(device.id), loadPassport(device)]);
    },
    [loadDeviceHistory, loadPassport, metadataForm, stepOneForm],
  );

  useEffect(() => {
    if (!assetTagWatch) {
      return;
    }
    const match = devices.find(device => device.assetTag.toLowerCase() === assetTagWatch.toLowerCase());
    if (match && match.id !== selectedDevice?.id) {
      handleDeviceSelected(match).catch(() => {
        toast.error('Не удалось загрузить данные устройства.');
      });
    }
  }, [assetTagWatch, devices, handleDeviceSelected, selectedDevice]);

  const handleApplyTemplate = useCallback(
    async (templateId: string) => {
      if (!passport) {
        return;
      }
      const template = await resolveTemplateById(templateId);
      if (!template) {
        toast.error('Шаблон не найден.');
        return;
      }
      const updated = await productPassportRepository.applyTemplate(passport.id, template);
      setPassport(updated);
      setSelectedTemplate(template);
      detailsForm.reset(buildDetailDefaults(updated));
      toast.success(`Применён шаблон ${template.name}.`);
    },
    [detailsForm, passport, resolveTemplateById],
  );

  const handleMetadataSubmit = metadataForm.handleSubmit(async values => {
    if (!passport) {
      return;
    }
    const model = modelMap.get(values.deviceModelId);
    const updated = await productPassportRepository.updatePassportMetadata(passport.id, {
      assetTag: values.assetTag,
      serialNumber: values.serialNumber,
      ipAddress: values.ipAddress,
      location: values.location,
      owner: values.owner,
      modelName: model?.name ?? passport.metadata.modelName,
      vendor: model?.vendor ?? passport.metadata.vendor,
    });
    setPassport(updated);
    toast.success('Метаданные обновлены.');
    if (model && (!selectedTemplate || selectedTemplate.deviceModelId !== model.id)) {
      const activeTemplate = await productPassportRepository.getActiveTemplate(model.id);
      if (activeTemplate) {
        await handleApplyTemplate(activeTemplate.id);
      }
    }
    setActiveStep(2);
  });

  const handleDetailsSubmit = detailsForm.handleSubmit(async values => {
    if (!passport) {
      return;
    }
    const missing = getMissingRequired(passport.schema, values);
    if (missing.length > 0) {
      toast.error(`Заполните обязательные поля: ${missing.join(', ')}`);
      return;
    }
    const updated = await productPassportRepository.updatePassportValues(passport.id, values);
    setPassport(updated);
    toast.success('Данные паспорта сохранены.');
    setActiveStep(3);
  });

  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!passport || !files || files.length === 0) {
      return;
    }
    for (const file of Array.from(files)) {
      const url = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : `uploaded://${file.name}`;
      await productPassportRepository.addAttachment(passport.id, { name: file.name, url });
    }
    const refreshed = await productPassportRepository.getPassportById(passport.id);
    if (refreshed) {
      setPassport(refreshed);
      toast.success('Документы добавлены.');
    }
  };

  const handleFinalize = async () => {
    if (!passport) {
      return;
    }
    setFinalizing(true);
    try {
      const currentValues = detailsForm.getValues();
      const missing = getMissingRequired(passport.schema, currentValues);
      if (missing.length > 0) {
        toast.error(`Заполните обязательные поля: ${missing.join(', ')}`);
        return;
      }
      const updatedValues = await productPassportRepository.updatePassportValues(passport.id, currentValues);
      const finalized = await productPassportRepository.finalizePassport(updatedValues.id, 'dev-admin');
      setPassport(finalized);
      toast.success('Паспорт переведён в статус «Готов».');
      queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.byId(finalized.id) });
    } finally {
      setFinalizing(false);
    }
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    if (!passport) {
      return;
    }
    setExporting(true);
    try {
      const currentValues = detailsForm.getValues();
      const missing = getMissingRequired(passport.schema, currentValues);
      if (missing.length > 0) {
        toast.error(`Заполните обязательные поля: ${missing.join(', ')}`);
        return;
      }
      await productPassportRepository.updatePassportValues(passport.id, currentValues);
      const history = await productPassportRepository.getDeviceHistory(passport.deviceId);
      const rows = buildExportRows(passport, history);
      const filename = `${passport.metadata.assetTag}-паспорт-v${passport.version}`;
      if (type === 'excel') {
        downloadPassportWorkbook(rows, filename);
      } else {
        await downloadPassportPdf(rows, filename);
      }
      toast.success(type === 'excel' ? 'Экспортирован Excel-файл.' : 'PDF сформирован.');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось сформировать файл.');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveTemplate = async (payload: { name: string; description?: string; setActive: boolean }) => {
    if (!passport) {
      return;
    }
    const template = await productPassportRepository.saveTemplateFromPassport(
      passport.id,
      payload.name,
      payload.description,
      payload.setActive,
    );
    toast.success('Шаблон создан на основе паспорта.');
    queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates(template.deviceModelId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates() });
    setSelectedTemplate(template);
    setSaveTemplateOpen(false);
  };

  const assetSuggestionsId = useMemo(() => `asset-suggestions-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <section className="passport-wizard">
      <header className="passport-wizard__header">
        <div>
          <h2>Мастер создания паспорта изделия</h2>
          <p className="muted">Автозаполнение из инвентаря, выбор шаблона и экспорт в один клик.</p>
        </div>
        <span className="status-badge status-online">Подключено</span>
      </header>
      <ol className="wizard-steps">
        {wizardSteps.map((label, index) => {
          const state = index < activeStep ? 'completed' : index === activeStep ? 'active' : 'upcoming';
          return (
            <li key={label} className="wizard-step" data-state={state}>
              <span className="wizard-step__index">{index + 1}</span>
              <span className="wizard-step__label">{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="passport-wizard__content">
        {activeStep === 0 ? (
          <form
            className="passport-wizard__form"
            onSubmit={stepOneForm.handleSubmit(() => {
              if (!selectedDevice) {
                toast.error('Выберите или создайте устройство, чтобы продолжить.');
                return;
              }
              setActiveStep(1);
            })}
          >
            <div className="passport-wizard__grid">
              <div className="form-field">
                <label htmlFor="assetTag">Инвентарный номер</label>
                <input
                  id="assetTag"
                  list={assetSuggestionsId}
                  placeholder="Например, AST-1001"
                  {...stepOneForm.register('assetTag', { required: true })}
                />
                <datalist id={assetSuggestionsId}>
                  {devices.map(device => (
                    <option key={device.id} value={device.assetTag} />
                  ))}
                </datalist>
              </div>
              <div className="form-field">
                <label htmlFor="deviceModel">Модель</label>
                <select id="deviceModel" {...stepOneForm.register('deviceModelId')}>
                  <option value="">Выберите модель</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.vendor} {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="serialNumber">Серийный номер</label>
                <input id="serialNumber" placeholder="SN123456789" {...stepOneForm.register('serialNumber')} />
              </div>
              <div className="form-field">
                <label htmlFor="ipAddress">IP-адрес</label>
                <input id="ipAddress" placeholder="10.10.10.5" {...stepOneForm.register('ipAddress')} />
              </div>
              <div className="form-field">
                <label htmlFor="location">Расположение</label>
                <input id="location" placeholder="DC-West / Стойка 42" {...stepOneForm.register('location')} />
              </div>
              <div className="form-field">
                <label htmlFor="owner">Ответственный</label>
                <input id="owner" placeholder="Команда сетей" {...stepOneForm.register('owner')} />
              </div>
            </div>
            <footer className="passport-wizard__actions">
              <button type="button" className="ghost" onClick={() => setSearchModalOpen(true)}>
                Поиск изделия
              </button>
              <button type="button" className="ghost" onClick={() => setCreateDeviceOpen(true)}>
                Создать изделие
              </button>
              <button type="submit" className="primary" disabled={!selectedDevice}>
                Перейти к метаданным
              </button>
            </footer>
          </form>
        ) : null}

        {activeStep === 1 && passport ? (
          <form className="passport-wizard__form" onSubmit={handleMetadataSubmit}>
            <div className="passport-wizard__grid">
              <div className="form-field">
                <label htmlFor="meta-asset">Инвентарный номер</label>
                <input id="meta-asset" {...metadataForm.register('assetTag', { required: true })} />
              </div>
              <div className="form-field">
                <label htmlFor="meta-model">Модель</label>
                <select id="meta-model" {...metadataForm.register('deviceModelId', { required: true })}>
                  <option value="">Выберите модель</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.vendor} {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="meta-serial">Серийный номер</label>
                <input id="meta-serial" {...metadataForm.register('serialNumber', { required: true })} />
              </div>
              <div className="form-field">
                <label htmlFor="meta-ip">IP-адрес</label>
                <input id="meta-ip" {...metadataForm.register('ipAddress', { required: true })} />
              </div>
              <div className="form-field">
                <label htmlFor="meta-location">Расположение</label>
                <input id="meta-location" {...metadataForm.register('location', { required: true })} />
              </div>
              <div className="form-field">
                <label htmlFor="meta-owner">Ответственный</label>
                <input id="meta-owner" {...metadataForm.register('owner', { required: true })} />
              </div>
            </div>
            <div className="passport-wizard__sidebar">
              <div className="form-field">
                <label htmlFor="template-select">Быстрый выбрать шаблон</label>
                <select
                  id="template-select"
                  value={selectedTemplate?.id ?? ''}
                  disabled={availableTemplates.length === 0}
                  onChange={event => handleApplyTemplate(event.target.value)}
                >
                  <option value="">Без шаблона</option>
                  {availableTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} (v{template.version})
                    </option>
                  ))}
                </select>
              </div>
              <div className="passport-history">
                <h3>Последние активности</h3>
                {isHistoryLoading ? (
                  <p className="muted">Загружается история…</p>
                ) : deviceHistory.length === 0 ? (
                  <p className="muted">История пуста.</p>
                ) : (
                  <ul>
                    {deviceHistory.slice(0, 5).map(entry => (
                      <li key={entry.id}>
                        <strong>{new Date(entry.ts).toLocaleDateString('ru-RU')}</strong> — {entry.action}
                        <br />
                        <span className="muted">{entry.details} ({entry.actor})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <footer className="passport-wizard__actions">
              <button type="button" className="ghost" onClick={() => setActiveStep(0)}>
                Назад
              </button>
              <button type="submit" className="primary">
                Сохранить и продолжить
              </button>
            </footer>
          </form>
        ) : null}

        {activeStep === 2 && passport ? (
          <form className="passport-wizard__form" onSubmit={handleDetailsSubmit}>
            <div className="passport-wizard__grid">
              {passport.schema.length === 0 ? (
                <p className="muted">Шаблон не выбран. Добавьте поля вручную или выберите шаблон.</p>
              ) : (
                passport.schema.map(field => (
                  <div key={field.id} className="form-field">
                    <label>
                      {field.label}
                      {field.required ? <span className="required">*</span> : null}
                    </label>
                    <Controller
                      control={detailsForm.control}
                      name={field.key}
                      render={({ field: controllerField }) => {
                        switch (field.type) {
                          case 'number':
                            return (
                              <input
                                type="number"
                                {...controllerField}
                                value={controllerField.value as number | string | undefined}
                                onChange={event => controllerField.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                              />
                            );
                          case 'date':
                            return <input type="date" {...controllerField} />;
                          case 'select':
                            return (
                              <select {...controllerField}>
                                <option value="">Выберите значение</option>
                                {field.options?.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            );
                          case 'checkbox':
                            return (
                              <label className="checkbox-field">
                                <input
                                  type="checkbox"
                                  checked={Boolean(controllerField.value)}
                                  onChange={event => controllerField.onChange(event.target.checked)}
                                />
                                Активно
                              </label>
                            );
                          case 'multiline':
                            return <textarea rows={3} {...controllerField} placeholder={field.placeholder} />;
                          default:
                            return <input type="text" {...controllerField} placeholder={field.placeholder} />;
                        }
                      }}
                    />
                  </div>
                ))
              )}
            </div>
            <footer className="passport-wizard__actions">
              <button type="button" className="ghost" onClick={() => setActiveStep(1)}>
                Назад
              </button>
              <div className="passport-wizard__actions-group">
                <button type="button" className="ghost" onClick={() => setSaveTemplateOpen(true)} disabled={!passport.schema.length}>
                  Сохранить шаблон изделия
                </button>
                <button type="button" className="ghost" onClick={() => setTemplateModalOpen(true)}>
                  Создать новый шаблон изделия
                </button>
                <button type="submit" className="primary">
                  Сохранить и продолжить
                </button>
              </div>
            </footer>
          </form>
        ) : null}

        {activeStep === 3 && passport ? (
          <div className="passport-wizard__form">
            <section className="passport-section">
              <div className="passport-section__header">
                <h3 className="passport-section__title">Приложенные документы</h3>
              </div>
              <div className="passport-section__content">
                <input type="file" multiple onChange={event => handleAttachmentUpload(event.target.files)} />
                {passport.attachments.length === 0 ? (
                  <p className="muted">Документы ещё не добавлены.</p>
                ) : (
                  <ul className="attachments-list">
                    {passport.attachments.map(attachment => (
                      <li key={attachment.id}>
                        <a href={attachment.url} target="_blank" rel="noreferrer">
                          {attachment.name}
                        </a>
                        <span className="muted"> — загружено {formatDateTime(attachment.uploadedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <footer className="passport-wizard__actions">
              <button type="button" className="ghost" onClick={() => setActiveStep(2)}>
                Назад
              </button>
              <div className="passport-wizard__actions-group">
                <button type="button" className="secondary" onClick={() => handleExport('excel')} disabled={isExporting}>
                  Сохранить паспорт в Excel
                </button>
                <button type="button" className="secondary" onClick={() => handleExport('pdf')} disabled={isExporting}>
                  Сформировать PDF
                </button>
                <button type="button" className="primary" onClick={handleFinalize} disabled={isFinalizing || passport.status === 'ready'}>
                  Завершить паспорт
                </button>
              </div>
            </footer>
            <div className="passport-summary muted">
              Версия: v{passport.version} · Статус: {passport.status === 'ready' ? 'Готов' : 'Черновик'} · Обновлён {formatDateTime(passport.updatedAt)}
            </div>
          </div>
        ) : null}
      </div>

      <DeviceSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        devices={devices}
        models={models}
        onSelect={device => {
          handleDeviceSelected(device).catch(() => toast.error('Не удалось загрузить устройство.'));
        }}
      />
      <DeviceFormModal
        isOpen={isCreateDeviceOpen}
        onClose={() => setCreateDeviceOpen(false)}
        models={models}
        title="Новое устройство"
        submitLabel="Создать"
        onSubmit={async values => {
          const device = await productPassportRepository.createDevice(values);
          queryClient.setQueryData<NetworkDevice[] | undefined>(queryKeys.productPassports.devices, previous =>
            previous ? [...previous, device] : [device],
          );
          toast.success('Устройство создано.');
          setCreateDeviceOpen(false);
          await handleDeviceSelected(device);
        }}
      />
      <TemplateSaveModal
        isOpen={isSaveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        onSubmit={handleSaveTemplate}
      />
      <TemplateEditorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        models={models}
        defaultModelId={metadataModelId || selectedDevice?.deviceModelId}
        onSubmit={async payload => {
          const template = await productPassportRepository.createTemplate(payload);
          queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates(payload.deviceModelId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates() });
          toast.success('Шаблон сохранён.');
          setTemplateModalOpen(false);
          if (passport && template.deviceModelId === (metadataModelId || selectedDevice?.deviceModelId)) {
            await handleApplyTemplate(template.id);
          }
        }}
      />
    </section>
  );
};

export const ProductPassportWorkspace: React.FC = () => {
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
