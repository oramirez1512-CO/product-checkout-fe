import { describe, expect, it } from '@jest/globals';
import { getAppEnv, injectAppEnv } from './env';

describe('getAppEnv', () => {
  it('normalizes apiUrl and reads apiKey', () => {
    // Arrange
    injectAppEnv({
      VITE_API_URL: 'https://api.example.com/',
      VITE_API_KEY: ' secret ',
      VITE_BASE_FEE: '3500',
      VITE_DELIVERY_FEE: '10000',
      VITE_CURRENCY: 'COP',
    });

    // Act
    const env = getAppEnv();

    // Assert
    expect(env.apiUrl).toBe('https://api.example.com');
    expect(env.apiKey).toBe('secret');
    expect(env.fees.currency).toBe('COP');
  });

  it('defaults apiUrl when missing', () => {
    // Arrange / Act / Assert
    expect(getAppEnv({}).apiUrl).toBe('http://localhost:3000');
    expect(getAppEnv({}).apiKey).toBeNull();
  });
});
