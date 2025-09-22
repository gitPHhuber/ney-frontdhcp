import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { productPassportRepository } from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';
import { DeviceModelsTab } from './workspace/tabs/DeviceModelsTab';
import { InventoryTab } from './workspace/tabs/InventoryTab';
import { PassportWizardTab } from './workspace/tabs/PassportWizardTab';
import { TemplatesTab } from './workspace/tabs/TemplatesTab';

type TabKey = 'wizard' | 'inventory' | 'models' | 'templates';

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'wizard', label: 'Мастер паспорта' },
  { id: 'inventory', label: 'Инвентарь' },
  { id: 'models', label: 'Модели изделий' },
  { id: 'templates', label: 'Шаблоны паспортов' },
];

const useWorkspaceData = () => {
  const devicesQuery = useQuery({
    queryKey: queryKeys.productPassports.devices,
    queryFn: () => productPassportRepository.listDevices(),
  });
  const modelsQuery = useQuery({
    queryKey: queryKeys.productPassports.deviceModels,
    queryFn: () => productPassportRepository.listDeviceModels(),
  });
  const templatesQuery = useQuery({
    queryKey: queryKeys.productPassports.templates(),
    queryFn: () => productPassportRepository.listTemplates(),
  });

  return { devicesQuery, modelsQuery, templatesQuery };
};

const LoadingState = () => (
  <section className="passport-wizard">
    <p className="muted">Загрузка данных мастера…</p>
  </section>
);

const ErrorState = () => (
  <section className="passport-wizard">
    <p className="error">Не удалось загрузить данные по паспортам изделий.</p>
  </section>
);

export const ProductPassportWorkspace = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('wizard');
  const { devicesQuery, modelsQuery, templatesQuery } = useWorkspaceData();

  if (devicesQuery.isLoading || modelsQuery.isLoading || templatesQuery.isLoading) {
    return <LoadingState />;
  }

  if (devicesQuery.isError || modelsQuery.isError || templatesQuery.isError) {
    return <ErrorState />;
  }

  const devices = devicesQuery.data ?? [];
  const models = modelsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  return (
    <div className="passport-workspace">
      <div className="tab-strip">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'wizard' ? (
        <PassportWizardTab devices={devices} models={models} templates={templates} />
      ) : null}
      {activeTab === 'inventory' ? <InventoryTab devices={devices} models={models} /> : null}
      {activeTab === 'models' ? <DeviceModelsTab models={models} /> : null}
      {activeTab === 'templates' ? <TemplatesTab templates={templates} models={models} /> : null}
    </div>
  );
};
