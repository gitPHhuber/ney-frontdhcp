import type { ErpState } from '../erp/types';
import { seedReferenceTime } from './common';

const now = seedReferenceTime;

export const erpSeed: ErpState = {
  suppliers: [
    { id: 'sup-adv-components', name: 'Advanced Components Ltd', contactEmail: 'orders@advc.com' },
    { id: 'sup-global-pcb', name: 'Global PCB Works', contactEmail: 'sales@globalpcb.io' },
  ],
  customers: [
    { id: 'cust-citynet', name: 'CityNet ISP', contactEmail: 'ops@citynet.example' },
    { id: 'cust-fastfiber', name: 'FastFiber Telecom', contactEmail: 'noc@fastfiber.example' },
  ],
  purchaseOrders: [
    {
      id: 'po-2024-1045',
      supplierId: 'sup-adv-components',
      status: 'approved',
      expectedDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      lines: [
        { itemId: 'item-raw-001', qty: 200, price: 95 },
        { itemId: 'item-raw-002', qty: 4000, price: 1.6 },
      ],
    },
    {
      id: 'po-2024-1046',
      supplierId: 'sup-global-pcb',
      status: 'received',
      expectedDate: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      lines: [{ itemId: 'item-raw-001', qty: 150, price: 83 }],
    },
  ],
  salesOrders: [
    {
      id: 'so-2024-201',
      customerId: 'cust-citynet',
      status: 'approved',
      promisedDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      lines: [{ itemId: 'item-fin-001', qty: 30, price: 5400 }],
    },
    {
      id: 'so-2024-202',
      customerId: 'cust-fastfiber',
      status: 'draft',
      lines: [{ itemId: 'item-fin-001', qty: 10, price: 5500 }],
    },
  ],
  invoices: [
    {
      id: 'inv-2024-501',
      partnerType: 'customer',
      partnerId: 'cust-citynet',
      lines: [
        { description: 'Edge Router 1U', qty: 10, price: 5400 },
        { description: 'Deployment services', qty: 1, price: 3500 },
      ],
      total: 3500 + 10 * 5400,
      status: 'open',
      issuedAt: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString(),
    },
  ],
};
