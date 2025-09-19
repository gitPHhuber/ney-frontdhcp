import React from 'react';
import { PurchasingSalesSnapshot } from '../../features/erp/CatalogTables';

const OrdersPage: React.FC = () => {
  return (
    <div className="page erp-orders-page">
      <PurchasingSalesSnapshot />
    </div>
  );
};

export default OrdersPage;
