import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AmountState {
  hideAmounts: boolean;
}

const initialState: AmountState = {
  hideAmounts: localStorage.getItem("hideAmounts") === "true",
};

const amountSlice = createSlice({
  name: "amount",
  initialState,
  reducers: {
    setHideAmounts: (state, action: PayloadAction<boolean>) => {
      state.hideAmounts = action.payload;
      localStorage.setItem("hideAmounts", String(action.payload));
    },
    toggleHideAmounts: (state) => {
      state.hideAmounts = !state.hideAmounts;
      localStorage.setItem("hideAmounts", String(state.hideAmounts));
    },
  },
});

export const { setHideAmounts, toggleHideAmounts } = amountSlice.actions;
export default amountSlice.reducer;
