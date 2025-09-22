import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { productPassportRepository, type DeviceModel, type NetworkDevice } from '../../../../entities';
import { queryKeys } from '../../../../shared/api/queryKeys';
import { deviceStatusLabels } from '../constants';
import { DeviceFormModal } from '../components/DeviceFormModal';
import type { DeviceFormValues } from '../types';

export interface InventoryTabProps {
  devices: NetworkDevice[];
  models: DeviceModel[];
}

export const InventoryTab = ({ devices, models }: InventoryTabProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const createDevice = useMutation({
    mutationFn: (values: DeviceFormValues) => productPassportRepository.createDevice(values),
    onSuccess: device => {
      queryClient.setQueryData<NetworkDevice[] | undefined>(queryKeys.productPassports.devices, previous =>
        previous ? [...previous, device] : [device],
      );
      toast.success('Изделие добавлено в инвентарь.');
      setModalOpen(false);
    },
    onError: () => toast.error('Не удалось создать изделие.'),
  });

  const modelMap = useMemo(() => new Map<string, DeviceModel>(models.map(model => [model.id, model])), [models]);

  const filteredDevices = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return devices;
    }
    return devices.filter(device =>
      [
        device.assetTag,
        device.serialNumber,
        device.ipAddress,
        device.location,
        device.owner,
        modelMap.get(device.deviceModelId)?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [devices, search, modelMap]);

  return (
    <section className="passport-constructor">
      <header className="passport-constructor__header">
        <div>
          <h2>Инвентарь сетевых устройств</h2>
          <p className="muted">Отсюда можно создать запись и использовать её в мастере паспорта.</p>
        </div>
        <div className="passport-constructor__actions">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Быстрый поиск по таблице"
          />
          <button type="button" className="primary" onClick={() => setModalOpen(true)}>
            Создать изделие
          </button>
        </div>
      </header>
      <div className="passport-constructor__content">
        <div className="passport-constructor__editor">
          <table className="data-table">
            <thead>
              <tr>
                <th>Инв. №</th>
                <th>Модель</th>
                <th>Серийный</th>
                <th>IP</th>
                <th>Расположение</th>
                <th>Ответственный</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map(device => {
                const model = modelMap.get(device.deviceModelId);
                return (
                  <tr key={device.id}>
                    <td>{device.assetTag}</td>
                    <td>{model ? `${model.vendor} ${model.name}` : '—'}</td>
                    <td>{device.serialNumber}</td>
                    <td>{device.ipAddress}</td>
                    <td>{device.location}</td>
                    <td>{device.owner}</td>
                    <td>{deviceStatusLabels[device.status]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <DeviceFormModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        models={models}
        title="Новое сетевое устройство"
        submitLabel="Создать"
        onSubmit={async values => {
          await createDevice.mutateAsync(values);
        }}
      />
    </section>
  );
};
