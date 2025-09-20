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

const steps = ['Lookup device', 'Confirm metadata', 'Add details', 'Attach documents'];

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
    { name: 'assetTag', label: 'Asset tag', placeholder: 'e.g. AST-1001', required: true },
    { name: 'model', label: 'Model', placeholder: 'Cisco C9500', required: true },
    { name: 'serialNumber', label: 'Serial number', placeholder: 'SN123456789', required: true },
    { name: 'location', label: 'Location', placeholder: 'DC-West / Rack 42', required: true },
    { name: 'owner', label: 'Owner', placeholder: 'Network Team', required: true },
    { name: 'warrantyUntil', label: 'Warranty valid until', type: 'date' },
  ];

  const onSubmit = handleSubmit(data => {
    // In a real app this would trigger generation of the product passport document.
    console.log('Generating product passport', data);
  });

  return (
    <section className="passport-wizard">
      <header className="passport-wizard__header">
        <div>
          <h2>Product passport wizard</h2>
          <p className="muted">Auto-populate fields from inventory and finalize a PDF passport.</p>
        </div>
        <span className="status-badge status-online">Connected</span>
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
            Generate PDF passport
          </button>
          <button type="button" className="secondary">
            Export registry CSV
          </button>
        </footer>
      </form>
    </section>
  );
};
