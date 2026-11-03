import { logOutput } from '../../lib/output.ts';
import { formatOption } from '../../lib/args.ts';
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
      ...formatOption,
      ...getOrgOption(),
      ...getProjectOption(),
    }),
  handler: async (argv) => {
    const version = argv.version === undefined ? undefined : assetVersionSchema.parse(argv.version);
    const deps = getCliDeps(argv);
    const client = await createClient(deps);
    const params = { orgName: argv.org, projectName: argv.project, assetName: argv.asset };
    const uploadToken = await uploadFile(client, {
      params: { orgName: argv.org, projectName: argv.project },
      fileData: await readFile(argv.file),
      filename: basename(argv.file),
    });
    const asset = await createAssetVersion(client, { params, body: { uploadToken, version } });
    logOutput(asset, argv.format, deps.logger);
  },
});
