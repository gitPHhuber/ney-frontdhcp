import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksRepository } from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';
import type { TaskStatus } from '../../entities';

export const useTaskBoardQuery = () =>
  useQuery({
    queryKey: queryKeys.tasks.board,
    queryFn: () => tasksRepository.listTasks(),
  });

export const useTaskColumnsQuery = () =>
  useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => tasksRepository.listColumns(),
  });

export const useSprintsQuery = () =>
  useQuery({
    queryKey: queryKeys.tasks.sprints,
    queryFn: () => tasksRepository.listSprints(),
  });

export const useTimesheetsQuery = () =>
  useQuery({
    queryKey: queryKeys.tasks.timesheets,
    queryFn: () => tasksRepository.listTimesheets(),
  });

export const useMoveTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksRepository.moveTask(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.board });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timesheets });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, patch }: { taskId: string; patch: Record<string, unknown> }) =>
      tasksRepository.updateTask(taskId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.board });
    },
  });
};
