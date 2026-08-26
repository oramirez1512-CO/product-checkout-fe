import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CardDraft,
  CheckoutDraft,
  CustomerDraft,
} from '@/shared/validators';
import type { DeliveryDraft } from '@/shared/validators/delivery';
import {
  cardLastFour,
  detectCardBrand,
  onlyDigits,
} from '@/shared/validators/card';
import type { TransactionResponse, CheckoutCardMeta } from './types';
import { runPayFlow } from './runPayFlow';

export type CheckoutStep =
  | 'closed'
  | 'form'
  | 'summary'
  | 'paying'
  | 'result';

export type { CheckoutCardMeta };

type CheckoutState = {
  step: CheckoutStep;
  /** MVP: single-unit purchase. */
  quantity: number;
  customer: CustomerDraft;
  delivery: DeliveryDraft;
  card: CheckoutCardMeta;
  customerId: string | null;
  deliveryId: string | null;
  transactionId: string | null;
  transaction: TransactionResponse | null;
  payError: string | null;
};

export const emptyCustomer = (): CustomerDraft => ({
  email: '',
  fullName: '',
  phone: '',
});

export const emptyDelivery = (): DeliveryDraft => ({
  address: '',
  city: '',
  region: '',
  postalCode: '',
});

export const emptyCardMeta = (): CheckoutCardMeta => ({
  brand: 'unknown',
  lastFour: '',
  number: '',
  cvc: '',
  expMonth: '',
  expYear: '',
  cardHolder: '',
});

const initialState: CheckoutState = {
  step: 'closed',
  quantity: 1,
  customer: emptyCustomer(),
  delivery: emptyDelivery(),
  card: emptyCardMeta(),
  customerId: null,
  deliveryId: null,
  transactionId: null,
  transaction: null,
  payError: null,
};

function toCardMeta(card: CardDraft): CheckoutCardMeta {
  const number = onlyDigits(card.number);
  return {
    brand: detectCardBrand(number),
    lastFour: cardLastFour(number),
    number,
    cvc: onlyDigits(card.cvc),
    expMonth: onlyDigits(card.expMonth).padStart(2, '0').slice(-2),
    expYear: onlyDigits(card.expYear),
    cardHolder: card.cardHolder.trim(),
  };
}

function clearSensitiveCard(card: CheckoutCardMeta): CheckoutCardMeta {
  return {
    ...card,
    number: '',
    cvc: '',
  };
}

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    openCheckout(state) {
      state.step = 'form';
      state.payError = null;
      state.transaction = null;
      state.transactionId = null;
    },
    closeCheckout(state) {
      state.step = 'closed';
    },
    updateCustomerDraft(
      state,
      action: PayloadAction<Partial<CustomerDraft>>,
    ) {
      state.customer = { ...state.customer, ...action.payload };
      if (
        state.step === 'summary' ||
        state.step === 'paying' ||
        state.step === 'result'
      ) {
        state.step = 'form';
      }
    },
    updateDeliveryDraft(
      state,
      action: PayloadAction<Partial<DeliveryDraft>>,
    ) {
      state.delivery = { ...state.delivery, ...action.payload };
      if (
        state.step === 'summary' ||
        state.step === 'paying' ||
        state.step === 'result'
      ) {
        state.step = 'form';
      }
    },
    updateCardDraft(state, action: PayloadAction<Partial<CardDraft>>) {
      const merged: CardDraft = {
        number: action.payload.number ?? state.card.number,
        cvc: action.payload.cvc ?? state.card.cvc,
        expMonth: action.payload.expMonth ?? state.card.expMonth,
        expYear: action.payload.expYear ?? state.card.expYear,
        cardHolder: action.payload.cardHolder ?? state.card.cardHolder,
      };
      state.card = toCardMeta(merged);
      if (
        state.step === 'summary' ||
        state.step === 'paying' ||
        state.step === 'result'
      ) {
        state.step = 'form';
      }
    },
    submitCheckoutDraft(state, action: PayloadAction<CheckoutDraft>) {
      state.customer = {
        email: action.payload.customer.email.trim().toLowerCase(),
        fullName: action.payload.customer.fullName.trim(),
        phone: action.payload.customer.phone.trim(),
      };
      state.delivery = {
        address: action.payload.delivery.address.trim(),
        city: action.payload.delivery.city.trim(),
        region: action.payload.delivery.region.trim(),
        postalCode: action.payload.delivery.postalCode.trim(),
      };
      state.card = toCardMeta(action.payload.card);
      state.step = 'summary';
      state.payError = null;
    },
    backToCheckoutForm(state) {
      state.step = 'form';
    },
    backToSummary(state) {
      if (state.step === 'result') {
        state.step = 'summary';
        state.payError = null;
      }
    },
    resetCheckout() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runPayFlow.pending, (state) => {
        state.step = 'paying';
        state.payError = null;
      })
      .addCase(runPayFlow.fulfilled, (state, action) => {
        state.customerId = action.payload.customerId;
        state.deliveryId = action.payload.deliveryId;
        state.transactionId = action.payload.transaction.id;
        state.transaction = action.payload.transaction;
        state.card = clearSensitiveCard(state.card);
        state.step = 'result';
        state.payError = null;
      })
      .addCase(runPayFlow.rejected, (state, action) => {
        state.step = 'result';
        state.payError =
          typeof action.payload === 'string'
            ? action.payload
            : action.error.message ?? 'Payment failed';
        state.card = clearSensitiveCard(state.card);
      });
  },
});

export const {
  openCheckout,
  closeCheckout,
  updateCustomerDraft,
  updateDeliveryDraft,
  updateCardDraft,
  submitCheckoutDraft,
  backToCheckoutForm,
  backToSummary,
  resetCheckout,
} = checkoutSlice.actions;

export const checkoutReducer = checkoutSlice.reducer;

export function selectCheckoutDraft(state: {
  checkout: CheckoutState;
}): CheckoutDraft {
  return {
    customer: state.checkout.customer,
    delivery: state.checkout.delivery,
    card: {
      number: state.checkout.card.number,
      cvc: state.checkout.card.cvc,
      expMonth: state.checkout.card.expMonth,
      expYear: state.checkout.card.expYear,
      cardHolder: state.checkout.card.cardHolder,
    },
  };
}
