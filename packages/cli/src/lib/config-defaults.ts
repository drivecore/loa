import { getConfig } from './config.ts';
import type { CliDeps } from './deps.ts';

/**
 * Defaults refreshed at invocation start and read synchronously by option builders.
 */
let cachedDefaults: {
  org?: string;
  project?: string;
} = {};

export async function initializeConfigDefaults(deps: Pick<CliDeps, 'persistentConfig' | 'envVars'>): Promise<void> {
  try {
    const config = await getConfig(deps);
    cachedDefaults = {
      org: config.org,
      project: config.project,
    };
  } catch {
    cachedDefaults = {};
  }
}

export function getOrg(): string | undefined {
  return cachedDefaults.org;
}

export function getProject(): string | undefined {
  return cachedDefaults.project;
}
