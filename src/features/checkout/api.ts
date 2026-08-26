import { apiRequest } from '@/shared/api/client';
import type {
  CustomerResponse,
  DeliveryResponse,
  TransactionResponse,
} from './types';

export function upsertCustomer(body: {
  email: string;
  fullName: string;
  phone?: string | null;
}): Promise<CustomerResponse> {
  return apiRequest<CustomerResponse>('/customers', {
    method: 'POST',
    body: {
      email: body.email,
      fullName: body.fullName,
      phone: body.phone?.trim() ? body.phone.trim() : null,
    },
  });
}

export function createDelivery(body: {
  customerId: string;
  address: string;
  city: string;
  region: string;
  postalCode?: string | null;
}): Promise<DeliveryResponse> {
  return apiRequest<DeliveryResponse>('/deliveries', {
    method: 'POST',
    body: {
      customerId: body.customerId,
      address: body.address,
      city: body.city,
      region: body.region,
      postalCode: body.postalCode?.trim() ? body.postalCode.trim() : null,
    },
  });
}

export function createPendingTransaction(body: {
  productId: string;
  customerId: string;
  deliveryId: string;
  quantity: number;
}): Promise<TransactionResponse> {
  return apiRequest<TransactionResponse>('/transactions', {
    method: 'POST',
    body,
  });
}

export function payTransaction(
  transactionId: string,
  card: {
    number: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
    installments?: number;
  },
): Promise<TransactionResponse> {
  return apiRequest<TransactionResponse>(`/transactions/${transactionId}/pay`, {
    method: 'POST',
    body: {
      number: card.number,
      cvc: card.cvc,
      expMonth: card.expMonth,
      expYear: card.expYear,
      cardHolder: card.cardHolder,
      installments: card.installments ?? 1,
    },
  });
}
