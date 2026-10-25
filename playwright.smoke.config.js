import config from './playwright.config.js';
export default {
  ...config,
  testDir: 'tests/smoke',
  outputDir: 'test-results/smoke',
  reporter: [['list'], ['json', { outputFile: 'test-results/smoke.json' }]],
  webServer: { command: 'node scripts/serve-selected.mjs', url: 'http://127.0.0.1:4185/player.html' }
};
