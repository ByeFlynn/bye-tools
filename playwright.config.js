import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    },
  },
  projects: [
    { name: '桌面端', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: '移动端', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run dev -- --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
