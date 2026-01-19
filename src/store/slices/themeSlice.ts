import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
}

// Get initial theme from localStorage or default to "dark"
const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }
  return "dark";
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

// Helper to get effective theme (resolves "system" to actual theme)
export const getEffectiveTheme = (mode: ThemeMode): "light" | "dark" => {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
};

// Apply theme to document
export const applyTheme = (mode: ThemeMode) => {
  const effectiveTheme = getEffectiveTheme(mode);
  document.documentElement.setAttribute("data-theme", effectiveTheme);
  
  // Also set meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", effectiveTheme === "dark" ? "#000000" : "#ffffff");
  }
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem("theme", action.payload);
      applyTheme(action.payload);
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
