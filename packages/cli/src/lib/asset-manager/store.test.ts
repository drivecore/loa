import { chmod, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { materialize, storePath } from './store.ts';

vi.mock('node:os', async (original) => ({ ...(await original<typeof import('node:os')>()), platform: () => 'win32' }));
vi.mock('node:fs/promises', async (original) => {
  const fs = await original<typeof import('node:fs/promises')>();
  return { ...fs, rename: vi.fn(fs.rename) };
});
const roots: string[] = [];
afterEach(async () => {
  vi.mocked(rename).mockClear();
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Windows native materialization', () => {
  it('replaces a read-only destination without changing source bytes or source permissions', async () => {
    const root = await mkdtemp(join(tmpdir(), 'loa-win-replace-'));
    roots.push(root);
    const source = join(root, 'source');
    const destination = join(root, 'destination');
    await writeFile(source, 'new native bytes');
    await chmod(source, 0o444);
    await writeFile(destination, 'old native bytes');
    await chmod(destination, 0o444);
    vi.mocked(rename).mockRejectedValueOnce(Object.assign(new Error('Read-only destination'), { code: 'EPERM' }));
    await materialize(source, destination);
    expect(await readFile(destination, 'utf8')).toBe('new native bytes');
    expect(await readFile(source, 'utf8')).toBe('new native bytes');
    expect((await stat(source)).mode & 0o222).toBe(0);
    expect(await readdir(root)).toEqual(['destination', 'source']);
  });
  it('preserves the existing destination if replacement fails for an unrelated reason', async () => {
    const root = await mkdtemp(join(tmpdir(), 'loa-win-failure-'));
    roots.push(root);
    const source = join(root, 'source');
    const destination = join(root, 'destination');
    await writeFile(source, 'new');
    await writeFile(destination, 'old');
    vi.mocked(rename).mockRejectedValueOnce(Object.assign(new Error('Disk failure'), { code: 'EIO' }));
    await expect(materialize(source, destination)).rejects.toThrow('Disk failure');
    expect(await readFile(destination, 'utf8')).toBe('old');
    expect(await readdir(root)).toEqual(['destination', 'source']);
  });
  it('respects the explicit store override and Windows local cache default', () => {
    expect(storePath({ LOA_STORE_DIR: '/explicit/store' })).toContain('explicit/store');
    expect(storePath({ LOCALAPPDATA: '/local-appdata' })).toBe('/local-appdata/loa/Cache');
  });
});
