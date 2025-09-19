import React, { useMemo, useState } from 'react';
import { useTaskBoardQuery, useTaskColumnsQuery, useMoveTask, useTimesheetsQuery, useSprintsQuery } from './hooks';
import type { Task, TaskStatus } from '../../entities';

interface DragState {
  taskId: string;
  fromStatus: TaskStatus;
}

export const TaskBoard: React.FC = () => {
  const { data: tasks = [] } = useTaskBoardQuery();
  const { data: columns = [] } = useTaskColumnsQuery();
  const { data: timesheets = [] } = useTimesheetsQuery();
  const { data: sprints = [] } = useSprintsQuery();
  const moveTask = useMoveTask();
  const [dragState, setDragState] = useState<DragState | null>(null);

  const tasksByStatus = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.status] = tasks.filter(task => task.status === column.status);
        return acc;
      },
      {} as Record<TaskStatus, Task[]>,
    );
  }, [columns, tasks]);

  const handleDrop = (status: TaskStatus) => {
    if (!dragState || dragState.fromStatus === status) return;
    moveTask.mutate({ taskId: dragState.taskId, status });
    setDragState(null);
  };

  return (
    <section className="task-board">
      <header className="task-board__header">
        <div>
          <h2>Task Board</h2>
          <p className="muted">Kanban with sprint, WIP, and timesheet insights.</p>
        </div>
        <div className="task-board__meta">
          <strong>Active sprint:</strong>
          <span>{sprints[0]?.name ?? 'Unassigned'}</span>
        </div>
      </header>
      <div className="task-board__grid">
        {columns.map(column => (
          <div
            key={column.id}
            className="task-column"
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
              event.preventDefault();
              handleDrop(column.status);
            }}
            aria-label={`${column.title} column with ${tasksByStatus[column.status]?.length ?? 0} tasks`}
          >
            <header className="task-column__header">
              <h3>{column.title}</h3>
              {column.wipLimit && (
                <span className="muted">WIP {tasksByStatus[column.status]?.length ?? 0} / {column.wipLimit}</span>
              )}
            </header>
            <ul className="task-column__list">
              {(tasksByStatus[column.status] ?? []).map(task => (
                <li
                  key={task.id}
                  draggable
                  onDragStart={() => setDragState({ taskId: task.id, fromStatus: column.status })}
                  onDragEnd={() => setDragState(null)}
                >
                  <article className={`task-card priority-${task.priority}`}>
                    <header>
                      <h4>{task.title}</h4>
                      <span className="status-badge">{task.priority}</span>
                    </header>
                    <p>{task.description}</p>
                    <footer>
                      <span>{task.assignee ?? 'Unassigned'}</span>
                      {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </footer>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <aside className="task-board__aside">
          <h3>Timesheets (24h)</h3>
          <ul className="timesheet-list">
            {timesheets.map(entry => (
              <li key={entry.id}>
                <span>{entry.userId}</span>
                <span>{entry.entityType} #{entry.entityId}</span>
                <span>{entry.hours}h</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
};
