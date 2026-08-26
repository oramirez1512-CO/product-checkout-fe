import {
  DEFAULT_BASE_FEE,
  DEFAULT_CURRENCY,
  DEFAULT_DELIVERY_FEE,
  resolveFeesDisplay,
  type FeesDisplayConfig,
} from './fees';

export type AppEnv = {
  apiUrl: string;
  apiKey: string | null;
  fees: FeesDisplayConfig;
};

export type EnvBag = {
  VITE_API_URL?: string;
  VITE_API_KEY?: string;
  VITE_BASE_FEE?: string;
  VITE_DELIVERY_FEE?: string;
  VITE_CURRENCY?: string;
};

let injectedEnv: EnvBag | null = null;

/** Call once from app bootstrap with Vite `import.meta.env`. */
export function injectAppEnv(env: EnvBag): void {
  injectedEnv = env;
}

function processEnvBag(): EnvBag {
  return {
    VITE_API_URL: process.env.VITE_API_URL,
    VITE_API_KEY: process.env.VITE_API_KEY,
    VITE_BASE_FEE: process.env.VITE_BASE_FEE,
    VITE_DELIVERY_FEE: process.env.VITE_DELIVERY_FEE,
    VITE_CURRENCY: process.env.VITE_CURRENCY,
  };
}

export function getAppEnv(env?: EnvBag): AppEnv {
  const source = env ?? injectedEnv ?? processEnvBag();
  const apiUrl = (source.VITE_API_URL?.trim() || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const apiKey = source.VITE_API_KEY?.trim() || null;

  return {
    apiUrl,
    apiKey,
    fees: resolveFeesDisplay(source),
  };
}

export const appEnvDefaults = {
  baseFee: DEFAULT_BASE_FEE,
  deliveryFee: DEFAULT_DELIVERY_FEE,
  currency: DEFAULT_CURRENCY,
} as const;
