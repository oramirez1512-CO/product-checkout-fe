/** @type {import('jest').Config} */
export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
  moduleNameMapper: {
    '\\.(css|less)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
        },
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx'],
};
