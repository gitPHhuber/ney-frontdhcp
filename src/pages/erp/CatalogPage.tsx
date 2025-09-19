import React from 'react';
import { CatalogTables, PurchasingSalesSnapshot } from '../../features/erp/CatalogTables';

const CatalogPage: React.FC = () => {
  return (
    <div className="page erp-catalog-page">
      <CatalogTables />
      <PurchasingSalesSnapshot />
    </div>
  );
};

export default CatalogPage;
