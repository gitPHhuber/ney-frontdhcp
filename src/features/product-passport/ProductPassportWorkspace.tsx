
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { productPassportRepository } from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';
import { DeviceModelsTab } from './workspace/tabs/DeviceModelsTab';
import { InventoryTab } from './workspace/tabs/InventoryTab';
import { PassportWizardTab } from './workspace/tabs/PassportWizardTab';
import { TemplatesTab } from './workspace/tabs/TemplatesTab';



export const ProductPassportWorkspace = () => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'inventory' | 'models' | 'templates'>('wizard');

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

  if (devicesQuery.isLoading || modelsQuery.isLoading || templatesQuery.isLoading) {
    return (
      <section className="passport-wizard">
        <p className="muted">Загрузка данных мастера…</p>
      </section>
    );
  }

  const devices = devicesQuery.data ?? [];
  const models = modelsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  return (
    <div className="passport-workspace">
      <div className="tab-strip">
        <button
          type="button"
          className={activeTab === 'wizard' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('wizard')}
        >
          Мастер паспорта
        </button>
        <button
          type="button"
          className={activeTab === 'inventory' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('inventory')}
        >
          Инвентарь
        </button>
        <button
          type="button"
          className={activeTab === 'models' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('models')}
        >
          Модели изделий
        </button>
        <button
          type="button"
          className={activeTab === 'templates' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('templates')}
        >
          Шаблоны паспортов
        </button>
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
