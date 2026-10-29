#!/usr/bin/env node
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.join(REPO, 'dist');
const PORT = Number(process.env.PORT) || 8000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'
};

function build() {
  spawnSync(process.execPath, [path.join(REPO, 'engine', 'build.js')], { stdio: 'inherit' });
}
build();

let timer;
for (const d of ['content', 'theme', 'public', 'engine/build.js']) {
  fs.watch(path.join(REPO, d), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(build, 200); });
}

http.createServer((req, rsp) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, p);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { rsp.writeHead(404); return rsp.end('not found'); }
  rsp.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(file).pipe(rsp);
}).listen(PORT, () => console.log(`\nPreview: http://localhost:${PORT}   (rebuilds on change, Ctrl-C to stop)`));
