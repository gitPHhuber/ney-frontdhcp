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

const workOrderStatusLabel: Record<string, string> = {
  planned: 'Запланировано',
  'in-progress': 'В работе',
  paused: 'На удержании',
  blocked: 'Заблокировано',
  completed: 'Завершено',
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

  const workOrderSummary = useMemo(
    () =>
      workOrders.reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] ?? 0) + 1;
          return acc;
        },
        {
          planned: 0,
          'in-progress': 0,
          paused: 0,
          blocked: 0,
          completed: 0,
        } as Record<string, number>,
      ),
    [workOrders],
  );

  const activeOperations = workOrderSummary['in-progress'];
  const attentionOperations = workOrderSummary.blocked + workOrderSummary.paused;
  const activeLines = loadByLine.filter(line => line.active > 0).length;
  const totalValueStreams = valueStreams.length;
  const backlogOrders = productionOrders.filter(order => order.status !== 'completed').length;

  return (
    <section className="mes-page mes-command" aria-label="Командный центр MES">
      <header className="page__header">
        <div>
          <h1>Командный центр MES</h1>
          <p className="muted">
            Стратегическое управление производством: разделите value stream&apos;ы, синхронизируйте смены и держите под контролем
            критические блокеры.
          </p>
        </div>
        <div className="page__header-actions">
          <button type="button" className="primary">Синхронизировать с ERP</button>
          <button type="button" className="secondary">Экспортировать план смен</button>
        </div>
      </header>

      <div className="page__metrics">
        <div className="page__metric-card">
          <span className="metric__label">Заказов в портфеле</span>
          <span className="metric__value">{formatNumber(orderSummary.total)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Открыто</span>
          <span className="metric__value">{formatNumber(backlogOrders)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Операций в работе</span>
          <span className="metric__value">{formatNumber(activeOperations)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Требуют внимания</span>
          <span className="metric__value">{formatNumber(attentionOperations)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Активных линий</span>
          <span className="metric__value">{formatNumber(activeLines)}</span>
        </div>
      </div>

      <div className="page__content">
        <section className="page__main" aria-label="Производственные панели">
          <div className="page__panel-grid">
            <article className="card mes-command__card">
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
                  <span className="chip__value">{activeOperations}</span>
                </span>
              </footer>
            </article>

            <article className="card mes-command__card mes-command__card--stretch">
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
          </div>
        </section>
        <aside className="page__sidebar" aria-label="Навигация потоков">
          <section className="card" aria-label="Value stream сегментация">
            <h2>Value stream сегментация</h2>
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
          </section>
          <section className="card" aria-label="Статусы операций">
            <h2>Статусы операций</h2>
            <ul className="mes-command__streams">
              {Object.entries(workOrderSummary).map(([status, count]) => (
                <li key={status}>
                  <div className="mes-command__stream-body">
                    <div className="mes-command__stream-heading">
                      <strong>{workOrderStatusLabel[status as keyof typeof workOrderStatusLabel] ?? status}</strong>
                      <span className="chip chip--ghost">{formatNumber(count)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="muted">Value stream: {totalValueStreams}</p>
          </section>
        </aside>
      </div>

      <section className="page__summary card" aria-label="Нагрузка рабочих центров">
        <h2>Нагрузка рабочих центров</h2>
        <p className="muted">Контроль WIP и доступности по всем зонам.</p>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Рабочий центр</th>
              <th scope="col">В очереди</th>
              <th scope="col">В работе</th>
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
      </section>
    </section>
  );

};
