/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BASE_FEE: string;
  readonly VITE_DELIVERY_FEE: string;
  readonly VITE_CURRENCY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
