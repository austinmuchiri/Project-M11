// Tiny static server for the presentation + linked apps in one origin so
// iframes can co-render the watch simulator + caregiver app + tray popup.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.dirname(__dirname);
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.jsx':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

const ROUTES = {
  '/':                    'presentation/index.html',
  '/watch':               'timekeeper/apps/watch-simulator/index.html',
  '/watch/simulator.jsx': 'timekeeper/apps/watch-simulator/simulator.jsx',
  '/laptop-popup':        'timekeeper/apps/laptop-monitor/src/tray-popup/index.html',
  '/laptop-lock':         'timekeeper/apps/laptop-monitor/src/lockscreen/index.html',
};

http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  let rel = ROUTES[url];
  if (!rel) {
    // Pass through to filesystem under ROOT (e.g., /timekeeper/...)
    rel = url.startsWith('/') ? url.slice(1) : url;
  }
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found: ' + url); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`presentation → ${url}`);
  console.log(`  / → deck`);
  console.log(`  /watch → watch simulator`);
  console.log(`  /laptop-popup → tray popup preview`);
  console.log(`  /laptop-lock → focus-lock preview`);
  if (process.platform === 'win32') spawn('cmd', ['/c', 'start', url], { detached: true });
  else if (process.platform === 'darwin') spawn('open', [url], { detached: true });
});
