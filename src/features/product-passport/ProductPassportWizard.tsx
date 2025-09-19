import React, { useId } from 'react';
import { useForm, Controller, type Control } from 'react-hook-form';

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
      <form onSubmit={handleSubmit(() => {})} className="wizard-form">
        <PassportFieldGrid control={control} />
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

interface PassportFieldGridProps {
  control: Control<ProductPassportForm>;
}

const PassportFieldGrid: React.FC<PassportFieldGridProps> = ({ control }) => {
  const assetTagId = useId();
  const serialId = useId();
  const modelId = useId();
  const locationId = useId();
  const ownerId = useId();
  const warrantyId = useId();

  return (
    <div className="two-column">
      <div className="field">
        <label htmlFor={assetTagId}>Asset tag</label>
        <Controller
          control={control}
          name="assetTag"
          render={({ field }) => <input id={assetTagId} {...field} required />}
        />
      </div>
      <div className="field">
        <label htmlFor={serialId}>Serial number</label>
        <Controller
          control={control}
          name="serialNumber"
          render={({ field }) => <input id={serialId} {...field} required />}
        />
      </div>
      <div className="field">
        <label htmlFor={modelId}>Model</label>
        <Controller control={control} name="model" render={({ field }) => <input id={modelId} {...field} />} />
      </div>
      <div className="field">
        <label htmlFor={locationId}>Location</label>
        <Controller
          control={control}
          name="location"
          render={({ field }) => <input id={locationId} {...field} />}
        />
      </div>
      <div className="field">
        <label htmlFor={ownerId}>Owner</label>
        <Controller control={control} name="owner" render={({ field }) => <input id={ownerId} {...field} />} />
      </div>
      <div className="field">
        <label htmlFor={warrantyId}>Warranty until</label>
        <Controller
          control={control}
          name="warrantyUntil"
          render={({ field }) => <input id={warrantyId} type="date" {...field} />}
        />
      </div>
    </div>
  );
};
