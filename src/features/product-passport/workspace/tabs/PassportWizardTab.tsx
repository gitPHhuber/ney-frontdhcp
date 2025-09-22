import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  productPassportRepository,
  type DeviceHistoryEntry,
  type DeviceModel,
  type NetworkDevice,
  type PassportTemplate,
  type ProductPassport,
} from '../../../../entities';
import { queryKeys } from '../../../../shared/api/queryKeys';
import { buildPassportExportRows } from '../../export/passportExportRows';
import { downloadPassportPdf, downloadPassportWorkbook } from '../../export/passportExportDownload';
import type { TemplateFieldValue } from '../../types';
import { formatPassportDateTime } from '../../utils/date';
import { DeviceFormModal } from '../components/DeviceFormModal';
import { DeviceSearchModal } from '../components/DeviceSearchModal';
import { TemplateEditorModal } from '../components/TemplateEditorModal';
import { TemplateSaveModal } from '../components/TemplateSaveModal';
import { buildDetailDefaults, getMissingRequired } from '../utils';

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

export interface PassportWizardTabProps {
  devices: NetworkDevice[];
  models: DeviceModel[];
  templates: PassportTemplate[];
}

export const PassportWizardTab = ({ devices, models, templates }: PassportWizardTabProps) => {
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
      const rows = buildPassportExportRows(passport, history);
      const filename = `${passport.metadata.assetTag}-паспорт-v${passport.version}`;
      if (type === 'excel') {
        await downloadPassportWorkbook(rows, filename);
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
                                onChange={event =>
                                  controllerField.onChange(event.target.value === '' ? '' : Number(event.target.value))
                                }
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
                        <span className="muted"> — загружено {formatPassportDateTime(attachment.uploadedAt)}</span>
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
                <button
                  type="button"
                  className="primary"
                  onClick={handleFinalize}
                  disabled={isFinalizing || passport.status === 'ready'}
                >
                  Завершить паспорт
                </button>
              </div>
            </footer>
            <div className="passport-summary muted">
              Версия: v{passport.version} · Статус: {passport.status === 'ready' ? 'Готов' : 'Черновик'} · Обновлён{' '}
              {formatPassportDateTime(passport.updatedAt)}
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
