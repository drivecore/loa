import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { assetVersionSchema, createAssetVersion, uploadFile } from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import { getOrgOption, getProjectOption } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
export const command = defineCommand({
  command: 'upload',
  describe: 'Upload a new asset version (defaults to the next major)',
  builder: (yargs) =>
    yargs.options({
      asset: { type: 'string', demandOption: true, description: 'Asset name' },
      file: { type: 'string', demandOption: true, description: 'File to upload' },
      version: { type: 'string', description: 'Unused major.minor.patch version' },
      ...getOrgOption(),
      ...getProjectOption(),
    }),
  handler: async (argv) => {
    const version = argv.version === undefined ? undefined : assetVersionSchema.parse(argv.version);
    const client = await createClient(getCliDeps(argv));
    const params = { orgName: argv.org, projectName: argv.project, assetName: argv.asset };
    const uploadToken = await uploadFile(client, {
      params: { orgName: argv.org, projectName: argv.project },
      fileData: await readFile(argv.file),
      filename: basename(argv.file),
    });
    const asset = await createAssetVersion(client, { params, body: { uploadToken, version } });
    console.log(JSON.stringify(asset, null, 2));
  },
});
