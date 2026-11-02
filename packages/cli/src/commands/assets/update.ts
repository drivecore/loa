import * as sdk from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import {
  descriptionOption,
  formatOption,
  getAssetVisibilityOption,
  getLicenseOption,
  getOrgOption,
  getProjectOption,
  metadataOption,
} from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'update',
  describe: 'Update asset',
  builder: (yargs) =>
    yargs.options({
      asset: {
        type: 'string',
        description: 'Asset name',
        demandOption: true,
      },
      newName: {
        type: 'string',
        description: 'New asset name',
      },
      ...getAssetVisibilityOption(),
      ...getLicenseOption(),
      ...getOrgOption(),
      ...getProjectOption(),
      ...descriptionOption,
      ...metadataOption,
      ...formatOption,
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);

    const asset = await sdk.updateAsset(client, {
      params: {
        orgName: argv.org,
        projectName: argv.project,
        assetName: argv.asset,
      },
      body: {
        name: argv.newName,
        description: argv.description,
        visibility: argv.visibility,
        shareLicense: argv.license,
        metadata: argv.metadata,
      },
    });

    logOutput(asset, argv.format, deps.logger);
  },
});
