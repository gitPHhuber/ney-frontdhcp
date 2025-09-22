import { useEffect, useState, type FormEvent } from 'react';

import { toast } from 'sonner';

import Modal from '../../../../components/ui/Modal';
import type { DeviceModel, TemplatePrimitiveFieldType } from '../../../../entities';
import type { TemplateCreationPayload, TemplateFieldDraft } from '../types';
import { createBlankFieldDraft, generateTempId, normalizeFieldDraft } from '../utils';

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
  const [layoutDraft, setLayoutDraft] = useState('');
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
    let parsedLayout: TemplateCreationPayload['layout'] = undefined;
    if (layoutDraft.trim()) {
      try {
        parsedLayout = JSON.parse(layoutDraft);
      } catch (error) {
        console.error(error);
        toast.error('Не удалось разобрать JSON разметки Excel.');
        return;
      }
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
        layout: parsedLayout,
        status: setActive ? 'published' : 'draft',
      });
      setName('');
      setDescription('');
      setFields([createBlankFieldDraft()]);
      setLayoutDraft('');
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
                        current.map(item =>
                          item.id === field.id
                            ? {
                                ...item,
                                type: nextType,
                                columns:
                                  nextType === 'table'
                                    ? item.columns.length > 0
                                      ? item.columns
                                      : [
                                          {
                                            id: generateTempId(),
                                            title: 'Колонка',
                                            key: 'column',
                                            type: 'text',
                                          },
                                        ]
                                    : item.columns,
                              }
                            : item,
                        ),
                      );
                    }}
                  >
                    <option value="text">Текст</option>
                    <option value="number">Число</option>
                    <option value="date">Дата</option>
                    <option value="select">Список</option>
                    <option value="checkbox">Флажок</option>
                    <option value="multiline">Многострочный текст</option>
                    <option value="table">Таблица</option>
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
                {field.type !== 'table' ? (
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
                ) : null}
              </div>
              {field.type === 'table' ? (
                <div className="passport-row-editor__table">
                  <div className="passport-row-editor__table-controls">
                    <label>
                      Мин. строк
                      <input
                        type="number"
                        min={0}
                        value={field.minRows ?? ''}
                        onChange={event =>
                          setFields(current =>
                            current.map(item =>
                              item.id === field.id
                                ? {
                                    ...item,
                                    minRows: event.target.value ? Number(event.target.value) : undefined,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Макс. строк
                      <input
                        type="number"
                        min={0}
                        value={field.maxRows ?? ''}
                        onChange={event =>
                          setFields(current =>
                            current.map(item =>
                              item.id === field.id
                                ? {
                                    ...item,
                                    maxRows: event.target.value ? Number(event.target.value) : undefined,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setFields(current =>
                          current.map(item =>
                            item.id === field.id
                              ? {
                                  ...item,
                                  columns: [
                                    ...item.columns,
                                    {
                                      id: generateTempId(),
                                      title: 'Новый столбец',
                                      key: '',
                                      type: 'text',
                                    },
                                  ],
                                }
                              : item,
                          ),
                        )
                      }
                    >
                      Добавить столбец
                    </button>
                  </div>
                  <div className="passport-row-editor__table-columns">
                    {field.columns.map(column => (
                      <div key={column.id} className="passport-row-editor__table-column">
                        <label>
                          Название столбца
                          <input
                            value={column.title}
                            onChange={event =>
                              setFields(current =>
                                current.map(item =>
                                  item.id === field.id
                                    ? {
                                        ...item,
                                        columns: item.columns.map(col =>
                                          col.id === column.id ? { ...col, title: event.target.value } : col,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Ключ
                          <input
                            value={column.key}
                            onChange={event =>
                              setFields(current =>
                                current.map(item =>
                                  item.id === field.id
                                    ? {
                                        ...item,
                                        columns: item.columns.map(col =>
                                          col.id === column.id ? { ...col, key: event.target.value } : col,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Тип
                          <select
                            value={column.type}
                            onChange={event =>
                              setFields(current =>
                                current.map(item =>
                                  item.id === field.id
                                    ? {
                                        ...item,
                                        columns: item.columns.map(col =>
                                          col.id === column.id
                                            ? { ...col, type: event.target.value as TemplatePrimitiveFieldType }
                                            : col,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="text">Текст</option>
                            <option value="number">Число</option>
                            <option value="date">Дата</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() =>
                            setFields(current =>
                              current.map(item =>
                                item.id === field.id
                                  ? {
                                      ...item,
                                      columns: item.columns.filter(col => col.id !== column.id),
                                    }
                                  : item,
                              ),
                            )
                          }
                          disabled={field.columns.length === 1}
                        >
                          Удалить столбец
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
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
        <div className="passport-section">
          <div className="passport-section__header">
            <h3 className="passport-section__title">Разметка Excel (JSON)</h3>
          </div>
          <textarea
            value={layoutDraft}
            onChange={event => setLayoutDraft(event.target.value)}
            rows={8}
            placeholder={'{ "sheetName": "Документ" }'}
          />
          <p className="muted">
            Укажите JSON-схему листа: ширины колонок, статические ячейки, привязки полей и секции таблиц.
            При сохранении выполняется базовая проверка синтаксиса.
          </p>
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
