import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const distDir = path.join(root, 'dist');

const escapeStyle = (css) => css.replace(/<\/style/gi, '<\\/style');

let html = await readFile(htmlPath, 'utf8');
const linkedStyles = [...html.matchAll(/[ \t]*<link\b[^>]*href="\.\/assets\/winui\/([^"]+\.css)"[^>]*>[ \t]*\r?\n?/gi)];

if (linkedStyles.length === 0) {
    throw new Error('No local WinUI stylesheet links were found in index.html.');
}

for (const match of linkedStyles) {
    const css = await readFile(path.join(root, 'assets', 'winui', match[1]), 'utf8');
    const styleBlock = `    <style data-source="assets/winui/${match[1]}">\n${escapeStyle(css)}\n    </style>\n`;
    html = html.replace(match[0], styleBlock);
}

if (/<link\b[^>]*href="https?:\/\//i.test(html) || /<script\b[^>]*src="https?:\/\//i.test(html)) {
    throw new Error('The generated page still references a remote resource.');
}

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, 'index.html'), html, 'utf8');

console.log(`Offline page written to ${path.join('dist', 'index.html')} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB).`);
