import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  productPassportRepository,
  type DeviceModel,
  type PassportTemplate,
} from '../../../../entities';
import { queryKeys } from '../../../../shared/api/queryKeys';
import { TemplateEditorModal } from '../components/TemplateEditorModal';
import type { TemplateCreationPayload } from '../types';

export interface TemplatesTabProps {
  templates: PassportTemplate[];
  models: DeviceModel[];
}

export const TemplatesTab = ({ templates, models }: TemplatesTabProps) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const createTemplate = useMutation({
    mutationFn: (payload: TemplateCreationPayload) =>
      productPassportRepository.createTemplate({
        deviceModelId: payload.deviceModelId,
        name: payload.name,
        description: payload.description,
        fields: payload.fields,
        isActive: payload.setActive,
        setActive: payload.setActive,
      }),
    onSuccess: template => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates(template.deviceModelId) });
      toast.success('Шаблон сохранён.');
      setModalOpen(false);
    },
    onError: () => toast.error('Не удалось сохранить шаблон.'),
  });

  const setActiveMutation = useMutation({
    mutationFn: (templateId: string) => productPassportRepository.setTemplateActive(templateId),
    onSuccess: (_, templateId) => {
      const template = templates.find(item => item.id === templateId);
      if (template) {
        queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates(template.deviceModelId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.productPassports.templates() });
      toast.success('Шаблон активирован.');
    },
    onError: () => toast.error('Не удалось обновить шаблон.'),
  });

  const modelMap = useMemo(() => new Map<string, DeviceModel>(models.map(model => [model.id, model])), [models]);

  return (
    <section className="passport-constructor">
      <header className="passport-constructor__header">
        <div>
          <h2>Шаблоны паспортов</h2>
          <p className="muted">Создавайте и версионируйте шаблоны для моделей устройств.</p>
        </div>
        <div className="passport-constructor__actions">
          <button type="button" className="primary" onClick={() => setModalOpen(true)}>
            Новый шаблон
          </button>
        </div>
      </header>
      <div className="passport-constructor__content">
        <div className="passport-constructor__editor">
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Модель</th>
                <th>Версия</th>
                <th>Поля</th>
                <th>Создан</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => {
                const model = modelMap.get(template.deviceModelId);
                return (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>{model ? `${model.vendor} ${model.name}` : '—'}</td>
                    <td>v{template.version}</td>
                    <td>{template.fields.length}</td>
                    <td>{new Date(template.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td>{template.isActive ? 'Активен' : 'Черновик'}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => setActiveMutation.mutate(template.id)}
                        disabled={template.isActive}
                      >
                        Сделать активным
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <TemplateEditorModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        models={models}
        onSubmit={async payload => {
          await createTemplate.mutateAsync(payload);
        }}
      />
    </section>
  );
};
