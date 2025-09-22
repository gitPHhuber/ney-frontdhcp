import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { productPassportRepository, type DeviceModel } from '../../../../entities';
import { queryKeys } from '../../../../shared/api/queryKeys';

export interface DeviceModelsTabProps {
  models: DeviceModel[];
}

export const DeviceModelsTab = ({ models }: DeviceModelsTabProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Omit<DeviceModel, 'id'>>({ defaultValues: { vendor: '', name: '', description: '' } });
  const createModel = useMutation({
    mutationFn: (values: Omit<DeviceModel, 'id'>) => productPassportRepository.createDeviceModel(values),
    onSuccess: model => {
      queryClient.setQueryData<DeviceModel[] | undefined>(queryKeys.productPassports.deviceModels, previous =>
        previous ? [...previous, model] : [model],
      );
      toast.success('Модель добавлена.');
      reset();
    },
    onError: () => toast.error('Не удалось добавить модель.'),
  });

  return (
    <section className="passport-constructor">
      <header className="passport-constructor__header">
        <div>
          <h2>Модели изделий</h2>
          <p className="muted">Справочник доступных моделей для шаблонов и паспортов.</p>
        </div>
      </header>
      <div className="passport-constructor__content">
        <div className="passport-constructor__editor">
          <table className="data-table">
            <thead>
              <tr>
                <th>Вендор</th>
                <th>Модель</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.id}>
                  <td>{model.vendor}</td>
                  <td>{model.name}</td>
                  <td>{model.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="passport-constructor__preview">
          <form className="stacked-form" onSubmit={handleSubmit(values => createModel.mutateAsync(values))}>
            <h3>Добавить модель</h3>
            <label>
              Вендор
              <input {...register('vendor', { required: true })} placeholder="Cisco" />
            </label>
            <label>
              Название модели
              <input {...register('name', { required: true })} placeholder="Catalyst 9500" />
            </label>
            <label>
              Описание
              <textarea {...register('description')} rows={3} />
            </label>
            <button type="submit" className="primary" disabled={isSubmitting}>
              Сохранить модель
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
};
