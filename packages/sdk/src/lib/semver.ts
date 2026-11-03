import * as z from 'zod';

// PostgreSQL integer components keep ordering and allocation identical on client and server.
const component = '(0|[1-9][0-9]*)';
export const versionPattern = `${component}\\.${component}\\.${component}`;
export const versionSelectorPattern = `(?:latest|${component}(?:\\.${component}(?:\\.${component})?)?)`;
const bounded = (value: string) => value === 'latest' || value.split('.').every((part) => Number(part) <= 2147483647);
export const assetVersionSchema = z
  .string()
  .regex(new RegExp(`^${versionPattern}$`), 'Expected major.minor.patch')
  .refine(bounded, 'Version component is too large');
export const assetVersionSelectorSchema = z
  .string()
  .regex(new RegExp(`^${versionSelectorPattern}$`), 'Expected latest, major, major.minor, or major.minor.patch')
  .refine(bounded, 'Version component is too large');
export type AssetVersionSelector = z.infer<typeof assetVersionSelectorSchema>;
export function parseAssetVersion(value: string): { major: number; minor: number; patch: number } {
  const [major, minor, patch] = assetVersionSchema.parse(value).split('.').map(Number);
  return { major: major!, minor: minor!, patch: patch! };
}
export function formatAssetVersion(value: { major: number; minor: number; patch: number }): string {
  return assetVersionSchema.parse(`${value.major}.${value.minor}.${value.patch}`);
}
