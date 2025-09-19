import React, { useMemo, useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { startMeasure, endMeasure } from '../../shared/lib/performance';

const inlineEditSchema = z.object({
  owner: z.string().min(1),
});

type InventoryRow = {
  id: string;
  assetTag: string;
  model: string;
  location: string;
  owner: string;
};

export const InventoryTable: React.FC = () => {
  const [rows, setRows] = useState<InventoryRow[]>(() =>
    Array.from({ length: 250 }, (_, index) => ({
      id: `asset-${index + 1}`,
      assetTag: `AST-${1000 + index}`,
      model: index % 2 === 0 ? 'Dell R650' : 'Cisco C9500',
      location: index % 3 === 0 ? 'DC-West / Row A' : 'DC-East / Row C',
      owner: index % 4 === 0 ? 'Platform Team' : 'Network Team',
    })),
  );
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const form = useForm({ defaultValues: { owner: '' } });

  const handleEdit = React.useCallback(
    (row: InventoryRow) => {
      form.reset({ owner: row.owner });
      setEditingRowId(row.id);
    },
    [form],
  );

  const columns = useMemo<ColumnDef<InventoryRow>[]>(
    () => [
      { header: 'Asset tag', accessorKey: 'assetTag' },
      { header: 'Model', accessorKey: 'model' },
      { header: 'Location', accessorKey: 'location' },
      {
        header: 'Owner',
        accessorKey: 'owner',
        cell: ({ row, getValue }) => {
          const isEditing = editingRowId === row.original.id;
          if (!isEditing) {
            return (
              <button type="button" className="link" onClick={() => handleEdit(row.original)}>
                {String(getValue() ?? '')}
              </button>
            );
          }

          return (
            <form
              onSubmit={form.handleSubmit(value => {
                inlineEditSchema.parse(value);
                setRows(current =>
                  current.map(item =>
                    item.id === row.original.id ? { ...item, owner: value.owner } : item,
                  ),
                );
                setEditingRowId(null);
              })}
            >
              <input
                {...form.register('owner')}
                defaultValue={row.original.owner}
                aria-label={`Owner for ${row.original.assetTag}`}
              />
              <button type="submit" className="primary">
                Save
              </button>
            </form>
          );
        },
      },
    ],
    [editingRowId, form, handleEdit],
  );

  const table = useReactTable({ columns, data: rows, getCoreRowModel: getCoreRowModel() });
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 12,
  });

  React.useEffect(() => {
    startMeasure('inventory-table-render');
    return () => endMeasure('inventory-table-render');
  }, []);

  return (
    <div className="inventory-table">
      <div className="inventory-table__header">
        <h2>Inventory</h2>
        <div className="actions">
          <button type="button" className="ghost">Presets</button>
          <button type="button" className="ghost">Export CSV</button>
          <button type="button" className="primary">Add asset</button>
        </div>
      </div>
      <div ref={parentRef} className="inventory-table__viewport">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = table.getRowModel().rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="inventory-table__row"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <div key={cell.id} className="inventory-table__cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
