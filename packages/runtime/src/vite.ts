import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { buildResolution, liveAssetUrl, nativeHashHex, parseLockfile, relativeAssetPath } from './node.js';
import type { LockedAsset, Lockfile, ResolveMode } from './types.js';
import type { Plugin } from 'vite';

export type LoaPluginOptions = {
  /** Default: remote. Local mode requires loa pull for native and URL sources. */
  mode?: ResolveMode;
  /** Project root; defaults to Vite's root. */
  root?: string;
  /** Lockfile path relative to root. Default: loa-lock.json. */
  lockfile?: string;
};
const virtualId = '\0virtual:loa';

function localPath(root: string, directory: string, entry: LockedAsset): string {
  return entry.kind === 'file' ? resolve(root, directory, entry.path) : resolve(root, relativeAssetPath(entry));
}
async function readAsset(path: string, entry: LockedAsset): Promise<Buffer> {
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    throw new Error(`Cannot read LoA asset ${path}${entry.kind === 'file' ? '' : '; run loa pull first'}`, {
      cause: error,
    });
  }
  if (entry.kind === 'loa' && createHash('sha256').update(bytes).digest('hex') !== nativeHashHex(entry.hash)) {
    throw new Error(`LoA asset integrity mismatch: ${path}; run loa pull to repair it`);
  }
  return bytes;
}
function mimeType(path: string): string {
  const types: Record<string, string> = {
    '.glb': 'model/gltf-binary',
    '.zip': 'application/zip',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ktx2': 'image/ktx2',
    '.hdr': 'image/vnd.radiance',
    '.exr': 'image/x-exr',
    '.ies': 'text/plain',
    '.mtlx': 'application/xml',
  };
  return types[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

/** Vite plugin. virtual:loa exports the complete synchronous alias-to-URL map. */
export function loa(options: LoaPluginOptions = {}): Plugin {
  const mode = options.mode ?? 'remote';
  if (mode !== 'remote' && mode !== 'local') throw new Error('Expected remote or local LoA mode');
  let root = resolve(options.root ?? '.');
  let lockPath = resolve(root, options.lockfile ?? 'loa-lock.json');
  let base = '/';
  let building = false;
  const readLock = async (): Promise<Lockfile> => parseLockfile(JSON.parse(await readFile(lockPath, 'utf8')));
  return {
    name: 'loa-assets',
    enforce: 'pre' as const,
    configResolved(config) {
      root = resolve(options.root ?? config.root);
      lockPath = resolve(root, options.lockfile ?? 'loa-lock.json');
      base = config.base;
      building = config.command === 'build';
    },
    resolveId(id: string) {
      return id === 'virtual:loa' ? virtualId : undefined;
    },
    async load(id) {
      if (id !== virtualId) return undefined;
      const lock = await readLock();
      // Checks duplicate aliases even when every asset will be emitted below.
      const resolution = buildResolution(lock, { mode, baseUrl: base });
      this.addWatchFile(lockPath);
      if (!building) return `export default JSON.parse(${JSON.stringify(JSON.stringify(resolution))});`;
      const entries: string[] = [];
      for (const [directory, importer] of Object.entries(lock.importers)) {
        for (const [alias, entry] of Object.entries(importer.assets)) {
          if (mode === 'remote' && entry.kind !== 'file') {
            entries.push(`[${JSON.stringify(alias)}]:${JSON.stringify(resolution[alias])}`);
            continue;
          }
          const path = localPath(root, directory, entry);
          this.addWatchFile(path);
          const bytes = await readAsset(path, entry);
          const extension = entry.kind === 'file' ? extname(path) : entry.extension;
          const hash = createHash('sha256').update(bytes).digest('hex');
          const emitted = this.emitFile({ type: 'asset', name: `loa-${hash}${extension}`, source: bytes });
          entries.push(`[${JSON.stringify(alias)}]:import.meta.ROLLUP_FILE_URL_${emitted}`);
        }
      }
      return `export default {${entries.join(',')}};`;
    },
    async configureServer(server) {
      let lock = await readLock();
      let routes = new Map<string, { path: string; entry: LockedAsset }>();
      const updateRoutes = () => {
        buildResolution(lock, { mode });
        routes = new Map();
        const prefix = new URL(base, 'http://loa.local/').pathname.replace(/\/$/, '');
        for (const [directory, importer] of Object.entries(lock.importers)) {
          for (const [alias, entry] of Object.entries(importer.assets)) {
            if (entry.kind !== 'file' && mode === 'remote') continue;
            const route = entry.kind === 'file' ? liveAssetUrl(directory, alias) : relativeAssetPath(entry);
            routes.set(`${prefix}/${route}`, { path: localPath(root, directory, entry), entry });
          }
        }
        server.watcher.add([lockPath, ...[...routes.values()].map((item) => item.path)]);
      };
      updateRoutes();
      server.watcher.on('change', (path) => {
        if (resolve(path) !== lockPath && ![...routes.values()].some((item) => item.path === resolve(path))) return;
        void (async () => {
          if (resolve(path) === lockPath) {
            lock = await readLock();
            updateRoutes();
          }
          const module = server.moduleGraph.getModuleById(virtualId);
          if (module) server.moduleGraph.invalidateModule(module);
          server.ws.send({ type: 'full-reload' });
        })().catch(() => {
          // The next virtual-module load reports the invalid lockfile through Vite.
          const module = server.moduleGraph.getModuleById(virtualId);
          if (module) server.moduleGraph.invalidateModule(module);
          server.ws.send({ type: 'full-reload' });
        });
      });
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://loa.local').pathname;
        const route = routes.get(pathname);
        if (!route) {
          const prefix = new URL(base, 'http://loa.local/').pathname.replace(/\/$/, '');
          if (
            ['/__loa/live/', '/loa_assets/', '/asset_cache/'].some((part) => pathname.startsWith(`${prefix}${part}`))
          ) {
            response.writeHead(404);
            response.end();
            return;
          }
          return next();
        }
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          response.writeHead(405, { Allow: 'GET, HEAD' });
          response.end();
          return;
        }
        void readAsset(route.path, route.entry)
          .then((bytes) => {
            response.writeHead(200, {
              'Content-Type': mimeType(route.path),
              'Content-Length': bytes.length,
              'Cache-Control': 'no-store',
            });
            response.end(request.method === 'HEAD' ? undefined : bytes);
          })
          .catch((error: unknown) => {
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end(error instanceof Error ? error.message : 'Could not read LoA asset');
          });
      });
    },
  };
}
