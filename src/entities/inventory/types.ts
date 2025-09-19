export type ItemType = 'raw' | 'subassembly' | 'finished' | 'service';

export interface Item {
  id: string;
  sku: string;
  name: string;
  uom: string;
  type: ItemType;
  unitCost: number;
}

export interface BomComponent {
  itemId: string;
  qty: number;
}

export interface Bom {
  id: string;
  itemId: string;
  components: BomComponent[];
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  warehouseId: string;
  path: string;
}

export type StockLotStatus = 'available' | 'reserved' | 'consumed' | 'quarantined' | 'in-transit';

export interface StockLot {
  id: string;
  itemId: string;
  lotNo: string;
  qty: number;
  locationId: string;
  status: StockLotStatus;
}

export type StockMoveRefType =
  | 'PurchaseOrder'
  | 'ProductionOrder'
  | 'WorkOrder'
  | 'SalesOrder'
  | 'Adjustment'
  | 'QualityCheck';

export interface StockMove {
  id: string;
  itemId: string;
  qty: number;
  fromLocationId?: string;
  toLocationId?: string;
  refType: StockMoveRefType;
  refId: string;
  ts: string;
  note?: string;
}

export interface InventoryState {
  items: Item[];
  boms: Bom[];
  warehouses: Warehouse[];
  locations: Location[];
  stockLots: StockLot[];
  stockMoves: StockMove[];
}
