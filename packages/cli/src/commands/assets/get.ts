import * as sdk from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, getAssetRequiredOption, getOrgOption, getProjectOption } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'get',
  describe: 'Get asset details',
  builder: (yargs) =>
    yargs.options({
      ...getAssetRequiredOption(),
      ...getOrgOption(),
      ...getProjectOption(),
      ...formatOption,
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);

    const asset = await sdk.getAsset(client, {
      params: {
        orgName: argv.org,
        projectName: argv.project,
        assetName: argv.asset,
      },
    });

    logOutput(asset, argv.format, deps.logger);
  },
});
