import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { formatMoney } from '@/shared/lib/money';
import { Button, Text } from '@/shared/ui/atoms';
import { fetchProducts } from '@/features/product/productSlice';
import {
  backToSummary,
  closeCheckout,
  resetCheckout,
} from '../checkoutSlice';

export function PaymentResult() {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector((s) => s.checkout.transaction);
  const payError = useAppSelector((s) => s.checkout.payError);

  const status = transaction?.status ?? (payError ? 'ERROR' : 'ERROR');
  const isApproved = status === 'APPROVED';
  const isDeclined = status === 'DECLINED';

  let title = 'Payment error';
  let tone: 'default' | 'danger' | 'muted' = 'danger';
  let message = payError ?? 'Something went wrong while processing payment.';

  if (isApproved) {
    title = 'Payment approved';
    tone = 'default';
    message = 'Your payment was approved. Stock will refresh on the product page.';
  } else if (isDeclined) {
    title = 'Payment declined';
    tone = 'danger';
    message = 'The provider declined this card. You can try again from the summary.';
  } else if (transaction && !payError) {
    title = `Payment ${status}`;
    tone = 'danger';
    message = 'The transaction finished with a non-approved status.';
  }

  async function handleBackToProduct() {
    dispatch(resetCheckout());
    await dispatch(fetchProducts());
  }

  function handleTryAgain() {
    dispatch(backToSummary());
  }

  function handleClose() {
    dispatch(closeCheckout());
  }

  return (
    <div
      className={[
        'payment-result',
        isApproved ? 'payment-result--ok' : 'payment-result--bad',
      ].join(' ')}
      role="status"
    >
      <Text as="h2" id="checkout-dialog-title" className="payment-result__title">
        {title}
      </Text>
      <Text tone={tone === 'danger' ? 'danger' : 'muted'}>{message}</Text>

      {transaction ? (
        <dl className="payment-result__meta">
          <div>
            <dt>Status</dt>
            <dd>{transaction.status}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>{transaction.reference}</dd>
          </div>
          <div>
            <dt>Total charged</dt>
            <dd>{formatMoney(transaction.total, transaction.currency)}</dd>
          </div>
          {transaction.cardLastFour ? (
            <div>
              <dt>Card</dt>
              <dd>
                {transaction.cardBrand ?? 'CARD'} ···· {transaction.cardLastFour}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="payment-result__actions">
        {isApproved ? (
          <Button type="button" onClick={() => void handleBackToProduct()}>
            Back to product
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button type="button" onClick={handleTryAgain}>
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
