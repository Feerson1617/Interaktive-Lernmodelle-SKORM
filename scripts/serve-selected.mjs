import { resolve } from 'node:path';
import { servePackage } from './serve.mjs';
servePackage({ zip: resolve(process.env.SCORM_ZIP || 'dist/Beispiel-SCORM-1.2.zip'), port: 4185, httpsPort: 4186 });
