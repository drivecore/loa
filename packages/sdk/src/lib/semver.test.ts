import { describe, expect, it } from 'vitest';
import { assetVersionSchema, assetVersionSelectorSchema, parseAssetVersion } from './semver.js';
import { assetNameSchema, assetReferenceSchema, parseAssetReference, formatAssetReference } from './schemas.js';
describe('asset versions', () => {
  it('accepts stable versions and resolves numeric components', () => {
    expect(parseAssetVersion('10.12.3')).toEqual({ major: 10, minor: 12, patch: 3 });
    for (const value of ['0.0.0', '1.0.0', '2147483647.0.0'])
      expect(assetVersionSchema.safeParse(value).success).toBe(true);
  });
  it('accepts only supported selectors', () => {
    for (const value of ['latest', '1', '1.2', '1.2.3'])
      expect(assetVersionSelectorSchema.safeParse(value).success).toBe(true);
    for (const value of [
      '',
      '01.2.3',
      '1.02.3',
      '-1.0.0',
      'v1.0.0',
      '1.0.0-beta',
      '1.0.0+build',
      '^1',
      '*',
      'custom',
      '2147483648',
      '1.0.0\n',
    ])
      expect(assetVersionSelectorSchema.safeParse(value).success).toBe(false);
  });
  it('keeps read references separate from mutable asset names', () => {
    expect(parseAssetReference('chair@2.3')).toEqual({ assetName: 'chair', version: '2.3' });
    expect(formatAssetReference('chair', 'latest')).toBe('chair@latest');
    expect(assetNameSchema.safeParse('chair@2').success).toBe(false);
    for (const value of ['chair@', 'chair@@1', 'chair@custom', 'chair@01', '@1'])
      expect(assetReferenceSchema.safeParse(value).success).toBe(false);
  });
});
