# @landofassets/runtime

Resolve Git-locked asset aliases synchronously in browsers and integrate them with Vite.

```ts
import { createLoaResolver } from '@landofassets/runtime';
import resolution from 'virtual:loa';
const assets = createLoaResolver({ resolution });
manager.setURLModifier(assets.urlModifier);
loader.load('loa:chair');
```

Add `loa()` from `@landofassets/runtime/vite` to Vite's plugins. The default `remote` mode loads native assets and direct URLs remotely and bundles live files. With `loa({ mode: 'local' })`, run `loa pull` first; the plugin serves downloaded assets in development and emits them into builds. `file:` sources always read live from their declared location and are bundled at build time. TypeScript users can add `@landofassets/runtime/virtual` to `compilerOptions.types` for the virtual module declaration.

Native assets are hash-verified. Direct HTTP(S) URLs and live files deliberately have no integrity pin. Both native assets and direct URL downloads are materialized in the project's `asset_cache/`. Only native assets use the global store; live files stay at their original paths.

Without Vite, call `loadLoaResolver('/loa-resolution.json')` before creating loaders, or construct a resolver with your own alias-to-URL object. Non-`loa:` loader URLs pass through unchanged; unknown aliases throw.
