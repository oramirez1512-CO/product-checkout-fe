import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { apiRequest } from '@/shared/api/client';
import {
  createDelivery,
  createPendingTransaction,
  payTransaction,
  upsertCustomer,
} from './api';

jest.mock('@/shared/api/client', () => ({
  apiRequest: jest.fn(),
}));

const mockedRequest = apiRequest as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mock: { calls: unknown[][] };
};

describe('checkout api', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('upsertCustomer posts body', async () => {
    // Arrange
    mockedRequest.mockResolvedValue({ id: '1' });

    // Act
    await upsertCustomer({ email: 'a@b.co', fullName: 'Ada', phone: '' });

    // Assert
    expect(mockedRequest.mock.calls[0]?.[0]).toBe('/customers');
    expect(mockedRequest.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        body: { email: 'a@b.co', fullName: 'Ada', phone: null },
      }),
    );
  });

  it('createDelivery posts body', async () => {
    // Arrange
    mockedRequest.mockResolvedValue({ id: 'd' });

    // Act
    await createDelivery({
      customerId: 'c',
      address: 'a',
      city: 'b',
      region: 'r',
      postalCode: '110111',
    });

    // Assert
    expect(mockedRequest.mock.calls[0]?.[0]).toBe('/deliveries');
  });

  it('createPendingTransaction and payTransaction hit transactions routes', async () => {
    // Arrange
    mockedRequest.mockResolvedValue({ id: 't' });

    // Act
    await createPendingTransaction({
      productId: 'p',
      customerId: 'c',
      deliveryId: 'd',
      quantity: 1,
    });
    await payTransaction('t', {
      number: '4242424242424242',
      cvc: '123',
      expMonth: '12',
      expYear: '2030',
      cardHolder: 'Ada',
    });

    // Assert
    expect(mockedRequest.mock.calls[0]?.[0]).toBe('/transactions');
    expect(mockedRequest.mock.calls[1]?.[0]).toBe('/transactions/t/pay');
  });
});
