import type { ConsoleMessage, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { appNavigation } from '../../src/app/navigation';

const routes = appNavigation.flatMap(section =>
  section.items.map(item => ({
    path: item.path,
    title: item.title,
  })),
);

const toHashUrl = (path: string) => {
  if (path.startsWith('/')) {
    return `/#${path}`;
  }
  return `#/${path}`;
};

const ignoredConsolePatterns = ['React Router Future Flag Warning'];

const captureConsole = (page: Page, store: string[]) => {
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() !== 'error' && message.type() !== 'warning') {
      return;
    }
    const text = message.text();
    if (ignoredConsolePatterns.some(pattern => text.includes(pattern))) {
      return;
    }
    store.push(`${message.type()}: ${text}`);
  });
};

test.describe('App shell smoke', () => {
  test('renders layout without console issues', async ({ page }) => {
    const consoleMessages: string[] = [];
    captureConsole(page, consoleMessages);

    await page.goto(toHashUrl('/dashboard'));
    await expect(page.locator('aside.app-shell__sidebar')).toBeVisible();
    await expect(page.locator('header.app-shell__header')).toBeVisible();
    await expect(page.locator('main.app-shell__content')).toBeVisible();

    expect(consoleMessages).toEqual([]);
  });

  test('navigates across primary routes without console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    captureConsole(page, consoleMessages);

    for (const route of routes) {
      await page.goto(toHashUrl(route.path));
      await expect(page.locator('main.app-shell__content')).toBeVisible();
    }

    expect(consoleMessages).toEqual([]);
  });

  test('header widgets open and close', async ({ page }) => {
    const consoleMessages: string[] = [];
    captureConsole(page, consoleMessages);

    await page.goto(toHashUrl('/dashboard'));

    const notificationsButton = page.getByRole('button', { name: /notifications/i });
    await notificationsButton.click();
    const notificationsDialog = page.getByRole('dialog', { name: 'Notifications' });
    await expect(notificationsDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(notificationsDialog).toBeHidden();

    await page.keyboard.press('Control+KeyK');
    const paletteDialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(paletteDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(paletteDialog).toBeHidden();

    expect(consoleMessages).toEqual([]);
  });
});
