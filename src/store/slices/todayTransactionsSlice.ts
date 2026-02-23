import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { clearUserProfile } from "./userSlice";

export type TodayTransaction = {
  _id: string;
  amount: number;
  category: {
    name: string;
    color: string;
    emoji?: string;
  };
  notes?: string;
  occurredAt: string;
  payment_mode: string;
};

interface TodayTransactionsState {
  dateKey: string | null;
  items: TodayTransaction[];
  hiddenCount: number;
  isLoaded: boolean;
}

const initialState: TodayTransactionsState = {
  dateKey: null,
  items: [],
  hiddenCount: 0,
  isLoaded: false,
};

export const getLocalDateKey = (input: string | Date) => {
  const date = input instanceof Date ? input : new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sortByOccurredAtDesc = (list: TodayTransaction[]) => {
  list.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
};

const todayTransactionsSlice = createSlice({
  name: "todayTransactions",
  initialState,
  reducers: {
    setTodayTransactions: (
      state,
      action: PayloadAction<{ dateKey: string; items: TodayTransaction[]; hiddenCount?: number }>
    ) => {
      state.dateKey = action.payload.dateKey;
      state.items = [...action.payload.items];
      sortByOccurredAtDesc(state.items);
      state.hiddenCount = Number(action.payload.hiddenCount || 0);
      state.isLoaded = true;
    },
    addTodayTransaction: (state, action: PayloadAction<{ dateKey: string; item: TodayTransaction }>) => {
      if (state.dateKey !== action.payload.dateKey) return;
      state.items.unshift(action.payload.item);
      sortByOccurredAtDesc(state.items);
      state.isLoaded = true;
    },
    updateTodayTransaction: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<TodayTransaction> }>
    ) => {
      const idx = state.items.findIndex((item) => item._id === action.payload.id);
      if (idx === -1) return;
      state.items[idx] = { ...state.items[idx], ...action.payload.changes };
      sortByOccurredAtDesc(state.items);
    },
    hideTodayTransaction: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex((item) => item._id === action.payload);
      if (idx === -1) return;
      state.items.splice(idx, 1);
      state.hiddenCount += 1;
    },
    restoreTodayTransaction: (state, action: PayloadAction<{ dateKey: string; item: TodayTransaction }>) => {
      if (state.dateKey !== action.payload.dateKey) return;
      const alreadyPresent = state.items.some((item) => item._id === action.payload.item._id);
      if (!alreadyPresent) {
        state.items.push(action.payload.item);
        sortByOccurredAtDesc(state.items);
      }
      state.hiddenCount = Math.max(0, state.hiddenCount - 1);
    },
    clearTodayTransactions: (state) => {
      state.dateKey = null;
      state.items = [];
      state.hiddenCount = 0;
      state.isLoaded = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearUserProfile, () => initialState);
  },
});

export const {
  setTodayTransactions,
  addTodayTransaction,
  updateTodayTransaction,
  hideTodayTransaction,
  restoreTodayTransaction,
  clearTodayTransactions,
} = todayTransactionsSlice.actions;

export default todayTransactionsSlice.reducer;
