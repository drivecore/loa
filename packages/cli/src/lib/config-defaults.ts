import { getConfig } from './config.ts';
import type { CliDeps } from './deps.ts';

/**
 * Module-level cache for config defaults
 */
let cachedDefaults: {
  org?: string;
  project?: string;
} = {};

let initialized: boolean = false;

export async function initializeConfigDefaults(deps: CliDeps): Promise<void> {
  if (initialized) {
    return;
  }
  try {
    const config = await getConfig(deps);
    cachedDefaults = {
      org: config.org,
      project: config.project,
    };
    initialized = true;
  } catch {
    initialized = true;
  }
}

export function getOrg(): string | undefined {
  return cachedDefaults.org;
}

export function getProject(): string | undefined {
  return cachedDefaults.project;
}
