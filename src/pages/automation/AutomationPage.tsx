import React from 'react';
import { PlaybookList } from '../../features/automation/PlaybookList';
import { PagePlaceholder } from '../../shared/ui/PagePlaceholder';
import { PlaybookBuilder } from '../../features/automation/PlaybookBuilder';

const AutomationPage: React.FC = () => (
  <div className="stacked-page">
    <PlaybookList />
    <PlaybookBuilder />
    <PagePlaceholder
      title="Планировщики и триггеры"
      description="Настраивайте расписания и триггеры по метрикам или логам, чтобы запускать плейбуки автоматически."
    />
  </div>
);

export default AutomationPage;
