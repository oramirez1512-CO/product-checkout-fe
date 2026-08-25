import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from './appSlice';

describe('app store', () => {
  it('boots with ready=true', () => {
    const store = configureStore({
      reducer: { app: appReducer },
    });

    expect(store.getState().app.ready).toBe(true);
  });
});
