import { defineCommand } from 'yargs-file-commands';
import { loadProject, resolveProject, saveProject } from '../lib/asset-manager/project.ts';
import { getConfig } from '../lib/config.ts';
import { getCliDeps } from '../lib/deps.ts';

export const command = defineCommand({
  command: 'remove <alias>',
  describe: 'Remove an asset binding from the current manifest; cached files are retained',
  builder: (yargs) =>
    yargs.positional('alias', {
      type: 'string',
      demandOption: true,
      description: 'Asset alias in the current manifest',
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const project = await loadProject();
    const assets = project.manifests[project.current]!.assets;
    if (!Object.hasOwn(assets, argv.alias)) throw new Error(`Unknown alias in current manifest: ${argv.alias}`);
    delete assets[argv.alias];
    const lock = await resolveProject(project, (await getConfig(deps)).host);
    await saveProject(project, lock, [project.current]);
    deps.logger.info(`Removed ${argv.alias}`);
  },
});
