import { useEffect, useState, type FormEvent } from 'react';

import { toast } from 'sonner';

import Modal from '../../../../components/ui/Modal';
import type { DeviceModel } from '../../../../entities';
import type { TemplateCreationPayload, TemplateFieldDraft } from '../types';
import { createBlankFieldDraft, normalizeFieldDraft } from '../utils';

export interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: DeviceModel[];
  defaultModelId?: string;
  onSubmit: (payload: TemplateCreationPayload) => Promise<void>;
}

export const TemplateEditorModal = ({
  isOpen,
  onClose,
  models,
  defaultModelId,
  onSubmit,
}: TemplateEditorModalProps) => {
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

  const handleSubmit = async (event: FormEvent) => {
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
        const key = field.key.trim() || field.id;
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
                        current.map(item => (item.id === field.id ? { ...item, label: event.target.value } : item)),
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
                    onChange={event => {
                      const nextType = event.target.value as TemplateFieldDraft['type'];
                      setFields(current =>
                        current.map(item => (item.id === field.id ? { ...item, type: nextType } : item)),
                      );
                    }}
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
