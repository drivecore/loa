import { describe, expect, it } from 'vitest';
import { createAnonymousClient } from '../client.js';
import { getMediaOriginalUrl, getMediaUrl, mediaTaskAcceptedSchema, type StartMediaTaskProps } from './media.js';

const host = 'https://api.example.com';
const client = createAnonymousClient({ host });
const params = { orgName: 'my-org', projectName: 'my-project', assetName: 'my-asset' };

describe('Media API URL builders', () => {
  it('getMediaOriginalUrl builds path /media/$orgName/$projectName/$assetName.glb', () => {
    const url = getMediaOriginalUrl(client, { extension: '.glb', params });
    expect(url.href).toBe(`${host}/media/my-org/my-project/my-asset.glb?original=true`);
  });

  it('getMediaOriginalUrl appends download query when provided', () => {
    const url = getMediaOriginalUrl(client, { extension: '.glb', params, query: { download: true } });
    expect(url.searchParams.get('download')).toBe('true');
  });

  describe('getMediaUrl (unified)', () => {
    it('builds image route for webp', () => {
      const url = getMediaUrl(client, { params, format: 'webp', query: { width: 512, height: 512 } });
      expect(url.href).toBe(`${host}/media/my-org/my-project/my-asset.webp?width=512&height=512`);
    });

    it('builds envmap route for hdr', () => {
      const url = getMediaUrl(client, { params, format: 'hdr', query: { download: true } });
      expect(url.href).toBe(`${host}/media/my-org/my-project/my-asset.hdr?download=true`);
    });

    it('builds envmap route for ultrahdr', () => {
      const url = getMediaUrl(client, { params, format: 'ultrahdr', query: { download: true } });
      expect(url.href).toBe(`${host}/media/my-org/my-project/my-asset.ultrahdr.jpg?download=true`);
    });

    it('builds model route for glb', () => {
      const url = getMediaUrl(client, { params, format: 'glb', query: { meshCompress: 'draco' } });
      expect(url.href).toBe(`${host}/media/my-org/my-project/my-asset.glb?meshCompress=draco`);
    });

    it('builds model route for usdz, blend, and fbx', () => {
      const usdz = getMediaUrl(client, { params, format: 'usdz', query: { download: true } });
      const blend = getMediaUrl(client, { params, format: 'blend', query: { download: true } });
      const fbx = getMediaUrl(client, { params, format: 'fbx', query: { download: true } });
      expect(usdz.href).toBe(`${host}/media/my-org/my-project/my-asset.usdz?download=true`);
      expect(blend.href).toBe(`${host}/media/my-org/my-project/my-asset.blend?download=true`);
      expect(fbx.href).toBe(`${host}/media/my-org/my-project/my-asset.fbx?download=true`);
    });

    it('builds cad route for fcstd, iges, and step', () => {
      const fcstd = getMediaUrl(client, { params, format: 'fcstd', query: { download: true } });
      const iges = getMediaUrl(client, { params, format: 'iges', query: { download: true } });
      const step = getMediaUrl(client, { params, format: 'step', query: { download: true } });
      expect(fcstd.href).toBe(`${host}/media/my-org/my-project/my-asset.fcstd?download=true`);
      expect(iges.href).toBe(`${host}/media/my-org/my-project/my-asset.iges?download=true`);
      expect(step.href).toBe(`${host}/media/my-org/my-project/my-asset.step?download=true`);
    });
  });

  describe('typed format/query constraints', () => {
    it('accepts valid discriminated union pairs', () => {
      const webpProps = {
        params,
        format: 'webp',
        query: { width: 256, height: 256, cache: false },
      } satisfies StartMediaTaskProps;

      const glbProps = {
        params,
        format: 'glb',
        query: { meshCompress: 'draco', textureCompress: 'ktx2' },
      } satisfies StartMediaTaskProps;

      const cadProps = {
        params,
        format: 'fcstd',
        query: { cache: false },
      } satisfies StartMediaTaskProps;

      expect(webpProps.format).toBe('webp');
      expect(glbProps.format).toBe('glb');
      expect(cadProps.format).toBe('fcstd');
    });

    it('rejects invalid discriminated union pairs at compile time', () => {
      // @ts-expect-error width is not allowed for glb query
      const badGlb: StartMediaTaskProps = { params, format: 'glb', query: { width: 256 } };
      // @ts-expect-error meshCompress is not allowed for webp query
      const badWebp: StartMediaTaskProps = { params, format: 'webp', query: { meshCompress: 'draco' } };
      expect(badGlb).toBeDefined();
      expect(badWebp).toBeDefined();
    });
  });
});

