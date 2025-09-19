import React from 'react';
import { AlertsStream } from '../../features/alerts/AlertsStream';
import { PagePlaceholder } from '../../shared/ui/PagePlaceholder';

const AlertsPage: React.FC = () => (
  <div className="stacked-page">
    <AlertsStream />
    <PagePlaceholder
      title="Alert routing rules"
      description="Configure routing, suppressions, and auto-aggregation logic for incidents."
    />
  </div>
);

export default AlertsPage;
