import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4174', headless: true, permissions: ['clipboard-read', 'clipboard-write'] },
  webServer: {
    command: 'npm run dev -- --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
  },
});
