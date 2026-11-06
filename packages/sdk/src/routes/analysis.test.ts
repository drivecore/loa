import { describe, expect, it } from 'vitest';
import {
  assetAnalysisDataSchema,
  assetAnalysisSchema,
  assetAnalysisSummarySchema,
  assetTextureInfoSchema,
  assetVersionResultSchema,
  type AssetAnalysis,
  type AssetAnalysisData,
  type EnvmapAnalysisData,
  type LightAnalysisData,
  type MaterialAnalysisData,
  type ModelAnalysisData,
} from './assets.js';

const model: ModelAnalysisData = {
  kind: 'model',
  dimensions: {
    widthMeters: 1.2,
    depthMeters: 0.6,
    heightMeters: 0.85,
    unitSource: 'format-defined',
    measurementBasis: 'default-scene world bounds before preview normalization',
  },
  meshCount: 2,
  geometryCount: 1,
  triangleCount: 24,
  vertexCount: 8,
  materialCount: 1,
  textureCount: 0,
  textures: [],
};
const material: MaterialAnalysisData = {
  kind: 'material',
  version: '1.39',
  colorspace: 'lin_rec709',
  materials: [{ name: 'surface', category: 'surfacematerial' }],
  nodeGraphCount: 1,
  topLevelNodeCount: 1,
  nodeCount: 4,
  textureCount: 0,
  textures: [],
  referencedTextures: [],
  warnings: [],
};
const light: LightAnalysisData = {
  kind: 'light',
  version: 'LM-63-2002',
  metadata: { MANUFAC: 'Example' },
  photometricType: 1,
  photometricTypeName: 'C',
  photometry: 'absolute',
  manufacturer: 'Example',
  luminaire: 'Spot',
  lightSource: 'LED',
  lampCatalog: 'unspecified',
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
  luminousFluxLumens: 1000,
  efficacyLumensPerWatt: 83.3,
  beamAngleDegrees: 30,
  fieldAngleDegrees: 60,
  metricsStatus: 'supported',
};
const envmap: EnvmapAnalysisData = {
  kind: 'envmap',
  widthPixels: 2048,
  heightPixels: 1024,
  format: 'hdr',
  colorSpace: 'linear-srgb',
  projection: 'equirectangular',
  brightnessUnit: 'relative',
  calibration: null,
  minimumBrightness: 0.25,
  maximumBrightness: 1024,
  averageBrightness: 2,
  percentile01Brightness: 0.3,
  percentile99Brightness: 512,
  dynamicRangeStops: 12,
};
const analysis = (data: AssetAnalysisData = model): AssetAnalysis => ({
  schemaVersion: 1,
  sourceFileOid: 'a'.repeat(64),
  analyzerId: 'loa-test',
  analyzerVersion: '1',
  status: 'succeeded',
  analyzedAt: '2026-11-06T13:00:00.000Z',
  data,
  validation: null,
  diagnostics: [],
});

