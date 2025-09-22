import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mesRepository } from '../../entities';
import type { FlashJobStatus } from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';

export const useProductionOrdersQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.productionOrders,
    queryFn: () => mesRepository.listProductionOrders(),
    staleTime: 30_000,
  });

export const useWorkOrdersQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.workOrders,
    queryFn: () => mesRepository.listWorkOrders(),
    staleTime: 10_000,
  });

export const useWorkCentersQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.workCenters,
    queryFn: () => mesRepository.listWorkCenters(),
  });

export const useQualityChecksQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.qualityChecks,
    queryFn: () => mesRepository.listQualityChecks(),
  });

export const useNonconformancesQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.nonconformances,
    queryFn: () => mesRepository.listNonconformances(),
  });

export const useMaintenanceOrdersQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.maintenance,
    queryFn: () => mesRepository.listMaintenanceOrders(),
  });

export const useProductionLinesQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.productionLines,
    queryFn: () => mesRepository.listProductionLines(),
    staleTime: 60_000,
  });

export const useValueStreamsQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.valueStreams,
    queryFn: () => mesRepository.listValueStreams(),
    staleTime: 60_000,
  });

export const useTestCellsQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.testCells,
    queryFn: () => mesRepository.listTestCells(),
    staleTime: 20_000,
  });

export const useTestPlansQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.testPlans,
    queryFn: () => mesRepository.listTestPlans(),
    staleTime: 60_000,
  });

export const useTestRunsQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.testRuns,
    queryFn: () => mesRepository.listTestRuns(),
    staleTime: 10_000,
  });

export const useFlashAgentsQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.flashAgents,
    queryFn: () => mesRepository.listFlashAgents(),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

export const useFlashPortsQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.flashPorts,
    queryFn: () => mesRepository.listFlashPorts(),
    staleTime: 2_000,
    refetchInterval: 5_000,
  });

export const useFlashPresetsQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.flashPresets,
    queryFn: () => mesRepository.listFlashPresets(),
    staleTime: 60_000,
  });

export const useFlashArtifactsQuery = (filters: Partial<Record<'project' | 'deviceType' | 'model', string>> = {}) =>
  useQuery({
    queryKey: queryKeys.mes.flashArtifacts(filters),
    queryFn: () => mesRepository.listFlashArtifacts(filters),
    staleTime: 30_000,
  });

export const useFlashJobsQuery = (
  filters: {
    date?: 'today' | 'week';
    status?: FlashJobStatus | 'all';
  } = { date: 'today', status: 'all' },
) =>
  useQuery({
    queryKey: queryKeys.mes.flashJobs({ date: filters.date ?? 'all', status: filters.status ?? 'all' }),
    queryFn: () => mesRepository.listFlashJobs(filters),
    refetchInterval: 15_000,
  });

export const useDeviceSessionsQuery = () =>
  useQuery({
    queryKey: queryKeys.mes.deviceSessions,
    queryFn: () => mesRepository.listDeviceSessions(),
    staleTime: 60_000,
  });

export const useGenerateWorkOrders = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prodOrderId: string) => mesRepository.generateWorkOrders(prodOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mes.workOrders });
    },
  });
};

export const useStartWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workOrderId, assignee }: { workOrderId: string; assignee?: string }) =>
      mesRepository.startWorkOrder(workOrderId, assignee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mes.workOrders });
    },
  });
};

export const useCompleteWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workOrderId: string) => mesRepository.completeWorkOrder(workOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mes.workOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.mes.productionOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
};
