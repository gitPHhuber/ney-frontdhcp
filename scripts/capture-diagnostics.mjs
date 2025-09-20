import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const routes = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'inventory', label: 'Inventory' },
  { path: 'topology', label: 'Topology' },
  { path: 'alerts', label: 'Alerts' },
  { path: 'incidents', label: 'Incidents' },
  { path: 'reports/builder', label: 'Reports Builder' },
  { path: 'executive-dashboard', label: 'Executive Dashboard' },
  { path: 'automation', label: 'Automation' },
  { path: 'product-passports', label: 'Product Passports' },
  { path: 'settings', label: 'Settings' },
  { path: 'navigation-check', label: 'Navigation Check' },
];

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';

const logLines = [];

const browser = await chromium.launch();
const page = await browser.newPage();

const record = label => {
  const consoleMessages = [];
  const networkIssues = [];

  const onConsole = msg => {
    if (msg.type() === 'warning' || msg.type() === 'error') {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    }
  };
  const onResponse = response => {
    if (response.status() >= 400) {
      networkIssues.push(`${response.status()} ${response.url()}`);
    }
  };

  page.on('console', onConsole);
  page.on('response', onResponse);

  return () => {
    page.off('console', onConsole);
    page.off('response', onResponse);
    logLines.push(`## ${label}`);
    if (consoleMessages.length) {
      logLines.push('Console:');
      logLines.push(...consoleMessages);
    } else {
      logLines.push('Console: <none>');
    }
    if (networkIssues.length) {
      logLines.push('Network issues:');
      logLines.push(...networkIssues);
    } else {
      logLines.push('Network issues: <none>');
    }
    logLines.push('');
  };
};

for (const route of routes) {
  const finish = record(route.label);
  await page.goto(`${baseUrl}/#/${route.path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  finish();
}


await browser.close();

await writeFile('docs/diagnostics/route-diagnostics.md', logLines.join('\n'), 'utf8');
