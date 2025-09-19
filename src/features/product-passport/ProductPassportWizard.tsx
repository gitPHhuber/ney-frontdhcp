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
      <header>
        <h2>Product passport wizard</h2>
        <p className="muted">Auto-populate fields from inventory and finalize a PDF passport.</p>
      </header>
      <ol className="steps">
        {steps.map(step => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <form className="passport-wizard__form" onSubmit={onSubmit}>
        <div className="form-grid">
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
        <footer>
          <button type="submit" className="primary">
            Generate PDF passport
          </button>
          <button type="button" className="ghost">
            Export registry CSV
          </button>
        </footer>
      </form>
    </section>
  );
};
