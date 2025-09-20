/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Accordion, AccordionItem } from '../components/ui/Accordion';

function HelpPage() {
    return (
        <div>
            <header className="page-header">
                <h1>Справка и ответы на вопросы</h1>
            </header>
            <Accordion>
                <AccordionItem title="Как подключиться к DHCP-серверу?">
                    <p>
                        Откройте раздел «Настройки» и укажите IP-адрес сервера в соответствующем поле. После сохранения
                        система попытается установить соединение. Если адрес введён неверно, вы увидите сообщение об
                        ошибке.
                    </p>
                </AccordionItem>
                <AccordionItem title="Можно ли изменить визуальную тему?">
                    <p>
                        Да. В разделе «Настройки» выберите предпочтительную тему интерфейса — тёмную, светлую или
                        системную. После выбора нажмите «Сохранить оформление», чтобы изменения вступили в силу.
                    </p>
                </AccordionItem>
                <AccordionItem title="Где управлять доступом пользователей?">
                    <p>
                        Управление пользователями и ролями вынесено в отдельный раздел. Перейдите в меню «Центр
                        доступа», чтобы просмотреть запросы, назначить роли и изучить журнал действий.
                    </p>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

export default HelpPage;
