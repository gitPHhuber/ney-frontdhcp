import React from 'react';
import { InventoryTable } from '../../features/inventory/InventoryTable';
import { AlertsStream } from '../../features/alerts/AlertsStream';

const InventoryPage: React.FC = () => (
  <div className="page-with-sidebar">
    <section className="page-main">
      <InventoryTable />
    </section>
    <aside className="page-sidebar">
      <AlertsStream />
    </aside>
  </div>
);

export default InventoryPage;
