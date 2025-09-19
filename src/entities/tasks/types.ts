export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  tags: string[];
  dueDate?: string;
  sprintId?: string;
  workOrderId?: string;
  productionOrderId?: string;
}

export interface Sprint {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  wipLimit?: number;
  status: TaskStatus;
}

export interface Timesheet {
  id: string;
  userId: string;
  entityType: 'Task' | 'WorkOrder' | 'ProductionOrder' | 'Incident';
  entityId: string;
  hours: number;
  ts: string;
}

export interface TaskState {
  tasks: Task[];
  sprints: Sprint[];
  columns: KanbanColumn[];
  timesheets: Timesheet[];
}
