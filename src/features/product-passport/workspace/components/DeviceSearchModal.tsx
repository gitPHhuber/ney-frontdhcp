import { useEffect, useMemo, useState, type FormEvent } from 'react';

import Modal from '../../../../components/ui/Modal';
import type { DeviceModel, NetworkDevice } from '../../../../entities';
import { deviceStatusLabels } from '../constants';

export interface DeviceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: NetworkDevice[];
  models: DeviceModel[];
  onSelect: (device: NetworkDevice) => void;
}

export const DeviceSearchModal = ({
  isOpen,
  onClose,
  devices,
  models,
  onSelect,
}: DeviceSearchModalProps) => {
  const [assetTag, setAssetTag] = useState('');
  const [modelId, setModelId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<NetworkDevice[]>(devices);

  const modelMap = useMemo(() => new Map(models.map(model => [model.id, model])), [models]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setResults(devices);
  }, [devices, isOpen]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const filtered = devices.filter(device => {
      if (assetTag && !device.assetTag.toLowerCase().includes(assetTag.toLowerCase())) {
        return false;
      }
      if (modelId && device.deviceModelId !== modelId) {
        return false;
      }
      if (serialNumber && !device.serialNumber.toLowerCase().includes(serialNumber.toLowerCase())) {
        return false;
      }
      if (ipAddress && !device.ipAddress.toLowerCase().includes(ipAddress.toLowerCase())) {
        return false;
      }
      if (status && device.status !== status) {
        return false;
      }
      return true;
    });
    setResults(filtered);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Выбор устройства из инвентаря">
      <form className="stacked-form" onSubmit={handleSearch}>
        <div className="inventory-search-grid">
          <label>
            Инвентарный номер
            <input value={assetTag} onChange={event => setAssetTag(event.target.value)} />
          </label>
          <label>
            Модель
            <select value={modelId} onChange={event => setModelId(event.target.value)}>
              <option value="">Любая</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.vendor} {model.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Серийный номер
            <input value={serialNumber} onChange={event => setSerialNumber(event.target.value)} />
          </label>
          <label>
            IP-адрес
            <input value={ipAddress} onChange={event => setIpAddress(event.target.value)} />
          </label>
          <label>
            Статус
            <select value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">Любой</option>
              {Object.entries(deviceStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Закрыть
          </button>
          <button type="submit" className="primary">
            Найти
          </button>
        </div>
      </form>
      <div className="inventory-table__viewport" style={{ maxHeight: 280 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Инв. №</th>
              <th>Модель</th>
              <th>Серийный</th>
              <th>IP</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6}>Ничего не найдено</td>
              </tr>
            ) : (
              results.map(device => {
                const model = modelMap.get(device.deviceModelId);
                return (
                  <tr key={device.id}>
                    <td>{device.assetTag}</td>
                    <td>{model ? `${model.vendor} ${model.name}` : '—'}</td>
                    <td>{device.serialNumber}</td>
                    <td>{device.ipAddress}</td>
                    <td>{deviceStatusLabels[device.status]}</td>
                    <td>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          onSelect(device);
                          onClose();
                        }}
                      >
                        Выбрать
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
