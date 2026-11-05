import { createServer, type Server } from 'node:http';
import { afterEach, expect, it } from 'vitest';
import { createSessionInstance } from './client.js';

let server: Server | undefined;
afterEach(async () => {
  if (server)
    await new Promise<void>((resolve, reject) => server!.close((error) => (error ? reject(error) : resolve())));
  server = undefined;
});

it.each([
  { refreshStatuses: [500, 200], createStatus: 201, expectedCreates: 1 },
  { refreshStatuses: [500, 200], createStatus: 500, expectedCreates: 1 },
  { refreshStatuses: [401], createStatus: 201, expectedCreates: 0 },
  { refreshStatuses: [500, 500, 500], createStatus: 201, expectedCreates: 0 },
])(
  'handles refresh $refreshStatuses with $expectedCreates asset requests (create returns $createStatus)',
  async ({ refreshStatuses, createStatus, expectedCreates }) => {
    let refreshes = 0;
    let creates = 0;
    const requests: string[] = [];
    const authorizations: (string | undefined)[] = [];
    server = createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      requests.push(req.url!);
      if (req.url === '/auth/refresh-access-token') {
        res.statusCode = refreshStatuses[refreshes] ?? 500;
        refreshes++;
        res.end(JSON.stringify(res.statusCode === 200 ? { accessToken: 'recovered' } : { error: 'unavailable' }));
      } else {
        creates++;
        authorizations.push(req.headers.authorization);
        res.statusCode = createStatus;
        res.end(JSON.stringify({ id: 1 }));
      }
    });
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing server address');
    const client = createSessionInstance({ host: `http://127.0.0.1:${address.port}`, userSessionToken: 'ut_test' });
    const result = client.axios.post('/assets/org/project', { name: 'material' });
    if (expectedCreates && createStatus === 201) await expect(result).resolves.toMatchObject({ data: { id: 1 } });
    else
      await expect(result).rejects.toMatchObject({
        response: { status: expectedCreates ? createStatus : refreshStatuses.at(-1) },
      });
    expect(refreshes).toBe(refreshStatuses.length);
    expect(creates).toBe(expectedCreates);
    expect(requests).toEqual([
      ...refreshStatuses.map(() => '/auth/refresh-access-token'),
      ...(expectedCreates ? ['/assets/org/project'] : []),
    ]);
    expect(authorizations).toEqual(expectedCreates ? ['Bearer recovered'] : []);
  },
);
