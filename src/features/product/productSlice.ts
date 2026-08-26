import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { ApiError } from '@/shared/api/client';
import { listProducts } from './api';
import type { Product } from './types';

export type ProductStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type ProductState = {
  items: Product[];
  status: ProductStatus;
  error: string | null;
  /** Selected for checkout (stage 3+). */
  selectedId: string | null;
};

const initialState: ProductState = {
  items: [],
  status: 'idle',
  error: null,
  selectedId: null,
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (_, { signal, rejectWithValue }) => {
    try {
      return await listProducts(signal);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to load products';
      return rejectWithValue(message);
    }
  },
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<string>) {
      state.selectedId = action.payload;
    },
    clearProductError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        if (
          state.selectedId &&
          !action.payload.some((p) => p.id === state.selectedId)
        ) {
          state.selectedId = null;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error.message ?? 'Failed to load products';
      });
  },
});

export const { selectProduct, clearProductError } = productSlice.actions;
export const productReducer = productSlice.reducer;

export function selectPrimaryProduct(state: {
  product: ProductState;
}): Product | null {
  return state.product.items[0] ?? null;
}
