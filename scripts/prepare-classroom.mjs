import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
mkdirSync('.build', { recursive: true });
writeFileSync('.build/classroom.json', JSON.stringify({ name: 'Flüchtiges Referenzmodell', description: 'Anwendungseigener Speicheradapter', entry: 'pages/start.html', sourceDir: '../examples/webgl', output: 'Unterricht-SCORM-1.2.zip', classroomMode: true, classroomAdapter: 'modules/classroom.js' }));
execFileSync('node', ['scripts/build.mjs', '.build/classroom.json'], { stdio: 'inherit' });
