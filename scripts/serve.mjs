// Test infrastructure only. Serve extracted, validated ZIPs at a nested LMS path.
import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer } from 'node:https';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
export function servePackage({ zip = root + 'dist/Beispiel-SCORM-1.2.zip', port = 4181, httpsPort = 4182, player = root + 'tests/player', secondHttpsPort } = {}) {
  const served = root + `.build/served-${port}`;
  rmSync(served, { recursive: true, force: true }); mkdirSync(served, { recursive: true });
  execFileSync('python3', [root + 'scripts/validate.py', zip, '--extract', served], { stdio: 'ignore' });
  const info = JSON.parse(readFileSync(served + '/__scorm/package-info.json', 'utf8'));
  const tlsDir = root + `.build/tls-${port}`; mkdirSync(tlsDir, { recursive: true });
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1', '-keyout', tlsDir + '/key.pem', '-out', tlsDir + '/cert.pem'], { stdio: 'ignore' });
  const tls = { key: readFileSync(tlsDir + '/key.pem'), cert: readFileSync(tlsDir + '/cert.pem') };
  const prefix = '/lms/course/content/';
  function respond(req, res) {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      res.setHeader('Cache-Control', 'no-store');
      if (path === '/package-config.json') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ launch: prefix + info.launch })); return; }
      const inPackage = path.startsWith(prefix);
      const directory = resolve(inPackage ? served : player);
      const file = resolve(directory, inPackage ? path.slice(prefix.length) : '.' + path);
      if (!file.startsWith(directory + '/')) throw new Error('Invalid path');
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary' })[extname(file)] || 'application/octet-stream');
      res.end(readFileSync(file));
    } catch { res.writeHead(404); res.end('Not found'); }
  }
  httpServer(respond).listen(port, '127.0.0.1');
  for (const securePort of [httpsPort, secondHttpsPort].filter(Boolean)) httpsServer(tls, respond).listen(securePort, '127.0.0.1');
  console.log(`Validated package available via HTTP ${port}, HTTPS ${httpsPort}`);
}
if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  servePackage(process.argv.includes('--classroom') ? { zip: root + 'dist/Unterricht-SCORM-1.2.zip', port: 4183, httpsPort: 4184 } : {});
}
