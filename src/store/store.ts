import { configureStore } from "@reduxjs/toolkit";
import amountReducer from "./slices/amountSlice";
import userReducer from "./slices/userSlice";
import todayTransactionsReducer from "./slices/todayTransactionsSlice";

export const store = configureStore({
  reducer: {
    amount: amountReducer,
    user: userReducer,
    todayTransactions: todayTransactionsReducer,
  },
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
