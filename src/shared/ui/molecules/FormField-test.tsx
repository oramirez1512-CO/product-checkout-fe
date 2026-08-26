import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('links label and shows error alert', () => {
    // Act
    render(
      <FormField
        id="email"
        label="Email"
        error="Enter a valid email"
        hint="We send the receipt here"
        inputProps={{ name: 'email' }}
      />,
    );

    // Assert
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/valid email/);
    expect(screen.getByText(/receipt/)).toBeTruthy();
  });

  it('forwards input changes', () => {
    // Arrange
    const onChange = jest.fn();
    render(
      <FormField
        id="name"
        label="Name"
        inputProps={{ onChange, value: '' }}
      />,
    );

    // Act
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ada' },
    });

    // Assert
    expect(onChange).toHaveBeenCalled();
  });
});
