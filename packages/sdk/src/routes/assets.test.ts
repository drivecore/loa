import { describe, expect, it } from 'vitest';
import { createAssetBodySchema, updateAssetBodySchema } from './assets.js';

describe('asset metadata', () => {
  const createBody = {
    name: 'test-asset',
    type: 'MODEL',
    uploadToken: 'test-upload-token',
    visibility: 'PUBLIC',
    shareLicense: 'NONE',
  };

  it('creates assets without AI Usage and rejects the removed field', () => {
    expect(createAssetBodySchema.safeParse(createBody).success).toBe(true);
    const result = createAssetBodySchema.safeParse({ ...createBody, aiUsage: 'AI_USED' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ code: 'unrecognized_keys', keys: ['aiUsage'] }),
      );
    }
  });

  it('updates metadata without AI Usage and rejects the removed field', () => {
    const body = { description: 'Updated description' };
    expect(updateAssetBodySchema.safeParse(body).success).toBe(true);
    const result = updateAssetBodySchema.safeParse({ ...body, aiUsage: 'AI_USED' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ code: 'unrecognized_keys', keys: ['aiUsage'] }),
      );
    }
  });
});
