import React, { useMemo, useState } from 'react';
import {
  useMaintenanceOrdersQuery,
  useNonconformancesQuery,
  useProductionLinesQuery,
  useProductionOrdersQuery,
  useQualityChecksQuery,
  useWorkCentersQuery,
  useWorkOrdersQuery,
} from './hooks';
import type { ProductionOrder, WorkOrder } from '../../entities';

type TabKey = 'orders' | 'operations' | 'resources' | 'quality';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const getProgress = (order: ProductionOrder, workOrders: WorkOrder[]) => {
  const related = workOrders.filter(workOrder => workOrder.prodOrderId === order.id);
  if (related.length === 0) return 0;
  const completed = related.filter(workOrder => workOrder.status === 'completed').length;
  return Math.round((completed / related.length) * 100);
};

const productionStatusLabel: Record<ProductionOrder['status'], string> = {
  draft: 'Черновик',
  released: 'Выпущен',
  'in-progress': 'В работе',
  completed: 'Завершён',
  closed: 'Закрыт',
};

const workOrderStatusLabel: Record<WorkOrder['status'], string> = {
  planned: 'Запланировано',
  'in-progress': 'В работе',
  paused: 'На удержании',
  completed: 'Завершено',
  blocked: 'Заблокировано',
};

const qualityStatusLabel = {
  pending: 'Ожидает',
  passed: 'Пройдено',
  failed: 'Провалено',
  blocked: 'Блокировано',
} as const;

const nonconformanceStatusLabel = {
  open: 'Открыто',
  investigating: 'Анализ',
  resolved: 'Решено',
  closed: 'Закрыто',
} as const;

const maintenanceStatusLabel = {
  draft: 'Черновик',
  scheduled: 'Запланирован',
  'in-progress': 'В работе',
  completed: 'Выполнен',
} as const;

const maintenanceTypeLabel = {
  preventive: 'Профилактика',
  corrective: 'Корректирующее',
  inspection: 'Инспекция',
} as const;

