import { configureStore } from "@reduxjs/toolkit";
import amountReducer from "./slices/amountSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    amount: amountReducer,
    user: userReducer,
  },
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
