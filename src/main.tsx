import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import { App } from './App';
import { injectAppEnv } from './shared/config/env';
import './styles.css';

injectAppEnv({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_API_KEY: import.meta.env.VITE_API_KEY,
  VITE_BASE_FEE: import.meta.env.VITE_BASE_FEE,
  VITE_DELIVERY_FEE: import.meta.env.VITE_DELIVERY_FEE,
  VITE_CURRENCY: import.meta.env.VITE_CURRENCY,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
