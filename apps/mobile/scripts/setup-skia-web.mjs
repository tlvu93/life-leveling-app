import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../node_modules/canvaskit-wasm/bin/full/canvaskit.wasm', import.meta.url));
const publicDirectory = fileURLToPath(new URL('../public', import.meta.url));
const destination = fileURLToPath(new URL('../public/canvaskit.wasm', import.meta.url));

await mkdir(publicDirectory, { recursive: true });
await copyFile(source, destination);
console.log('CanvasKit web runtime is ready.');