describe('mediaTaskAcceptedSchema', () => {
  it('parses valid 202 response body with QUEUED status', () => {
    const body = {
      status: 'QUEUED',
      taskId: 42,
      taskUrl: 'https://api.example.com/tasks/org/proj/42',
      eventsUrl: 'https://api.example.com/tasks/org/proj/42/events',
    };
    const parsed = mediaTaskAcceptedSchema.parse(body);
    expect(parsed.status).toBe('QUEUED');
    expect(parsed.taskId).toBe(42);
    expect(parsed.taskUrl).toBe(body.taskUrl);
    expect(parsed.eventsUrl).toBe(body.eventsUrl);
  });

  it('accepts RUNNING status', () => {
    const body = {
      status: 'RUNNING',
      taskId: 1,
      taskUrl: 'https://api.example.com/tasks/o/p/1',
      eventsUrl: 'https://api.example.com/tasks/o/p/1/events',
    };
    const parsed = mediaTaskAcceptedSchema.parse(body);
    expect(parsed.status).toBe('RUNNING');
  });

  it('accepts SUCCESS status', () => {
    const body = {
      status: 'SUCCESS',
      taskId: 1,
      taskUrl: 'https://api.example.com/tasks/o/p/1',
      eventsUrl: 'https://api.example.com/tasks/o/p/1/events',
    };
    const parsed = mediaTaskAcceptedSchema.parse(body);
    expect(parsed.status).toBe('SUCCESS');
  });

  it('accepts SUCCESS status without task metadata', () => {
    const body = {
      status: 'SUCCESS',
    };
    const parsed = mediaTaskAcceptedSchema.parse(body);
    expect(parsed.status).toBe('SUCCESS');
    expect(parsed.taskId).toBeUndefined();
    expect(parsed.taskUrl).toBeUndefined();
    expect(parsed.eventsUrl).toBeUndefined();
  });

  it('accepts FAILED status', () => {
    const body = {
      status: 'FAILED',
      taskId: 1,
      taskUrl: 'https://api.example.com/tasks/o/p/1',
      eventsUrl: 'https://api.example.com/tasks/o/p/1/events',
    };
    const parsed = mediaTaskAcceptedSchema.parse(body);
    expect(parsed.status).toBe('FAILED');
  });

  it('rejects unknown status', () => {
    const body = {
      status: 'UNKNOWN',
      taskId: 1,
      taskUrl: 'https://api.example.com/tasks/o/p/1',
      eventsUrl: 'https://api.example.com/tasks/o/p/1/events',
    };
    expect(() => mediaTaskAcceptedSchema.parse(body)).toThrow();
  });
});

describe('versioned media references', () => {
  it('carries exact and automatic references through all media formats', () => {
    for (const selector of ['1.2.3', '1.2', '1', 'latest']) {
      const selected = { ...params, assetName: `my-asset@${selector}` };
      expect(
        decodeURIComponent(getMediaOriginalUrl(client, { extension: '.glb', params: selected }).pathname),
      ).toContain(`my-asset@${selector}.glb`);
      for (const format of [
        'webp',
        'glb',
        'usdz',
        'blend',
        'fbx',
        'fcstd',
        'iges',
        'step',
        'hdr',
        'exr',
        'ultrahdr',
      ] as const) {
        expect(decodeURIComponent(getMediaUrl(client, { params: selected, format }).pathname)).toContain(
          `my-asset@${selector}.`,
        );
      }
    }
  });
  it('rejects manual tags and malformed versions', () => {
    for (const name of ['chair@custom', 'chair@01.2', 'chair@1.0.0-beta']) {
      expect(() =>
        getMediaOriginalUrl(client, { extension: '.glb', params: { ...params, assetName: name } }),
      ).toThrow();
      expect(() => getMediaUrl(client, { params: { ...params, assetName: name }, format: 'glb' })).toThrow();
    }
  });
});
