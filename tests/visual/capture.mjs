import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const outputDirectory = 'test-results/visual';
await mkdir(outputDirectory, { recursive: true });

for (const viewport of [
  { name: 'desktop-dark', width: 1440, height: 900, theme: 'dark' },
  { name: 'desktop-light', width: 1440, height: 900, theme: 'light' },
  { name: 'tablet', width: 780, height: 831, theme: 'dark' },
  { name: 'mobile', width: 390, height: 844, theme: 'dark' },
]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173');
  if (viewport.theme === 'light') {
    await page.locator('.topbar [data-action="settings"]').click();
    await page.locator('[data-theme-choice="light"]').click();
    await page.locator('.settings-close').click();
    await page.waitForTimeout(2200);
  }
  await page.screenshot({ path: `${outputDirectory}/${viewport.name}.png`, fullPage: true });
  await context.close();
}

const workspaceContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const workspacePage = await workspaceContext.newPage();
await workspacePage.goto('http://127.0.0.1:4173/#/tool/json');
await workspacePage.locator('#json-workbench').waitFor({ state: 'visible' });
await workspacePage.screenshot({ path: `${outputDirectory}/json-workspace.png`, fullPage: true });
await workspacePage.setViewportSize({ width: 390, height: 844 });
await workspacePage.goto('http://127.0.0.1:4173/#/tool/aes');
await workspacePage.locator('.crypto-workbench').waitFor({ state: 'visible' });
await workspacePage.waitForTimeout(400);
await workspacePage.screenshot({ path: `${outputDirectory}/aes-mobile.png`, fullPage: true });
await workspaceContext.close();

await browser.close();
