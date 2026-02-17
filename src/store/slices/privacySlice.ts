import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface PrivacyState {
  isPublic: boolean;
}

const initialState: PrivacyState = {
  isPublic: localStorage.getItem("isPublic") !== "false",
};

const privacySlice = createSlice({
  name: "privacy",
  initialState,
  reducers: {
    setIsPublic: (state, action: PayloadAction<boolean>) => {
      state.isPublic = action.payload;
      localStorage.setItem("isPublic", String(action.payload));
    },
  },
});

export const { setIsPublic } = privacySlice.actions;
export default privacySlice.reducer;
