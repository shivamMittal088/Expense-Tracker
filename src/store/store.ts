import { configureStore } from "@reduxjs/toolkit";
import amountReducer from "./slices/amountSlice";
import userReducer from "./slices/userSlice";
import todayTransactionsReducer from "./slices/todayTransactionsSlice";
import monthlyTransactionsReducer from "./slices/monthlyTransactionsSlice";
import themeReducer from "./slices/themeSlice";

export const store = configureStore({
  reducer: {
    amount: amountReducer,
    user: userReducer,
    todayTransactions: todayTransactionsReducer,
    monthlyTransactions: monthlyTransactionsReducer,
    theme: themeReducer,
  },
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
