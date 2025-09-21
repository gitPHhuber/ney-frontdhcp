import React, { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';

export interface ProductPassportForm {
  assetTag: string;
  model: string;
  serialNumber: string;
  location: string;
  owner: string;
  warrantyUntil?: string;
}

const steps = ['Поиск устройства', 'Проверка метаданных', 'Добавление сведений', 'Приложение документов'];

export const ProductPassportWizard: React.FC = () => {
  const { control, handleSubmit } = useForm<ProductPassportForm>({
    defaultValues: {
      assetTag: '',
      model: '',
      serialNumber: '',
      location: '',
      owner: '',
      warrantyUntil: '',
    },
  });

  const idPrefix = useId();
  const activeStepIndex = 2;

  const fieldConfigs: Array<{
    name: keyof ProductPassportForm;
    label: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
  }> = [
    { name: 'assetTag', label: 'Инвентарный номер', placeholder: 'Например, AST-1001', required: true },
    { name: 'model', label: 'Модель', placeholder: 'Cisco C9500', required: true },
    {
      name: 'serialNumber',
      label: 'Серийный номер',
      placeholder: 'SN123456789',
      required: true,
    },
    {
      name: 'location',
      label: 'Расположение',
      placeholder: 'DC-West / Стойка 42',
      required: true,
    },
    { name: 'owner', label: 'Ответственный', placeholder: 'Команда сетей', required: true },
    { name: 'warrantyUntil', label: 'Гарантия действует до', type: 'date' },
  ];

  const onSubmit = handleSubmit(data => {
    // In a real app this would trigger generation of the product passport document.
    console.log('Generating product passport', data);
  });

  return (
    <section className="passport-wizard">
      <header className="passport-wizard__header">
        <div>
          <h2>Мастер создания паспорта изделия</h2>
          <p className="muted">Автоматически заполните данные из инвентаря и сформируйте PDF-паспорт.</p>
        </div>
        <span className="status-badge status-online">Подключено</span>
      </header>
      <ol className="wizard-steps">
        {steps.map((step, index) => {
          const state =
            index < activeStepIndex ? 'completed' : index === activeStepIndex ? 'active' : 'upcoming';
          return (
            <li key={step} className="wizard-step" data-state={state}>
              <span className="wizard-step__index">{index + 1}</span>
              <span className="wizard-step__label">{step}</span>
            </li>
          );
        })}
      </ol>

      <form className="passport-wizard__form" onSubmit={onSubmit}>
        <div className="passport-wizard__grid">
          {fieldConfigs.map(config => {
            const inputId = `${idPrefix}-${config.name}`;
            return (
              <div key={config.name} className="form-field">
                <label htmlFor={inputId}>{config.label}</label>
                <Controller
                  control={control}
                  name={config.name}
                  render={({ field }) => (
                    <input
                      {...field}
                      id={inputId}
                      type={config.type ?? 'text'}
                      placeholder={config.placeholder}
                      required={config.required}
                    />
                  )}
                />
              </div>
            );
          })}
        </div>
        <footer className="passport-wizard__actions">
          <button type="submit" className="primary">
            Сформировать PDF-паспорт
          </button>
          <button type="button" className="secondary">
            Экспортировать реестр в CSV
          </button>
        </footer>
      </form>
    </section>
  );
};
