import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getAppEnv } from '@/shared/config/env';
import { formatMoney } from '@/shared/lib/money';
import { Button, Text } from '@/shared/ui/atoms';
import { cardBrandLabel } from '@/shared/validators';
import { selectPrimaryProduct } from '@/features/product/productSlice';
import {
  backToCheckoutForm,
  closeCheckout,
} from '../checkoutSlice';
import { estimateCheckoutTotals } from '../lib/totals';
import { runPayFlow } from '../runPayFlow';

export function PaymentSummary() {
  const dispatch = useAppDispatch();
  const step = useAppSelector((s) => s.checkout.step);
  const quantity = useAppSelector((s) => s.checkout.quantity);
  const customer = useAppSelector((s) => s.checkout.customer);
  const delivery = useAppSelector((s) => s.checkout.delivery);
  const card = useAppSelector((s) => s.checkout.card);
  const product = useAppSelector(selectPrimaryProduct);
  const fees = getAppEnv().fees;
  const paying = step === 'paying';

  if (!product) {
    return (
      <div className="payment-summary" role="alert">
        <Text as="h2" id="checkout-dialog-title" className="payment-summary__title">
          Summary unavailable
        </Text>
        <Text tone="muted">No product selected. Close and try Buy again.</Text>
        <div className="payment-summary__actions">
          <Button type="button" variant="secondary" onClick={() => dispatch(closeCheckout())}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const totals = estimateCheckoutTotals({
    unitPrice: product.price,
    quantity,
    baseFee: fees.baseFee,
    deliveryFee: fees.deliveryFee,
  });

  if (paying) {
    return (
      <div className="payment-summary payment-summary--paying" role="status">
        <Text as="h2" id="checkout-dialog-title" className="payment-summary__title">
          Processing payment…
        </Text>
        <Text tone="muted">
          Creating customer, delivery, and pending transaction, then charging the
          card. Please wait.
        </Text>
      </div>
    );
  }

  return (
    <div className="payment-summary">
      <header className="payment-summary__header">
        <Text as="h2" id="checkout-dialog-title" className="payment-summary__title">
          Payment summary
        </Text>
        <Text tone="muted">
          Review totals before paying. Fees shown are estimates; the API is the
          source of truth.
        </Text>
      </header>

      <section className="payment-summary__block" aria-label="Product">
        <Text className="payment-summary__product">{product.name}</Text>
        <Text tone="muted">
          Qty {totals.quantity} × {formatMoney(totals.unitPrice)}
        </Text>
      </section>

      <dl className="payment-summary__totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(totals.amount)}</dd>
        </div>
        <div>
          <dt>Base fee</dt>
          <dd>{formatMoney(totals.baseFee)}</dd>
        </div>
        <div>
          <dt>Delivery fee</dt>
          <dd>{formatMoney(totals.deliveryFee)}</dd>
        </div>
        <div className="payment-summary__total-row">
          <dt>Estimated total</dt>
          <dd>{formatMoney(totals.total)}</dd>
        </div>
      </dl>

      <section className="payment-summary__block" aria-label="Customer and delivery">
        <Text>
          {customer.fullName} · {customer.email}
        </Text>
        <Text tone="muted">
          {delivery.address}, {delivery.city}, {delivery.region}
        </Text>
        {card.brand !== 'unknown' && card.lastFour ? (
          <Text className="payment-summary__card">
            {cardBrandLabel(card.brand)} ···· {card.lastFour}
          </Text>
        ) : null}
      </section>

      <div className="payment-summary__actions">
        <Button
          type="button"
          variant="secondary"
          disabled={paying}
          onClick={() => dispatch(backToCheckoutForm())}
        >
          Edit details
        </Button>
        <Button
          type="button"
          disabled={paying}
          onClick={() => {
            void dispatch(runPayFlow());
          }}
        >
          Pay
        </Button>
      </div>
    </div>
  );
}
