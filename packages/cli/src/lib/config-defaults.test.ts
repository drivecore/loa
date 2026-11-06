import { expect, it } from 'vitest';
import { MemoryPersistentConfig } from './persistent-config.ts';
import { MemoryEnvVars } from './env-vars.ts';
import { getOrg, getProject, initializeConfigDefaults } from './config-defaults.ts';

it('refreshes configured defaults when a CLI invocation uses new configuration', async () => {
  const persistentConfig = new MemoryPersistentConfig({ org: 'first-org', project: 'first-project' });
  const deps = { persistentConfig, envVars: new MemoryEnvVars() };
  await initializeConfigDefaults(deps);
  await persistentConfig.set({ org: 'second-org', project: 'second-project' });
  await initializeConfigDefaults(deps);
  expect(getOrg()).toBe('second-org');
  expect(getProject()).toBe('second-project');
});
