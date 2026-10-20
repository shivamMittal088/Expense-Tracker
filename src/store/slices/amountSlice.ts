import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { clearUserProfile, setUserProfile } from "./userSlice";

interface AmountState {
  hideAmounts: boolean;
}

const initialState: AmountState = {
  // Keep values private until the saved preference has been hydrated.
  hideAmounts: true,
};

const amountSlice = createSlice({
  name: "amount",
  initialState,
  reducers: {
    setHideAmounts: (state, action: PayloadAction<boolean>) => {
      state.hideAmounts = action.payload;
    },
    toggleHideAmounts: (state) => {
      state.hideAmounts = !state.hideAmounts;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearUserProfile, () => initialState);
    builder.addCase(setUserProfile, () => initialState);
  },
});

export const { setHideAmounts, toggleHideAmounts } = amountSlice.actions;
export default amountSlice.reducer;
