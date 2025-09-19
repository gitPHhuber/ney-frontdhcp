import { enterpriseState } from '../state';
import { deepClone, generateId } from '../utils';
import type { KanbanColumn, Sprint, Task, TaskState, TaskStatus, Timesheet } from './types';

const getState = (): TaskState => enterpriseState.tasks;

export const tasksRepository = {
  async listColumns(): Promise<KanbanColumn[]> {
    return deepClone(getState().columns);
  },
  async listTasks(): Promise<Task[]> {
    return deepClone(getState().tasks);
  },
  async listSprints(): Promise<Sprint[]> {
    return deepClone(getState().sprints);
  },
  async listTimesheets(): Promise<Timesheet[]> {
    return deepClone(getState().timesheets);
  },
  async moveTask(taskId: string, status: TaskStatus): Promise<Task> {
    const state = getState();
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    task.status = status;
    return deepClone(task);
  },
  async updateTask(taskId: string, patch: Partial<Task>): Promise<Task> {
    const state = getState();
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    Object.assign(task, patch);
    return deepClone(task);
  },
  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const state = getState();
    const created: Task = { ...task, id: generateId('task') };
    state.tasks.push(created);
    return deepClone(created);
  },
  async logTime(entry: Omit<Timesheet, 'id'>): Promise<Timesheet> {
    const state = getState();
    const timesheet: Timesheet = { ...entry, id: generateId('ts') };
    state.timesheets.push(timesheet);
    return deepClone(timesheet);
  },
};

export type TasksRepository = typeof tasksRepository;
