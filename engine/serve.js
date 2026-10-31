const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const port = Number(process.env.PORT) || 8000;

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'
};

const build = () => spawnSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
build();

let timer;
for (const dir of ['content', 'theme', 'public', 'engine']) {
  fs.watch(path.join(root, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
}

http.createServer((request, response) => {
  let urlPath = decodeURIComponent(request.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(distDir, urlPath);
  const missing = !file.startsWith(distDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory();
  if (missing) {
    response.writeHead(404, { 'Content-Type': types['.html'] });
    return response.end(fs.readFileSync(path.join(distDir, '404.html')));
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(port, () => console.log(`http://localhost:${port}`));
