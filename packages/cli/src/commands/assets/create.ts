import * as sdk from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import {
  descriptionOption,
  getAssetVisibilityRequiredOption,
  getLicenseOption,
  getOrgOption,
  getProjectOption,
  metadataOption,
} from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { createAssetFromUpload } from '../../lib/upload.ts';
export const command = defineCommand({
  command: 'create',
  describe: 'Create a new asset from a file',
  builder: (yargs) =>
    yargs.version(false).options({
      version: { type: 'string', description: 'Initial version (default: 1.0.0)' },
      file: {
        alias: 'f',
        type: 'string',
        description: 'Path to file to upload',
        demandOption: true,
      },
      asset: {
        type: 'string',
        description: 'Asset name',
      },
      type: {
        type: 'string',
        choices: sdk.Enums.AssetType,
        description: 'Asset type (inferred from file extension when omitted; .ies creates LIGHT)',
      },
      ...getAssetVisibilityRequiredOption(),
      ...getLicenseOption(),
      ...getOrgOption(),
      ...getProjectOption(),
      ...descriptionOption,
      ...metadataOption,
    }),
  handler: async (argv) => {
    const orgName = argv.org;
    const projectName = argv.project;
    const assetName = argv.asset;

    const client = await createClient(getCliDeps(argv));

    await createAssetFromUpload(client, {
      orgName,
      projectName,
      filePath: argv.file,
      assetName,
      description: argv.description,
      assetType: argv.type,
      visibility: argv.visibility,
      shareLicense: argv.license,
      metadata: argv.metadata,
      version: argv.version,
    });
  },
});
