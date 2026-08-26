import type { ReactNode } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { closeCheckout } from '../checkoutSlice';

export type CheckoutModalProps = {
  open: boolean;
  children: ReactNode;
};

export function CheckoutModal({ open, children }: CheckoutModalProps) {
  const dispatch = useAppDispatch();

  if (!open) {
    return null;
  }

  return (
    <div className="checkout-modal" role="presentation">
      <button
        type="button"
        className="checkout-modal__backdrop"
        aria-label="Close checkout"
        onClick={() => dispatch(closeCheckout())}
      />
      <div
        className="checkout-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-dialog-title"
      >
        {children}
      </div>
    </div>
  );
}
