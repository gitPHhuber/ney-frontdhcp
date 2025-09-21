import React, { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const blockOptions = [
  'Обложка паспорта изделия',
  'Входной контроль и бригада',
  'HDD диски',
  'SSD накопители',
  'Backplane и плата управления',
  'Память',
  'Питание и охлаждение',
  'Контроллеры расширения',
] as const;

const presetOptions = ['rack-server', 'blade-server', 'storage-node'] as const;

type BlockOption = (typeof blockOptions)[number];
type PresetOption = (typeof presetOptions)[number];

type ExportVariant = 'pdf' | 'csv' | 'xlsx';

const builderSchema = z.object({
  name: z.string().min(3),
  preset: z.enum(presetOptions),
  blocks: z.array(z.enum(blockOptions)).min(1),
});

type ReportsBuilderForm = z.infer<typeof builderSchema>;

interface PassportRow {
  name: string;
  details: string;
  serial: string;
}

interface BlockMeta {
  subtitle: string;
  preview: React.ReactNode;
}

const FormatIcon: React.FC<{ variant: ExportVariant }> = ({ variant }) => {
  const label = variant.toUpperCase();
  const gradientStops: Record<ExportVariant, string> = {
    pdf: 'rgba(244, 114, 182, 0.7)',
    csv: 'rgba(45, 212, 191, 0.65)',
    xlsx: 'rgba(74, 222, 128, 0.65)',
  };

  return (
    <svg className="format-icon" viewBox="0 0 32 40" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`format-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradientStops[variant]} />
          <stop offset="100%" stopColor="rgba(51, 245, 255, 0.45)" />
        </linearGradient>
      </defs>
      <path
        d="M7 2.5h13.5L27.5 9v24.5c0 1.38-1.12 2.5-2.5 2.5H7c-1.38 0-2.5-1.12-2.5-2.5V5c0-1.38 1.12-2.5 2.5-2.5Z"
        fill={`url(#format-${variant})`}
        stroke="rgba(148, 163, 184, 0.45)"
        strokeWidth="1.4"
      />
      <text
        x="50%"
        y="70%"
        textAnchor="middle"
        fontSize="10"
        fontFamily="'Inter', 'Segoe UI', sans-serif"
        fontWeight={600}
        fill="#010409"
      >
        {label}
      </text>
    </svg>
  );
};

const PassportTable: React.FC<{ caption: string; rows: PassportRow[] }> = ({ caption, rows }) => (
  <table className="passport-table">
    <caption>{caption}</caption>
    <thead>
      <tr>
        <th scope="col">Наименование</th>
        <th scope="col">Тип / ревизия / производитель</th>
        <th scope="col">Серийный номер</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(row => (
        <tr key={`${row.name}-${row.details}-${row.serial}`}>
          <td>{row.name}</td>
          <td>{row.details}</td>
          <td>{row.serial}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const blockLibrary: Record<BlockOption, BlockMeta> = {
  'Обложка паспорта изделия': {
    subtitle: 'Титульный блок паспорта с ключевыми идентификаторами и датой проверки.',
    preview: (
      <dl className="passport-meta">
        <div>
          <dt>Наименование</dt>
          <dd>Сервер 020524027B</dd>
        </div>
        <div>
          <dt>Тип / ревизия / производитель</dt>
          <dd>Стоечный 2U / Rev. 1E / NeyTech Manufacturing</dd>
        </div>
        <div>
          <dt>Серийный номер</dt>
          <dd>020524027B</dd>
        </div>
        <div>
          <dt>Дата входного контроля</dt>
          <dd>05.02.2024</dd>
        </div>
      </dl>
    ),
  },
  'Входной контроль и бригада': {
    subtitle: 'Фиксация ответственных сотрудников и подтверждение результатов входного контроля.',
    preview: (
      <div className="passport-meta">
        <p>
          Проверку прошёл 05.02.2024. Бригада: Честнов Алексей (контроль) и Болышев Никита (сборка).
          Рекомендуется добавить фотоотчёт и подписи.
        </p>
        <ul>
          <li>Проверяющий: Честнов Алексей</li>
          <li>Сборщик: Болышев Никита</li>
          <li>Синхронизация с ServiceNow и фотоархивом включена</li>
        </ul>
      </div>
    ),
  },
  'HDD диски': {
    subtitle: 'Полная раскладка по дискам с серийными номерами ядра и производителя.',
    preview: (
      <PassportTable
        caption="Образец паспорта для HDD массива"
        rows={[
          { name: 'HDD диски', details: 'S/N ядро · Seagate STL015', serial: 'Y1P6A0GMO7021' },
          { name: '', details: 'S/N производитель', serial: 'ZRT1QSF9' },
          { name: '', details: 'S/N ядро · Seagate STL015', serial: 'Y1P6A0GMO7020' },
          { name: '', details: 'S/N производитель', serial: 'ZRT1QSLH' },
          { name: '', details: 'S/N ядро · Seagate STL015', serial: 'Y1P6A0GMO701Z' },
          { name: '', details: 'S/N производитель', serial: 'ZRT1NEE3' },
        ]}
      />
    ),
  },
  'SSD накопители': {
    subtitle: 'Заполнение по NVMe и SATA SSD, включая кэш и журнальные устройства.',
    preview: (
      <PassportTable
        caption="Пример секции по SSD"
        rows={[
          { name: 'SSD (sn)', details: 'S/N ядро · Micron MTFDDAK960TDS', serial: 'Y0IDA0KHTZ00W' },
          { name: '', details: 'S/N производитель', serial: '220534A667C3' },
          { name: '', details: 'S/N ядро · Samsung MZ-WLR7T60', serial: 'Y1DAA08O7B01S' },
          { name: '', details: 'S/N производитель', serial: 'S6EWNE0R708721' },
        ]}
      />
    ),
  },
  'Backplane и плата управления': {
    subtitle: 'Backplane, BMC и материнская плата с указанием ревизий.',
    preview: (
      <PassportTable
        caption="Узел управления"
        rows={[
          { name: 'Backplane HDD', details: 'BPLSAS780002C', serial: 'Y2GZC017PI01G' },
          { name: 'Материнская плата', details: 'MBDX86780001E · Rev. 1E', serial: 'Y1JOA302VA1VO' },
          { name: 'BMC', details: 'IOBBMC740001C', serial: 'Y0SOC01NEU0MD' },
          { name: 'Backplane SSD', details: 'Разъём +', serial: 'Y0UIE01A2U12F' },
        ]}
      />
    ),
  },
  'Память': {
    subtitle: 'Опись планок памяти с серийниками ядра и производителя.',
    preview: (
      <PassportTable
        caption="Вставки памяти (образец)"
        rows={[
          {
            name: 'Планки памяти',
            details: 'S/N ядро · 2316 Samsung KR M393A8G40AB2-CWEС0',
            serial: 'Y1YMA08A1313I',
          },
          { name: '', details: 'S/N производитель', serial: 'Y0S402031624B25747' },
          {
            name: '',
            details: 'S/N ядро · 2316 Samsung KR M393A8G40AB2-CWEС0',
            serial: 'Y1YMA08A1313G',
          },
          { name: '', details: 'S/N производитель', serial: 'Y0S402031624B25591' },
        ]}
      />
    ),
  },
  'Питание и охлаждение': {
    subtitle: 'Блоки питания, кулеры и связанные серийные номера.',
    preview: (
      <PassportTable
        caption="Питание и охлаждение"
        rows={[
          { name: 'Кулеры CPU', details: 'Тип 1', serial: '—' },
          { name: 'Блок питания', details: 'S/N ядро · ASP U1A-D11200-DRB', serial: 'Y09OA0XDVR03Q' },
          { name: '', details: 'S/N производитель', serial: 'D041200K6B0241' },
          { name: 'Блок питания', details: 'S/N ядро · ASP U1A-D11200-DRB', serial: 'Y09OA0XDVR03P' },
          { name: '', details: 'S/N производитель', serial: 'D041200K6B0314' },
        ]}
      />
    ),
  },
  'Контроллеры расширения': {
    subtitle: 'RAID и сетевые адаптеры с полным перечнем ревизий.',
    preview: (
      <PassportTable
        caption="Контроллеры"
        rows={[
          {
            name: 'RAID-контроллер',
            details: 'S/N ядро · Тип 1',
            serial: 'Y0TEA0ABK706B',
          },
          {
            name: '',
            details: 'S/N производитель',
            serial: '03-50077-00004 / SKC2211958',
          },
          {
            name: 'Сетевая карта',
            details: 'S/N ядро · Rev. 20',
            serial: 'Y01CA0AGAT0LT',
          },
          { name: '', details: 'S/N производитель', serial: 'A41422213001O1FV' },
        ]}
      />
    ),
  },
};

const presetLabels: Record<PresetOption, string> = {
  'rack-server': 'Стоечный сервер',
  'blade-server': 'Блейд-сервер',
  'storage-node': 'Узел системы хранения',
};

const BlockChips: React.FC<{
  value: BlockOption[];
  onChange: (value: BlockOption[]) => void;
}> = ({ value, onChange }) => (
  <div className="chip-group">
    {blockOptions.map(option => {
      const isSelected = value.includes(option);
      return (
        <button
          type="button"
          key={option}
          className={isSelected ? 'chip chip--selected' : 'chip'}
          onClick={() => {
            const next = isSelected ? value.filter(item => item !== option) : [...value, option];
            onChange(next as BlockOption[]);
          }}
        >
          {option}
        </button>
      );
    })}
  </div>
);

const BuilderPreview: React.FC<{ blocks: BlockOption[] }> = ({ blocks }) => {
  if (blocks.length === 0) {
    return (
      <div className="preview-placeholder">
        <svg viewBox="0 0 64 64" aria-hidden focusable="false">
          <path
            d="M10 14h44v36H10z"
            fill="none"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
          <path
            d="M18 40l8-12 8 8 10-14 12 18"
            fill="none"
            stroke="rgba(51, 245, 255, 0.75)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p>Выберите разделы паспорта, чтобы увидеть структуру документа.</p>
      </div>
    );
  }

  return (
    <div className="preview-grid">
      {blocks.map(block => {
        const blockMeta = blockLibrary[block];
        return (
          <article key={block} className="builder-block">
            <div className="builder-block__icon" aria-hidden>
              <svg viewBox="0 0 48 48">
                <rect x="6" y="10" width="36" height="28" rx="6" fill="rgba(148, 163, 184, 0.14)" />
                <path
                  d="M12 30c4-6 8-10 12-10s8 4 12 10"
                  stroke="rgba(51, 245, 255, 0.75)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <div className="builder-block__body">
              <h3>{block}</h3>
              <p className="muted">{blockMeta.subtitle}</p>
              <div className="builder-block__preview">{blockMeta.preview}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export const ReportsBuilderCanvas: React.FC = () => {
  const { control, handleSubmit, watch } = useForm<ReportsBuilderForm>({
    defaultValues: {
      name: 'Паспорт сервера №020524027B',
      preset: 'rack-server',
      blocks: [
        'Обложка паспорта изделия',
        'Входной контроль и бригада',
        'HDD диски',
        'SSD накопители',
        'Backplane и плата управления',
        'Память',
        'Питание и охлаждение',
        'Контроллеры расширения',
      ],
    },
  });

  const blocks = watch('blocks');
  const idPrefix = useId();

  const onSubmit = handleSubmit(data => {
    const parseResult = builderSchema.safeParse(data);
    if (!parseResult.success) {
      console.warn('Ошибка валидации', parseResult.error.flatten());
      return;
    }

    console.log('Экспорт паспорта', parseResult.data);
  });

  return (
    <section className="reports-builder">
      <header className="reports-builder__header">
        <div>
          <h2>Конструктор паспорта изделия</h2>
          <p className="muted">
            Соберите структурированный паспорт серверного изделия: фиксируйте конфигурацию оборудования,
            результаты входного контроля и готовьте документы к выгрузке.
          </p>
        </div>
        <span className="status-badge status-active">Синхронизировано с CMDB</span>
      </header>

      <form className="reports-builder__form" onSubmit={onSubmit}>
        <div className="form-controls">
          <div className="form-field">
            <label htmlFor={`${idPrefix}-name`}>Название паспорта</label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <input
                  {...field}
                  id={`${idPrefix}-name`}
                  placeholder="Паспорт изделия"
                  required
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${idPrefix}-preset`}>Тип конфигурации</label>
            <Controller
              control={control}
              name="preset"
              render={({ field }) => (
                <select {...field} id={`${idPrefix}-preset`}>
                  {presetOptions.map(option => (
                    <option key={option} value={option}>
                      {presetLabels[option]}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <fieldset>
          <legend>Разделы паспорта</legend>
          <Controller
            control={control}
            name="blocks"
            render={({ field }) => (
              <BlockChips value={field.value} onChange={value => field.onChange(value as BlockOption[])} />
            )}
          />
        </fieldset>

        <div className="builder-preview">
          <BuilderPreview blocks={blocks} />
        </div>
        <footer className="reports-builder__actions">
          <button type="submit" className="primary">
            <FormatIcon variant="pdf" />
            Сформировать PDF паспорт
          </button>
          <button type="button" className="secondary">
            <FormatIcon variant="csv" />
            Выгрузить CSV реестр
          </button>
          <button type="button" className="ghost">
            <FormatIcon variant="xlsx" />
            Экспорт XLSX спецификации
          </button>
        </footer>
      </form>
    </section>
  );
};
