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
  type CardBrand,
} from '@/shared/validators/card';

export type CheckoutStep = 'closed' | 'form' | 'ready';

export type CheckoutCardMeta = {
  brand: CardBrand;
  lastFour: string;
  /** Present while form is open / until pay; never write to localStorage later. */
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
};

type CheckoutState = {
  step: CheckoutStep;
  customer: CustomerDraft;
  delivery: DeliveryDraft;
  card: CheckoutCardMeta;
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
  customer: emptyCustomer(),
  delivery: emptyDelivery(),
  card: emptyCardMeta(),
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

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    openCheckout(state) {
      state.step = 'form';
    },
    closeCheckout(state) {
      state.step = 'closed';
    },
    updateCustomerDraft(
      state,
      action: PayloadAction<Partial<CustomerDraft>>,
    ) {
      state.customer = { ...state.customer, ...action.payload };
      if (state.step === 'ready') {
        state.step = 'form';
      }
    },
    updateDeliveryDraft(
      state,
      action: PayloadAction<Partial<DeliveryDraft>>,
    ) {
      state.delivery = { ...state.delivery, ...action.payload };
      if (state.step === 'ready') {
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
      if (state.step === 'ready') {
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
      state.step = 'ready';
    },
    resetCheckout() {
      return initialState;
    },
  },
});

export const {
  openCheckout,
  closeCheckout,
  updateCustomerDraft,
  updateDeliveryDraft,
  updateCardDraft,
  submitCheckoutDraft,
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
