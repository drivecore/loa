---
title: Asset manager
sidebar_position: 1
description: Keep asset selections in Git, share immutable downloads, and load the same assets from the cloud or a local checkout with the loa CLI.
---

# Asset manager

The `loa` CLI manages the assets a codebase consumes. Keep a small manifest and lockfile in Git, publish immutable versions to LoA, and choose whether your application loads those versions remotely or from local files.

Git owns branches, reviews, and merges. LoA owns published asset versions and their bytes. A feature branch can select a different chair or lighting rig by changing a JSON entry alongside the code that uses it. A consuming repository can use assets from many LoA organizations and projects; it does not need a matching LoA project.

## Start with a public asset

Install the CLI, then run these commands from your application's directory. Replace the example reference with a public asset you can access:

```sh
npm install -g @landofassets/cli
loa add acme/furniture/chair@2.3.0 --as chair
```

`add` writes `assets.json` and `assets-lock.json`. It resolves the native reference to an exact version and content hash, without downloading the asset file. Commit both files with your code.

```json
{
  "name": "showroom",
  "assets": {
    "chair": "acme/furniture/chair@2.3.0"
  }
}
```

The reference `acme/furniture/chair` is the asset's canonical `org/project/asset` name. `chair` is an alias local to your manifest. The key only names the binding; the value always contains the full source reference. You can use the canonical reference as the key too:

```json
{
  "name": "showroom",
  "assets": {
    "acme/furniture/chair": "acme/furniture/chair@2.3.0"
  }
}
```

Omit the version when adding an asset to select the current latest version and record an exact pin. Hand-edited manifests can retain selectors such as `acme/furniture/chair@2`, `acme/furniture/chair@2.3`, or `acme/furniture/chair@latest`; the lockfile still records one exact version. Bare values such as `"2.3.0"` are not supported. `latest` means the highest numeric version, not the most recently uploaded file.

## Three source types

| Source             | Example manifest value              | Integrity        | What `loa pull` does                                             |
| ------------------ | ----------------------------------- | ---------------- | ---------------------------------------------------------------- |
| LoA reference      | `acme/furniture/chair@2.3.0`        | Verifies SHA-256 | Fetches into the shared store and materializes in `asset_cache/` |
| Direct HTTP(S) URL | `https://example.com/downlight.ies` | Unverified       | Downloads into this project's `asset_cache/`                     |
| Local file         | `file:../brand/logo.png`            | Unverified, live | Leaves the source file untouched                                 |

```sh
loa add https://example.com/downlight.ies --as downlight
loa add ../brand/logo.png --as logo
```

Adding a URL records it without fetching it. Every HTTP(S) specifier is a direct URL, including one hosted by a LoA server or containing `@version`. It does not receive native registry resolution, integrity checks, or global caching.

Local files resolve relative to the manifest that declares them. They stay live at that location: edits are visible without pulling, hashing, or updating the lockfile. Do not use the materialized `asset_cache/` directory as an editing workspace; use a `file:` source for files you intend to edit.

Only native LoA versions guarantee pinned bytes. A direct URL may return different bytes later, and a local file reflects its current contents. Publish an asset to LoA when you need verified, repeatable consumption.

## Pull and work offline

```sh
loa pull
```

For native assets, `pull` checks the lockfile, verifies cached or downloaded content, and materializes project files from the global store. It tries a filesystem clone first, then a hardlink, then a copy. A hardlinked project file shares bytes with the store; treat these files as immutable.

All pulled assets live in the project's `asset_cache/`: native files are materialized from the verified global store, while direct URL downloads are stored only in this project folder, with filenames derived from the URL. Existing URL downloads are reused. To fetch their current response again:

```sh
loa pull --refresh
```

`file:` entries are never copied or altered by `pull`. An offline checkout using them still needs the referenced files to be present.

Ignore generated local state in Git:

```gitignore
asset_cache/
loa-resolution.json
```

For CI, require a lockfile that already matches the manifests:

```sh
loa pull --frozen-lockfile
```

A frozen lockfile prevents dependency resolution changes. It cannot make external URLs or live files immutable. Fully offline loading also requires local decoder/WASM resources and any other application dependencies used by your loaders.

## Load assets in an application

The runtime maps aliases to URLs synchronously. It does not choose versions, contact the registry, or read the manifest. The lockfile supplies those decisions before loading begins.

### Vite and three.js

```sh
npm install @landofassets/runtime
```

Add the plugin to `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { loa } from '@landofassets/runtime/vite';

export default defineConfig({
  plugins: [loa({ mode: 'remote' })],
});
```

For TypeScript, include the virtual module declaration in your application's environment declarations:

```ts
/// <reference types="@landofassets/runtime/virtual" />
```

Then use the generated map:

```ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createLoaResolver } from '@landofassets/runtime';
import resolution from 'virtual:loa';

const assets = createLoaResolver({ resolution });
const manager = new THREE.LoadingManager();
manager.setURLModifier(assets.urlModifier);

new GLTFLoader(manager).load('loa:chair', (gltf) => scene.add(gltf.scene));
const imageUrl = assets.url('logo');
```

