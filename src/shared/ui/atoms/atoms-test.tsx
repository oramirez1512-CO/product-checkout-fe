import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button, Input, Text } from './index';

describe('atoms', () => {
  it('Button renders variants and handles click', () => {
    // Arrange
    const onClick = jest.fn();
    render(
      <Button variant="secondary" onClick={onClick}>
        Go
      </Button>,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));

    // Assert
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole('button').className).toContain('btn--secondary');
  });

  it('Input forwards value changes', () => {
    // Arrange
    const onChange = jest.fn();
    render(<Input aria-label="email" onChange={onChange} />);

    // Act
    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'a@b.co' },
    });

    // Assert
    expect(onChange).toHaveBeenCalled();
  });

  it('Text supports tones and tags', () => {
    // Act
    render(
      <Text as="h1" tone="danger">
        Boom
      </Text>,
    );

    // Assert
    const el = screen.getByText('Boom');
    expect(el.tagName).toBe('H1');
    expect(el.className).toContain('text--danger');
  });
});
