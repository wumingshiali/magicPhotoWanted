import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'dist', 'index.html');
const destination = path.join(
    root,
    'openharmony',
    'entry',
    'src',
    'main',
    'resources',
    'rawfile',
    'index.html'
);

await mkdir(path.dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log(`OpenHarmony page written to ${path.relative(root, destination)}`);
