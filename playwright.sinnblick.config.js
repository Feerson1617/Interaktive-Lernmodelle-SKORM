import config from './playwright.config.js';
export default {
  ...config,
  testDir: 'tests/sinnblick',
  timeout: 240_000,
  workers: 1,
  outputDir: 'test-results/sinnblick',
  reporter: [['list'], ['json', { outputFile: 'test-results/sinnblick.json' }]],
  use: { ...config.use, hasTouch: true, actionTimeout: 15_000 },
  webServer: {
    command: 'node scripts/serve-selected.mjs',
    env: { SCORM_ZIP: process.env.SCORM_ZIP || 'dist/Sinnblick-SCORM-1.2.zip' },
    url: 'http://127.0.0.1:4185/player.html'
  }
};
