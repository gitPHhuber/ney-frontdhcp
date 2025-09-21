import React from 'react';
import { ProductPassportWizard } from '../../features/product-passport/ProductPassportWizard';
import { ProductPassportConstructor } from '../../features/product-passport/ProductPassportConstructor';

const ProductPassportPage: React.FC = () => (
  <div className="stacked-page">
    <ProductPassportWizard />
    <ProductPassportConstructor />
  </div>
);

export default ProductPassportPage;
