# Land of Assets — public modules

This repository holds the public, open-source modules of [Land of Assets](https://landofassets.com): the TypeScript SDK and the `loa` command-line tool. They are the supported way to integrate with the Land of Assets REST API from your own scripts, pipelines, and applications.

The Land of Assets platform itself is closed source. These modules are developed in the open so that integrating is easy, and so you can fix or improve them yourself. **Public pull requests are welcome.**

| Package                             | npm                                                                                                       | Description                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`@landofassets/sdk`](packages/sdk) | [![npm](https://img.shields.io/npm/v/@landofassets/sdk)](https://www.npmjs.com/package/@landofassets/sdk) | Typed, functional client for the REST API |
| [`@landofassets/cli`](packages/cli) | [![npm](https://img.shields.io/npm/v/@landofassets/cli)](https://www.npmjs.com/package/@landofassets/cli) | `loa` command-line interface              |

## Quick start

### SDK

```sh
npm install @landofassets/sdk
```

```ts
import { createSecretTokenInstance, listAssets } from '@landofassets/sdk';

const client = createSecretTokenInstance({ secretToken: process.env.LOA_TOKEN! });
const assets = await listAssets(client, { query: { orgName: 'my-org', projectName: 'my-project' } });
```

See the [SDK README](packages/sdk/README.md) for authentication options, uploads, and the full API surface.

### CLI

```sh
npm install -g @landofassets/cli
loa auth login
loa assets list --org my-org --project my-project
```

See the [CLI README](packages/cli/README.md) for every command, or run `loa --help`.

Both packages require Node.js 22 or newer.

## Development

```sh
pnpm install
pnpm build
pnpm tsc
pnpm lint
pnpm test
```

The CLI talks to `https://api.landofassets.com` by default. Use `loa config set --host <url>` or the `LOA_HOST` environment variable to point it elsewhere.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. In short: open an issue, branch from `main`, use Conventional Commits, and make sure the local checks pass. Releases to npm are cut by the maintainers from `main`.

## License

[MIT](LICENSE)
