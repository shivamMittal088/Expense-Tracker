import { configureStore } from "@reduxjs/toolkit";
import amountReducer from "./slices/amountSlice";

export const store = configureStore({
  reducer: {
    amount: amountReducer,
  },
});

// Apply dark theme on app load
document.documentElement.setAttribute("data-theme", "dark");
const metaTheme = document.querySelector('meta[name="theme-color"]');
if (metaTheme) {
  metaTheme.setAttribute("content", "#000000");
}

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
