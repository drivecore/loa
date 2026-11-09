import { defineCommand } from 'yargs-file-commands';
import { pruneStore, storePath } from '../../lib/asset-manager/store.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'prune',
  describe: 'Remove native store content unused by registered project lockfiles',
  builder: (yargs) => yargs,
  handler: async (argv) => {
    getCliDeps(argv).logger.info(`Removed ${await pruneStore(storePath())} store files`);
  },
});
