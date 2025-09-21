export interface PassportEntry {
  id: string;
  label: string;
  value: string;
}

export interface PassportRow {
  id: string;
  name: string;
  entries: PassportEntry[];
}

export interface PassportSection {
  id: string;
  title: string;
  rows: PassportRow[];
}

export interface SerializableEntry {
  label: string;
  value: string;
}

export interface SerializableRow {
  name: string;
  entries: SerializableEntry[];
}

export interface SerializableSection {
  title: string;
  rows: SerializableRow[];
}

export interface PassportTemplate {
  id: string;
  name: string;
  structure: SerializableSection[];
}

const createId = (() => {
  let counter = 0;
  return (prefix = 'passport') => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
})();

export const createEntry = (label: string, value = ''): PassportEntry => ({
  id: createId('entry'),
  label,
  value,
});

export const createRow = (name: string, entries: PassportEntry[]): PassportRow => ({
  id: createId('row'),
  name,
  entries,
});

export const createSection = (title: string, rows: PassportRow[]): PassportSection => ({
  id: createId('section'),
  title,
  rows,
});

export const sectionsToSerializable = (sections: PassportSection[]): SerializableSection[] =>
  sections.map(section => ({
    title: section.title,
    rows: section.rows.map(row => ({
      name: row.name,
      entries: row.entries.map(entry => ({ label: entry.label, value: entry.value })),
    })),
  }));

export const structureToSections = (structure: SerializableSection[]): PassportSection[] =>
  structure.map(section =>
    createSection(
      section.title,
      section.rows.map(row => createRow(row.name, row.entries.map(entry => createEntry(entry.label, entry.value)))),
    ),
  );

export const createServerTemplateSections = (): PassportSection[] => [
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

export const DEFAULT_TEMPLATE_ID = 'passport-template-server';

export const createDefaultTemplate = (): PassportTemplate => ({
  id: DEFAULT_TEMPLATE_ID,
  name: 'Серверное оборудование',
  structure: sectionsToSerializable(createServerTemplateSections()),
});

export const createEmptyTemplateStructure = (): SerializableSection[] => [
  {
    title: 'Новый раздел',
    rows: [
      {
        name: 'Новая строка',
        entries: [
          {
            label: 'Поле',
            value: '',
          },
        ],
      },
    ],
  },
];
