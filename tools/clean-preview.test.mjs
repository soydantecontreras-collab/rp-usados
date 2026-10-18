import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm, access } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { cleanPreview } from './clean-preview.mjs';
const root = resolve(import.meta.dirname, '..'), base = resolve(root, 'tools/.preview');
test('cleanup refuses workspace root and preview root', async () => {
  await mkdir(base, { recursive: true });
  await assert.rejects(cleanPreview(root), /Only a single child/);
  await assert.rejects(cleanPreview(base), /Only a single child/);
});
test('cleanup never removes a registered live process and defaults to dry-run', async () => {
  const path = await mkdtemp(resolve(base, 'cleanup-test-'));
  assert(!relative(base, path).startsWith('..'));
  try {
    await writeFile(resolve(path, 'runtime.json'), JSON.stringify({ kind: 'rp-usados-owned-preview', pid: process.pid }));
    await assert.rejects(cleanPreview(path, { remove: true }), /alive/);
    await rm(resolve(path, 'runtime.json'));
    assert.equal(await cleanPreview(path), await import('node:fs/promises').then(fs => fs.realpath(path)));
    await access(path);
    await cleanPreview(path, { remove: true });
    await assert.rejects(access(path));
  } finally { await rm(path, { recursive: true, force: true }); }
});
