import * as sdk from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import {
  formatOption,
  getAssetRequiredOption,
  getOrgOption,
  getProjectOption,
  paginationOption,
} from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'list',
  describe: 'List comments for an asset by path',
  builder: (yargs) =>
    yargs.options({
      ...getOrgOption(),
      ...getProjectOption(),
      ...getAssetRequiredOption(),
      ...paginationOption,
      ...formatOption,
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);
    const result = await sdk.listComments(client, {
      params: {
        orgName: argv.org,
        projectName: argv.project,
        assetName: argv.asset,
      },
      query: {
        pageOffset: argv['page-offset'],
        pageSize: argv['page-size'],
      },
    });
    logOutput(result, argv.format, deps.logger);
  },
});
