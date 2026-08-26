import type { CardBrand } from '@/shared/validators/card';

export type CheckoutStep =
  | 'closed'
  | 'form'
  | 'summary'
  | 'paying'
  | 'result';

export type CustomerResponse = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
};

export type DeliveryResponse = {
  id: string;
  customerId: string;
  address: string;
  city: string;
  region: string;
  postalCode: string | null;
};

export type TransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'ERROR'
  | string;

export type TransactionResponse = {
  id: string;
  reference: string;
  status: TransactionStatus;
  productId: string;
  customerId: string;
  deliveryId: string;
  quantity: number;
  amount: number;
  baseFee: number;
  deliveryFee: number;
  total: number;
  currency: string;
  providerTransactionId: string | null;
  cardBrand: string | null;
  cardLastFour: string | null;
};

/** Card draft kept in Redux for the pay call; clear PAN/CVV after pay. */
export type CheckoutCardMeta = {
  brand: CardBrand;
  lastFour: string;
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
};
