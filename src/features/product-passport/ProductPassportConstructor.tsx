import React, { useEffect, useMemo, useState } from 'react';


import {
  DEFAULT_TEMPLATE_ID,
  type PassportSection,
  type PassportTemplate,
  type SerializableEntry,
  type SerializableRow,
  type SerializableSection,
  createDefaultTemplate,
  createEmptyTemplateStructure,
  createEntry,
  createRow,
  createSection,
  sectionsToSerializable,
  structureToSections,
} from './passportSchema';
import { useProductPassport } from './ProductPassportContext';

const TEMPLATES_STORAGE_KEY = 'product-passport-templates';

const sanitizeTemplates = (value: unknown): PassportTemplate[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof (item as { id?: unknown }).id !== 'string' ||
        typeof (item as { name?: unknown }).name !== 'string'
      ) {
        return null;
      }

      const rawStructure = (item as { structure?: unknown }).structure;
      if (!Array.isArray(rawStructure)) {
        return null;
      }

      const structure = rawStructure
        .map(section => {
          if (
            !section ||
            typeof section !== 'object' ||
            typeof (section as { title?: unknown }).title !== 'string'
          ) {
            return null;
          }

          const rows = (section as { rows?: unknown }).rows;
          if (!Array.isArray(rows)) {
            return null;
          }

          const normalizedRows = rows
            .map(row => {
              if (
                !row ||
                typeof row !== 'object' ||
                typeof (row as { name?: unknown }).name !== 'string'
              ) {
                return null;
              }

              const entries = (row as { entries?: unknown }).entries;
              if (!Array.isArray(entries)) {
                return null;
              }

              const normalizedEntries = entries
                .map(entry => {
                  if (
                    !entry ||
                    typeof entry !== 'object' ||
                    typeof (entry as { label?: unknown }).label !== 'string' ||
                    typeof (entry as { value?: unknown }).value !== 'string'
                  ) {
                    return null;
                  }

                  return { label: (entry as { label: string }).label, value: (entry as { value: string }).value };
                })
                .filter((entry): entry is SerializableEntry => Boolean(entry));

              return {
                name: (row as { name: string }).name,
                entries: normalizedEntries,
              };
            })
            .filter((row): row is SerializableRow => Boolean(row));

          return {
            title: (section as { title: string }).title,
            rows: normalizedRows,
          };
        })
        .filter((section): section is SerializableSection => Boolean(section));

      return {
        id: (item as { id: string }).id,
        name: (item as { name: string }).name,
        structure,
      };
    })
    .filter((template): template is PassportTemplate => Boolean(template));
};

const escapeForHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildExcelHtml = (structure: SerializableSection[]) => {
  const rows: string[] = [];

  structure.forEach(section => {
    rows.push(`<tr class="section-row"><th colspan="3">${escapeForHtml(section.title || 'Без названия')}</th></tr>`);

    if (!section.rows.length) {
      rows.push('<tr><td colspan="3">Нет данных</td></tr>');
      return;
    }

    section.rows.forEach(row => {
      if (!row.entries.length) {
        rows.push(`<tr><td>${escapeForHtml(row.name || '')}</td><td colspan="2">—</td></tr>`);
        return;
      }

      row.entries.forEach((entry, index) => {
        const nameCell = index === 0 ? escapeForHtml(row.name || '') : '';
        rows.push(
          `<tr><td>${nameCell}</td><td>${escapeForHtml(entry.label)}</td><td>${escapeForHtml(entry.value)}</td></tr>`,
        );
      });
    });
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table>${rows.join('')}</table></body></html>`;
};

interface ConstructorActionsProps {
  onExportExcel: () => void;
  onSaveTemplate: () => void;
  onCreateTemplate: () => void;
  onApplyTemplate: () => void;
  onResetTemplate: () => void;
  onCopyStructure: () => void;
}

const ConstructorActions: React.FC<ConstructorActionsProps> = ({
  onExportExcel,
  onSaveTemplate,
  onCreateTemplate,
  onApplyTemplate,
  onResetTemplate,
  onCopyStructure,
}) => (
  <div className="passport-constructor__actions">
    <button type="button" onClick={onExportExcel}>
      Сохранить в Excel
    </button>
    <button type="button" className="secondary" onClick={onSaveTemplate}>
      Сохранить шаблон
    </button>
    <button type="button" className="ghost" onClick={onCreateTemplate}>
      Создать новый шаблон
    </button>
    <button type="button" className="secondary" onClick={onApplyTemplate}>
      Быстро выбрать шаблон
    </button>
    <button type="button" className="secondary" onClick={onResetTemplate}>
      Вернуть шаблон сервера
    </button>
    <button type="button" className="ghost" onClick={onCopyStructure}>
      Скопировать структуру JSON
    </button>
  </div>
);

interface TemplateSelectProps {
  templates: PassportTemplate[];
  selectedTemplateId: string;
  onChange: (value: string) => void;
}

const TemplateSelect: React.FC<TemplateSelectProps> = ({ templates, selectedTemplateId, onChange }) => (
  <div className="passport-constructor__template-bar">
    <label htmlFor="passport-template-select" className="passport-constructor__template-label">
      Выберите шаблон изделия
    </label>
    <select
      id="passport-template-select"
      className="passport-constructor__template-select"
      value={selectedTemplateId}
      onChange={event => onChange(event.target.value)}
    >
      {templates.map(template => (
        <option key={template.id} value={template.id}>
          {template.name}
        </option>
      ))}
    </select>
  </div>
);

interface SectionsEditorProps {
  sections: PassportSection[];
  onSectionTitleChange: (sectionId: string, title: string) => void;
  onRowNameChange: (sectionId: string, rowId: string, name: string) => void;
  onEntryChange: (sectionId: string, rowId: string, entryId: string, key: 'label' | 'value', value: string) => void;
  onAddSection: () => void;
  onRemoveSection: (sectionId: string) => void;
  onAddRow: (sectionId: string) => void;
  onRemoveRow: (sectionId: string, rowId: string) => void;
  onAddEntry: (sectionId: string, rowId: string) => void;
  onRemoveEntry: (sectionId: string, rowId: string, entryId: string) => void;
}

const SectionsEditor: React.FC<SectionsEditorProps> = ({
  sections,
  onSectionTitleChange,
  onRowNameChange,
  onEntryChange,
  onAddSection,
  onRemoveSection,
  onAddRow,
  onRemoveRow,
  onAddEntry,
  onRemoveEntry,
}) => (
  <div className="passport-constructor__editor">
    {sections.map(section => (
      <article key={section.id} className="passport-section">
        <div className="passport-section__header">
          <input
            value={section.title}
            onChange={event => onSectionTitleChange(section.id, event.target.value)}
            className="passport-section__title"
            placeholder="Название раздела"
          />
          <div className="passport-section__controls">
            <button type="button" className="ghost" onClick={() => onAddRow(section.id)}>
              Добавить строку
            </button>
            <button type="button" className="ghost" onClick={() => onRemoveSection(section.id)}>
              Удалить раздел
            </button>
          </div>
        </div>

        {section.rows.map(row => (
          <div key={row.id} className="passport-row-editor">
            <input
              value={row.name}
              onChange={event => onRowNameChange(section.id, row.id, event.target.value)}
              className="passport-row-editor__name"
              placeholder="Описание компонента"
            />
            <div className="passport-row-editor__entries">
              {row.entries.map(entry => (
                <div key={entry.id} className="passport-entry-editor">
                  <input
                    value={entry.label}
                    onChange={event => onEntryChange(section.id, row.id, entry.id, 'label', event.target.value)}
                    placeholder="Подпись поля"
                  />
                  <input
                    value={entry.value}
                    onChange={event => onEntryChange(section.id, row.id, entry.id, 'value', event.target.value)}
                    placeholder="Значение"
                  />
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => onRemoveEntry(section.id, row.id, entry.id)}
                    aria-label="Удалить поле"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
            <div className="passport-row-editor__controls">
              <button type="button" className="ghost" onClick={() => onAddEntry(section.id, row.id)}>
                Добавить поле
              </button>
              <button type="button" className="ghost" onClick={() => onRemoveRow(section.id, row.id)}>
                Удалить строку
              </button>
            </div>
          </div>
        ))}
      </article>
    ))}

    <button type="button" className="ghost" onClick={onAddSection}>
      Добавить раздел
    </button>
  </div>
);

interface PreviewPanelProps {
  sections: PassportSection[];
  serializableStructure: SerializableSection[];
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ sections, serializableStructure }) => (
  <aside className="passport-constructor__preview">
    <h3>Предпросмотр паспорта</h3>
    <div className="passport-preview" role="presentation">
      {sections.length === 0 ? (
        <div className="preview-placeholder">
          <p className="muted">Добавьте разделы, чтобы увидеть структуру паспорта.</p>
        </div>
      ) : (
        sections.map(section => (
          <div key={`${section.id}-preview`} className="passport-preview__section">
            <h4>{section.title || 'Без названия'}</h4>
            {section.rows.length === 0 ? (
              <p className="muted">Нет строк в разделе.</p>
            ) : (
              section.rows.map(row => (
                <div key={`${row.id}-preview`} className="passport-preview__row">
                  <span className="passport-preview__row-name">{row.name || 'Новая строка'}</span>
                  <div className="passport-preview__entries">
                    {row.entries.length === 0 ? (
                      <span className="muted">Нет полей</span>
                    ) : (
                      row.entries.map(entry => (
                        <div key={`${entry.id}-preview`} className="passport-preview__entry">
                          {entry.label ? (
                            <span className="passport-preview__entry-label">{entry.label}</span>
                          ) : null}
                          <span className="passport-preview__entry-value">{entry.value ? entry.value : '—'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
    <pre className="passport-preview__json" aria-label="Структура паспорта в формате JSON">
      {JSON.stringify(serializableStructure, null, 2)}
    </pre>
  </aside>
);

const usePassportConstructorState = () => {
  const defaultTemplate = useMemo(() => createDefaultTemplate(), []);
  const { pendingTemplate, clearPendingTemplate } = useProductPassport();

  const [templates, setTemplates] = useState<PassportTemplate[]>(() => [defaultTemplate]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => DEFAULT_TEMPLATE_ID);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => DEFAULT_TEMPLATE_ID);
  const [sections, setSections] = useState<PassportSection[]>(() =>
    structureToSections(defaultTemplate.structure),
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const serializableStructure = useMemo<SerializableSection[]>(
    () => sectionsToSerializable(sections),

    [sections],
  );

  useEffect(() => {

    if (!feedbackMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedbackMessage(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [feedbackMessage]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = sanitizeTemplates(JSON.parse(stored));
      if (parsed.length === 0) {
        return;
      }

      setTemplates(prev => {
        const existingIds = new Set(prev.map(template => template.id));
        const merged = [...prev];

        parsed.forEach(template => {
          if (!existingIds.has(template.id)) {
            merged.push(template);
          }
        });

        return merged;
      });
    } catch (error) {
      console.error('Не удалось загрузить сохранённые шаблоны', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const customTemplates = templates.filter(template => template.id !== DEFAULT_TEMPLATE_ID);
    window.localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
  }, [templates]);

  useEffect(() => {
    if (templates.some(template => template.id === activeTemplateId)) {
      return;
    }

    const fallback = templates[0];
    if (!fallback) {
      return;
    }

    setSelectedTemplateId(fallback.id);
    setActiveTemplateId(fallback.id);
    setSections(structureToSections(fallback.structure));
  }, [activeTemplateId, templates]);

  useEffect(() => {
    if (!pendingTemplate) {
      return;
    }

    setTemplates(current => {
      const nextTemplate: PassportTemplate = {
        id: pendingTemplate.templateId,
        name: pendingTemplate.templateName,
        structure: pendingTemplate.structure,
      };

      const index = current.findIndex(template => template.id === pendingTemplate.templateId);
      if (index >= 0) {
        const updated = [...current];
        updated[index] = nextTemplate;
        return updated;
      }

      return [...current, nextTemplate];
    });

    setSections(structureToSections(pendingTemplate.structure));
    setSelectedTemplateId(pendingTemplate.templateId);
    setActiveTemplateId(pendingTemplate.templateId);

    const sourceLabel =
      pendingTemplate.source === 'inventory'
        ? 'инвентаря'
        : pendingTemplate.source === 'new-device'
        ? 'созданного изделия'
        : 'каталога моделей';

    setFeedbackMessage(`Шаблон «${pendingTemplate.templateName}» применён из ${sourceLabel}.`);
    clearPendingTemplate();
  }, [pendingTemplate, clearPendingTemplate]);

  const applyTemplate = (templateId?: string) => {
    const id = templateId ?? selectedTemplateId;
    const template = templates.find(item => item.id === id);
    if (!template) {
      return;
    }

    setSections(structureToSections(template.structure));
    setSelectedTemplateId(template.id);
    setActiveTemplateId(template.id);
    setFeedbackMessage(`Шаблон «${template.name}» применён`);
  };

  const changeTemplateSelection = (value: string) => {
    setSelectedTemplateId(value);
  };

  const resetTemplate = () => {
    setSections(structureToSections(defaultTemplate.structure));
    setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
    setActiveTemplateId(DEFAULT_TEMPLATE_ID);
    setFeedbackMessage('Шаблон сервера применён');
  };

  const saveTemplate = () => {
    const activeTemplate = templates.find(template => template.id === activeTemplateId);
    const suggestedName =
      activeTemplate && activeTemplate.id !== DEFAULT_TEMPLATE_ID ? activeTemplate.name : 'Новый шаблон';

    const nameInput = window.prompt('Введите название шаблона', suggestedName);
    const trimmedName = nameInput?.trim();
    if (!trimmedName) {
      return;
    }

    if (activeTemplate && activeTemplate.id !== DEFAULT_TEMPLATE_ID) {
      setTemplates(prev =>
        prev.map(template =>
          template.id === activeTemplate.id
            ? { ...template, name: trimmedName, structure: serializableStructure }
            : template,
        ),
      );
      setFeedbackMessage(`Шаблон «${trimmedName}» обновлён`);
      return;
    }

    const newTemplate: PassportTemplate = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      structure: serializableStructure,
    };

    setTemplates(prev => [...prev, newTemplate]);
    setSections(structureToSections(newTemplate.structure));
    setSelectedTemplateId(newTemplate.id);
    setActiveTemplateId(newTemplate.id);
    setFeedbackMessage(`Шаблон «${trimmedName}» сохранён`);
  };

  const createTemplate = () => {
    const nameInput = window.prompt('Введите название нового шаблона', 'Новый шаблон');
    const trimmedName = nameInput?.trim();
    if (!trimmedName) {
      return;
    }

    const structure = createEmptyTemplateStructure();
    const template: PassportTemplate = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      structure,
    };

    setTemplates(prev => [...prev, template]);
    setSections(structureToSections(template.structure));
    setSelectedTemplateId(template.id);
    setActiveTemplateId(template.id);
    setFeedbackMessage(`Создан шаблон «${trimmedName}»`);
  };

  const copyStructure = async () => {
    const json = JSON.stringify(serializableStructure, null, 2);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(json);
        setFeedbackMessage('Структура скопирована в буфер обмена');
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (error) {
      console.error(error);
      setFeedbackMessage('Не удалось скопировать структуру');
    }
  };

  const exportExcel = () => {
    const html = buildExcelHtml(serializableStructure);
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'passport.xls';
    link.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage('Паспорт сохранён в Excel');
  };

  const handleSectionTitleChange = (sectionId: string, title: string) => {
    setSections(prev => prev.map(section => (section.id === sectionId ? { ...section, title } : section)));

  };

  const handleRowNameChange = (sectionId: string, rowId: string, name: string) => {
    setSections(prev =>
      prev.map(section => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          rows: section.rows.map(row => (row.id === rowId ? { ...row, name } : row)),
        };
      }),
    );
  };

  const handleEntryChange = (
    sectionId: string,
    rowId: string,
    entryId: string,
    key: 'label' | 'value',
    value: string,
  ) => {
    setSections(prev =>
      prev.map(section => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          rows: section.rows.map(row => {
            if (row.id !== rowId) {
              return row;
            }

            return {
              ...row,
              entries: row.entries.map(entry =>
                entry.id === entryId ? { ...entry, [key]: value } : entry,
              ),
            };
          }),
        };
      }),
    );
  };

  const handleAddSection = () => {
    setSections(prev => [
      ...prev,
      createSection('Новый раздел', [createRow('Новая строка', [createEntry('Поле', '')])]),
    ]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const handleAddRow = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              rows: [
                ...section.rows,
                createRow('Новая строка', [createEntry('S/N ядро'), createEntry('S/N производитель')]),
              ],
            }
          : section,
      ),
    );
  };

  const handleRemoveRow = (sectionId: string, rowId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, rows: section.rows.filter(row => row.id !== rowId) }
          : section,
      ),
    );
  };

  const handleAddEntry = (sectionId: string, rowId: string) => {
    setSections(prev =>
      prev.map(section => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          rows: section.rows.map(row =>
            row.id === rowId
              ? {
                  ...row,
                  entries: [...row.entries, createEntry('Новое поле')],
                }
              : row,
          ),
        };
      }),
    );
  };

  const handleRemoveEntry = (sectionId: string, rowId: string, entryId: string) => {
    setSections(prev =>
      prev.map(section => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          rows: section.rows.map(row =>
            row.id === rowId
              ? { ...row, entries: row.entries.filter(entry => entry.id !== entryId) }
              : row,
          ),
        };
      }),
    );
  };


  return {
    templates,
    sections,
    selectedTemplateId,
    serializableStructure,
    feedbackMessage,
    applyTemplate,
    changeTemplateSelection,
    resetTemplate,
    saveTemplate,
    createTemplate,
    copyStructure,
    exportExcel,
    handleSectionTitleChange,
    handleRowNameChange,
    handleEntryChange,
    handleAddSection,
    handleRemoveSection,
    handleAddRow,
    handleRemoveRow,
    handleAddEntry,
    handleRemoveEntry,
  };
};

export const ProductPassportConstructor: React.FC = () => {
  const {
    templates,
    sections,
    selectedTemplateId,
    serializableStructure,
    feedbackMessage,
    applyTemplate,
    changeTemplateSelection,
    resetTemplate,
    saveTemplate,
    createTemplate,
    copyStructure,
    exportExcel,
    handleSectionTitleChange,
    handleRowNameChange,
    handleEntryChange,
    handleAddSection,
    handleRemoveSection,
    handleAddRow,
    handleRemoveRow,
    handleAddEntry,
    handleRemoveEntry,
  } = usePassportConstructorState();


  return (
    <section className="passport-constructor">
      <header className="passport-constructor__header">
        <div>
          <h2>Конструктор паспорта изделия</h2>
          <p className="muted">
            Соберите собственный шаблон паспорта для серверов, сетевого и другого оборудования.
          </p>
        </div>

        <div className="passport-constructor__actions">
          <button type="button" className="secondary" onClick={handleResetTemplate}>
            Вернуть шаблон сервера
          </button>
          <button type="button" className="ghost" onClick={handleCopyStructure}>
            Скопировать структуру JSON
          </button>
        </div>
      </header>

      <div className="passport-constructor__content">
        <div className="passport-constructor__editor">
          {sections.map(section => (
            <article key={section.id} className="passport-section">
              <div className="passport-section__header">
                <input
                  value={section.title}
                  onChange={event => handleSectionTitleChange(section.id, event.target.value)}
                  className="passport-section__title"
                  placeholder="Название раздела"
                />
                <div className="passport-section__controls">
                  <button type="button" className="ghost" onClick={() => handleAddRow(section.id)}>
                    Добавить строку
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => handleRemoveSection(section.id)}
                  >
                    Удалить раздел
                  </button>
                </div>
              </div>

              {section.rows.map(row => (
                <div key={row.id} className="passport-row-editor">
                  <input
                    value={row.name}
                    onChange={event => handleRowNameChange(section.id, row.id, event.target.value)}
                    className="passport-row-editor__name"
                    placeholder="Описание компонента"
                  />
                  <div className="passport-row-editor__entries">
                    {row.entries.map(entry => (
                      <div key={entry.id} className="passport-entry-editor">
                        <input
                          value={entry.label}
                          onChange={event =>
                            handleEntryChange(section.id, row.id, entry.id, 'label', event.target.value)
                          }
                          placeholder="Подпись поля"
                        />
                        <input
                          value={entry.value}
                          onChange={event =>
                            handleEntryChange(section.id, row.id, entry.id, 'value', event.target.value)
                          }
                          placeholder="Значение"
                        />
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleRemoveEntry(section.id, row.id, entry.id)}
                          aria-label="Удалить поле"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="passport-row-editor__controls">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => handleAddEntry(section.id, row.id)}
                    >
                      Добавить поле
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => handleRemoveRow(section.id, row.id)}
                    >
                      Удалить строку
                    </button>
                  </div>
                </div>
              ))}
            </article>
          ))}

          <button type="button" className="ghost" onClick={handleAddSection}>
            Добавить раздел
          </button>
        </div>

        <aside className="passport-constructor__preview">
          <h3>Предпросмотр паспорта</h3>
          <div className="passport-preview" role="presentation">
            {sections.length === 0 ? (
              <div className="preview-placeholder">
                <p className="muted">Добавьте разделы, чтобы увидеть структуру паспорта.</p>
              </div>
            ) : (
              sections.map(section => (
                <div key={`${section.id}-preview`} className="passport-preview__section">
                  <h4>{section.title || 'Без названия'}</h4>
                  {section.rows.length === 0 ? (
                    <p className="muted">Нет строк в разделе.</p>
                  ) : (
                    section.rows.map(row => (
                      <div key={`${row.id}-preview`} className="passport-preview__row">
                        <span className="passport-preview__row-name">{row.name || 'Новая строка'}</span>
                        <div className="passport-preview__entries">
                          {row.entries.length === 0 ? (
                            <span className="muted">Нет полей</span>
                          ) : (
                            row.entries.map(entry => (
                              <div key={`${entry.id}-preview`} className="passport-preview__entry">
                                {entry.label ? (
                                  <span className="passport-preview__entry-label">{entry.label}</span>
                                ) : null}
                                <span className="passport-preview__entry-value">
                                  {entry.value ? entry.value : '—'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>
          <pre className="passport-preview__json" aria-label="Структура паспорта в формате JSON">
            {JSON.stringify(serializableStructure, null, 2)}
          </pre>
        </aside>
      </div>

      {copyStatus ? <p className="passport-constructor__status muted">{copyStatus}</p> : null}
    </section>
  );
};


