import React, { useMemo } from 'react';
import {
  useProductionLinesQuery,
  useProductionOrdersQuery,
  useValueStreamsQuery,
  useWorkOrdersQuery,
} from './hooks';

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
const formatNumber = (value: number) => value.toLocaleString('ru-RU');

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  released: 'Выпущен',
  'in-progress': 'В работе',
  completed: 'Закрыт',
  closed: 'Закрыт',
};

export const ManufacturingCommandCenter: React.FC = () => {
  const { data: productionOrders = [] } = useProductionOrdersQuery();
  const { data: workOrders = [] } = useWorkOrdersQuery();
  const { data: productionLines = [] } = useProductionLinesQuery();
  const { data: valueStreams = [] } = useValueStreamsQuery();

  const orderSummary = useMemo(() => {
    const base = new Map<string, number>();
    productionOrders.forEach(order => {
      const current = base.get(order.status) ?? 0;
      base.set(order.status, current + 1);
    });
    const dueSoon = productionOrders.filter(order => {
      const due = new Date(order.dueDate);
      const diff = due.getTime() - Date.now();
      return diff < 1000 * 60 * 60 * 24 * 3 && order.status !== 'completed';
    }).length;

    return {
      statuses: Array.from(base.entries()).map(([status, count]) => ({
        status,
        label: statusLabels[status] ?? status,
        count,
      })),
      total: productionOrders.length,
      dueSoon,
    };
  }, [productionOrders]);

  const loadByLine = useMemo(() =>
    productionLines.map(line => {
      const wipOrders = workOrders.filter(order => line.workCenterIds.includes(order.wcId));
      const active = wipOrders.filter(order => order.status === 'in-progress').length;
      return {
        ...line,
        wipOrders: wipOrders.length,
        active,
      };
    }),
  [productionLines, workOrders]);

  const workCentersLoad = useMemo(() => {
    const totals = new Map<string, { backlog: number; running: number }>();
    workOrders.forEach(order => {
      const current = totals.get(order.wcId) ?? { backlog: 0, running: 0 };
      if (order.status === 'completed') return;
      current.backlog += 1;
      if (order.status === 'in-progress') {
        current.running += 1;
      }
      totals.set(order.wcId, current);
    });
    return totals;
  }, [workOrders]);

  return (
    <section className="mes-command" aria-label="Командный центр MES">
      <header className="mes-command__header">
        <div>
          <h1>Командный центр MES</h1>
          <p className="muted">
            Стратегическое управление производством: разделите value stream&rsquo;ы, синхронизируйте смены и держите под
            контролем критические блокеры.
          </p>
        </div>
        <div className="mes-command__actions">
          <button type="button" className="primary">Синхронизировать с ERP</button>
          <button type="button" className="secondary">Экспортировать план смен</button>
        </div>
      </header>
      <div className="mes-command__grid">
        <article className="mes-command__card">
          <header>
            <h2>Портфель заказов</h2>
            <span className="badge">{orderSummary.total}</span>
          </header>
          <div className="mes-command__metrics">
            {orderSummary.statuses.map(item => (
              <div key={item.status} className="metric">
                <span className="metric__label">{item.label}</span>
                <span className="metric__value">{formatNumber(item.count)}</span>
              </div>
            ))}
          </div>
          <footer className="mes-command__footer">
            <span>Срок <strong>&lt; 72ч</strong>: {orderSummary.dueSoon}</span>
            <span>Активных операций: {workOrders.filter(item => item.status === 'in-progress').length}</span>
          </footer>
        </article>
        <article className="mes-command__card mes-command__card--stretch">
          <header>
            <h2>Производственные линии</h2>
            <p className="muted">Нагрузка, такт и доступность по потокам.</p>
          </header>
          <ul className="mes-command__list">
            {loadByLine.map(line => (
              <li key={line.id}>
                <div>
                  <strong>{line.name}</strong>
                  <p className="muted">
                    Такт {Math.round(line.taktTimeSec / 60)} мин • План {line.targetPerShift} шт/смена
                  </p>
                  {line.blockers.length > 0 && (
                    <p className="alert">Блокеры: {line.blockers.join(', ')}</p>
                  )}
                </div>
                <div className="mes-command__line-indicators">
                  <span>WIP: {line.currentWip}</span>
                  <span>Очередь: {line.wipOrders}</span>
                  <span>Работает: {line.active}</span>
                  <span>OEE: {formatPercent(line.availability)}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article className="mes-command__card">
          <header>
            <h2>Value stream сегментация</h2>
            <p className="muted">Разделённые зоны ответственности и точки эскалации.</p>
          </header>
          <ul className="mes-command__streams">
            {valueStreams.map(stream => (
              <li key={stream.id}>
                <div>
                  <strong>{stream.name}</strong>
                  <p className="muted">{stream.focus}</p>
                </div>
                <dl>
                  <div>
                    <dt>Спрос недели</dt>
                    <dd>{stream.demandThisWeek}</dd>
                  </div>
                  <div>
                    <dt>Незакрытый бэклог</dt>
                    <dd>{stream.backlogUnits}</dd>
                  </div>
                  <div>
                    <dt>Риск</dt>
                    <dd className={`status status--${stream.riskLevel}`}>{stream.riskLevel}</dd>
                  </div>
                </dl>
                <p className="muted">Группы доступа: {stream.gatekeepers.join(', ')}</p>
                <p className="muted">Следующий рубеж: {stream.nextMilestone}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="mes-command__card">
          <header>
            <h2>Нагрузка рабочих центров</h2>
            <p className="muted">Контроль WIP и доступности по всем зонам.</p>
          </header>
          <table className="mes-command__table">
            <thead>
              <tr>
                <th>Рабочий центр</th>
                <th>В очереди</th>
                <th>В работе</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(workCentersLoad.entries()).map(([wcId, stats]) => (
                <tr key={wcId}>
                  <td>{wcId}</td>
                  <td>{stats.backlog}</td>
                  <td>{stats.running}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
};
