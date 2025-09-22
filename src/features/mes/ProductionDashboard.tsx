import React, { useMemo, useState } from 'react';
import {
  useMaintenanceOrdersQuery,
  useNonconformancesQuery,
  useProductionLinesQuery,
  useProductionOrdersQuery,
  useQualityChecksQuery,

  useValueStreamsQuery,

  useWorkCentersQuery,
  useWorkOrdersQuery,
} from './hooks';
import type { ProductionOrder, WorkOrder } from '../../entities';

type TabKey = 'orders' | 'operations' | 'resources' | 'quality';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

const formatNumber = (value: number) => value.toLocaleString('ru-RU');

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

  const [orderStatusFilter, setOrderStatusFilter] = useState<ProductionOrder['status'] | 'all'>('all');
  const [orderView, setOrderView] = useState<'table' | 'timeline'>('table');
  const [operationFocus, setOperationFocus] = useState<'status' | 'shift'>('status');
  const [selectedStream, setSelectedStream] = useState<'all' | string>('all');

  const { data: productionOrders = [] } = useProductionOrdersQuery();
  const { data: workOrders = [] } = useWorkOrdersQuery();
  const { data: workCenters = [] } = useWorkCentersQuery();
  const { data: productionLines = [] } = useProductionLinesQuery();
  const { data: qualityChecks = [] } = useQualityChecksQuery();
  const { data: nonconformances = [] } = useNonconformancesQuery();
  const { data: maintenanceOrders = [] } = useMaintenanceOrdersQuery();
  const { data: valueStreams = [] } = useValueStreamsQuery();

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

  const orderStatusCounts = useMemo(
    () =>
      productionOrders.reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] ?? 0) + 1;
          return acc;
        },
        {
          draft: 0,
          released: 0,
          'in-progress': 0,
          completed: 0,
          closed: 0,
        } as Record<ProductionOrder['status'], number>,
      ),
    [productionOrders],
  );

  const filteredOrders = useMemo(() => {
    const base =
      orderStatusFilter === 'all'
        ? [...productionOrders]
        : productionOrders.filter(order => order.status === orderStatusFilter);
    return base.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [orderStatusFilter, productionOrders]);

  const ordersTimeline = useMemo(
    () =>
      filteredOrders.map(order => {
        const dueTs = new Date(order.dueDate).getTime();
        const diffMs = dueTs - Date.now();
        const dayMs = 1000 * 60 * 60 * 24;
        const daysLeft = Math.ceil(diffMs / dayMs);
        const overdueDays = diffMs < 0 ? Math.ceil(Math.abs(diffMs) / dayMs) : 0;
        const progress = getProgress(order, workOrders);
        const dueLabel =
          diffMs < 0
            ? `Просрочено на ${overdueDays} дн.`
            : daysLeft <= 0
            ? 'Срок сегодня'
            : `Осталось ${daysLeft} дн.`;
        return { ...order, daysLeft, progress, dueLabel };
      }),
    [filteredOrders, workOrders],
  );

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

  const shiftBuckets = useMemo(() => {
    const definitions: {
      key: string;
      title: string;
      window: string;
      predicate: (order: WorkOrder) => boolean;
    }[] = [
      {
        key: 'shift-a',
        title: 'Смена A',
        window: '06:00 — 14:00',
        predicate: order => {
          if (!order.startedAt) return false;
          const hour = new Date(order.startedAt).getHours();
          return hour >= 6 && hour < 14;
        },
      },
      {
        key: 'shift-b',
        title: 'Смена B',
        window: '14:00 — 22:00',
        predicate: order => {
          if (!order.startedAt) return false;
          const hour = new Date(order.startedAt).getHours();
          return hour >= 14 && hour < 22;
        },
      },
      {
        key: 'shift-c',
        title: 'Ночная смена',
        window: '22:00 — 06:00',
        predicate: order => {
          if (!order.startedAt) return false;
          const hour = new Date(order.startedAt).getHours();
          return hour >= 22 || hour < 6;
        },
      },
      {
        key: 'no-start',
        title: 'Ожидают запуска',
        window: 'Без фактического старта',
        predicate: order => !order.startedAt,
      },
    ];

    return definitions.map(definition => ({
      ...definition,
      orders: workOrders
        .filter(order => definition.predicate(order))
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

  const operationAging = useMemo(
    () =>
      workOrders
        .filter(order => order.startedAt && order.status === 'in-progress')
        .map(order => ({
          ...order,
          agingMin: Math.max(
            0,
            Math.round((Date.now() - new Date(order.startedAt ?? '').getTime()) / (1000 * 60)),
          ),
        }))
        .sort((a, b) => b.agingMin - a.agingMin)
        .slice(0, 5),
    [workOrders],
  );

  const operatorUtilization = useMemo(() => {
    const stats = workOrders.reduce(
      (acc, order) => {
        if (!order.assignee) {
          return acc;
        }
        if (!acc[order.assignee]) {
          acc[order.assignee] = { active: 0, total: 0 };
        }
        acc[order.assignee].total += 1;
        if (order.status === 'in-progress') {
          acc[order.assignee].active += 1;
        }
        return acc;
      },
      {} as Record<string, { active: number; total: number }>,
    );

    return Object.entries(stats)
      .map(([assignee, value]) => ({ assignee, ...value }))
      .sort((a, b) => b.active - a.active || b.total - a.total)
      .slice(0, 6);
  }, [workOrders]);


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

  const streamLoads = useMemo(
    () =>
      valueStreams.map(stream => {
        const lines = lineSignals.filter(line => line.streamId === stream.id);
        const totalTarget = lines.reduce((acc, line) => acc + line.targetPerShift, 0);
        const totalThroughput = lines.reduce((acc, line) => acc + line.throughputPerShift, 0);
        const totalWip = lines.reduce((acc, line) => acc + line.currentWip, 0);
        const attainment = totalTarget === 0 ? 0 : Math.round((totalThroughput / totalTarget) * 100);
        const blockers = lines.flatMap(line => line.blockers);
        return {
          id: stream.id,
          name: stream.name,
          focus: stream.focus,
          demand: stream.demandThisWeek,
          backlog: stream.backlogUnits,
          risk: stream.riskLevel,
          attainment,
          totalThroughput,
          totalTarget,
          totalWip,
          blockers,
        };
      }),
    [lineSignals, valueStreams],
  );

  const streamInsights = useMemo(() => {
    return valueStreams.map(stream => {
      const load = streamLoads.find(item => item.id === stream.id);
      const lines = lineSignals.filter(line => line.streamId === stream.id);
      const availability =
        lines.length === 0
          ? 0
          : Math.round((lines.reduce((acc, line) => acc + line.availability, 0) / lines.length) * 100);
      return {
        id: stream.id,
        name: stream.name,
        focus: stream.focus,
        demand: load?.demand ?? stream.demandThisWeek,
        backlog: load?.backlog ?? stream.backlogUnits,
        wip: load?.totalWip ?? 0,
        attainment: load?.attainment ?? 0,
        risk: load?.risk ?? stream.riskLevel,
        blockers: load?.blockers ?? [],
        gatekeepers: stream.gatekeepers,
        nextMilestone: stream.nextMilestone,
        availability,
        lineCount: lines.length,
      };
    });
  }, [lineSignals, streamLoads, valueStreams]);

  const streamCenterIds = useMemo(() => {
    if (selectedStream === 'all') {
      return new Set<string>();
    }
    return new Set(
      productionLines
        .filter(line => line.streamId === selectedStream)
        .flatMap(line => line.workCenterIds),
    );
  }, [productionLines, selectedStream]);

  const filteredBacklogByCenter = useMemo(
    () =>
      selectedStream === 'all'
        ? backlogByCenter
        : backlogByCenter.filter(center => streamCenterIds.has(center.id)),
    [backlogByCenter, selectedStream, streamCenterIds],
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

  const testPlans = useMemo(
    () => [
      { id: 'plan-1', name: 'Регрессия по стендам', ownerTeam: 'QA Core', coverage: 86, requiredFor: ['Серверы'] },
      { id: 'plan-2', name: 'Нагрузочные тесты', ownerTeam: 'Performance Lab', coverage: 72, requiredFor: ['Дроны'] },
      { id: 'plan-3', name: 'Электробезопасность', ownerTeam: 'Compliance', coverage: 64, requiredFor: ['Все'] },
    ],
    [],
  );

  const nonconformanceCounts = useMemo(
    () =>
      nonconformances.reduce(
        (acc, item) => {
          acc[item.severity] = (acc[item.severity] ?? 0) + 1;
          return acc;
        },
        { low: 0, medium: 0, high: 0 } as Record<'low' | 'medium' | 'high', number>,
      ),
    [nonconformances],
  );

  const tabs: { id: TabKey; label: string }[] = [
    { id: 'orders', label: 'Заказы' },
    { id: 'operations', label: 'Операции' },
    { id: 'resources', label: 'Ресурсы' },
    { id: 'quality', label: 'Качество и поддержка' },
  ];


  return (
    <section className="mes-page mes-production" aria-label="Операции производства">
      <header className="page__header">
        <div>
          <h1>Операционное управление производством</h1>
          <p className="muted">Контролируйте портфель заказов, загрузку смены и качество на одном экране.</p>
        </div>
        <div className="page__header-actions">
          <button type="button" className="secondary">Сводка смены</button>
          <button type="button" className="primary">Создать производственный заказ</button>
        </div>
      </header>

      <div className="page__metrics">
        <div className="page__metric-card">
          <span className="metric__label">Заказы в работе</span>
          <span className="metric__value">{formatNumber(orderSummary.inProgress)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Срок &lt; 3 дней</span>
          <span className="metric__value">{formatNumber(orderSummary.dueSoon)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Просрочено</span>
          <span className="metric__value">{formatNumber(orderSummary.overdue)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Активных операций</span>
          <span className="metric__value">{formatNumber(workOrderSummary['in-progress'])}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Открытые NCR</span>
          <span className="metric__value">{formatNumber(qualitySummary.openNonconformances)}</span>
        </div>
      </div>

      <div className="page__content">
        <section className="page__main" aria-label="Панели производства">
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

                  <div className="mes-production__toolbar">
                    <div className="mes-production__filters" role="group" aria-label="Фильтрация по статусу заказа">
                      {(
                        [
                          { id: 'all', label: 'Все', count: orderSummary.total },
                          { id: 'in-progress', label: 'В работе', count: orderStatusCounts['in-progress'] },
                          { id: 'released', label: 'Выпущен', count: orderStatusCounts.released },
                          { id: 'draft', label: 'Черновик', count: orderStatusCounts.draft },
                          { id: 'completed', label: 'Завершён', count: orderStatusCounts.completed },
                          { id: 'closed', label: 'Закрыт', count: orderStatusCounts.closed },
                        ] as const
                      ).map(option => (
                        <button
                          key={option.id}
                          type="button"
                          className={`mes-production__filter ${orderStatusFilter === option.id ? 'mes-production__filter--active' : ''}`}
                          aria-pressed={orderStatusFilter === option.id}
                          onClick={() => setOrderStatusFilter(option.id)}
                        >
                          <span>{option.label}</span>
                          <span className="mes-production__filter-count">{option.count}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mes-production__view-toggle" role="group" aria-label="Представление заказов">
                      <button
                        type="button"
                        className={`mes-production__toggle ${orderView === 'table' ? 'mes-production__toggle--active' : ''}`}
                        aria-pressed={orderView === 'table'}
                        onClick={() => setOrderView('table')}
                      >
                        Таблица
                      </button>
                      <button
                        type="button"
                        className={`mes-production__toggle ${orderView === 'timeline' ? 'mes-production__toggle--active' : ''}`}
                        aria-pressed={orderView === 'timeline'}
                        onClick={() => setOrderView('timeline')}
                      >
                        Таймлайн
                      </button>
                    </div>
                  </div>
                  {orderView === 'table' ? (
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
                        {filteredOrders.map(order => {
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
                                    {progress}%
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <ul className="mes-production__timeline">
                      {ordersTimeline.map(order => (
                        <li key={order.id}>
                          <div>
                            <strong>{order.id}</strong>
                            <p className="muted">{order.dueLabel}</p>
                          </div>
                          <span className={`status status--${order.status}`}>{productionStatusLabel[order.status]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <article className="mes-production__panel">
                  <header>
                    <h3>Критические заказы</h3>
                    <p className="muted">Ближайшие к сроку и требующие внимания.</p>
                  </header>
                  <ul className="mes-production__list">
                    {criticalOrders.map(order => (
                      <li key={order.id}>
                        <div>
                          <strong>{order.id}</strong>
                          <p className="muted">{order.dueLabel}</p>
                        </div>
                        <span className={`status status--${order.status}`}>{productionStatusLabel[order.status]}</span>
                      </li>
                    ))}
                    {criticalOrders.length === 0 && <li className="muted">Срочных заказов нет</li>}
                  </ul>
                </article>

                <article className="mes-production__panel">
                  <header>
                    <h3>Фокус потоков</h3>
                    <p className="muted">Синхронизация спроса, WIP и выполнения.</p>
                  </header>
                  <ul className="mes-production__operator-list">
                    {streamInsights.map(stream => (
                      <li key={stream.id} className="mes-production__operator">
                        <div>
                          <strong>{stream.name}</strong>
                          <p className="muted">{stream.focus}</p>
                        </div>
                        <div className="mes-production__stream-meta">
                          <span className={`chip chip--risk-${stream.risk}`}>Риск {stream.risk}</span>
                          <span className="chip chip--ghost">WIP {stream.wip}</span>
                          <span className="chip chip--ghost">Линий {stream.lineCount}</span>
                        </div>
                      </li>
                    ))}
                    {streamInsights.length === 0 && <li className="muted">Потоки не настроены</li>}
                  </ul>
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

                  <div className="mes-production__toolbar mes-production__toolbar--sub">
                    <div className="mes-production__filters" role="group" aria-label="Представление операций">
                      <button
                        type="button"
                        className={`mes-production__toggle ${operationFocus === 'status' ? 'mes-production__toggle--active' : ''}`}
                        aria-pressed={operationFocus === 'status'}
                        onClick={() => setOperationFocus('status')}
                      >
                        По статусам
                      </button>
                      <button
                        type="button"
                        className={`mes-production__toggle ${operationFocus === 'shift' ? 'mes-production__toggle--active' : ''}`}
                        aria-pressed={operationFocus === 'shift'}
                        onClick={() => setOperationFocus('shift')}
                      >
                        По сменам
                      </button>
                    </div>
                  </div>
                  {operationFocus === 'status' ? (
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
                  ) : (
                    <div className="mes-production__operations">
                      {shiftBuckets.map(group => (
                        <section key={group.key}>
                          <header className="mes-production__operations-header">
                            <h4>{group.title}</h4>
                            <p className="muted">{group.window}</p>
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
                            {group.orders.length === 0 && <li className="muted">Нет операций в смене</li>}
                          </ul>
                        </section>
                      ))}
                    </div>
                  )}
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

                <article className="mes-production__panel">
                  <header>
                    <h3>Лидеры смены</h3>
                    <p className="muted">Активные исполнители и глубина очереди по ним.</p>
                  </header>
                  <ul className="mes-production__operator-list">
                    {operatorUtilization.map(operator => (
                      <li key={operator.assignee} className="mes-production__operator">
                        <div>
                          <strong>{operator.assignee}</strong>
                          <p className="muted">Активно {operator.active} / Всего {operator.total}</p>
                        </div>
                        <div className="mes-production__bar">
                          <div
                            className="mes-production__bar-fill"
                            style={{ width: operator.total === 0 ? '0%' : `${(operator.active / operator.total) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                    {operatorUtilization.length === 0 && <li className="muted">Исполнители не назначены</li>}
                  </ul>
                </article>

                <article className="mes-production__panel">
                  <header>
                    <h3>Долгие операции</h3>
                    <p className="muted">Мониторинг затянувшихся заданий текущей смены.</p>
                  </header>
                  <ul className="mes-production__list">
                    {operationAging.map(order => (
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
                          <span className="chip chip--accent">{order.agingMin} мин</span>
                        </div>
                      </li>
                    ))}
                    {operationAging.length === 0 && <li className="muted">Долгих операций нет</li>}
                  </ul>
                </article>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="mes-production__panels mes-production__panels--grid">
                <article className="mes-production__panel mes-production__panel--wide">
                  <header>
                    <h3>Загрузка рабочих центров</h3>
                    <p className="muted">Контроль WIP и доступности по всем зонам.</p>
                  </header>
                  <div className="mes-production__toolbar mes-production__toolbar--sub">
                    <div className="mes-production__filters" role="group" aria-label="Фильтр потоков">
                      <button
                        type="button"
                        className={`mes-production__filter ${selectedStream === 'all' ? 'mes-production__filter--active' : ''}`}
                        aria-pressed={selectedStream === 'all'}
                        onClick={() => setSelectedStream('all')}
                      >
                        Все потоки
                      </button>
                      {valueStreams.map(stream => (
                        <button
                          key={stream.id}
                          type="button"
                          className={`mes-production__filter ${selectedStream === stream.id ? 'mes-production__filter--active' : ''}`}
                          aria-pressed={selectedStream === stream.id}
                          onClick={() => setSelectedStream(stream.id)}
                        >
                          {stream.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <table className="mes-production__table">
                    <thead>
                      <tr>
                        <th>Центр</th>
                        <th>Очередь</th>
                        <th>В работе</th>
                        <th>Блокировано</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBacklogByCenter.map(center => (
                        <tr key={center.id}>
                          <td>
                            <div>
                              <strong>{center.name}</strong>
                              <p className="muted">{center.capabilities}</p>
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
                      {filteredBacklogByCenter.length === 0 && (
                        <tr>
                          <td colSpan={4} className="mes-production__empty">
                            Нет активных рабочих центров
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </article>

                <article className="mes-production__panel">
                  <header>
                    <h3>Планы обслуживания</h3>
                    <p className="muted">Запланированные работы и критичность.</p>
                  </header>
                  <ul className="mes-production__list">
                    {upcomingMaintenance.map(order => (
                      <li key={order.id}>
                        <div>
                          <strong>{order.asset}</strong>
                          <p className="muted">{maintenanceTypeLabel[order.type]}</p>
                        </div>
                        <div className="mes-production__list-meta">
                          <span className="chip chip--ghost">{formatDate(order.schedule)}</span>
                          <span className={`status status--${order.status}`}>{maintenanceStatusLabel[order.status]}</span>
                        </div>
                      </li>
                    ))}
                    {upcomingMaintenance.length === 0 && <li className="muted">Обслуживание не требуется</li>}
                  </ul>
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
                      <span className="metric__value">{formatNumber(qualitySummary.total)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Ожидает</span>
                      <span className="metric__value">{formatNumber(qualitySummary.pending)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Блокировано</span>
                      <span className="metric__value">{formatNumber(qualitySummary.blocked)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Дефектов</span>
                      <span className="metric__value">{formatNumber(qualitySummary.failed)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Открытые NCR</span>
                      <span className="metric__value">{formatNumber(qualitySummary.openNonconformances)}</span>
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
                          <p className="muted">{check.entityType}</p>
                        </div>
                        <div className="mes-production__list-meta">
                          <span className="chip chip--ghost">{formatDateTime(check.checkedAt)}</span>
                          <span className={`status status--${check.status}`}>{qualityStatusLabel[check.status]}</span>
                        </div>
                      </li>
                    ))}
                    {recentQualityChecks.length === 0 && <li className="muted">Проверок не выполнялось</li>}
                  </ul>
                </article>
                <article className="mes-production__panel">
                  <header>
                    <h3>Нарушения</h3>
                    <p className="muted">Статусы NCR и приоритеты расследования.</p>
                  </header>
                  <ul className="mes-production__list">
                    {nonconformances.map(item => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.refType} #{item.refId}</strong>
                          <p className="muted">Ответственный: {item.owner ?? '—'}</p>
                        </div>
                        <div className="mes-production__list-meta">
                          <span className={`status status--${item.status}`}>{nonconformanceStatusLabel[item.status]}</span>
                          <span className={`chip chip--${item.severity}`}>{item.severity}</span>
                        </div>
                      </li>
                    ))}
                    {nonconformances.length === 0 && <li className="muted">Нарушений не найдено</li>}
                  </ul>
                </article>
                <article className="mes-production__panel">
                  <header>
                    <h3>Покрытие тест-планов</h3>
                    <p className="muted">Статусы тестовых планов и ответственные команды.</p>
                  </header>
                  <ul className="mes-production__operator-list">
                    {testPlans.map(plan => (
                      <li key={plan.id} className="mes-production__operator">
                        <div>
                          <strong>{plan.name}</strong>
                          <p className="muted">Команда {plan.ownerTeam}</p>
                        </div>
                        <div className="mes-production__stream-meta">
                          <span className="chip chip--ghost">Охват {plan.coverage}%</span>
                          <span className="chip chip--ghost">Обязателен для {plan.requiredFor.join(', ')}</span>
                        </div>
                      </li>
                    ))}
                    {testPlans.length === 0 && <li className="muted">Тест-планы не настроены</li>}
                  </ul>
                </article>
              </div>
            )}
          </div>
        </section>

        <aside className="page__sidebar" aria-label="Сводка качества и ТО">
          <section className="card" aria-label="Состояние качества">
            <h2>Состояние качества</h2>
            <ul className="mes-production__metrics">
              <li className="metric">
                <span className="metric__label">Контрольных точек</span>
                <span className="metric__value">{formatNumber(qualitySummary.total)}</span>
              </li>
              <li className="metric">
                <span className="metric__label">Блокировано</span>
                <span className="metric__value">{formatNumber(qualitySummary.blocked)}</span>
              </li>
              <li className="metric">
                <span className="metric__label">Открыто NCR</span>
                <span className="metric__value">{formatNumber(qualitySummary.openNonconformances)}</span>
              </li>
            </ul>
          </section>
          <section className="card" aria-label="Предстоящее обслуживание">
            <h2>Предстоящее обслуживание</h2>
            <ul className="mes-production__list">
              {upcomingMaintenance.slice(0, 3).map(order => (
                <li key={order.id}>
                  <div>
                    <strong>{order.asset}</strong>
                    <p className="muted">{maintenanceTypeLabel[order.type]}</p>
                  </div>
                  <span className="chip chip--ghost">{formatDate(order.schedule)}</span>
                </li>
              ))}
              {upcomingMaintenance.length === 0 && <li className="muted">Нет задач обслуживания</li>}
            </ul>
          </section>
          <section className="card" aria-label="Сводка NCR">
            <h2>Сводка NCR</h2>
            <ul className="mes-production__metrics">
              {(['low', 'medium', 'high'] as const).map(severity => (
                <li key={severity} className="metric">
                  <span className="metric__label">{severity.toUpperCase()}</span>
                  <span className="metric__value">{nonconformanceCounts[severity]}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );

};

export default ProductionDashboard;
