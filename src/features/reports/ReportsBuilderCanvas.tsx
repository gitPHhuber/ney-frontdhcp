import React, { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const blockOptions = [
  'Сводка KPI',
  'Временной ряд',
  'Таблица пропускной способности',
  'Хронология инцидентов',
] as const;

const presetOptions = ['day', 'week', 'month'] as const;

type BlockOption = (typeof blockOptions)[number];
type PresetOption = (typeof presetOptions)[number];

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

const blockLibrary: Record<BlockOption, BlockMeta> = {
  'Сводка KPI': {
    subtitle: 'Карточки ключевых показателей, соблюдение SLA и сводные метрики.',
    preview: <p className="muted">Предпросмотр отчёта будет отображаться здесь</p>,
  },
  'Временной ряд': {
    subtitle: 'График динамики показателей по выбранному периоду.',
    preview: <p className="muted">Предпросмотр отчёта будет отображаться здесь</p>,
  },
  'Таблица пропускной способности': {
    subtitle: 'Табличный обзор ресурсов, загрузки и резерва мощности.',
    preview: <p className="muted">Предпросмотр отчёта будет отображаться здесь</p>,
  },
  'Хронология инцидентов': {
    subtitle: 'Лента инцидентов с классификацией по серьёзности и владельцам.',
    preview: <p className="muted">Предпросмотр отчёта будет отображаться здесь</p>,
  },
};

const presetLabels: Record<PresetOption, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
};

export const ReportsBuilderCanvas: React.FC = () => {
  const { control, handleSubmit, watch } = useForm<ReportsBuilderForm>({
    defaultValues: {
      name: 'Еженедельный обзор для руководства',
      preset: 'week',
      blocks: [
        'Сводка KPI',
        'Временной ряд',
        'Таблица пропускной способности',
        'Хронология инцидентов',
      ],
    },
  });

  const blocks = watch('blocks');
  const idPrefix = useId();

  const FormatIcon: React.FC<{ variant: 'pdf' | 'csv' | 'xlsx' }> = ({ variant }) => {
    const label = variant.toUpperCase();
    const gradientStops: Record<'pdf' | 'csv' | 'xlsx', string> = {
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
          <h2>Конструктор отчётов</h2>
          <p className="muted">Создавайте макеты методом перетаскивания и экспортируйте их в PDF/CSV/XLSX.</p>
        </div>
        <span className="status-badge status-active">Предпросмотр в реальном времени</span>
      </header>

      <form className="reports-builder__form" onSubmit={onSubmit}>
        <div className="form-controls">
          <div className="form-field">
            <label htmlFor={`${idPrefix}-name`}>Название отчёта</label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <input
                  {...field}
                  id={`${idPrefix}-name`}
                  placeholder="Сводка для руководства"
                  required
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${idPrefix}-preset`}>Предустановка</label>
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
          <legend>Блоки</legend>
          <Controller
            control={control}
            name="blocks"
            render={({ field }) => (
              <div className="chip-group">
                {blockOptions.map(option => {
                  const isSelected = field.value.includes(option);
                  return (
                    <button
                      type="button"
                      key={option}
                      className={isSelected ? 'chip chip--selected' : 'chip'}
                      onClick={() => {
                        const next = isSelected
                          ? field.value.filter(value => value !== option)
                          : [...field.value, option];
                        field.onChange(next as BlockOption[]);
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
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
              <p>Предпросмотр отчёта будет отображаться здесь</p>
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
            Экспорт в PDF
          </button>
          <button type="button" className="secondary">
            <FormatIcon variant="csv" />
            Экспорт в CSV
          </button>
          <button type="button" className="ghost">
            <FormatIcon variant="xlsx" />
            Экспорт в XLSX
          </button>
        </footer>
      </form>
    </section>
  );
};
