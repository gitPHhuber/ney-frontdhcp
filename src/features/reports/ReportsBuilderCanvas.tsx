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
  'Сводка KPI': {
    subtitle: 'Компактный блок для ключевых метрик, SLA и статусов выполнения задач.',
    preview: (
      <dl className="kpi-grid">
        <div>
          <dt>Уровень арен</dt>
          <dd>73%</dd>
        </div>
        <div>
          <dt>Отказы DHCP</dt>
          <dd>4 за сутки</dd>
        </div>
        <div>
          <dt>Устранено</dt>
          <dd>92%</dd>
        </div>
        <div>
          <dt>Среднее TTR</dt>
          <dd>31 мин</dd>
        </div>
      </dl>
    ),
  },
  'Временной ряд': {
    subtitle: 'График активности арен с выделением пиков и провалов.',
    preview: (
      <svg viewBox="0 0 160 72" className="chart-spark" aria-hidden>
        <rect x="1" y="1" width="158" height="70" rx="8" fill="rgba(148, 163, 184, 0.12)" />
        <polyline
          fill="none"
          stroke="rgba(51, 245, 255, 0.75)"
          strokeWidth="2"
          strokeLinecap="round"
          points="4,60 28,44 52,46 76,30 100,38 124,18 148,26"
        />
      </svg>
    ),
  },
  'Таблица пропускной способности': {
    subtitle: 'Сравнение загрузки пулов IP-адресов по площадкам и сегментам.',
    preview: (
      <table className="capacity-table">
        <caption>Сводка по пулам</caption>
        <thead>
          <tr>
            <th scope="col">Пул</th>
            <th scope="col">Занято</th>
            <th scope="col">Доступно</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DC-1 / Prod</td>
            <td>582 из 768</td>
            <td>186</td>
          </tr>
          <tr>
            <td>DC-2 / Test</td>
            <td>130 из 256</td>
            <td>126</td>
          </tr>
          <tr>
            <td>Edge / IoT</td>
            <td>912 из 1024</td>
            <td>112</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  'Хронология инцидентов': {
    subtitle: 'Список значимых событий с уровнем влияния и ответственными.',
    preview: (
      <ol className="timeline">
        <li>
          <span className="timeline__time">08:42</span>
          <div>
            <strong>Перегружен DHCP01</strong>
            <p className="muted">Автоматический рестарт завершился успешно, SLA не нарушен.</p>
          </div>
        </li>
        <li>
          <span className="timeline__time">12:15</span>
          <div>
            <strong>Сбой авторизации PXE</strong>
            <p className="muted">На согласовании фикса конфигурации. Ответственный: Н. Болышев.</p>
          </div>
        </li>
        <li>
          <span className="timeline__time">16:20</span>
          <div>
            <strong>Пиковая нагрузка сегмента IoT</strong>
            <p className="muted">Рекомендовано расширение пула и пересмотр политики арен.</p>
          </div>
        </li>
      </ol>
    ),
  },
};

const presetLabels: Record<PresetOption, string> = {
  day: 'Ежедневный срез',
  week: 'Недельный обзор',
  month: 'Месячный отчёт',
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

    console.log('Экспорт отчёта', parseResult.data);
  });

  return (
    <section className="reports-builder">
      <header className="reports-builder__header">
        <div>

          <h2>Конструктор паспорта изделия</h2>

          <p className="muted">
            Соберите интерактивный отчёт из готовых блоков, настройте пресет периода и выгрузите данные в нужном формате.
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

          {blocks.length === 0 ? (
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
              <p>Выберите блоки отчёта, чтобы увидеть структуру документа.</p>
            </div>
          ) : (
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
          )}

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
