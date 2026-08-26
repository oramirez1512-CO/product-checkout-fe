import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from './appSlice';
import { productReducer } from '@/features/product/productSlice';
import type { Product } from '@/features/product/types';
import { checkoutReducer } from '@/features/checkout/checkoutSlice';
import {
  buildPersistedSnapshot,
  clearCheckoutSnapshot,
  loadCheckoutSnapshot,
  saveCheckoutSnapshot,
} from '@/features/checkout/persistence';

function buildPreloadedState() {
  const saved = loadCheckoutSnapshot();
  if (!saved || saved.step === 'closed') {
    return undefined;
  }

  return {
    checkout: {
      step: saved.step,
      quantity: saved.quantity,
      customer: saved.customer,
      delivery: saved.delivery,
      card: saved.card,
      customerId: saved.customerId,
      deliveryId: saved.deliveryId,
      transactionId: saved.transactionId,
      transaction: saved.transaction,
      payError: saved.payError,
    },
    product: {
      items: [] as Product[],
      status: 'idle' as const,
      error: null as string | null,
      selectedId: saved.productSelectedId,
    },
  };
}

export function createAppStore() {
  const store = configureStore({
    reducer: {
      app: appReducer,
      product: productReducer,
      checkout: checkoutReducer,
    },
    preloadedState: buildPreloadedState(),
  });

  store.subscribe(() => {
    const state = store.getState();
    if (state.checkout.step === 'closed') {
      clearCheckoutSnapshot();
      return;
    }
    saveCheckoutSnapshot(
      buildPersistedSnapshot({
        step: state.checkout.step,
        quantity: state.checkout.quantity,
        customer: state.checkout.customer,
        delivery: state.checkout.delivery,
        card: state.checkout.card,
        customerId: state.checkout.customerId,
        deliveryId: state.checkout.deliveryId,
        transactionId: state.checkout.transactionId,
        transaction: state.checkout.transaction,
        payError: state.checkout.payError,
        productSelectedId: state.product.selectedId,
      }),
    );
  });

  return store;
}

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
