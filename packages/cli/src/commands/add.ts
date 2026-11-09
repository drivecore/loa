import { defineCommand } from 'yargs-file-commands';
import { addAsset } from '../lib/asset-manager/project.ts';
import { getConfig } from '../lib/config.ts';
import { getCliDeps } from '../lib/deps.ts';

export const command = defineCommand({
  command: 'add <source>',
  describe: 'Add a native asset ref, direct URL, or live local file to assets.json (no download)',
  builder: (yargs) =>
    yargs
      .positional('source', {
        type: 'string',
        demandOption: true,
        description: 'org/project/asset[@version], HTTP(S) URL, or local file path',
      })
      .option('as', { type: 'string', description: 'Local asset alias' }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    await addAsset(argv.source, argv.as, process.cwd(), (await getConfig(deps)).host);
    deps.logger.info('Updated assets.json and assets-lock.json');
  },
});
