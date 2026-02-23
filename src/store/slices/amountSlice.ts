import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AmountState {
  hideAmounts: boolean;
}

const initialState: AmountState = {
  hideAmounts: false,
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
});

export const { setHideAmounts, toggleHideAmounts } = amountSlice.actions;
export default amountSlice.reducer;
