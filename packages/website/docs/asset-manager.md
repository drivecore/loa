---
title: Asset manager
sidebar_position: 1
description: Keep asset selections in Git and load the same assets from the cloud or a local checkout with the loa CLI.
---

# Asset manager

The `loa` CLI manages the assets a codebase consumes. Keep selections in Git, publish immutable versions to LoA, and load those versions from the cloud or a local checkout.

Git owns branches, reviews, and merges. LoA owns published versions and their bytes. A feature branch can select a different chair or lighting rig alongside the code that uses it. One codebase can consume assets from many LoA organizations and projects; it does not need a matching LoA project.

## Select assets with your code

Install the CLI, then [add an asset](./cli/loa-add.md) from your application's directory. Replace the example with a public asset you can access:

```sh
npm install -g @landofassets/cli
loa add acme/furniture/chair@2.3.0 --as chair
```

The CLI writes `assets.json` and `assets-lock.json`. Commit both with your code. The manifest says what you want; the lockfile records the resolved versions and native content hashes.

```json
{
  "name": "showroom",
  "assets": {
    "chair": "acme/furniture/chair@2.3.0"
  }
}
```

Keys name bindings used by your code. Values contain the full source, even if you use the canonical `org/project/asset` name as the key.

## Choose a source

| Source                                               | Behavior                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Native LoA ref, such as `acme/furniture/chair@2.3.0` | An immutable version with a verified content hash and shared global cache          |
| Direct HTTP(S) URL                                   | Loaded directly or pulled into the project cache, without integrity checks         |
| Live `file:` reference                               | Loaded from its original location; edits stay live and pulling leaves it untouched |

Only native LoA versions guarantee pinned bytes. Publish an asset when you need repeatable consumption; use URLs and local files for inputs that may change. See [`loa add`](./cli/loa-add.md) for source syntax, aliases, and version selection.

## Work from the cloud or locally

You can load native assets remotely without downloading them first. To work locally, [pull the selected assets](./cli/loa-pull.md):

```sh
loa pull
```

All pulled files live in the project's gitignored `asset_cache/`. Native files come through the verified global store; direct URL downloads stay project-local. Live files stay at their original locations. The [`pull` reference](./cli/loa-pull.md) covers offline requirements, frozen lockfiles, refreshing URL downloads, and cache behavior.

## Load assets in an application

The runtime maps binding names to URLs before the first load. Your code can use `loa:chair` with three.js loaders or obtain a URL directly with `assets.url('chair')`.

### Vite and three.js

Install the runtime:

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

Use `remote` for cloud loading or `local` after pulling to serve local files and include them in a production build.

For TypeScript, include the virtual module declaration in your application's environment declarations:

```ts
/// <reference types="@landofassets/runtime/virtual" />
```

Then use the generated map with a loading manager:

```ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createLoaResolver } from '@landofassets/runtime';
import resolution from 'virtual:loa';

const assets = createLoaResolver({ resolution });
const manager = new THREE.LoadingManager();
manager.setURLModifier(assets.urlModifier);

new GLTFLoader(manager).load('loa:chair', (gltf) => scene.add(gltf.scene));
const chairUrl = assets.url('chair');
```

### Without Vite

Use [`loa resolve`](./cli/loa-resolve.md) to export `asset-resolution.json`. It prefers locally pulled files where present and remote URLs otherwise. Serve the map with your application, then load it before creating loaders:

```ts
import { loadLoaResolver } from '@landofassets/runtime';

const assets = await loadLoaResolver('/asset-resolution.json');
const chairUrl = assets.url('chair');
```

See the [`resolve` reference](./cli/loa-resolve.md) for mode overrides, serving local files, and regenerating the map.

## Review and change selections

Asset selections travel with code branches and reviews. Use the command references for individual operations:

| Command                                 | Purpose                                              |
| --------------------------------------- | ---------------------------------------------------- |
| [`loa add`](./cli/loa-add.md)           | Select an asset or change an existing binding        |
| [`loa remove`](./cli/loa-remove.md)     | Remove a binding                                     |
| [`loa outdated`](./cli/loa-outdated.md) | Find newer published versions                        |
| [`loa update`](./cli/loa-update.md)     | Update selected versions                             |
| [`loa publish`](./cli/loa-publish.md)   | Publish an immutable version for consumers to select |

Publishing and selecting are separate actions, so a newly published version can be adopted through a code review. The publish reference covers authentication, versions, and server-side asset validation.

## Share assets across workspaces

Large projects can keep an `assets.json` in each level, area, or package and list their directories in a root manifest:

```json
{
  "name": "world",
  "assets": {},
  "workspaces": ["levels/*"]
}
```

One root `assets-lock.json` records the combined selections. Each manifest owns its declarations; the runtime uses one shared binding namespace. See [`add`](./cli/loa-add.md), [`remove`](./cli/loa-remove.md), and [`pull`](./cli/loa-pull.md) for workspace command behavior.

## Maintain the shared store

The CLI provides [`loa store path`](./cli/loa-store-path.md), [`loa store status`](./cli/loa-store-status.md), and [`loa store prune`](./cli/loa-store-prune.md). Their reference pages describe configuration and maintenance.

See the [CLI reference](/cli) for all commands and the [SDK reference](/sdk) for programmatic catalog and publication APIs.
