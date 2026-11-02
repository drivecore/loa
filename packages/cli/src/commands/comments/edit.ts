import * as sdk from '@landofassets/sdk';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, getAssetRequiredOption, getOrgOption, getProjectOption, textOption } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'edit <commentId>',
  describe: 'Edit a comment on an asset by path',
  builder: (yargs) =>
    yargs
      .options({
        ...getOrgOption(),
        ...getProjectOption(),
        ...getAssetRequiredOption(),
        ...textOption,
        ...formatOption,
      })
      .positional('commentId', {
        type: 'number',
        description: 'Comment ID',
        demandOption: true,
      }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);
    const comment = await sdk.editComment(client, {
      params: {
        orgName: argv.org,
        projectName: argv.project,
        assetName: argv.asset,
        commentId: argv.commentId,
      },
      body: { text: argv.text },
    });
    logOutput(comment, argv.format, deps.logger);
  },
});
