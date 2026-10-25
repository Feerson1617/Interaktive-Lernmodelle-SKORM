import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir: 'tests/browser', timeout: 60_000, expect: { timeout: 15_000 },
  workers: 2, retries: 0, fullyParallel: true,
  outputDir: 'test-results/browser',
  reporter: [['list'], ['json', { outputFile: 'test-results/browser.json' }]],
  use: { ignoreHTTPSErrors: true, viewport: { width: 1024, height: 768 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox', '--enable-unsafe-swiftshader'] } } },
    ...(process.env.TEST_WEBKIT ? [{ name: 'webkit', use: { browserName: 'webkit' } }] : [])
  ],
  webServer: [
    { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4181/player.html' },
    { command: 'node scripts/prepare-classroom.mjs && node scripts/serve.mjs --classroom', url: 'http://127.0.0.1:4183/player.html' }
  ]
});
