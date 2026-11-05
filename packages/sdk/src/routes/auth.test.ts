import axios, { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { refreshAccessToken } from './auth.js';

const props = { body: { refreshToken: 'ut_test' } };
const failure = (status?: number, code?: string) =>
  new AxiosError(
    'refresh failed',
    code,
    undefined,
    undefined,
    status === undefined ? undefined : { status, data: {}, headers: {}, statusText: '', config: {} as never },
  );

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('token refresh retries', () => {
  it.each([500, 502, 503, 504, 'ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'EAI_AGAIN', 'ERR_NETWORK'])(
    'recovers from %s',
    async (reason) => {
      vi.useFakeTimers();
      const post = vi
        .spyOn(axios, 'post')
        .mockRejectedValueOnce(typeof reason === 'number' ? failure(reason) : failure(undefined, reason))
        .mockResolvedValueOnce({ data: { accessToken: 'recovered' } });
      const result = refreshAccessToken('https://example.test', props, true);
      await vi.runAllTimersAsync();
      await expect(result).resolves.toEqual({ accessToken: 'recovered' });
      expect(post).toHaveBeenCalledTimes(2);
      expect(post).toHaveBeenLastCalledWith('https://example.test/auth/refresh-access-token', props.body);
    },
  );

  it('stops after three attempts and preserves the final error', async () => {
    vi.useFakeTimers();
    const error = failure(500);
    const post = vi.spyOn(axios, 'post').mockRejectedValue(error);
    const result = expect(refreshAccessToken('https://example.test', props)).rejects.toBe(error);
    await vi.runAllTimersAsync();
    await result;
    expect(post).toHaveBeenCalledTimes(3);
  });

  it.each([400, 401, 403, 404, 429, 501, 'ERR_CANCELED', 'ENOTFOUND'])('does not retry %s', async (reason) => {
    const error = typeof reason === 'number' ? failure(reason) : failure(undefined, reason);
    const post = vi.spyOn(axios, 'post').mockRejectedValue(error);
    await expect(refreshAccessToken('https://example.test', props)).rejects.toBe(error);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('does not retry response validation failures', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 42 } });
    await expect(refreshAccessToken('https://example.test', props, true)).rejects.toThrow();
    expect(post).toHaveBeenCalledTimes(1);
  });
});
