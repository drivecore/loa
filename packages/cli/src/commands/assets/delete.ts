import * as sdk from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import { getOrgOption, getProjectOption } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'delete',
  describe: 'Delete asset',
  builder: (yargs) =>
    yargs.options({
      asset: {
        type: 'string',
        description: 'Asset name',
        demandOption: true,
      },
      ...getOrgOption(),
      ...getProjectOption(),
    }),
  handler: async (argv) => {
    const client = await createClient(getCliDeps(argv));

    await sdk.deleteAsset(client, {
      params: {
        orgName: argv.org,
        projectName: argv.project,
        assetName: argv.asset,
      },
    });
  },
});
