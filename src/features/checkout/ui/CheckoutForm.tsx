import { useMemo, useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Text } from '@/shared/ui/atoms';
import { FormField } from '@/shared/ui/molecules/FormField';
import {
  cardBrandLabel,
  detectCardBrand,
  formatCardNumberGroups,
  hasCheckoutErrors,
  validateCheckoutDraft,
  type CheckoutDraft,
  type CheckoutFieldErrors,
} from '@/shared/validators';
import {
  closeCheckout,
  selectCheckoutDraft,
  submitCheckoutDraft,
} from '../checkoutSlice';

const emptyErrors = (): CheckoutFieldErrors => ({
  customer: {},
  delivery: {},
  card: {},
});

export function CheckoutForm() {
  const dispatch = useAppDispatch();
  const stored = useAppSelector(selectCheckoutDraft);
  const step = useAppSelector((s) => s.checkout.step);
  const brandStored = useAppSelector((s) => s.checkout.card.brand);
  const lastFour = useAppSelector((s) => s.checkout.card.lastFour);

  const [draft, setDraft] = useState<CheckoutDraft>(stored);
  const [errors, setErrors] = useState<CheckoutFieldErrors>(emptyErrors);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const liveBrand = useMemo(
    () => detectCardBrand(draft.card.number),
    [draft.card.number],
  );
  const brandHint = cardBrandLabel(liveBrand);

  function patchCustomer(partial: Partial<CheckoutDraft['customer']>) {
    setDraft((prev) => ({
      ...prev,
      customer: { ...prev.customer, ...partial },
    }));
  }

  function patchDelivery(partial: Partial<CheckoutDraft['delivery']>) {
    setDraft((prev) => ({
      ...prev,
      delivery: { ...prev.delivery, ...partial },
    }));
  }

  function patchCard(partial: Partial<CheckoutDraft['card']>) {
    setDraft((prev) => ({
      ...prev,
      card: { ...prev.card, ...partial },
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmittedOnce(true);
    const nextErrors = validateCheckoutDraft(draft);
    setErrors(nextErrors);
    if (hasCheckoutErrors(nextErrors)) {
      return;
    }
    dispatch(submitCheckoutDraft(draft));
  }

  function handleCancel() {
    dispatch(closeCheckout());
  }

  if (step === 'ready') {
    return (
      <div className="checkout-form checkout-form--ready" role="status">
        <Text as="h2" id="checkout-dialog-title" className="checkout-form__title">
          Details saved
        </Text>
        <Text tone="muted">
          Customer, delivery, and card draft are ready. Payment summary comes
          next.
        </Text>
        {brandStored !== 'unknown' && lastFour ? (
          <Text className="checkout-form__brand">
            {cardBrandLabel(brandStored)} ···· {lastFour}
          </Text>
        ) : null}
        <div className="checkout-form__actions">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit} noValidate>
      <header className="checkout-form__header">
        <Text as="h2" id="checkout-dialog-title" className="checkout-form__title">
          Checkout
        </Text>
        <Text tone="muted">
          Enter customer, delivery, and card details. Nothing is charged yet.
        </Text>
      </header>

      <fieldset className="checkout-form__section">
        <legend>Customer</legend>
        <FormField
          id="checkout-fullName"
          label="Full name"
          error={submittedOnce ? errors.customer.fullName : undefined}
          inputProps={{
            name: 'fullName',
            autoComplete: 'name',
            value: draft.customer.fullName,
            onChange: (e) => patchCustomer({ fullName: e.target.value }),
          }}
        />
        <FormField
          id="checkout-email"
          label="Email"
          error={submittedOnce ? errors.customer.email : undefined}
          inputProps={{
            name: 'email',
            type: 'email',
            autoComplete: 'email',
            value: draft.customer.email,
            onChange: (e) => patchCustomer({ email: e.target.value }),
          }}
        />
        <FormField
          id="checkout-phone"
          label="Phone (optional)"
          error={submittedOnce ? errors.customer.phone : undefined}
          inputProps={{
            name: 'phone',
            type: 'tel',
            autoComplete: 'tel',
            value: draft.customer.phone,
            onChange: (e) => patchCustomer({ phone: e.target.value }),
          }}
        />
      </fieldset>

      <fieldset className="checkout-form__section">
        <legend>Delivery</legend>
        <FormField
          id="checkout-address"
          label="Address"
          error={submittedOnce ? errors.delivery.address : undefined}
          inputProps={{
            name: 'address',
            autoComplete: 'street-address',
            value: draft.delivery.address,
            onChange: (e) => patchDelivery({ address: e.target.value }),
          }}
        />
        <FormField
          id="checkout-city"
          label="City"
          error={submittedOnce ? errors.delivery.city : undefined}
          inputProps={{
            name: 'city',
            autoComplete: 'address-level2',
            value: draft.delivery.city,
            onChange: (e) => patchDelivery({ city: e.target.value }),
          }}
        />
        <FormField
          id="checkout-region"
          label="Region"
          error={submittedOnce ? errors.delivery.region : undefined}
          inputProps={{
            name: 'region',
            autoComplete: 'address-level1',
            value: draft.delivery.region,
            onChange: (e) => patchDelivery({ region: e.target.value }),
          }}
        />
        <FormField
          id="checkout-postalCode"
          label="Postal code (optional)"
          error={submittedOnce ? errors.delivery.postalCode : undefined}
          inputProps={{
            name: 'postalCode',
            autoComplete: 'postal-code',
            value: draft.delivery.postalCode,
            onChange: (e) => patchDelivery({ postalCode: e.target.value }),
          }}
        />
      </fieldset>

      <fieldset className="checkout-form__section">
        <legend>Card</legend>
        <FormField
          id="checkout-cardNumber"
          label="Card number"
          error={submittedOnce ? errors.card.number : undefined}
          hint={brandHint || 'Visa or Mastercard'}
          inputProps={{
            name: 'cardNumber',
            inputMode: 'numeric',
            autoComplete: 'cc-number',
            placeholder: '4242 4242 4242 4242',
            value: formatCardNumberGroups(draft.card.number),
            onChange: (e) => patchCard({ number: e.target.value }),
          }}
        />
        <FormField
          id="checkout-cardHolder"
          label="Cardholder"
          error={submittedOnce ? errors.card.cardHolder : undefined}
          inputProps={{
            name: 'cardHolder',
            autoComplete: 'cc-name',
            value: draft.card.cardHolder,
            onChange: (e) => patchCard({ cardHolder: e.target.value }),
          }}
        />
        <div className="checkout-form__row">
          <FormField
            id="checkout-expMonth"
            label="Month"
            error={submittedOnce ? errors.card.expMonth : undefined}
            inputProps={{
              name: 'expMonth',
              inputMode: 'numeric',
              autoComplete: 'cc-exp-month',
              placeholder: 'MM',
              maxLength: 2,
              value: draft.card.expMonth,
              onChange: (e) => patchCard({ expMonth: e.target.value }),
            }}
          />
          <FormField
            id="checkout-expYear"
            label="Year"
            error={submittedOnce ? errors.card.expYear : undefined}
            inputProps={{
              name: 'expYear',
              inputMode: 'numeric',
              autoComplete: 'cc-exp-year',
              placeholder: 'YYYY',
              maxLength: 4,
              value: draft.card.expYear,
              onChange: (e) => patchCard({ expYear: e.target.value }),
            }}
          />
          <FormField
            id="checkout-cvc"
            label="CVC"
            error={submittedOnce ? errors.card.cvc : undefined}
            inputProps={{
              name: 'cvc',
              inputMode: 'numeric',
              autoComplete: 'cc-csc',
              placeholder: '123',
              maxLength: 4,
              value: draft.card.cvc,
              onChange: (e) => patchCard({ cvc: e.target.value }),
            }}
          />
        </div>
      </fieldset>

      <div className="checkout-form__actions">
        <Button type="button" variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit">Save details</Button>
      </div>
    </form>
  );
}
