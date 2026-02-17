import { configureStore } from "@reduxjs/toolkit";
import amountReducer from "./slices/amountSlice";
import privacyReducer from "./slices/privacySlice";

export const store = configureStore({
  reducer: {
    amount: amountReducer,
    privacy: privacyReducer,
  },
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
