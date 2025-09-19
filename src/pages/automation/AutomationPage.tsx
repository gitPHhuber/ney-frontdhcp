import React from 'react';
import { PlaybookList } from '../../features/automation/PlaybookList';
import { PagePlaceholder } from '../../shared/ui/PagePlaceholder';

const AutomationPage: React.FC = () => (
  <div className="stacked-page">
    <PlaybookList />
    <PagePlaceholder
      title="Schedulers & triggers"
      description="Configure cron-like schedules and metric/log-based triggers to launch playbooks."
    />
  </div>
);

export default AutomationPage;
