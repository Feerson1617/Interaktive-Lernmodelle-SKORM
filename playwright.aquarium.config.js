import config from './playwright.smoke.config.js';
export default {...config, testDir:'tests/aquarium', workers:1, timeout:300000,
  outputDir:'test-results/aquarium', reporter:[['list'],['json',{outputFile:'test-results/aquarium.json'}]]};
