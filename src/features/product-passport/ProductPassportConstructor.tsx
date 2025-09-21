import React, { useEffect, useMemo, useState } from 'react';

interface PassportEntry {
  id: string;
  label: string;
  value: string;
}

interface PassportRow {
  id: string;
  name: string;
  entries: PassportEntry[];
}

interface PassportSection {
  id: string;
  title: string;
  rows: PassportRow[];
}

const createId = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return `passport-${counter}`;
  };
})();

const createEntry = (label: string, value = ''): PassportEntry => ({
  id: createId(),
  label,
  value,
});

const createRow = (name: string, entries: PassportEntry[]): PassportRow => ({
  id: createId(),
  name,
  entries,
});

const createSection = (title: string, rows: PassportRow[]): PassportSection => ({
  id: createId(),
  title,
  rows,
});

const createServerTemplate = (): PassportSection[] => [
  createSection('Общие сведения', [
    createRow('Наименование', [
      createEntry('Тип/ревизия/производитель'),
      createEntry('Серийный номер'),
    ]),
    createRow('Серийный № сервера', [createEntry('Значение', '020524027B')]),
    createRow('Дата проведения входного контроля', [createEntry('Значение', '05.02.2024')]),
    createRow('Фамилии сотрудников, проводивших проверку (с фото)', [
      createEntry('Сотрудник 1', 'Честнов Алексей'),
      createEntry('Сотрудник 2', 'Болышев Никита'),
    ]),
  ]),
  createSection('HDD диски', [
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO7021'),
      createEntry('S/N производитель', 'ZRT1QSF9'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO7020'),
      createEntry('S/N производитель', 'ZRT1QSLH'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO701Z'),
      createEntry('S/N производитель', 'ZRT1NEE3'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO703B'),
      createEntry('S/N производитель', 'ZRT1RC7S'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO703O'),
      createEntry('S/N производитель', 'ZRT1RD46'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO703C'),
      createEntry('S/N производитель', 'ZV70H19V'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO7022'),
      createEntry('S/N производитель', 'ZV70H19P'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO7023'),
      createEntry('S/N производитель', 'ZV70HYGL'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO702O'),
      createEntry('S/N производитель', 'ZV70HXTW'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO703A'),
      createEntry('S/N производитель', 'ZV70HYEP'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'Y1P6A0GMO7039'),
      createEntry('S/N производитель', 'ZRT1QTC2'),
    ]),
    createRow('Seagate STL015', [
      createEntry('S/N ядро', 'P8CSWAP9LFDC5Y219GCT35HT8G3U6MY5'),
      createEntry('S/N производитель', 'ZV70H0JY'),
    ]),
  ]),
  createSection('Backplane HDD', [
    createRow('BPLSAS780002C', [createEntry('S/N ядро', 'Y2GZC017PI01G')]),
  ]),
  createSection('Материнская плата', [
    createRow('MBDX86780001E', [
      createEntry('S/N ядро', 'Y1JOA302VA1VO'),
      createEntry('Отметки', '1E-'),
    ]),
  ]),
  createSection('Кулеры CPU', [createRow('Кулер', [createEntry('Тип', 'Тип 1')])]),
  createSection('Блоки питания', [
    createRow('ASP U1A-D11200-DRB', [
      createEntry('S/N ядро', 'Y09OA0XDVR03Q'),
      createEntry('S/N производитель', 'D041200K6B0241'),
    ]),
    createRow('ASP U1A-D11200-DRB', [
      createEntry('S/N ядро', 'Y09OA0XDVR03P'),
      createEntry('S/N производитель', 'D041200K6B0314'),
    ]),
  ]),
  createSection('SSD накопители', [
    createRow('Micron MTFDDAK960TDS', [
      createEntry('S/N ядро', 'Y0IDA0KHTZ00W'),
      createEntry('S/N производитель', '220534A667C3'),
    ]),
    createRow('Micron MTFDDAK960TDS', [
      createEntry('S/N ядро', 'Y0IDA0KHTZ00V'),
      createEntry('S/N производитель', '220534A667D6'),
    ]),
    createRow('Samsung MZ-WLR7T60', [
      createEntry('S/N ядро', 'Y1DAA08O7B01S'),
      createEntry('S/N производитель', 'S6EWNE0R708721'),
    ]),
    createRow('Samsung MZ-WLR7T60', [
      createEntry('S/N ядро', 'Y1DAA08O7B01Q'),
      createEntry('S/N производитель', 'S6EWNE0R708715'),
    ]),
  ]),
  createSection('BMC', [
    createRow('IOBBMC740001C', [createEntry('S/N ядро', 'Y0SOC01NEU0MD')]),
  ]),
  createSection('Backplane SSD', [
    createRow('Модуль', [
      createEntry('Разъём', '+'),
      createEntry('S/N ядро', 'Y0UIE01A2U12F'),
    ]),
  ]),
  createSection('Планки памяти', [
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313I'),
      createEntry('S/N производитель', 'Y0S402031624B25747'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313G'),
      createEntry('S/N производитель', 'Y0S402031624B25591'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313B'),
      createEntry('S/N производитель', 'Y0S402031624B254EB'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A130NA'),
      createEntry('S/N производитель', 'Y0NB49031524B0B943'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313L'),
      createEntry('S/N производитель', 'Y0S402031624B25592'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313D'),
      createEntry('S/N производитель', 'Y0S402031624B25518'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313E'),
      createEntry('S/N производитель', 'Y0S402031624B25410'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313C'),
      createEntry('S/N производитель', 'Y0S402031624B2552C'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313H'),
      createEntry('S/N производитель', 'Y0S402031624B25507'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313K'),
      createEntry('S/N производитель', 'Y0S402031624B255A1'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313F'),
      createEntry('S/N производитель', 'Y0S402031624B25536'),
    ]),
    createRow('Samsung M393A8G40AB2-CWEС0', [
      createEntry('S/N ядро', 'Y1YMA08A1313J'),
      createEntry('S/N производитель', 'Y0S402031624B25559'),
    ]),
  ]),
  createSection('RAID-контроллер', [
    createRow('Тип 1', [
      createEntry('S/N ядро', 'Y0TEA0ABK706B'),
      createEntry(
        'S/N производитель',
        '03-50077-00004, SKC2211958, 500062B-220EE41100, 02-50077-50003, 9560-16i 8GB',
      ),
    ]),
  ]),
  createSection('Сетевая карта', [
    createRow('Rev.20', [
      createEntry('S/N ядро', 'Y01CA0AGAT0LT'),
      createEntry('S/N производитель', 'A41422213001O1FV'),
    ]),
  ]),
];

export const ProductPassportConstructor: React.FC = () => {
  const [sections, setSections] = useState<PassportSection[]>(() => createServerTemplate());
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const serializableStructure = useMemo(
    () =>
      sections.map(section => ({
        title: section.title,
        rows: section.rows.map(row => ({
          name: row.name,
          entries: row.entries.map(entry => ({ label: entry.label, value: entry.value })),
        })),
      })),
    [sections],
  );

  useEffect(() => {
    if (!copyStatus) {
      return;
    }

    const timeout = window.setTimeout(() => setCopyStatus(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const handleSectionTitleChange = (sectionId: string, title: string) => {
    setSections(prev =>
      prev.map(section => (section.id === sectionId ? { ...section, title } : section)),
    );
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

  const handleResetTemplate = () => {
    setSections(createServerTemplate());
    setCopyStatus(null);
  };

  const handleCopyStructure = async () => {
    const json = JSON.stringify(serializableStructure, null, 2);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(json);
        setCopyStatus('Структура скопирована в буфер обмена');
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (error) {
      console.error(error);
      setCopyStatus('Не удалось скопировать структуру');
    }
  };

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

