import React from 'react';
import { AlertsStream } from '../../features/alerts/AlertsStream';
import { PagePlaceholder } from '../../shared/ui/PagePlaceholder';

const AlertsPage: React.FC = () => (
  <div className="stacked-page">
    <AlertsStream />
    <PagePlaceholder
      title="Маршрутизация оповещений"
      description="Настраивайте маршруты, подавление и агрегацию оповещений для инцидент-менеджмента."
    />
  </div>
);

export default AlertsPage;
