import type { InputHTMLAttributes, ReactNode } from 'react';
import { Input, Text } from '@/shared/ui/atoms';

export type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

export function FormField({ id, label, error, hint, inputProps }: FormFieldProps) {
  const describedBy = [
    error ? `${id}-error` : null,
    hint ? `${id}-hint` : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={error ? 'input--error' : undefined}
        {...inputProps}
      />
      {hint ? (
        <Text as="span" tone="muted" className="form-field__hint" id={`${id}-hint`}>
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text
          as="span"
          tone="danger"
          className="form-field__error"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </Text>
      ) : null}
    </div>
  );
}
