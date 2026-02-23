import { configureStore } from "@reduxjs/toolkit";
import amountReducer from "./slices/amountSlice";
import userReducer from "./slices/userSlice";
import todayTransactionsReducer from "./slices/todayTransactionsSlice";
import notificationsReducer from "./slices/notificationsSlice";
import monthlyTransactionsReducer from "./slices/monthlyTransactionsSlice";

export const store = configureStore({
  reducer: {
    amount: amountReducer,
    user: userReducer,
    todayTransactions: todayTransactionsReducer,
    notifications: notificationsReducer,
    monthlyTransactions: monthlyTransactionsReducer,
  },
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
