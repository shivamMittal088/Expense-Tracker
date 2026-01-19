import { configureStore } from "@reduxjs/toolkit";
import amountReducer from "./slices/amountSlice";
import themeReducer, { applyTheme } from "./slices/themeSlice";

export const store = configureStore({
  reducer: {
    amount: amountReducer,
    theme: themeReducer,
  },
});

// Apply theme on app load
applyTheme(store.getState().theme.mode);

// Listen for system theme changes when mode is "system"
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (store.getState().theme.mode === "system") {
    applyTheme("system");
  }
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
