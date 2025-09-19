import { enterpriseState } from '../state';
import { inventoryRepository } from '../inventory/mockRepository';
import { deepClone, generateId } from '../utils';
import type {
  Customer,
  ErpState,
  Invoice,
  OrderStatus,
  PurchaseOrder,
  SalesOrder,
  Supplier,
} from './types';

const getState = (): ErpState => enterpriseState.erp;

export const erpRepository = {
  async listSuppliers(): Promise<Supplier[]> {
    return deepClone(getState().suppliers);
  },
  async listCustomers(): Promise<Customer[]> {
    return deepClone(getState().customers);
  },
  async listPurchaseOrders(): Promise<PurchaseOrder[]> {
    return deepClone(getState().purchaseOrders);
  },
  async listSalesOrders(): Promise<SalesOrder[]> {
    return deepClone(getState().salesOrders);
  },
  async listInvoices(): Promise<Invoice[]> {
    return deepClone(getState().invoices);
  },
  async updatePurchaseOrderStatus(poId: string, status: OrderStatus): Promise<PurchaseOrder> {
    const state = getState();
    const order = state.purchaseOrders.find(po => po.id === poId);
    if (!order) {
      throw new Error(`Purchase order ${poId} not found`);
    }
    order.status = status;
    return deepClone(order);
  },
  async receivePurchaseOrder(poId: string): Promise<PurchaseOrder> {
    const state = getState();
    const order = state.purchaseOrders.find(po => po.id === poId);
    if (!order) {
      throw new Error(`Purchase order ${poId} not found`);
    }
    const defaultLocation = enterpriseState.inventory.locations.find(location =>
      location.path.toLowerCase().includes('raw'),
    )?.id ?? enterpriseState.inventory.locations[0]?.id;
    for (const line of order.lines) {
      await inventoryRepository.receiveInventory({
        itemId: line.itemId,
        qty: line.qty,
        locationId: defaultLocation,
        refType: 'PurchaseOrder',
        refId: order.id,
      });
    }
    order.status = order.status === 'approved' ? 'received' : 'partially-received';
    return deepClone(order);
  },
  async updateSalesOrderStatus(soId: string, status: OrderStatus): Promise<SalesOrder> {
    const state = getState();
    const order = state.salesOrders.find(so => so.id === soId);
    if (!order) {
      throw new Error(`Sales order ${soId} not found`);
    }
    order.status = status;
    return deepClone(order);
  },
  async shipSalesOrder(soId: string): Promise<SalesOrder> {
    const state = getState();
    const order = state.salesOrders.find(so => so.id === soId);
    if (!order) {
      throw new Error(`Sales order ${soId} not found`);
    }
    const fgLocation = enterpriseState.inventory.locations.find(location =>
      location.path.toLowerCase().includes('fg'),
    )?.id ?? enterpriseState.inventory.locations[0]?.id;
    for (const line of order.lines) {
      await inventoryRepository.recordStockMove({
        itemId: line.itemId,
        qty: line.qty,
        fromLocationId: fgLocation,
        refType: 'SalesOrder',
        refId: order.id,
        note: 'Shipment',
      });
    }
    order.status = 'shipped';
    return deepClone(order);
  },
  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    const state = getState();
    const doc: Invoice = { ...invoice, id: generateId('invoice') };
    state.invoices.push(doc);
    return deepClone(doc);
  },
};

export type ErpRepository = typeof erpRepository;
