import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from './appSlice';

describe('app store', () => {
  it('boots with ready=true', () => {
    // Arrange
    const store = configureStore({
      reducer: { app: appReducer },
    });

    // Assert
    expect(store.getState().app.ready).toBe(true);
  });
});
