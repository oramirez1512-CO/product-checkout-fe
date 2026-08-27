import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { ApiError } from '@/shared/api/client';
import { productReducer } from '@/features/product/productSlice';
import {
  backToCheckoutForm,
  backToSummary,
  checkoutReducer,
  closeCheckout,
  openCheckout,
  resetCheckout,
  selectCheckoutDraft,
  submitCheckoutDraft,
  updateCardDraft,
  updateCustomerDraft,
  updateDeliveryDraft,
} from './checkoutSlice';
import { runPayFlow } from './runPayFlow';
import * as checkoutApi from './api';

jest.mock('./api', () => ({
  upsertCustomer: jest.fn(),
  createDelivery: jest.fn(),
  createPendingTransaction: jest.fn(),
  payTransaction: jest.fn(),
}));

const mockedApi = checkoutApi as unknown as {
  upsertCustomer: {
    mockResolvedValue: (v: unknown) => void;
    mockRejectedValue: (v: unknown) => void;
    mock: { calls: unknown[] };
  };
  createDelivery: { mockResolvedValue: (v: unknown) => void };
  createPendingTransaction: { mockResolvedValue: (v: unknown) => void };
  payTransaction: {
    mockResolvedValue: (v: unknown) => void;
    mockRejectedValue: (v: unknown) => void;
  };
};

function buildStore() {
  return configureStore({
    reducer: {
      checkout: checkoutReducer,
      product: productReducer,
    },
  });
}

const futureYear = String(new Date().getFullYear() + 2);

const validDraft = () => ({
  customer: { email: 'Ada@X.co', fullName: 'Ada', phone: '' },
  delivery: {
    address: 'Calle 1',
    city: 'Bogotá',
    region: 'Cund',
    postalCode: '',
  },
  card: {
    number: '4242 4242 4242 4242',
    cvc: '123',
    expMonth: '1',
    expYear: futureYear,
    cardHolder: ' Ada Buyer ',
  },
});

const paidTx = {
  id: 'tx-1',
  reference: 'ref-1',
  status: 'APPROVED' as const,
  productId: 'prod-1',
  customerId: 'cust-1',
  deliveryId: 'del-1',
  quantity: 1,
  amount: 100,
  baseFee: 3500,
  deliveryFee: 10000,
  total: 13600,
  currency: 'COP',
  providerTransactionId: 'prov-1',
  cardBrand: 'VISA',
  cardLastFour: '4242',
};

