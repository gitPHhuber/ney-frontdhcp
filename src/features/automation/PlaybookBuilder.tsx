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


type ChatAuthor = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  author: ChatAuthor;
  text: string;
}

const STORAGE_KEY = 'automation:ollamaToken';


export const PlaybookBuilder: React.FC = () => {

  const [ollamaToken, setOllamaToken] = React.useState('');
  const [isTokenVisible, setIsTokenVisible] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = React.useState(false);
  const [draftMessage, setDraftMessage] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'welcome',
      author: 'assistant',
      text: 'Здравствуйте! Я помогу превратить описание в готовый плейбук. Расскажите о задаче или уточните нужные шаги.',
    },
  ]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setOllamaToken(saved);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (ollamaToken) {
      window.localStorage.setItem(STORAGE_KEY, ollamaToken);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [ollamaToken]);

  const handleToggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draftMessage.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      author: 'user',
      text: trimmed,
    };

    setMessages(prev => [...prev, userMessage]);
    setDraftMessage('');
    setIsAssistantTyping(true);

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        author: 'assistant',
        text:
          'Для запуска сценария подготовьте блоки: «Проверка состояния», «Действие» и «Валидация». Я могу подсказать команды, когда модель будет подключена.',
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsAssistantTyping(false);
    }, 750);
  };

  return (
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
        <div className="playbook-builder__token">
          <div className="playbook-builder__token-header">
            <h3>Подключение Ollama</h3>
            <p>
              Вставьте персональный токен, чтобы общаться с локальной моделью. Значение хранится только в браузере и будет
              использоваться для чатов с ассистентом.
            </p>
          </div>
          <label htmlFor="ollama-token" className="playbook-builder__token-label">
            Токен доступа
            <Tooltip
              id="ollama-token-help"
              text="Например: ollama_dev_4f0c3e1f21. Скопируйте токен из настроек Ollama перед вводом."
            />
          </label>
          <div className="playbook-builder__token-input">
            <input
              id="ollama-token"
              name="ollama-token"
              type={isTokenVisible ? 'text' : 'password'}
              value={ollamaToken}
              onChange={event => setOllamaToken(event.target.value)}
              placeholder="ollama_dev_xxxxxxxxxx"
              autoComplete="off"
            />
            <button
              type="button"
              className="ghost"
              onClick={() => setIsTokenVisible(prev => !prev)}
              aria-pressed={isTokenVisible}
            >
              {isTokenVisible ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          <p className="playbook-builder__token-hint">
            Если оставить поле пустым, обращение к модели будет недоступно. Токен можно заменить в любой момент.
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
      <div className="playbook-builder__chat-launcher">
        <button
          type="button"
          className="primary"
          aria-haspopup="dialog"
          aria-expanded={isChatOpen}
          onClick={handleToggleChat}
        >
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path
              d="M4.5 4h15a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19.5 16H15l-3 3-3-3H4.5A1.5 1.5 0 0 1 3 14.5v-9A1.5 1.5 0 0 1 4.5 4Z"
              fill="currentColor"
            />
          </svg>
          <span>{isChatOpen ? 'Скрыть чат' : 'Открыть чат'}</span>
        </button>
        <Tooltip
          id="assistant-launch"
          text="Откройте чат, чтобы подготовить шаги плейбука совместно с локальной моделью Ollama."
          className="playbook-builder__chat-tooltip"
        />
      </div>
      {isChatOpen && (
        <div role="dialog" aria-label="Чат с ассистентом" className="playbook-builder__chat">
          <header>
            <div>
              <strong>Ассистент Ollama</strong>
              <span className="muted">GPTOS 20B (локальная модель)</span>
            </div>
            <button type="button" className="ghost" onClick={handleToggleChat}>
              Закрыть
            </button>
          </header>
          <div className="playbook-builder__chat-log">
            {messages.map(message => (
              <div
                key={message.id}
                className={`playbook-builder__chat-message playbook-builder__chat-message--${message.author}`}
              >
                <span>{message.text}</span>
              </div>
            ))}
            {isAssistantTyping && (
              <div className="playbook-builder__chat-message playbook-builder__chat-message--assistant playbook-builder__chat-message--typing">
                <span>Ассистент печатает…</span>
              </div>
            )}
          </div>
          <form className="playbook-builder__chat-form" onSubmit={handleSendMessage}>
            <label htmlFor="assistant-message" className="sr-only">
              Сообщение для ассистента
            </label>
            <textarea
              id="assistant-message"
              name="assistant-message"
              value={draftMessage}
              onChange={event => setDraftMessage(event.target.value)}
              placeholder="Опишите задачу или запросите подсказку по шагам плейбука."
            />
            <button type="submit" className="primary">
              Отправить
            </button>
          </form>
        </div>
      )}
    </section>
  );
};


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

