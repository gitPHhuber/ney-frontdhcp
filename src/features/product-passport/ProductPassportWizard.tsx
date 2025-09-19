import React from 'react';
import { useForm, Controller } from 'react-hook-form';

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
    },
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
      <form
        onSubmit={handleSubmit(values => {
          console.info('Passport draft', values);
        })}
        className="wizard-form"
      >
        <div className="two-column">
          <label>
            Asset tag
            <Controller
              control={control}
              name="assetTag"
              render={({ field }) => <input {...field} required />}
            />
          </label>
          <label>
            Serial number
            <Controller
              control={control}
              name="serialNumber"
              render={({ field }) => <input {...field} required />}
            />
          </label>
          <label>
            Model
            <Controller
              control={control}
              name="model"
              render={({ field }) => <input {...field} />}
            />
          </label>
          <label>
            Location
            <Controller
              control={control}
              name="location"
              render={({ field }) => <input {...field} />}
            />
          </label>
          <label>
            Owner
            <Controller
              control={control}
              name="owner"
              render={({ field }) => <input {...field} />}
            />
          </label>
          <label>
            Warranty until
            <Controller
              control={control}
              name="warrantyUntil"
              render={({ field }) => <input type="date" {...field} />}
            />
          </label>
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
