import { listAssetVersions } from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import { getOrgOption, getProjectOption } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
export const command = defineCommand({
  command: 'versions',
  describe: 'List asset versions in descending version order',
  builder: (yargs) =>
    yargs.options({ asset: { type: 'string', demandOption: true }, ...getOrgOption(), ...getProjectOption() }),
  handler: async (argv) => {
    const client = await createClient(getCliDeps(argv));
    console.log(
      JSON.stringify(
        await listAssetVersions(client, {
          params: { orgName: argv.org, projectName: argv.project, assetName: argv.asset },
        }),
        null,
        2,
      ),
    );
  },
});
