import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test/e2e',
  testMatch: '**/webview-demo.spec.ts',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    headless: true,
    video: { mode: 'on', size: { width: 420, height: 900 } },
    viewport: { width: 420, height: 900 },
    screenshot: 'on',
    trace: 'on',
  },
  projects: [{ name: 'demo', use: { ...devices['Desktop Chrome'], viewport: { width: 420, height: 900 } } }],
  outputDir: 'demo-recordings',
});
