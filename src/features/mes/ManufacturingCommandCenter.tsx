import React, { useMemo } from 'react';
import {
  useProductionLinesQuery,
  useProductionOrdersQuery,
  useValueStreamsQuery,
  useWorkCentersQuery,
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
  const { data: workCenters = [] } = useWorkCentersQuery();

  const workCenterMap = useMemo(
    () => new Map(workCenters.map(center => [center.id, center])),
    [workCenters],
  );

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
    <section className="mes-layout mes-command" aria-label="Командный центр MES">
      <header className="mes-layout__hero">
        <div className="mes-layout__hero-main">
          <h1>Командный центр MES</h1>
          <p className="muted">
            Стратегическое управление производством: разделите value stream&rsquo;ы, синхронизируйте смены и держите под
            контролем критические блокеры.
          </p>
        </div>
        <div className="mes-layout__hero-actions mes-command__actions">
          <button type="button" className="primary">Синхронизировать с ERP</button>
          <button type="button" className="secondary">Экспортировать план смен</button>
        </div>
      </header>
      <div className="mes-layout__primary">
        <div className="mes-command__grid">
          <article className="mes-card mes-command__card">
            <header className="mes-command__card-header">
              <div>
                <h2>Портфель заказов</h2>
                <p className="muted">Ключевые статусы и динамика по текущей неделе.</p>
              </div>
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
              <span className="chip chip--ghost">
                <span className="chip__label">Срок &lt; 72ч</span>
                <span className="chip__value">{orderSummary.dueSoon}</span>
              </span>
              <span className="chip chip--ghost">
                <span className="chip__label">Активных операций</span>
                <span className="chip__value">
                  {workOrders.filter(item => item.status === 'in-progress').length}
                </span>
              </span>
            </footer>
          </article>
          <article className="mes-card mes-command__card mes-command__card--stretch">
            <header className="mes-command__card-header">
              <div>
                <h2>Производственные линии</h2>
                <p className="muted">Нагрузка, такт и доступность по потокам.</p>
              </div>
            </header>
            <ul className="mes-command__list">
              {loadByLine.map(line => (
                <li key={line.id}>
                  <div className="mes-command__line-body">
                    <div className="mes-command__line-heading">
                      <strong>{line.name}</strong>
                      <span className="chip chip--muted">Смена {line.shiftPattern}</span>
                    </div>
                    <p className="muted">
                      Такт {Math.round(line.taktTimeSec / 60)} мин · План {line.targetPerShift} шт/смена · Факт {line.throughputPerShift} шт
                    </p>
                    {line.blockers.length > 0 && (
                      <p className="alert">Блокеры: {line.blockers.join(', ')}</p>
                    )}
                    <div className="mes-command__line-indicators">
                      <span className="chip">
                        <span className="chip__label">WIP</span>
                        <span className="chip__value">{line.currentWip}</span>
                      </span>
                      <span className="chip">
                        <span className="chip__label">Очередь</span>
                        <span className="chip__value">{line.wipOrders}</span>
                      </span>
                      <span className="chip">
                        <span className="chip__label">Работает</span>
                        <span className="chip__value">{line.active}</span>
                      </span>
                      <span className="chip">
                        <span className="chip__label">OEE</span>
                        <span className="chip__value">{formatPercent(line.availability)}</span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {loadByLine.length === 0 && <li className="muted">Нет активных линий</li>}
            </ul>
          </article>
          <article className="mes-card mes-command__card">
            <header className="mes-command__card-header">
              <div>
                <h2>Value stream сегментация</h2>
                <p className="muted">Разделённые зоны ответственности и точки эскалации.</p>
              </div>
            </header>
            <ul className="mes-command__streams">
              {valueStreams.map(stream => (
                <li key={stream.id}>
                  <div className="mes-command__stream-body">
                    <div className="mes-command__stream-heading">
                      <strong>{stream.name}</strong>
                      <span className="chip chip--accent">{stream.focus}</span>
                    </div>
                    <div className="mes-command__stream-metrics">
                      <span className="chip">
                        <span className="chip__label">Спрос недели</span>
                        <span className="chip__value">{stream.demandThisWeek}</span>
                      </span>
                      <span className="chip">
                        <span className="chip__label">Незакрытый бэклог</span>
                        <span className="chip__value">{stream.backlogUnits}</span>
                      </span>
                      <span className={`chip chip--risk-${stream.riskLevel}`}>
                        <span className="chip__label">Риск</span>
                        <span className="chip__value">{stream.riskLevel}</span>
                      </span>
                    </div>
                    <div className="mes-command__stream-meta">
                      <span className="chip chip--ghost">
                        <span className="chip__label">Группы доступа</span>
                        <span className="chip__value">{stream.gatekeepers.join(', ')}</span>
                      </span>
                      <span className="chip chip--ghost">
                        <span className="chip__label">Следующий рубеж</span>
                        <span className="chip__value">{stream.nextMilestone}</span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {valueStreams.length === 0 && <li className="muted">Value stream&apos;ы не назначены</li>}
            </ul>
          </article>
          <article className="mes-card mes-command__card">
            <header className="mes-command__card-header">
              <div>
                <h2>Нагрузка рабочих центров</h2>
                <p className="muted">Контроль WIP и доступности по всем зонам.</p>
              </div>
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
                {Array.from(workCentersLoad.entries()).map(([wcId, stats]) => {
                  const center = workCenterMap.get(wcId);
                  return (
                    <tr key={wcId}>
                      <td>
                        <div className="mes-command__wc-name">
                          <strong>{center?.name ?? wcId}</strong>
                          {center?.capabilityTags.length ? (
                            <span className="chip chip--muted">{center.capabilityTags.join(', ')}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className="chip">
                          <span className="chip__label">Очередь</span>
                          <span className="chip__value">{stats.backlog}</span>
                        </span>
                      </td>
                      <td>
                        <span className="chip">
                          <span className="chip__label">В работе</span>
                          <span className="chip__value">{stats.running}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {workCentersLoad.size === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      Нет активных рабочих центров
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </article>
        </div>
      </div>
    </section>
  );
};
