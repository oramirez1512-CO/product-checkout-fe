import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ApiError, apiRequest, getHealth } from './client';
import { injectAppEnv } from '../config/env';

describe('apiRequest', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
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

  it('POSTs JSON body with Content-Type', async () => {
    // Arrange
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: '1' }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    // Act
    await apiRequest('/customers', {
      method: 'POST',
      body: { email: 'a@b.co' },
      apiKey: null,
    });

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/customers'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.co' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('uses injected env api key by default', async () => {
    // Arrange
    injectAppEnv({
      VITE_API_URL: 'http://localhost:3000',
      VITE_API_KEY: 'from-env',
    });
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '{}',
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    // Act
    await apiRequest('/products');

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'from-env' }),
      }),
    );
  });

  it('keeps non-JSON error bodies and throws ApiError', async () => {
    // Arrange
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => 'plain failure',
    })) as unknown as typeof fetch;

    // Act / Assert
    await expect(apiRequest('/x', { apiKey: null })).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Request failed (500)',
    });
  });

  it('throws ApiError on non-OK responses with message', async () => {
    // Arrange
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Invalid or missing API key' }),
    })) as unknown as typeof fetch;

    // Act / Assert
    await expect(
      apiRequest('/products', { apiKey: null }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('getHealth calls /health', async () => {
    // Arrange
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: 'ok' }),
    })) as unknown as typeof fetch;

    // Act / Assert
    await expect(getHealth()).resolves.toEqual({ status: 'ok' });
  });

  it('prefixes path without leading slash', async () => {
    // Arrange
    injectAppEnv({ VITE_API_URL: 'http://localhost:3000' });
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '',
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    // Act
    await expect(apiRequest('products', { apiKey: null })).resolves.toBeNull();

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/products',
      expect.any(Object),
    );
  });

  it('keeps non-JSON success bodies as text', async () => {
    // Arrange
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'not-json',
    })) as unknown as typeof fetch;

    // Act / Assert
    await expect(apiRequest('/raw', { apiKey: null })).resolves.toBe('not-json');
  });

  it('falls back when error JSON has non-string message', async () => {
    // Arrange
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 42 }),
    })) as unknown as typeof fetch;

    // Act / Assert
    await expect(apiRequest('/x', { apiKey: null })).rejects.toMatchObject({
      message: 'Request failed (400)',
      status: 400,
    });
  });
});
