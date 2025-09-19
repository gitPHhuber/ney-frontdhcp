import { enterpriseState } from '../state';
import { deepClone, generateId } from '../utils';
import type {
  Bom,
  InventoryState,
  Item,
  Location,
  StockLot,
  StockLotStatus,
  StockMove,
  StockMoveRefType,
  Warehouse,
} from './types';

const getState = (): InventoryState => enterpriseState.inventory;

const adjustLotQuantity = (itemId: string, locationId: string, delta: number, status?: StockLotStatus) => {
  const state = getState();
  const lot = state.stockLots.find(existing => existing.itemId === itemId && existing.locationId === locationId);

  if (lot) {
    lot.qty = Math.max(0, Math.round((lot.qty + delta) * 100) / 100);
    if (status) {
      lot.status = status;
    }
    if (lot.qty === 0) {
      lot.status = 'consumed';
    }
    return lot;
  }

  if (delta <= 0) {
    return undefined;
  }

  const newLot: StockLot = {
    id: generateId('lot'),
    itemId,
    locationId,
    lotNo: generateId('auto'),
    qty: delta,
    status: status ?? 'available',
  };
  state.stockLots.push(newLot);
  return newLot;
};

const pushStockMove = (move: StockMove) => {
  const state = getState();
  state.stockMoves.unshift(move);
};

const createStockMove = (
  params: Omit<StockMove, 'id' | 'ts'> & { qty: number }
): StockMove => ({
  id: generateId('stock-move'),
  ts: new Date().toISOString(),
  ...params,
});

export const inventoryRepository = {
  async listItems(): Promise<Item[]> {
    return deepClone(getState().items);
  },
  async listBoms(): Promise<Bom[]> {
    return deepClone(getState().boms);
  },
  async listWarehouses(): Promise<Warehouse[]> {
    return deepClone(getState().warehouses);
  },
  async listLocations(): Promise<Location[]> {
    return deepClone(getState().locations);
  },
  async listStockLots(): Promise<StockLot[]> {
    return deepClone(getState().stockLots);
  },
  async listStockMoves(): Promise<StockMove[]> {
    return deepClone(getState().stockMoves);
  },
  async upsertItem(item: Item): Promise<Item> {
    const state = getState();
    const index = state.items.findIndex(existing => existing.id === item.id);
    if (index >= 0) {
      state.items[index] = { ...item };
      return deepClone(state.items[index]);
    }
    const newItem = { ...item, id: item.id ?? generateId('item') };
    state.items.push(newItem);
    return deepClone(newItem);
  },
  async recordStockMove({
    itemId,
    qty,
    fromLocationId,
    toLocationId,
    refId,
    refType,
    note,
    status,
  }: {
    itemId: string;
    qty: number;
    fromLocationId?: string;
    toLocationId?: string;
    refType: StockMoveRefType;
    refId: string;
    note?: string;
    status?: StockLotStatus;
  }): Promise<StockMove> {
    const quantity = Math.abs(qty);
    if (fromLocationId) {
      adjustLotQuantity(itemId, fromLocationId, -quantity);
    }
    if (toLocationId) {
      adjustLotQuantity(itemId, toLocationId, quantity, status);
    }
    const move = createStockMove({
      itemId,
      qty: quantity,
      fromLocationId,
      toLocationId,
      refType,
      refId,
      note,
    });
    pushStockMove(move);
    return deepClone(move);
  },
  async receiveInventory({
    itemId,
    qty,
    locationId,
    lotNo,
    refType,
    refId,
  }: {
    itemId: string;
    qty: number;
    locationId: string;
    lotNo?: string;
    refType: StockMoveRefType;
    refId: string;
  }): Promise<StockLot> {
    const state = getState();
    const lot = adjustLotQuantity(itemId, locationId, qty, 'available');
    if (lot) {
      if (lotNo) {
        lot.lotNo = lotNo;
      }
      pushStockMove(
        createStockMove({
          itemId,
          qty,
          toLocationId: locationId,
          refType,
          refId,
          note: 'Receipt',
        }),
      );
      return deepClone(lot);
    }
    const newLot: StockLot = {
      id: generateId('lot'),
      itemId,
      locationId,
      lotNo: lotNo ?? generateId('receipt'),
      qty,
      status: 'available',
    };
    state.stockLots.push(newLot);
    pushStockMove(
      createStockMove({
        itemId,
        qty,
        toLocationId: locationId,
        refType,
        refId,
        note: 'Receipt',
      }),
    );
    return deepClone(newLot);
  },
};

export type InventoryRepository = typeof inventoryRepository;
