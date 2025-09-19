

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

