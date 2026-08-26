import type { CustomerDraft } from '@/shared/validators';
import type { DeliveryDraft } from '@/shared/validators/delivery';
import type { CardBrand } from '@/shared/validators/card';
import type { CheckoutStep, CheckoutCardMeta, TransactionResponse } from './types';

export const CHECKOUT_STORAGE_KEY = 'product-checkout:v1';

/** Safe card fields only — never persist PAN/CVV. */
export type PersistedCard = {
  brand: CardBrand;
  lastFour: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
};

export type PersistedCheckoutSnapshot = {
  version: 1;
  step: CheckoutStep;
  quantity: number;
  customer: CustomerDraft;
  delivery: DeliveryDraft;
  card: PersistedCard;
  customerId: string | null;
  deliveryId: string | null;
  transactionId: string | null;
  transaction: TransactionResponse | null;
  payError: string | null;
  productSelectedId: string | null;
};

export type RehydratedCheckout = {
  step: CheckoutStep;
  quantity: number;
  customer: CustomerDraft;
  delivery: DeliveryDraft;
  card: CheckoutCardMeta;
  customerId: string | null;
  deliveryId: string | null;
  transactionId: string | null;
  transaction: TransactionResponse | null;
  payError: string | null;
  productSelectedId: string | null;
};

const STEPS: CheckoutStep[] = [
  'closed',
  'form',
  'summary',
  'paying',
  'result',
];

function isStep(value: unknown): value is CheckoutStep {
  return typeof value === 'string' && STEPS.includes(value as CheckoutStep);
}

function sanitizeCard(card: CheckoutCardMeta): PersistedCard {
  return {
    brand: card.brand,
    lastFour: card.lastFour,
    expMonth: card.expMonth,
    expYear: card.expYear,
    cardHolder: card.cardHolder,
  };
}

function toCardMeta(persisted: PersistedCard): CheckoutCardMeta {
  return {
    brand: persisted.brand || 'unknown',
    lastFour: persisted.lastFour || '',
    number: '',
    cvc: '',
    expMonth: persisted.expMonth || '',
    expYear: persisted.expYear || '',
    cardHolder: persisted.cardHolder || '',
  };
}

/**
 * Normalize step after refresh:
 * - `paying` was in-flight → `summary` (user can tap Pay again after re-entering card)
 * - PAN/CVV are never restored (always empty after load)
 */
export function normalizeRehydratedStep(step: CheckoutStep): CheckoutStep {
  if (step === 'paying') {
    return 'summary';
  }
  return step;
}

export function buildPersistedSnapshot(input: {
  step: CheckoutStep;
  quantity: number;
  customer: CustomerDraft;
  delivery: DeliveryDraft;
  card: CheckoutCardMeta;
  customerId: string | null;
  deliveryId: string | null;
  transactionId: string | null;
  transaction: TransactionResponse | null;
  payError: string | null;
  productSelectedId: string | null;
}): PersistedCheckoutSnapshot {
  return {
    version: 1,
    step: input.step === 'paying' ? 'summary' : input.step,
    quantity: input.quantity,
    customer: input.customer,
    delivery: input.delivery,
    card: sanitizeCard(input.card),
    customerId: input.customerId,
    deliveryId: input.deliveryId,
    transactionId: input.transactionId,
    transaction: input.transaction,
    payError: input.payError,
    productSelectedId: input.productSelectedId,
  };
}

export function parsePersistedSnapshot(
  raw: unknown,
): RehydratedCheckout | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const data = raw as Partial<PersistedCheckoutSnapshot>;
  if (data.version !== 1 || !isStep(data.step)) {
    return null;
  }

  const cardRaw = data.card ?? {
    brand: 'unknown' as CardBrand,
    lastFour: '',
    expMonth: '',
    expYear: '',
    cardHolder: '',
  };
  const persistedCard: PersistedCard = {
    brand: (cardRaw.brand as CardBrand) || 'unknown',
    lastFour: String(cardRaw.lastFour ?? ''),
    expMonth: String(cardRaw.expMonth ?? ''),
    expYear: String(cardRaw.expYear ?? ''),
    cardHolder: String(cardRaw.cardHolder ?? ''),
  };

  const step = normalizeRehydratedStep(data.step);

  return {
    step,
    quantity:
      typeof data.quantity === 'number' && data.quantity >= 1
        ? Math.floor(data.quantity)
        : 1,
    customer: {
      email: String(data.customer?.email ?? ''),
      fullName: String(data.customer?.fullName ?? ''),
      phone: String(data.customer?.phone ?? ''),
    },
    delivery: {
      address: String(data.delivery?.address ?? ''),
      city: String(data.delivery?.city ?? ''),
      region: String(data.delivery?.region ?? ''),
      postalCode: String(data.delivery?.postalCode ?? ''),
    },
    card: toCardMeta(persistedCard),
    customerId: data.customerId ?? null,
    deliveryId: data.deliveryId ?? null,
    transactionId: data.transactionId ?? null,
    transaction: data.transaction ?? null,
    payError: data.payError ?? null,
    productSelectedId: data.productSelectedId ?? null,
  };
}

export function loadCheckoutSnapshot(
  storage: Pick<Storage, 'getItem'> = localStorage,
): RehydratedCheckout | null {
  try {
    const raw = storage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parsePersistedSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCheckoutSnapshot(
  snapshot: PersistedCheckoutSnapshot,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function clearCheckoutSnapshot(
  storage: Pick<Storage, 'removeItem'> = localStorage,
): void {
  try {
    storage.removeItem(CHECKOUT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
