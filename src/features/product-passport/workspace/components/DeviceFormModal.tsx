import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Modal from '../../../../components/ui/Modal';
import type { DeviceModel } from '../../../../entities';
import { deviceStatusLabels } from '../constants';
import { createDefaultDeviceFormValues } from '../utils';
import type { DeviceFormValues } from '../types';

export interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: DeviceFormValues) => Promise<void>;
  models: DeviceModel[];
  title: string;
  submitLabel: string;
}

export const DeviceFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  models,
  title,
  submitLabel,
}: DeviceFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<DeviceFormValues>({
    defaultValues: createDefaultDeviceFormValues(models),
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    reset(createDefaultDeviceFormValues(models));
  }, [isOpen, models, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form
        className="stacked-form"
        onSubmit={handleSubmit(async values => {
          await onSubmit(values);
          reset(createDefaultDeviceFormValues(models));
        })}
      >
        <label>
          Инвентарный номер
          <input {...register('assetTag', { required: true })} placeholder="AST-1001" />
        </label>
        <label>
          Модель
          <select {...register('deviceModelId', { required: true })}>
            <option value="">Выберите модель</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.vendor} {model.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Серийный номер
          <input {...register('serialNumber', { required: true })} placeholder="SN123456789" />
        </label>
        <label>
          IP-адрес
          <input {...register('ipAddress', { required: true })} placeholder="10.10.10.5" />
        </label>
        <label>
          Расположение
          <input {...register('location', { required: true })} placeholder="DC-West / Стойка 42" />
        </label>
        <label>
          Ответственная команда
          <input {...register('owner', { required: true })} placeholder="Команда сетей" />
        </label>
        <label>
          Статус
          <select {...register('status', { required: true })}>
            {Object.entries(deviceStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Примечание к истории
          <textarea {...register('historyNote')} placeholder="Например, получено со склада" rows={2} />
        </label>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};
