import React from 'react';
import { Tooltip } from '../../shared/ui/Tooltip';

const DEVICE_GROUPS = [
  {
    id: 'workstations',
    title: 'Рабочие станции сотрудников',
    description: 'Для выборочного раскатывания сценариев на клиентских устройствах и проверки поведения агентов.',
    devices: [
      { id: 'ws-01', name: 'WS-Lenovo-23', apiUrl: 'https://api.netgrip.local/devices/ws/lenovo-23' },
      { id: 'ws-02', name: 'WS-ThinkPad-42', apiUrl: 'https://api.netgrip.local/devices/ws/thinkpad-42' },
    ],
  },
  {
    id: 'servers',
    title: 'Сервера для тестирования',
    description: 'Используйте для прогонов на стендах перед тем, как отправиться в боевой контур.',
    devices: [
      { id: 'srv-qa-01', name: 'QA-DHCP-Lab', apiUrl: 'https://api.netgrip.local/devices/qa/dhcp-lab' },
      { id: 'srv-qa-02', name: 'QA-Network-Hub', apiUrl: 'https://api.netgrip.local/devices/qa/network-hub' },
    ],
  },
  {
    id: 'network',
    title: 'Сетевое оборудование для тестирования',
    description: 'Маршрутизаторы и коммутаторы в пилотном сегменте для проверки действий над инфраструктурой.',
    devices: [
      { id: 'net-r01', name: 'RTR-LAB-CORE', apiUrl: 'https://api.netgrip.local/devices/net/rtr-lab-core' },
      { id: 'net-sw01', name: 'SW-EDGE-LAB', apiUrl: 'https://api.netgrip.local/devices/net/sw-edge-lab' },
    ],
  },
];

export const PlaybookBuilder: React.FC = () => (
  <section className="playbook-builder">
    <header className="playbook-builder__header">
      <div>
        <h2>Конструктор плейбуков</h2>
        <p className="muted">
          Пользователи с правами «Автоматизация.Редактор» могут собирать сценарии, запускать пробные прогоны и назначать
          цели раскатки.
        </p>
      </div>
      <div className="playbook-builder__permissions">
        <span className="status-badge status-warning">Требуются расширенные права</span>
        <p>
          Проверьте, что у вас есть роль с доступом к управлению плейбуками. Все действия будут записаны в журнал аудита.
        </p>
      </div>
    </header>
    <form className="playbook-builder__form">
      <div className="playbook-builder__field-group">
        <label htmlFor="playbook-name">Название плейбука</label>
        <input id="playbook-name" name="playbook-name" placeholder="Например, Перезапуск DHCP в филиалах" />
      </div>
      <div className="playbook-builder__field-group">
        <label htmlFor="playbook-scope">Область применения</label>
        <select id="playbook-scope" name="playbook-scope" defaultValue="">
          <option value="" disabled>
            Выберите область
          </option>
          <option value="dhcp">DHCP и IPAM</option>
          <option value="network">Сетевые устройства</option>
          <option value="security">Сценарии безопасности</option>
        </select>
      </div>
      <div className="playbook-builder__field-group playbook-builder__field-group--full">
        <label htmlFor="playbook-goal">Цель и ожидаемый результат</label>
        <textarea
          id="playbook-goal"
          name="playbook-goal"
          placeholder="Опишите проблему, гипотезу и критерии успеха сценария."
        />
      </div>
      <div className="playbook-builder__field-group playbook-builder__field-group--full">
        <label htmlFor="playbook-steps">Ключевые шаги</label>
        <textarea
          id="playbook-steps"
          name="playbook-steps"
          placeholder="Добавьте последовательность шагов, команды и параметры, которые нужно выполнить."
        />
      </div>
      <div className="playbook-builder__assistant">
        <span>Скоро</span>
        <h3>AI-ассистент Ollama GPTOS 20B</h3>
        <p>
          В следующих релизах появится чат-ассистент, который на базе локальной языковой модели поможет формулировать шаги
          плейбуков, подскажет команды и проверит риски перед запуском.
        </p>
      </div>
      <div className="playbook-builder__targets">
        <div>
          <h3>Выбор устройств для раскатки</h3>
          <p className="muted">Отметьте, где должен выполняться сценарий, и сверяйте API-адреса перед боевым запуском.</p>
        </div>
        <div className="playbook-builder__target-grid">
          {DEVICE_GROUPS.map(group => (
            <article key={group.id} className="playbook-builder__target-card">
              <header>
                <strong>{group.title}</strong>
                <p>{group.description}</p>
              </header>
              <div className="playbook-builder__device-list">
                {group.devices.map(device => (
                  <label key={device.id} className="playbook-builder__device">
                    <span>
                      <input type="checkbox" name="playbook-targets" value={device.id} />
                      {device.name}
                    </span>
                    <small>{device.apiUrl}</small>
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="playbook-builder__actions">
        <p>Действия доступны только пользователям с подтверждёнными правами. Подсказки помогут выбрать правильный шаг.</p>
        <div className="playbook-builder__actions-row">
          <div className="playbook-builder__action">
            <button type="button" className="secondary">
              Сохранить черновик
            </button>
            <Tooltip id="action-draft" text="Сохраняет текущие шаги без запуска. Черновик доступен редакторам плейбуков." />
          </div>
          <div className="playbook-builder__action">
            <button type="button" className="primary">
              Опубликовать
            </button>
            <Tooltip
              id="action-publish"
              text="Делает плейбук доступным для команды и запуска. Перед публикацией убедитесь, что указаны цели и аудит."
            />
          </div>
          <div className="playbook-builder__action">
            <button type="button" className="ghost">
              Назначить исполнителей
            </button>
            <Tooltip
              id="action-assignees"
              text="Выберите операторов, которые смогут запускать сценарий. Их права будут проверены автоматически."
            />
          </div>
        </div>
      </div>
    </form>
  </section>
);
