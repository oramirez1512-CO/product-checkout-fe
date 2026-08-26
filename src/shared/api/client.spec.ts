import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ApiError, apiRequest } from './client';

describe('apiRequest', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.VITE_API_URL;
    delete process.env.VITE_API_KEY;
  });

  it('GETs JSON and sends x-api-key when provided', async () => {
    // Arrange
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: 'ok' }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    // Act
    const result = await apiRequest<{ status: string }>('/health', {
      apiKey: 'test-key',
    });

    // Assert
    expect(result).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-api-key': 'test-key',
        }),
      }),
    );
  });

  it('throws ApiError on non-OK responses', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Invalid or missing API key' }),
    })) as unknown as typeof fetch;

    await expect(apiRequest('/products', { apiKey: null })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
