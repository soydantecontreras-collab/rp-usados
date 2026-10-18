import { readFile, readdir, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { resolve, extname } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { root, builds, manifestFiles } from './check-manifests.mjs';
const require = createRequire(resolve(root, 'theme/rp-usados/package.json'));
const archiver = require('archiver');
export const fixedDate = new Date('2000-01-01T00:00:00Z');
export async function shippingFiles(pkg) {
  const files = [...pkg.files];
  async function walk(path, extensions) {
    for (const entry of await readdir(resolve(root, pkg.directory, path), { withFileTypes: true })) {
      const name = `${path}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in release: ${name}`);
      if (entry.isDirectory()) await walk(name, extensions);
      else if (extensions.includes(extname(entry.name))) files.push(name);
    }
  }
  for (const directory of pkg.directories) await walk(directory.name, directory.extensions);
  for (const file of await manifestFiles(builds.find(build => build.directory === pkg.build))) files.push(`assets/dist/${file}`);
  return [...new Set(files)].sort();
}
export async function writePackage(pkg, target) {
  await mkdir(resolve(target, '..'), { recursive: true });
  const output = createWriteStream(target), archive = archiver('zip', { zlib: { level: 9 }, forceLocalTime: false });
  const done = new Promise((complete, reject) => { output.once('close', complete); output.once('error', reject); archive.once('error', reject); archive.once('warning', reject); });
  archive.pipe(output);
  const files = await shippingFiles(pkg);
  for (const file of files) archive.append(await readFile(resolve(root, pkg.directory, file)), { name: `${pkg.name}/${file}`, date: fixedDate, mode: 0o100644 });
  await archive.finalize(); await done;
  const bytes = await readFile(target);
  return { package: pkg.name, file: target, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), files };
}
/** Inflate every central-directory entry; truncated ZIPs cannot pass a listing-only check. */
export function zipEntries(bytes) {
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) if (bytes.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
  if (end < 0 || end + 22 + bytes.readUInt16LE(end + 20) !== bytes.length) throw new Error('Invalid ZIP trailer.');
  const entries = [], count = bytes.readUInt16LE(end + 10); let offset = bytes.readUInt32LE(end + 16);
  for (let index = 0; index < count; index++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid ZIP central directory.');
    const compressedSize = bytes.readUInt32LE(offset + 20), size = bytes.readUInt32LE(offset + 24), nameSize = bytes.readUInt16LE(offset + 28), extraSize = bytes.readUInt16LE(offset + 30), commentSize = bytes.readUInt16LE(offset + 32);
    const name = bytes.toString('utf8', offset + 46, offset + 46 + nameSize), local = bytes.readUInt32LE(offset + 42), method = bytes.readUInt16LE(offset + 10);
    if (bytes.readUInt32LE(local) !== 0x04034b50) throw new Error(`Invalid local ZIP entry: ${name}`);
    const contentStart = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28), compressed = bytes.subarray(contentStart, contentStart + compressedSize);
    const content = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : null;
    if (!content || content.length !== size) throw new Error(`Corrupt ZIP payload: ${name}`);
    entries.push({ name, content, time: bytes.readUInt16LE(offset + 12), date: bytes.readUInt16LE(offset + 14) });
    offset += 46 + nameSize + extraSize + commentSize;
  }
  if (offset !== end) throw new Error('ZIP directory size mismatch.');
  return entries;
}
export async function verifyPackage(pkg, target) {
  const expected = await shippingFiles(pkg), entries = zipEntries(await readFile(target));
  if (JSON.stringify(entries.map(entry => entry.name)) !== JSON.stringify(expected.map(file => `${pkg.name}/${file}`))) throw new Error(`${pkg.name}: ZIP contents differ from shipping allowlist.`);
  for (const entry of entries) {
    if (entry.time !== 0 || entry.date !== 10273) throw new Error(`Non-reproducible timestamp in ${entry.name}`);
    const source = await readFile(resolve(root, pkg.directory, entry.name.slice(pkg.name.length + 1)));
    if (!entry.content.equals(source)) throw new Error(`ZIP differs from source: ${entry.name}`);
  }
  return entries.length;
}
