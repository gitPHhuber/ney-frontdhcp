import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mesRepository } from '../../entities';
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
