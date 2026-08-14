import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist-web', import.meta.url));
const port = Number(process.env.PORT ?? 8084);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.xml': 'image/svg+xml',
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const requestedFile = pathname === '/' ? 'index.html' : pathname.slice(1);
    const resolvedFile = path.resolve(root, path.extname(requestedFile) ? requestedFile : `${requestedFile}.html`);
    const relativeFile = path.relative(root, resolvedFile);
    if (relativeFile.startsWith('..') || path.isAbsolute(relativeFile)) throw new Error('Invalid path');

    const body = await readFile(resolvedFile);
    const contentType = contentTypes[path.extname(resolvedFile)] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Static web export available at http://127.0.0.1:${port}`);
});
