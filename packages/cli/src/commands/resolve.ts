import { join, resolve } from 'node:path';
import { buildResolution } from '@landofassets/runtime/node';
import { defineCommand } from 'yargs-file-commands';
import { atomicWrite, loadProject, resolveProject } from '../lib/asset-manager/project.ts';
import { getConfig } from '../lib/config.ts';
import { getCliDeps } from '../lib/deps.ts';

export const command = defineCommand({
  command: 'resolve',
  describe: 'Generate a synchronous runtime URL map from the lockfile',
  builder: (yargs) =>
    yargs.options({
      mode: {
        type: 'string',
        choices: ['remote', 'local'] as const,
        default: 'remote' as const,
        description: 'Explicit asset loading mode',
      },
      output: { type: 'string', description: 'Output JSON file (default: loa-resolution.json at workspace root)' },
      'base-url': { type: 'string', default: '/', description: 'Public URL prefix used for local assets' },
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const project = await loadProject();
    const lock = await resolveProject(project, (await getConfig(deps)).host, { frozen: true });
    const map = buildResolution(lock, { mode: argv.mode, baseUrl: argv.baseUrl });
    const output = argv.output ? resolve(argv.output) : join(project.root, 'loa-resolution.json');
    await atomicWrite(output, JSON.stringify(map, null, 2) + '\n');
    deps.logger.info(`Wrote ${output}`);
  },
});
