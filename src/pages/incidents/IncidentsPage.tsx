import React from 'react';
import { PagePlaceholder } from '../../shared/ui/PagePlaceholder';

const IncidentsPage: React.FC = () => (
  <PagePlaceholder
    title="Incidents & timelines"
    description="Track SLA timers, assignment, and recommended playbooks with Action Hints."
    actions={<button type="button" className="primary">Export PDF</button>}
  />
);

export default IncidentsPage;
