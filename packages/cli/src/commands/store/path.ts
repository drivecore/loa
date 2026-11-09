import { defineCommand } from 'yargs-file-commands';
import { storePath } from '../../lib/asset-manager/store.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'path',
  describe: 'Print the global native asset store path',
  builder: (yargs) => yargs,
  handler: (argv) => {
    getCliDeps(argv).logger.info(storePath());
  },
});
