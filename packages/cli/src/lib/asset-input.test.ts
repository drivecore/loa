import { describe, expect, it } from 'vitest';
import { resolveAssetInput } from './asset-input.ts';

describe('asset input resolution', () => {
  it('resolves a bare positional asset and optional version tokens', () => {
    expect(resolveAssetInput({ assetReference: 'MyChair' })).toEqual({ assetName: 'MyChair' });
    for (const version of ['1', '1.2', '1.2.3', 'latest', 'draft']) {
      expect(resolveAssetInput({ assetReference: `MyChair@${version}` }, { version: 'read' })).toEqual({
        assetName: 'MyChair',
        version,
      });
    }
  });
  it('resolves explicit options', () => {
    expect(resolveAssetInput({ asset: 'MyChair', version: '2.1.3' }, { version: 'read' })).toEqual({
      assetName: 'MyChair',
      version: '2.1.3',
    });
  });
  it.each([{ asset: 'MyChair' }, { version: '1.2.3' }, { asset: 'MyChair', version: '1.2.3' }])(
    'rejects mixing positional and explicit input %j even when matching',
    (options) => {
      expect(() => resolveAssetInput({ assetReference: 'MyChair@1.2.3', ...options }, { version: 'read' })).toThrow(
        'never both',
      );
    },
  );
  it('requires bare names in --asset', () => {
    expect(() => resolveAssetInput({ asset: 'MyChair@1.2.3' }, { version: 'read' })).toThrow('bare name');
  });
  it.each(['', '@latest', 'MyChair@', 'MyChair@1@2', 'MyChair@../draft', 'MyChair@draft/next'])(
    'rejects malformed positional input %s',
    (assetReference) => {
      expect(() => resolveAssetInput({ assetReference }, { version: 'read' })).toThrow();
    },
  );
  it('requires an asset except for creation with inferred names', () => {
    expect(() => resolveAssetInput({ version: '1.2.3' }, { version: 'read' })).toThrow('Specify an asset');
    expect(resolveAssetInput({ version: '1.2.3' }, { version: 'exact', required: false })).toEqual({
      assetName: undefined,
      version: '1.2.3',
    });
  });
  it('restricts publishing to exact versions', () => {
    expect(resolveAssetInput({ assetReference: 'MyChair@1.2.3' }, { version: 'exact' }).version).toBe('1.2.3');
    for (const version of ['latest', '1', '1.2', 'draft', '1.0.0-beta'])
      expect(() => resolveAssetInput({ asset: 'MyChair', version }, { version: 'exact' })).toThrow('major.minor.patch');
  });
  it('rejects versions on whole-asset commands', () => {
    expect(() => resolveAssetInput({ assetReference: 'MyChair@1.2.3' })).toThrow('does not accept');
    expect(() => resolveAssetInput({ asset: 'MyChair', version: '1.2.3' })).toThrow('does not accept');
  });
});
