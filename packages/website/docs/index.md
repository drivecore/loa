---
sidebar_position: 1
slug: /
---

# Land of Assets developer docs

[Land of Assets](https://landofassets.com) is a platform for managing, converting, and delivering 3D assets. You can automate it three ways:

- **[CLI](/cli)**: `loa` scripts uploads, conversions, and project management from your terminal or CI.
- **[SDK](/sdk)**: `@landofassets/sdk` is a typed TypeScript client for the REST API.
- **[REST API](/api)**: call the HTTP API directly from any language.

## Install

```sh
npm install -g @landofassets/cli   # the loa command
npm install @landofassets/sdk      # the TypeScript SDK
```

Then sign in with `loa auth login`, or create an API token in the dashboard for CI and the SDK.
