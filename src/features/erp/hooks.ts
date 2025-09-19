import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { erpRepository, inventoryRepository } from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';

export const useItemsQuery = () =>
  useQuery({
    queryKey: queryKeys.erp.items,
    queryFn: () => inventoryRepository.listItems(),
    staleTime: 60_000,
  });

export const usePurchaseOrdersQuery = () =>
  useQuery({
    queryKey: queryKeys.erp.purchaseOrders,
    queryFn: () => erpRepository.listPurchaseOrders(),
  });

export const useSalesOrdersQuery = () =>
  useQuery({
    queryKey: queryKeys.erp.salesOrders,
    queryFn: () => erpRepository.listSalesOrders(),
  });

export const useInvoicesQuery = () =>
  useQuery({
    queryKey: queryKeys.erp.invoices,
    queryFn: () => erpRepository.listInvoices(),
  });

export const useReceivePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) => erpRepository.receivePurchaseOrder(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.erp.purchaseOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
};

export const useShipSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (soId: string) => erpRepository.shipSalesOrder(soId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.erp.salesOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
};
