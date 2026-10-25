import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const config = resolve(process.argv[2] || 'scorm.config.json');
const { outputFiles } = await build({ entryPoints: [root + 'runtime/entry.js'], bundle: true, format: 'iife', target: ['es2020'], minify: true, write: false });
execFileSync('python3', [root + 'scripts/build.py', config], { input: outputFiles[0].text, stdio: ['pipe', 'inherit', 'inherit'] });
