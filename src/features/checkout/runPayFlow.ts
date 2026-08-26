import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiError } from '@/shared/api/client';
import {
  createDelivery,
  createPendingTransaction,
  payTransaction,
  upsertCustomer,
} from './api';
import type { CustomerDraft } from '@/shared/validators';
import type { DeliveryDraft } from '@/shared/validators/delivery';
import type { CheckoutCardMeta, TransactionResponse } from './types';

type PayFlowGetState = {
  checkout: {
    customer: CustomerDraft;
    delivery: DeliveryDraft;
    card: CheckoutCardMeta;
    quantity: number;
  };
  product: {
    selectedId: string | null;
    items: Array<{ id: string }>;
  };
};

export type PayFlowResult = {
  customerId: string;
  deliveryId: string;
  transaction: TransactionResponse;
};

/**
 * Orchestrates the BE checkout sequence:
 * customer → delivery → PENDING transaction → /pay.
 */
export const runPayFlow = createAsyncThunk<
  PayFlowResult,
  void,
  { rejectValue: string }
>('checkout/runPayFlow', async (_, { getState, rejectWithValue }) => {
  const state = getState() as PayFlowGetState;
  const { customer, delivery, card, quantity } = state.checkout;
  const productId =
    state.product.selectedId ?? state.product.items[0]?.id ?? null;

  if (!productId) {
    return rejectWithValue('No product selected');
  }
  if (!card.number || !card.cvc || !card.cardHolder) {
    return rejectWithValue('Card details are incomplete');
  }

  try {
    const customerRes = await upsertCustomer({
      email: customer.email,
      fullName: customer.fullName,
      phone: customer.phone || null,
    });

    const deliveryRes = await createDelivery({
      customerId: customerRes.id,
      address: delivery.address,
      city: delivery.city,
      region: delivery.region,
      postalCode: delivery.postalCode || null,
    });

    const pending = await createPendingTransaction({
      productId,
      customerId: customerRes.id,
      deliveryId: deliveryRes.id,
      quantity,
    });

    const paid = await payTransaction(pending.id, {
      number: card.number,
      cvc: card.cvc,
      expMonth: card.expMonth,
      expYear: card.expYear,
      cardHolder: card.cardHolder,
      installments: 1,
    });

    return {
      customerId: customerRes.id,
      deliveryId: deliveryRes.id,
      transaction: paid,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Payment failed');
  }
});
