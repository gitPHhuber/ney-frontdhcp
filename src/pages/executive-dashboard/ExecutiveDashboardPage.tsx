import React from 'react';
import { PagePlaceholder } from '../../shared/ui/PagePlaceholder';

const ExecutiveDashboardPage: React.FC = () => (
  <PagePlaceholder
    title="Дашборд для руководства"
    description="Отображайте доступность, MTTR, соблюдение SLA, тренды инцидентов и оценку рисков в формате, понятном топ-менеджменту."
    actions={
      <div className="actions">
        <button type="button" className="primary">Экспортировать отчёт</button>
        <button type="button" className="ghost">Запланировать еженедельную рассылку</button>
      </div>
    }
  />
);

export default ExecutiveDashboardPage;
