import React from 'react';
import { PagePlaceholder } from '../../shared/ui/PagePlaceholder';

const ExecutiveDashboardPage: React.FC = () => (
  <PagePlaceholder
    title="Executive Dashboard"
    description="Present uptime, MTTR, SLA adherence, incident trends, and risk scoring in a leadership-friendly view."
    actions={
      <div className="actions">
        <button type="button" className="primary">Export 1-click report</button>
        <button type="button" className="ghost">Schedule weekly email</button>
      </div>
    }
  />
);

export default ExecutiveDashboardPage;
