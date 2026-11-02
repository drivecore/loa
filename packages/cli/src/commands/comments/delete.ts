import * as sdk from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import { getAssetRequiredOption, getOrgOption, getProjectOption } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'delete <commentId>',
  describe: 'Delete a comment on an asset by path',
  builder: (yargs) =>
    yargs
      .options({
        ...getOrgOption(),
        ...getProjectOption(),
        ...getAssetRequiredOption(),
      })
      .positional('commentId', {
        type: 'number',
        description: 'Comment ID',
        demandOption: true,
      }),
  handler: async (argv) => {
    const client = await createClient(getCliDeps(argv));
    await sdk.deleteComment(client, {
      params: {
        orgName: argv.org,
        projectName: argv.project,
        assetName: argv.asset,
        commentId: argv.commentId,
      },
    });
  },
});