describe('asset version analysis contracts', () => {
  it.each([model, material, light, envmap])('preserves typed $kind data and schema provenance', (data) => {
    const value = analysis(data);
    expect(assetAnalysisSchema.parse(value)).toEqual(value);
  });

  it('rejects unknown discriminators and mismatched payloads', () => {
    expect(assetAnalysisDataSchema.safeParse({ ...model, kind: 'unknown' }).success).toBe(false);
    expect(assetAnalysisDataSchema.safeParse({ ...model, kind: 'material' }).success).toBe(false);
    expect(assetAnalysisDataSchema.safeParse({ ...material, kind: 'model' }).success).toBe(false);
  });

  it.each([NaN, Infinity, -Infinity, -1, 0.5])('rejects invalid counts %s', (count) => {
    expect(assetAnalysisSchema.safeParse(analysis({ ...model, meshCount: count })).success).toBe(false);
    expect(assetAnalysisSchema.safeParse(analysis({ ...material, nodeCount: count })).success).toBe(false);
    expect(assetAnalysisSchema.safeParse(analysis({ ...envmap, widthPixels: count })).success).toBe(false);
  });

  it.each([NaN, Infinity, -Infinity, -1])('rejects invalid measurements %s', (measurement) => {
    expect(
      assetAnalysisSchema.safeParse(
        analysis({ ...model, dimensions: { ...model.dimensions!, widthMeters: measurement } }),
      ).success,
    ).toBe(false);
    expect(assetAnalysisSchema.safeParse(analysis({ ...light, luminousFluxLumens: measurement })).success).toBe(false);
    expect(assetAnalysisSchema.safeParse(analysis({ ...envmap, averageBrightness: measurement })).success).toBe(false);
  });

  it('preserves zero counts and explicitly unavailable measurements', () => {
    expect(
      assetAnalysisSchema.parse(analysis({ ...model, dimensions: null, triangleCount: 0, textureCount: 0 })).data,
    ).toMatchObject({ dimensions: null, triangleCount: 0 });
    expect(
      assetAnalysisSchema.parse(
        analysis({
          ...light,
          luminousFluxLumens: null,
          beamAngleDegrees: null,
          fieldAngleDegrees: null,
          metricsStatus: 'unsupported',
        }),
      ).data,
    ).toMatchObject({ luminousFluxLumens: null, metricsStatus: 'unsupported' });
    expect(assetAnalysisSchema.parse(analysis({ ...envmap, dynamicRangeStops: null })).data).toMatchObject({
      dynamicRangeStops: null,
    });
  });

  it.each(['', 'a'.repeat(63), 'a'.repeat(65), 'g'.repeat(64), 'A'.repeat(64)])(
    'rejects malformed source OIDs %s',
    (sourceFileOid) => {
      expect(assetAnalysisSchema.safeParse({ ...analysis(), sourceFileOid }).success).toBe(false);
    },
  );

  it('rejects unknown schema versions and empty extractor provenance', () => {
    expect(assetAnalysisSchema.safeParse({ ...analysis(), schemaVersion: 2 }).success).toBe(false);
    expect(assetAnalysisSchema.safeParse({ ...analysis(), analyzerId: '' }).success).toBe(false);
    expect(assetAnalysisSchema.safeParse({ ...analysis(), analyzerVersion: '' }).success).toBe(false);
  });

  it('requires successful analysis data and a completion timestamp', () => {
    expect(assetAnalysisSchema.safeParse({ ...analysis(), data: null }).success).toBe(false);
    expect(assetAnalysisSchema.safeParse({ ...analysis(), analyzedAt: null }).success).toBe(false);
    expect(assetAnalysisSchema.safeParse({ ...analysis(), analyzedAt: '2026-11-06' }).success).toBe(false);
  });

  it.each(['pending', 'running'] as const)('represents %s separately from completed results', (status) => {
    const value = { ...analysis(), status, analyzedAt: null, data: null };
    expect(assetAnalysisSchema.parse(value)).toEqual(value);
    expect(assetAnalysisSchema.safeParse({ ...value, data: model }).success).toBe(false);
    expect(assetAnalysisSchema.safeParse({ ...value, analyzedAt: analysis().analyzedAt }).success).toBe(false);
  });

  it.each(['failed', 'unsupported'] as const)(
    'allows %s results without data and preserves partial failure data',
    (status) => {
      const value = {
        ...analysis(),
        status,
        data: null,
        diagnostics: [{ code: 'UNSUPPORTED_FORMAT', severity: 'error', message: 'No reader is available' }],
      };
      expect(assetAnalysisSchema.parse(value)).toEqual(value);
      expect(assetAnalysisSchema.safeParse({ ...value, analyzedAt: null }).success).toBe(false);
      if (status === 'failed') expect(assetAnalysisSchema.parse({ ...value, data: model }).data).toEqual(model);
    },
  );

  it('distinguishes successful extraction from invalid source content and preserves diagnostic locations', () => {
    const validation = {
      status: 'invalid' as const,
      validator: 'mtlx-core',
      validatorVersion: '0.6.0',
      rules: ['resources'],
      issues: [
        {
          code: 'RESOURCE_MISSING',
          severity: 'error' as const,
          message: 'Missing image',
          location: 'surface/image:file',
        },
      ],
    };
    const value = { ...analysis(material), validation };
    expect(assetAnalysisSchema.parse(value)).toEqual(value);
    expect(assetAnalysisSchema.safeParse({ ...value, validation: { ...validation, status: 'valid' } }).success).toBe(
      false,
    );
    expect(assetAnalysisSchema.safeParse({ ...value, validation: { ...validation, issues: [] } }).success).toBe(false);
    expect(
      assetAnalysisSchema.safeParse({
        ...value,
        validation: { ...validation, status: 'valid', issues: [{ ...validation.issues[0]!, severity: 'warning' }] },
      }).success,
    ).toBe(true);
    expect(
      assetAnalysisSchema.safeParse({ ...value, validation: { ...validation, status: 'unassessed', issues: [] } })
        .success,
    ).toBe(true);
  });

  it('requires calibration provenance before claiming physical environment brightness units', () => {
    expect(assetAnalysisSchema.safeParse(analysis({ ...envmap, brightnessUnit: 'cd/m2' })).success).toBe(false);
    expect(
      assetAnalysisSchema.safeParse(analysis({ ...envmap, brightnessUnit: 'cd/m2', calibration: ' ' })).success,
    ).toBe(false);
    expect(
      assetAnalysisSchema.parse(
        analysis({
          ...envmap,
          brightnessUnit: 'cd/m2',
          calibration: 'Measured luminance scale factor 12.5 cd/m² per linear unit',
        }),
      ).data,
    ).toMatchObject({ brightnessUnit: 'cd/m2' });
  });

  it('preserves texture inventory and distinguishes unknown metadata from zero bytes', () => {
    const texture = {
      id: 'texture-1',
      path: 'textures/base.png',
      widthPixels: 512,
      heightPixels: 256,
      format: 'png',
      mimeType: 'image/png',
      byteSize: 1024,
      colorSpace: 'srgb',
      mipLevelCount: 1,
      usages: ['baseColor'],
    };
    expect(assetTextureInfoSchema.parse(texture)).toEqual(texture);
    expect(
      assetTextureInfoSchema.parse({
        ...texture,
        widthPixels: null,
        heightPixels: null,
        format: null,
        mimeType: null,
        byteSize: null,
      }),
    ).toMatchObject({ widthPixels: null, byteSize: null });
    expect(assetTextureInfoSchema.parse({ ...texture, byteSize: 0 }).byteSize).toBe(0);
    expect(assetTextureInfoSchema.safeParse({ ...texture, byteSize: -1 }).success).toBe(false);
    expect(assetTextureInfoSchema.safeParse({ ...texture, widthPixels: Infinity }).success).toBe(false);
  });

  it.each([model, material, light, envmap])(
    'parses bounded $kind summary data without inventories or diagnostic arrays',
    (data) => {
      const full = analysis(data);
      const summary = assetAnalysisSummarySchema.parse({
        ...full,
        validationStatus: null,
        errorCount: 0,
        warningCount: 0,
        data: data.kind === 'material' ? { ...data, materialCount: data.materials.length } : data,
      });
      expect(summary.data?.kind).toBe(data.kind);
      expect(summary).not.toHaveProperty('diagnostics');
      expect(summary).not.toHaveProperty('validation');
      expect(summary.data).not.toHaveProperty('textures');
      expect(summary.data).not.toHaveProperty('metadata');
      expect(summary.data).not.toHaveProperty('materials');
      expect(summary.data).not.toHaveProperty('warnings');
      expect(summary.data).not.toHaveProperty('referencedTextures');
      expect(summary.data).not.toHaveProperty('beamAngles');
    },
  );

  it('allows analysis on version responses while preserving compatibility with unanalyzed versions', () => {
    const version = {
      id: 1,
      assetId: 2,
      version: '1.0.0',
      description: '',
      fileOid: 'a'.repeat(64),
      thumbnailOid: null,
      createdAt: '2026-11-06T13:00:00.000Z',
      createdByUserId: 1,
      createdByUserName: 'Tester',
      originalSize: 0,
    };
    expect(assetVersionResultSchema.parse({ ...version, analysis: analysis() }).analysis).toEqual(analysis());
    expect(assetVersionResultSchema.parse({ ...version, analysis: null }).analysis).toBeNull();
    expect(assetVersionResultSchema.parse(version).analysis).toBeUndefined();
    const { textures: _textures, ...data } = model;
    const full = analysis();
    const analysisSummary = assetAnalysisSummarySchema.parse({
      ...full,
      data,
      validationStatus: null,
      errorCount: 0,
      warningCount: 0,
    });
    const listing = assetVersionResultSchema.parse({ ...version, analysisSummary });
    expect(listing.analysisSummary).toEqual(analysisSummary);
    expect(listing.analysis).toBeUndefined();
  });
});
