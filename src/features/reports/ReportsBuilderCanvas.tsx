import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

const blockOptions = ['KPI Summary', 'Time Series', 'Capacity Table', 'Incident Timeline'] as const;

type BlockOption = typeof blockOptions[number];

const builderSchema = z.object({
  name: z.string().min(3),
  preset: z.enum(['day', 'week', 'month']),
  blocks: z.array(z.enum(blockOptions)).min(1),
});

type ReportsBuilderForm = z.infer<typeof builderSchema>;

export const ReportsBuilderCanvas: React.FC = () => {
  const { control, handleSubmit, watch } = useForm<ReportsBuilderForm>({
    defaultValues: { name: 'Executive Weekly Snapshot', preset: 'week', blocks: ['KPI Summary'] },
  });

  const blocks = watch('blocks');

  return (
    <section className="reports-builder">
      <header>
        <h2>Reports Builder</h2>
        <p className="muted">Compose drag-and-drop layouts and export PDF/CSV/XLSX.</p>
      </header>
      <form
        onSubmit={handleSubmit(value => {
          builderSchema.parse(value);
          console.info('Report saved', value);
        })}
      >
        <div className="form-grid">
          <label>
            Report name
            <Controller
              control={control}
              name="name"
              render={({ field }) => <input {...field} />}
            />
          </label>
          <label>
            Preset
            <Controller
              control={control}
              name="preset"
              render={({ field }) => (
                <select {...field}>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              )}
            />
          </label>
        </div>
        <fieldset>
          <legend>Blocks</legend>
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
          {blocks.map(block => (
            <article key={block} className="builder-block">
              <h3>{block}</h3>
              <p className="muted">Placeholder preview</p>
            </article>
          ))}
        </div>
        <footer>
          <button type="submit" className="primary">
            Export PDF
          </button>
          <button type="button" className="ghost">
            Export CSV
          </button>
          <button type="button" className="ghost">
            Export XLSX
          </button>
        </footer>
      </form>
    </section>
  );
};
