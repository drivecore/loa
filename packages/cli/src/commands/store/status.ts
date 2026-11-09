import { defineCommand } from 'yargs-file-commands';
import { storePath, verifyStore } from '../../lib/asset-manager/store.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'status',
  describe: 'Verify the SHA-256 of every native asset in the global store',
  builder: (yargs) => yargs,
  handler: async (argv) => {
    const result = await verifyStore(storePath());
    if (result.corrupt.length) throw new Error(`Corrupt store files:\n${result.corrupt.join('\n')}`);
    getCliDeps(argv).logger.info(`Verified ${result.checked} store files`);
  },
});
