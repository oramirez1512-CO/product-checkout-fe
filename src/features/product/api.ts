import { apiRequest } from '@/shared/api/client';
import type { Product } from './types';

export function listProducts(signal?: AbortSignal): Promise<Product[]> {
  return apiRequest<Product[]>('/products', { signal });
}

export function getProduct(
  id: string,
  signal?: AbortSignal,
): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, { signal });
}
