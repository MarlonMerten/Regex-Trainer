const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './app/tests/browser',
  timeout: 20_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'python3 -m http.server 4173 --directory app --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 10_000
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