describe('checkoutSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens and closes the form step', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch(openCheckout());

    // Assert
    expect(store.getState().checkout.step).toBe('form');

    // Act
    store.dispatch(closeCheckout());

    // Assert
    expect(store.getState().checkout.step).toBe('closed');
  });

  it('patches customer and delivery drafts', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch(updateCustomerDraft({ email: 'a@b.co', fullName: 'Ada' }));
    store.dispatch(updateDeliveryDraft({ city: 'Bogotá' }));

    // Assert
    expect(store.getState().checkout.customer.email).toBe('a@b.co');
    expect(store.getState().checkout.delivery.city).toBe('Bogotá');
  });

  it('derives brand and last4 from card draft', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch(
      updateCardDraft({
        number: '5555555555554444',
        cvc: '123',
        expMonth: '12',
        expYear: futureYear,
        cardHolder: 'Ada',
      }),
    );

    // Assert
    expect(store.getState().checkout.card.brand).toBe('mastercard');
    expect(store.getState().checkout.card.lastFour).toBe('4444');
  });

  it('submitCheckoutDraft opens summary and normalizes email', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(openCheckout());

    // Act
    store.dispatch(submitCheckoutDraft(validDraft()));

    // Assert
    const state = store.getState().checkout;
    expect(state.step).toBe('summary');
    expect(state.customer.email).toBe('ada@x.co');
    expect(state.card.expMonth).toBe('01');
    expect(state.card.expYear).toBe(futureYear.slice(-2));
    expect(state.card.cardHolder).toBe('Ada Buyer');
    expect(selectCheckoutDraft(store.getState()).card.number).toBe(
      '4242424242424242',
    );
  });

  it('runPayFlow happy path stores transaction and clears PAN/CVV', async () => {
    // Arrange
    const store = buildStore();
    store.dispatch({
      type: 'product/fetchProducts/fulfilled',
      payload: [{ id: 'prod-1', name: 'A', description: '', price: 1, stock: 1, imageUrl: null }],
    });
    store.dispatch(submitCheckoutDraft(validDraft()));
    mockedApi.upsertCustomer.mockResolvedValue({
      id: 'cust-1',
      email: 'ada@x.co',
      fullName: 'Ada',
      phone: null,
    });
    mockedApi.createDelivery.mockResolvedValue({
      id: 'del-1',
      customerId: 'cust-1',
      address: 'Calle 1',
      city: 'Bogotá',
      region: 'Cund',
      postalCode: null,
    });
    mockedApi.createPendingTransaction.mockResolvedValue({
      ...paidTx,
      status: 'PENDING',
    });
    mockedApi.payTransaction.mockResolvedValue(paidTx);

    // Act
    await store.dispatch(runPayFlow());

    // Assert
    const state = store.getState().checkout;
    expect(state.step).toBe('result');
    expect(state.transaction?.status).toBe('APPROVED');
    expect(state.customerId).toBe('cust-1');
    expect(state.deliveryId).toBe('del-1');
    expect(state.card.number).toBe('');
    expect(state.card.cvc).toBe('');
    expect(state.card.lastFour).toBe('4242');
  });

  it('runPayFlow rejection lands on result with payError', async () => {
    // Arrange
    const store = buildStore();
    store.dispatch({
      type: 'product/fetchProducts/fulfilled',
      payload: [{ id: 'prod-1', name: 'A', description: '', price: 1, stock: 1, imageUrl: null }],
    });
    store.dispatch(submitCheckoutDraft(validDraft()));
    mockedApi.upsertCustomer.mockRejectedValue(new ApiError('boom', 500));

    // Act
    await store.dispatch(runPayFlow());

    // Assert
    expect(store.getState().checkout.step).toBe('result');
    expect(store.getState().checkout.payError).toBe('boom');
  });

  it('backToSummary returns from result', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(submitCheckoutDraft(validDraft()));
    store.dispatch({
      type: runPayFlow.rejected.type,
      payload: 'fail',
      error: { message: 'fail' },
    });

    // Act
    store.dispatch(backToSummary());

    // Assert
    expect(store.getState().checkout.step).toBe('summary');
  });

  it('backToCheckoutForm returns to form from summary', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(submitCheckoutDraft(validDraft()));

    // Act
    store.dispatch(backToCheckoutForm());

    // Assert
    expect(store.getState().checkout.step).toBe('form');
  });

  it('resetCheckout clears state', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(openCheckout());

    // Act
    store.dispatch(resetCheckout());

    // Assert
    expect(store.getState().checkout.step).toBe('closed');
    expect(store.getState().checkout.customer.email).toBe('');
    expect(store.getState().checkout.quantity).toBe(1);
  });

  it('editing drafts from summary returns to form', () => {
    // Arrange
    const store = buildStore();
    store.dispatch(submitCheckoutDraft(validDraft()));
    expect(store.getState().checkout.step).toBe('summary');

    // Act / Assert
    store.dispatch(updateCustomerDraft({ fullName: 'Ada Updated' }));
    expect(store.getState().checkout.step).toBe('form');

    store.dispatch(submitCheckoutDraft(validDraft()));
    store.dispatch(updateDeliveryDraft({ city: 'Medellín' }));
    expect(store.getState().checkout.step).toBe('form');

    store.dispatch(submitCheckoutDraft(validDraft()));
    store.dispatch(updateCardDraft({ cardHolder: 'Ada Buyer' }));
    expect(store.getState().checkout.step).toBe('form');
  });

  it('runPayFlow rejects when no product is selected', async () => {
    // Arrange
    const store = buildStore();
    store.dispatch(submitCheckoutDraft(validDraft()));

    // Act
    await store.dispatch(runPayFlow());

    // Assert
    expect(store.getState().checkout.payError).toBe('No product selected');
  });

  it('runPayFlow rejects when card secrets are missing after restore', async () => {
    // Arrange
    const store = buildStore();
    store.dispatch({
      type: 'product/fetchProducts/fulfilled',
      payload: [{ id: 'prod-1', name: 'A', description: '', price: 1, stock: 1, imageUrl: null }],
    });
    store.dispatch(submitCheckoutDraft(validDraft()));
    store.dispatch({
      type: runPayFlow.fulfilled.type,
      payload: {
        customerId: 'c1',
        deliveryId: 'd1',
        transaction: paidTx,
      },
    });
    // After pay, PAN/CVC are cleared (same as persistence restore).
    store.dispatch(backToSummary());

    // Act
    await store.dispatch(runPayFlow());

    // Assert
    expect(store.getState().checkout.payError).toBe('Card details are incomplete');
  });

  it('runPayFlow rejects short cardholder before calling API', async () => {
    // Arrange
    const store = buildStore();
    store.dispatch({
      type: 'product/fetchProducts/fulfilled',
      payload: [{ id: 'prod-1', name: 'A', description: '', price: 1, stock: 1, imageUrl: null }],
    });
    store.dispatch(submitCheckoutDraft(validDraft()));
    store.dispatch(
      updateCardDraft({
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: futureYear,
        cardHolder: 'Ada',
      }),
    );

    // Act
    await store.dispatch(runPayFlow());

    // Assert
    expect(store.getState().checkout.payError).toMatch(/at least 5/i);
    expect(mockedApi.upsertCustomer.mock.calls).toHaveLength(0);
  });

  it('runPayFlow maps generic Error and unknown failures', async () => {
    // Arrange
    const store = buildStore();
    store.dispatch({
      type: 'product/fetchProducts/fulfilled',
      payload: [{ id: 'prod-1', name: 'A', description: '', price: 1, stock: 1, imageUrl: null }],
    });
    store.dispatch(submitCheckoutDraft(validDraft()));
    mockedApi.upsertCustomer.mockRejectedValue(new Error('timeout'));

    // Act
    await store.dispatch(runPayFlow());

    // Assert
    expect(store.getState().checkout.payError).toBe('timeout');

    // Arrange unknown throw
    store.dispatch(submitCheckoutDraft(validDraft()));
    mockedApi.upsertCustomer.mockRejectedValue('not-an-error');

    // Act
    await store.dispatch(runPayFlow());

    // Assert
    expect(store.getState().checkout.payError).toBe('Payment failed');
  });

  it('runPayFlow.rejected without payload uses error.message', () => {
    // Arrange
    const store = buildStore();

    // Act
    store.dispatch({
      type: runPayFlow.rejected.type,
      error: { message: 'aborted' },
    });

    // Assert
    expect(store.getState().checkout.payError).toBe('aborted');
  });
});
