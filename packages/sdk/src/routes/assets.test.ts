import { describe, expect, it } from 'vitest';
import { createAssetBodySchema, lightInfoSchema, listAssetsQuerySchema, type LightInfo } from './assets.js';

const lightInfo: LightInfo = {
  version: 'LM-63-2002',
  metadata: { MANUFAC: 'Example Lighting', LUMINAIRE: 'Spotlight' },
  photometricType: 1,
  photometricTypeName: 'C',
  photometry: 'absolute',
  manufacturer: 'Example Lighting',
  luminaire: 'Spotlight',
  lightSource: 'LED',
  lampCatalog: 'not specified',
  lampCount: 1,
  lumensPerLamp: -1,
  inputWatts: 12,
  peakCandela: 500,
  verticalAngles: 3,
  horizontalAngles: 1,
  units: 'meters',
  dimensions: { width: 0.1, length: 0.1, height: 0.05 },
  hasTilt: false,
  warnings: [],
};

describe('LIGHT asset contracts', () => {
  it('accepts absolute photometry and preserves manufacturer metadata and warnings', () => {
    const info = { ...lightInfo, warnings: ['Missing optional test metadata'] };
    expect(lightInfoSchema.parse(info)).toEqual(info);
  });

  it('rejects invalid photometric types and non-finite intensity values', () => {
    expect(lightInfoSchema.safeParse({ ...lightInfo, photometricType: 4 }).success).toBe(false);
    expect(lightInfoSchema.safeParse({ ...lightInfo, peakCandela: Infinity }).success).toBe(false);
  });

  it('accepts creating and filtering light assets', () => {
    expect(
      createAssetBodySchema.parse({
        name: 'spotlight',
        type: 'LIGHT',
        uploadToken: 'upload-token',
        visibility: 'PUBLIC',
        shareLicense: 'CC_BY',
      }).type,
    ).toBe('LIGHT');
    expect(listAssetsQuerySchema.parse({ type: 'LIGHT' }).type).toBe('LIGHT');
  });
});
