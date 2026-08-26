import { describe, expect, it, jest, afterEach } from '@jest/globals';
import { getProduct, listProducts } from './api';

describe('product api', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('listProducts hits GET /products', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    })) as unknown as typeof fetch;

    await listProducts();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
      expect.any(Object),
    );
  });

  it('getProduct hits GET /products/:id', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: '1',
          name: 'A',
          description: 'd',
          price: 1,
          stock: 1,
          imageUrl: null,
        }),
    })) as unknown as typeof fetch;

    const product = await getProduct('1');
    expect(product.name).toBe('A');
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toContain(
      '/products/1',
    );
  });
});
