import { getAppEnv } from '../config/env';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Override default API key from env. */
  apiKey?: string | null;
};

/**
 * Minimal JSON client for product-checkout-be.
 * Sends `x-api-key` when `VITE_API_KEY` (or option) is set.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { apiUrl, apiKey: envKey } = getAppEnv();
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const apiKey = options.apiKey === undefined ? envKey : options.apiKey;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    method,
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsed === 'object' &&
      parsed !== null &&
      'message' in parsed &&
      typeof (parsed as { message: unknown }).message === 'string'
        ? (parsed as { message: string }).message
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, parsed);
  }

  return parsed as T;
}

export function getHealth(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>('/health');
}
