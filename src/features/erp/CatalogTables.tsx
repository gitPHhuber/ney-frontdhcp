import React, { useMemo, useRef, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useItemsQuery, usePurchaseOrdersQuery, useSalesOrdersQuery } from './hooks';
import { inventoryRepository } from '../../entities';
import type { Bom, Item, Location, PurchaseOrder, StockLot, Warehouse } from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';
import { useQuery } from '@tanstack/react-query';

const ExportButton: React.FC<{ rows: Record<string, unknown>[]; filename: string }> = ({ rows, filename }) => {
  const handleExport = () => {
    const header = Object.keys(rows[0] ?? {});
    const csv = [
      header.join(','),
      ...rows.map(row => header.map(key => JSON.stringify(row[key] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" className="ghost" onClick={handleExport} disabled={!rows.length}>
      Export CSV
    </button>
  );
};

const useInventorySupportingData = () => {
  return useQuery({
    queryKey: queryKeys.inventory.all,
    queryFn: async () => ({
      warehouses: await inventoryRepository.listWarehouses(),
      locations: await inventoryRepository.listLocations(),
      lots: await inventoryRepository.listStockLots(),
      boms: await inventoryRepository.listBoms(),
    }),
    staleTime: 60_000,
  });
};

export const CatalogTables: React.FC = () => {
  const { data: items = [], isLoading: itemsLoading } = useItemsQuery();
  const { data: supportData, isLoading: supportLoading } = useInventorySupportingData();
  const [filter, setFilter] = useState('');

  const filteredItems = useMemo(() => {
    if (!filter) return items;
    return items.filter(item => item.name.toLowerCase().includes(filter.toLowerCase()));
  }, [items, filter]);

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      { header: 'SKU', accessorKey: 'sku' },
      { header: 'Name', accessorKey: 'name' },
      { header: 'Type', accessorKey: 'type' },
      { header: 'UoM', accessorKey: 'uom' },
      {
        header: 'Unit cost',
        accessorKey: 'unitCost',
        cell: ({ getValue }) => `€${Number(getValue() ?? 0).toFixed(2)}`,
      },
    ],
    [],
  );

  const table = useReactTable({ columns, data: filteredItems, getCoreRowModel: getCoreRowModel() });
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  const bomIndex = new Map<string, Bom>();
  supportData?.boms?.forEach(bom => bomIndex.set(bom.itemId, bom));

  return (
    <section className="erp-catalog">
      <header className="erp-catalog__header">
        <div>
          <h2>Catalog &amp; Stock</h2>
          <p className="muted">Virtualised inventory with inline export and BOM visibility.</p>
        </div>
        <div className="actions">
          <input
            type="search"
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Filter items"
            aria-label="Filter items by name"
          />
          <ExportButton rows={filteredItems} filename={`items-${Date.now()}.csv`} />
        </div>
      </header>
      <div className="catalog-grid">
        <div className="catalog-grid__panel">
          <h3>Items</h3>
          {itemsLoading ? (
            <p>Loading items…</p>
          ) : (
            <div ref={parentRef} className="catalog-table__viewport">
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const row = table.getRowModel().rows[virtualRow.index];
                  return (
                    <div
                      key={row.id}
                      className="catalog-table__row"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: `translateY(${virtualRow.start}px)`,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <span key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <aside className="catalog-grid__aside">
          <h3>Bill of Materials</h3>
          {supportLoading ? (
            <p>Loading BOM…</p>
          ) : (
            <ul className="bom-list">
              {items.map(item => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <span className="muted">SKU {item.sku}</span>
                  <ul>
                    {bomIndex.get(item.id)?.components.map(component => {
                      const componentItem = items.find(entry => entry.id === component.itemId);
                      return (
                        <li key={`${item.id}-${component.itemId}`}>
                          {component.qty} × {componentItem?.name ?? component.itemId}
                        </li>
                      );
                    }) ?? <li>No BOM</li>}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div className="catalog-grid__panel">
          <h3>Warehouses &amp; Locations</h3>
          {supportLoading ? (
            <p>Loading network…</p>
          ) : (
            <WarehouseTable
              warehouses={supportData?.warehouses ?? []}
              locations={supportData?.locations ?? []}
              lots={supportData?.lots ?? []}
            />
          )}
        </div>
      </div>
    </section>
  );
};

interface WarehouseTableProps {
  warehouses: Warehouse[];
  locations: Location[];
  lots: StockLot[];
}

const WarehouseTable: React.FC<WarehouseTableProps> = ({ warehouses, locations, lots }) => {
  const data = useMemo(() => {
    return warehouses.map(warehouse => {
      const warehouseLocations = locations.filter(location => location.warehouseId === warehouse.id);
      const balance = warehouseLocations.reduce((acc, location) => {
        const locationLots = lots.filter(lot => lot.locationId === location.id);
        const qty = locationLots.reduce((sum, lot) => sum + lot.qty, 0);
        acc.total += qty;
        acc.locations.push({ path: location.path, qty, status: locationLots[0]?.status ?? 'available' });
        return acc;
      },
      { total: 0, locations: [] as Array<{ path: string; qty: number; status: string }> });
      return {
        id: warehouse.id,
        name: warehouse.name,
        totalQty: balance.total,
        locations: balance.locations,
      };
    });
  }, [warehouses, locations, lots]);

  return (
    <table className="warehouse-table">
      <thead>
        <tr>
          <th>Warehouse</th>
          <th>Total Qty</th>
          <th>Locations</th>
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.totalQty}</td>
            <td>
              <ul>
                {row.locations.map(location => (
                  <li key={location.path}>
                    <span>{location.path}</span>
                    <span className={`status status--${location.status}`}>{location.qty}</span>
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const PurchasingSalesSnapshot: React.FC = () => {
  const { data: purchaseOrders = [] } = usePurchaseOrdersQuery();
  const { data: salesOrders = [] } = useSalesOrdersQuery();
  const { data: items = [] } = useItemsQuery();

  const enrich = (lines: PurchaseOrder['lines']) =>
    lines.map(line => ({
      ...line,
      item: items.find(item => item.id === line.itemId)?.name ?? line.itemId,
    }));

  return (
    <section className="erp-orders">
      <header className="erp-orders__header">
        <div>
          <h2>Purchasing &amp; Sales</h2>
          <p className="muted">Track approvals and goods flow with linked stock movements.</p>
        </div>
      </header>
      <div className="erp-orders__grid">
        <div>
          <h3>Purchase Orders</h3>
          <ul className="order-list">
            {purchaseOrders.map(order => (
              <li key={order.id}>
                <div className="order-list__header">
                  <strong>{order.id}</strong>
                  <span className={`status status--${order.status}`}>{order.status}</span>
                </div>
                <ul>
                  {enrich(order.lines).map(line => (
                    <li key={`${order.id}-${line.itemId}`}>
                      {line.qty} × {line.item} @ €{line.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Sales Orders</h3>
          <ul className="order-list">
            {salesOrders.map(order => (
              <li key={order.id}>
                <div className="order-list__header">
                  <strong>{order.id}</strong>
                  <span className={`status status--${order.status}`}>{order.status}</span>
                </div>
                <ul>
                  {enrich(order.lines).map(line => (
                    <li key={`${order.id}-${line.itemId}`}>
                      {line.qty} × {line.item} @ €{line.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
