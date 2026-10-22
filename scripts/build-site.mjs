import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = path.join(root, 'site');
const html = await readFile(path.join(root, 'index.html'), 'utf8');

const styles = [...html.matchAll(/href="\.\/assets\/winui\/([^"]+\.css)"/g)];
if (styles.length === 0) {
    throw new Error('No local WinUI stylesheet links were found in index.html.');
}

await rm(siteDir, { recursive: true, force: true });
await mkdir(path.join(siteDir, 'assets', 'winui'), { recursive: true });
await copyFile(path.join(root, 'index.html'), path.join(siteDir, 'index.html'));

for (const [, fileName] of styles) {
    await copyFile(
        path.join(root, 'assets', 'winui', fileName),
        path.join(siteDir, 'assets', 'winui', fileName)
    );
}

await writeFile(path.join(siteDir, '.nojekyll'), '');
console.log(`Website written to ${path.join('site', 'index.html')} with ${styles.length} network-loaded stylesheets.`);
