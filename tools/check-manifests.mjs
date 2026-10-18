import { readFile, access } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = resolve(import.meta.dirname, '..');
export const builds = [
  { directory: 'theme/rp-usados/assets/dist', entries: ['src/scripts/main.js', 'src/scripts/admin.js'] },
  { directory: 'plugins/rp-usados-security/assets/dist', entries: ['src/main.js'] },
];
export async function manifestFiles(build) {
  const directory = resolve(root, build.directory), path = resolve(directory, '.vite/manifest.json');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  for (const key of build.entries) if (!manifest[key]?.isEntry || !manifest[key]?.file || !manifest[key]?.css?.length && !key.includes('admin')) throw new Error(`${build.directory}: missing CSS/JS entry ${key}. Run pnpm build.`);
  const files = new Set(['.vite/manifest.json']);
  for (const [key, entry] of Object.entries(manifest)) {
    for (const imported of [...entry.imports || [], ...entry.dynamicImports || []]) if (!manifest[imported]) throw new Error(`Manifest ${key}: unknown import ${imported}`);
    for (const value of [entry.file, ...entry.css || [], ...entry.assets || []]) {
      if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') || value.split('/').includes('..')) throw new Error(`Unsafe manifest path: ${value}`);
      const local = resolve(directory, value), escaped = relative(directory, local);
      if (escaped.startsWith('..') || isAbsolute(escaped)) throw new Error(`Manifest escapes build directory: ${value}`);
      await access(local); files.add(value);
    }
  }
  return [...files].sort();
}
export async function checkManifests() {
  const result = [];
  for (const build of builds) result.push({ ...build, files: await manifestFiles(build) });
  console.log(`Vite manifests: ${result.length} builds; ${result.reduce((sum, item) => sum + item.files.length, 0)} referenced files present.`);
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await checkManifests();
