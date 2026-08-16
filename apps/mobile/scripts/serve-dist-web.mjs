import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
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

/**
 * Expo exports a dynamic route as a literal `[param].html`. A real static host
 * maps `/paths/djvj` onto it; this dev server has to do the same or every
 * dynamic route 404s.
 */
async function resolveDynamicRoute(requestedFile) {
  const directory = path.resolve(root, path.dirname(requestedFile));
  const relative = path.relative(root, directory);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  const entries = await readdir(directory).catch(() => []);
  const dynamic = entries.find((entry) => /^\[.+\]\.html$/.test(entry));
  return dynamic ? path.join(directory, dynamic) : null;
}

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const requestedFile = pathname === '/' ? 'index.html' : pathname.slice(1);
    const hasExtension = Boolean(path.extname(requestedFile));
    const resolvedFile = path.resolve(root, hasExtension ? requestedFile : `${requestedFile}.html`);
    const relativeFile = path.relative(root, resolvedFile);
    if (relativeFile.startsWith('..') || path.isAbsolute(relativeFile)) throw new Error('Invalid path');

    const body = await readFile(resolvedFile).catch(async (error) => {
      if (hasExtension) throw error;
      const nested = await readFile(path.resolve(root, requestedFile, 'index.html')).catch(() => null);
      if (nested) return nested;
      const dynamic = await resolveDynamicRoute(requestedFile);
      if (!dynamic) throw error;
      return readFile(dynamic);
    });
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
