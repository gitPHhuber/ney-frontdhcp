import type { TaskState } from '../tasks/types';
import { seedReferenceTime } from './common';

const now = seedReferenceTime;

export const tasksSeed: TaskState = {
  tasks: [
    {
      id: 'task-001',
      title: 'Проверить поставку PO-2024-1045',
      description: 'Подтвердить количество и инициировать входной контроль комплектующих.',
      status: 'in-progress',
      priority: 'high',
      assignee: 'olga',
      tags: ['erp', 'receiving'],
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(),
      sprintId: 'sprint-current',
      productionOrderId: 'po-router-10',
    },
    {
      id: 'task-002',
      title: 'Запланировать окно обслуживания',
      description: 'Согласовать простой линии сборки №1 для профилактического обслуживания.',
      status: 'todo',
      priority: 'medium',
      tags: ['maintenance'],
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 48).toISOString(),
      sprintId: 'sprint-current',
    },
    {
      id: 'task-003',
      title: 'Подготовить сводку KPI для руководства',
      description: 'Сопоставить производительность и спрос для отчёта руководству.',
      status: 'review',
      priority: 'high',
      assignee: 'irina',
      tags: ['reporting'],
      sprintId: 'sprint-next',
    },
  ],
  sprints: [
    {
      id: 'sprint-current',
      name: 'Sprint 12',
      start: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      end: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 11).toISOString(),
    },
    {
      id: 'sprint-next',
      name: 'Sprint 13',
      start: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 12).toISOString(),
      end: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 26).toISOString(),
    },
  ],
  columns: [
    { id: 'col-backlog', title: 'Бэклог', status: 'backlog', wipLimit: 30 },
    { id: 'col-todo', title: 'К выполнению', status: 'todo', wipLimit: 10 },
    { id: 'col-progress', title: 'В работе', status: 'in-progress', wipLimit: 8 },
    { id: 'col-review', title: 'Проверка', status: 'review', wipLimit: 5 },
    { id: 'col-done', title: 'Готово', status: 'done' },
  ],
  timesheets: [
    {
      id: 'ts-001',
      userId: 'alexei',
      entityType: 'WorkOrder',
      entityId: 'wo-router-10-1',
      hours: 2.5,
      ts: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: 'ts-002',
      userId: 'olga',
      entityType: 'Task',
      entityId: 'task-001',
      hours: 1.5,
      ts: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
    },
  ],
};
