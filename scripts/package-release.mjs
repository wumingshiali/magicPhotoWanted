import { access, copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(root, 'release');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const arch = process.arch === 'x64' ? 'x64' : process.arch;

async function exists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function findFile(directory, extension) {
    if (!(await exists(directory))) return null;
    const entries = await readdir(directory, { withFileTypes: true });
    const match = entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension.toLowerCase()))
        .map((entry) => path.join(directory, entry.name))
        .sort()[0];
    return match || null;
}

async function findAllRecursive(directory, extension, results = []) {
    if (!(await exists(directory))) return results;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            await findAllRecursive(entryPath, extension, results);
        } else if (entry.name.toLowerCase().endsWith(extension.toLowerCase())) {
            results.push(entryPath);
        }
    }
    return results;
}

const target = path.join(root, 'src-tauri', 'target', 'release');
const artifacts = [];

if (process.platform === 'win32') {
    artifacts.push(
        [path.join(target, 'magic-photo.exe'), `MagicPhoto-${version}-portable.exe`],
        [await findFile(path.join(target, 'bundle', 'nsis'), '.exe'), `MagicPhoto-${version}-setup.exe`]
    );
} else if (process.platform === 'darwin') {
    artifacts.push(
        [await findFile(path.join(target, 'bundle', 'dmg'), '.dmg'), `MagicPhoto-${version}-macOS-${arch}.dmg`]
    );
} else {
    artifacts.push(
        [await findFile(path.join(target, 'bundle', 'appimage'), '.AppImage'), `MagicPhoto-${version}-Linux-${arch}.AppImage`],
        [await findFile(path.join(target, 'bundle', 'deb'), '.deb'), `MagicPhoto-${version}-Linux-${arch}.deb`]
    );
}

const apkOutputs = path.join(root, 'src-tauri', 'gen', 'android', 'app', 'build', 'outputs', 'apk');
const apks = (await findAllRecursive(apkOutputs, '.apk'))
    .filter((file) => !file.toLowerCase().endsWith('-unsigned.apk'));
const androidApk = apks.find((file) => /[\\/]release[\\/]/.test(file))
    ?? apks.find((file) => /[\\/]debug[\\/]/.test(file))
    ?? apks[0]
    ?? null;
if (androidApk) {
    const buildKind = androidApk.replaceAll('\\', '/').includes('/debug/') ? '-debug' : '';
    artifacts.push([androidApk, `MagicPhoto-${version}-Android${buildKind}.apk`]);
}

artifacts.push(
    [path.join(root, 'dist', 'index.html'), 'MagicPhoto-Offline.html'],
    [path.join(root, 'docs', '使用说明.md'), '使用说明.md']
);

await mkdir(releaseDir, { recursive: true });

const hashes = [];
for (const [source, name] of artifacts) {
    if (!source) {
        console.warn(`skip ${name}: no matching build artifact`);
        continue;
    }
    const sourceStat = await stat(source).catch(() => null);
    if (!sourceStat) {
        console.warn(`skip ${name}: ${path.relative(root, source)} not found`);
        continue;
    }
    const targetPath = path.join(releaseDir, name);
    await copyFile(source, targetPath);
    const digest = createHash('sha256').update(await readFile(targetPath)).digest('hex');
    hashes.push(`${digest}  ${name}`);
    console.log(`packaged ${name}`);
}

await writeFile(path.join(releaseDir, 'SHA256SUMS.txt'), `${hashes.join('\n')}\n`, 'utf8');
console.log(`\nRelease ${version} is ready in ${releaseDir}`);