The modifier passes non-`loa:` URLs through unchanged and reports unknown aliases. Pass the manager to each loader that should resolve asset aliases. Loaders that fetch directly without using the manager can use `assets.url(alias)` instead. The resolver itself does not depend on three.js.

Choose the mode explicitly:

| Mode     | Development                                                                      | Production build                                                                   |
| -------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `remote` | Native assets and direct URLs load remotely; live files are served by the plugin | Native assets and direct URLs remain remote; live files are emitted into the build |
| `local`  | Serves pulled native assets, cached URLs, and live files                         | Emits asset files into the build for self-contained deployment                     |

Run `loa pull` before using local mode. Production remote mode keeps deployments small; local builds carry the asset bytes and can run without LoA access. The plugin serves only files declared by the lockfile, including explicitly declared local files outside the project directory.

### Without Vite

Generate a URL map from the lockfile:

```sh
loa resolve --mode remote
# Or, after pulling:
loa resolve --mode local
```

This writes `loa-resolution.json` at the workspace root. Use `--output <file>` to choose another location or `--base-url <prefix>` to set the public URL prefix for local assets. The command requires a matching lockfile and does not re-resolve dependencies. Serve the JSON with your application and load it before the first asset request:

```ts
import { loadLoaResolver } from '@landofassets/runtime';

const assets = await loadLoaResolver('/loa-resolution.json');
const chairUrl = assets.url('chair');
```

You can also import a map as JSON and pass it to `createLoaResolver({ resolution })`. In local mode, configure your web server to serve the referenced local asset paths. A `file:` entry is a live filesystem reference and requires an explicit serving or bundling step; the Vite plugin handles that integration.

## Change asset selections with code

```sh
loa add acme/furniture/chair@3.0.0 --as chair
loa outdated
loa update chair
loa update chair --latest
loa remove chair
```

`update` re-resolves the declared selector. An exact version remains exact; `--latest` selects the latest version and updates the manifest pin. Unrelated entries keep their locked versions. Removing an alias removes its declaration and resolution, while leaving reusable store content available.

The CLI writes stable, sorted JSON with a trailing newline so reviews show the asset selections that changed. Resolve manifest conflicts in Git, then regenerate the lockfile with `loa pull`. Do not hand-edit generated hashes to resolve a conflict.

## Share assets across workspaces

A root manifest can include manifests for levels, areas, or packages:

```json
{
  "name": "world",
  "assets": {},
  "workspaces": ["levels/*"]
}
```

Each matching directory contains its own `assets.json` with a name and asset declarations. One `assets-lock.json` at the root records entries by declaring directory, so commands can preserve workspace ownership and relative file paths.

Run `add` and `remove` in the workspace whose manifest you want to edit. Pulling from the root materializes the workspace's combined asset set. Runtime aliases share one namespace: duplicate aliases across manifests are rejected. Use distinct aliases such as `lobby-chair` and `bedroom-chair` when needed.

## Publish immutable native assets

Publishing requires authentication and permission to write to the target organization and project:

```sh
loa auth login
loa publish ./chair.glb --to acme/furniture/chair --version 3.0.0
loa add acme/furniture/chair@3.0.0 --as chair
```

Publication registers a numbered snapshot. An existing version cannot be replaced with different bytes. Publishing does not automatically change the consuming manifest; adding or updating a selection is a separate action that can be reviewed with code.

Self-contained GLB and MaterialX package validation belongs to the web service's publication path, for both initial assets and new versions. The CLI does not inspect or package their dependencies to enforce this rule. GLB resources must be embedded; resources needed by a `.mtlx.zip` material must be packaged safely within its archive, apart from supported standard libraries.

The existing `loa assets create`, `loa assets upload`, and other administrative commands remain available. Asset-manager commands describe what a consuming codebase uses; administrative commands manage the remote catalog.

## Configure and maintain the shared store

```sh
loa store path
loa store verify
loa store prune
```

The default store follows platform cache conventions:

| Platform | Default location                         |
| -------- | ---------------------------------------- |
| macOS    | `~/Library/Caches/loa`                   |
| Linux    | `$XDG_CACHE_HOME/loa`, or `~/.cache/loa` |
| Windows  | `%LOCALAPPDATA%\loa\Cache`               |

Set `LOA_STORE_DIR` to override the location. Only native LoA bytes belong there. URL downloads stay in their project's `asset_cache/`, and live file sources stay at their original paths.

`verify` checks stored bytes against their SHA-256 names. `prune` keeps content referenced by the current lockfiles of projects registered during native pulls. Deleted projects no longer retain entries. If an existing registered project has a missing or malformed lockfile, pruning fails rather than guessing which bytes are unused.

Native references resolve through the configured API host, defaulting to `https://api.landofassets.com`. Use `LOA_HOST` or `loa config set --host <url>` for another host. The lockfile records the resolved host so an environment change does not silently move an existing locked dependency to another registry.

## Current scope

The asset manager consumes public native assets with no credentials in the runtime or download path. Asset resolution is flat: each native asset is one self-contained file, with no dependency solver. Private runtime access, scoped workspace aliases, and automatic runtime fallback between local and remote sources are outside this version.

See the [CLI reference](/cli) for command options and the [SDK reference](/sdk) for programmatic catalog and publication APIs.
