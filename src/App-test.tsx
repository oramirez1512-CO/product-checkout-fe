import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import { App } from '@/App';
import * as productApi from '@/features/product/api';

jest.mock('@/features/product/api', () => ({
  listProducts: jest.fn(),
  getProduct: jest.fn(),
}));

describe('App routes', () => {
  it('renders product catalog on /', async () => {
    // Arrange
    (productApi.listProducts as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(
      [],
    );

    // Act
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    // Assert
    expect(await screen.findByText('Catalog')).toBeTruthy();
  });

  it('renders foundation status page on /status', async () => {
    // Act
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/status']}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    // Assert
    expect(await screen.findByRole('heading', { name: 'Product checkout' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ping API' })).toBeTruthy();
  });
});
