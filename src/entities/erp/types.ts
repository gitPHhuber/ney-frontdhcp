export type OrderStatus = 'draft' | 'approved' | 'received' | 'partially-received' | 'shipped' | 'partially-shipped' | 'closed';

export interface Supplier {
  id: string;
  name: string;
  contactEmail?: string;
}

export interface Customer {
  id: string;
  name: string;
  contactEmail?: string;
}

export interface OrderLine {
  itemId: string;
  qty: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  lines: OrderLine[];
  status: OrderStatus;
  expectedDate?: string;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  lines: OrderLine[];
  status: OrderStatus;
  promisedDate?: string;
}

export interface InvoiceLine {
  description: string;
  qty: number;
  price: number;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void';

export interface Invoice {
  id: string;
  partnerType: 'supplier' | 'customer';
  partnerId: string;
  lines: InvoiceLine[];
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
}

export interface ErpState {
  suppliers: Supplier[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
}