export const ProductionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('orders');

  const { data: productionOrders = [] } = useProductionOrdersQuery();
  const { data: workOrders = [] } = useWorkOrdersQuery();
  const { data: workCenters = [] } = useWorkCentersQuery();
  const { data: productionLines = [] } = useProductionLinesQuery();
  const { data: qualityChecks = [] } = useQualityChecksQuery();
  const { data: nonconformances = [] } = useNonconformancesQuery();
  const { data: maintenanceOrders = [] } = useMaintenanceOrdersQuery();

  const productionOrderMap = useMemo(
    () => new Map(productionOrders.map(order => [order.id, order])),
    [productionOrders],
  );

  const orderSummary = useMemo(() => {
    const total = productionOrders.length;
    const inProgress = productionOrders.filter(order => order.status === 'in-progress').length;
    const completed = productionOrders.filter(order => order.status === 'completed').length;
    const dueSoon = productionOrders.filter(order => {
      const due = new Date(order.dueDate).getTime();
      return due - Date.now() <= 1000 * 60 * 60 * 24 * 3 && due >= Date.now() && order.status !== 'completed';
    }).length;
    const overdue = productionOrders.filter(order => {
      const due = new Date(order.dueDate).getTime();
      return due < Date.now() && order.status !== 'completed';
    }).length;
    const averageProgress =
      total === 0
        ? 0
        : Math.round(
            productionOrders.reduce((acc, order) => acc + getProgress(order, workOrders), 0) / total,
          );
    return { total, inProgress, completed, dueSoon, overdue, averageProgress };
  }, [productionOrders, workOrders]);

  const criticalOrders = useMemo(() => {
    return productionOrders
      .filter(order => {
        const due = new Date(order.dueDate).getTime();
        return due - Date.now() <= 1000 * 60 * 60 * 24 * 2 && order.status !== 'completed';
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [productionOrders]);

  const workOrderSummary = useMemo(() => {
    return workOrders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] ?? 0) + 1;
        return acc;
      },
      {
        planned: 0,
        'in-progress': 0,
        paused: 0,
        completed: 0,
        blocked: 0,
      } as Record<WorkOrder['status'], number>,
    );
  }, [workOrders]);

  const operationsGroups = useMemo(() => {
    const definitions: { key: string; title: string; statuses: WorkOrder['status'][]; hint: string }[] = [
      { key: 'running', title: 'В работе', statuses: ['in-progress'], hint: 'Исполняются в текущую смену' },
      { key: 'planned', title: 'На запуск', statuses: ['planned'], hint: 'Ожидают подтверждения диспетчера' },
      {
        key: 'attention',
        title: 'Требуют внимания',
        statuses: ['blocked', 'paused'],
        hint: 'Блокеры, простои и ожидание ресурсов',
      },
    ];

    return definitions.map(definition => ({
      ...definition,
      orders: workOrders
        .filter(order => definition.statuses.includes(order.status))
        .sort((a, b) => (a.startedAt ?? '').localeCompare(b.startedAt ?? '')),
    }));
  }, [workOrders]);

  const activeOperations = useMemo(
    () => workOrders.filter(order => order.status === 'in-progress').slice(0, 6),
    [workOrders],
  );

  const blockedOperations = useMemo(
    () => workOrders.filter(order => order.status === 'blocked').slice(0, 5),
    [workOrders],
  );

  const backlogByCenter = useMemo(() => {
    return workCenters
      .map(center => {
        const related = workOrders.filter(order => order.wcId === center.id);
        const inQueue = related.filter(order => order.status !== 'completed').length;
        const running = related.filter(order => order.status === 'in-progress').length;
        const blocked = related.filter(order => order.status === 'blocked').length;
        return {
          id: center.id,
          name: center.name,
          capabilities: center.capabilityTags.join(', '),
          inQueue,
          running,
          blocked,
        };
      })
      .sort((a, b) => b.inQueue - a.inQueue);
  }, [workCenters, workOrders]);

  const lineSignals = useMemo(
    () =>
      productionLines.map(line => ({
        ...line,
        attainment: Math.round((line.throughputPerShift / line.targetPerShift) * 100),
      })),
    [productionLines],
  );

  const qualitySummary = useMemo(() => {
    const blocked = qualityChecks.filter(check => check.status === 'blocked').length;
    const failed = qualityChecks.filter(check => check.status === 'failed').length;
    const pending = qualityChecks.filter(check => check.status === 'pending').length;
    const openNonconformances = nonconformances.filter(nc => nc.status !== 'closed').length;
    return { blocked, failed, pending, total: qualityChecks.length, openNonconformances };
  }, [qualityChecks, nonconformances]);

  const recentQualityChecks = useMemo(
    () => qualityChecks.slice(0, 6),
    [qualityChecks],
  );

  const upcomingMaintenance = useMemo(() => {
    return maintenanceOrders
      .filter(order => order.status !== 'completed')
      .sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())
      .slice(0, 6);
  }, [maintenanceOrders]);

  const tabs: { id: TabKey; label: string }[] = [
    { id: 'orders', label: 'Заказы' },
    { id: 'operations', label: 'Операции' },
    { id: 'resources', label: 'Ресурсы' },
    { id: 'quality', label: 'Качество и поддержка' },
  ];

  return (
    <section className="mes-production" aria-label="Операции производства">
      <header className="mes-production__header">
        <div>
          <h1>Операционное управление производством</h1>
          <p className="muted">Контролируйте портфель заказов, загрузку смены и качество на одном экране.</p>
        </div>
        <div className="mes-production__actions">
          <button type="button" className="secondary">
            Сводка смены
          </button>
          <button type="button" className="primary">
            Создать производственный заказ
          </button>
        </div>
      </header>

      <div className="mes-production__summary" role="list">
        <div className="mes-production__summary-card" role="listitem">
          <span className="metric__label">Заказы в работе</span>
          <span className="metric__value">{orderSummary.inProgress}</span>
          <span className="mes-production__hint">Средний прогресс {orderSummary.averageProgress}%</span>
        </div>
        <div className="mes-production__summary-card" role="listitem">
          <span className="metric__label">Запланировано операций</span>
          <span className="metric__value">{workOrderSummary.planned}</span>
          <span className="mes-production__hint">К запуску: {workOrderSummary['in-progress']} активных</span>
        </div>
        <div className="mes-production__summary-card" role="listitem">
          <span className="metric__label">Срок &lt; 3 дней</span>
          <span className="metric__value">{orderSummary.dueSoon}</span>
          <span className="mes-production__hint">Просрочено: {orderSummary.overdue}</span>
        </div>
        <div className="mes-production__summary-card" role="listitem">
          <span className="metric__label">Несоответствия открыты</span>
          <span className="metric__value">{qualitySummary.openNonconformances}</span>
          <span className="mes-production__hint">Контрольных точек: {qualitySummary.total}</span>
        </div>
      </div>

      <div className="mes-production__tabs" role="tablist" aria-label="Навигация по разделу производства">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`mes-production__tab ${activeTab === tab.id ? 'mes-production__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mes-production__content">
        {activeTab === 'orders' && (
          <div className="mes-production__panels mes-production__panels--grid">
            <article className="mes-production__panel mes-production__panel--wide">
              <header>
                <h3>Производственные заказы</h3>
                <p className="muted">Факт исполнения по каждому заказу и контроль сроков.</p>
              </header>
              <table className="mes-production__table">
                <thead>
                  <tr>
                    <th>Заказ</th>
                    <th>Объём</th>
                    <th>Срок</th>
                    <th>Статус</th>
                    <th>Прогресс</th>
                  </tr>
                </thead>
                <tbody>
                  {productionOrders.map(order => {
                    const progress = getProgress(order, workOrders);
                    return (
                      <tr key={order.id}>
                        <td>
                          <div>
                            <strong>{order.id}</strong>
                            <p className="muted">Номенклатура {order.itemId}</p>
                          </div>
                        </td>
                        <td>{order.qty}</td>
                        <td>{formatDate(order.dueDate)}</td>
                        <td>
                          <span className={`status status--${order.status}`}>
                            {productionStatusLabel[order.status]}
                          </span>
                        </td>
                        <td>
                          <div
                            className="progress"
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div className="progress__bar" style={{ width: `${progress}%` }}>
                              <span>{progress}%</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {productionOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="mes-production__empty">
                        Нет активных производственных заказов
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </article>
            <article className="mes-production__panel">
              <header>
                <h3>Критичные сроки</h3>
                <p className="muted">Заказы требующие внимания в ближайшие дни.</p>
              </header>
              <ul className="mes-production__list">
                {criticalOrders.map(order => {
                  const progress = getProgress(order, workOrders);
                  return (
                    <li key={order.id}>
                      <div>
                        <strong>{order.id}</strong>
                        <p className="muted">Поставка до {formatDate(order.dueDate)}</p>
                      </div>
                      <div className="mes-production__list-meta">

                        <span className="chip chip--ghost">
                          <span className="chip__label">Прогресс</span>
                          <span className="chip__value">{progress}%</span>
                        </span>

                        <span className={`status status--${order.status}`}>
                          {productionStatusLabel[order.status]}
                        </span>
                      </div>
                    </li>
                  );
                })}
                {criticalOrders.length === 0 && <li className="muted">Срочных заказов нет</li>}
              </ul>
            </article>
            <article className="mes-production__panel">
              <header>
                <h3>Сводка статусов</h3>
              </header>
              <div className="mes-production__metrics">
                <div className="metric">
                  <span className="metric__label">Всего заказов</span>
                  <span className="metric__value">{orderSummary.total}</span>
                </div>
                <div className="metric">
                  <span className="metric__label">Выполнено</span>
                  <span className="metric__value">{orderSummary.completed}</span>
                </div>
                <div className="metric">
                  <span className="metric__label">Операций завершено</span>
                  <span className="metric__value">{workOrderSummary.completed}</span>
                </div>
                <div className="metric">
                  <span className="metric__label">Блокеров</span>
                  <span className="metric__value">{workOrderSummary.blocked}</span>
                </div>
              </div>
            </article>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="mes-production__panels mes-production__panels--grid">
            <article className="mes-production__panel mes-production__panel--wide">
              <header>
                <h3>Исполнение операций</h3>
                <p className="muted">Распределение по статусам и назначенным исполнителям.</p>
              </header>
              <div className="mes-production__operations">
                {operationsGroups.map(group => (
                  <section key={group.key}>
                    <header className="mes-production__operations-header">
                      <h4>{group.title}</h4>
                      <p className="muted">{group.hint}</p>
                    </header>
                    <ul className="mes-production__list">
                      {group.orders.map(order => (

                    <li key={order.id}>
                      <div>
                        <strong>{order.opId}</strong>
                        <p className="muted">Заказ {order.prodOrderId}</p>
                      </div>
                      <div className="mes-production__list-meta">
                        {order.startedAt && (
                          <span className="chip chip--ghost">
                            <span className="chip__label">Старт</span>
                            <span className="chip__value">{formatDateTime(order.startedAt)}</span>
                          </span>
                        )}
                        {order.assignee && (
                          <span className="chip chip--ghost">
                            <span className="chip__label">Исполнитель</span>
                            <span className="chip__value">{order.assignee}</span>
                          </span>
                        )}
                        <span className={`status status--${order.status}`}>
                          {workOrderStatusLabel[order.status]}
                        </span>
                      </div>
                    </li>

                      ))}
                      {group.orders.length === 0 && <li className="muted">Нет операций в статусе</li>}
                    </ul>
                  </section>
                ))}
              </div>
            </article>
            <article className="mes-production__panel">
              <header>
                <h3>Блокирующие операции</h3>
                <p className="muted">Действия требующие вмешательства мастера.</p>
              </header>
              <ul className="mes-production__list">
                {blockedOperations.map(order => (
                  <li key={order.id}>
                    <div>
                      <strong>{order.opId}</strong>
                      <p className="muted">Заказ {order.prodOrderId}</p>
                    </div>
                    <div className="mes-production__list-meta">

                      {order.assignee && (
                        <span className="chip chip--ghost">
                          <span className="chip__label">Исполнитель</span>
                          <span className="chip__value">{order.assignee}</span>
                        </span>
                      )}
                      {order.startedAt && (
                        <span className="chip chip--ghost">
                          <span className="chip__label">Старт</span>
                          <span className="chip__value">{formatDateTime(order.startedAt)}</span>
                        </span>
                      )}

                      <span className={`status status--${order.status}`}>
                        {workOrderStatusLabel[order.status]}
                      </span>
                    </div>
                  </li>
                ))}
                {blockedOperations.length === 0 && <li className="muted">Блокеров не обнаружено</li>}
              </ul>
            </article>
            <article className="mes-production__panel">
              <header>
                <h3>Назначения смены</h3>
                <p className="muted">Последние операции с фактическим стартом.</p>
              </header>
              <ul className="mes-production__list">
                {activeOperations.map(order => (
                  <li key={order.id}>
                    <div>
                      <strong>{order.opId}</strong>
                      <p className="muted">{productionOrderMap.get(order.prodOrderId)?.itemId ?? order.prodOrderId}</p>
                    </div>
                    <div className="mes-production__list-meta">

                      {order.startedAt && (
                        <span className="chip chip--ghost">
                          <span className="chip__label">Старт</span>
                          <span className="chip__value">{formatDateTime(order.startedAt)}</span>
                        </span>
                      )}
                      {order.assignee && (
                        <span className="chip chip--ghost">
                          <span className="chip__label">Исполнитель</span>
                          <span className="chip__value">{order.assignee}</span>
                        </span>
                      )}

                    </div>
                  </li>
                ))}
                {activeOperations.length === 0 && <li className="muted">Нет операций в работе</li>}
              </ul>
            </article>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="mes-production__panels mes-production__panels--grid">
            <article className="mes-production__panel mes-production__panel--wide">
              <header>
                <h3>Производственные линии</h3>
                <p className="muted">Факт выполнения смены, доступность и риски.</p>
              </header>
              <ul className="mes-production__lines">
                {lineSignals.map(line => (
                  <li key={line.id}>

                    <div className="mes-production__line-body">
                      <div className="mes-production__line-heading">
                        <strong>{line.name}</strong>
                        <span className="chip chip--ghost">
                          <span className="chip__label">Смена</span>
                          <span className="chip__value">{line.shiftPattern}</span>
                        </span>
                      </div>
                      <p className="muted">
                        План {line.targetPerShift} шт • Факт {line.throughputPerShift} шт • Такт {Math.round(line.taktTimeSec / 60)} мин
                      </p>
                      {line.blockers.length > 0 && <p className="alert">Блокеры: {line.blockers.join(', ')}</p>}
                      <div className="mes-production__line-indicators">
                        <span className="chip">
                          <span className="chip__label">WIP</span>
                          <span className="chip__value">{line.currentWip}</span>
                        </span>
                        <span className="chip">
                          <span className="chip__label">План</span>
                          <span className="chip__value">{line.targetPerShift}</span>
                        </span>
                        <span className="chip">
                          <span className="chip__label">Факт</span>
                          <span className="chip__value">{line.throughputPerShift}</span>
                        </span>
                        <span className="chip">
                          <span className="chip__label">OEE</span>
                          <span className="chip__value">{line.attainment}%</span>
                        </span>
                      </div>

                    </div>
                  </li>
                ))}
                {lineSignals.length === 0 && <li className="muted">Линии не настроены</li>}
              </ul>
            </article>
            <article className="mes-production__panel">
              <header>
                <h3>Нагрузка рабочих центров</h3>
                <p className="muted">Очередь и блокировки по каждому центру.</p>
              </header>
              <table className="mes-production__table">
                <thead>
                  <tr>
                    <th>Рабочий центр</th>
                    <th>Очередь</th>
                    <th>В работе</th>
                    <th>Блокировано</th>
                  </tr>
                </thead>
                <tbody>
                  {backlogByCenter.map(center => (
                    <tr key={center.id}>
                      <td>
                        <div>
                          <strong>{center.name}</strong>
                          {center.capabilities && <p className="muted">{center.capabilities}</p>}
                        </div>
                      </td>

                      <td>
                        <span className="chip">
                          <span className="chip__label">Очередь</span>
                          <span className="chip__value">{center.inQueue}</span>
                        </span>
                      </td>
                      <td>
                        <span className="chip">
                          <span className="chip__label">В работе</span>
                          <span className="chip__value">{center.running}</span>
                        </span>
                      </td>
                      <td>
                        <span className="chip">
                          <span className="chip__label">Блокировано</span>
                          <span className="chip__value">{center.blocked}</span>
                        </span>
                      </td>

                    </tr>
                  ))}
                  {backlogByCenter.length === 0 && (
                    <tr>
                      <td colSpan={4} className="mes-production__empty">
                        Нет активных рабочих центров
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </article>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="mes-production__panels mes-production__panels--grid">
            <article className="mes-production__panel">
              <header>
                <h3>Индикаторы качества</h3>
              </header>
              <div className="mes-production__metrics">
                <div className="metric">
                  <span className="metric__label">Контрольных точек</span>
                  <span className="metric__value">{qualitySummary.total}</span>
                </div>
                <div className="metric">
                  <span className="metric__label">Ожидает</span>
                  <span className="metric__value">{qualitySummary.pending}</span>
                </div>
                <div className="metric">
                  <span className="metric__label">Блокировано</span>
                  <span className="metric__value">{qualitySummary.blocked}</span>
                </div>
                <div className="metric">
                  <span className="metric__label">Дефектов</span>
                  <span className="metric__value">{qualitySummary.failed}</span>
                </div>
                <div className="metric">
                  <span className="metric__label">Открытые NCR</span>
                  <span className="metric__value">{qualitySummary.openNonconformances}</span>
                </div>
              </div>
            </article>
            <article className="mes-production__panel">
              <header>
                <h3>Последние проверки</h3>
                <p className="muted">Результаты по ключевым контрольным операциям.</p>
              </header>
              <ul className="mes-production__list">
                {recentQualityChecks.map(check => (
                  <li key={check.id}>
                    <div>
                      <strong>{check.ruleId}</strong>
                      <p className="muted">
                        {check.entityType} #{check.entityId}
                      </p>
                    </div>
                    <span className={`status status--${check.status}`}>
                      {qualityStatusLabel[check.status]}
                    </span>
                  </li>
                ))}
                {recentQualityChecks.length === 0 && <li className="muted">Нет данных по проверкам</li>}
              </ul>
            </article>
            <article className="mes-production__panel">
              <header>
                <h3>Несоответствия</h3>
                <p className="muted">Мониторинг эскалаций и плана корректирующих действий.</p>
              </header>
              <ul className="mes-production__list">
                {nonconformances.map(nc => (
                  <li key={nc.id}>
                    <div>
                      <strong>
                        {nc.refType} #{nc.refId}
                      </strong>
                      <p className="muted">{nc.action ?? 'Действие не назначено'}</p>
                    </div>

                    <div className="mes-production__list-meta">
                      <span className={`chip chip--risk-${nc.severity}`}>
                        <span className="chip__label">Риск</span>
                        <span className="chip__value">{nc.severity}</span>
                      </span>
                      <span className={`status status--${nc.status}`}>
                        {nonconformanceStatusLabel[nc.status]}
                      </span>
                    </div>

                  </li>
                ))}
                {nonconformances.length === 0 && <li className="muted">Несоответствий нет</li>}
              </ul>
            </article>
            <article className="mes-production__panel">
              <header>
                <h3>План обслуживания</h3>
                <p className="muted">Ближайшие заявки на обслуживание оборудования.</p>
              </header>
              <ul className="mes-production__list">
                {upcomingMaintenance.map(order => (
                  <li key={order.id}>
                    <div>
                      <strong>{order.assetId}</strong>
                      <p className="muted">
                        {maintenanceTypeLabel[order.type]} • {formatDate(order.schedule)}
                      </p>
                    </div>
                    <span className={`status status--${order.status}`}>
                      {maintenanceStatusLabel[order.status]}
                    </span>
                  </li>
                ))}
                {upcomingMaintenance.length === 0 && <li className="muted">Обслуживание не требуется</li>}
              </ul>
            </article>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductionDashboard;
